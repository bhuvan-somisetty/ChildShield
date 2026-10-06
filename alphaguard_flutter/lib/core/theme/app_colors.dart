import 'package:flutter/material.dart';

abstract class AppColors {
  // ── Base surfaces ────────────────────────────────────────────────────────────
  static const Color bg         = Color(0xFF030307);
  static const Color bgElevated = Color(0xFF0B0C14);
  static const Color surface    = Color(0xFF11131D);

  // ── Brand ────────────────────────────────────────────────────────────────────
  static const Color cyan   = Color(0xFF06B6D4);
  static const Color blue   = Color(0xFF2563EB);
  static const Color indigo = Color(0xFF6366F1);
  static const Color violet = Color(0xFFA855F7);

  // ── Semantic ─────────────────────────────────────────────────────────────────
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color danger  = Color(0xFFF43F5E);

  // ── Text ─────────────────────────────────────────────────────────────────────
  static const Color textPrimary   = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted     = Color(0xFF64748B);

  // ── Borders & glass ──────────────────────────────────────────────────────────
  static const Color border         = Color(0x14FFFFFF);
  static const Color glassBorder    = Color(0x1AFFFFFF);
  static const Color glassHighlight = Color(0x26FFFFFF);
  static const Color glassFill      = Color(0x0DFFFFFF);

  // ── Gradients ────────────────────────────────────────────────────────────────
  static const LinearGradient brandGradient = LinearGradient(
    colors: [cyan, blue],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient heroGradient = LinearGradient(
    colors: [Color(0xFF818CF8), Color(0xFF2563EB), Color(0xFF06B6D4)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // ── Glass card decoration helper ─────────────────────────────────────────────
  static BoxDecoration glassCard({
    Color? accent,
    double radius = 24,
    double borderAlpha = 0.10,
    double fillAlpha = 0.05,
  }) =>
      BoxDecoration(
        color: Colors.white.withValues(alpha: fillAlpha),
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(
          color: accent?.withValues(alpha: borderAlpha) ?? Colors.white.withValues(alpha: borderAlpha),
        ),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.28), blurRadius: 22, offset: const Offset(0, 7)),
          if (accent != null)
            BoxShadow(color: accent.withValues(alpha: 0.09), blurRadius: 32),
        ],
      );
}
