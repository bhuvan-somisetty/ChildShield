import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/child.dart';
import '../../services/push/push_service.dart';
import '../../state/auth_controller.dart';
import '../../state/family_controller.dart';
import '../../state/notification_controller.dart';
import '../widgets/app_card.dart';
import 'assistant/assistant_screen.dart';
import 'home_screen.dart';
import 'productivity/productivity_screen.dart';
import 'safety/family_radar_screen.dart';
import 'settings/account_settings_screen.dart';
import 'tasks/tasks_screen.dart';

/// Parent bottom-navigation shell — 5 tabs matching frontend-v2 exactly:
///   1. Home (Dashboard)
///   2. Tasks
///   3. Location (Family Radar)
///   4. Reports (AI Insights)
///   5. Settings
///
/// Plus a draggable floating DISHA bubble (matches the floating DISHA FAB
/// in the frontend-v2 ParentShell). Tapping it opens DISHA full-screen.
///
/// Header: Child Switcher (left) + Notification Bell with unread badge (right).
class MainShell extends StatefulWidget {
  const MainShell({super.key});
  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  // DISHA bubble position — default bottom-right above the nav bar.
  double _dishaRight = 16;
  double _dishaBottom = 0; // set in build after we know navH

  bool _dishaPosSet = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<PushService>().registerForUser();
        context.read<FamilyController>().load();
        context.read<NotificationController>().init();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final familyCtrl = context.watch<FamilyController>();
    final notifCtrl = context.watch<NotificationController>();
    final activeChild = familyCtrl.selectedChild;
    final childLoading = familyCtrl.loading;
    final unreadCount = notifCtrl.unreadCount;
    final safeBottom = MediaQuery.of(context).padding.bottom;
    final navH = kBottomNavigationBarHeight + safeBottom;

    if (!_dishaPosSet) {
      _dishaBottom = navH + 14;
      _dishaPosSet = true;
    }

    final tabs = <Widget>[
      const HomeScreen(),
      _childGated(activeChild, childLoading, (c) => TasksScreen(childId: c.id, childName: c.name)),
      _childGated(activeChild, childLoading, (c) => FamilyRadarScreen(childId: c.id, childName: c.name)),
      _childGated(activeChild, childLoading, (c) => ProductivityScreen(childId: c.id, childName: c.name)),
      const AccountSettingsScreen(),
    ];

