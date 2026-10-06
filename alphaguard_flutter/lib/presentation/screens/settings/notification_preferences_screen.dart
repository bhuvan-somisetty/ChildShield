import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../data/models/notification_item.dart';
import '../../../state/notification_controller.dart';

/// Per-category notification preference toggles for the parent. Each category
/// maps to the backend preference key and controls both push and in-app delivery.
class NotificationPreferencesScreen extends StatefulWidget {
  const NotificationPreferencesScreen({super.key});

  @override
  State<NotificationPreferencesScreen> createState() => _NotificationPreferencesScreenState();
}

class _NotificationPreferencesScreenState extends State<NotificationPreferencesScreen> {
  bool _saving = false;

  @override
  Widget build(BuildContext context) {
    final ctrl = context.watch<NotificationController>();
    final prefs = ctrl.prefs;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final categories = [
      _PrefCategory(
        key: 'sos',
        label: 'SOS Alerts',
        subtitle: 'Emergency SOS triggered by your child',
        icon: Icons.emergency_rounded,
        color: const Color(0xFFFF4757),
        enabled: prefs.sos,
        canDisable: false, // SOS is always on for safety
      ),
      _PrefCategory(
        key: 'location',
        label: 'Safe Zone Alerts',
        subtitle: 'Enter / exit safe zones and missed arrivals',
        icon: Icons.location_on_rounded,
        color: const Color(0xFF2ED573),
        enabled: prefs.location,
      ),
      _PrefCategory(
        key: 'device',
        label: 'Device Alerts',
        subtitle: 'Device offline, app installs and uninstalls',
        icon: Icons.devices_rounded,
        color: const Color(0xFF54A0FF),
        enabled: prefs.device,
      ),
      _PrefCategory(
        key: 'battery',
        label: 'Battery Alerts',
        subtitle: 'Low battery warnings from your child\'s device',
        icon: Icons.battery_alert_rounded,
        color: const Color(0xFF00D2D3),
        enabled: prefs.battery,
      ),
      _PrefCategory(
        key: 'tasks',
        label: 'Task Alerts',
        subtitle: 'Task completions, approvals and reminders',
        icon: Icons.task_alt_rounded,
        color: const Color(0xFFFF6B35),
        enabled: prefs.tasks,
      ),
      _PrefCategory(
        key: 'rewards',
        label: 'Reward Alerts',
        subtitle: 'Reward redemptions and new rewards earned',
        icon: Icons.card_giftcard_rounded,
        color: const Color(0xFFFFD700),
        enabled: prefs.rewards,
      ),
      _PrefCategory(
        key: 'achievements',
        label: 'Achievement Alerts',
        subtitle: 'Badges and milestones unlocked by your child',
        icon: Icons.emoji_events_rounded,
        color: const Color(0xFFAF52DE),
        enabled: prefs.achievements,
      ),
      _PrefCategory(
        key: 'chat',
        label: 'Chat Messages',
        subtitle: 'New messages from your child',
        icon: Icons.chat_bubble_rounded,
        color: const Color(0xFF1E90FF),
        enabled: prefs.chat,
      ),
      _PrefCategory(
        key: 'security',
        label: 'Security Alerts',
        subtitle: 'VPN usage, tamper attempts and security events',
        icon: Icons.security_rounded,
        color: const Color(0xFFFF6B6B),
        enabled: prefs.security,
      ),
      _PrefCategory(
        key: 'screentime',
        label: 'Screen Time Alerts',
        subtitle: 'Daily limits reached and app blocks',
        icon: Icons.screen_lock_portrait_rounded,
        color: const Color(0xFFFF9F43),
        enabled: prefs.screentime,
      ),
      _PrefCategory(
        key: 'system',
        label: 'System Notifications',
        subtitle: 'App updates, announcements and admin messages',
        icon: Icons.notifications_rounded,
        color: const Color(0xFF747D8C),
        enabled: prefs.system,
      ),
    ];

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0A0E1A) : const Color(0xFFF5F7FF),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          'Notification Settings',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w700,
            color: isDark ? Colors.white : const Color(0xFF1A1F36),
          ),
        ),
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: isDark ? Colors.white : const Color(0xFF1A1F36)),
          onPressed: () => context.pop(),
        ),
      ),
      body: Column(
        children: [
          // Header card
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF6C63FF), Color(0xFF4ECDC4)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  const Icon(Icons.notifications_active_rounded, color: Colors.white, size: 28),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text('Stay in the loop', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15)),
                        SizedBox(height: 2),
                        Text('Choose which alerts you want to receive', style: TextStyle(color: Colors.white70, fontSize: 13)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
              itemCount: categories.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, i) {
                final cat = categories[i];
                return _PreferenceCard(
                  category: cat,
                  isDark: isDark,
                  saving: _saving,
                  onToggle: cat.canDisable
                      ? (value) => _toggle(context, ctrl, prefs, cat.key, value)
                      : null,
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _toggle(
    BuildContext context,
    NotificationController ctrl,
    NotificationPreferences prefs,
    String key,
    bool value,
  ) async {
    setState(() => _saving = true);
    final updated = _applyKey(prefs, key, value);
    await ctrl.savePreferences(updated);
    if (mounted) setState(() => _saving = false);
  }

  NotificationPreferences _applyKey(NotificationPreferences p, String key, bool v) {
    switch (key) {
      case 'sos':
        return p.copyWith(sos: v);
      case 'location':
        return p.copyWith(location: v);
      case 'device':
        return p.copyWith(device: v);
      case 'battery':
        return p.copyWith(battery: v);
      case 'tasks':
        return p.copyWith(tasks: v);
      case 'rewards':
        return p.copyWith(rewards: v);
      case 'achievements':
        return p.copyWith(achievements: v);
      case 'chat':
        return p.copyWith(chat: v);
      case 'security':
        return p.copyWith(security: v);
      case 'screentime':
        return p.copyWith(screentime: v);
      case 'system':
        return p.copyWith(system: v);
      default:
        return p;
    }
  }
}

class _PrefCategory {
  const _PrefCategory({
    required this.key,
    required this.label,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.enabled,
    this.canDisable = true,
  });
  final String key;
  final String label;
  final String subtitle;
  final IconData icon;
  final Color color;
  final bool enabled;
  final bool canDisable;
}

class _PreferenceCard extends StatelessWidget {
  const _PreferenceCard({
    required this.category,
    required this.isDark,
    required this.saving,
    required this.onToggle,
  });
  final _PrefCategory category;
  final bool isDark;
  final bool saving;
  final ValueChanged<bool>? onToggle;

  @override
  Widget build(BuildContext context) {
    final isForced = !category.canDisable;
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F1629) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.05),
        ),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        leading: Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: category.color.withOpacity(category.enabled ? 0.15 : 0.05),
            borderRadius: BorderRadius.circular(11),
          ),
          child: Icon(
            category.icon,
            color: category.enabled ? category.color : category.color.withOpacity(0.35),
            size: 22,
          ),
        ),
        title: Text(
          category.label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: isDark
                ? (category.enabled ? Colors.white : Colors.white38)
                : (category.enabled ? const Color(0xFF1A1F36) : const Color(0xFF9CA3AF)),
          ),
        ),
        subtitle: Text(
          isForced ? '${category.subtitle} (always on)' : category.subtitle,
          style: TextStyle(
            fontSize: 12,
            color: isDark ? Colors.white38 : const Color(0xFF9CA3AF),
          ),
        ),
        trailing: saving
            ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2))
            : Switch.adaptive(
                value: category.enabled,
                onChanged: isForced ? null : onToggle,
                activeColor: category.color,
              ),
      ),
    );
  }
}
