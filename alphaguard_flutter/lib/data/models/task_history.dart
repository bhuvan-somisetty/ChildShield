/// One task audit entry (`publicHistory` shape). Covers create, state changes,
/// field edits, proof, and approval/rejection events.
class TaskHistoryEntry {
  const TaskHistoryEntry({
    required this.id,
    required this.actorRole,
    required this.changeType,
    required this.at,
    this.field,
    this.oldValue,
    this.newValue,
  });

  final String id;
  final String actorRole;
  final String changeType; // create | state_change | note | field_edit | proof | approval | reject_comment | delete
  final int at;
  final String? field;
  final dynamic oldValue;
  final dynamic newValue;

  factory TaskHistoryEntry.fromJson(Map<String, dynamic> j) => TaskHistoryEntry(
        id: j['id'].toString(),
        actorRole: (j['actorRole'] ?? 'system') as String,
        changeType: (j['changeType'] ?? '') as String,
        at: (j['at'] ?? 0) as int,
        field: j['field'] as String?,
        oldValue: j['oldValue'],
        newValue: j['newValue'],
      );

  /// Human-readable description (mirrors the web HistoryModal).
  String describe() {
    switch (changeType) {
      case 'create':
        return 'Created the task';
      case 'state_change':
        return 'Marked ${_stateLabel(newValue)}';
      case 'note':
        return 'Updated the note';
      case 'delete':
        return 'Deleted the task';
      case 'proof':
        return 'Submitted photo proof';
      case 'approval':
        return newValue == 'approved'
            ? 'Approved the task'
            : newValue == 'rejected'
                ? 'Requested changes'
                : 'Submitted for approval';
      case 'reject_comment':
        return 'Correction: "$newValue"';
      case 'field_edit':
        return 'Changed $field';
      default:
        return changeType;
    }
  }

  static String _stateLabel(dynamic s) => switch (s) {
        'completed' => 'Completed',
        'failed' => 'Failed',
        'not_started' => 'Not Started',
        _ => '$s',
      };
}