    return Stack(
      children: [
        Scaffold(
          backgroundColor: AppColors.bg,
          appBar: _buildHeader(context, activeChild, familyCtrl, unreadCount),
          body: IndexedStack(index: _index, children: tabs),
          bottomNavigationBar: NavigationBar(
            backgroundColor: AppColors.bgElevated,
            indicatorColor: AppColors.cyan.withValues(alpha: 0.15),
            selectedIndex: _index,
            onDestinationSelected: (i) => setState(() => _index = i),
            destinations: [
              NavigationDestination(
                icon: Badge(
                  isLabelVisible: unreadCount > 0 && _index != 0,
                  label: Text('$unreadCount', style: const TextStyle(fontSize: 10)),
                  child: const Icon(Icons.grid_view_outlined, color: AppColors.textMuted),
                ),
                selectedIcon: const Icon(Icons.grid_view_rounded, color: AppColors.cyan),
                label: 'Home',
              ),
              const NavigationDestination(
                icon: Icon(Icons.checklist_outlined, color: AppColors.textMuted),
                selectedIcon: Icon(Icons.checklist, color: AppColors.cyan),
                label: 'Tasks',
              ),
              const NavigationDestination(
                icon: Icon(Icons.location_on_outlined, color: AppColors.textMuted),
                selectedIcon: Icon(Icons.location_on, color: AppColors.cyan),
                label: 'Location',
              ),
              const NavigationDestination(
                icon: Icon(Icons.auto_awesome_outlined, color: AppColors.textMuted),
                selectedIcon: Icon(Icons.auto_awesome, color: AppColors.cyan),
                label: 'Reports',
              ),
              const NavigationDestination(
                icon: Icon(Icons.settings_outlined, color: AppColors.textMuted),
                selectedIcon: Icon(Icons.settings, color: AppColors.cyan),
                label: 'Settings',
              ),
            ],
          ),
        ),
        // ── Floating DISHA bubble ──────────────────────────────────────────
        Positioned(
          right: _dishaRight,
          bottom: _dishaBottom,
          child: GestureDetector(
            onTap: () => _openDisha(context, activeChild),
            onPanUpdate: (d) => setState(() {
              _dishaRight = (_dishaRight - d.delta.dx).clamp(8, 200);
              _dishaBottom = (_dishaBottom - d.delta.dy).clamp(navH + 8, 600);
            }),
            child: _DishaBubble(),
          ),
        ),
      ],
    );
  }

  PreferredSizeWidget _buildHeader(
    BuildContext context,
    Child? activeChild,
    FamilyController familyCtrl,
    int unreadCount,
  ) {
    return AppBar(
      backgroundColor: AppColors.bgElevated,
      elevation: 0,
      scrolledUnderElevation: 0,
      surfaceTintColor: Colors.transparent,
      titleSpacing: 16,
      title: _ChildSwitcher(
        activeChild: activeChild,
        children: familyCtrl.children,
        onSelect: (c) => familyCtrl.selectChild(c),
      ),
      actions: [
        // Notification bell
        GestureDetector(
          onTap: () => Navigator.of(context).pushNamed('/notifications'),
          child: Container(
            margin: const EdgeInsets.only(right: 16),
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              color: Colors.white.withValues(alpha: 0.05),
              border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                const Icon(Icons.notifications_outlined, color: AppColors.textMuted, size: 22),
                if (unreadCount > 0)
                  Positioned(
                    top: 6, right: 6,
                    child: Container(
                      width: 8, height: 8,
                      decoration: const BoxDecoration(shape: BoxShape.circle, color: AppColors.danger),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(height: 1, color: Colors.white.withValues(alpha: 0.06)),
      ),
    );
  }

  void _openDisha(BuildContext context, Child? activeChild) {
    Navigator.of(context).push(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => AssistantScreen.parent(
          parentName: context.read<AuthController>().parent?.name,
          childName: activeChild?.name,
        ),
      ),
    );
  }

  Widget _childGated(Child? activeChild, bool childLoading, Widget Function(Child) builder) {
    if (childLoading) {
      return const Scaffold(
        backgroundColor: AppColors.bg,
        body: Center(child: CircularProgressIndicator(color: AppColors.cyan)),
      );
    }
    if (activeChild == null) {
      return const Scaffold(
        backgroundColor: AppColors.bg,
        body: SafeArea(
          child: Padding(
            padding: EdgeInsets.all(20),
            child: Center(
              child: EmptyState(
                icon: Icons.link_off,
                title: 'No child connected yet',
                subtitle: 'Pair a child device to manage tasks and see insights.',
              ),
            ),
          ),
        ),
      );
    }
    return builder(activeChild);
  }
}

// ── Child Switcher (header) ───────────────────────────────────────────────────

class _ChildSwitcher extends StatelessWidget {
  const _ChildSwitcher({required this.activeChild, required this.children, required this.onSelect});
  final Child? activeChild;
  final List<Child> children;
  final ValueChanged<Child> onSelect;

  @override
  Widget build(BuildContext context) {
    if (children.isEmpty) {
      return const Row(
        children: [
          SvgPicture.asset('assets/icons/shield.svg', width: 18, height: 18, colorFilter: const ColorFilter.mode(AppColors.cyan, BlendMode.srcIn)),
          SizedBox(width: 8),
          Text('AlphaGuard', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white)),
        ],
      );
    }

    if (children.length == 1) {
      return Row(
        children: [
          Container(
            width: 30, height: 30,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.cyan.withValues(alpha: 0.15),
              border: Border.all(color: AppColors.cyan.withValues(alpha: 0.3)),
            ),
            child: const Icon(Icons.person_outline, color: AppColors.cyan, size: 16),
          ),
          const SizedBox(width: 10),
          Text(activeChild?.name ?? 'No child', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white)),
        ],
      );
    }

    // Multiple children — show dropdown switcher.
    return PopupMenuButton<Child>(
      onSelected: onSelect,
      color: const Color(0xFF0B0C14),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 30, height: 30,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.cyan.withValues(alpha: 0.15),
              border: Border.all(color: AppColors.cyan.withValues(alpha: 0.3)),
            ),
            child: const Icon(Icons.person_outline, color: AppColors.cyan, size: 16),
          ),
          const SizedBox(width: 8),
          Text(activeChild?.name ?? 'Select child', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white)),
          const SizedBox(width: 4),
          const Icon(Icons.expand_more, color: AppColors.textMuted, size: 18),
        ],
      ),
      itemBuilder: (_) => children.map((c) => PopupMenuItem<Child>(
        value: c,
        child: Text(c.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
      )).toList(),
    );
  }
}

// ── Floating DISHA bubble ─────────────────────────────────────────────────────

class _DishaBubble extends StatefulWidget {
  @override
  State<_DishaBubble> createState() => _DishaBubbleState();
}

class _DishaBubbleState extends State<_DishaBubble> with SingleTickerProviderStateMixin {
  late final AnimationController _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 2400))..repeat(reverse: true);
  late final Animation<double> _glow = Tween<double>(begin: 0.4, end: 0.8).animate(CurvedAnimation(parent: _pulse, curve: Curves.easeInOut));

  @override
  void dispose() { _pulse.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _glow,
    builder: (_, __) => Container(
      width: 52, height: 52,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: const LinearGradient(
          colors: [Color(0xFFA855F7), Color(0xFF06B6D4)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFA855F7).withValues(alpha: _glow.value),
            blurRadius: 18,
            spreadRadius: 2,
          ),
        ],
      ),
      child: const Icon(Icons.auto_awesome, color: Colors.white, size: 24),
    ),
  );
}
