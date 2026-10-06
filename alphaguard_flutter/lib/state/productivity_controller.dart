import 'package:flutter/foundation.dart';

import '../data/api/api_exception.dart';
import '../data/models/achievement.dart';
import '../data/models/ai_report.dart';
import '../data/models/reward.dart';
import '../data/models/streak.dart';
import '../data/repositories/productivity_repository.dart';
import '../services/socket/socket_events.dart';
import '../services/socket/socket_service.dart';

/// Owns the gamification + AI analytics for the active child: streaks,
/// achievements, rewards and the latest AI report. Stays live over Socket.IO
/// (streak:updated / achievement:unlocked / reward:upserted).
class ProductivityController extends ChangeNotifier {
  ProductivityController({required ProductivityRepository repo, required SocketService socket, required this.childId})
      : _repo = repo,
        _socket = socket;

  final ProductivityRepository _repo;
  final SocketService _socket;
  final String childId;

  final List<void Function()> _disposers = [];

  List<Streak> streaks = const [];
  List<Achievement> achievements = const [];
  List<Reward> rewards = const [];
  AiReport? report;

  bool loading = true;
  String? error;
  String period = 'weekly';
  bool reportBusy = false;

  Future<void> load() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      final res = await Future.wait([
        _repo.streaks(childId),
        _repo.achievements(childId),
        _repo.rewards(childId: childId),
      ]);
      streaks = res[0] as List<Streak>;
      achievements = res[1] as List<Achievement>;
      rewards = res[2] as List<Reward>;
    } on ApiException catch (e) {
      error = e.message;
    } catch (_) {
      error = 'Could not load insights.';
    } finally {
      loading = false;
      notifyListeners();
    }
    _subscribe();
    generate();
  }

  void _subscribe() {
    if (_disposers.isNotEmpty) return;
    _disposers.add(_socket.on(SocketEvents.streakUpdated, (data) {
      final s = Streak.fromJson(Map<String, dynamic>.from(data as Map));
      final i = streaks.indexWhere((x) => x.kind == s.kind);
      streaks = i == -1 ? [...streaks, s] : ([...streaks]..[i] = s);
      notifyListeners();
    }));
    _disposers.add(_socket.on(SocketEvents.achievementUnlocked, (data) {
      final a = Achievement.fromJson(Map<String, dynamic>.from(data as Map));
      if (achievements.any((x) => x.id == a.id)) return;
      achievements = [a, ...achievements];
      notifyListeners();
    }));
    _disposers.add(_socket.on(SocketEvents.rewardUpserted, (data) {
      final r = Reward.fromJson(Map<String, dynamic>.from(data as Map));
      if (r.childId != childId) return;
      final i = rewards.indexWhere((x) => x.id == r.id);
      rewards = i == -1 ? [...rewards, r] : ([...rewards]..[i] = r);
      notifyListeners();
    }));
  }

  Future<void> setPeriod(String p) async {
    if (p == period) return;
    period = p;
    notifyListeners();
    await generate();
  }

  /// (Re)generate the AI report from real activity. Deterministic server-side.
  Future<void> generate() async {
    reportBusy = true;
    notifyListeners();
    try {
      report = await _repo.generateReport(childId, period);
    } catch (_) {/* keep last report */}
    finally {
      reportBusy = false;
      notifyListeners();
    }
  }

  Streak? get taskStreak {
    for (final s in streaks) {
      if (s.kind == 'task_completion') return s;
    }
    return null;
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
