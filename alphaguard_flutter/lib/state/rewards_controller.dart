import 'package:flutter/foundation.dart';

import '../data/models/reward.dart';
import '../data/repositories/productivity_repository.dart';
import '../data/repositories/target_repository.dart';
import '../services/socket/socket_events.dart';
import '../services/socket/socket_service.dart';

/// Rewards/promises for the active child — listing, status (pending → unlocked →
/// delivered), live over `reward:upserted`.
class RewardsController extends ChangeNotifier {
  RewardsController({required ProductivityRepository repo, required TargetRepository targetRepo, required SocketService socket, required this.childId})
      : _repo = repo,
        _targetRepo = targetRepo,
        _socket = socket;

  final ProductivityRepository _repo;
  final TargetRepository _targetRepo;
  final SocketService _socket;
  final String childId;
  final List<void Function()> _disposers = [];

  List<Reward> rewards = [];
  bool loading = true;
  String? error;

  Future<void> load() async {
    try {
      rewards = await _repo.rewards(childId: childId);
    } catch (_) {
      error = 'Could not load rewards.';
    } finally {
      loading = false;
      notifyListeners();
    }
    _subscribe();
  }

  void _subscribe() {
    if (_disposers.isNotEmpty) return;
    _disposers.add(_socket.on(SocketEvents.rewardUpserted, (data) {
      final r = Reward.fromJson(Map<String, dynamic>.from(data as Map));
      if (r.childId != childId) return;
      _upsert(r);
    }));
    _disposers.add(_socket.on(SocketEvents.rewardDeleted, (data) {
      final id = (data as Map)['id']?.toString();
      if (id == null) return;
      rewards = rewards.where((x) => x.id != id).toList();
      notifyListeners();
    }));
  }

  void _upsert(Reward r) {
    final i = rewards.indexWhere((x) => x.id == r.id);
    rewards = i == -1 ? [...rewards, r] : ([...rewards]..[i] = r);
    notifyListeners();
  }

  Future<void> setStatus(String id, String status) async => _upsert(await _targetRepo.updateReward(id, status));
  Future<void> acknowledge(String id) async => _upsert(await _targetRepo.acknowledgeReward(id));

  @override
  void dispose() {
    for (final d in _disposers) {
      d();
    }
    _disposers.clear();
    super.dispose();
  }
}
