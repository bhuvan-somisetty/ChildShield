import '../api/api_client.dart';
import '../models/achievement.dart';
import '../models/ai_report.dart';
import '../models/reward.dart';
import '../models/streak.dart';

/// Gamification + AI analytics endpoints (streaks, achievements, rewards, AI
/// reports). Read-only consumption of the documented API.
class ProductivityRepository {
  ProductivityRepository(this._api);
  final ApiClient _api;

  Future<List<Streak>> streaks(String childId) async {
    final r = await _api.get('/streaks/$childId') as Map<String, dynamic>;
    return (r['streaks'] as List).map((e) => Streak.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<Achievement>> achievements(String childId) async {
    final r = await _api.get('/achievements/$childId') as Map<String, dynamic>;
    return (r['achievements'] as List).map((e) => Achievement.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<Reward>> rewards({String? childId}) async {
    final r = await _api.get('/rewards', query: childId != null ? {'childId': childId} : null) as Map<String, dynamic>;
    return (r['rewards'] as List).map((e) => Reward.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<AiReport> generateReport(String childId, String period) async {
    final r = await _api.post('/ai/reports', body: {'childId': childId, 'period': period}) as Map<String, dynamic>;
    return AiReport.fromJson(r['report'] as Map<String, dynamic>);
  }
}
