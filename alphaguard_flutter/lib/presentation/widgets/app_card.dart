import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Standard elevated card (matches the web `Card`). No fixed width/height.
class AppCard extends StatelessWidget {
  const AppCard({super.key, required this.child, this.padding = const EdgeInsets.all(16), this.onTap, this.borderColor});
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    final card = Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor ?? AppColors.border),
      ),
      child: child,
    );
    if (onTap == null) return card;
    return InkWell(borderRadius: BorderRadius.circular(20), onTap: onTap, child: card);
  }
}

/// Small pill chip used for categories / status badges.
class TagChip extends StatelessWidget {
  const TagChip({super.key, required this.label, required this.color, this.icon});
  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        if (icon != null) ...[Icon(icon, size: 11, color: color), const SizedBox(width: 4)],
        Text(label, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w800)),
      ]),
    );
  }
}

/// Section label (uppercase, muted) — matches the web `Label`.
class SectionLabel extends StatelessWidget {
  const SectionLabel(this.text, {super.key});
  final String text;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(left: 4, bottom: 8, top: 4),
        child: Text(text.toUpperCase(), style: const TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 1)),
      );
}

/// Empty-state block.
class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.icon, required this.title, this.subtitle});
  final IconData icon;
  final String title;
  final String? subtitle;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Column(children: [
          Icon(icon, size: 34, color: AppColors.textMuted),
          const SizedBox(height: 10),
          Text(title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 15)),
          if (subtitle != null) ...[
            const SizedBox(height: 6),
            Text(subtitle!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
          ],
        ]),
      );
}
