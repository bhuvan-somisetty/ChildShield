import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/child.dart';
import '../../state/family_controller.dart';
import '../screens/app_management_screen.dart';
import '../screens/approvals_center_screen.dart';
import '../screens/assistant/assistant_screen.dart';
import '../screens/controls_hub_screen.dart';
import '../screens/safety/sos_screen.dart';

// ── Helpers ───────────────────────────────────────────────────────────────────

Color _hex(String hex) {
  final h = hex.replaceFirst('#', '');
  return Color(int.parse('FF$h', radix: 16));
}

Color _riskColor(String r) {
  if (r == 'Low') return const Color(0xFF10B981);
  if (r == 'Medium') return const Color(0xFFF59E0B);
  return const Color(0xFFEF4444);
}

String _ago(int? tsMs) {
  if (tsMs == null) return '—';
  final s = math.max(0, (DateTime.now().millisecondsSinceEpoch - tsMs) ~/ 1000);
  if (s < 10) return 'Just now';
  if (s < 60) return '${s}s ago';
  final m = s ~/ 60;
  if (m < 60) return '${m}m ago';
  return '${m ~/ 60}h ago';
}

String _fmtMins(int m) {
  if (m <= 0) return '0m';
  final h = m ~/ 60;
  final rem = m % 60;
  if (h == 0) return '${rem}m';
  return '${h}h ${rem}m';
}

class _Quick {
  const _Quick({required this.label, required this.icon, required this.accent, this.route});
  final String label;
  final IconData icon;
  final Color accent;
  final String? route;
}

const _QUICK = [
  _Quick(label: 'App\nManagement', icon: Icons.grid_view_rounded, accent: Color(0xFF06B6D4), route: '_app-mgmt'),
  _Quick(label: 'Controls', icon: Icons.tune_rounded, accent: Color(0xFF3B82F6), route: '_controls'),
  _Quick(label: 'SOS\nCenter', icon: Icons.crisis_alert_rounded, accent: Color(0xFFEF4444), route: '_sos'),
  _Quick(label: 'AI\nAssistant', icon: Icons.auto_awesome_rounded, accent: Color(0xFFA855F7), route: '_disha'),
];

