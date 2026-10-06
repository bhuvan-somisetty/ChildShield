/// A child's streak for a given kind (`publicStreak` shape + `streak:updated`).
class Streak {
  const Streak({required this.kind, required this.current, required this.longest, this.lastQualifiedDate});

  final String kind; // task_completion | study | reading | coding | exercise
  final int current;
  final int longest;
  final String? lastQualifiedDate;

  String get label => switch (kind) {
        'task_completion' => 'Daily Tasks',
        'study' => 'Study',
        'reading' => 'Reading',
        'coding' => 'Coding',
        'exercise' => 'Exercise',
        _ => kind,
      };

  factory Streak.fromJson(Map<String, dynamic> j) => Streak(
        kind: (j['kind'] ?? '') as String,
        current: (j['current'] ?? 0) as int,
        longest: (j['longest'] ?? 0) as int,
        lastQualifiedDate: j['lastQualifiedDate'] as String?,
      );
}
