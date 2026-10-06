import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/task.dart';
import '../../widgets/app_card.dart';

/// Month calendar view. Days with tasks (by `dueAt`) are marked; tapping a day
/// shows that day's tasks below. Fully responsive — the grid sizes to width.
class CalendarView extends StatefulWidget {
  const CalendarView({super.key, required this.tasks, required this.tile});
  final List<Task> tasks;
  final Widget Function(Task) tile;

  @override
  State<CalendarView> createState() => _CalendarViewState();
}

class _CalendarViewState extends State<CalendarView> {
  late DateTime _month = DateTime(DateTime.now().year, DateTime.now().month);
  String _selected = DateTime.now().toIso8601String().substring(0, 10);

  static String _key(DateTime d) => d.toIso8601String().substring(0, 10);

  Map<String, int> get _counts {
    final m = <String, int>{};
    for (final t in widget.tasks) {
      if (t.dueAt != null && t.dueAt!.length >= 10) {
        final k = t.dueAt!.substring(0, 10);
        m[k] = (m[k] ?? 0) + 1;
      }
    }
    return m;
  }

  @override
  Widget build(BuildContext context) {
    final counts = _counts;
    final first = DateTime(_month.year, _month.month, 1);
    final daysInMonth = DateTime(_month.year, _month.month + 1, 0).day;
    final leading = first.weekday % 7; // Sun=0
    final cells = <Widget>[];
    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    for (final w in weekdays) {
      cells.add(Center(child: Text(w, style: const TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.w800, fontSize: 11))));
    }
    for (var i = 0; i < leading; i++) {
      cells.add(const SizedBox.shrink());
    }
    for (var d = 1; d <= daysInMonth; d++) {
      final key = _key(DateTime(_month.year, _month.month, d));
      final has = counts[key] ?? 0;
      final sel = key == _selected;
      final isToday = key == DateTime.now().toIso8601String().substring(0, 10);
      cells.add(GestureDetector(
        onTap: () => setState(() => _selected = key),
        child: Container(
          margin: const EdgeInsets.all(2),
          decoration: BoxDecoration(
            color: sel ? AppColors.cyan.withValues(alpha: 0.18) : (isToday ? Colors.white.withValues(alpha: 0.04) : null),
            borderRadius: BorderRadius.circular(10),
            border: sel ? Border.all(color: AppColors.cyan.withValues(alpha: 0.5)) : null,
          ),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text('$d', style: TextStyle(color: sel || isToday ? AppColors.textPrimary : AppColors.textSecondary, fontWeight: FontWeight.w700, fontSize: 13)),
            if (has > 0) Container(margin: const EdgeInsets.only(top: 2), width: 5, height: 5, decoration: const BoxDecoration(color: AppColors.cyan, shape: BoxShape.circle)),
          ]),
        ),
      ));
    }

    final dayTasks = widget.tasks.where((t) => t.dueAt != null && t.dueAt!.length >= 10 && t.dueAt!.substring(0, 10) == _selected).toList();

    return ListView(
      children: [
        AppCard(
          child: Column(children: [
            Row(children: [
              IconButton(onPressed: () => setState(() => _month = DateTime(_month.year, _month.month - 1)), icon: const Icon(Icons.chevron_left, color: AppColors.textSecondary)),
              Expanded(child: Center(child: Text(_monthLabel(_month), style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 15)))),
              IconButton(onPressed: () => setState(() => _month = DateTime(_month.year, _month.month + 1)), icon: const Icon(Icons.chevron_right, color: AppColors.textSecondary)),
            ]),
            // 7-column grid that sizes to available width (no fixed dimensions).
            GridView.count(
              crossAxisCount: 7,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 0.82,
              children: cells,
            ),
          ]),
        ),
        const SizedBox(height: 14),
        SectionLabel('${_selected.substring(5)} · ${dayTasks.length} task${dayTasks.length == 1 ? '' : 's'}'),
        if (dayTasks.isEmpty)
          const Padding(padding: EdgeInsets.symmetric(vertical: 16), child: Text('No tasks on this day.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textMuted)))
        else
          ...dayTasks.map(widget.tile),
        const SizedBox(height: 24),
      ],
    );
  }

  static String _monthLabel(DateTime d) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return '${months[d.month - 1]} ${d.year}';
  }
}
