/// A user feature request (`publicFeature` shape + `feature:new`/`feature:update`).
class FeatureRequest {
  const FeatureRequest({required this.id, required this.title, required this.status, this.description = '', this.category = 'general', this.priority = 'medium', this.createdAt = 0});

  final String id;
  final String title;
  final String status; // requested | under_review | planned | in_development | released | rejected
  final String description;
  final String category;
  final String priority;
  final int createdAt;

  String get statusLabel => status.replaceAll('_', ' ').split(' ').map((w) => w.isEmpty ? w : w[0].toUpperCase() + w.substring(1)).join(' ');

  factory FeatureRequest.fromJson(Map<String, dynamic> j) => FeatureRequest(
        id: j['id'].toString(),
        title: (j['title'] ?? '') as String,
        status: (j['status'] ?? 'requested') as String,
        description: (j['description'] ?? '') as String,
        category: (j['category'] ?? 'general') as String,
        priority: (j['priority'] ?? 'medium') as String,
        createdAt: (j['createdAt'] is num) ? (j['createdAt'] as num).toInt() : 0,
      );
}
