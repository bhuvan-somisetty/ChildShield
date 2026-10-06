/// A recurring task rule (`publicRecurring` shape). The backend materialises
/// concrete task instances with a `dueAt` from each rule.
class RecurringTask {
  const RecurringTask({
    required this.id,
    required this.childId,
    required this.title,
    required this.frequency,
    this.category = 'Custom',
    this.note = '',
    this.weekdays = const [],
    this.dayOfMonth,
    this.status = 'active',
  });

  final String id;
  final String childId;
  final String title;
  final String frequency; // daily | weekdays | weekly | monthly | custom
  final String category;
  final String note;
  final List<int> weekdays; // 0=Sun..6=Sat
  final int? dayOfMonth;
  final String status;

  static const frequencies = ['daily', 'weekdays', 'weekly', 'monthly', 'custom'];

  String get frequencyLabel => switch (frequency) {
        'daily' => 'Daily',
        'weekdays' => 'Weekdays',
        'weekly' => 'Weekly',
        'monthly' => 'Monthly',
        'custom' => 'Custom',
        _ => frequency,
      };

  factory RecurringTask.fromJson(Map<String, dynamic> j) => RecurringTask(
        id: j['id'].toString(),
        childId: (j['childId'] ?? '') as String,
        title: (j['title'] ?? '') as String,
        frequency: (j['frequency'] ?? 'daily') as String,
        category: (j['category'] ?? 'Custom') as String,
        note: (j['note'] ?? '') as String,
        weekdays: ((j['weekdays'] ?? []) as List).map((e) => e as int).toList(),
        dayOfMonth: j['dayOfMonth'] as int?,
        status: (j['status'] ?? 'active') as String,
      );
}
