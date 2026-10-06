import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

import '../../core/responsive/responsive.dart';
import '../../core/theme/app_colors.dart';
import '../widgets/app_logo.dart';

class RoleSelectionScreen extends StatefulWidget {
  const RoleSelectionScreen({super.key});
  @override
  State<RoleSelectionScreen> createState() => _RoleSelectionScreenState();
}

enum _Role { parent, child }

class _RoleSelectionScreenState extends State<RoleSelectionScreen> with SingleTickerProviderStateMixin {
  _Role? _picked;
  late final AnimationController _enter = AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
  late final Animation<double> _fade = CurvedAnimation(parent: _enter, curve: Curves.easeOut);

  Color get _accent => _picked == _Role.parent ? const Color(0xFF4F46E5) : const Color(0xFF06B6D4);

  @override
  void initState() { super.initState(); _enter.forward(); }
  @override
  void dispose() { _enter.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final safe = MediaQuery.of(context).padding;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Stack(
        children: [
          // Ambient glow reacts to selection
          if (_picked != null)
            AnimatedPositioned(
              duration: const Duration(milliseconds: 500),
              top: -60, left: 0, right: 0,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 400),
                height: 320,
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    colors: [_accent.withValues(alpha: 0.16), Colors.transparent],
                    radius: 1.1,
                  ),
                ),
              ),
            ),

          // Content
          ResponsiveShell(
            child: FadeTransition(
              opacity: _fade,
              child: Column(
                children: [
                  const SizedBox(height: 8),

                  // Back
                  Align(
                    alignment: Alignment.centerLeft,
                    child: GestureDetector(
                      onTap: () => context.pop(),
                      child: Container(
                        width: 48, height: 48,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.09)),
                          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.20), blurRadius: 10, offset: const Offset(0, 3))],
                        ),
                        child: const Icon(Icons.chevron_left_rounded, color: Color(0xFFCBD5E1), size: 24),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  const AppLogo(showName: false, logoSize: 52),
                  const SizedBox(height: 16),

                  ShaderMask(
                    shaderCallback: (b) => AppColors.heroGradient.createShader(b),
                    child: Text(
                      'How will you use\nAlphaGuard?',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: context.clampScale(24, 30),
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        height: 1.15,
                        letterSpacing: -0.4,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Choose how you would like to set up this device.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                  ),
                  const SizedBox(height: 18),

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
                        const SizedBox(height: 14),
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
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569)),
                  ),
                  const SizedBox(height: 14),

                  // Continue CTA
                  AnimatedOpacity(
                    opacity: _picked != null ? 1.0 : 0.38,
                    duration: const Duration(milliseconds: 200),
                    child: GestureDetector(
                      onTap: _picked == null
                          ? null
                          : () {
                              if (_picked == _Role.parent) {
                                context.push('/login');
                              } else {
                                context.push('/child-setup');
                              }
                            },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        width: double.infinity,
                        height: 58,
                        decoration: BoxDecoration(
                          gradient: _picked != null
                              ? LinearGradient(
                                  colors: [_accent, Color.lerp(_accent, AppColors.cyan, 0.35)!],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                )
                              : const LinearGradient(colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)]),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.15), width: 0.8),
                          boxShadow: _picked != null
                              ? [BoxShadow(color: _accent.withValues(alpha: 0.42), blurRadius: 26, offset: const Offset(0, 8))]
                              : [],
                        ),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            Positioned(
                              top: 0, left: 0, right: 0,
                              child: Container(
                                height: 28,
                                decoration: BoxDecoration(
                                  borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
                                  gradient: LinearGradient(
                                    begin: Alignment.topCenter,
                                    end: Alignment.bottomCenter,
                                    colors: [Colors.white.withValues(alpha: 0.14), Colors.transparent],
                                  ),
                                ),
                              ),
                            ),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  _picked == _Role.parent
                                      ? 'Continue as Parent'
                                      : _picked == _Role.child
                                          ? 'Continue as Child Device'
                                          : 'Continue',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 16,
                                    letterSpacing: 0.1,
                                  ),
                                ),
                                const SizedBox(width: 10),
                                const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 18),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  SizedBox(height: safe.bottom + 20),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Premium role card ─────────────────────────────────────────────────────────

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
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          color: Colors.white.withValues(alpha: selected ? 0.07 : 0.04),
          border: Border.all(
            color: selected
                ? accent.withValues(alpha: 0.55)
                : Colors.white.withValues(alpha: 0.09),
            width: selected ? 1.5 : 1,
          ),
          boxShadow: selected
              ? [
                  BoxShadow(color: accent.withValues(alpha: 0.28), blurRadius: 40, offset: const Offset(0, 12)),
                  BoxShadow(color: Colors.black.withValues(alpha: 0.25), blurRadius: 16, offset: const Offset(0, 4)),
                ]
              : [BoxShadow(color: Colors.black.withValues(alpha: 0.18), blurRadius: 10, offset: const Offset(0, 3))],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(28),
          child: Column(
            children: [
              // Illustration band — glass tinted
              AnimatedOpacity(
                opacity: (!anyPicked || selected) ? 1.0 : 0.45,
                duration: const Duration(milliseconds: 200),
                child: Container(
                  height: 118,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        accent.withValues(alpha: 0.14),
                        accent.withValues(alpha: 0.04),
                        Colors.transparent,
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Stack(
                    children: [
                      // Top highlight
                      Positioned(
                        top: 0, left: 0, right: 0,
                        child: Container(
                          height: 40,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [Colors.white.withValues(alpha: 0.07), Colors.transparent],
                            ),
                          ),
                        ),
                      ),
                      Center(child: art),
                    ],
                  ),
                ),
              ),

              // Body
              Container(
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.25),
                  border: Border(
                    top: BorderSide(color: accent.withValues(alpha: selected ? 0.18 : 0.06)),
                  ),
                ),
                padding: const EdgeInsets.fromLTRB(20, 16, 16, 18),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(children: [
                            Container(
                              width: 8, height: 8,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: accent,
                                boxShadow: selected ? [BoxShadow(color: accent.withValues(alpha: 0.6), blurRadius: 6)] : [],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              title,
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white, height: 1.2),
                            ),
                          ]),
                          const SizedBox(height: 7),
                          Text(
                            desc,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF94A3B8), height: 1.5),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 14),
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 220),
                      width: 26, height: 26,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: selected ? accent : Colors.transparent,
                        border: Border.all(
                          color: selected ? Colors.transparent : Colors.white.withValues(alpha: 0.18),
                          width: 2,
                        ),
                        boxShadow: selected
                            ? [BoxShadow(color: accent.withValues(alpha: 0.50), blurRadius: 10)]
                            : [],
                      ),
                      child: selected
                          ? const Icon(Icons.check_rounded, color: Colors.white, size: 14)
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