// ── HomeScreen ─────────────────────────────────────────────────────────────────

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin {
  late final AnimationController _safetyCtrl = AnimationController(
    vsync: this, duration: const Duration(milliseconds: 1200),
  );
  late final AnimationController _stCtrl = AnimationController(
    vsync: this, duration: const Duration(milliseconds: 1100),
  );
  late final AnimationController _locCtrl = AnimationController(
    vsync: this, duration: const Duration(milliseconds: 2600),
  );

  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    _safetyCtrl.forward();
    _stCtrl.forward();
    _locCtrl.repeat();
    _ticker = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _safetyCtrl.dispose();
    _stCtrl.dispose();
    _locCtrl.dispose();
    _ticker?.cancel();
    super.dispose();
  }

  void _quickTap(BuildContext ctx, _Quick q) {
    if (q.route == '_sos') {
      Navigator.of(ctx).push(MaterialPageRoute(builder: (_) => const SosScreen()));
      return;
    }
    if (q.route == '_disha') {
      Navigator.of(ctx).push(MaterialPageRoute(builder: (_) => AssistantScreen.parent()));
      return;
    }
    if (q.route == '_controls') {
      Navigator.of(ctx).push(MaterialPageRoute(builder: (_) => const ControlsHubScreen()));
      return;
    }
    if (q.route == '_app-mgmt') {
      Navigator.of(ctx).push(MaterialPageRoute(builder: (_) => const AppManagementScreen()));
      return;
    }
    if (q.route == '_approvals') {
      Navigator.of(ctx).push(MaterialPageRoute(builder: (_) => const ApprovalsCenterScreen()));
      return;
    }
    ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
      content: Text('${q.label.replaceAll('\n', ' ')} — coming soon'),
      behavior: SnackBarBehavior.floating,
      backgroundColor: AppColors.bgElevated,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final familyCtrl = context.watch<FamilyController>();
    final child = familyCtrl.selectedChild;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Column(
        children: [
          Expanded(
            child: familyCtrl.loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
                : child == null
                    ? _buildNoChild()
                    : ListView(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                        children: [
                          _buildChildStatusCard(child),
                          const SizedBox(height: 16),
                          _buildSafetyScoreCard(),
                          const SizedBox(height: 16),
                          _buildQuickActions(context),
                          const SizedBox(height: 16),
                          _buildFamilySafety(context),
                          const SizedBox(height: 16),
                          _buildScreenTime(),
                          const SizedBox(height: 16),
                          _buildLocationPreview(child),
                          const SizedBox(height: 16),
                          _buildEmergencyStatus(context),
                          const SizedBox(height: 16),
                          _buildRecentAlerts(),
                          const SizedBox(height: 16),
                          _buildAiRecommendations(),
                        ],
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildNoChild() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SvgPicture.asset('assets/icons/shield.svg', width: 48, height: 48,
                colorFilter: const ColorFilter.mode(AppColors.textMuted, BlendMode.srcIn)),
            const SizedBox(height: 16),
            const Text('No child connected', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 16)),
            const SizedBox(height: 8),
            const Text('Pair a child device to see live data here.', textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
          ],
        ),
      ),
    );
  }

  // 1 · Child Status Card ─────────────────────────────────────────────────────

  Widget _buildChildStatusCard(Child child) {
    final cc = _hex(child.color);
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        gradient: LinearGradient(
          colors: [Colors.white.withValues(alpha: 0.06), Colors.transparent],
          begin: Alignment.topLeft, end: Alignment.bottomRight,
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            top: -40, right: -40,
            child: Container(
              width: 160, height: 160,
              decoration: BoxDecoration(shape: BoxShape.circle, color: cc.withValues(alpha: 0.10)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Row(
                  children: [
                    // Emoji avatar + online dot
                    SizedBox(
                      width: 68, height: 68,
                      child: Stack(
                        children: [
                          Container(
                            width: 64, height: 64,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: cc.withValues(alpha: 0.15),
                              border: Border.all(color: cc.withValues(alpha: 0.33)),
                            ),
                            child: Center(child: Text(child.emoji, style: const TextStyle(fontSize: 30))),
                          ),
                          Positioned(
                            bottom: 0, right: 0,
                            child: Container(
                              width: 20, height: 20,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: child.online ? const Color(0xFF34D399) : const Color(0xFF475569),
                                border: Border.all(color: AppColors.bg, width: 3),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${child.name}${child.age != null ? ', ${child.age}' : ''}',
                            style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: -0.3),
                          ),
                          const SizedBox(height: 4),
                          Row(children: [
                            Container(width: 7, height: 7, decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: child.online ? const Color(0xFF34D399) : const Color(0xFF475569),
                            )),
                            const SizedBox(width: 5),
                            Text(
                              child.online ? 'Online' : 'Offline',
                              style: TextStyle(
                                color: child.online ? const Color(0xFF34D399) : const Color(0xFF475569),
                                fontSize: 12.5, fontWeight: FontWeight.w700,
                              ),
                            ),
                          ]),
                        ],
                      ),
                    ),
                    // Message + Call buttons (right column)
                    Column(children: [
                      _IconBtn(icon: Icons.message_rounded, accent: const Color(0xFF06B6D4), onTap: () {}),
                      const SizedBox(height: 8),
                      _IconBtn(icon: Icons.phone_rounded, accent: const Color(0xFF10B981), onTap: () {}),
                    ]),
                  ],
                ),
                const SizedBox(height: 16),
                // Telemetry 3-grid
                Row(children: [
                  Expanded(child: _TelCell(icon: Icons.battery_5_bar_rounded, label: '—', sub: 'Battery', color: const Color(0xFF22D3EE))),
                  const SizedBox(width: 8),
                  Expanded(child: _TelCell(icon: Icons.wifi_rounded, label: '—', sub: 'Network', color: const Color(0xFF22D3EE))),
                  const SizedBox(width: 8),
                  Expanded(child: _TelCell(icon: Icons.refresh_rounded, label: _ago(null), sub: 'Last update', color: const Color(0xFF22D3EE))),
                ]),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // 2 · Safety Score Ring ─────────────────────────────────────────────────────

  Widget _buildSafetyScoreCard() {
    const score = 85;
    const risk = 'Low';
    const trend = -3;
    final rc = _riskColor(risk);
    return _DashCard(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            SizedBox(
              width: 84, height: 84,
              child: AnimatedBuilder(
                animation: _safetyCtrl,
                builder: (_, __) => CustomPaint(
                  painter: _RingPainter(
                    progress: _safetyCtrl.value * (score / 100),
                    trackColor: Colors.white.withValues(alpha: 0.08),
                    arcColor: rc, strokeWidth: 8, radius: 34,
                  ),
                  child: Center(child: Text('$score', style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900))),
                ),
              ),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('SAFETY SCORE', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1.4)),
                  const SizedBox(height: 4),
                  Text('$risk Risk', style: TextStyle(color: rc, fontSize: 17, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 6),
                  Row(children: [
                    Icon(
                      trend <= 0 ? Icons.trending_down_rounded : Icons.trending_up_rounded,
                      size: 14,
                      color: trend <= 0 ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${trend.abs()}% this week',
                      style: TextStyle(
                        color: trend <= 0 ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                        fontSize: 12, fontWeight: FontWeight.w700,
                      ),
                    ),
                  ]),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 3 · Quick Actions ─────────────────────────────────────────────────────────

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _DashLabel('Quick Actions'),
        const SizedBox(height: 10),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4, crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 0.80,
          ),
          itemCount: _QUICK.length,
          itemBuilder: (_, i) {
            final q = _QUICK[i];
            return GestureDetector(
              onTap: () => _quickTap(context, q),
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
                      width: 40, height: 40,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        color: q.accent.withValues(alpha: 0.12),
                        border: Border.all(color: q.accent.withValues(alpha: 0.23)),
                      ),
                      child: Icon(q.icon, size: 18, color: q.accent),
                    ),
                    const SizedBox(height: 8),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: Text(q.label, textAlign: TextAlign.center,
                          style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 10, fontWeight: FontWeight.w700, height: 1.15)),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  // 4 · Family Safety 2×2 ─────────────────────────────────────────────────────

  Widget _buildFamilySafety(BuildContext context) {
    final cells = [
      _SafeData(icon: Icons.access_time_rounded, accent: const Color(0xFF06B6D4), label: 'REMAINING TODAY', value: 'Unlimited'),
      _SafeData(icon: Icons.shield_rounded, accent: const Color(0xFF10B981), label: 'SAFE ZONE', value: 'Inside Home'),
      _SafeData(icon: Icons.bedtime_rounded, accent: const Color(0xFF6366F1), label: 'NIGHT RESTRICTION', value: 'Off'),
      _SafeData(icon: Icons.lock_rounded, accent: const Color(0xFFEF4444), label: 'APPS RESTRICTED', value: '0 apps'),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _DashLabel('Family Safety'),
        const SizedBox(height: 10),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.5,
          ),
          itemCount: cells.length,
          itemBuilder: (_, i) {
            final s = cells[i];
            return GestureDetector(
              onTap: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                content: Text('${s.label} — coming in Phase 6'),
                behavior: SnackBarBehavior.floating, backgroundColor: AppColors.bgElevated,
              )),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                  color: AppColors.bgElevated,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Container(
                        width: 32, height: 32,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          color: s.accent.withValues(alpha: 0.12),
                        ),
                        child: Icon(s.icon, size: 15, color: s.accent),
                      ),
                      const Spacer(),
                      Icon(Icons.chevron_right_rounded, size: 15, color: Colors.white.withValues(alpha: 0.25)),
                    ]),
                    const Spacer(),
                    Text(s.label, style: const TextStyle(color: AppColors.textMuted, fontSize: 10.5, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
                    const SizedBox(height: 2),
                    Text(s.value, style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w900), overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  // 5 · Screen Time Ring ──────────────────────────────────────────────────────

  Widget _buildScreenTime() {
    const pct = 0.0;
    return GestureDetector(
      onTap: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Screen Time — coming in Phase 6'),
        behavior: SnackBarBehavior.floating, backgroundColor: AppColors.bgElevated,
      )),
      child: _DashCard(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              SizedBox(
                width: 72, height: 72,
                child: AnimatedBuilder(
                  animation: _stCtrl,
                  builder: (_, __) => CustomPaint(
                    painter: _RingPainter(
                      progress: _stCtrl.value * pct,
                      trackColor: Colors.white.withValues(alpha: 0.08),
                      arcColor: const Color(0xFF06B6D4), strokeWidth: 7, radius: 30,
                    ),
                    child: const Center(child: Text('0%', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w900))),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Icon(Icons.access_time_rounded, size: 13, color: Color(0xFF22D3EE)),
                      SizedBox(width: 6),
                      Text('SCREEN TIME', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1)),
                    ]),
                    SizedBox(height: 4),
                    Row(children: [
                      Text('0m', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                      Text(' / Unlimited', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                    ]),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, size: 20, color: AppColors.textMuted),
            ],
          ),
        ),
      ),
    );
  }

  // 6 · Location Preview ──────────────────────────────────────────────────────

  Widget _buildLocationPreview(Child child) {
    final cc = _hex(child.color);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _DashLabel('Location'),
        const SizedBox(height: 10),
        _DashCard(
          child: SizedBox(
            height: 150,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(22),
              child: Stack(
                children: [
                  Positioned.fill(child: CustomPaint(painter: _GridPainter())),
                  Positioned.fill(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: RadialGradient(
                          center: const Alignment(0, -0.1), radius: 0.6,
                          colors: [cc.withValues(alpha: 0.13), Colors.transparent],
                        ),
                      ),
                    ),
                  ),
                  Center(
                    child: AnimatedBuilder(
                      animation: _locCtrl,
                      builder: (_, inner) {
                        final t = _locCtrl.value;
                        return Stack(
                          alignment: Alignment.center,
                          children: [
                            Transform.scale(
                              scale: 1.0 + t,
                              child: Container(
                                width: 40, height: 40,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(color: cc.withValues(alpha: (1.0 - t).clamp(0.0, 0.5))),
                                ),
                              ),
                            ),
                            inner!,
                          ],
                        );
                      },
                      child: Container(
                        width: 40, height: 40,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: cc.withValues(alpha: 0.20),
                          border: Border.all(color: cc, width: 2),
                        ),
                        child: Center(child: Text(child.emoji, style: const TextStyle(fontSize: 18))),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 12, left: 12, right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        color: Colors.black.withValues(alpha: 0.50),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.10)),
                      ),
                      child: Row(children: [
                        Container(
                          width: 32, height: 32,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(10),
                            color: const Color(0xFF10B981).withValues(alpha: 0.15),
                          ),
                          child: const Icon(Icons.location_on_rounded, size: 15, color: Color(0xFF34D399)),
                        ),
                        const SizedBox(width: 10),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Location unavailable', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12.5)),
                              Text('Enable sharing in child app', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ),
                      ]),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  // 7 · Emergency Status ──────────────────────────────────────────────────────

  Widget _buildEmergencyStatus(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SosScreen())),
      child: _DashCard(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                color: const Color(0xFF10B981).withValues(alpha: 0.15),
              ),
              child: const Icon(Icons.check_circle_rounded, size: 20, color: Color(0xFF10B981)),
            ),
            const SizedBox(width: 14),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Emergency Status', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14)),
                  SizedBox(height: 2),
                  Text('All Clear', style: TextStyle(color: Color(0xFF10B981), fontSize: 12.5, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, size: 20, color: AppColors.textMuted),
          ]),
        ),
      ),
    );
  }

  // 8 · Recent Alerts ─────────────────────────────────────────────────────────

  Widget _buildRecentAlerts() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(children: [
          const _DashLabel('Recent Alerts'),
          const Spacer(),
          const Row(children: [
            Text('View All', style: TextStyle(color: AppColors.cyan, fontSize: 12, fontWeight: FontWeight.w700)),
            Icon(Icons.chevron_right_rounded, size: 14, color: AppColors.cyan),
          ]),
        ]),
        const SizedBox(height: 10),
        _DashCard(
          child: const Padding(
            padding: EdgeInsets.all(24),
            child: Column(children: [
              Icon(Icons.notifications_none_rounded, size: 32, color: AppColors.textMuted),
              SizedBox(height: 8),
              Text('No recent alerts', style: TextStyle(color: AppColors.textMuted, fontSize: 13, fontWeight: FontWeight.w600)),
            ]),
          ),
        ),
      ],
    );
  }

  // 9 · AI Recommendations ────────────────────────────────────────────────────

  Widget _buildAiRecommendations() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _DashLabel('AI Recommendations'),
        const SizedBox(height: 10),
        _DashCard(
          child: const Padding(
            padding: EdgeInsets.all(24),
            child: Column(children: [
              Icon(Icons.auto_awesome_rounded, size: 28, color: AppColors.textMuted),
              SizedBox(height: 8),
              Text('No recommendations yet', style: TextStyle(color: AppColors.textMuted, fontSize: 13, fontWeight: FontWeight.w600)),
              SizedBox(height: 4),
              Text('Check back after your child has been active for a day.',
                  textAlign: TextAlign.center, style: TextStyle(color: AppColors.textMuted, fontSize: 11.5)),
            ]),
          ),
        ),
      ],
    );
  }
}

