import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/responsive/responsive.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/achievement.dart';
import '../../../data/repositories/productivity_repository.dart';
import '../../widgets/app_card.dart';

/// Achievements — badge gallery + unlock history. Read-only (unlocked by the
/// backend as tasks/targets complete).
class AchievementsScreen extends StatelessWidget {
  const AchievementsScreen({super.key, required this.childId, this.childName});
  final String childId;
  final String? childName;

  @override
  Widget build(BuildContext context) {
    final repo = context.read<ProductivityRepository>();
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(backgroundColor: AppColors.bg, title: Text('Achievements${childName != null ? ' · $childName' : ''}', style: const TextStyle(fontWeight: FontWeight.w900))),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: context.isTablet ? 640 : double.infinity),
            child: FutureBuilder<List<Achievement>>(
              future: repo.achievements(childId),
              builder: (ctx, snap) {
                if (!snap.hasData) return const Center(child: CircularProgressIndicator(color: AppColors.cyan));
                final items = snap.data!;
                if (items.isEmpty) {
                  return const Center(child: EmptyState(icon: Icons.emoji_events_outlined, title: 'No badges yet', subtitle: 'Complete tasks and goals to earn achievements.'));
                }
                return ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  children: [
                    const SectionLabel('Badge Gallery'),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: items.map((a) => Container(
                            width: context.isTablet ? 150 : 110,
                            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 10),
                            decoration: BoxDecoration(color: AppColors.violet.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(18), border: Border.all(color: AppColors.violet.withValues(alpha: 0.3))),
                            child: Column(children: [
                              const Icon(Icons.emoji_events, color: AppColors.violet, size: 30),
                              const SizedBox(height: 8),
                              Text(a.title, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700, fontSize: 12)),
                            ]),
                          )).toList(),
                    ),
                    const SizedBox(height: 16),
                    const SectionLabel('Unlock History'),
                    ...items.map((a) => AppCard(
                          padding: const EdgeInsets.all(14),
                          child: Row(children: [
                            const Icon(Icons.military_tech, color: AppColors.violet, size: 20),
                            const SizedBox(width: 12),
                            Expanded(child: Text(a.title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700))),
                            Text(DateTime.fromMillisecondsSinceEpoch(a.at).toString().substring(0, 10), style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                          ]),
                        )),
                    const SizedBox(height: 24),
                  ],
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}
