import 'package:flutter/foundation.dart';

import '../data/models/safety.dart';
import '../data/repositories/safety_repository.dart';
import '../services/socket/socket_events.dart';
import '../services/socket/socket_service.dart';

/// Safe-zone management — create, delete, live `zones:update`.
class SafeZonesController extends ChangeNotifier {
  SafeZonesController({required SafetyRepository repo, required SocketService socket})
      : _repo = repo,
        _socket = socket;

  final SafetyRepository _repo;
  final SocketService _socket;
  final List<void Function()> _disposers = [];

  List<SafeZone> zones = [];
  bool loading = true;
  String? error;

  Future<void> load() async {
    try {
      zones = await _repo.zones();
    } catch (_) {
      error = 'Could not load safe zones.';
    } finally {
      loading = false;
      notifyListeners();
    }
    _subscribe();
  }

  void _subscribe() {
    if (_disposers.isNotEmpty) return;
    _disposers.add(_socket.on(SocketEvents.zonesUpdate, (data) {
      if (data is! List) return;
      zones = data.map((e) => SafeZone.fromJson(Map<String, dynamic>.from(e as Map))).toList();
      notifyListeners();
    }));
  }

  Future<void> create({required String name, required double lat, required double lng, required double radius}) async {
    final z = await _repo.createZone(name: name, lat: lat, lng: lng, radius: radius);
    if (!zones.any((x) => x.id == z.id)) {
      zones = [...zones, z];
      notifyListeners();
    }
  }

  Future<void> remove(String id) async {
    await _repo.deleteZone(id);
    zones = zones.where((z) => z.id != id).toList();
    notifyListeners();
  }

  @override
  void dispose() {
    for (final d in _disposers) {
      d();
    }
    _disposers.clear();
    super.dispose();
  }
}
