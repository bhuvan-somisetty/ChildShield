import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/child.dart';
import '../../services/socket/socket_service.dart';
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

String _ago(int? tsMs) {
  if (tsMs == null) return '—';
  final s = math.max(0, (DateTime.now().millisecondsSinceEpoch - tsMs) ~/ 1000);
  if (s < 10) return 'Just now';
  if (s < 60) return '${s}s ago';
  final m = s ~/ 60;
  if (m < 60) return '${m}m ago';
  return '${m ~/ 60}h ago';
}

class _Quick {
  const _Quick({required this.label, required this.icon, required this.accent, this.route});
  final String label;
  final IconData icon;
  final Color accent;
  final String? route;
}

const _QUICK = [
  _Quick(label: 'App\nManagement', icon: Icons.grid_view_rounded,   accent: Color(0xFF06B6D4), route: '_app-mgmt'),
  _Quick(label: 'Controls',        icon: Icons.tune_rounded,         accent: Color(0xFF3B82F6), route: '_controls'),
  _Quick(label: 'SOS\nCenter',     icon: Icons.crisis_alert_rounded, accent: Color(0xFFEF4444), route: '_sos'),
  _Quick(label: 'AI\nAssistant',   icon: Icons.auto_awesome_rounded, accent: Color(0xFFA855F7), route: '_disha'),
];

