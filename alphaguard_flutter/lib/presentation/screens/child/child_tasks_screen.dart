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
import '../../widgets/primary_button.dart';
import '../tasks/task_detail_sheets.dart';
import '../tasks/task_tile.dart' show stateMeta;

/// Child Tasks — complete tasks, add photo proof, chat about a task, and add
/// own tasks. Reuses the role-agnostic TasksController and the shared
/// proof/comment sheets (proof upload works with the child token).
class ChildTasksScreen extends StatelessWidget {
  const ChildTasksScreen({super.key, required this.childId});
  final String childId;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<TasksController>(
      create: (ctx) => TasksController(tasks: ctx.read<TaskRepository>(), socket: ctx.read<SocketService>(), childId: childId)..load(),
      child: const _ChildTasksView(),
    );
  }
}

class _ChildTasksView extends StatelessWidget {
  const _ChildTasksView();
  @override
  Widget build(BuildContext context) {
    final c = context.watch<TasksController>();
    final done = c.tasks.where((t) => t.completionState == TaskState.completed).length;
    return Scaffold(
      backgroundColor: AppColors.bg,
      floatingActionButton: FloatingActionButton(backgroundColor: AppColors.cyan, onPressed: () => _addTask(context, c), child: const Icon(Icons.add, color: Colors.white)),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: context.isTablet ? 600 : double.infinity),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                const SizedBox(height: 12),
                Text('My Tasks', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 22)),
                Text('${done}/${c.tasks.length} done', style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.w700, fontSize: 12.5)),
                const SizedBox(height: 12),
                Expanded(
                  child: c.loading
                      ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
                      : c.tasks.isEmpty
                          ? const Center(child: EmptyState(icon: Icons.celebration, title: 'All clear!', subtitle: 'Tap + to add your own task.'))
                          : ListView(children: [...c.tasks.map((t) => _ChildTaskTile(c: c, t: t)), const SizedBox(height: 90)]),
                ),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}

class _ChildTaskTile extends StatelessWidget {
  const _ChildTaskTile({required this.c, required this.t});
  final TasksController c;
  final Task t;
  @override
  Widget build(BuildContext context) {
    final m = stateMeta(t.completionState);
    final catColor = TaskCategory.colorFor(t.category);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: AppCard(
        padding: const EdgeInsets.all(12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            IconButton(onPressed: () => c.cycle(t.id), iconSize: 28, icon: Icon(m.icon, color: m.color)),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(t.title, style: TextStyle(color: t.completionState == TaskState.completed ? AppColors.textMuted : AppColors.textPrimary, fontWeight: FontWeight.w700, fontSize: 15, decoration: t.completionState == TaskState.completed ? TextDecoration.lineThrough : null)),
                ),
                const SizedBox(height: 6),
                Wrap(spacing: 6, runSpacing: 6, children: [
                  if (t.category.isNotEmpty) TagChip(label: t.category, color: catColor),
                  if (t.source == 'parent') const TagChip(label: 'From parent', color: AppColors.indigo),
                  if (t.approvalStatus == 'pending') const TagChip(label: 'Waiting for parent', color: AppColors.warning, icon: Icons.hourglass_top),
                  if (t.approvalStatus == 'approved') const TagChip(label: 'Approved ✓', color: AppColors.success),
                  if (t.approvalStatus == 'rejected') const TagChip(label: 'Needs changes', color: AppColors.danger),
                  if (t.requireProof) TagChip(label: '📷 ${t.proofCount}', color: AppColors.cyan),
                ]),
                if (t.approvalStatus == 'rejected' && t.approvalComment.isNotEmpty)
                  Padding(padding: const EdgeInsets.only(top: 6), child: Text('“${t.approvalComment}”', style: const TextStyle(color: AppColors.danger, fontSize: 12))),
              ]),
            ),
          ]),
          const Divider(color: AppColors.border, height: 18),
          Row(children: [
            if (t.requireProof)
              TextButton.icon(onPressed: () => showProofSheet(context, c, t), icon: const Icon(Icons.camera_alt_outlined, size: 16, color: AppColors.success), label: const Text('Add proof', style: TextStyle(color: AppColors.success, fontSize: 12.5, fontWeight: FontWeight.w700))),
            TextButton.icon(onPressed: () => showCommentsSheet(context, t), icon: const Icon(Icons.chat_bubble_outline, size: 15, color: AppColors.cyan), label: const Text('Chat', style: TextStyle(color: AppColors.cyan, fontSize: 12.5, fontWeight: FontWeight.w700))),
            const Spacer(),
            if (t.source == 'child') IconButton(onPressed: () => c.remove(t.id), icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.textMuted)),
          ]),
        ]),
      ),
    );
  }
}

void _addTask(BuildContext context, TasksController c) {
  final title = TextEditingController();
  var category = 'Homework';
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(ctx).bottom),
      child: Container(
        decoration: const BoxDecoration(color: AppColors.bgElevated, borderRadius: BorderRadius.vertical(top: Radius.circular(28)), border: Border.fromBorderSide(BorderSide(color: AppColors.border))),
        padding: EdgeInsets.fromLTRB(20, 16, 20, 20 + MediaQuery.paddingOf(ctx).bottom),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          const Text('New Task', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 18)),
          const SizedBox(height: 14),
          TextField(controller: title, autofocus: true, style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(hintText: 'What do you need to do?')),
          const SizedBox(height: 12),
          StatefulBuilder(builder: (ctx, set) => DropdownButtonFormField<String>(
                value: category,
                dropdownColor: AppColors.surface,
                decoration: const InputDecoration(labelText: 'Category'),
                items: TaskCategory.builtinNames.map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(color: AppColors.textPrimary)))).toList(),
                onChanged: (v) => set(() => category = v ?? category),
              )),
          const SizedBox(height: 16),
          PrimaryButton(label: 'Add Task', onPressed: () async {
            if (title.text.trim().isEmpty) return;
            await c.create(title: title.text.trim(), category: category);
            if (ctx.mounted) Navigator.pop(ctx);
          }),
        ]),
      ),
    ),
  );
}
