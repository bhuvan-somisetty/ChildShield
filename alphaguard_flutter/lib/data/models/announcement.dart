/// A published announcement (`publicAnnouncement` shape + `announcement:new`).
class Announcement {
  const Announcement({required this.id, required this.title, this.description = '', this.priority = 'normal', this.status = 'published', this.at = 0});

  final String id;
  final String title;
  final String description;
  final String priority;
  final String status; // draft | published
  final int at;

  factory Announcement.fromJson(Map<String, dynamic> j) => Announcement(
        id: j['id'].toString(),
        title: (j['title'] ?? '') as String,
        description: (j['description'] ?? '') as String,
        priority: (j['priority'] ?? 'normal') as String,
        status: (j['status'] ?? 'published') as String,
        at: (j['at'] is num) ? (j['at'] as num).toInt() : 0,
      );
}
