import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/responsive/responsive.dart';
import '../../core/theme/app_colors.dart';
import '../../state/auth_controller.dart';

/// 6-section onboarding carousel — matches frontend-v2 /onboarding exactly.
/// Sections: how · parentGuide · parentFeatures · childGuide · childFeatures · privacy
/// On finish/skip: marks onboarding complete then navigates to /role.
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

// ── Data model ────────────────────────────────────────────────────────────────

class _Section {
  const _Section({required this.id, required this.accent, required this.build});
  final String id;
  final Color accent;
  final Widget Function(BuildContext) build;
}

// ── Section content builders ──────────────────────────────────────────────────

Widget _sectionHow(BuildContext context) => _SectionLayout(
  art: const _AiArt(accent: Color(0xFF06B6D4)),
  title: 'How AlphaGuard Works',
  sub: 'A shared, transparent space for families — safety for parents, growth for children.',
  content: Column(
    children: const [
      _StepRow(n: 1, icon: Icons.link_outlined, title: 'Pair the two devices', sub: 'A secure 6-digit code connects parent and child.', accent: Color(0xFF06B6D4)),
      SizedBox(height: 10),
      _StepRow(n: 2, icon: Icons.checklist_outlined, title: 'Set tasks, goals & rewards', sub: 'Everyday routines that build great habits.', accent: Color(0xFF3B82F6)),
      SizedBox(height: 10),
      _StepRow(n: 3, icon: Icons.verified_user_outlined, title: 'Stay safe & informed', sub: 'Location, safe zones, SOS and AI insights.', accent: Color(0xFF10B981)),
    ],
  ),
);

Widget _sectionParentGuide(BuildContext context) => _SectionLayout(
  art: const _IconHero(icon: Icons.people_outlined, accent: Color(0xFF3B82F6)),
  title: 'Parent Guide',
  sub: 'Set up your family\'s safety in a few simple steps.',
  content: Column(
    children: const [
      _StepRow(n: 1, icon: Icons.person_add_outlined, title: 'Create your account', sub: 'Sign up with email or Google.', accent: Color(0xFF3B82F6)),
      SizedBox(height: 10),
      _StepRow(n: 2, icon: Icons.pin_outlined, title: 'Set a Security PIN', sub: 'Protects sensitive parental actions.', accent: Color(0xFF06B6D4)),
      SizedBox(height: 10),
      _StepRow(n: 3, icon: Icons.link_outlined, title: 'Connect your child\'s device', sub: 'Share the pairing code with their app.', accent: Color(0xFF10B981)),
      SizedBox(height: 10),
      _StepRow(n: 4, icon: Icons.tune_outlined, title: 'Configure family safety', sub: 'Permissions, safe zones and alerts.', accent: Color(0xFFA855F7)),
      SizedBox(height: 10),
      _StepRow(n: 5, icon: Icons.checklist_outlined, title: 'Monitor tasks & goals', sub: 'Assign, review and approve progress.', accent: Color(0xFFF59E0B)),
      SizedBox(height: 10),
      _StepRow(n: 6, icon: Icons.bar_chart_outlined, title: 'Receive AI reports', sub: 'Completion, approval and consistency.', accent: Color(0xFFEC4899)),
      SizedBox(height: 10),
      _StepRow(n: 7, icon: Icons.auto_awesome_outlined, title: 'View family insights', sub: 'Understand habits and what to focus on.', accent: Color(0xFF06B6D4)),
    ],
  ),
);

