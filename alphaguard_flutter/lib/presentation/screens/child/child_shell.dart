import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../services/location/android_agent_bridge.dart';
import '../../../services/location/child_location_service.dart';
import '../../../services/push/push_service.dart';
import '../../../state/auth_controller.dart';
import '../achievements/achievements_screen.dart';
import 'android_agent_onboarding_screen.dart';
import 'child_dashboard.dart';
import 'child_rewards_screen.dart';
import 'child_sos_screen.dart';
import 'child_tasks_screen.dart';

/// Child bottom-navigation shell — matches frontend-v2 child nav exactly:
///
///   [Home] [Tasks]  [🔴 SOS]  [Rewards] [Achievements]
///                  (raised, pulsing red — opens SOS screen)
///
/// SOS is NOT a tab — it opens ChildSosScreen as a push route, keeping
/// the underlying tab unchanged (same pattern as /child/app/sos in frontend-v2).
class ChildShell extends StatefulWidget {
  const ChildShell({super.key});
  @override
  State<ChildShell> createState() => _ChildShellState();
}

class _ChildShellState extends State<ChildShell> {
  int _index = 0; // 0=Home, 1=Tasks, 2=Rewards, 3=Achievements
  ChildLocationService? _location;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) return;
      context.read<PushService>().registerForUser();
      _location = context.read<ChildLocationService>()..start();

      final status = await AndroidAgentBridge.getTrackingStatus();
      final hasFine = status.locationPermission == 'granted';
      final hasBg = status.backgroundLocationPermission == 'granted';
      final hasUsage = status.usageAccessPermission == 'granted';

      if ((!hasFine || !hasBg || !hasUsage) && mounted) {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const AndroidAgentOnboardingScreen()),
        );
      }
    });
  }

  @override
  void dispose() {
    _location?.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthController>();
    final childId = auth.child?.id;
    final childName = auth.child?.name;
    final pairingId = auth.pairingId;

    if (childId == null) {
      return const Scaffold(
        backgroundColor: AppColors.bg,
        body: Center(child: Text('Not connected', style: TextStyle(color: AppColors.textMuted))),
      );
    }

    final tabs = <Widget>[
      ChildDashboard(childId: childId, childName: childName),
      ChildTasksScreen(childId: childId),
      ChildRewardsScreen(childId: childId),
      AchievementsScreen(childId: childId, childName: childName),
    ];

    final safeBottom = MediaQuery.of(context).padding.bottom;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: IndexedStack(index: _index, children: tabs),
      extendBody: true,
      bottomNavigationBar: _ChildBottomNav(
        index: _index,
        safeBottom: safeBottom,
        onTabChanged: (i) => setState(() => _index = i),
        onSos: () => Navigator.of(context).push(
          MaterialPageRoute(
            fullscreenDialog: true,
            builder: (_) => const ChildSosScreen(),
          ),
        ),
      ),
    );
  }
}

// ── Custom child bottom nav with raised SOS ───────────────────────────────────

class _ChildBottomNav extends StatelessWidget {
  const _ChildBottomNav({
    required this.index,
    required this.safeBottom,
    required this.onTabChanged,
    required this.onSos,
  });
  final int index;
  final double safeBottom;
  final ValueChanged<int> onTabChanged;
  final VoidCallback onSos;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 68 + safeBottom,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.topCenter,
        children: [
          // ── Nav bar background ──────────────────────────────────────────
          Positioned(
            left: 0, right: 0, bottom: 0,
            child: Container(
              height: 68 + safeBottom,
              decoration: BoxDecoration(
                color: AppColors.bgElevated,
                border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.07))),
              ),
            ),
          ),
          // ── 4 tabs (2 left, gap in center, 2 right) ────────────────────
          Positioned(
            left: 0, right: 0, top: 0,
            child: SizedBox(
              height: 68,
              child: Row(
                children: [
                  // Left pair: Home + Tasks
                  Expanded(
                    child: Row(
                      children: [
                        _NavItem(icon: Icons.home_outlined, selectedIcon: Icons.home_rounded, label: 'Home', active: index == 0, onTap: () => onTabChanged(0)),
                        _NavItem(icon: Icons.checklist_outlined, selectedIcon: Icons.checklist, label: 'Tasks', active: index == 1, onTap: () => onTabChanged(1)),
                      ],
                    ),
                  ),
                  // Center gap for raised SOS button
                  const SizedBox(width: 72),
                  // Right pair: Rewards + Achievements
                  Expanded(
                    child: Row(
                      children: [
                        _NavItem(icon: Icons.card_giftcard_outlined, selectedIcon: Icons.card_giftcard, label: 'Rewards', active: index == 2, onTap: () => onTabChanged(2)),
                        _NavItem(icon: Icons.emoji_events_outlined, selectedIcon: Icons.emoji_events, label: 'Awards', active: index == 3, onTap: () => onTabChanged(3)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          // ── Raised SOS button (center, lifted above bar) ───────────────
          Positioned(
            top: -22,
            child: GestureDetector(
              onTap: onSos,
              child: const _SosFab(),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Nav item ──────────────────────────────────────────────────────────────────

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.active,
    required this.onTap,
  });
  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Expanded(
    child: GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 36, height: 36,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              color: active ? AppColors.cyan.withValues(alpha: 0.15) : Colors.transparent,
            ),
            child: Icon(
              active ? selectedIcon : icon,
              color: active ? AppColors.cyan : AppColors.textMuted,
              size: 22,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: active ? AppColors.cyan : AppColors.textMuted,
            ),
          ),
        ],
      ),
    ),
  );
}

// ── SOS FAB ───────────────────────────────────────────────────────────────────

class _SosFab extends StatefulWidget {
  const _SosFab();
  @override
  State<_SosFab> createState() => _SosFabState();
}

class _SosFabState extends State<_SosFab> with SingleTickerProviderStateMixin {
  late final AnimationController _pulse = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  )..repeat(reverse: true);

  late final Animation<double> _scale = Tween<double>(begin: 1.0, end: 1.10)
      .animate(CurvedAnimation(parent: _pulse, curve: Curves.easeInOut));

  late final Animation<double> _glow = Tween<double>(begin: 0.45, end: 0.75)
      .animate(CurvedAnimation(parent: _pulse, curve: Curves.easeInOut));

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _pulse,
    builder: (_, __) => Transform.scale(
      scale: _scale.value,
      child: Container(
        width: 60, height: 60,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: const LinearGradient(
            colors: [Color(0xFFE11D48), Color(0xFFF43F5E)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFF43F5E).withValues(alpha: _glow.value),
              blurRadius: 22,
              spreadRadius: 4,
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.sos_outlined, color: Colors.white, size: 24),
            Text('SOS', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1.5)),
          ],
        ),
      ),
    ),
  );
}
