import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

// Matches centers.jsx AppManagement — app list with lock/unlock toggle.

const _apps = [
  _App(name: 'YouTube', cat: 'Entertainment', risk: 'Medium', mins: 64, color: Color(0xFFEF4444), edu: false),
  _App(name: 'Instagram', cat: 'Social', risk: 'High', mins: 52, color: Color(0xFFEC4899), edu: false),
  _App(name: 'TikTok', cat: 'Social', risk: 'High', mins: 96, color: Color(0xFFA855F7), edu: false),
  _App(name: 'Snapchat', cat: 'Social', risk: 'High', mins: 34, color: Color(0xFFEAB308), edu: false),
  _App(name: 'Facebook', cat: 'Social', risk: 'Medium', mins: 20, color: Color(0xFF3B82F6), edu: false),
  _App(name: 'Games', cat: 'Gaming', risk: 'Medium', mins: 60, color: Color(0xFF22C55E), edu: false),
  _App(name: 'Chrome', cat: 'Utility', risk: 'Low', mins: 22, color: Color(0xFF0EA5E9), edu: false),
  _App(name: 'Khan Academy', cat: 'Education', risk: 'Low', mins: 28, color: Color(0xFF10B981), edu: true),
  _App(name: 'Roblox', cat: 'Gaming', risk: 'Medium', mins: 48, color: Color(0xFF16A34A), edu: false),
];

Color _riskColor(String risk) {
  if (risk == 'Low') return const Color(0xFF10B981);
  if (risk == 'Medium') return const Color(0xFFF59E0B);
  return const Color(0xFFEF4444);
}

String _fmtMins(int m) {
  if (m <= 0) return '0m';
  final h = m ~/ 60;
  final rem = m % 60;
  if (h == 0) return '${rem}m';
  return rem == 0 ? '${h}h' : '${h}h ${rem}m';
}

class AppManagementScreen extends StatefulWidget {
  const AppManagementScreen({super.key});

  @override
  State<AppManagementScreen> createState() => _AppManagementScreenState();
}

class _AppManagementScreenState extends State<AppManagementScreen> {
  final Set<String> _locked = {'TikTok', 'Instagram'};
  String _tab = 'All';

  static const _tabs = ['All', 'Most Used', 'Recent', 'Blocked'];

  List<_App> get _shown {
    switch (_tab) {
      case 'Blocked':
        return _apps.where((a) => _locked.contains(a.name)).toList();
      case 'Most Used':
        return ([..._apps]..sort((a, b) => b.mins - a.mins)).take(5).toList();
      case 'Recent':
        return _apps.sublist(_apps.length - 4);
      default:
        return _apps;
    }
  }

