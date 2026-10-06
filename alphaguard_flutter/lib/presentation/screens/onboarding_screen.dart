import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/responsive/responsive.dart';
import '../../core/theme/app_colors.dart';
import '../../state/auth_controller.dart';

// 6-section onboarding carousel.
// Sections: how · parentGuide · parentFeatures · childGuide · childFeatures · privacy

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

// ── Data model ───────────────────────────────────────────────────────────────

class _Section {
  const _Section({required this.id, required this.accent, required this.build});
  final String id;
  final Color accent;
  final Widget Function(BuildContext) build;
}

// ── Section builders ─────────────────────────────────────────────────────────

Widget _sectionHow(BuildContext ctx) => _SectionLayout(
  accent: const Color(0xFF06B6D4),
  art: const _RadarArt(accent: Color(0xFF06B6D4)),
  title: 'How AlphaGuard Works',
  sub: 'A shared, transparent space for families — safety for parents, growth for children.',
  chipLabel: 'ALPHAGUARD AI',
  content: const Column(children: [
    _StepRow(n: 1, icon: Icons.link_outlined, title: 'Pair the two devices', sub: 'A secure 6-digit code connects parent and child.', accent: Color(0xFF06B6D4)),
    SizedBox(height: 10),
    _StepRow(n: 2, icon: Icons.checklist_outlined, title: 'Set tasks, goals & rewards', sub: 'Everyday routines that build great habits.', accent: Color(0xFF3B82F6)),
    SizedBox(height: 10),
    _StepRow(n: 3, icon: Icons.verified_user_outlined, title: 'Stay safe & informed', sub: 'Location, safe zones, SOS and AI insights.', accent: Color(0xFF10B981)),
  ]),
);

Widget _sectionParentGuide(BuildContext ctx) => _SectionLayout(
  accent: const Color(0xFF3B82F6),
  art: const _AnalyticsArt(accent: Color(0xFF3B82F6)),
  title: 'Parent Guide',
  sub: 'Set up your family\'s safety in a few simple steps.',
  content: const Column(children: [
    _StepRow(n: 1, icon: Icons.person_add_outlined, title: 'Create your account', sub: 'Sign up with email or Google.', accent: Color(0xFF3B82F6)),
    SizedBox(height: 10),
    _StepRow(n: 2, icon: Icons.pin_outlined, title: 'Set a Security PIN', sub: 'Protects sensitive parental actions.', accent: Color(0xFF06B6D4)),
    SizedBox(height: 10),
    _StepRow(n: 3, icon: Icons.link_outlined, title: "Connect your child's device", sub: 'Share the pairing code with their app.', accent: Color(0xFF10B981)),
    SizedBox(height: 10),
    _StepRow(n: 4, icon: Icons.tune_outlined, title: 'Configure family safety', sub: 'Permissions, safe zones and alerts.', accent: Color(0xFFA855F7)),
    SizedBox(height: 10),
    _StepRow(n: 5, icon: Icons.checklist_outlined, title: 'Monitor tasks & goals', sub: 'Assign, review and approve progress.', accent: Color(0xFFF59E0B)),
    SizedBox(height: 10),
    _StepRow(n: 6, icon: Icons.bar_chart_outlined, title: 'Receive AI reports', sub: 'Completion, approval and consistency.', accent: Color(0xFFEC4899)),
    SizedBox(height: 10),
    _StepRow(n: 7, icon: Icons.auto_awesome_outlined, title: 'View family insights', sub: 'Understand habits and what to focus on.', accent: Color(0xFF06B6D4)),
  ]),
);

