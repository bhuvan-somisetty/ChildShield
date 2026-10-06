/// A reward / promise (`publicReward` shape + `reward:upserted`). Unlocks when a
/// linked target completes; delivered by the parent.
class Reward {
  const Reward({
    required this.id,
    required this.childId,
    required this.title,
    required this.status,
    this.description = '',
    this.type = 'gift',
    this.value = '',
    this.targetId,
    this.promiseText = '',
    this.childAcknowledged = false,
  });

  final String id;
  final String childId;
  final String title;
  final String status; // pending | unlocked | delivered
  final String description;
  final String type;
  final String value;
  final String? targetId;
  final String promiseText;
  final bool childAcknowledged;

  String get statusLabel => switch (status) {
        'unlocked' => 'Unlocked',
        'delivered' => 'Delivered',
        _ => 'Pending',
      };

  factory Reward.fromJson(Map<String, dynamic> j) => Reward(
        id: j['id'].toString(),
        childId: (j['childId'] ?? '') as String,
        title: (j['title'] ?? 'Reward') as String,
        status: (j['status'] ?? 'pending') as String,
        description: (j['description'] ?? '') as String,
        type: (j['type'] ?? 'gift') as String,
        value: (j['value'] ?? '') as String,
        targetId: j['targetId'] as String?,
        promiseText: (j['promiseText'] ?? '') as String,
        childAcknowledged: (j['childAcknowledged'] ?? false) as bool,
      );
}
