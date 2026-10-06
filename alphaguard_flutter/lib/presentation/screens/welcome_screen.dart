import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

import '../../core/responsive/responsive.dart';
import '../../core/theme/app_colors.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});
  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> with TickerProviderStateMixin {
  late final AnimationController _float = AnimationController(vsync: this, duration: const Duration(milliseconds: 3600))..repeat(reverse: true);
  late final AnimationController _glow  = AnimationController(vsync: this, duration: const Duration(milliseconds: 3600))..repeat(reverse: true);
  late final AnimationController _enter = AnimationController(vsync: this, duration: const Duration(milliseconds: 800));
  late final AnimationController _orbs  = AnimationController(vsync: this, duration: const Duration(seconds: 12))..repeat();

  late final Animation<double> _floatY  = Tween<double>(begin: 0, end: -7).animate(CurvedAnimation(parent: _float, curve: Curves.easeInOut));
  late final Animation<double> _glowOp  = Tween<double>(begin: 0.45, end: 0.75).animate(CurvedAnimation(parent: _glow, curve: Curves.easeInOut));
  late final Animation<double> _fadeIn  = CurvedAnimation(parent: _enter, curve: Curves.easeOut);
  late final Animation<double> _slideUp = Tween<double>(begin: 24, end: 0).animate(CurvedAnimation(parent: _enter, curve: Curves.easeOut));

  bool _btnPressed = false;

  @override
  void initState() { super.initState(); _enter.forward(); }

  @override
  void dispose() { _float.dispose(); _glow.dispose(); _enter.dispose(); _orbs.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final safe = MediaQuery.of(context).padding;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Stack(
        children: [
          // ── Layered ambient orbs ─────────────────────────────────────────────
          AnimatedBuilder(
            animation: _orbs,
            builder: (_, __) => Stack(
              children: [
                Positioned(
                  top: -80, left: -60,
                  child: Container(
                    width: 320, height: 320,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(colors: [
                        const Color(0xFF2563EB).withValues(alpha: 0.14 + 0.04 * math.sin(_orbs.value * math.pi * 2)),
                        Colors.transparent,
                      ]),
                    ),
                  ),
                ),
                Positioned(
                  bottom: 100, right: -80,
                  child: Container(
                    width: 260, height: 260,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(colors: [
                        const Color(0xFF06B6D4).withValues(alpha: 0.10 + 0.04 * math.sin(_orbs.value * math.pi * 2 + 1.0)),
                        Colors.transparent,
                      ]),
                    ),
                  ),
                ),
                Positioned(
                  top: 200, right: 30,
                  child: Container(
                    width: 140, height: 140,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(colors: [
                        const Color(0xFF6366F1).withValues(alpha: 0.08),
                        Colors.transparent,
                      ]),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // ── Main content ─────────────────────────────────────────────────────
          ResponsiveShell(
            child: Column(
              children: [
                SizedBox(height: safe.top > 0 ? 12 : 20),
                Expanded(
                  child: FadeTransition(
                    opacity: _fadeIn,
                    child: AnimatedBuilder(
                      animation: _slideUp,
                      builder: (_, child) => Transform.translate(
                        offset: Offset(0, _slideUp.value),
                        child: child,
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          _buildLogoMark(context),
                          SizedBox(height: context.clampScale(18, 24)),
                          _buildCopy(context),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // ── Premium CTA button ────────────────────────────────────────
                FadeTransition(
                  opacity: _fadeIn,
                  child: GestureDetector(
                    onTapDown: (_) => setState(() => _btnPressed = true),
                    onTapUp: (_) {
                      setState(() => _btnPressed = false);
                      context.push('/onboarding');
                    },
                    onTapCancel: () => setState(() => _btnPressed = false),
                    child: AnimatedScale(
                      scale: _btnPressed ? 0.97 : 1.0,
                      duration: const Duration(milliseconds: 120),
                      child: Container(
                        width: double.infinity,
                        height: 58,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF06B6D4), Color(0xFF2563EB), Color(0xFF6366F1)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.18), width: 0.8),
                          boxShadow: [
                            BoxShadow(color: const Color(0xFF2563EB).withValues(alpha: 0.45), blurRadius: 28, offset: const Offset(0, 8)),
                            BoxShadow(color: Colors.black.withValues(alpha: 0.20), blurRadius: 8, offset: const Offset(0, 2)),
                          ],
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
                            const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'Get Started',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 17,
                                    letterSpacing: 0.1,
                                  ),
                                ),
                                SizedBox(width: 10),
                                Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 18),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 18),

                // ── Legal footer ──────────────────────────────────────────────
                FadeTransition(
                  opacity: _fadeIn,
                  child: Wrap(
                    alignment: WrapAlignment.center,
                    spacing: 14,
                    runSpacing: 4,
                    children: [
                      for (final item in [
                        ('Privacy', '/support/privacy'),
                        ('Terms', '/support/terms'),
                        ('Child Safety', '/support/child-safety'),
                        ('Data Deletion', '/support/data-deletion'),
                        ('Support', '/support/manual'),
                      ])
                        GestureDetector(
                          onTap: () => context.push(item.$2),
                          child: Text(
                            item.$1,
                            style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 5),
                const Text(
                  '© 2026 AlphaGuard AI, Inc.',
                  style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: Color(0xFF3D4758)),
                ),
                const SizedBox(height: 14),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLogoMark(BuildContext context) {
    final sz = context.clampScale(100, 132);
    return AnimatedBuilder(
      animation: Listenable.merge([_floatY, _glowOp]),
      builder: (_, __) => Transform.translate(
        offset: Offset(0, _floatY.value),
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Outer diffuse glow
            Opacity(
              opacity: _glowOp.value * 0.55,
              child: Container(
                width: sz * 2.2,
                height: sz * 2.2,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [Color(0xFF2563EB), Colors.transparent],
                    stops: [0.0, 0.70],
                  ),
                ),
              ),
            ),
            // Mid ring
            Opacity(
              opacity: _glowOp.value * 0.20,
              child: Container(
                width: sz * 1.5,
                height: sz * 1.5,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFF06B6D4), width: 1),
                ),
              ),
            ),
            // Shield box
            Container(
              width: sz,
              height: sz,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0x4D2563EB), Color(0x2606B6D4)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(sz * 0.27),
                border: Border.all(color: const Color(0x552563EB), width: 1.5),
                boxShadow: [
                  BoxShadow(color: const Color(0xFF2563EB).withValues(alpha: 0.45), blurRadius: 50),
                  BoxShadow(color: const Color(0xFF06B6D4).withValues(alpha: 0.15), blurRadius: 80),
                ],
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Inner top highlight
                  Positioned(
                    top: 0, left: 0, right: 0,
                    child: Container(
                      height: sz * 0.40,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.vertical(top: Radius.circular(sz * 0.27)),
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [Colors.white.withValues(alpha: 0.12), Colors.transparent],
                        ),
                      ),
                    ),
                  ),
                  SvgPicture.asset('assets/icons/alphaguard_logo.svg', width: sz * 0.62, height: sz * 0.62),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCopy(BuildContext context) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
          decoration: BoxDecoration(
            color: AppColors.cyan.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(99),
            border: Border.all(color: AppColors.cyan.withValues(alpha: 0.20)),
          ),
          child: Text(
            'ALPHAGUARD AI',
            style: TextStyle(
              fontSize: context.clampScale(10, 11),
              fontWeight: FontWeight.w900,
              color: AppColors.cyan.withValues(alpha: 0.90),
              letterSpacing: 4.5,
            ),
          ),
        ),
        SizedBox(height: context.clampScale(14, 20)),
        ShaderMask(
          shaderCallback: (bounds) => AppColors.heroGradient.createShader(bounds),
          child: Text(
            'Protect What\nMatters Most',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: context.clampScale(30, 38),
              fontWeight: FontWeight.w900,
              color: Colors.white,
              height: 1.12,
              letterSpacing: -0.6,
            ),
          ),
        ),
        SizedBox(height: context.clampScale(14, 20)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'AI-powered protection, real-time awareness, family location tracking, smart alerts, and complete peace of mind in one secure platform.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: context.clampScale(13.5, 16),
              color: const Color(0xFF94A3B8),
              fontWeight: FontWeight.w500,
              height: 1.65,
            ),
          ),
        ),
      ],
    );
  }
}