Widget _sectionParentFeatures(BuildContext ctx) => _SectionLayout(
  accent: const Color(0xFF6366F1),
  art: const _SosArt(accent: Color(0xFF6366F1)),
  title: 'What Parents Can Do',
  sub: 'Powerful, transparent tools for everyday family safety.',
  content: Wrap(
    spacing: 10, runSpacing: 10,
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

Widget _sectionChildGuide(BuildContext ctx) => _SectionLayout(
  accent: const Color(0xFF10B981),
  art: const _AiScanArt(accent: Color(0xFF10B981)),
  title: 'Child Guide',
  sub: 'Connect, complete tasks, and earn rewards.',
  content: const Column(children: [
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
  ]),
);

Widget _sectionChildFeatures(BuildContext ctx) => _SectionLayout(
  accent: const Color(0xFFA855F7),
  art: const _SecurityGlowArt(accent: Color(0xFFA855F7)),
  title: 'What Children Can Do',
  sub: 'Stay on track and have fun building good habits.',
  content: Wrap(
    spacing: 10, runSpacing: 10,
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
  accent: const Color(0xFF2563EB),
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
      const SizedBox(height: 20),
      const Text(
        'READ OUR POLICIES',
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF64748B), letterSpacing: 1.5),
      ),
      const SizedBox(height: 10),
      for (final item in [
        ('Terms of Service',    Icons.description_outlined,  '/support/terms'),
        ('Privacy Policy',      Icons.privacy_tip_outlined,  '/support/privacy'),
        ('Child Safety Policy', Icons.child_care_outlined,   '/support/child-safety'),
      ])
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: GestureDetector(
            onTap: () => ctx.push(item.$3),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.cyan.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.cyan.withValues(alpha: 0.18)),
                boxShadow: [
                  BoxShadow(color: AppColors.cyan.withValues(alpha: 0.08), blurRadius: 10),
                  BoxShadow(color: Colors.black.withValues(alpha: 0.18), blurRadius: 8, offset: const Offset(0, 3)),
                ],
              ),
              child: Row(children: [
                Icon(item.$2, color: AppColors.cyan, size: 16),
                const SizedBox(width: 12),
                Expanded(child: Text(item.$1, style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: Colors.white))),
                Icon(Icons.chevron_right, color: AppColors.cyan.withValues(alpha: 0.50), size: 16),
              ]),
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
  _Section(id: 'how',            accent: const Color(0xFF06B6D4), build: _sectionHow),
  _Section(id: 'parentGuide',    accent: const Color(0xFF3B82F6), build: _sectionParentGuide),
  _Section(id: 'parentFeatures', accent: const Color(0xFF6366F1), build: _sectionParentFeatures),
  _Section(id: 'childGuide',     accent: const Color(0xFF10B981), build: _sectionChildGuide),
  _Section(id: 'childFeatures',  accent: const Color(0xFFA855F7), build: _sectionChildFeatures),
  _Section(id: 'privacy',        accent: const Color(0xFF2563EB), build: _sectionPrivacy),
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
    if (mounted) context.push('/role');
  }

  void _next() {
    if (_last) { _finish(); return; }
    setState(() => _i++);
    _pc.animateToPage(_i, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
    _slide.forward(from: 0);
  }

  void _prev() {
    if (_i == 0) { context.pop(); return; }
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
      body: ResponsiveShell(
            child: Column(
              children: [
                // ── Glass progress bar ──────────────────────────────────────
                _GlassProgressBar(
                  count: _sections.length,
                  active: _i,
                  color: section.accent,
                  onSkip: _finish,
                ),
                const SizedBox(height: 8),
                // ── Scrollable section content ──────────────────────────────
                // ColoredBox is OUTSIDE FadeTransition so the solid dark
                // background is always opaque — fade only affects content.
                // ClipRect prevents card BoxShadow from bleeding outside the
                // PageView bounds during scrolling.
                Expanded(
                  child: ColoredBox(
                    color: AppColors.bg,
                    child: ClipRect(
                      child: PageView.builder(
                        controller: _pc,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _sections.length,
                        onPageChanged: (i) => setState(() => _i = i),
                        itemBuilder: (ctx, i) => FadeTransition(
                          opacity: _fadeIn,
                          child: SingleChildScrollView(
                            clipBehavior: Clip.hardEdge,
                            physics: const BouncingScrollPhysics(),
                            padding: const EdgeInsets.only(bottom: 8),
                            child: _sections[i].build(ctx),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                // ── Bottom navigation ───────────────────────────────────────
                Row(
                  children: [
                    // Back — clay squircle
                    GestureDetector(
                      onTap: _prev,
                      child: Container(
                        width: 58, height: 58,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(18),
                          color: const Color(0xFF141B2E),
                          boxShadow: [
                            BoxShadow(color: Colors.white.withValues(alpha: 0.07), blurRadius: 1, offset: const Offset(0, -1)),
                            BoxShadow(color: Colors.black.withValues(alpha: 0.55), blurRadius: 12, offset: const Offset(0, 6), spreadRadius: -2),
                          ],
                        ),
                        child: Stack(alignment: Alignment.center, children: [
                          Positioned(
                            top: 0, left: 0, right: 0,
                            child: Container(
                              height: 26,
                              decoration: BoxDecoration(
                                borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
                                gradient: LinearGradient(
                                  begin: Alignment.topCenter, end: Alignment.bottomCenter,
                                  colors: [Colors.white.withValues(alpha: 0.08), Colors.transparent],
                                ),
                              ),
                            ),
                          ),
                          const Icon(Icons.chevron_left_rounded, color: Color(0xFF94A3B8), size: 26),
                        ]),
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Next / Get Started — clay gradient pill
                    Expanded(
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        height: 58,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              section.accent,
                              Color.lerp(section.accent, const Color(0xFF06B6D4), 0.40)!,
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(18),
                          boxShadow: [
                            BoxShadow(color: Colors.white.withValues(alpha: 0.12), blurRadius: 1, offset: const Offset(0, -1)),
                            BoxShadow(color: section.accent.withValues(alpha: 0.50), blurRadius: 22, offset: const Offset(0, 8), spreadRadius: -4),
                            BoxShadow(color: Colors.black.withValues(alpha: 0.40), blurRadius: 10, offset: const Offset(0, 6), spreadRadius: -2),
                          ],
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            onTap: _next,
                            borderRadius: BorderRadius.circular(18),
                            child: Stack(alignment: Alignment.center, children: [
                              Positioned(
                                top: 0, left: 0, right: 0,
                                child: Container(
                                  height: 26,
                                  decoration: BoxDecoration(
                                    borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
                                    gradient: LinearGradient(
                                      begin: Alignment.topCenter, end: Alignment.bottomCenter,
                                      colors: [Colors.white.withValues(alpha: 0.18), Colors.transparent],
                                    ),
                                  ),
                                ),
                              ),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    _last ? 'Get Started' : 'Next',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w800,
                                      fontSize: 16,
                                      letterSpacing: 0.3,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Icon(
                                    _last ? Icons.rocket_launch_rounded : Icons.arrow_forward_rounded,
                                    color: Colors.white,
                                    size: 18,
                                  ),
                                ],
                              ),
                            ]),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: safe.bottom + 12),
              ],
            ),
      ),
    );
  }
}

// ── Glass progress bar ────────────────────────────────────────────────────────

class _GlassProgressBar extends StatelessWidget {
  const _GlassProgressBar({
    required this.count,
    required this.active,
    required this.color,
    required this.onSkip,
  });
  final int count;
  final int active;
  final Color color;
  final VoidCallback onSkip;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 6),
      child: Row(
        children: [
          // Animated pill track
          Expanded(
            child: Row(
              children: List.generate(count, (i) {
                final isActive = i == active;
                final isPast = i < active;
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 280),
                  curve: Curves.easeOut,
                  margin: const EdgeInsets.only(right: 5),
                  height: 4,
                  width: isActive ? 22 : isPast ? 10 : 6,
                  decoration: BoxDecoration(
                    color: isActive
                        ? color
                        : isPast
                            ? color.withValues(alpha: 0.40)
                            : Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(99),
                  ),
                );
              }),
            ),
          ),
          const SizedBox(width: 10),
          // Step counter
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            child: Text(
              '${active + 1}/$count',
              key: ValueKey(active),
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: color.withValues(alpha: 0.80),
                letterSpacing: 0.3,
              ),
            ),
          ),
          const SizedBox(width: 14),
          // Skip
          GestureDetector(
            onTap: onSkip,
            child: const Text(
              'Skip',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF4A5568)),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Section scaffold ──────────────────────────────────────────────────────────

class _SectionLayout extends StatelessWidget {
  const _SectionLayout({
    required this.art,
    required this.title,
    required this.sub,
    required this.content,
    required this.accent,
    this.chipLabel,
  });
  final Widget art;
  final String title;
  final String sub;
  final Widget content;
  final Color accent;
  final String? chipLabel;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      // Hero art card — clay stage
      Container(
        width: double.infinity,
        height: 216,
        decoration: BoxDecoration(
          color: const Color(0xFF080D18),
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.55), blurRadius: 18, offset: const Offset(0, 8), spreadRadius: -6),
            BoxShadow(color: accent.withValues(alpha: 0.12), blurRadius: 20, spreadRadius: -12),
          ],
        ),
        child: Stack(children: [
          Positioned(
            top: 0, left: 0, right: 0,
            child: Container(
              height: 50,
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                gradient: LinearGradient(
                  begin: Alignment.topCenter, end: Alignment.bottomCenter,
                  colors: [Colors.white.withValues(alpha: 0.10), Colors.transparent],
                ),
              ),
            ),
          ),
          Center(child: art),
        ]),
      ),
      const SizedBox(height: 18),
      // Brand chip (optional)
      if (chipLabel != null) ...[
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            color: accent.withValues(alpha: 0.12),
            border: Border.all(color: accent.withValues(alpha: 0.30), width: 0.8),
          ),
          child: Text(
            chipLabel!,
            style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w800, color: accent, letterSpacing: 1.2),
          ),
        ),
        const SizedBox(height: 8),
      ],
      // Gradient title
      ShaderMask(
        shaderCallback: (b) => LinearGradient(
          colors: [Colors.white, accent.withValues(alpha: 0.85)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ).createShader(b),
        child: Text(
          title,
          style: const TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w900,
            color: Colors.white,
            height: 1.15,
            letterSpacing: -0.5,
          ),
        ),
      ),
      const SizedBox(height: 7),
      Text(
        sub,
        style: const TextStyle(
          fontSize: 13.5,
          fontWeight: FontWeight.w500,
          color: Color(0xFF7A8899),
          height: 1.55,
        ),
      ),
      const SizedBox(height: 18),
      content,
    ],
  );
}