Widget _sectionParentFeatures(BuildContext context) => _SectionLayout(
  art: const _IconHero(icon: Icons.verified_user_outlined, accent: Color(0xFF6366F1)),
  title: 'What Parents Can Do',
  sub: 'Powerful, transparent tools for everyday family safety.',
  content: Wrap(
    spacing: 10,
    runSpacing: 10,
    children: const [
      _FeatureTile(icon: Icons.location_on_outlined, label: 'Family Location', accent: Color(0xFF06B6D4)),
      _FeatureTile(icon: Icons.shield_outlined, label: 'Safe Zones', accent: Color(0xFF10B981)),
      _FeatureTile(icon: Icons.checklist_outlined, label: 'Tasks & Approval', accent: Color(0xFF3B82F6)),
      _FeatureTile(icon: Icons.track_changes_outlined, label: 'Goals & Targets', accent: Color(0xFFA855F7)),
      _FeatureTile(icon: Icons.card_giftcard_outlined, label: 'Rewards & Promises', accent: Color(0xFFF59E0B)),
      _FeatureTile(icon: Icons.bar_chart_outlined, label: 'AI Reports', accent: Color(0xFFEC4899)),
      _FeatureTile(icon: Icons.chat_bubble_outline, label: 'Family Chat', accent: Color(0xFF06B6D4)),
      _FeatureTile(icon: Icons.sos_outlined, label: 'Emergency SOS', accent: Color(0xFFF43F5E)),
    ],
  ),
);

Widget _sectionChildGuide(BuildContext context) => _SectionLayout(
  art: const _IconHero(icon: Icons.smartphone_outlined, accent: Color(0xFF10B981)),
  title: 'Child Guide',
  sub: 'Connect, complete tasks, and earn rewards.',
  content: Column(
    children: const [
      _StepRow(n: 1, icon: Icons.tag_outlined, title: 'Enter your pairing code', sub: 'The 6-digit code from your parent.', accent: Color(0xFF10B981)),
      SizedBox(height: 10),
      _StepRow(n: 2, icon: Icons.link_outlined, title: 'Connect to your parent', sub: 'Your devices are securely linked.', accent: Color(0xFF06B6D4)),
      SizedBox(height: 10),
      _StepRow(n: 3, icon: Icons.checklist_outlined, title: 'Complete your tasks', sub: 'Tick them off as you finish.', accent: Color(0xFF3B82F6)),
      SizedBox(height: 10),
      _StepRow(n: 4, icon: Icons.card_giftcard_outlined, title: 'Earn rewards', sub: 'Unlock promises and prizes.', accent: Color(0xFFF59E0B)),
      SizedBox(height: 10),
      _StepRow(n: 5, icon: Icons.local_fire_department_outlined, title: 'Build daily habits', sub: 'Keep streaks going day after day.', accent: Color(0xFFEC4899)),
      SizedBox(height: 10),
      _StepRow(n: 6, icon: Icons.emoji_events_outlined, title: 'View achievements', sub: 'Celebrate badges and milestones.', accent: Color(0xFFA855F7)),
    ],
  ),
);

Widget _sectionChildFeatures(BuildContext context) => _SectionLayout(
  art: const _DeviceArt(accent: Color(0xFFA855F7)),
  title: 'What Children Can Do',
  sub: 'Stay on track and have fun building good habits.',
  content: Wrap(
    spacing: 10,
    runSpacing: 10,
    children: const [
      _FeatureTile(icon: Icons.checklist_outlined, label: 'My Tasks', accent: Color(0xFF3B82F6)),
      _FeatureTile(icon: Icons.card_giftcard_outlined, label: 'Rewards', accent: Color(0xFFF59E0B)),
      _FeatureTile(icon: Icons.emoji_events_outlined, label: 'Achievements', accent: Color(0xFFA855F7)),
      _FeatureTile(icon: Icons.track_changes_outlined, label: 'Goals', accent: Color(0xFF10B981)),
      _FeatureTile(icon: Icons.chat_bubble_outline, label: 'Chat with Parent', accent: Color(0xFF06B6D4)),
      _FeatureTile(icon: Icons.sos_outlined, label: 'Emergency SOS', accent: Color(0xFFF43F5E)),
    ],
  ),
);

