import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../state/auth_controller.dart';

/// ChildConnected — shown on the child device after successfully claiming a
/// pairing code. Matches frontend-v2 /child/connected (ChildConnected.jsx).
/// Shows an animated success mark, child + parent info, and a "Complete Setup" CTA.
class ChildConnectedScreen extends StatefulWidget {
  const ChildConnectedScreen({super.key});
  @override
  State<ChildConnectedScreen> createState() => _ChildConnectedScreenState();
}

class _ChildConnectedScreenState extends State<ChildConnectedScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _scale = AnimationController(
    vsync: this, duration: const Duration(milliseconds: 600),
  );
  late final Animation<double> _scaleAnim = Tween<double>(begin: 0.85, end: 1.0)
      .animate(CurvedAnimation(parent: _scale, curve: Curves.elasticOut));

  @override
  void initState() {
    super.initState();
    _scale.forward();
  }

  @override
  void dispose() {
    _scale.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final child = auth.child;
    final safe = MediaQuery.of(context).padding;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Column(
          children: [
            SizedBox(height: safe.top + 8),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    const SizedBox(height: 32),
                    // ── Animated success icon ──────────────────────────────
                    AnimatedBuilder(
                      animation: _scaleAnim,
                      builder: (_, child) => Transform.scale(
                        scale: _scaleAnim.value,
                        child: child,
                      ),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          // Outer glow ring
                          Container(
                            width: 120, height: 120,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: const Color(0xFF10B981).withValues(alpha: 0.08),
                            ),
                          ),
                          // Inner circle
                          Container(
                            width: 96, height: 96,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: const Color(0xFF10B981).withValues(alpha: 0.15),
                              border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.40)),
                              boxShadow: [BoxShadow(color: const Color(0xFF10B981).withValues(alpha: 0.35), blurRadius: 30)],
                            ),
                            child: const Icon(Icons.check_circle_outline_rounded, color: Color(0xFF10B981), size: 50),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),
                    const Text('Child Device Connected',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -0.3)),
                    const SizedBox(height: 10),
                    const Text('Your device is now linked to your parent. Complete setup to activate all safety features.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 14, color: Color(0xFF94A3B8), height: 1.6)),
                    const SizedBox(height: 32),
                    // ── Info table ────────────────────────────────────────
                    Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(18),
                        color: Colors.white.withValues(alpha: 0.04),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                      ),
                      child: Column(
                        children: [
                          _InfoRow(label: 'Name', value: child?.name ?? 'Child'),
                          _Divider(),
                          _InfoRow(label: 'Age', value: child?.age?.toString() ?? '—'),
                          _Divider(),
                          _InfoRow(
                            label: 'Device status',
                            value: 'Connected',
                            badge: 'PENDING SETUP',
                            badgeColor: const Color(0xFFF59E0B),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    // ── Setup notice ──────────────────────────────────────
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(14),
                        color: const Color(0xFFF59E0B).withValues(alpha: 0.08),
                        border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.25)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.info_outline_rounded, color: Color(0xFFF59E0B), size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: const Text(
                              'Enable device permissions to activate real-time tracking, SOS alerts, and safety monitoring.',
                              style: TextStyle(color: Color(0xFFFCD34D), fontSize: 13, height: 1.4),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // ── CTA ────────────────────────────────────────────────────────
            Padding(
              padding: EdgeInsets.fromLTRB(24, 12, 24, safe.bottom + 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => context.go('/child-activate'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 17),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 0,
                      ),
                      child: const Text('Complete Device Setup', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextButton(
                    onPressed: () => context.go('/home'),
                    child: const Text('Skip for now', style: TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value, this.badge, this.badgeColor});
  final String label;
  final String value;
  final String? badge;
  final Color? badgeColor;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 13.5, fontWeight: FontWeight.w500)),
          Row(children: [
            Text(value, style: const TextStyle(color: Colors.white, fontSize: 13.5, fontWeight: FontWeight.w700)),
            if (badge != null) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(6),
                  color: (badgeColor ?? Colors.white).withValues(alpha: 0.15),
                ),
                child: Text(badge!, style: TextStyle(color: badgeColor ?? Colors.white, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
              ),
            ],
          ]),
        ],
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(height: 1, color: Colors.white.withValues(alpha: 0.06));
}