// ── UI primitives ─────────────────────────────────────────────────────────────

class _IconBubble extends StatelessWidget {
  const _IconBubble({required this.icon, required this.accent, this.size = 42});
  final IconData icon;
  final Color accent;
  final double size;

  @override
  Widget build(BuildContext context) => Container(
    width: size, height: size,
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(size * 0.30),
      gradient: LinearGradient(
        begin: Alignment.topLeft, end: Alignment.bottomRight,
        colors: [accent.withValues(alpha: 0.24), accent.withValues(alpha: 0.08)],
      ),
      border: Border.all(color: accent.withValues(alpha: 0.15), width: 0.5),
      boxShadow: [
        BoxShadow(color: accent.withValues(alpha: 0.18), blurRadius: 8, spreadRadius: -4),
        BoxShadow(color: Colors.black.withValues(alpha: 0.30), blurRadius: 6, offset: const Offset(1, 3), spreadRadius: -2),
      ],
    ),
    child: Icon(icon, color: accent, size: size * 0.46,
      shadows: [Shadow(color: accent.withValues(alpha: 0.50), blurRadius: 6)],
    ),
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
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    decoration: BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topLeft, end: Alignment.bottomRight,
        colors: [const Color(0xFF0D1627), const Color(0xFF070C16)],
      ),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: Colors.white.withValues(alpha: 0.07), width: 0.5),
      boxShadow: [
        BoxShadow(color: Colors.black.withValues(alpha: 0.50), blurRadius: 18, offset: const Offset(0, 8), spreadRadius: -4),
        BoxShadow(color: accent.withValues(alpha: 0.06), blurRadius: 12, spreadRadius: -6),
      ],
    ),
    child: Row(
      children: [
        Stack(clipBehavior: Clip.none, children: [
          _IconBubble(icon: icon, accent: accent, size: 42),
          Positioned(
            top: -6, left: -6,
            child: Container(
              width: 19, height: 19,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                  colors: [accent, Color.lerp(accent, Colors.white, 0.15)!],
                ),
                boxShadow: [BoxShadow(color: accent.withValues(alpha: 0.55), blurRadius: 6)],
              ),
              child: Center(
                child: Text('$n', style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white)),
              ),
            ),
          ),
        ]),
        const SizedBox(width: 14),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: Colors.white, height: 1.3)),
            if (sub != null) ...[
              const SizedBox(height: 3),
              Text(sub!, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: const Color(0xFF7A8899), height: 1.4)),
            ],
          ]),
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
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft, end: Alignment.bottomRight,
            colors: [const Color(0xFF0D1627), const Color(0xFF070C16)],
          ),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Colors.white.withValues(alpha: 0.07), width: 0.5),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.48), blurRadius: 14, offset: const Offset(0, 6), spreadRadius: -4),
            BoxShadow(color: accent.withValues(alpha: 0.06), blurRadius: 10, spreadRadius: -6),
          ],
        ),
        child: Row(children: [
          _IconBubble(icon: icon, accent: accent, size: 34),
          const SizedBox(width: 9),
          Flexible(
            child: Text(
              label,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white, height: 1.3),
            ),
          ),
        ]),
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
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    decoration: BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topLeft, end: Alignment.bottomRight,
        colors: [const Color(0xFF0D1627), const Color(0xFF070C16)],
      ),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: Colors.white.withValues(alpha: 0.07), width: 0.5),
      boxShadow: [
        BoxShadow(color: Colors.black.withValues(alpha: 0.50), blurRadius: 18, offset: const Offset(0, 8), spreadRadius: -4),
        BoxShadow(color: accent.withValues(alpha: 0.06), blurRadius: 12, spreadRadius: -6),
      ],
    ),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _IconBubble(icon: icon, accent: accent, size: 40),
      const SizedBox(width: 12),
      Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const SizedBox(height: 3),
          Text(title, style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: Colors.white)),
          const SizedBox(height: 4),
          Text(sub, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: const Color(0xFF7A8899), height: 1.45)),
        ]),
      ),
    ]),
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATIONS — per-section hero illustrations (unchanged)
// ═══════════════════════════════════════════════════════════════════════════════