// ── Shared layout atoms ───────────────────────────────────────────────────────

class _DashCard extends StatelessWidget {
  const _DashCard({required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(22),
      border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      color: AppColors.bgElevated,
    ),
    child: child,
  );
}

class _DashLabel extends StatelessWidget {
  const _DashLabel(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(left: 4, bottom: 2),
    child: Text(text.toUpperCase(),
        style: const TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1.4)),
  );
}

class _TelCell extends StatelessWidget {
  const _TelCell({required this.icon, required this.label, required this.sub, required this.color});
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

class _IconBtn extends StatelessWidget {
  const _IconBtn({required this.icon, required this.accent, required this.onTap});
  final IconData icon;
  final Color accent;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: 44, height: 44,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        color: accent.withValues(alpha: 0.15),
        border: Border.all(color: accent.withValues(alpha: 0.30)),
      ),
      child: Icon(icon, size: 19, color: accent),
    ),
  );
}

class _SafeData {
  const _SafeData({required this.icon, required this.accent, required this.label, required this.value});
  final IconData icon;
  final Color accent;
  final String label;
  final String value;
}

// ── Custom painters ───────────────────────────────────────────────────────────

class _RingPainter extends CustomPainter {
  const _RingPainter({
    required this.progress, required this.trackColor,
    required this.arcColor, required this.strokeWidth, required this.radius,
  });
  final double progress;
  final Color trackColor;
  final Color arcColor;
  final double strokeWidth;
  final double radius;

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2, cy = size.height / 2;
    final rect = Rect.fromCircle(center: Offset(cx, cy), radius: radius);
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    paint.color = trackColor;
    canvas.drawArc(rect, 0, 2 * math.pi, false, paint);
    paint.color = arcColor;
    canvas.drawArc(rect, -math.pi / 2, 2 * math.pi * progress.clamp(0.0, 1.0), false, paint);
  }

  @override
  bool shouldRepaint(_RingPainter o) => o.progress != progress || o.arcColor != arcColor;
}

class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    const step = 28.0;
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.14)
      ..strokeWidth = 0.5;
    for (double x = 0; x <= size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y <= size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(_GridPainter _) => false;
}
