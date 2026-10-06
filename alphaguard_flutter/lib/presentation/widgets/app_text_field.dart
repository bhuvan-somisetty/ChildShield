import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Glass text field — animated focus border glow, password visibility toggle.
class AppTextField extends StatefulWidget {
  const AppTextField({
    super.key,
    required this.controller,
    required this.label,
    this.hint,
    this.icon,
    this.obscure = false,
    this.keyboardType,
    this.onChanged,
  });

  final TextEditingController controller;
  final String label;
  final String? hint;
  final IconData? icon;
  final bool obscure;
  final TextInputType? keyboardType;
  final ValueChanged<String>? onChanged;

  @override
  State<AppTextField> createState() => _AppTextFieldState();
}

class _AppTextFieldState extends State<AppTextField> with SingleTickerProviderStateMixin {
  final FocusNode _focus = FocusNode();
  bool _focused = false;
  bool _visible = false;

  late final AnimationController _glowCtrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 220),
  );
  late final Animation<double> _glow = CurvedAnimation(parent: _glowCtrl, curve: Curves.easeOut);

  @override
  void initState() {
    super.initState();
    _focus.addListener(() {
      setState(() => _focused = _focus.hasFocus);
      if (_focus.hasFocus) {
        _glowCtrl.forward();
      } else {
        _glowCtrl.reverse();
      }
    });
  }

  @override
  void dispose() {
    _focus.dispose();
    _glowCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _glow,
      builder: (_, __) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 7),
            child: Text(
              widget.label.toUpperCase(),
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.1,
                color: _focused
                    ? AppColors.cyan.withValues(alpha: 0.85)
                    : AppColors.textSecondary,
              ),
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.04 + _glow.value * 0.03),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: _focused
                    ? AppColors.cyan.withValues(alpha: 0.50 + _glow.value * 0.25)
                    : Colors.white.withValues(alpha: 0.09),
                width: _focused ? 1.5 : 1,
              ),
              boxShadow: _focused
                  ? [BoxShadow(color: AppColors.cyan.withValues(alpha: _glow.value * 0.12), blurRadius: 16)]
                  : [BoxShadow(color: Colors.black.withValues(alpha: 0.15), blurRadius: 8, offset: const Offset(0, 2))],
            ),
            child: TextField(
              controller: widget.controller,
              focusNode: _focus,
              obscureText: widget.obscure && !_visible,
              keyboardType: widget.keyboardType,
              onChanged: widget.onChanged,
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w500),
              decoration: InputDecoration(
                hintText: widget.hint,
                hintStyle: TextStyle(color: AppColors.textMuted.withValues(alpha: 0.6), fontSize: 14),
                prefixIcon: widget.icon != null
                    ? Icon(
                        widget.icon,
                        color: _focused ? AppColors.cyan.withValues(alpha: 0.8) : AppColors.textMuted,
                        size: 18,
                      )
                    : null,
                suffixIcon: widget.obscure
                    ? GestureDetector(
                        onTap: () => setState(() => _visible = !_visible),
                        child: Icon(
                          _visible ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                          color: _focused ? AppColors.cyan.withValues(alpha: 0.7) : AppColors.textMuted,
                          size: 18,
                        ),
                      )
                    : null,
                filled: false,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
