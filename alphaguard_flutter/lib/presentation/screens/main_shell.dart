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

class MainShell extends StatefulWidget {
  const MainShell({super.key});
  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  double _dishaRight  = 16;
  double _dishaBottom = 0;
  bool _dishaPosSet   = false;

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
    final familyCtrl  = context.watch<FamilyController>();
    final notifCtrl   = context.watch<NotificationController>();
    final activeChild = familyCtrl.selectedChild;
    final childLoading = familyCtrl.loading;
    final unreadCount  = notifCtrl.unreadCount;
    final safeBottom   = MediaQuery.of(context).padding.bottom;
    const navH = 68.0;
    final totalNavH = navH + safeBottom;

    if (!_dishaPosSet) {
      _dishaBottom = totalNavH + 14;
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
          extendBody: true,
          appBar: _buildHeader(context, activeChild, familyCtrl, unreadCount),
          body: IndexedStack(index: _index, children: tabs),
          bottomNavigationBar: _PremiumNavBar(
            index: _index,
            unread: unreadCount,
            onSelect: (i) => setState(() => _index = i),
            safeBottom: safeBottom,
          ),
        ),
        // DISHA floating bubble
        Positioned(
          right: _dishaRight,
          bottom: _dishaBottom,
          child: GestureDetector(
            onTap: () => _openDisha(context, activeChild),
            onPanUpdate: (d) => setState(() {
              _dishaRight  = (_dishaRight  - d.delta.dx).clamp(8, 200);
              _dishaBottom = (_dishaBottom - d.delta.dy).clamp(totalNavH + 8, 600);
            }),
            child: const _DishaBubble(),
          ),
        ),
      ],
    );
  }

  PreferredSizeWidget _buildHeader(
    BuildContext context, Child? activeChild, FamilyController familyCtrl, int unreadCount,
  ) {
    return PreferredSize(
      preferredSize: const Size.fromHeight(64),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.bg.withValues(alpha: 0.92),
          border: Border(bottom: BorderSide(color: Colors.white.withValues(alpha: 0.06))),
        ),
        child: SafeArea(
          bottom: false,
          child: SizedBox(
            height: 64,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Expanded(
                    child: _ChildSwitcher(
                      activeChild: activeChild,
                      children: familyCtrl.children,
                      onSelect: familyCtrl.selectChild,
                    ),
                  ),
                  // Notification bell
                  GestureDetector(
                    onTap: () => Navigator.of(context).pushNamed('/notifications'),
                    child: Container(
                      width: 42, height: 42,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.09)),
                      ),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          const Icon(Icons.notifications_outlined, color: AppColors.textSecondary, size: 21),
                          if (unreadCount > 0)
                            Positioned(
                              top: 7, right: 7,
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
              ),
            ),
          ),
        ),
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

// ── Premium glass bottom nav ──────────────────────────────────────────────────

class _PremiumNavBar extends StatelessWidget {
  const _PremiumNavBar({
    required this.index,
    required this.unread,
    required this.onSelect,
    required this.safeBottom,
  });
  final int index;
  final int unread;
  final ValueChanged<int> onSelect;
  final double safeBottom;

