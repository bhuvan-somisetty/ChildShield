import 'package:flutter/foundation.dart';

import '../data/api/api_exception.dart';
import '../data/models/recurring_task.dart';
import '../data/models/task.dart';
import '../data/models/task_category.dart';
import '../data/repositories/task_repository.dart';
import '../services/socket/socket_events.dart';
import '../services/socket/socket_service.dart';

/// Owns the live task list for the active child and every task operation. Tasks
/// stay in sync over Socket.IO (task:upserted / task:deleted) and via optimistic
/// local updates reconciled by the server echo — mirroring the web client.
class TasksController extends ChangeNotifier {
  TasksController({required TaskRepository tasks, required SocketService socket, required this.childId})
      : _repo = tasks,
        _socket = socket;

  final TaskRepository _repo;
  final SocketService _socket;
  final String childId;

  final List<void Function()> _disposers = [];

  List<Task> _tasks = [];
  List<Task> get tasks => _tasks;
  List<TaskCategory> categories = const [];
  List<RecurringTask> recurring = const [];

  bool loading = true;
  String? error;

  Future<void> load() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      final results = await Future.wait([
        _repo.list(childId: childId),
        _repo.categories(),
        _repo.recurring(childId: childId),
      ]);
      _tasks = results[0] as List<Task>;
      categories = results[1] as List<TaskCategory>;
      recurring = results[2] as List<RecurringTask>;
    } on ApiException catch (e) {
      error = e.message;
    } catch (_) {
      error = 'Could not load tasks.';
    } finally {
      loading = false;
      notifyListeners();
    }
    _subscribe();
  }

  void _subscribe() {
    if (_disposers.isNotEmpty) return; // once
    _disposers.add(_socket.on(SocketEvents.taskUpserted, (data) {
      final t = Task.fromJson(Map<String, dynamic>.from(data as Map));
      if (t.childId != childId) return;
      _upsert(t);
    }));
    _disposers.add(_socket.on(SocketEvents.taskDeleted, (data) {
      final id = (data as Map)['id']?.toString();
      if (id == null) return;
      _tasks = _tasks.where((t) => t.id != id).toList();
      notifyListeners();
    }));
    _disposers.add(_socket.on(SocketEvents.recurringUpserted, (_) => _reloadRecurring()));
    _disposers.add(_socket.on(SocketEvents.recurringDeleted, (_) => _reloadRecurring()));
  }

  void _upsert(Task t) {
    final i = _tasks.indexWhere((x) => x.id == t.id);
    if (i == -1) {
      _tasks = [..._tasks, t];
    } else {
      _tasks = [..._tasks]..[i] = t;
    }
    notifyListeners();
  }

  Future<void> _reloadRecurring() async {
    try {
      recurring = await _repo.recurring(childId: childId);
      notifyListeners();
    } catch (_) {/* keep current */}
  }

  // ── Operations ───────────────────────────────────────────────────────────
  Future<void> create({
    required String title,
    String? category,
    String? note,
    String? dueAt,
    bool requireProof = false,
    bool requireApproval = false,
  }) async {
    final t = await _repo.create(
      title: title,
      childId: childId,
      category: category,
      note: note,
      dueAt: dueAt,
      requireProof: requireProof,
      requireApproval: requireApproval,
    );
    _upsert(t);
  }

  Future<void> edit(String id, Map<String, dynamic> patch) async => _upsert(await _repo.update(id, patch));

  /// Optimistic triple-state cycle (⬜→✅→❌→⬜), reconciled by the server.
  Future<void> cycle(String id) async {
    final i = _tasks.indexWhere((t) => t.id == id);
    if (i == -1) return;
    final current = _tasks[i];
    final nextState = switch (current.completionState) {
      TaskState.notStarted => TaskState.completed,
      TaskState.completed => TaskState.failed,
      TaskState.failed => TaskState.notStarted,
    };
    _tasks = [..._tasks]..[i] = current.copyWith(completionState: nextState);
    notifyListeners();
    try {
      _upsert(await _repo.cycle(id));
    } catch (_) {
      load();
    }
  }

  Future<void> remove(String id) async {
    await _repo.delete(id);
    _tasks = _tasks.where((t) => t.id != id).toList();
    notifyListeners();
  }

  Future<void> approve(String id) async => _upsert(await _repo.approve(id));
  Future<void> reject(String id, String comment) async => _upsert(await _repo.reject(id, comment));
  Future<void> uploadProof(String id, {required String dataUrl, String? name}) async =>
      _upsert(await _repo.uploadProof(id, dataUrl: dataUrl, name: name));

  Future<void> addCategory(String name) async {
    final c = await _repo.addCategory(name);
    categories = [...categories, c];
    notifyListeners();
  }

  Future<void> createRecurring({
    required String title,
    required String frequency,
    String? category,
    List<int>? weekdays,
    int? dayOfMonth,
  }) async {
    await _repo.createRecurring(childId: childId, title: title, frequency: frequency, category: category, weekdays: weekdays, dayOfMonth: dayOfMonth);
    await _reloadRecurring();
    // New instances arrive via task:upserted; also refresh the list to be safe.
    try {
      _tasks = await _repo.list(childId: childId);
      notifyListeners();
    } catch (_) {}
  }

  Future<void> deleteRecurring(String id) async {
    await _repo.deleteRecurring(id);
    await _reloadRecurring();
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
