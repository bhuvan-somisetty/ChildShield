import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

import '../../core/responsive/responsive.dart';
import '../../core/theme/app_colors.dart';
import '../widgets/app_logo.dart';

/// Role selection — matches frontend-v2 /role.
/// Two cards: Parent Mode (indigo) and Child Device (cyan).
/// Selected card gains accent glow + check mark. Continue is gated on selection.
class RoleSelectionScreen extends StatefulWidget {
  const RoleSelectionScreen({super.key});
  @override
  State<RoleSelectionScreen> createState() => _RoleSelectionScreenState();
}

enum _Role { parent, child }

class _RoleSelectionScreenState extends State<RoleSelectionScreen> {
  _Role? _picked;

  Color get _accent => _picked == _Role.parent ? const Color(0xFF4F46E5) : const Color(0xFF06B6D4);

  @override
  Widget build(BuildContext context) {
    final safe = MediaQuery.of(context).padding;
    final hasGlow = _picked != null;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Stack(
        children: [
          // Ambient glow background
          if (hasGlow)
            Positioned(
              top: -60,
              left: 0,
              right: 0,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 400),
                height: 300,
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    colors: [_accent.withValues(alpha: 0.18), Colors.transparent],
                    radius: 1.0,
                  ),
                ),
              ),
            ),
          // Content
          ResponsiveShell(
            child: Column(
              children: [
                SizedBox(height: safe.top + 8),
                // Back button
                Align(
                  alignment: Alignment.centerLeft,
                  child: GestureDetector(
                    onTap: () => context.go('/onboarding'),
                    child: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.10)),
                      ),
                      child: const Icon(Icons.chevron_left, color: Color(0xFFCBD5E1), size: 22),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                // Brand badge (icon only, no text)
                const AppLogo(showName: false, logoSize: 52),
                const SizedBox(height: 22),
                // Heading
                Text(
                  'How will you use\nAlphaGuard?',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: context.clampScale(24, 30),
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    height: 1.15,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Choose how you would like to set up this device.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 28),
                // Role cards
                Expanded(
                  child: ListView(
                    padding: EdgeInsets.zero,
                    children: [
                      _RoleCard(
                        title: 'Parent Mode',
                        desc: 'Monitor your family, receive safety alerts, and manage protection settings.',
                        accent: const Color(0xFF4F46E5),
                        selected: _picked == _Role.parent,
                        anyPicked: _picked != null,
                        art: _ParentArt(accent: const Color(0xFF4F46E5), active: _picked == _Role.parent),
                        onTap: () => setState(() => _picked = _Role.parent),
                      ),
                      const SizedBox(height: 16),
                      _RoleCard(
                        title: 'Child Device',
                        desc: 'Connect this device to a parent account and enable safety protection.',
                        accent: const Color(0xFF06B6D4),
                        selected: _picked == _Role.child,
                        anyPicked: _picked != null,
                        art: _ChildArt(accent: const Color(0xFF06B6D4), active: _picked == _Role.child),
                        onTap: () => setState(() => _picked = _Role.child),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'You can switch modes anytime',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF475569)),
                ),
                const SizedBox(height: 16),
                // Continue CTA
                SizedBox(
                  width: double.infinity,
                  child: AnimatedOpacity(
                    opacity: _picked != null ? 1.0 : 0.4,
                    duration: const Duration(milliseconds: 200),
                    child: ElevatedButton.icon(
                      onPressed: _picked == null
                          ? null
                          : () {
                              if (_picked == _Role.parent) {
                                context.go('/login');
                              } else {
                                context.go('/pair');
                              }
                            },
                      icon: const Icon(Icons.arrow_forward_ios_rounded, size: 16),
                      label: Text(
                        _picked == _Role.parent
                            ? 'Continue as Parent'
                            : _picked == _Role.child
                                ? 'Continue as Child Device'
                                : 'Continue',
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _picked != null ? _accent : AppColors.blue,
                        disabledBackgroundColor: AppColors.blue.withValues(alpha: 0.4),
                        foregroundColor: Colors.white,
                        disabledForegroundColor: Colors.white.withValues(alpha: 0.6),
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                      ),
                    ),
                  ),
                ),
                SizedBox(height: safe.bottom + 20),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Role card ────────────────────────────────────────────────────────────────

class _RoleCard extends StatelessWidget {
  const _RoleCard({
    required this.title,
    required this.desc,
    required this.accent,
    required this.selected,
    required this.anyPicked,
    required this.art,
    required this.onTap,
  });
  final String title;
  final String desc;
  final Color accent;
  final bool selected;
  final bool anyPicked;
  final Widget art;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOut,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(26),
          border: Border.all(
            color: selected ? Colors.white.withValues(alpha: 0.2) : Colors.white.withValues(alpha: 0.08),
          ),
          boxShadow: selected
              ? [BoxShadow(color: accent.withValues(alpha: 0.22), blurRadius: 40, spreadRadius: 0, offset: const Offset(0, 12))]
              : [],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(26),
          child: Column(
            children: [
              // Illustration band
              AnimatedOpacity(
                opacity: (!anyPicked || selected) ? 1.0 : 0.5,
                duration: const Duration(milliseconds: 200),
                child: Container(
                  height: 110,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [accent.withValues(alpha: 0.12), Colors.transparent],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Center(child: art),
                ),
              ),
              // Body
              Container(
                color: const Color(0xFF0B0C14),
                padding: const EdgeInsets.fromLTRB(20, 14, 16, 16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white, height: 1.2)),
                          const SizedBox(height: 6),
                          Text(desc, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF94A3B8), height: 1.45)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: selected ? Colors.transparent : Colors.white.withValues(alpha: 0.2),
                          width: 2,
                        ),
                        color: selected ? accent : Colors.transparent,
                      ),
                      child: selected
                          ? const Icon(Icons.check, color: Color(0xFF030307), size: 14)
                          : null,
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
}

// ── Illustrations ─────────────────────────────────────────────────────────────

class _ParentArt extends StatefulWidget {
  const _ParentArt({required this.accent, required this.active});
  final Color accent;
  final bool active;
  @override
  State<_ParentArt> createState() => _ParentArtState();
}

class _ParentArtState extends State<_ParentArt> with TickerProviderStateMixin {
  late final AnimationController _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 3000))..repeat(reverse: true);
  late final AnimationController _float = AnimationController(vsync: this, duration: const Duration(milliseconds: 2600))..repeat(reverse: true);
  late final Animation<double> _floatY = Tween<double>(begin: 0, end: -4).animate(CurvedAnimation(parent: _float, curve: Curves.easeInOut));
  late final Animation<double> _opacity = Tween<double>(begin: 0.6, end: widget.active ? 0.95 : 0.6)
      .animate(CurvedAnimation(parent: _pulse, curve: Curves.easeInOut));

  @override
  void dispose() { _pulse.dispose(); _float.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([_opacity, _floatY]),
      builder: (_, __) => SizedBox(
        width: 140,
        height: 80,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Glow
            Opacity(
              opacity: _opacity.value,
              child: Container(width: 80, height: 80, decoration: BoxDecoration(shape: BoxShape.circle, color: widget.accent.withValues(alpha: 0.2), boxShadow: [BoxShadow(color: widget.accent.withValues(alpha: 0.25), blurRadius: 26)])),
            ),
            // Shield box
            Transform.translate(
              offset: Offset(0, _floatY.value),
              child: Container(
                width: 56, height: 56,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  color: widget.accent.withValues(alpha: 0.15),
                  border: Border.all(color: widget.accent.withValues(alpha: 0.35)),
                  boxShadow: widget.active ? [BoxShadow(color: widget.accent.withValues(alpha: 0.35), blurRadius: 20)] : [],
                ),
                child: Center(
                  child: SvgPicture.asset(
                    'assets/icons/shield.svg',
                    width: 28, height: 28,
                    colorFilter: ColorFilter.mode(widget.accent, BlendMode.srcIn),
                  ),
                ),
              ),
            ),
            // MapPin badge
            Positioned(
              right: 0, top: 4,
              child: Transform.translate(
                offset: Offset(0, _floatY.value),
                child: Container(
                  width: 34, height: 34,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    color: Colors.white.withValues(alpha: 0.06),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
                  ),
                  child: Icon(Icons.location_on_outlined, color: widget.accent, size: 16),
                ),
              ),
            ),
            // Users badge
            Positioned(
              left: 0, bottom: 4,
              child: Container(
                width: 34, height: 34,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  color: Colors.white.withValues(alpha: 0.06),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
                ),
                child: const Icon(Icons.people_outline, color: Color(0xFFCBD5E1), size: 16),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ChildArt extends StatefulWidget {
  const _ChildArt({required this.accent, required this.active});
  final Color accent;
  final bool active;
  @override
  State<_ChildArt> createState() => _ChildArtState();
}

class _ChildArtState extends State<_ChildArt> with TickerProviderStateMixin {
  late final AnimationController _ring = AnimationController(vsync: this, duration: const Duration(milliseconds: 2200))..repeat();
  late final AnimationController _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 3000))..repeat(reverse: true);
  late final Animation<double> _ringScale = Tween<double>(begin: 1.0, end: 1.7).animate(CurvedAnimation(parent: _ring, curve: Curves.easeOut));
  late final Animation<double> _ringOp = Tween<double>(begin: 0.5, end: 0.0).animate(CurvedAnimation(parent: _ring, curve: Curves.easeOut));

  @override
  void dispose() { _ring.dispose(); _pulse.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([_ringScale, _ringOp]),
      builder: (_, __) => SizedBox(
        width: 140,
        height: 80,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Pulsing ring
            Transform.scale(
              scale: _ringScale.value,
              child: Opacity(
                opacity: _ringOp.value,
                child: Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: widget.accent, width: 1.5),
                  ),
                ),
              ),
            ),
            // Phone silhouette
            Container(
              width: 44, height: 72,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                color: const Color(0xFF0B0C14),
                border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                boxShadow: const [BoxShadow(color: Colors.black38, blurRadius: 20, offset: Offset(0, 8))],
              ),
              child: Center(
                child: SvgPicture.asset(
                  'assets/icons/shield.svg',
                  width: 20, height: 20,
                  colorFilter: ColorFilter.mode(widget.accent, BlendMode.srcIn),
                ),
              ),
            ),
            // Dots + lock
            Positioned(
              right: 0,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _Dot(accent: widget.accent, delay: 0),
                  const SizedBox(width: 4),
                  _Dot(accent: widget.accent, delay: 250),
                  const SizedBox(width: 6),
                  Container(
                    width: 32, height: 32,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      color: Colors.white.withValues(alpha: 0.06),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
                    ),
                    child: Icon(Icons.lock_outline, color: widget.accent, size: 14),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Dot extends StatefulWidget {
  const _Dot({required this.accent, required this.delay});
  final Color accent;
  final int delay;
  @override
  State<_Dot> createState() => _DotState();
}

class _DotState extends State<_Dot> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400))..repeat(reverse: true);
  late final Animation<double> _op = Tween<double>(begin: 0.3, end: 1.0).animate(CurvedAnimation(parent: _c, curve: Curves.easeInOut));

  @override
  void initState() {
    super.initState();
    Future.delayed(Duration(milliseconds: widget.delay), () { if (mounted) _c.forward(); });
  }

  @override
  void dispose() { _c.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _op,
    builder: (_, __) => Opacity(
      opacity: _op.value,
      child: Container(width: 6, height: 6, decoration: BoxDecoration(shape: BoxShape.circle, color: widget.accent)),
    ),
  );
}