Widget _sectionPrivacy(BuildContext ctx) => _SectionLayout(
  art: const _PrivacyArt(accent: Color(0xFF2563EB)),
  title: 'Privacy & Safety',
  sub: 'Safety and transparency are at the heart of AlphaGuard.',
  content: Column(
    children: [
      const _CommitRow(icon: Icons.lock_outline, title: 'Your data is protected', sub: 'Encrypted in transit and at rest. Never sold.', accent: Color(0xFF06B6D4)),
      const SizedBox(height: 10),
      const _CommitRow(icon: Icons.verified_user_outlined, title: 'Parent controlled', sub: 'Parents set up and control everything.', accent: Color(0xFF10B981)),
      const SizedBox(height: 10),
      const _CommitRow(icon: Icons.visibility_outlined, title: 'Child-safety focused', sub: 'Monitoring is transparent — never covert.', accent: Color(0xFFA855F7)),
      const SizedBox(height: 10),
      const _CommitRow(icon: Icons.block_outlined, title: 'No unauthorized sharing', sub: 'No ads to children. No data sold or rented.', accent: Color(0xFFF59E0B)),
      const SizedBox(height: 18),
      // Legal links
      const Text(
        'READ OUR POLICIES',
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF64748B), letterSpacing: 1.5),
      ),
      const SizedBox(height: 10),
      for (final item in [
        ('Terms of Service', Icons.description_outlined),
        ('Privacy Policy', Icons.privacy_tip_outlined),
        ('Child Safety Policy', Icons.child_care_outlined),
      ])
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFF0B0C14),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withValues(alpha: 0.07)),
            ),
            child: Row(
              children: [
                Icon(item.$2, color: AppColors.cyan, size: 16),
                const SizedBox(width: 12),
                Expanded(child: Text(item.$1, style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: Colors.white))),
                const Icon(Icons.chevron_right, color: Color(0xFF475569), size: 16),
              ],
            ),
          ),
        ),
      const SizedBox(height: 6),
      const Text(
        'AlphaGuard is and remains completely free. You\'ll review and accept these policies during setup.',
        textAlign: TextAlign.center,
        style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w500, color: Color(0xFF475569), height: 1.55),
      ),
    ],
  ),
);

// ── Sections list ─────────────────────────────────────────────────────────────

final _sections = <_Section>[
  _Section(id: 'how', accent: const Color(0xFF06B6D4), build: _sectionHow),
  _Section(id: 'parentGuide', accent: const Color(0xFF3B82F6), build: _sectionParentGuide),
  _Section(id: 'parentFeatures', accent: const Color(0xFF6366F1), build: _sectionParentFeatures),
  _Section(id: 'childGuide', accent: const Color(0xFF10B981), build: _sectionChildGuide),
  _Section(id: 'childFeatures', accent: const Color(0xFFA855F7), build: _sectionChildFeatures),
  _Section(id: 'privacy', accent: const Color(0xFF2563EB), build: _sectionPrivacy),
];

// ── Screen ────────────────────────────────────────────────────────────────────

class _OnboardingScreenState extends State<OnboardingScreen> with SingleTickerProviderStateMixin {
  int _i = 0;
  late final PageController _pc = PageController();
  late final AnimationController _slide = AnimationController(vsync: this, duration: const Duration(milliseconds: 320));
  late Animation<double> _fadeIn = CurvedAnimation(parent: _slide, curve: Curves.easeOut);

  bool get _last => _i == _sections.length - 1;

  @override
  void initState() {
    super.initState();
    _slide.forward();
  }

  @override
  void dispose() {
    _pc.dispose();
    _slide.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    await context.read<AuthController>().completeOnboarding();
    if (mounted) context.go('/role');
  }