  void _toggle(String name) {
    setState(() {
      if (_locked.contains(name)) {
        _locked.remove(name);
      } else {
        _locked.add(name);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          children: [
            _buildHeader(context),
            const SizedBox(height: 24),
            if (_locked.isNotEmpty) ...[
              _buildLabel('Restricted Apps (${_locked.length})'),
              const SizedBox(height: 10),
              _buildRestrictedSection(),
              const SizedBox(height: 20),
            ],
            _buildLabel('All Apps'),
            const SizedBox(height: 10),
            _buildTabs(),
            const SizedBox(height: 12),
            _buildAppList(),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Row(
      children: [
        GestureDetector(
          onTap: () => Navigator.of(context).pop(),
          child: Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: .05),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white.withValues(alpha: .1)),
            ),
            child: const Icon(Icons.chevron_left_rounded, color: Color(0xFFCBD5E1), size: 20),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('App Management', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
              Text('${_locked.length} restricted', style: const TextStyle(color: Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildRestrictedSection() {
    final restricted = _apps.where((a) => _locked.contains(a.name)).toList();
    return _Card(
      child: Column(
        children: restricted.map((a) {
          final isFirst = restricted.first == a;
          return Column(
            children: [
              if (!isFirst) _divider(),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                child: Row(
                  children: [
                    Container(
                      width: 40, height: 40,
                      decoration: BoxDecoration(color: a.color, borderRadius: BorderRadius.circular(12)),
                      child: Center(child: Text(a.name[0], style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w900))),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(a.name, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700)),
                          Text('${a.risk} risk · ${a.cat}', style: TextStyle(color: _riskColor(a.risk), fontSize: 11.5, fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: .06),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(_fmtMins(a.mins), style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 10.5, fontWeight: FontWeight.w900)),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      width: 32, height: 32,
                      decoration: BoxDecoration(
                        color: const Color(0xFFEF4444).withValues(alpha: .15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.lock_rounded, color: Color(0xFFF87171), size: 15),
                    ),
                  ],
                ),
              ),
            ],
          );
        }).toList(),
      ),
    );
  }

  Widget _buildTabs() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: _tabs.map((t) {
          final active = _tab == t;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => setState(() => _tab = t),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                height: 36,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: active ? const Color(0xFF06B6D4).withValues(alpha: .15) : AppColors.bgElevated,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: active ? const Color(0xFF06B6D4).withValues(alpha: .4) : Colors.white.withValues(alpha: .1),
                  ),
                ),
                child: Center(
                  child: Text(
                    t,
                    style: TextStyle(
                      color: active ? const Color(0xFF67E8F9) : const Color(0xFF94A3B8),
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildAppList() {
    final shown = _shown;
    if (shown.isEmpty) {
      return _Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: Text('No apps in this view.', style: const TextStyle(color: Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w600)),
          ),
        ),
      );
    }
    return Column(
      children: shown.map((a) {
        final locked = _locked.contains(a.name);
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    width: 44, height: 44,
                    decoration: BoxDecoration(color: a.color, borderRadius: BorderRadius.circular(14)),
                    child: Center(child: Text(a.name[0], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900))),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(a.name, style: const TextStyle(color: Colors.white, fontSize: 14.5, fontWeight: FontWeight.w700)),
                            if (a.edu) ...[
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(color: const Color(0xFF10B981).withValues(alpha: .15), borderRadius: BorderRadius.circular(4)),
                                child: const Text('EDU', style: TextStyle(color: Color(0xFF34D399), fontSize: 9, fontWeight: FontWeight.w900)),
                              ),
                            ],
                            if (locked) ...[
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(color: const Color(0xFFEF4444).withValues(alpha: .15), borderRadius: BorderRadius.circular(4)),
                                child: const Text('LOCKED', style: TextStyle(color: Color(0xFFF87171), fontSize: 9, fontWeight: FontWeight.w900)),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Text(a.cat, style: const TextStyle(color: Color(0xFF64748B), fontSize: 11.5, fontWeight: FontWeight.w600)),
                            Container(width: 4, height: 4, margin: const EdgeInsets.symmetric(horizontal: 6), decoration: const BoxDecoration(color: Color(0xFF475569), shape: BoxShape.circle)),
                            Text('${a.risk} risk', style: TextStyle(color: _riskColor(a.risk), fontSize: 11.5, fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: () => _toggle(a.name),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      width: 36, height: 36,
                      decoration: BoxDecoration(
                        color: locked ? const Color(0xFFEF4444).withValues(alpha: .15) : Colors.white.withValues(alpha: .06),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        locked ? Icons.lock_rounded : Icons.lock_open_rounded,
                        color: locked ? const Color(0xFFF87171) : const Color(0xFF94A3B8),
                        size: 16,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildLabel(String text) => Text(
    text.toUpperCase(),
    style: const TextStyle(color: Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 2.0),
  );

  Widget _divider() => Divider(height: 1, color: Colors.white.withValues(alpha: .05));
}

class _Card extends StatelessWidget {
  const _Card({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white.withValues(alpha: .07)),
      ),
      child: ClipRRect(borderRadius: BorderRadius.circular(22), child: child),
    );
  }
}

class _App {
  const _App({required this.name, required this.cat, required this.risk, required this.mins, required this.color, required this.edu});
  final String name;
  final String cat;
  final String risk;
  final int mins;
  final Color color;
  final bool edu;
}