// ── Section 1: Radar art ─────────────────────────────────────────────────────

class _RadarArt extends StatefulWidget {
  const _RadarArt({required this.accent});
  final Color accent;
  @override
  State<_RadarArt> createState() => _RadarArtState();
}

class _RadarArtState extends State<_RadarArt> with TickerProviderStateMixin {
  late final AnimationController _ring1 = AnimationController(vsync: this, duration: const Duration(milliseconds: 1800))..repeat();
  late final AnimationController _ring2 = AnimationController(vsync: this, duration: const Duration(milliseconds: 1800))
    ..forward(from: 0.33)..addStatusListener((s) { if (s == AnimationStatus.completed) _ring2.repeat(); });
  late final AnimationController _ring3 = AnimationController(vsync: this, duration: const Duration(milliseconds: 1800))
    ..forward(from: 0.66)..addStatusListener((s) { if (s == AnimationStatus.completed) _ring3.repeat(); });
  late final AnimationController _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat(reverse: true);
  late final Animation<double> _pOp = Tween<double>(begin: 0.5, end: 1.0).animate(_pulse);

  @override
  void dispose() { _ring1.dispose(); _ring2.dispose(); _ring3.dispose(); _pulse.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 140, height: 120,
      child: AnimatedBuilder(
        animation: Listenable.merge([_ring1, _ring2, _ring3, _pulse]),
        builder: (_, __) => CustomPaint(
          painter: _RadarPainter(
            accent: widget.accent,
            r1: _ring1.value,
            r2: _ring2.value,
            r3: _ring3.value,
            pulseOp: _pOp.value,
          ),
        ),
      ),
    );
  }
}