  void _next() {
    if (_last) { _finish(); return; }
    setState(() => _i++);
    _pc.animateToPage(_i, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
    _slide.forward(from: 0);
  }

  void _prev() {
    if (_i == 0) { context.go('/welcome'); return; }
    setState(() => _i--);
    _pc.animateToPage(_i, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
    _slide.forward(from: 0);
  }

  @override
  Widget build(BuildContext context) {
    final section = _sections[_i];
    final safe = MediaQuery.of(context).padding;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Stack(
        children: [
          // Ambient glow
          Positioned(
            top: -80, left: 0, right: 0,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 400),
              height: 280,
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  colors: [section.accent.withValues(alpha: 0.15), Colors.transparent],
                ),
              ),
            ),
          ),
          ResponsiveShell(
            child: Column(
              children: [
                SizedBox(height: safe.top + 4),
                // Top: progress + skip
                Row(
                  children: [
                    Expanded(child: _ProgressPill(count: _sections.length, active: _i, color: section.accent)),
                    const SizedBox(width: 12),
                    GestureDetector(
                      onTap: _finish,
                      child: const Text('Skip', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF64748B))),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Section content (animated)
                Expanded(
                  child: PageView.builder(
                    controller: _pc,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _sections.length,
                    onPageChanged: (i) => setState(() => _i = i),
                    itemBuilder: (ctx, i) => FadeTransition(
                      opacity: _fadeIn,
                      child: SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.only(bottom: 8),
                        child: _sections[i].build(ctx),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                // Footer: prev + next
                Row(
                  children: [
                    GestureDetector(
                      onTap: _prev,
                      child: Container(
                        width: 52, height: 52,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(99),
                          color: Colors.white.withValues(alpha: 0.05),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.10)),
                        ),
                        child: const Icon(Icons.chevron_left, color: Color(0xFFCBD5E1), size: 22),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        child: ElevatedButton.icon(
                          onPressed: _next,
                          icon: const Icon(Icons.chevron_right, size: 18),
                          label: Text(
                            _last ? 'Get Started' : 'Next',
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: section.accent,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: safe.bottom + 16),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Progress pill ─────────────────────────────────────────────────────────────

class _ProgressPill extends StatelessWidget {
  const _ProgressPill({required this.count, required this.active, required this.color});
  final int count;
  final int active;
  final Color color;

  @override
  Widget build(BuildContext context) => Row(
    children: List.generate(count, (i) {
      final isActive = i == active;
      return AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        margin: const EdgeInsets.only(right: 5),
        height: 6,
        width: isActive ? 24 : 6,
        decoration: BoxDecoration(
          color: isActive ? color : Colors.white.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(99),
        ),
      );
    }),
  );
}

// ── Section scaffold ──────────────────────────────────────────────────────────

class _SectionLayout extends StatelessWidget {
  const _SectionLayout({required this.art, required this.title, required this.sub, required this.content});
  final Widget art;
  final String title;
  final String sub;
  final Widget content;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Center(child: art),
      const SizedBox(height: 20),
      Text(title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white, height: 1.2)),
      const SizedBox(height: 8),
      Text(sub, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF94A3B8), height: 1.55)),
      const SizedBox(height: 20),
      content,
    ],
  );
}

// ── UI primitives ─────────────────────────────────────────────────────────────

class _IconTile extends StatelessWidget {
  const _IconTile({required this.icon, required this.accent, this.size = 42});
  final IconData icon;
  final Color accent;
  final double size;

  @override
  Widget build(BuildContext context) => Container(
    width: size, height: size,
    decoration: BoxDecoration(
      color: accent.withValues(alpha: 0.10),
      borderRadius: BorderRadius.circular(size * 0.3),
      border: Border.all(color: accent.withValues(alpha: 0.25)),
    ),
    child: Icon(icon, color: accent, size: size * 0.45),
  );
}

class _StepRow extends StatelessWidget {
  const _StepRow({required this.n, required this.icon, required this.title, required this.accent, this.sub});
  final int n;
  final IconData icon;
  final String title;
  final String? sub;
  final Color accent;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: const Color(0xFF0B0C14),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: Colors.white.withValues(alpha: 0.07)),
    ),
    child: Row(
      children: [
        Stack(
          clipBehavior: Clip.none,
          children: [
            _IconTile(icon: icon, accent: accent),
            Positioned(
              top: -6, left: -6,
              child: Container(
                width: 20, height: 20,
                decoration: const BoxDecoration(shape: BoxShape.circle, color: Colors.white),
                child: Center(
                  child: Text('$n', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF06070F))),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white, height: 1.3)),
              if (sub != null) ...[
                const SizedBox(height: 2),
                Text(sub!, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
              ],
            ],
          ),
        ),
      ],
    ),
  );
}

class _FeatureTile extends StatelessWidget {
  const _FeatureTile({required this.icon, required this.label, required this.accent});
  final IconData icon;
  final String label;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    final w = (MediaQuery.of(context).size.width.clamp(0, 440) - 48 - 10) / 2;
    return SizedBox(
      width: w,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFF0B0C14),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Colors.white.withValues(alpha: 0.07)),
        ),
        child: Row(
          children: [
            _IconTile(icon: icon, accent: accent, size: 34),
            const SizedBox(width: 10),
            Flexible(child: Text(label, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: Colors.white, height: 1.3))),
          ],
        ),
      ),
    );
  }
}

