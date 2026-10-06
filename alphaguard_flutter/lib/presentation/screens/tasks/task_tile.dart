import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/task.dart';
import '../../../data/models/task_category.dart';
import '../../widgets/app_card.dart';

/// Visual metadata for the triple state.
({IconData icon, Color color, String label}) stateMeta(TaskState s) => switch (s) {
      TaskState.completed => (icon: Icons.check_circle, color: AppColors.success, label: 'Completed'),
      TaskState.failed => (icon: Icons.cancel, color: AppColors.danger, label: 'Failed'),
      TaskState.notStarted => (icon: Icons.circle_outlined, color: AppColors.textMuted, label: 'Not Started'),
    };

/// A single task row. The leading button cycles ⬜→✅→❌→⬜; tapping the body
/// opens the actions sheet; a pending-approval task shows an inline action bar.
class TaskTile extends StatelessWidget {
  const TaskTile({
    super.key,
    required this.task,
    required this.onCycle,
    required this.onOpen,
    this.onApprove,
    this.onReject,
    this.onViewProof,
  });

  final Task task;
  final VoidCallback onCycle;
  final VoidCallback onOpen;
  final VoidCallback? onApprove;
  final VoidCallback? onReject;
  final VoidCallback? onViewProof;

  @override
  Widget build(BuildContext context) {
    final m = stateMeta(task.completionState);
    final catColor = TaskCategory.colorFor(task.category);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: AppCard(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Triple-state toggle
                IconButton(
                  onPressed: onCycle,
                  iconSize: 26,
                  visualDensity: VisualDensity.compact,
                  icon: Icon(m.icon, color: m.color),
                  tooltip: 'Cycle status (now ${m.label})',
                ),
                Expanded(
                  child: InkWell(
                    onTap: onOpen,
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            task.title,
                            style: TextStyle(
                              color: task.completionState == TaskState.completed ? AppColors.textMuted : AppColors.textPrimary,
                              fontWeight: FontWeight.w700,
                              fontSize: 14.5,
                              decoration: task.completionState == TaskState.completed ? TextDecoration.lineThrough : null,
                            ),
                          ),
                          if (task.note.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: 2),
                              child: Text(task.note, style: const TextStyle(color: Color(0xCCFCD34D), fontSize: 12, fontWeight: FontWeight.w600)),
                            ),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              if (task.category.isNotEmpty) TagChip(label: task.category, color: catColor),
                              TagChip(label: task.source == 'parent' ? 'You' : 'Child', color: task.source == 'parent' ? AppColors.indigo : AppColors.cyan),
                              if (task.requireApproval) const TagChip(label: 'Approval', color: AppColors.violet),
                              if (task.requireProof) TagChip(label: '📷 ${task.proofCount}', color: AppColors.cyan),
                              if (task.dueAt != null) TagChip(label: task.dueAt!.length >= 10 ? task.dueAt!.substring(5) : task.dueAt!, color: AppColors.textMuted),
                              if (task.approvalStatus == 'rejected') const TagChip(label: 'Rejected', color: AppColors.danger),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                IconButton(onPressed: onOpen, icon: const Icon(Icons.more_horiz, color: AppColors.textMuted), visualDensity: VisualDensity.compact),
              ],
            ),
            // Pending-approval action bar
            if (task.isPendingApproval)
              Container(
                margin: const EdgeInsets.only(top: 4),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.warning.withValues(alpha: 0.2)),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.hourglass_top, color: AppColors.warning, size: 15),
                        const SizedBox(width: 6),
                        const Expanded(child: Text('Awaiting your approval', style: TextStyle(color: AppColors.warning, fontWeight: FontWeight.w800, fontSize: 12))),
                        if (task.proofCount > 0 && onViewProof != null)
                          TextButton.icon(
                            onPressed: onViewProof,
                            icon: const Icon(Icons.image, size: 14, color: AppColors.cyan),
                            label: Text('Proof (${task.proofCount})', style: const TextStyle(color: AppColors.cyan, fontSize: 11.5, fontWeight: FontWeight.w700)),
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(children: [
                      Expanded(child: _ActionBtn(label: 'Approve', icon: Icons.check, color: AppColors.success, onTap: onApprove)),
                      const SizedBox(width: 8),
                      Expanded(child: _ActionBtn(label: 'Reject', icon: Icons.close, color: AppColors.danger, onTap: onReject)),
                    ]),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _ActionBtn extends StatelessWidget {
  const _ActionBtn({required this.label, required this.icon, required this.color, this.onTap});
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) => InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          height: 40,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: color.withValues(alpha: 0.3)),
          ),
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(icon, size: 15, color: color),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 13)),
          ]),
        ),
      );
}
