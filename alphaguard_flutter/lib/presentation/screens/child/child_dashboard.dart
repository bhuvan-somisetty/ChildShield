import 'dart:async';

import 'package:battery_plus/battery_plus.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../state/auth_controller.dart';
import 'child_contacts_screen.dart';
import 'child_disha_screen.dart';
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

// ── Section data ──────────────────────────────────────────────────────────────

class _Sec {
  const _Sec({required this.label, required this.icon, required this.accent, this.route});
  final String label;
  final IconData icon;
  final Color accent;
  final String? route;
}

const _SECTIONS = [
  _Sec(label: 'SOS',      icon: Icons.crisis_alert_rounded,  accent: Color(0xFFEF4444), route: '_sos'),
  _Sec(label: 'Contacts', icon: Icons.phone_rounded,         accent: Color(0xFF10B981), route: '_contacts'),
  _Sec(label: 'DISHA',    icon: Icons.auto_awesome_rounded,  accent: Color(0xFFA855F7), route: '_disha'),
  _Sec(label: 'Goals',    icon: Icons.track_changes_rounded, accent: Color(0xFFF59E0B), route: '_goals'),
  _Sec(label: 'Settings', icon: Icons.settings_rounded,      accent: Color(0xFF64748B), route: '_settings'),
];

// ── Child Dashboard ───────────────────────────────────────────────────────────

class ChildDashboard extends StatefulWidget {
  const ChildDashboard({super.key, required this.childId, this.childName});
  final String childId;
  final String? childName;
  @override
  State<ChildDashboard> createState() => _ChildDashboardState();
}

class _ChildDashboardState extends State<ChildDashboard> with SingleTickerProviderStateMixin {
  late final AnimationController _sosCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
  late final Animation<double> _sosAnim = Tween<double>(begin: 0.4, end: 0.8)
      .animate(CurvedAnimation(parent: _sosCtrl, curve: Curves.easeInOut));

  final Battery _battery = Battery();
  int? _batteryLevel;
  bool _charging = false;
  String _networkLabel = '—';
  Timer? _telTimer;

  @override
  void initState() {
    super.initState();
    _sosCtrl.repeat(reverse: true);
    _refreshTelemetry();
    _telTimer = Timer.periodic(const Duration(seconds: 30), (_) => _refreshTelemetry());
  }

  Future<void> _refreshTelemetry() async {
    try {
      final level   = await _battery.batteryLevel;
      final state   = await _battery.batteryState;
      final results = await Connectivity().checkConnectivity();
      if (!mounted) return;
      setState(() {
        _batteryLevel = level;
        _charging     = state == BatteryState.charging || state == BatteryState.full;
        _networkLabel = _connLabel(results.isNotEmpty ? results.first : ConnectivityResult.none);
      });
    } catch (_) {}
  }

  String _connLabel(ConnectivityResult r) {
    switch (r) {
      case ConnectivityResult.wifi:     return 'Wi-Fi';
      case ConnectivityResult.mobile:   return 'Mobile';
      case ConnectivityResult.ethernet: return 'LAN';
      default:                          return 'Offline';
    }
  }

  @override
  void dispose() {
    _telTimer?.cancel();
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
    if (s.route == '_disha') {
      Navigator.of(ctx).push(MaterialPageRoute(builder: (_) => const ChildDishaScreen()));
      return;
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth       = context.watch<AuthController>();
    final child      = auth.child;
    final childColor = child != null ? _childHex(child.color) : AppColors.cyan;
    final safe       = MediaQuery.of(context).padding;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Stack(
        children: [
          // Ambient glow
          Positioned(
            top: -50, left: 0, right: 0,
            child: Container(
              height: 220,
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  colors: [childColor.withValues(alpha: 0.09), Colors.transparent],
                  radius: 0.9,
                ),
              ),
            ),
          ),
          SafeArea(
            child: ListView(
              padding: EdgeInsets.fromLTRB(16, 12, 16, safe.bottom + 80),
              children: [
                _buildGreetingRow(child?.name ?? widget.childName ?? 'there', child?.emoji ?? '👋'),
                const SizedBox(height: 16),
                _buildIdentityCard(child, childColor),
                const SizedBox(height: 14),
                _buildSosButton(),
                const SizedBox(height: 14),
                _buildSectionGrid(context),
                const SizedBox(height: 14),
                _buildGoalsCard(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // 1 · Greeting ──────────────────────────────────────────────────────────────

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
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(99),
            color: const Color(0xFF10B981).withValues(alpha: 0.12),
            border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.28)),
            boxShadow: [BoxShadow(color: const Color(0xFF10B981).withValues(alpha: 0.15), blurRadius: 12)],
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            SvgPicture.asset('assets/icons/alphaguard_logo_mono.svg', width: 13, height: 13,
                colorFilter: const ColorFilter.mode(Color(0xFF10B981), BlendMode.srcIn)),
            const SizedBox(width: 5),
            const Text('PROTECTED',
                style: TextStyle(color: Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
          ]),
        ),
      ],
    );
  }

