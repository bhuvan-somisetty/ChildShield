import 'package:flutter/material.dart';

import '../../../data/models/task.dart';
import '../../widgets/app_card.dart';

/// Agenda view — groups tasks into Overdue / Today / Tomorrow / Upcoming by their
/// `dueAt` (mirrors the web `bucketByAgenda`). Tasks with no due date are Upcoming.
class AgendaView extends StatelessWidget {
  const AgendaView({super.key, required this.tasks, required this.tile});
  final List<Task> tasks;
  final Widget Function(Task) tile;

  static String _key(DateTime d) => d.toIso8601String().substring(0, 10);

  @override
  Widget build(BuildContext context) {
    final today = _key(DateTime.now());
    final tomorrow = _key(DateTime.now().add(const Duration(days: 1)));
    final overdue = <Task>[], dToday = <Task>[], dTomorrow = <Task>[], upcoming = <Task>[];
    for (final t in tasks) {
      final due = t.dueAt != null && t.dueAt!.length >= 10 ? t.dueAt!.substring(0, 10) : null;
      if (due == null) {
        upcoming.add(t);
      } else if (t.completionState == TaskState.notStarted && due.compareTo(today) < 0) {
        overdue.add(t);
      } else if (due == today) {
        dToday.add(t);
      } else if (due == tomorrow) {
        dTomorrow.add(t);
      } else if (due.compareTo(tomorrow) > 0) {
        upcoming.add(t);
      } else {
        dToday.add(t);
      }
    }

    final groups = [
      ('Overdue', overdue),
      ('Today', dToday),
      ('Tomorrow', dTomorrow),
      ('Upcoming', upcoming),
    ].where((g) => g.$2.isNotEmpty).toList();

    if (groups.isEmpty) {
      return const EmptyState(icon: Icons.event_available, title: 'Nothing scheduled', subtitle: 'Add a due date to a task to see it here.');
    }

    return ListView(
      children: [
        for (final g in groups) ...[
          SectionLabel('${g.$1} · ${g.$2.length}'),
          ...g.$2.map(tile),
          const SizedBox(height: 6),
        ],
        const SizedBox(height: 24),
      ],
    );
  }
}
