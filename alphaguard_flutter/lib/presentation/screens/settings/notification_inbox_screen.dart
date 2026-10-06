import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../data/models/notification_item.dart';
import '../../../state/notification_controller.dart';

/// Future Monetization Phase (Deferred) notification inbox — shows all alerts with category icons, colors,
/// and read/unread visual markers. Supports mark-all-read and pull-to-refresh.
class NotificationInboxScreen extends StatefulWidget {
  const NotificationInboxScreen({super.key});

  @override
  State<NotificationInboxScreen> createState() => _NotificationInboxScreenState();
}

class _NotificationInboxScreenState extends State<NotificationInboxScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationController>().load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final ctrl = context.watch<NotificationController>();
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0A0E1A) : const Color(0xFFF5F7FF),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          'Notifications',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w700,
            color: isDark ? Colors.white : const Color(0xFF1A1F36),
          ),
        ),
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: isDark ? Colors.white : const Color(0xFF1A1F36)),
          onPressed: () => context.pop(),
        ),
        actions: [
          if (ctrl.unreadCount > 0)
            TextButton.icon(
              onPressed: ctrl.markAllRead,
              icon: const Icon(Icons.done_all_rounded, size: 18),
              label: const Text('Mark all read'),
              style: TextButton.styleFrom(
                foregroundColor: const Color(0xFF6C63FF),
              ),
            ),
          IconButton(
            icon: const Icon(Icons.tune_rounded),
            color: isDark ? Colors.white70 : const Color(0xFF4A5568),
            tooltip: 'Notification Settings',
            onPressed: () => context.go('/notification-settings'),
          ),
        ],
      ),
      body: ctrl.loading
          ? const Center(child: CircularProgressIndicator())
          : ctrl.error != null
              ? _ErrorView(message: ctrl.error!, onRetry: ctrl.load)
              : ctrl.items.isEmpty
                  ? _EmptyView(isDark: isDark)
                  : RefreshIndicator(
                      onRefresh: ctrl.load,
                      color: const Color(0xFF6C63FF),
                      child: ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                        itemCount: ctrl.items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, i) {
                          final item = ctrl.items[i];
                          return _NotificationCard(
                            item: item,
                            isDark: isDark,
                            onTap: () => ctrl.markRead(item.id),
                          );
                        },
                      ),
                    ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({required this.item, required this.isDark, required this.onTap});
  final NotificationItem item;
  final bool isDark;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = _categoryColor(item.type);
    final icon = _categoryIcon(item.type);
    final isUnread = !item.read;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        decoration: BoxDecoration(
          color: isDark
              ? (isUnread ? const Color(0xFF16213E) : const Color(0xFF0F1629))
              : (isUnread ? Colors.white : const Color(0xFFF8F9FC)),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isUnread ? color.withOpacity(0.35) : Colors.transparent,
            width: 1.5,
          ),
          boxShadow: isUnread
              ? [BoxShadow(color: color.withOpacity(0.12), blurRadius: 12, offset: const Offset(0, 4))]
              : [],
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Category icon bubble
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            item.title,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: isUnread ? FontWeight.w700 : FontWeight.w500,
                              color: isDark ? Colors.white : const Color(0xFF1A1F36),
                            ),
                          ),
                        ),
                        if (isUnread)
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                          ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      item.body,
                      style: TextStyle(
                        fontSize: 13,
                        color: isDark ? Colors.white60 : const Color(0xFF6B7280),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: color.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            item.category,
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color),
                          ),
                        ),
                        const Spacer(),
                        Text(
                          _formatTime(item.at),
                          style: TextStyle(
                            fontSize: 11,
                            color: isDark ? Colors.white38 : const Color(0xFF9CA3AF),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(int ms) {
    final dt = DateTime.fromMillisecondsSinceEpoch(ms);
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.day}/${dt.month}';
  }

  Color _categoryColor(String type) {
    switch (type) {
      case 'sos':
        return const Color(0xFFFF4757);
      case 'zone':
      case 'location':
        return const Color(0xFF2ED573);
      case 'chat':
        return const Color(0xFF1E90FF);
      case 'tasks':
      case 'task':
        return const Color(0xFFFF6B35);
      case 'rewards':
      case 'reward':
        return const Color(0xFFFFD700);
      case 'achievements':
      case 'achievement':
        return const Color(0xFFAF52DE);
      case 'security':
        return const Color(0xFFFF6B6B);
      case 'screentime':
        return const Color(0xFFFF9F43);
      case 'battery':
        return const Color(0xFF00D2D3);
      case 'device':
        return const Color(0xFF54A0FF);
      default:
        return const Color(0xFF747D8C);
    }
  }

  IconData _categoryIcon(String type) {
    switch (type) {
      case 'sos':
        return Icons.emergency_rounded;
      case 'zone':
      case 'location':
        return Icons.location_on_rounded;
      case 'chat':
        return Icons.chat_bubble_rounded;
      case 'tasks':
      case 'task':
        return Icons.task_alt_rounded;
      case 'rewards':
      case 'reward':
        return Icons.card_giftcard_rounded;
      case 'achievements':
      case 'achievement':
        return Icons.emoji_events_rounded;
      case 'security':
        return Icons.security_rounded;
      case 'screentime':
        return Icons.screen_lock_portrait_rounded;
      case 'battery':
        return Icons.battery_alert_rounded;
      case 'device':
        return Icons.devices_rounded;
      default:
        return Icons.notifications_rounded;
    }
  }
}

class _EmptyView extends StatelessWidget {
  const _EmptyView({required this.isDark});
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: const Color(0xFF6C63FF).withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.notifications_none_rounded, size: 40, color: Color(0xFF6C63FF)),
          ),
          const SizedBox(height: 16),
          Text(
            'All caught up!',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white : const Color(0xFF1A1F36),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'No notifications yet.\nWe\'ll alert you when something needs attention.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: isDark ? Colors.white54 : const Color(0xFF6B7280)),
          ),
        ],
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline_rounded, size: 48, color: Color(0xFFFF4757)),
          const SizedBox(height: 12),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 12),
          ElevatedButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}
