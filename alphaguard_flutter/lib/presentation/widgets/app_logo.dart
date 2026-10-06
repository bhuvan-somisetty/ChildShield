import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../core/responsive/responsive.dart';
import '../../core/theme/app_colors.dart';

/// Brand mark — used on splash, welcome, login, signup, role-selection.
/// Renders the exact lucide-react v1.17.0 Shield SVG (same asset as frontend-v2).
/// [logoSize] overrides the responsive clamp when a fixed size is needed (e.g. badge variant).
/// [showName] controls the text lockup beneath the icon.
class AppLogo extends StatelessWidget {
  const AppLogo({super.key, this.showName = true, this.logoSize});
  final bool showName;
  final double? logoSize;

  @override
  Widget build(BuildContext context) {
    final size = logoSize ?? context.clampScale(84, 120);
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0x402563EB), Color(0x1A06B6D4)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(size * 0.26),
            border: Border.all(color: const Color(0x4D3B82F6)),
            boxShadow: const [BoxShadow(color: Color(0x4D2563EB), blurRadius: 28)],
          ),
          child: Center(
            child: SvgPicture.asset(
              'assets/icons/alphaguard_logo.svg',
              width: size * 0.62,
              height: size * 0.62,
            ),
          ),
        ),
        if (showName) ...[
          SizedBox(height: context.clampScale(14, 22)),
          Text(
            'AlphaGuard AI',
            style: TextStyle(
              fontSize: context.clampScale(22, 30),
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'FAMILY SAFETY PLATFORM',
            style: TextStyle(
              fontSize: context.clampScale(9, 11),
              fontWeight: FontWeight.w800,
              color: AppColors.cyan.withValues(alpha: 0.7),
              letterSpacing: 3,
            ),
          ),
        ],
      ],
    );
  }
}
