import 'package:flutter/foundation.dart';

import '../data/models/target.dart';
import '../data/repositories/target_repository.dart';
import '../services/socket/socket_events.dart';
import '../services/socket/socket_service.dart';

/// Targets/goals for the active child — live over `target:upserted`/`deleted`.
class TargetsController extends ChangeNotifier {
  TargetsController({required TargetRepository repo, required SocketService socket, required this.childId})
      : _repo = repo,
        _socket = socket;

  final TargetRepository _repo;
  final SocketService _socket;
  final String childId;
  final List<void Function()> _disposers = [];

  List<Target> targets = [];
  bool loading = true;
  String? error;

  Future<void> load() async {
    try {
      targets = await _repo.list(childId: childId);
    } catch (_) {
      error = 'Could not load goals.';
    } finally {
      loading = false;
      notifyListeners();
    }
    _subscribe();
  }

  void _subscribe() {
    if (_disposers.isNotEmpty) return;
    _disposers.add(_socket.on(SocketEvents.targetUpserted, (data) {
      final t = Target.fromJson(Map<String, dynamic>.from(data as Map));
      if (t.childId != childId) return;
      final i = targets.indexWhere((x) => x.id == t.id);
      targets = i == -1 ? [...targets, t] : ([...targets]..[i] = t);
      notifyListeners();
    }));
    _disposers.add(_socket.on(SocketEvents.targetDeleted, (data) {
      final id = (data as Map)['id']?.toString();
      if (id == null) return;
      targets = targets.where((t) => t.id != id).toList();
      notifyListeners();
    }));
  }

  void _upsert(Target t) {
    final i = targets.indexWhere((x) => x.id == t.id);
    targets = i == -1 ? [...targets, t] : ([...targets]..[i] = t);
    notifyListeners();
  }

  Future<void> create({required String title, String? description, String? category, String? endDate}) async =>
      _upsert(await _repo.create(childId: childId, title: title, description: description, category: category, endDate: endDate));

  Future<void> edit(String id, Map<String, dynamic> patch) async => _upsert(await _repo.update(id, patch));

  /// Optimistic progress nudge, reconciled by the server (status derives from %).
  Future<void> setProgress(String id, int progress) async {
    final i = targets.indexWhere((t) => t.id == id);
    if (i != -1) {
      targets = [...targets]..[i] = targets[i].copyWith(progress: progress);
      notifyListeners();
    }
    try {
      _upsert(await _repo.update(id, {'progress': progress}));
    } catch (_) {
      load();
    }
  }

  Future<void> remove(String id) async {
    await _repo.delete(id);
    targets = targets.where((t) => t.id != id).toList();
    notifyListeners();
  }

  Future<List<TargetHistoryEntry>> history(String id) => _repo.history(id);

  @override
  void dispose() {
    for (final d in _disposers) {
      d();
    }
    _disposers.clear();
    super.dispose();
  }
}