class _RadarPainter extends CustomPainter {
  _RadarPainter({required this.accent, required this.r1, required this.r2, required this.r3, required this.pulseOp});
  final Color accent;
  final double r1, r2, r3, pulseOp;

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;

    void drawRing(double t) {
      final radius = t * 62;
      final opacity = (1 - t).clamp(0.0, 1.0) * 0.5;
      if (opacity <= 0 || radius <= 0) return;
      canvas.drawCircle(
        Offset(cx, cy), radius,
        Paint()
          ..color = accent.withValues(alpha: opacity)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.5,
      );
    }

    drawRing(r1); drawRing(r2); drawRing(r3);

    canvas.drawCircle(Offset(cx, cy), 18, Paint()..color = accent.withValues(alpha: 0.20));
    canvas.drawCircle(
      Offset(cx, cy), 18,
      Paint()..color = accent.withValues(alpha: 0.60)..style = PaintingStyle.stroke..strokeWidth = 1.5,
    );
    canvas.drawCircle(Offset(cx, cy - 2), 5, Paint()..color = accent.withValues(alpha: pulseOp));
  }

  @override
  bool shouldRepaint(_RadarPainter o) => true;
}

// ── Section 2: Analytics art ─────────────────────────────────────────────────

class _AnalyticsArt extends StatefulWidget {
  const _AnalyticsArt({required this.accent});
  final Color accent;
  @override
  State<_AnalyticsArt> createState() => _AnalyticsArtState();
}