// ── HomeScreen ────────────────────────────────────────────────────────────────

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin {
  late final AnimationController _locCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 2600));
  late final AnimationController _enter   = AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
  late final Animation<double>   _fadeIn  = CurvedAnimation(parent: _enter, curve: Curves.easeOut);

  Timer? _ticker;
  Map<String, dynamic>? _liveBattery;
  void Function()? _batUnsub;

  @override
  void initState() {
    super.initState();
    _locCtrl.repeat();
    _enter.forward();
    _ticker = Timer.periodic(const Duration(seconds: 5), (_) { if (mounted) setState(() {}); });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _batUnsub = context.read<SocketService>().on('battery:update', (data) {
        if (!mounted) return;
        setState(() => _liveBattery = data as Map<String, dynamic>?);
      });
    });
  }

  @override
  void dispose() {
    _batUnsub?.call();
    _locCtrl.dispose();
    _enter.dispose();
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
  }

  @override
  Widget build(BuildContext context) {
    final familyCtrl = context.watch<FamilyController>();
    final child = familyCtrl.selectedChild;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Stack(
        children: [
          Positioned(
            top: -60, left: 0, right: 0,
            child: Container(
              height: 250,
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  colors: [
                    (child != null ? _hex(child.color) : AppColors.blue).withValues(alpha: 0.08),
                    Colors.transparent,
                  ],
                  radius: 0.9,
                ),
              ),
            ),
          ),
          FadeTransition(
            opacity: _fadeIn,
            child: Column(
              children: [
                Expanded(
                  child: familyCtrl.loading
                      ? const Center(child: CircularProgressIndicator(color: AppColors.cyan, strokeWidth: 2))
                      : child == null
                          ? _buildNoChild()
                          : ListView(
                              padding: const EdgeInsets.fromLTRB(16, 12, 16, 110),
                              children: [
                                _buildChildStatusCard(child),
                                const SizedBox(height: 14),
                                _buildBentoRow(context, child),
                                const SizedBox(height: 14),
                                _buildLocationPreview(child),
                                const SizedBox(height: 14),
                                _buildBottomBento(context),
                              ],
                            ),
                ),
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
        padding: const EdgeInsets.all(36),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72, height: 72,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(22),
                color: AppColors.blue.withValues(alpha: 0.10),
                border: Border.all(color: AppColors.blue.withValues(alpha: 0.22)),
              ),
              child: const Icon(Icons.link_off_rounded, color: AppColors.blue, size: 30),
            ),
            const SizedBox(height: 18),
            const Text('No child connected', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 17)),
            const SizedBox(height: 8),
            const Text('Pair a child device to see live data here.', textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textMuted, fontSize: 13.5, height: 1.55)),
          ],
        ),
      ),
    );
  }

  Widget _buildChildStatusCard(Child child) {
    final batLevel    = (_liveBattery?['level'] as int?) ?? child.batteryLevel;
    final batCharging = (_liveBattery?['charging'] as bool?) ?? child.batteryCharging;
    final lastAt      = (_liveBattery?['at'] as int?) ?? child.lastSeenAt;
    final batLabel    = batLevel != null ? '$batLevel%' : '—';
    final batIcon     = batCharging ? Icons.battery_charging_full_rounded : Icons.battery_5_bar_rounded;
    final batColor    = batLevel != null && batLevel < 20 ? AppColors.danger : const Color(0xFF22D3EE);
    final cc          = _hex(child.color);

    return Container(
      decoration: AppColors.glassCard(accent: cc, radius: 26, borderAlpha: 0.18, fillAlpha: 0.06),
      child: Stack(
        children: [
          Positioned(
            top: -50, right: -50,
            child: Container(
              width: 180, height: 180,
              decoration: BoxDecoration(shape: BoxShape.circle, color: cc.withValues(alpha: 0.09)),
            ),
          ),
          Positioned(
            top: 0, left: 0, right: 0,
            child: Container(
              height: 60,
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(26)),
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.white.withValues(alpha: 0.06), Colors.transparent],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Row(
                  children: [
                    SizedBox(
                      width: 70, height: 70,
                      child: Stack(
                        children: [
                          Container(
                            width: 66, height: 66,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: cc.withValues(alpha: 0.15),
                              border: Border.all(color: cc.withValues(alpha: 0.40), width: 2),
                              boxShadow: [BoxShadow(color: cc.withValues(alpha: 0.25), blurRadius: 16)],
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
                                border: Border.all(color: AppColors.bg, width: 2.5),
                                boxShadow: child.online
                                    ? [BoxShadow(color: const Color(0xFF34D399).withValues(alpha: 0.50), blurRadius: 8)]
                                    : [],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${child.name}${child.age != null ? ', ${child.age}' : ''}',
                            style: const TextStyle(color: Colors.white, fontSize: 21, fontWeight: FontWeight.w900, letterSpacing: -0.3),
                          ),
                          const SizedBox(height: 5),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(99),
                              color: child.online
                                  ? const Color(0xFF34D399).withValues(alpha: 0.14)
                                  : const Color(0xFF475569).withValues(alpha: 0.20),
                              border: Border.all(
                                color: child.online
                                    ? const Color(0xFF34D399).withValues(alpha: 0.28)
                                    : const Color(0xFF475569).withValues(alpha: 0.20),
                              ),
                            ),
                            child: Row(mainAxisSize: MainAxisSize.min, children: [
                              Container(
                                width: 6, height: 6,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: child.online ? const Color(0xFF34D399) : const Color(0xFF475569),
                                ),
                              ),
                              const SizedBox(width: 5),
                              Text(
                                child.online ? 'Online' : 'Offline',
                                style: TextStyle(
                                  color: child.online ? const Color(0xFF34D399) : const Color(0xFF94A3B8),
                                  fontSize: 11.5, fontWeight: FontWeight.w700,
                                ),
                              ),
                            ]),
                          ),
                        ],
                      ),
                    ),
                    Column(children: [
                      _GlassIconBtn(icon: Icons.message_rounded,  accent: const Color(0xFF06B6D4), onTap: () {}),
                      const SizedBox(height: 8),
                      _GlassIconBtn(icon: Icons.phone_rounded,    accent: const Color(0xFF10B981), onTap: () {}),
                    ]),
                  ],
                ),
                const SizedBox(height: 16),
                Row(children: [
                  Expanded(child: _TelCell(icon: batIcon, label: batLabel, sub: batCharging ? 'Charging' : 'Battery', color: batColor)),
                  const SizedBox(width: 8),
                  Expanded(child: _TelCell(
                    icon: child.online ? Icons.wifi_rounded : Icons.wifi_off_rounded,
                    label: child.online ? 'Online' : 'Offline',
                    sub: 'Network',
                    color: child.online ? const Color(0xFF22D3EE) : const Color(0xFF94A3B8),
                  )),
                  const SizedBox(width: 8),
                  Expanded(child: _TelCell(icon: Icons.sync_rounded, label: _ago(lastAt), sub: 'Last sync', color: const Color(0xFF22D3EE))),
                ]),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBentoRow(BuildContext context, Child child) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 5,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: AppColors.glassCard(accent: AppColors.success, radius: 22, borderAlpha: 0.14, fillAlpha: 0.04),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Container(
                    width: 36, height: 36,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(11),
                      color: AppColors.success.withValues(alpha: 0.14),
                      border: Border.all(color: AppColors.success.withValues(alpha: 0.28)),
                    ),
                    child: const Icon(Icons.shield_rounded, size: 18, color: AppColors.success),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(99),
                      color: AppColors.success.withValues(alpha: 0.10),
                    ),
                    child: const Text('SAFE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: AppColors.success, letterSpacing: 1)),
                  ),
                ]),
                const SizedBox(height: 12),
                const Text('Safety\nScore', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textMuted, height: 1.3)),
                const SizedBox(height: 4),
                const Text('—', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Colors.white)),
                const SizedBox(height: 2),
                const Text('Active soon', style: TextStyle(fontSize: 10, color: AppColors.textMuted, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          flex: 7,
          child: GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
              childAspectRatio: 1.05,
            ),
            itemCount: _QUICK.length,
            itemBuilder: (_, i) {
              final q = _QUICK[i];
              return _QuickTile(q: q, onTap: () => _quickTap(context, q));
            },
          ),
        ),
      ],
    );
  }

  Widget _buildLocationPreview(Child child) {
    final cc = _hex(child.color);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionLabel('Location'),
        const SizedBox(height: 8),
        Container(
          decoration: AppColors.glassCard(accent: cc, radius: 22),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(22),
            child: SizedBox(
              height: 155,
              child: Stack(
                children: [
                  Positioned.fill(child: CustomPaint(painter: _GridPainter())),
                  Positioned.fill(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: RadialGradient(
                          center: const Alignment(0, -0.1), radius: 0.65,
                          colors: [cc.withValues(alpha: 0.14), Colors.transparent],
                        ),
                      ),
                    ),
                  ),
                  Center(
                    child: AnimatedBuilder(
                      animation: _locCtrl,
                      builder: (_, inner) => Stack(
                        alignment: Alignment.center,
                        children: [
                          Transform.scale(
                            scale: 1.0 + _locCtrl.value,
                            child: Container(
                              width: 44, height: 44,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: cc.withValues(alpha: (1.0 - _locCtrl.value).clamp(0.0, 0.5))),
                              ),
                            ),
                          ),
                          inner!,
                        ],
                      ),
                      child: Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: cc.withValues(alpha: 0.22),
                          border: Border.all(color: cc, width: 2),
                          boxShadow: [BoxShadow(color: cc.withValues(alpha: 0.35), blurRadius: 12)],
                        ),
                        child: Center(child: Text(child.emoji, style: const TextStyle(fontSize: 19))),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 10, left: 10, right: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        color: Colors.black.withValues(alpha: 0.55),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.10)),
                      ),
                      child: Row(children: [
                        Container(
                          width: 30, height: 30,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(9),
                            color: AppColors.success.withValues(alpha: 0.14),
                          ),
                          child: const Icon(Icons.location_on_rounded, size: 14, color: Color(0xFF34D399)),
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

  Widget _buildBottomBento(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SosScreen())),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: AppColors.glassCard(accent: AppColors.danger, radius: 20, borderAlpha: 0.18, fillAlpha: 0.04),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 38, height: 38,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          color: AppColors.danger.withValues(alpha: 0.14),
                          border: Border.all(color: AppColors.danger.withValues(alpha: 0.28)),
                        ),
                        child: const Icon(Icons.shield_outlined, size: 18, color: AppColors.danger),
                      ),
                      const SizedBox(height: 12),
                      const Text('Emergency', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13.5)),
                      const SizedBox(height: 2),
                      const Text('No active SOS', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      const Row(children: [
                        Text('Open', style: TextStyle(color: AppColors.danger, fontSize: 11, fontWeight: FontWeight.w700)),
                        Icon(Icons.chevron_right_rounded, size: 13, color: AppColors.danger),
                      ]),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: AppColors.glassCard(accent: AppColors.warning, radius: 20, borderAlpha: 0.12, fillAlpha: 0.04),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Container(
                        width: 38, height: 38,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          color: AppColors.warning.withValues(alpha: 0.14),
                          border: Border.all(color: AppColors.warning.withValues(alpha: 0.25)),
                        ),
                        child: const Icon(Icons.notifications_none_rounded, size: 18, color: AppColors.warning),
                      ),
                      const Spacer(),
                      const Text('View All', style: TextStyle(color: AppColors.cyan, fontSize: 10, fontWeight: FontWeight.w700)),
                    ]),
                    const SizedBox(height: 12),
                    const Text('Recent\nAlerts', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13.5, height: 1.3)),
                    const SizedBox(height: 4),
                    const Text('No alerts', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            color: AppColors.violet.withValues(alpha: 0.05),
            border: Border.all(color: AppColors.violet.withValues(alpha: 0.18)),
            boxShadow: [
              BoxShadow(color: AppColors.violet.withValues(alpha: 0.08), blurRadius: 24),
              BoxShadow(color: Colors.black.withValues(alpha: 0.22), blurRadius: 14, offset: const Offset(0, 5)),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 48, height: 48,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(15),
                  gradient: const LinearGradient(
                    colors: [Color(0xFFA855F7), Color(0xFF06B6D4)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  boxShadow: [BoxShadow(color: AppColors.violet.withValues(alpha: 0.35), blurRadius: 14)],
                ),
                child: Stack(alignment: Alignment.center, children: [
                  Positioned(
                    top: 0, left: 0, right: 0,
                    child: Container(
                      height: 22,
                      decoration: BoxDecoration(
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [Colors.white.withValues(alpha: 0.22), Colors.transparent],
                        ),
                      ),
                    ),
                  ),
                  const Icon(Icons.auto_awesome_rounded, size: 22, color: Colors.white),
                ]),
              ),
              const SizedBox(width: 16),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'AI RECOMMENDATIONS',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.violet, letterSpacing: 1.2),
                    ),
                    SizedBox(height: 3),
                    Text('No recommendations yet', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14)),
                    SizedBox(height: 2),
                    Text('Available after child device is active for a day.', style: TextStyle(color: AppColors.textMuted, fontSize: 11.5, height: 1.45)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ── Shared atoms ──────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Row(
    children: [
      Container(
        width: 3, height: 14,
        decoration: BoxDecoration(
          color: AppColors.cyan,
          borderRadius: BorderRadius.circular(99),
          boxShadow: [BoxShadow(color: AppColors.cyan.withValues(alpha: 0.55), blurRadius: 8)],
        ),
      ),
      const SizedBox(width: 8),
      Text(
        text.toUpperCase(),
        style: const TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.4),
      ),
    ],
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
      color: color.withValues(alpha: 0.06),
      border: Border.all(color: color.withValues(alpha: 0.16)),
    ),
    child: Column(children: [
      Icon(icon, size: 16, color: color),
      const SizedBox(height: 5),
      Text(label, style: const TextStyle(color: Colors.white, fontSize: 12.5, fontWeight: FontWeight.w900), overflow: TextOverflow.ellipsis),
      const SizedBox(height: 2),
      Text(sub, style: const TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w700)),
    ]),
  );
}

