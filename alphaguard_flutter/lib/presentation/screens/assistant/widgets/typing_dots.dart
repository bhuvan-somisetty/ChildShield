import 'package:flutter/material.dart';

/// Three-dot "thinking" pulse shown while the assistant is composing its first
/// tokens. Pure Flutter animation (no framer-motion equivalent needed).
class TypingDots extends StatefulWidget {
  const TypingDots({super.key, required this.color, this.size = 7});
  final Color color;
  final double size;

  @override
  State<TypingDots> createState() => _TypingDotsState();
}

class _TypingDotsState extends State<TypingDots> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1000))..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (i) {
        return AnimatedBuilder(
          animation: _c,
          builder: (_, __) {
            final t = (_c.value + i * 0.22) % 1.0;
            final opacity = 0.3 + 0.7 * (t < 0.5 ? t * 2 : (1 - t) * 2);
            return Padding(
              padding: EdgeInsets.only(right: i == 2 ? 0 : 4),
              child: Opacity(
                opacity: opacity.clamp(0.3, 1.0),
                child: Container(width: widget.size, height: widget.size, decoration: BoxDecoration(color: widget.color, shape: BoxShape.circle)),
              ),
            );
          },
        );
      }),
    );
  }
}
