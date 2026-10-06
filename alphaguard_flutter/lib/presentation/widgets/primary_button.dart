import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Liquid-glass CTA — gradient fill, glow shadow, press-scale micro-animation.
class PrimaryButton extends StatefulWidget {
  const PrimaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.loading = false,
    this.icon,
    this.gradient,
    this.glowColor,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final IconData? icon;
  final Gradient? gradient;
  final Color? glowColor;

  @override
  State<PrimaryButton> createState() => _PrimaryButtonState();
}

class _PrimaryButtonState extends State<PrimaryButton> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 120),
    reverseDuration: const Duration(milliseconds: 200),
  );
  late final Animation<double> _scale = Tween<double>(begin: 1, end: 0.97).animate(
    CurvedAnimation(parent: _ctrl, curve: Curves.easeOut),
  );

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  bool get _enabled => widget.onPressed != null && !widget.loading;

  @override
  Widget build(BuildContext context) {
    final glow = widget.glowColor ?? AppColors.cyan;
    final grad = widget.gradient ?? AppColors.brandGradient;

    return Opacity(
      opacity: _enabled ? 1.0 : 0.52,
      child: GestureDetector(
        onTapDown:   _enabled ? (_) => _ctrl.forward()  : null,
        onTapUp:     _enabled ? (_) { _ctrl.reverse(); widget.onPressed?.call(); } : null,
        onTapCancel: _enabled ? ()  => _ctrl.reverse()  : null,
        child: AnimatedBuilder(
          animation: _scale,
          builder: (_, child) => Transform.scale(scale: _scale.value, child: child),
          child: Container(
            constraints: const BoxConstraints(minHeight: 56),
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: grad,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: Colors.white.withValues(alpha: 0.18), width: 0.8),
              boxShadow: _enabled
                  ? [
                      BoxShadow(
                        color: glow.withValues(alpha: 0.40),
                        blurRadius: 24,
                        offset: const Offset(0, 8),
                      ),
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.20),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ]
                  : [],
            ),
            child: Stack(
              children: [
                // Inner top highlight
                Positioned(
                  top: 0, left: 0, right: 0,
                  child: Container(
                    height: 28,
                    decoration: BoxDecoration(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.white.withValues(alpha: 0.12), Colors.transparent],
                      ),
                    ),
                  ),
                ),
                // Content
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: SizedBox(
                    height: 56,
                    child: Center(
                      child: widget.loading
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
                            )
                          : Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  widget.label,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 16,
                                    letterSpacing: 0.1,
                                  ),
                                ),
                                if (widget.icon != null) ...[
                                  const SizedBox(width: 10),
                                  Icon(widget.icon, color: Colors.white, size: 18),
                                ],
                              ],
                            ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
