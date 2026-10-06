import '../api/api_client.dart';
import '../models/reward.dart';
import '../models/target.dart';

/// Targets/goals + reward status updates.
class TargetRepository {
  TargetRepository(this._api);
  final ApiClient _api;

  Future<List<Target>> list({String? childId}) async {
    final r = await _api.get('/targets', query: childId != null ? {'childId': childId} : null) as Map<String, dynamic>;
    return (r['targets'] as List).map((e) => Target.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Target> create({required String childId, required String title, String? description, String? category, String? endDate}) async {
    final r = await _api.post('/targets', body: {
      'childId': childId,
      'title': title,
      if (description != null) 'description': description,
      if (category != null) 'category': category,
      if (endDate != null) 'endDate': endDate,
    }) as Map<String, dynamic>;
    return Target.fromJson(r['target'] as Map<String, dynamic>);
  }

  Future<Target> update(String id, Map<String, dynamic> patch) async {
    final r = await _api.patch('/targets/$id', body: patch) as Map<String, dynamic>;
    return Target.fromJson(r['target'] as Map<String, dynamic>);
  }

  Future<void> delete(String id) => _api.delete('/targets/$id');

  Future<List<TargetHistoryEntry>> history(String id) async {
    final r = await _api.get('/targets/$id/history') as Map<String, dynamic>;
    return (r['history'] as List).map((e) => TargetHistoryEntry.fromJson(e as Map<String, dynamic>)).toList();
  }

  // Reward status management (parent: pending → unlocked → delivered).
  Future<Reward> updateReward(String id, String status) async {
    final r = await _api.patch('/rewards/$id', body: {'status': status}) as Map<String, dynamic>;
    return Reward.fromJson(r['reward'] as Map<String, dynamic>);
  }

  // Child acknowledges a promise (server accepts only `childAcknowledged` from a child).
  Future<Reward> acknowledgeReward(String id) async {
    final r = await _api.patch('/rewards/$id', body: {'childAcknowledged': true}) as Map<String, dynamic>;
    return Reward.fromJson(r['reward'] as Map<String, dynamic>);
  }
}
