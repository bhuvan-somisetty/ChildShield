import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

import '../../data/repositories/safety_repository.dart';

/// Runs on the CHILD device: streams GPS and pushes it to the backend
/// (`POST /location`), which fans it out to the parent + runs geofencing. Used
/// for Family Radar, safe-zone alerts and SOS location. Requests permission once.
class ChildLocationService {
  ChildLocationService(this._repo);
  final SafetyRepository _repo;

  StreamSubscription<Position>? _sub;
  bool _running = false;

  Future<void> start() async {
    if (_running) return;
    _running = true;
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied) {
        _running = false;
        // Notify the backend that location was denied.
        await _repo.reportLocationDisabled(revoked: false).catchError((_) {});
        return;
      }
      if (permission == LocationPermission.deniedForever) {
        _running = false;
        await _repo.reportLocationDisabled(revoked: true).catchError((_) {});
        return;
      }
      // Push an immediate fix, then stream on meaningful movement.
      try {
        final pos = await Geolocator.getCurrentPosition();
        await _push(pos);
      } catch (_) {/* ignore */}
      _sub = Geolocator.getPositionStream(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, distanceFilter: 25),
      ).listen(_push);
    } catch (e) {
      if (kDebugMode) debugPrint('[location] start failed: $e');
      _running = false;
    }
  }

  Future<void> _push(Position p) async {
    try {
      // Include speed when plausible (> 0.5 m/s ≈ 2 km/h to filter GPS noise).
      final speed = p.speed > 0.5 ? p.speed : null;
      await _repo.pushLocation(p.latitude, p.longitude, accuracy: p.accuracy, speed: speed);
    } catch (_) {/* offline — next fix retries */}
  }

  void stop() {
    _sub?.cancel();
    _sub = null;
    _running = false;
  }
}
