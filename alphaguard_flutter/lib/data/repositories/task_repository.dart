import '../api/api_client.dart';
import '../models/recurring_task.dart';
import '../models/task.dart';
import '../models/task_category.dart';
import '../models/task_comment.dart';
import '../models/task_history.dart';
import '../models/task_proof.dart';

/// Task + productivity-planning endpoints (tasks, proof, approval, comments,
/// history, categories, recurring rules). Consumes the documented API exactly.
class TaskRepository {
  TaskRepository(this._api);
  final ApiClient _api;

  // ── Tasks ──────────────────────────────────────────────────────────────
  Future<List<Task>> list({String? childId, String? category}) async {
    final r = await _api.get('/tasks', query: {
      if (childId != null) 'childId': childId,
      if (category != null) 'category': category,
    }) as Map<String, dynamic>;
    return (r['tasks'] as List).map((e) => Task.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Task> create({
    required String title,
    String? childId,
    String? category,
    String? note,
    String? description,
    String? dueAt,
    bool requireProof = false,
    bool requireApproval = false,
  }) async {
    final r = await _api.post('/tasks', body: {
      'title': title,
      if (childId != null) 'childId': childId,
      if (category != null) 'category': category,
      if (note != null) 'note': note,
      if (description != null) 'description': description,
      if (dueAt != null) 'dueAt': dueAt,
      'requireProof': requireProof,
      'requireApproval': requireApproval,
    }) as Map<String, dynamic>;
    return Task.fromJson(r['task'] as Map<String, dynamic>);
  }

  Future<Task> update(String id, Map<String, dynamic> patch) async {
    final r = await _api.patch('/tasks/$id', body: patch) as Map<String, dynamic>;
    return Task.fromJson(r['task'] as Map<String, dynamic>);
  }

  Future<Task> cycle(String id) async {
    final r = await _api.post('/tasks/$id/cycle') as Map<String, dynamic>;
    return Task.fromJson(r['task'] as Map<String, dynamic>);
  }

  Future<void> delete(String id) => _api.delete('/tasks/$id');

  // ── Approval ───────────────────────────────────────────────────────────
  Future<Task> approve(String id) async {
    final r = await _api.post('/tasks/$id/approve') as Map<String, dynamic>;
    return Task.fromJson(r['task'] as Map<String, dynamic>);
  }

  Future<Task> reject(String id, String comment) async {
    final r = await _api.post('/tasks/$id/reject', body: {'comment': comment}) as Map<String, dynamic>;
    return Task.fromJson(r['task'] as Map<String, dynamic>);
  }

  // ── Photo proof ────────────────────────────────────────────────────────
  Future<Task> uploadProof(String id, {required String dataUrl, String kind = 'photo', String? name}) async {
    final r = await _api.post('/tasks/$id/proof', body: {'kind': kind, 'dataUrl': dataUrl, if (name != null) 'name': name}) as Map<String, dynamic>;
    return Task.fromJson(r['task'] as Map<String, dynamic>);
  }

  Future<List<TaskProof>> proofs(String id) async {
    final r = await _api.get('/tasks/$id/proof') as Map<String, dynamic>;
    return (r['proofs'] as List).map((e) => TaskProof.fromJson(e as Map<String, dynamic>)).toList();
  }

  // ── Comments ───────────────────────────────────────────────────────────
  Future<List<TaskComment>> comments(String id) async {
    final r = await _api.get('/tasks/$id/comments') as Map<String, dynamic>;
    return (r['comments'] as List).map((e) => TaskComment.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<TaskComment>> addComment(String id, String body) async {
    final r = await _api.post('/tasks/$id/comments', body: {'body': body}) as Map<String, dynamic>;
    return (r['comments'] as List).map((e) => TaskComment.fromJson(e as Map<String, dynamic>)).toList();
  }

  // ── History ────────────────────────────────────────────────────────────
  Future<List<TaskHistoryEntry>> history(String id) async {
    final r = await _api.get('/tasks/$id/history') as Map<String, dynamic>;
    return (r['history'] as List).map((e) => TaskHistoryEntry.fromJson(e as Map<String, dynamic>)).toList();
  }

  // ── Categories ─────────────────────────────────────────────────────────
  Future<List<TaskCategory>> categories() async {
    final r = await _api.get('/task-categories') as Map<String, dynamic>;
    return (r['categories'] as List).map((e) => TaskCategory.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<TaskCategory> addCategory(String name, {String? color}) async {
    final r = await _api.post('/task-categories', body: {'name': name, if (color != null) 'color': color}) as Map<String, dynamic>;
    return TaskCategory.fromJson(r['category'] as Map<String, dynamic>);
  }

  // ── Recurring rules ────────────────────────────────────────────────────
  Future<List<RecurringTask>> recurring({String? childId}) async {
    final r = await _api.get('/recurring', query: childId != null ? {'childId': childId} : null) as Map<String, dynamic>;
    return (r['recurring'] as List).map((e) => RecurringTask.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<RecurringTask> createRecurring({
    required String childId,
    required String title,
    required String frequency,
    String? category,
    String? note,
    List<int>? weekdays,
    int? dayOfMonth,
  }) async {
    final r = await _api.post('/recurring', body: {
      'childId': childId,
      'title': title,
      'frequency': frequency,
      if (category != null) 'category': category,
      if (note != null) 'note': note,
      if (weekdays != null) 'weekdays': weekdays,
      if (dayOfMonth != null) 'dayOfMonth': dayOfMonth,
    }) as Map<String, dynamic>;
    return RecurringTask.fromJson(r['recurring'] as Map<String, dynamic>);
  }

  Future<void> deleteRecurring(String id) => _api.delete('/recurring/$id');
}
