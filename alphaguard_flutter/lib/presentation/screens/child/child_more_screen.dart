import 'package:flutter/material.dart';

import '../../../core/responsive/responsive.dart';
import '../../../core/theme/app_colors.dart';
import '../../widgets/app_card.dart';
import '../achievements/achievements_screen.dart';
import '../productivity/productivity_screen.dart';
import 'child_contacts_screen.dart';
import 'child_goals_screen.dart';
import 'child_profile_screen.dart';
import 'child_settings_screen.dart';
import 'child_support_screen.dart';

/// Child "More" hub — goals, achievements, insights, help, profile, settings.
class ChildMoreScreen extends StatelessWidget {
  const ChildMoreScreen({super.key, required this.childId, this.childName});
  final String childId;
  final String? childName;

  void _push(BuildContext context, Widget screen) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));

  @override
  Widget build(BuildContext context) {
    Widget tile(IconData icon, String label, String sub, Widget screen, Color color) => AppCard(
          onTap: () => _push(context, screen),
          child: Row(children: [
            Container(width: 40, height: 40, decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)), child: Icon(icon, color: color, size: 20)),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(label, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 14.5)),
              Text(sub, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
            ])),
            const Icon(Icons.chevron_right, color: AppColors.textMuted),
          ]),
        );

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: context.isTablet ? 600 : double.infinity),
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              children: [
                Text('Hi, ${childName ?? 'there'}', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 20)),
                const SizedBox(height: 14),
                const SectionLabel('My Progress'),
                tile(Icons.flag, 'Goals', 'Track your goals', ChildGoalsScreen(childId: childId), AppColors.cyan),
                tile(Icons.emoji_events, 'Achievements', 'Your badges', AchievementsScreen(childId: childId, childName: childName), AppColors.violet),
                tile(Icons.insights, 'My Insights', 'How you’re doing', ProductivityScreen(childId: childId, childName: childName ?? 'You'), AppColors.success),
                const SizedBox(height: 12),
                const SectionLabel('More'),
                tile(Icons.phone_in_talk, 'Emergency Contacts', 'Call parent or co-parents', const ChildContactsScreen(), AppColors.danger),
                tile(Icons.help_outline, 'Help', 'Announcements & what’s new', const ChildSupportScreen(), AppColors.warning),
                tile(Icons.person_outline, 'My Profile', 'Name & connection', const ChildProfileScreen(), AppColors.indigo),
                tile(Icons.settings_outlined, 'Settings', 'App info & sign out', const ChildSettingsScreen(), AppColors.textMuted),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
