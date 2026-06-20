import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../state/auth_controller.dart';
import 'child_contacts_screen.dart';
import 'child_goals_screen.dart';
import 'child_settings_screen.dart';
import 'child_sos_screen.dart';

// ── Helper ────────────────────────────────────────────────────────────────────

Color _childHex(String hex) {
  final h = hex.replaceFirst('#', '');
  return Color(int.parse('FF$h', radix: 16));
}

String _greeting() {
  final h = DateTime.now().hour;
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Section grid data ─────────────────────────────────────────────────────────

class _Sec {
  const _Sec({required this.label, required this.icon, required this.accent, this.route});
  final String label;
  final IconData icon;
  final Color accent;
  final String? route;
}

const _SECTIONS = [
  _Sec(label: 'SOS', icon: Icons.crisis_alert_rounded, accent: Color(0xFFEF4444), route: '_sos'),
  _Sec(label: 'Contacts', icon: Icons.phone_rounded, accent: Color(0xFF10B981), route: '_contacts'),
  _Sec(label: 'Chat', icon: Icons.chat_bubble_rounded, accent: Color(0xFF06B6D4)),
  _Sec(label: 'DISHA', icon: Icons.auto_awesome_rounded, accent: Color(0xFFA855F7)),
  _Sec(label: 'Goals', icon: Icons.track_changes_rounded, accent: Color(0xFFF59E0B), route: '_goals'),
  _Sec(label: 'Settings', icon: Icons.settings_rounded, accent: Color(0xFF64748B), route: '_settings'),
];

// ── Child Dashboard ───────────────────────────────────────────────────────────

/// Child home — matches ChildHome.jsx exactly:
///   1. Greeting row + "PROTECTED" badge
///   2. Identity card (gradient, glow, grade/school, telemetry 3-grid, location row)
///   3. Full-width pulsing SOS button
///   4. 6-section grid (3 cols)
///   5. Goals snapshot card
class ChildDashboard extends StatefulWidget {
  const ChildDashboard({super.key, required this.childId, this.childName});
  final String childId;
  final String? childName;
  @override
  State<ChildDashboard> createState() => _ChildDashboardState();
}

class _ChildDashboardState extends State<ChildDashboard> with SingleTickerProviderStateMixin {
  // Opacity oscillation 0.4 → 0.8 → 0.4, period 1.8s → each half = 900ms
  late final AnimationController _sosCtrl = AnimationController(
    vsync: this, duration: const Duration(milliseconds: 900),
  );
  late final Animation<double> _sosAnim = Tween<double>(begin: 0.4, end: 0.8)
      .animate(CurvedAnimation(parent: _sosCtrl, curve: Curves.easeInOut));

  @override
  void initState() {
    super.initState();
    _sosCtrl.repeat(reverse: true);
  }

  @override
  void dispose() {
    _sosCtrl.dispose();
    super.dispose();
  }

  void _onSection(BuildContext ctx, _Sec s) {
    if (s.route == '_sos') {
      Navigator.of(ctx).push(MaterialPageRoute(fullscreenDialog: true, builder: (_) => const ChildSosScreen()));
      return;
    }
    if (s.route == '_contacts') {
      Navigator.of(ctx).push(MaterialPageRoute(builder: (_) => const ChildContactsScreen()));
      return;
    }
    if (s.route == '_goals') {
      Navigator.of(ctx).push(MaterialPageRoute(builder: (_) => ChildGoalsScreen(childId: widget.childId)));
      return;
    }
    if (s.route == '_settings') {
      Navigator.of(ctx).push(MaterialPageRoute(builder: (_) => const ChildSettingsScreen()));
      return;
    }
    ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
      content: Text('${s.label} — coming in Phase 6'),
      behavior: SnackBarBehavior.floating,
      backgroundColor: AppColors.bgElevated,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final child = auth.child;
    final childColor = child != null ? _childHex(child.color) : AppColors.cyan;
    final safe = MediaQuery.of(context).padding;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: ListView(
          padding: EdgeInsets.fromLTRB(16, 12, 16, safe.bottom + 80),
          children: [
            _buildGreetingRow(child?.name ?? widget.childName ?? 'there', child?.emoji ?? '👋'),
            const SizedBox(height: 16),
            _buildIdentityCard(child, childColor),
            const SizedBox(height: 16),
            _buildSosButton(),
            const SizedBox(height: 16),
            _buildSectionGrid(context),
            const SizedBox(height: 16),
            _buildGoalsCard(),
          ],
        ),
      ),
    );
  }

  // 1 · Greeting row ──────────────────────────────────────────────────────────

  Widget _buildGreetingRow(String name, String emoji) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_greeting(), style: const TextStyle(color: AppColors.textMuted, fontSize: 13, fontWeight: FontWeight.w700)),
            const SizedBox(height: 2),
            Text('Hi, $name $emoji',
                style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.3, height: 1.1)),
          ],
        ),
        // "PROTECTED" badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            color: const Color(0xFF10B981).withValues(alpha: 0.15),
            border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.25)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              SvgPicture.asset('assets/icons/shield_check.svg', width: 13, height: 13,
                  colorFilter: const ColorFilter.mode(Color(0xFF10B981), BlendMode.srcIn)),
              const SizedBox(width: 5),
              const Text('PROTECTED',
                  style: TextStyle(color: Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
            ],
          ),
        ),
      ],
    );
  }

  // 2 · Identity + status card ────────────────────────────────────────────────

  Widget _buildIdentityCard(dynamic child, Color childColor) {
    final name = child?.name as String? ?? widget.childName ?? 'Me';
    final age = child?.age as int?;
    final grade = (child?.grade as String?) ?? '—';
    final school = (child?.school as String?) ?? '—';
    final emoji = (child?.emoji as String?) ?? '👦';

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.20)),
        gradient: LinearGradient(
          colors: [const Color(0xFF10B981).withValues(alpha: 0.08), Colors.transparent],
          begin: Alignment.topLeft, end: Alignment.bottomRight,
        ),
      ),
      child: Stack(
        children: [
          // Glow blob
          Positioned(
            top: -40, right: -40,
            child: Container(
              width: 160, height: 160,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF10B981).withValues(alpha: 0.10),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                // Profile row
                Row(
                  children: [
                    Container(
                      width: 56, height: 56,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        color: childColor.withValues(alpha: 0.15),
                        border: Border.all(color: childColor.withValues(alpha: 0.33)),
                      ),
                      child: Center(child: Text(emoji, style: const TextStyle(fontSize: 28))),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${name}${age != null ? ', $age' : ''}',
                            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: -0.2),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            '$grade · $school',
                            style: const TextStyle(color: AppColors.textSecondary, fontSize: 12.5, fontWeight: FontWeight.w600),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Telemetry 3-grid
                Row(children: [
                  Expanded(child: _ChildTelCell(icon: Icons.battery_5_bar_rounded, label: '—', sub: 'Battery', color: const Color(0xFF22D3EE))),
                  const SizedBox(width: 8),
                  Expanded(child: _ChildTelCell(icon: Icons.wifi_rounded, label: '—', sub: 'Network', color: const Color(0xFF22D3EE))),
                  const SizedBox(width: 8),
                  Expanded(child: _ChildTelCell(
                    icon: Icons.shield_rounded, label: 'Safe', sub: 'Status', color: const Color(0xFF10B981),
                  )),
                ]),
                const SizedBox(height: 16),
                // "Location shared" row
                Row(children: [
                  const Icon(Icons.location_on_rounded, size: 13, color: Color(0xFF34D399)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Location is shared with ${context.read<AuthController>().parent?.name ?? 'your parent'}',
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),
                ]),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // 3 · Full-width SOS button ─────────────────────────────────────────────────

  Widget _buildSosButton() {
    return GestureDetector(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(fullscreenDialog: true, builder: (_) => const ChildSosScreen()),
      ),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.30)),
          gradient: const LinearGradient(
            colors: [Color(0x33991B1B), Color(0x1A7F1D1D)],
            begin: Alignment.centerLeft, end: Alignment.centerRight,
          ),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 48, height: 48,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Pulsing glow ring
                  AnimatedBuilder(
                    animation: _sosAnim,
                    builder: (_, __) => Container(
                      width: 56, height: 56,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFFEF4444).withValues(alpha: _sosAnim.value * 0.30),
                      ),
                    ),
                  ),
                  Container(
                    width: 48, height: 48,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: const Color(0xFFEF4444).withValues(alpha: 0.20),
                      border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.40)),
                    ),
                    child: const Icon(Icons.crisis_alert_rounded, size: 24, color: Color(0xFFFCA5A5)),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Emergency SOS', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900)),
                  SizedBox(height: 2),
                  Text('Tap if you need help right now',
                      style: TextStyle(color: Color(0xFFFCA5A5), fontSize: 12.5, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, size: 20, color: Color(0xFFF87171)),
          ],
        ),
      ),
    );
  }

  // 4 · Section grid ──────────────────────────────────────────────────────────

  Widget _buildSectionGrid(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(left: 4, bottom: 10),
          child: Text('MY ALPHAGUARD',
              style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1.4)),
        ),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3, crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 1.0,
          ),
          itemCount: _SECTIONS.length,
          itemBuilder: (_, i) {
            final s = _SECTIONS[i];
            return GestureDetector(
              onTap: () => _onSection(context, s),
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.07)),
                  color: AppColors.bgElevated,
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 44, height: 44,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(14),
                        color: s.accent.withValues(alpha: 0.12),
                        border: Border.all(color: s.accent.withValues(alpha: 0.23)),
                      ),
                      child: Icon(s.icon, size: 19, color: s.accent),
                    ),
                    const SizedBox(height: 8),
                    Text(s.label, style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 11, fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  // 5 · Goals snapshot card ───────────────────────────────────────────────────

  Widget _buildGoalsCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        color: AppColors.bgElevated,
      ),
      child: Row(
        children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
              border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.30)),
            ),
            child: const Icon(Icons.track_changes_rounded, size: 20, color: Color(0xFFF59E0B)),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Study goals', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14)),
                SizedBox(height: 2),
                Text('0 of 0 done today', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          GestureDetector(
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => ChildGoalsScreen(childId: widget.childId)),
            ),
            child: const Row(children: [
              Text('Open', style: TextStyle(color: Color(0xFF34D399), fontSize: 12.5, fontWeight: FontWeight.w700)),
              Icon(Icons.chevron_right_rounded, size: 15, color: Color(0xFF34D399)),
            ]),
          ),
        ],
      ),
    );
  }
}

// ── Telemetry cell ────────────────────────────────────────────────────────────

class _ChildTelCell extends StatelessWidget {
  const _ChildTelCell({required this.icon, required this.label, required this.sub, required this.color});
  final IconData icon;
  final String label;
  final String sub;
  final Color color;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(16),
      color: Colors.black.withValues(alpha: 0.20),
      border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
    ),
    child: Column(children: [
      Icon(icon, size: 16, color: color),
      const SizedBox(height: 4),
      Text(label, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w900), overflow: TextOverflow.ellipsis),
      const SizedBox(height: 2),
      Text(sub, style: const TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w700)),
    ]),
  );
}
