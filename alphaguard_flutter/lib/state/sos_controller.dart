import 'package:flutter/foundation.dart';

import '../data/models/safety.dart';
import '../data/repositories/safety_repository.dart';
import '../services/socket/socket_events.dart';
import '../services/socket/socket_service.dart';

/// Parent SOS state — emergency events, live over `sos:alert` / `sos:resolved`.
class SosController extends ChangeNotifier {
  SosController({required SafetyRepository repo, required SocketService socket})
      : _repo = repo,
        _socket = socket;

  final SafetyRepository _repo;
  final SocketService _socket;
  final List<void Function()> _disposers = [];

  List<SosEvent> events = [];
  bool loading = true;
  String? error;

  Future<void> load() async {
    try {
      events = await _repo.sosList();
    } catch (_) {
      error = 'Could not load SOS events.';
    } finally {
      loading = false;
      notifyListeners();
    }
    _subscribe();
  }

  void _subscribe() {
    if (_disposers.isNotEmpty) return;
    _disposers.add(_socket.on(SocketEvents.sosAlert, (data) {
      final e = SosEvent.fromJson(Map<String, dynamic>.from(data as Map));
      if (events.any((x) => x.id == e.id)) return;
      events = [e, ...events];
      notifyListeners();
    }));
    _disposers.add(_socket.on(SocketEvents.sosResolved, (data) => _markResolved((data as Map)['id']?.toString())));
  }

  void _markResolved(String? id) {
    if (id == null) return;
    final i = events.indexWhere((e) => e.id == id);
    if (i != -1) {
      final e = events[i];
      events = [...events]..[i] = SosEvent(id: e.id, at: e.at, status: 'resolved', lat: e.lat, lng: e.lng);
      notifyListeners();
    }
  }

  Future<void> resolve(String id) async {
    await _repo.resolveSos(id);
    _markResolved(id);
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
