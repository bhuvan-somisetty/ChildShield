/// A parent ↔ child comment on a task (the `publicComment` shape + `task:comment`
/// realtime event).
class TaskComment {
  const TaskComment({required this.id, required this.taskId, required this.authorRole, required this.body, required this.at});

  final String id;
  final String taskId;
  final String authorRole; // 'parent' | 'child'
  final String body;
  final int at;

  bool get isParent => authorRole == 'parent';

  factory TaskComment.fromJson(Map<String, dynamic> j) => TaskComment(
        id: j['id'].toString(),
        taskId: (j['taskId'] ?? '') as String,
        authorRole: (j['authorRole'] ?? 'parent') as String,
        body: (j['body'] ?? '') as String,
        at: (j['at'] ?? 0) as int,
      );
}