  // 2 · Identity card ─────────────────────────────────────────────────────────

  Widget _buildIdentityCard(dynamic child, Color childColor) {
    final name   = child?.name as String? ?? widget.childName ?? 'Me';
    final age    = child?.age as int?;
    final grade  = (child?.grade as String?) ?? '—';
    final school = (child?.school as String?) ?? '—';
    final emoji  = (child?.emoji as String?) ?? '👦';

    return Container(
      decoration: AppColors.glassCard(accent: const Color(0xFF10B981), radius: 26, borderAlpha: 0.18, fillAlpha: 0.05),
      child: Stack(
        children: [
          Positioned(
            top: -45, right: -45,
            child: Container(
              width: 170, height: 170,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF10B981).withValues(alpha: 0.08),
              ),
            ),
          ),
          Positioned(
            top: 0, left: 0, right: 0,
            child: Container(
              height: 55,
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
                    Container(
                      width: 58, height: 58,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(18),
                        color: childColor.withValues(alpha: 0.15),
                        border: Border.all(color: childColor.withValues(alpha: 0.40), width: 1.5),
                        boxShadow: [BoxShadow(color: childColor.withValues(alpha: 0.22), blurRadius: 14)],
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
                          const SizedBox(height: 4),
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
                Row(children: [
                  Expanded(child: _ChildTelCell(
                    icon: _charging ? Icons.battery_charging_full_rounded : Icons.battery_5_bar_rounded,
                    label: _batteryLevel != null ? '$_batteryLevel%' : '—',
                    sub: _charging ? 'Charging' : 'Battery',
                    color: _batteryLevel != null && _batteryLevel! < 20 ? const Color(0xFFEF4444) : const Color(0xFF22D3EE),
                  )),
                  const SizedBox(width: 8),
                  Expanded(child: _ChildTelCell(
                    icon: _networkLabel == 'Wi-Fi' ? Icons.wifi_rounded : Icons.signal_cellular_alt_rounded,
                    label: _networkLabel,
                    sub: 'Network',
                    color: _networkLabel == 'Offline' ? const Color(0xFF94A3B8) : const Color(0xFF22D3EE),
                  )),
                  const SizedBox(width: 8),
                  Expanded(child: const _ChildTelCell(
                    icon: Icons.shield_rounded, label: 'Safe', sub: 'Status', color: Color(0xFF10B981),
                  )),
                ]),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    color: const Color(0xFF10B981).withValues(alpha: 0.07),
                    border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.15)),
                  ),
                  child: Row(children: [
                    const Icon(Icons.location_on_rounded, size: 14, color: Color(0xFF34D399)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Location is shared with ${context.read<AuthController>().parent?.name ?? 'your parent'}',
                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ]),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // 3 · SOS ──────────────────────────────────────────────────────────────────

  Widget _buildSosButton() {
    return GestureDetector(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(fullscreenDialog: true, builder: (_) => const ChildSosScreen()),
      ),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          color: const Color(0xFFEF4444).withValues(alpha: 0.06),
          border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.35), width: 1.5),
          boxShadow: [
            BoxShadow(color: const Color(0xFFEF4444).withValues(alpha: 0.15), blurRadius: 24),
            BoxShadow(color: Colors.black.withValues(alpha: 0.22), blurRadius: 12, offset: const Offset(0, 4)),
          ],
        ),
        child: Row(
          children: [
            SizedBox(
              width: 52, height: 52,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  AnimatedBuilder(
                    animation: _sosAnim,
                    builder: (_, __) => Container(
                      width: 60, height: 60,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFFEF4444).withValues(alpha: _sosAnim.value * 0.22),
                      ),
                    ),
                  ),
                  Container(
                    width: 52, height: 52,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const LinearGradient(
                        colors: [Color(0xFFEF4444), Color(0xFFDC2626)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      boxShadow: [BoxShadow(color: const Color(0xFFEF4444).withValues(alpha: 0.40), blurRadius: 16)],
                    ),
                    child: Stack(alignment: Alignment.center, children: [
                      Positioned(
                        top: 0, left: 0, right: 0,
                        child: Container(
                          height: 24,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [Colors.white.withValues(alpha: 0.25), Colors.transparent],
                            ),
                          ),
                        ),
                      ),
                      const Icon(Icons.crisis_alert_rounded, size: 26, color: Colors.white),
                    ]),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Emergency SOS',
                      style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w900, letterSpacing: -0.2)),
                  SizedBox(height: 3),
                  Text('Tap if you need help right now',
                      style: TextStyle(color: Color(0xFFFCA5A5), fontSize: 13, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            Container(
              width: 34, height: 34,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(11),
                color: const Color(0xFFEF4444).withValues(alpha: 0.14),
              ),
              child: const Icon(Icons.chevron_right_rounded, size: 18, color: Color(0xFFF87171)),
            ),
          ],
        ),
      ),
    );
  }

  // 4 · Section grid ─────────────────────────────────────────────────────────

  Widget _buildSectionGrid(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(children: [
          Container(
            width: 3, height: 14,
            decoration: BoxDecoration(
              color: AppColors.cyan,
              borderRadius: BorderRadius.circular(99),
              boxShadow: [BoxShadow(color: AppColors.cyan.withValues(alpha: 0.55), blurRadius: 8)],
            ),
          ),
          const SizedBox(width: 8),
          const Text('MY ALPHAGUARD',
              style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1.4)),
        ]),
        const SizedBox(height: 10),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3, crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 1.0,
          ),
          itemCount: _SECTIONS.length,
          itemBuilder: (_, i) {
            final s = _SECTIONS[i];
            return _SectionTile(s: s, onTap: () => _onSection(context, s));
          },
        ),
      ],
    );
  }

  // 5 · Goals card ───────────────────────────────────────────────────────────

  Widget _buildGoalsCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppColors.glassCard(accent: const Color(0xFFF59E0B), radius: 22, borderAlpha: 0.14, fillAlpha: 0.04),
      child: Row(
        children: [
          Container(
            width: 46, height: 46,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              color: const Color(0xFFF59E0B).withValues(alpha: 0.14),
              border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.28)),
              boxShadow: [BoxShadow(color: const Color(0xFFF59E0B).withValues(alpha: 0.18), blurRadius: 10)],
            ),
            child: const Icon(Icons.track_changes_rounded, size: 21, color: Color(0xFFF59E0B)),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Study goals', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14.5)),
                SizedBox(height: 3),
                Text('0 of 0 done today', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          GestureDetector(
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => ChildGoalsScreen(childId: widget.childId)),
            ),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                color: const Color(0xFF34D399).withValues(alpha: 0.12),
                border: Border.all(color: const Color(0xFF34D399).withValues(alpha: 0.24)),
              ),
              child: const Row(children: [
                Text('Open', style: TextStyle(color: Color(0xFF34D399), fontSize: 12.5, fontWeight: FontWeight.w700)),
                Icon(Icons.chevron_right_rounded, size: 14, color: Color(0xFF34D399)),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Section tile (clay pill) ──────────────────────────────────────────────────

class _SectionTile extends StatefulWidget {
  const _SectionTile({required this.s, required this.onTap});
  final _Sec s;
  final VoidCallback onTap;
  @override
  State<_SectionTile> createState() => _SectionTileState();
}

class _SectionTileState extends State<_SectionTile> {
  bool _pressed = false;
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTapDown:   (_) => setState(() => _pressed = true),
    onTapUp:     (_) { setState(() => _pressed = false); widget.onTap(); },
    onTapCancel: () => setState(() => _pressed = false),
    child: AnimatedScale(
      scale: _pressed ? 0.93 : 1.0,
      duration: const Duration(milliseconds: 110),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          color: widget.s.accent.withValues(alpha: 0.07),
          border: Border.all(color: widget.s.accent.withValues(alpha: 0.20)),
          boxShadow: [BoxShadow(color: widget.s.accent.withValues(alpha: 0.10), blurRadius: 12)],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 46, height: 46,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                color: widget.s.accent.withValues(alpha: 0.14),
                border: Border.all(color: widget.s.accent.withValues(alpha: 0.28)),
                boxShadow: [BoxShadow(color: widget.s.accent.withValues(alpha: 0.22), blurRadius: 10)],
              ),
              child: Stack(alignment: Alignment.center, children: [
                Positioned(
                  top: 0, left: 0, right: 0,
                  child: Container(
                    height: 20,
                    decoration: BoxDecoration(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.white.withValues(alpha: 0.18), Colors.transparent],
                      ),
                    ),
                  ),
                ),
                Icon(widget.s.icon, size: 21, color: widget.s.accent),
              ]),
            ),
            const SizedBox(height: 8),
            Text(widget.s.label,
                style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 11.5, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    ),
  );
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
      color: color.withValues(alpha: 0.07),
      border: Border.all(color: color.withValues(alpha: 0.18)),
    ),
    child: Column(children: [
      Icon(icon, size: 16, color: color),
      const SizedBox(height: 5),
      Text(label, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w900), overflow: TextOverflow.ellipsis),
      const SizedBox(height: 2),
      Text(sub, style: const TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w700)),
    ]),
  );
}