class _AnalyticsArtState extends State<_AnalyticsArt> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(seconds: 3))..repeat(reverse: true);

  static const _baseH = [0.5, 0.8, 0.35, 0.65, 0.9, 0.45];
  static const _peakH = [0.85, 0.5, 0.75, 0.40, 0.60, 0.80];

  @override
  void dispose() { _c.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => SizedBox(
    width: 160, height: 100,
    child: AnimatedBuilder(
      animation: _c,
      builder: (_, __) => CustomPaint(
        painter: _AnalyticsPainter(accent: widget.accent, t: _c.value, base: _baseH, peak: _peakH),
      ),
    ),
  );
}

class _AnalyticsPainter extends CustomPainter {
  _AnalyticsPainter({required this.accent, required this.t, required this.base, required this.peak});
  final Color accent;
  final double t;
  final List<double> base, peak;

  @override
  void paint(Canvas canvas, Size size) {
    const barCount = 6;
    const barW = 14.0;
    final gap = (size.width - barCount * barW) / (barCount + 1);
    const maxH = 72.0;

    canvas.drawLine(
      Offset(0, size.height - 2), Offset(size.width, size.height - 2),
      Paint()..color = Colors.white.withValues(alpha: 0.10)..strokeWidth = 1,
    );

    final curve = Curves.easeInOut.transform(t);

    for (int i = 0; i < barCount; i++) {
      final h = (base[i] + (peak[i] - base[i]) * curve) * maxH;
      final x = gap + i * (barW + gap);
      final y = size.height - 2 - h;
      final rect = RRect.fromRectAndRadius(Rect.fromLTWH(x, y, barW, h), const Radius.circular(4));
      final paint = Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter, end: Alignment.bottomCenter,
          colors: [accent, accent.withValues(alpha: 0.25)],
        ).createShader(Rect.fromLTWH(x, y, barW, h));
      canvas.drawRRect(rect, paint);
    }