class _CommitRow extends StatelessWidget {
  const _CommitRow({required this.icon, required this.title, required this.sub, required this.accent});
  final IconData icon;
  final String title;
  final String sub;
  final Color accent;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: const Color(0xFF0B0C14),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: Colors.white.withValues(alpha: 0.07)),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _IconTile(icon: icon, accent: accent, size: 38),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: Colors.white)),
              const SizedBox(height: 3),
              Text(sub, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF64748B), height: 1.45)),
            ],
          ),
        ),
      ],
    ),
  );
}

// ── Illustrations ─────────────────────────────────────────────────────────────

/// Generic icon hero — used for sections without custom art.
class _IconHero extends StatelessWidget {
  const _IconHero({required this.icon, required this.accent});
  final IconData icon;
  final Color accent;

  @override
  Widget build(BuildContext context) => Stack(
    alignment: Alignment.center,
    children: [
      Container(
        width: 100, height: 100,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: accent.withValues(alpha: 0.10),
          boxShadow: [BoxShadow(color: accent.withValues(alpha: 0.25), blurRadius: 32)],
        ),
      ),
      Container(
        width: 72, height: 72,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          color: accent.withValues(alpha: 0.15),
          border: Border.all(color: accent.withValues(alpha: 0.30)),
        ),
        child: Icon(icon, color: accent, size: 36),
      ),
    ],
  );
}

/// AiArt — shield with network nodes, cyan accent.
class _AiArt extends StatefulWidget {
  const _AiArt({required this.accent});
  final Color accent;
  @override
  State<_AiArt> createState() => _AiArtState();
}

class _AiArtState extends State<_AiArt> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 2800))..repeat(reverse: true);
  late final Animation<double> _op = Tween<double>(begin: 0.5, end: 0.9).animate(CurvedAnimation(parent: _c, curve: Curves.easeInOut));
  @override
  void dispose() { _c.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _op,
    builder: (_, __) => SizedBox(
      width: 160,
      height: 120,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Glow ring
          Opacity(
            opacity: _op.value * 0.4,
            child: Container(width: 120, height: 120, decoration: BoxDecoration(shape: BoxShape.circle, color: widget.accent.withValues(alpha: 0.25), boxShadow: [BoxShadow(color: widget.accent, blurRadius: 30)])),
          ),
          // Center shield
          Container(
            width: 72, height: 72,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(22),
              gradient: LinearGradient(
                colors: [widget.accent.withValues(alpha: 0.25), widget.accent.withValues(alpha: 0.10)],
                begin: Alignment.topLeft, end: Alignment.bottomRight,
              ),
              border: Border.all(color: widget.accent.withValues(alpha: 0.4)),
            ),
            child: Icon(Icons.verified_user_outlined, color: widget.accent, size: 36),
          ),
          // Node dots
          for (final pos in [
            const Offset(-62, -20), const Offset(62, -20),
            const Offset(-55, 28), const Offset(55, 28),
          ])
            Positioned(
              left: 80 + pos.dx - 8,
              top: 60 + pos.dy - 8,
              child: Opacity(
                opacity: _op.value,
                child: Container(
                  width: 16, height: 16,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: widget.accent.withValues(alpha: 0.3),
                    border: Border.all(color: widget.accent.withValues(alpha: 0.6)),
                  ),
                ),
              ),
            ),
        ],
      ),
    ),
  );
}

