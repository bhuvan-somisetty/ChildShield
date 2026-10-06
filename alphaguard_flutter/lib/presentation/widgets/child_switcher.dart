import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../state/family_controller.dart';

class ChildSwitcher extends StatelessWidget {
  const ChildSwitcher({super.key});

  void _showSwitcherSheet(BuildContext context, FamilyController familyCtrl) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.bgElevated,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Switch Child Context',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 16),
                if (familyCtrl.children.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(
                      child: Text(
                        'No children connected.',
                        style: TextStyle(color: AppColors.textMuted),
                      ),
                    ),
                  )
                else
                  ConstrainedBox(
                    constraints: BoxConstraints(
                      maxHeight: MediaQuery.of(context).size.height * 0.4,
                    ),
                    child: ListView.builder(
                      shrinkWrap: true,
                      itemCount: familyCtrl.children.length,
                      itemBuilder: (context, index) {
                        final c = familyCtrl.children[index];
                        final isSelected = familyCtrl.selectedChild?.id == c.id;
                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppColors.cyan.withValues(alpha: 0.08)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isSelected ? AppColors.cyan : AppColors.border,
                              width: isSelected ? 1.5 : 1.0,
                            ),
                          ),
                          child: ListTile(
                            onTap: () {
                              familyCtrl.selectChild(c);
                              Navigator.of(context).pop();
                            },
                            leading: Text(
                              c.emoji,
                              style: const TextStyle(fontSize: 24),
                            ),
                            title: Text(
                              c.name,
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            subtitle: Text(
                              c.age != null ? '${c.age} years old' : 'Age unspecified',
                              style: const TextStyle(
                                color: AppColors.textMuted,
                                fontSize: 12,
                              ),
                            ),
                            trailing: isSelected
                                ? const Icon(Icons.check_circle, color: AppColors.cyan)
                                : null,
                          ),
                        );
                      },
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final familyCtrl = context.watch<FamilyController>();
    final active = familyCtrl.selectedChild;
    if (familyCtrl.children.length <= 1) return const SizedBox.shrink();

    return InkWell(
      onTap: () => _showSwitcherSheet(context, familyCtrl),
      borderRadius: BorderRadius.circular(30),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.bgElevated,
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(active?.emoji ?? '🧒', style: const TextStyle(fontSize: 16)),
            const SizedBox(width: 8),
            Text(
              active?.name ?? 'Select Child',
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w800,
                fontSize: 13,
              ),
            ),
            const SizedBox(width: 6),
            const Icon(Icons.swap_horiz, color: AppColors.cyan, size: 16),
          ],
        ),
      ),
    );
  }
}
