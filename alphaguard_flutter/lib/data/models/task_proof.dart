/// A photo/screenshot proof attached to a task (`publicProof` shape). `dataUrl`
/// is a base64 image data-URL stored by the backend.
class TaskProof {
  const TaskProof({required this.id, required this.taskId, required this.kind, required this.dataUrl, required this.at, this.name = 'proof'});

  final String id;
  final String taskId;
  final String kind; // 'photo' | 'screenshot'
  final String dataUrl;
  final String name;
  final int at;

  factory TaskProof.fromJson(Map<String, dynamic> j) => TaskProof(
        id: j['id'].toString(),
        taskId: (j['taskId'] ?? '') as String,
        kind: (j['kind'] ?? 'photo') as String,
        dataUrl: (j['dataUrl'] ?? '') as String,
        name: (j['name'] ?? 'proof') as String,
        at: (j['at'] ?? 0) as int,
      );
}