// ── Illustrations (unchanged logic, enhanced visuals) ─────────────────────────

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
  late final Animation<double> _opacity = Tween<double>(begin: 0.55, end: widget.active ? 0.90 : 0.65)
      .animate(CurvedAnimation(parent: _pulse, curve: Curves.easeInOut));

  @override
  void dispose() { _pulse.dispose(); _float.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: Listenable.merge([_opacity, _floatY]),
    builder: (_, __) => SizedBox(
      width: 140, height: 80,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Opacity(
            opacity: _opacity.value,
            child: Container(
              width: 88, height: 88,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: widget.accent.withValues(alpha: 0.18),
                boxShadow: [BoxShadow(color: widget.accent.withValues(alpha: 0.30), blurRadius: 30)],
              ),
            ),
          ),
          Transform.translate(
            offset: Offset(0, _floatY.value),
            child: Container(
              width: 58, height: 58,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(17),
                color: widget.accent.withValues(alpha: 0.15),
                border: Border.all(color: widget.accent.withValues(alpha: 0.40)),
                boxShadow: widget.active ? [BoxShadow(color: widget.accent.withValues(alpha: 0.35), blurRadius: 20)] : [],
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Positioned(
                    top: 0, left: 0, right: 0,
                    child: Container(
                      height: 26,
                      decoration: BoxDecoration(
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(17)),
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [Colors.white.withValues(alpha: 0.14), Colors.transparent],
                        ),
                      ),
                    ),
                  ),
                  SvgPicture.asset('assets/icons/alphaguard_logo.svg', width: 34, height: 34),
                ],
              ),
            ),
          ),
          Positioned(
            right: 0, top: 4,
            child: Transform.translate(
              offset: Offset(0, _floatY.value),
              child: Container(
                width: 36, height: 36,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(11),
                  color: Colors.white.withValues(alpha: 0.06),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.11)),
                ),
                child: Icon(Icons.location_on_outlined, color: widget.accent, size: 16),
              ),
            ),
          ),
          Positioned(
            left: 0, bottom: 4,
            child: Container(
              width: 36, height: 36,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(11),
                color: Colors.white.withValues(alpha: 0.06),
                border: Border.all(color: Colors.white.withValues(alpha: 0.11)),
              ),
              child: const Icon(Icons.people_outline, color: Color(0xFFCBD5E1), size: 16),
            ),
          ),
        ],
      ),
    ),
  );
}

class _ChildArt extends StatefulWidget {
  const _ChildArt({required this.accent, required this.active});
  final Color accent;
  final bool active;
  @override
  State<_ChildArt> createState() => _ChildArtState();
}

class _ChildArtState extends State<_ChildArt> with TickerProviderStateMixin {
  late final AnimationController _ring  = AnimationController(vsync: this, duration: const Duration(milliseconds: 2200))..repeat();
  late final AnimationController _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 3000))..repeat(reverse: true);
  late final Animation<double> _ringScale = Tween<double>(begin: 1.0, end: 1.7).animate(CurvedAnimation(parent: _ring, curve: Curves.easeOut));
  late final Animation<double> _ringOp   = Tween<double>(begin: 0.5, end: 0.0).animate(CurvedAnimation(parent: _ring, curve: Curves.easeOut));

  @override
  void dispose() { _ring.dispose(); _pulse.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: Listenable.merge([_ringScale, _ringOp]),
    builder: (_, __) => SizedBox(
      width: 140, height: 80,
      child: Stack(
        alignment: Alignment.center,
        children: [
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
          Container(
            width: 46, height: 74,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              color: const Color(0xFF080910),
              border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
              boxShadow: const [BoxShadow(color: Colors.black38, blurRadius: 20, offset: Offset(0, 8))],
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Positioned(
                  top: 0, left: 0, right: 0,
                  child: Container(
                    height: 22,
                    decoration: BoxDecoration(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.white.withValues(alpha: 0.09), Colors.transparent],
                      ),
                    ),
                  ),
                ),
                SvgPicture.asset(
                  'assets/icons/alphaguard_logo_mono.svg',
                  width: 20, height: 20,
                  colorFilter: ColorFilter.mode(widget.accent, BlendMode.srcIn),
                ),
              ],
            ),
          ),
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
                  width: 34, height: 34,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    color: Colors.white.withValues(alpha: 0.06),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.11)),
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
