import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

import '../../core/responsive/responsive.dart';
import '../../core/theme/app_colors.dart';

/// Welcome — first screen a brand-new user sees.
/// Matches frontend-v2 /welcome: hero logo, "Protect What Matters Most"
/// gradient headline, subtitle, Get Started CTA, and a legal footer row.
class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});
  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> with TickerProviderStateMixin {
  late final AnimationController _float = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 3600),
  )..repeat(reverse: true);

  late final AnimationController _glow = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 3600),
  )..repeat(reverse: true);

  late final Animation<double> _floatY =
      Tween<double>(begin: 0, end: -7).animate(CurvedAnimation(parent: _float, curve: Curves.easeInOut));

  late final Animation<double> _glowOp =
      Tween<double>(begin: 0.55, end: 0.85).animate(CurvedAnimation(parent: _glow, curve: Curves.easeInOut));

  @override
  void dispose() {
    _float.dispose();
    _glow.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final safe = MediaQuery.of(context).padding;
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: ResponsiveShell(
        child: Column(
          children: [
            SizedBox(height: safe.top + 8),
            // ── Hero ──────────────────────────────────────────────────────
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildLogoMark(context),
                  _buildCopy(context),
                ],
              ),
            ),
            // ── CTA ───────────────────────────────────────────────────────
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => context.go('/onboarding'),
                icon: const Icon(Icons.arrow_forward_ios_rounded, size: 16),
                label: const Text('Get Started', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.blue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                ),
              ),
            ),
            const SizedBox(height: 22),
            // ── Legal footer ──────────────────────────────────────────────
            Wrap(
              alignment: WrapAlignment.center,
              spacing: 14,
              runSpacing: 4,
              children: [
                for (final item in [
                  ('Privacy', '/support/privacy'),
                  ('Terms', '/support/terms'),
                  ('Child Safety', '/support/child-safety'),
                  ('Data Deletion', '/support/privacy'),
                  ('Support', '/support/manual'),
                ])
                  GestureDetector(
                    onTap: () => context.push(item.$2),
                    child: Text(
                      item.$1,
                      style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: Color(0xFF64748B)),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 6),
            const Text(
              '© 2026 AlphaGuard AI, Inc.',
              style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: Color(0xFF475569)),
            ),
            SizedBox(height: safe.bottom + 20),
          ],
        ),
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
            // Glow bloom
            Opacity(
              opacity: _glowOp.value * 0.55,
              child: Container(
                width: sz * 2.1,
                height: sz * 2.1,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(colors: [Color(0xFF2563EB), Colors.transparent], stops: [0.0, 1.0]),
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
                border: Border.all(color: const Color(0x4D4497FF)),
                boxShadow: const [BoxShadow(color: Color(0x662563EB), blurRadius: 60, spreadRadius: 0)],
              ),
              child: Center(
                child: SvgPicture.asset(
                  'assets/icons/shield_check.svg',
                  width: sz * 0.50,
                  height: sz * 0.50,
                  colorFilter: const ColorFilter.mode(Color(0xFF22D3EE), BlendMode.srcIn),
                ),
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
        Text(
          'ALPHAGUARD AI',
          style: TextStyle(
            fontSize: context.clampScale(10, 12),
            fontWeight: FontWeight.w900,
            color: AppColors.cyan.withValues(alpha: 0.8),
            letterSpacing: 5.5,
          ),
        ),
        SizedBox(height: context.clampScale(14, 20)),
        ShaderMask(
          shaderCallback: (bounds) => const LinearGradient(
            colors: [Color(0xFF818CF8), Color(0xFF2563EB), Color(0xFF06B6D4)],
          ).createShader(bounds),
          child: Text(
            'Protect What\nMatters Most',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: context.clampScale(30, 38),
              fontWeight: FontWeight.w900,
              color: Colors.white,
              height: 1.12,
              letterSpacing: -0.5,
            ),
          ),
        ),
        SizedBox(height: context.clampScale(14, 20)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'AI powered protection, real time awareness, family location tracking, smart alerts, and complete peace of mind in one secure platform.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: context.clampScale(13.5, 16),
              color: const Color(0xFF94A3B8),
              fontWeight: FontWeight.w500,
              height: 1.6,
            ),
          ),
        ),
      ],
    );
  }
}
