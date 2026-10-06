/// An unlocked achievement (`publicAchievement` shape + `achievement:unlocked`).
class Achievement {
  const Achievement({required this.id, required this.title, required this.at, this.kind = 'badge', this.streakKind, this.badge, this.milestone});

  final String id;
  final String title;
  final int at;
  final String kind; // 'badge' | 'streak'
  final String? streakKind;
  final String? badge;
  final int? milestone;

  factory Achievement.fromJson(Map<String, dynamic> j) => Achievement(
        id: j['id'].toString(),
        title: (j['title'] ?? 'Achievement') as String,
        at: (j['at'] ?? 0) as int,
        kind: (j['kind'] ?? 'badge') as String,
        streakKind: j['streakKind'] as String?,
        badge: j['badge'] as String?,
        milestone: j['milestone'] as int?,
      );
}