/// DeviceArt — phone with achievement badge, violet accent.
class _DeviceArt extends StatefulWidget {
  const _DeviceArt({required this.accent});
  final Color accent;
  @override
  State<_DeviceArt> createState() => _DeviceArtState();
}

class _DeviceArtState extends State<_DeviceArt> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 2200))..repeat(reverse: true);
  late final Animation<double> _float = Tween<double>(begin: 0, end: -5).animate(CurvedAnimation(parent: _c, curve: Curves.easeInOut));
  @override
  void dispose() { _c.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _float,
    builder: (_, __) => SizedBox(
      width: 120,
      height: 100,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Glow
          Container(
            width: 80, height: 80,
            decoration: BoxDecoration(shape: BoxShape.circle, color: widget.accent.withValues(alpha: 0.15), boxShadow: [BoxShadow(color: widget.accent.withValues(alpha: 0.3), blurRadius: 25)]),
          ),
          // Phone
          Transform.translate(
            offset: Offset(0, _float.value),
            child: Container(
              width: 48, height: 80,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                color: const Color(0xFF0B0C14),
                border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
                boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 18, offset: Offset(0, 8))],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.emoji_events_outlined, color: widget.accent, size: 22),
                  const SizedBox(height: 4),
                  Container(height: 4, width: 24, decoration: BoxDecoration(borderRadius: BorderRadius.circular(4), color: widget.accent.withValues(alpha: 0.5))),
                  const SizedBox(height: 3),
                  Container(height: 4, width: 18, decoration: BoxDecoration(borderRadius: BorderRadius.circular(4), color: widget.accent.withValues(alpha: 0.3))),
                ],
              ),
            ),
          ),
          // Badge
          Positioned(
            top: 4, right: 4,
            child: Transform.translate(
              offset: Offset(0, _float.value * 0.5),
              child: Container(
                width: 28, height: 28,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: widget.accent,
                  boxShadow: [BoxShadow(color: widget.accent.withValues(alpha: 0.5), blurRadius: 10)],
                ),
                child: const Icon(Icons.check, color: Colors.white, size: 14),
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

/// PrivacyArt — lock with shield orbit, blue accent.
class _PrivacyArt extends StatefulWidget {
  const _PrivacyArt({required this.accent});
  final Color accent;
  @override
  State<_PrivacyArt> createState() => _PrivacyArtState();
}

class _PrivacyArtState extends State<_PrivacyArt> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 4000))..repeat();
  @override
  void dispose() { _c.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _c,
    builder: (_, __) => SizedBox(
      width: 120,
      height: 120,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Outer glow
          Container(
            width: 100, height: 100,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: widget.accent.withValues(alpha: 0.10),
              boxShadow: [BoxShadow(color: widget.accent.withValues(alpha: 0.20), blurRadius: 30)],
            ),
          ),
          // Center lock
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              gradient: LinearGradient(
                colors: [widget.accent.withValues(alpha: 0.30), widget.accent.withValues(alpha: 0.10)],
                begin: Alignment.topLeft, end: Alignment.bottomRight,
              ),
              border: Border.all(color: widget.accent.withValues(alpha: 0.40)),
            ),
            child: Icon(Icons.lock_outlined, color: widget.accent, size: 30),
          ),
          // Orbiting shield dot
          Transform.translate(
            offset: Offset(
              44 * math.cos(_c.value * 2 * math.pi),
              44 * math.sin(_c.value * 2 * math.pi),
            ),
            child: Container(
              width: 20, height: 20,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: widget.accent.withValues(alpha: 0.25),
                border: Border.all(color: widget.accent.withValues(alpha: 0.6)),
              ),
              child: Icon(Icons.shield_outlined, color: widget.accent, size: 10),
            ),
          ),
        ],
      ),
    ),
  );
}
