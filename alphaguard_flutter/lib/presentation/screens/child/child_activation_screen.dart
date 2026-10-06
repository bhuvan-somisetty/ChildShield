import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../services/lifecycle/lifecycle_service.dart';

/// ChildActivation — 3-stage permission activation flow on the child device.
/// Stages: permissions grid → complete checklist → final success screen.
/// Matches frontend-v2 /child/activate (ChildActivation.jsx).
class ChildActivationScreen extends StatefulWidget {
  const ChildActivationScreen({super.key});
  @override
  State<ChildActivationScreen> createState() => _ChildActivationScreenState();
}

class _ChildActivationScreenState extends State<ChildActivationScreen> {
  final Set<int> _enabled = {};
  String _stage = 'permissions'; // 'permissions' | 'complete' | 'final'

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _restoreProgress());
  }

  Future<void> _restoreProgress() async {
    if (!mounted) return;
    final lc = context.read<LifecycleService>();
    final step = lc.childOnboardingStep;
    if (step >= 2) {
      setState(() { _stage = 'final'; _enableAll(); });
    } else if (step >= 1) {
      setState(() { _stage = 'complete'; _enableAll(); });
    }
  }

  Future<void> _saveProgress(int step) async {
    if (!mounted) return;
    final lc = context.read<LifecycleService>();
    await lc.saveChildOnboardingStep(step);
    // ignore: avoid_print
    print('[ONBOARDING] ONBOARDING STEP SAVED: $step');
  }

  static const _perms = [
    _Perm(icon: Icons.location_on_outlined, label: 'Location Access', color: Color(0xFF06B6D4)),
    _Perm(icon: Icons.notifications_outlined, label: 'Notifications', color: Color(0xFFF59E0B)),
    _Perm(icon: Icons.camera_alt_outlined, label: 'Camera', color: Color(0xFFF43F5E)),
    _Perm(icon: Icons.mic_outlined, label: 'Microphone', color: Color(0xFFA855F7)),
    _Perm(icon: Icons.monitor_outlined, label: 'Screen Monitoring', color: Color(0xFF2563EB)),
    _Perm(icon: Icons.accessibility_new_outlined, label: 'Accessibility Service', color: Color(0xFF10B981)),
    _Perm(icon: Icons.bar_chart_outlined, label: 'Usage Access', color: Color(0xFF6366F1)),
    _Perm(icon: Icons.layers_outlined, label: 'Overlay Permission', color: Color(0xFF06B6D4)),
    _Perm(icon: Icons.refresh_outlined, label: 'Background Activity', color: Color(0xFF84CC16)),
  ];

  static const _features = [
    'Live Location',
    'Safe Zones',
    'App Monitoring',
    'Usage Analytics',
    'Screen Monitoring',
    'AI Safety Insights',
    'Emergency Protection',
  ];

  void _togglePerm(int i) {
    setState(() {
      if (_enabled.contains(i)) _enabled.remove(i); else _enabled.add(i);
    });
  }

  void _enableAll() {
    setState(() {
      for (int i = 0; i < _perms.length; i++) _enabled.add(i);
    });
  }

  void _next() {
    if (_stage == 'permissions') {
      _enableAll();
      setState(() => _stage = 'complete');
      _saveProgress(1);
    } else if (_stage == 'complete') {
      setState(() => _stage = 'final');
      _saveProgress(2);
      _markPaired();
    } else {
      context.go('/home');
    }
  }

  Future<void> _markPaired() async {
    if (!mounted) return;
    await context.read<LifecycleService>().markChildPaired();
    // ignore: avoid_print
    print('[ONBOARDING] CHILD ACTIVATION COMPLETE');
  }

  double get _progress => _enabled.length / _perms.length;

  @override
  Widget build(BuildContext context) {
    final safe = MediaQuery.of(context).padding;
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Column(
        children: [
          SizedBox(height: safe.top + 16),
          if (_stage != 'final') _buildProgressBar(),
          Expanded(child: _buildStage()),
          Padding(
            padding: EdgeInsets.fromLTRB(24, 12, 24, safe.bottom + 24),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _next,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _stage == 'final' ? const Color(0xFF10B981) : AppColors.blue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 17),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: Text(
                  _stage == 'permissions' ? 'Enable All & Continue'
                    : _stage == 'complete' ? 'Finish Setup'
                    : 'Go to AlphaGuard',
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _stage == 'permissions' ? 'Activate Permissions' : 'Setup Complete',
                style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w800),
              ),
              Text(
                '${(_progress * 100).toInt()}%',
                style: const TextStyle(color: AppColors.cyan, fontSize: 13, fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: _stage == 'permissions' ? _progress : 1.0,
              backgroundColor: Colors.white.withValues(alpha: 0.08),
              valueColor: AlwaysStoppedAnimation<Color>(_stage == 'permissions' ? AppColors.cyan : const Color(0xFF10B981)),
              minHeight: 4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStage() {
    return switch (_stage) {
      'permissions' => _buildPermissions(),
      'complete' => _buildComplete(),
      _ => _buildFinal(),
    };
  }

  // Stage 1: Permission cards grid
  Widget _buildPermissions() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          const SizedBox(height: 8),
          const Text(
            'Enable permissions to activate\nall safety features.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: Color(0xFF94A3B8), height: 1.5),
          ),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3, crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 0.85,
            ),
            itemCount: _perms.length,
            itemBuilder: (_, i) => _PermCard(
              perm: _perms[i],
              enabled: _enabled.contains(i),
              onTap: () => _togglePerm(i),
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  // Stage 2: Checklist of all permissions
  Widget _buildComplete() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const SizedBox(height: 16),
          Container(
            width: 80, height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF10B981).withValues(alpha: 0.15),
              border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.35)),
            ),
            child: const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 42),
          ),
          const SizedBox(height: 20),
          const Text('All Permissions Enabled!',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -0.3)),
          const SizedBox(height: 8),
          const Text('AlphaGuard is fully configured on your device.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: Color(0xFF94A3B8))),
          const SizedBox(height: 24),
          for (int i = 0; i < _perms.length; i++) ...[
            _CheckRow(perm: _perms[i]),
            if (i < _perms.length - 1) Container(height: 1, color: Colors.white.withValues(alpha: 0.06)),
          ],
        ],
      ),
    );
  }

  // Stage 3: Final success screen
  Widget _buildFinal() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const SizedBox(height: 28),
          Container(
            width: 100, height: 100,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [Color(0xFF10B981), Color(0xFF06B6D4)],
                begin: Alignment.topLeft, end: Alignment.bottomRight,
              ),
              boxShadow: [BoxShadow(color: const Color(0xFF10B981).withValues(alpha: 0.40), blurRadius: 30)],
            ),
            child: const Icon(Icons.verified_rounded, color: Colors.white, size: 52),
          ),
          const SizedBox(height: 24),
          const Text('AlphaGuard is Active!',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -0.3)),
          const SizedBox(height: 12),
          const Text(
            'You\'re fully protected. Your parent can see your location, you can send SOS alerts, and all safety features are active.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: Color(0xFF94A3B8), height: 1.6),
          ),
          const SizedBox(height: 32),
          const Text('What\'s Enabled',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.textMuted, letterSpacing: 1.5)),
          const SizedBox(height: 16),
          Wrap(
            spacing: 10, runSpacing: 10,
            children: _features.map((f) => _FeatureBadge(label: f)).toList(),
          ),
        ],
      ),
    );
  }
}