class _GlassIconBtn extends StatelessWidget {
  const _GlassIconBtn({required this.icon, required this.accent, required this.onTap});
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
        color: accent.withValues(alpha: 0.12),
        border: Border.all(color: accent.withValues(alpha: 0.28)),
        boxShadow: [BoxShadow(color: accent.withValues(alpha: 0.15), blurRadius: 10)],
      ),
      child: Icon(icon, size: 19, color: accent),
    ),
  );
}

class _QuickTile extends StatefulWidget {
  const _QuickTile({required this.q, required this.onTap});
  final _Quick q;
  final VoidCallback onTap;
  @override
  State<_QuickTile> createState() => _QuickTileState();
}

class _QuickTileState extends State<_QuickTile> {
  bool _pressed = false;
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTapDown:   (_) => setState(() => _pressed = true),
    onTapUp:     (_) { setState(() => _pressed = false); widget.onTap(); },
    onTapCancel: () => setState(() => _pressed = false),
    child: AnimatedScale(
      scale: _pressed ? 0.94 : 1.0,
      duration: const Duration(milliseconds: 120),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          color: widget.q.accent.withValues(alpha: 0.06),
          border: Border.all(color: widget.q.accent.withValues(alpha: 0.18)),
          boxShadow: [BoxShadow(color: widget.q.accent.withValues(alpha: 0.08), blurRadius: 12)],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 42, height: 42,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(13),
                color: widget.q.accent.withValues(alpha: 0.14),
                border: Border.all(color: widget.q.accent.withValues(alpha: 0.28)),
                boxShadow: [BoxShadow(color: widget.q.accent.withValues(alpha: 0.20), blurRadius: 10)],
              ),
              child: Stack(alignment: Alignment.center, children: [
                Positioned(
                  top: 0, left: 0, right: 0,
                  child: Container(
                    height: 18,
                    decoration: BoxDecoration(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(13)),
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.white.withValues(alpha: 0.15), Colors.transparent],
                      ),
                    ),
                  ),
                ),
                Icon(widget.q.icon, size: 19, color: widget.q.accent),
              ]),
            ),
            const SizedBox(height: 7),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: Text(
                widget.q.label,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 10, fontWeight: FontWeight.w700, height: 1.2),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

// Compatibility aliases (these classes may be referenced elsewhere)
class _DashCard extends StatelessWidget {
  const _DashCard({required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) => Container(
    decoration: AppColors.glassCard(radius: 22),
    child: child,
  );
}

class _DashLabel extends StatelessWidget {
  const _DashLabel(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => _SectionLabel(text);
}

// Kept for the location map background
class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    const step = 28.0;
    final paint = Paint()..color = Colors.white.withValues(alpha: 0.10)..strokeWidth = 0.5;
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