  static const _items = [
    (Icons.grid_view_outlined,      Icons.grid_view_rounded,         'Home'),
    (Icons.checklist_outlined,      Icons.checklist_rounded,         'Tasks'),
    (Icons.location_on_outlined,    Icons.location_on_rounded,       'Location'),
    (Icons.auto_awesome_outlined,   Icons.auto_awesome_rounded,      'Reports'),
    (Icons.settings_outlined,       Icons.settings_rounded,          'Settings'),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 68 + safeBottom,
      padding: EdgeInsets.only(bottom: safeBottom, left: 8, right: 8),
      decoration: BoxDecoration(
        color: AppColors.bgElevated.withValues(alpha: 0.95),
        border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.07))),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.30), blurRadius: 20, offset: const Offset(0, -4))],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: List.generate(_items.length, (i) {
          final item = _items[i];
          final active = i == index;
          return GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => onSelect(i),
            child: SizedBox(
              width: 56,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 220),
                    width: active ? 42 : 36,
                    height: active ? 42 : 36,
                    decoration: BoxDecoration(
                      color: active ? AppColors.cyan.withValues(alpha: 0.14) : Colors.transparent,
                      borderRadius: BorderRadius.circular(active ? 14 : 12),
                      border: active ? Border.all(color: AppColors.cyan.withValues(alpha: 0.25)) : null,
                    ),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        Icon(
                          active ? item.$2 : item.$1,
                          size: 20,
                          color: active ? AppColors.cyan : AppColors.textMuted,
                        ),
                        if (i == 0 && unread > 0 && !active)
                          Positioned(
                            top: 4, right: 4,
                            child: Container(
                              width: 8, height: 8,
                              decoration: const BoxDecoration(shape: BoxShape.circle, color: AppColors.danger),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 3),
                  AnimatedDefaultTextStyle(
                    duration: const Duration(milliseconds: 200),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: active ? FontWeight.w800 : FontWeight.w600,
                      color: active ? AppColors.cyan : AppColors.textMuted,
                    ),
                    child: Text(item.$3),
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}

// ── Child Switcher ────────────────────────────────────────────────────────────

class _ChildSwitcher extends StatelessWidget {
  const _ChildSwitcher({required this.activeChild, required this.children, required this.onSelect});
  final Child? activeChild;
  final List<Child> children;
  final ValueChanged<Child> onSelect;

  @override
  Widget build(BuildContext context) {
    if (children.isEmpty) {
      return Row(children: [
        SvgPicture.asset('assets/icons/alphaguard_logo_mono.svg', width: 18, height: 18,
            colorFilter: const ColorFilter.mode(AppColors.cyan, BlendMode.srcIn)),
        const SizedBox(width: 8),
        const Text('AlphaGuard', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white)),
      ]);
    }

    if (children.length == 1) {
      return Row(children: [
        Container(
          width: 32, height: 32,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: AppColors.cyan.withValues(alpha: 0.14),
            border: Border.all(color: AppColors.cyan.withValues(alpha: 0.28)),
          ),
          child: const Icon(Icons.person_outline, color: AppColors.cyan, size: 16),
        ),
        const SizedBox(width: 10),
        Text(activeChild?.name ?? 'No child', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white)),
      ]);
    }

    return PopupMenuButton<Child>(
      onSelected: onSelect,
      color: const Color(0xFF0B0C14),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.cyan.withValues(alpha: 0.14),
              border: Border.all(color: AppColors.cyan.withValues(alpha: 0.28)),
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

// ── DISHA bubble ──────────────────────────────────────────────────────────────

class _DishaBubble extends StatefulWidget {
  const _DishaBubble();
  @override
  State<_DishaBubble> createState() => _DishaBubbleState();
}

class _DishaBubbleState extends State<_DishaBubble> with TickerProviderStateMixin {
  late final AnimationController _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 2400))..repeat(reverse: true);
  late final AnimationController _float = AnimationController(vsync: this, duration: const Duration(milliseconds: 2800))..repeat(reverse: true);
  late final Animation<double> _glow  = Tween<double>(begin: 0.35, end: 0.75).animate(CurvedAnimation(parent: _pulse, curve: Curves.easeInOut));
  late final Animation<double> _floatY = Tween<double>(begin: 0, end: -3).animate(CurvedAnimation(parent: _float, curve: Curves.easeInOut));

  @override
  void dispose() { _pulse.dispose(); _float.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: Listenable.merge([_glow, _floatY]),
    builder: (_, __) => Transform.translate(
      offset: Offset(0, _floatY.value),
      child: Container(
        width: 56, height: 56,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: const LinearGradient(
            colors: [Color(0xFFA855F7), Color(0xFF06B6D4)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          border: Border.all(color: Colors.white.withValues(alpha: 0.20), width: 1),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFA855F7).withValues(alpha: _glow.value),
              blurRadius: 22,
              spreadRadius: 2,
            ),
            BoxShadow(color: Colors.black.withValues(alpha: 0.30), blurRadius: 10, offset: const Offset(0, 4)),
          ],
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Positioned(
              top: 0, left: 0, right: 0,
              child: Container(
                height: 26,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.white.withValues(alpha: 0.20), Colors.transparent],
                  ),
                ),
              ),
            ),
            const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 24),
          ],
        ),
      ),
    ),
  );
}
