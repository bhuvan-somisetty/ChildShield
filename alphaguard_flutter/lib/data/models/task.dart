/// Task (the `publicTask` shape) including the Parent-Verification fields:
/// requireProof / requireApproval / approvalStatus / approvalComment / proofCount.
enum TaskState { notStarted, completed, failed }

TaskState _stateFrom(String? s) => switch (s) {
      'completed' => TaskState.completed,
      'failed' => TaskState.failed,
      _ => TaskState.notStarted,
    };

class Task {
  const Task({
    required this.id,
    required this.familyId,
    required this.childId,
    required this.title,
    required this.completionState,
    this.description = '',
    this.note = '',
    this.category = '',
    this.source = 'parent',
    this.requireProof = false,
    this.requireApproval = false,
    this.approvalStatus = 'none',
    this.approvalComment = '',
    this.proofCount = 0,
    this.dueAt,
    this.updatedAt = 0,
  });

  final String id;
  final String familyId;
  final String childId;
  final String title;
  final TaskState completionState;
  final String description;
  final String note;
  final String category;
  final String source; // 'parent' | 'child'
  final bool requireProof;
  final bool requireApproval;
  final String approvalStatus; // none | pending | approved | rejected
  final String approvalComment;
  final int proofCount;
  final String? dueAt;
  final int updatedAt;

  bool get isPendingApproval => approvalStatus == 'pending';

  /// Minimal copy used for optimistic UI updates (e.g. the triple-state cycle).
  Task copyWith({TaskState? completionState}) => Task(
        id: id,
        familyId: familyId,
        childId: childId,
        title: title,
        completionState: completionState ?? this.completionState,
        description: description,
        note: note,
        category: category,
        source: source,
        requireProof: requireProof,
        requireApproval: requireApproval,
        approvalStatus: approvalStatus,
        approvalComment: approvalComment,
        proofCount: proofCount,
        dueAt: dueAt,
        updatedAt: updatedAt,
      );

  factory Task.fromJson(Map<String, dynamic> j) => Task(
        id: j['id'] as String,
        familyId: (j['familyId'] ?? '') as String,
        childId: (j['childId'] ?? '') as String,
        title: (j['title'] ?? '') as String,
        completionState: _stateFrom(j['completionState'] as String?),
        description: (j['description'] ?? '') as String,
        note: (j['note'] ?? '') as String,
        category: (j['category'] ?? '') as String,
        source: (j['source'] ?? 'parent') as String,
        requireProof: (j['requireProof'] ?? false) as bool,
        requireApproval: (j['requireApproval'] ?? false) as bool,
        approvalStatus: (j['approvalStatus'] ?? 'none') as String,
        approvalComment: (j['approvalComment'] ?? '') as String,
        proofCount: (j['proofCount'] ?? 0) as int,
        dueAt: j['dueAt'] as String?,
        updatedAt: (j['updatedAt'] ?? 0) as int,
      );
}
