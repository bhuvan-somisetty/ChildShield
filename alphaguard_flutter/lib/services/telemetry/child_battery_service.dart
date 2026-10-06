import 'dart:async';

import 'package:battery_plus/battery_plus.dart';
import 'package:flutter/foundation.dart';

import '../../data/repositories/safety_repository.dart';
import '../socket/socket_service.dart';

/// Reads the device battery level and charging state, then pushes to the
/// backend (REST + socket) so the parent sees live data on their dashboard.
/// Reports immediately on start, then every 60 s and on any state change.
class ChildBatteryService {
  ChildBatteryService(this._safety, this._socket);
  final SafetyRepository _safety;
  final SocketService _socket;

  final Battery _battery = Battery();
  Timer? _timer;
  StreamSubscription<BatteryState>? _stateSub;
  bool _running = false;

  Future<void> start() async {
    if (_running) return;
    _running = true;
    await _report();
    _timer = Timer.periodic(const Duration(seconds: 60), (_) => _report());
    _stateSub = _battery.onBatteryStateChanged.listen((_) => _report());
  }

  Future<void> _report() async {
    try {
      final level = await _battery.batteryLevel;
      final state = await _battery.batteryState;
      final charging = state == BatteryState.charging || state == BatteryState.full;
      // Socket path: near-instant (used while connected).
      _socket.emit('battery:update', {'level': level, 'charging': charging});
      // REST path: persists to DB so parent sees data on next load.
      await _safety.pushBattery(level, charging: charging);
    } catch (e) {
      if (kDebugMode) debugPrint('[battery] report failed: $e');
    }
  }

  void stop() {
    _timer?.cancel();
    _stateSub?.cancel();
    _timer = null;
    _stateSub = null;
    _running = false;
  }
}