    final linePaint = Paint()
      ..color = accent.withValues(alpha: 0.55)
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;
    final path = Path();
    for (int i = 0; i < barCount; i++) {
      final h = (base[i] + (peak[i] - base[i]) * curve) * maxH;
      final x = gap + i * (barW + gap) + barW / 2;
      final y = size.height - 2 - h;
      if (i == 0) path.moveTo(x, y); else path.lineTo(x, y);
    }
    canvas.drawPath(path, linePaint);
  }

  @override
  bool shouldRepaint(_AnalyticsPainter o) => true;
}

// ── Section 3: SOS art ───────────────────────────────────────────────────────

class _SosArt extends StatefulWidget {
  const _SosArt({required this.accent});
  final Color accent;
  @override
  State<_SosArt> createState() => _SosArtState();
}

class _SosArtState extends State<_SosArt> with TickerProviderStateMixin {
  late final AnimationController _p1 = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400))..repeat();
  late final AnimationController _p2 = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400))
    ..forward(from: 0.5)..addStatusListener((s) { if (s == AnimationStatus.completed) _p2.repeat(); });
  late final AnimationController _btn = AnimationController(vsync: this, duration: const Duration(milliseconds: 700))..repeat(reverse: true);
  late final Animation<double> _btnOp = Tween<double>(begin: 0.75, end: 1.0).animate(_btn);

  @override
  void dispose() { _p1.dispose(); _p2.dispose(); _btn.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: Listenable.merge([_p1, _p2, _btn]),
    builder: (_, __) => SizedBox(
      width: 130, height: 120,
      child: Stack(alignment: Alignment.center, children: [
        Opacity(
          opacity: (1 - _p1.value).clamp(0.0, 0.6),
          child: Container(
            width: 60 + _p1.value * 60, height: 60 + _p1.value * 60,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFF43F5E), width: 1.5),
            ),
          ),
        ),
        Opacity(
          opacity: (1 - _p2.value).clamp(0.0, 0.6),
          child: Container(
            width: 60 + _p2.value * 60, height: 60 + _p2.value * 60,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFF43F5E), width: 1.5),
            ),
          ),
        ),
        Opacity(
          opacity: _btnOp.value,
          child: Container(
            width: 64, height: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFFF43F5E),
              boxShadow: [BoxShadow(color: const Color(0xFFF43F5E).withValues(alpha: 0.5), blurRadius: 18)],
            ),
            child: const Center(
              child: Text('SOS', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w900, letterSpacing: 1)),
            ),
          ),
        ),
      ]),
    ),
  );
}

// ── Section 4: AI scan art ────────────────────────────────────────────────────

class _AiScanArt extends StatefulWidget {
  const _AiScanArt({required this.accent});
  final Color accent;
  @override
  State<_AiScanArt> createState() => _AiScanArtState();
}

class _AiScanArtState extends State<_AiScanArt> with TickerProviderStateMixin {
  late final AnimationController _rotate = AnimationController(vsync: this, duration: const Duration(seconds: 3))..repeat();
  late final AnimationController _scan   = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat(reverse: true);
  late final AnimationController _blink  = AnimationController(vsync: this, duration: const Duration(milliseconds: 600))..repeat(reverse: true);