// ── Permission card ───────────────────────────────────────────────────────────

class _Perm {
  const _Perm({required this.icon, required this.label, required this.color});
  final IconData icon;
  final String label;
  final Color color;
}

class _PermCard extends StatelessWidget {
  const _PermCard({required this.perm, required this.enabled, required this.onTap});
  final _Perm perm;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          color: enabled ? perm.color.withValues(alpha: 0.12) : Colors.white.withValues(alpha: 0.04),
          border: Border.all(
            color: enabled ? perm.color.withValues(alpha: 0.45) : Colors.white.withValues(alpha: 0.08),
            width: enabled ? 1.5 : 1,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(perm.icon, color: enabled ? perm.color : AppColors.textMuted, size: 22),
            const SizedBox(height: 6),
            Text(
              perm.label,
              textAlign: TextAlign.center,
              maxLines: 2,
              style: TextStyle(
                color: enabled ? Colors.white : AppColors.textMuted,
                fontSize: 10.5, fontWeight: FontWeight.w700, height: 1.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Check row (stage 2) ───────────────────────────────────────────────────────

class _CheckRow extends StatelessWidget {
  const _CheckRow({required this.perm});
  final _Perm perm;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
      child: Row(
        children: [
          Icon(perm.icon, color: perm.color, size: 20),
          const SizedBox(width: 12),
          Expanded(child: Text(perm.label, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600))),
          const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 20),
        ],
      ),
    );
  }
}

// ── Feature badge (stage 3) ───────────────────────────────────────────────────

class _FeatureBadge extends StatelessWidget {
  const _FeatureBadge({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        color: AppColors.cyan.withValues(alpha: 0.10),
        border: Border.all(color: AppColors.cyan.withValues(alpha: 0.25)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.check_rounded, color: AppColors.cyan, size: 14),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(color: Color(0xFF22D3EE), fontSize: 12.5, fontWeight: FontWeight.w700)),
      ]),
    );
  }
}
