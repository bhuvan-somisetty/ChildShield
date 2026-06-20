import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../core/theme/app_colors.dart';

/// Branded launch screen — matches frontend-v2 /splash exactly.
/// Ambient blue glow, scale+fade entrance, floating shield, loading dots.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with TickerProviderStateMixin {
  late final AnimationController _enter = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
  late final AnimationController _float = AnimationController(vsync: this, duration: const Duration(seconds: 3))..repeat(reverse: true);
  late final AnimationController _glow  = AnimationController(vsync: this, duration: const Duration(milliseconds: 2400))..repeat(reverse: true);

  late final Animation<double> _opacity = Tween<double>(begin: 0, end: 1).animate(CurvedAnimation(parent: _enter, curve: Curves.easeOut));
  late final Animation<double> _scale   = Tween<double>(begin: 0.92, end: 1).animate(CurvedAnimation(parent: _enter, curve: const Cubic(0.16, 1, 0.3, 1)));
  late final Animation<double> _floatY  = Tween<double>(begin: 0, end: -6).animate(CurvedAnimation(parent: _float, curve: Curves.easeInOut));
  late final Animation<double> _glowOp  = Tween<double>(begin: 0.18, end: 0.32).animate(CurvedAnimation(parent: _glow, curve: Curves.easeInOut));

  @override
  void initState() {
    super.initState();
    _enter.forward();
  }

  @override
  void dispose() {
    _enter.dispose();
    _float.dispose();
    _glow.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final safe = MediaQuery.of(context).padding;
    final logoSz = (size.width * 0.24).clamp(88.0, 116.0);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Stack(
        children: [
          // ── Ambient glow ─────────────────────────────────────────────────
          AnimatedBuilder(
            animation: _glowOp,
            builder: (_, __) => Center(
              child: Opacity(
                opacity: _glowOp.value,
                child: Container(
                  width: size.width * 0.80,
                  height: size.width * 0.80,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [Color(0xFF2563EB), Colors.transparent],
                      stops: [0.0, 0.65],
                    ),
                  ),
                ),
              ),
            ),
          ),

          // ── Logo + wordmark ───────────────────────────────────────────────
          AnimatedBuilder(
            animation: Listenable.merge([_opacity, _scale, _floatY]),
            builder: (_, __) => Opacity(
              opacity: _opacity.value,
              child: Transform.scale(
                scale: _scale.value,
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Shield box
                      Transform.translate(
                        offset: Offset(0, _floatY.value),
                        child: Container(
                          width: logoSz,
                          height: logoSz,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0x4D2563EB), Color(0x2606B6D4)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(logoSz * 0.265),
                            border: Border.all(color: const Color(0x4D4497FF)),
                            boxShadow: const [
                              BoxShadow(color: Color(0x662563EB), blurRadius: 60),
                            ],
                          ),
                          child: Center(
                            child: SvgPicture.asset(
                              'assets/icons/shield_check.svg',
                              width: logoSz * 0.46,
                              height: logoSz * 0.46,
                              colorFilter: const ColorFilter.mode(Color(0xFF22D3EE), BlendMode.srcIn),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'AlphaGuard AI',
                        style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -0.4),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'FAMILY SAFETY PLATFORM',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF22D3EEB3), letterSpacing: 4),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // ── Loading dots ─────────────────────────────────────────────────
          Positioned(
            bottom: safe.bottom + 48,
            left: 0, right: 0,
            child: FadeTransition(
              opacity: _opacity,
              child: const Center(child: _LoadingDots()),
            ),
          ),
        ],
      ),
    );
  }
}

class _LoadingDots extends StatefulWidget {
  const _LoadingDots();
  @override
  State<_LoadingDots> createState() => _LoadingDotsState();
}

class _LoadingDotsState extends State<_LoadingDots> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1100))..repeat();

  @override
  void dispose() { _c.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _c,
    builder: (_, __) => Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (i) {
        final t = ((_c.value + i * 0.18) % 1.0);
        final opacity = (0.3 + 0.7 * (1 - (t - 0.5).abs() * 2)).clamp(0.0, 1.0);
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Opacity(
            opacity: opacity,
            child: Container(width: 6, height: 6, decoration: const BoxDecoration(color: Color(0xFF22D3EEB3), shape: BoxShape.circle)),
          ),
        );
      }),
    ),
  );
}
