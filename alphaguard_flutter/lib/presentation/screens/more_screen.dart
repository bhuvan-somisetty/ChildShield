import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/responsive/responsive.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/child.dart';
import '../../state/auth_controller.dart';
import '../widgets/app_card.dart';
import 'achievements/achievements_screen.dart';
import 'admin/admin_screen.dart';
import 'admin/launch_readiness_screen.dart';
import 'rewards/rewards_screen.dart';
import 'safety/family_radar_screen.dart';
import 'safety/safe_zones_screen.dart';
import 'safety/sos_screen.dart';
import 'support/support_screen.dart';
import 'support/legal_consent_screen.dart';
import 'support/privacy_policy_screen.dart';
import 'support/terms_conditions_screen.dart';
import 'support/user_manual_screen.dart';
import 'targets/targets_screen.dart';
import 'child/child_profile_edit_screen.dart';
import 'settings/family_settings_screen.dart';
import 'settings/device_registry_screen.dart';
import 'settings/notification_inbox_screen.dart';
import 'settings/notification_preferences_screen.dart';
import 'settings/account_settings_screen.dart';
import 'productivity/ai_reports_screen.dart' hide SectionLabel;

/// "More" hub — entry points to the remaining migrated systems.
class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key, required this.child});
  final Child? child;

  void _push(BuildContext context, Widget screen) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final isAdmin = auth.parent?.admin == true;
    final c = child;

    Widget tile(IconData icon, String label, String sub, VoidCallback? onTap, {Color color = AppColors.cyan, bool danger = false}) => AppCard(
          onTap: onTap,
          child: Row(children: [
            Container(width: 40, height: 40, decoration: BoxDecoration(color: (danger ? AppColors.danger : color).withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)), child: Icon(icon, color: danger ? AppColors.danger : color, size: 20)),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(label, style: TextStyle(color: danger ? AppColors.danger : AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 14.5)),
              Text(sub, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
            ])),
            if (onTap != null) const Icon(Icons.chevron_right, color: AppColors.textMuted),
          ]),
        );

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: context.isTablet ? 640 : double.infinity),
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              children: [
                Row(children: [
                  Expanded(child: Text('Hi, ${auth.parent?.name ?? 'Parent'}', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 20))),
                ]),
                const SizedBox(height: 14),
                const SectionLabel('Safety'),
                tile(Icons.radar, 'Family Radar', 'Live location & route', c == null ? null : () => _push(context, FamilyRadarScreen(childId: c.id, childName: c.name)), color: AppColors.cyan),
                tile(Icons.shield, 'Safe Zones', 'Enter / exit alerts', () => _push(context, const SafeZonesScreen()), color: AppColors.success),
                tile(Icons.sos, 'Emergency SOS', 'Alerts from your child', () => _push(context, const SosScreen()), color: AppColors.danger),
                tile(Icons.analytics_outlined, 'AI Safety Reports', 'Safety score & weekly behaviors', c == null ? null : () => _push(context, AiReportsScreen(childId: c.id, childName: c.name)), color: AppColors.violet),
                const SizedBox(height: 12),
                const SectionLabel('Growth'),
                tile(Icons.flag, 'Goals', 'Set and track targets', c == null ? null : () => _push(context, TargetsScreen(childId: c.id, childName: c.name))),
                tile(Icons.card_giftcard, 'Rewards', 'Promises & delivery', c == null ? null : () => _push(context, RewardsScreen(childId: c.id, childName: c.name)), color: AppColors.warning),
                tile(Icons.emoji_events, 'Achievements', 'Badges & milestones', c == null ? null : () => _push(context, AchievementsScreen(childId: c.id, childName: c.name)), color: AppColors.violet),
                const SizedBox(height: 12),
                const SectionLabel('Help & Legal'),
                tile(Icons.support_agent, 'Help & Support', 'Tickets, features, contact', () => _push(context, const SupportScreen()), color: AppColors.success),
                tile(Icons.menu_book, 'User Manual', 'How to use AlphaGuard', () => _push(context, const UserManualScreen()), color: AppColors.cyan),
                tile(Icons.gavel, 'Terms of Service', 'Terms and conditions', () => _push(context, const TermsConditionsScreen()), color: AppColors.warning),
                tile(Icons.privacy_tip, 'Privacy Policy', 'Data collection & CCPA', () => _push(context, const PrivacyPolicyScreen()), color: AppColors.violet),
                tile(Icons.fact_check, 'Legal & AI Consent', 'Review consents & COPPA', () => _push(context, const LegalConsentScreen()), color: AppColors.cyan),
                if (isAdmin) tile(Icons.admin_panel_settings, 'Admin Dashboard', 'Manage tickets & publish', () => _push(context, const AdminScreen()), color: AppColors.indigo),
                if (isAdmin) tile(Icons.health_and_safety, 'Launch Readiness', 'System verification & health', () => _push(context, const LaunchReadinessScreen()), color: AppColors.success),
                const SizedBox(height: 12),
                const SectionLabel('Family & Devices'),
                tile(Icons.people, 'Family Management', 'Co-parents, guardians, roles', () => _push(context, const FamilySettingsScreen()), color: AppColors.cyan),
                tile(Icons.devices, 'Device Registry', 'Manage registered child devices', () => _push(context, const DeviceRegistryScreen()), color: AppColors.success),
                if (c != null) tile(Icons.edit, 'Edit Child Profile', 'Change name, age, emoji, color', () => _push(context, ChildProfileEditScreen(child: c)), color: AppColors.warning),
                const SizedBox(height: 12),
                const SectionLabel('Notifications'),
                tile(Icons.notifications_rounded, 'Notification Inbox', 'View all alerts and messages', () => _push(context, const NotificationInboxScreen()), color: AppColors.violet),
                tile(Icons.tune_rounded, 'Notification Settings', 'Choose which alerts to receive', () => _push(context, const NotificationPreferencesScreen()), color: AppColors.violet),
                const SizedBox(height: 12),
                const SectionLabel('Account'),
                tile(Icons.settings, 'Account Settings', 'Profile, email, and deactivation', () => _push(context, const AccountSettingsScreen()), color: AppColors.cyan),
                tile(Icons.logout, 'Sign out', auth.parent?.email ?? '', () => auth.logout(), danger: true),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
