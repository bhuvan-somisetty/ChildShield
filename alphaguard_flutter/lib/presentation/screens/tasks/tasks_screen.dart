import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/responsive/responsive.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/task.dart';
import '../../../data/models/task_category.dart';
import '../../../data/repositories/task_repository.dart';
import '../../../services/socket/socket_service.dart';
import '../../../state/tasks_controller.dart';
import '../../widgets/app_card.dart';
import 'agenda_view.dart';
import 'calendar_view.dart';
import 'task_detail_sheets.dart';
import 'task_sheets.dart';
import 'task_tile.dart';

/// Tasks & Productivity-planning screen for the active child. Hosts the List,
/// Agenda and Calendar views over one realtime task list.
class TasksScreen extends StatelessWidget {
  const TasksScreen({super.key, required this.childId, this.childName});
  final String childId;
  final String? childName;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<TasksController>(
      create: (ctx) => TasksController(
        tasks: ctx.read<TaskRepository>(),
        socket: ctx.read<SocketService>(),
        childId: childId,
      )..load(),
      child: _TasksBody(childName: childName),
    );
  }
}

class _TasksBody extends StatefulWidget {
  const _TasksBody({this.childName});
  final String? childName;
  @override
  State<_TasksBody> createState() => _TasksBodyState();
}

class _TasksBodyState extends State<_TasksBody> {
  int _view = 0; // 0 list · 1 agenda · 2 calendar
  String? _categoryFilter;

  Widget _tile(BuildContext context, TasksController c, Task t) => TaskTile(
        key: ValueKey(t.id),
        task: t,
        onCycle: () => c.cycle(t.id),
        onOpen: () => showTaskActions(context, c, t),
        onApprove: () => c.approve(t.id),
        onReject: () => showRejectSheet(context, c, t),
        onViewProof: () => showProofSheet(context, c, t),
      );

  @override
  Widget build(BuildContext context) {
    final c = context.watch<TasksController>();
    final tasks = _categoryFilter == null ? c.tasks : c.tasks.where((t) => t.category == _categoryFilter).toList();
    final done = c.tasks.where((t) => t.completionState == TaskState.completed).length;

    return Scaffold(
      backgroundColor: AppColors.bg,
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.cyan,
        onPressed: () => showTaskEditor(context, c),
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: context.isTablet ? 640 : double.infinity),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          const Text('Tasks & Productivity', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 20)),
                          Text('${widget.childName != null ? '${widget.childName} · ' : ''}$done/${c.tasks.length} done', style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.w700, fontSize: 12.5)),
                        ]),
                      ),
                      IconButton(
                        tooltip: 'Recurring',
                        onPressed: () => showRecurringSheet(context, c),
                        icon: const Icon(Icons.repeat, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _ViewSwitch(value: _view, onChanged: (v) => setState(() => _view = v)),
                  const SizedBox(height: 12),
                  if (_view == 0 && c.tasks.isNotEmpty) _CategoryFilter(
                    tasks: c.tasks,
                    selected: _categoryFilter,
                    onChanged: (cat) => setState(() => _categoryFilter = cat),
                  ),
                  Expanded(
                    child: c.loading
                        ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
                        : c.error != null
                            ? Center(child: Text(c.error!, style: const TextStyle(color: AppColors.danger)))
                            : _buildView(context, c, tasks),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildView(BuildContext context, TasksController c, List<Task> tasks) {
    if (_view == 1) return AgendaView(tasks: c.tasks, tile: (t) => _tile(context, c, t));
    if (_view == 2) return CalendarView(tasks: c.tasks, tile: (t) => _tile(context, c, t));
    // List view
    if (tasks.isEmpty) {
      return const EmptyState(icon: Icons.checklist, title: 'No tasks yet', subtitle: 'Tap + to create the first task.');
    }
    return ListView(
      children: [
        const SizedBox(height: 4),
        ...tasks.map((t) => _tile(context, c, t)),
        const SizedBox(height: 90),
      ],
    );
  }
}

class _ViewSwitch extends StatelessWidget {
  const _ViewSwitch({required this.value, required this.onChanged});
  final int value;
  final ValueChanged<int> onChanged;
  @override
  Widget build(BuildContext context) {
    const labels = ['List', 'Agenda', 'Calendar'];
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.04), borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
      child: Row(
        children: List.generate(labels.length, (i) {
          final active = i == value;
          return Expanded(
            child: GestureDetector(
              onTap: () => onChanged(i),
              child: Container(
                height: 36,
                alignment: Alignment.center,
                decoration: BoxDecoration(color: active ? Colors.white.withValues(alpha: 0.08) : null, borderRadius: BorderRadius.circular(12)),
                child: Text(labels[i], style: TextStyle(color: active ? AppColors.textPrimary : AppColors.textMuted, fontWeight: FontWeight.w700, fontSize: 13)),
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _CategoryFilter extends StatelessWidget {
  const _CategoryFilter({required this.tasks, required this.selected, required this.onChanged});
  final List<Task> tasks;
  final String? selected;
  final ValueChanged<String?> onChanged;
  @override
  Widget build(BuildContext context) {
    final cats = tasks.map((t) => t.category).where((c) => c.isNotEmpty).toSet().toList();
    if (cats.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: SizedBox(
        height: 34,
        child: ListView(
          scrollDirection: Axis.horizontal,
          children: [
            _chip('All', selected == null, AppColors.textSecondary, () => onChanged(null)),
            ...cats.map((cat) => _chip(cat, selected == cat, TaskCategory.colorFor(cat), () => onChanged(cat))),
          ],
        ),
      ),
    );
  }

  Widget _chip(String label, bool active, Color color, VoidCallback onTap) => Padding(
        padding: const EdgeInsets.only(right: 8),
        child: GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: active ? color.withValues(alpha: 0.15) : AppColors.bgElevated,
              borderRadius: BorderRadius.circular(99),
              border: Border.all(color: active ? color.withValues(alpha: 0.5) : AppColors.border),
            ),
            child: Text(label, style: TextStyle(color: active ? color : AppColors.textMuted, fontWeight: FontWeight.w700, fontSize: 12)),
          ),
        ),
      );
}