  @override
  void dispose() { _rotate.dispose(); _scan.dispose(); _blink.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: Listenable.merge([_rotate, _scan, _blink]),
    builder: (_, __) => SizedBox(
      width: 140, height: 120,
      child: Stack(alignment: Alignment.center, children: [
        Transform.rotate(
          angle: _rotate.value * 2 * math.pi,
          child: Container(
            width: 110, height: 110,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: widget.accent.withValues(alpha: 0.3),
                width: 1.5,
                strokeAlign: BorderSide.strokeAlignCenter,
              ),
            ),
          ),
        ),
        Container(
          width: 62, height: 62,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            color: widget.accent.withValues(alpha: 0.15),
            border: Border.all(color: widget.accent.withValues(alpha: 0.4)),
            boxShadow: [BoxShadow(color: widget.accent.withValues(alpha: 0.3), blurRadius: 20)],
          ),
          child: Icon(Icons.shield_outlined, color: widget.accent, size: 30),
        ),
        Positioned(
          top: 20 + _scan.value * 70,
          left: 20, right: 20,
          child: Container(height: 1.5, color: widget.accent.withValues(alpha: 0.6)),
        ),
        Positioned(
          top: 8, right: 18,
          child: Container(
            width: 8, height: 8,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: widget.accent.withValues(alpha: 0.5 + _blink.value * 0.5),
            ),
          ),
        ),
      ]),
    ),
  );
}

// ── Section 5: Security glow art ─────────────────────────────────────────────

class _SecurityGlowArt extends StatefulWidget {
  const _SecurityGlowArt({required this.accent});
  final Color accent;
  @override
  State<_SecurityGlowArt> createState() => _SecurityGlowArtState();
}

class _SecurityGlowArtState extends State<_SecurityGlowArt> with TickerProviderStateMixin {
  late final AnimationController _glow  = AnimationController(vsync: this, duration: const Duration(milliseconds: 2000))..repeat(reverse: true);
  late final AnimationController _float = AnimationController(vsync: this, duration: const Duration(milliseconds: 2400))..repeat(reverse: true);
  late final Animation<double> _glowOp  = Tween<double>(begin: 0.15, end: 0.40).animate(CurvedAnimation(parent: _glow, curve: Curves.easeInOut));
  late final Animation<double> _floatY  = Tween<double>(begin: 0, end: -5).animate(CurvedAnimation(parent: _float, curve: Curves.easeInOut));

  @override
  void dispose() { _glow.dispose(); _float.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: Listenable.merge([_glow, _float]),
    builder: (_, __) => SizedBox(
      width: 130, height: 120,
      child: Stack(alignment: Alignment.center, children: [
        Container(
          width: 100, height: 100,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: widget.accent.withValues(alpha: _glowOp.value),
            boxShadow: [BoxShadow(color: widget.accent.withValues(alpha: _glowOp.value * 1.5), blurRadius: 40)],
          ),
        ),
        Transform.translate(
          offset: Offset(0, _floatY.value),
          child: Container(
            width: 72, height: 72,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(22),
              color: widget.accent.withValues(alpha: 0.20),
              border: Border.all(color: widget.accent.withValues(alpha: 0.50)),
              boxShadow: [BoxShadow(color: widget.accent.withValues(alpha: 0.35), blurRadius: 20)],
            ),
            child: Center(
              child: SvgPicture.asset('assets/icons/alphaguard_logo.svg', width: 44, height: 44),
            ),
          ),
        ),
      ]),
    ),
  );
}

// ── Section 6: Privacy art ────────────────────────────────────────────────────

class _PrivacyArt extends StatelessWidget {
  const _PrivacyArt({required this.accent});
  final Color accent;

  @override
  Widget build(BuildContext context) => SizedBox(
    width: 120, height: 120,
    child: Stack(alignment: Alignment.center, children: [
      Container(
        width: 100, height: 100,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: accent.withValues(alpha: 0.10),
          boxShadow: [BoxShadow(color: accent.withValues(alpha: 0.20), blurRadius: 30)],
        ),
      ),
      Container(
        width: 64, height: 64,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: LinearGradient(
            colors: [accent.withValues(alpha: 0.30), accent.withValues(alpha: 0.10)],
            begin: Alignment.topLeft, end: Alignment.bottomRight,
          ),
          border: Border.all(color: accent.withValues(alpha: 0.40)),
        ),
        child: Icon(Icons.lock_outlined, color: accent, size: 30),
      ),
    ]),
  );
}
