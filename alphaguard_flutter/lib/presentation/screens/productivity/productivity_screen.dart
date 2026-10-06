import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/responsive/responsive.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/ai_report.dart';
import '../../../data/repositories/productivity_repository.dart';
import '../../../services/socket/socket_service.dart';
import '../../../state/productivity_controller.dart';
import '../../widgets/app_card.dart';

/// Productivity dashboard for the active child: AI insights (incl. approval
/// analytics), streaks, achievements and rewards — all live.
class ProductivityScreen extends StatelessWidget {
  const ProductivityScreen({super.key, required this.childId, this.childName});
  final String childId;
  final String? childName;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<ProductivityController>(
      create: (ctx) => ProductivityController(
        repo: ctx.read<ProductivityRepository>(),
        socket: ctx.read<SocketService>(),
        childId: childId,
      )..load(),
      child: _Body(childName: childName),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({this.childName});
  final String? childName;

  @override
  Widget build(BuildContext context) {
    final c = context.watch<ProductivityController>();
    final r = c.report;
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: context.isTablet ? 640 : double.infinity),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: c.loading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
                  : ListView(
                      children: [
                        const SizedBox(height: 12),
                        Text('Productivity', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 20)),
                        if (childName != null) Text(childName!, style: const TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.w600, fontSize: 12.5)),
                        const SizedBox(height: 12),
                        _PeriodSwitch(value: c.period, onChanged: c.setPeriod),
                        const SizedBox(height: 14),
                        if (c.reportBusy && r == null)
                          const Padding(padding: EdgeInsets.symmetric(vertical: 30), child: Center(child: CircularProgressIndicator(color: AppColors.cyan)))
                        else if (r != null) ...[
                          _Summary(report: r),
                          if (r.insights.isNotEmpty) ...[const SizedBox(height: 12), _Insights(insights: r.insights)],
                          const SizedBox(height: 12),
                          _Metrics(report: r),
                          if (r.approvalDecisions > 0 || r.totalMessages > 0) ...[const SizedBox(height: 12), _Verification(report: r)],
                        ],
                        const SizedBox(height: 16),
                        const SectionLabel('Streaks'),
                        _Streaks(c: c),
                        const SizedBox(height: 8),
                        const SectionLabel('Achievements'),
                        _Achievements(c: c),
                        const SizedBox(height: 8),
                        const SectionLabel('Rewards'),
                        _Rewards(c: c),
                        const SizedBox(height: 28),
                      ],
                    ),
            ),
          ),
        ),
      ),
    );
  }
}

class _PeriodSwitch extends StatelessWidget {
  const _PeriodSwitch({required this.value, required this.onChanged});
  final String value;
  final ValueChanged<String> onChanged;
  @override
  Widget build(BuildContext context) {
    const opts = ['daily', 'weekly', 'monthly'];
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.04), borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
      child: Row(
        children: opts.map((o) {
          final active = o == value;
          return Expanded(
            child: GestureDetector(
              onTap: () => onChanged(o),
              child: Container(
                height: 34,
                alignment: Alignment.center,
                decoration: BoxDecoration(color: active ? Colors.white.withValues(alpha: 0.08) : null, borderRadius: BorderRadius.circular(12)),
                child: Text(o[0].toUpperCase() + o.substring(1), style: TextStyle(color: active ? AppColors.textPrimary : AppColors.textMuted, fontWeight: FontWeight.w700, fontSize: 13)),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _Summary extends StatelessWidget {
  const _Summary({required this.report});
  final AiReport report;
  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: LinearGradient(colors: [AppColors.violet.withValues(alpha: 0.12), AppColors.blue.withValues(alpha: 0.06)]),
          border: Border.all(color: AppColors.border),
        ),
        child: Text(report.summary, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13.5, height: 1.5)),
      );
}

class _Insights extends StatelessWidget {
  const _Insights({required this.insights});
  final List<String> insights;
  @override
  Widget build(BuildContext context) => AppCard(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: const [Icon(Icons.auto_awesome, color: AppColors.violet, size: 15), SizedBox(width: 6), Text('FAMILY INSIGHTS', style: TextStyle(color: AppColors.violet, fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 1))]),
          const SizedBox(height: 10),
          ...insights.map((s) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Container(margin: const EdgeInsets.only(top: 6, right: 10), width: 5, height: 5, decoration: const BoxDecoration(color: AppColors.violet, shape: BoxShape.circle)),
                  Expanded(child: Text(s, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4))),
                ]),
              )),
        ]),
      );
}

class _Metrics extends StatelessWidget {
  const _Metrics({required this.report});
  final AiReport report;
  @override
  Widget build(BuildContext context) {
    final tiles = <Widget>[
      _metric(Icons.trending_up, 'Completion', '${report.taskCompletionPct}%', AppColors.success),
      _metric(Icons.local_fire_department, 'Streak', '${report.currentTaskStreak}d', AppColors.warning),
      if (report.approvalDecisions > 0) _metric(Icons.verified, 'Approval', '${report.approvalRate}%', AppColors.success),
      _metric(Icons.show_chart, 'Consistency', '${report.consistencyPct}%${report.consistencyDelta > 0 ? ' ↑' : ''}', AppColors.cyan),
      _metric(Icons.flag, 'Avg Target', '${report.avgTargetProgress}%', AppColors.indigo),
      _metric(Icons.shield_outlined, 'Risk', report.riskLevel, _riskColor(report.riskLevel)),
    ];
    return GridView.count(
      crossAxisCount: context.isTablet ? 3 : 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 2.6,
      children: tiles,
    );
  }

  static Color _riskColor(String r) => switch (r) {
        'High' => AppColors.danger,
        'Medium' => AppColors.warning,
        _ => AppColors.success,
      };

  Widget _metric(IconData icon, String label, String value, Color color) => AppCard(
        padding: const EdgeInsets.all(12),
        child: Row(children: [
          Container(width: 38, height: 38, decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12), border: Border.all(color: color.withValues(alpha: 0.3))), child: Icon(icon, color: color, size: 18)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
              Text(label.toUpperCase(), style: const TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w700)),
              Text(value, style: const TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w900), overflow: TextOverflow.ellipsis),
            ]),
          ),
        ]),
      );
}

class _Verification extends StatelessWidget {
  const _Verification({required this.report});
  final AiReport report;
  @override
  Widget build(BuildContext context) {
    Widget row(String k, String v, Color c) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text(k, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
            Text(v, style: TextStyle(color: c, fontSize: 13, fontWeight: FontWeight.w800)),
          ]),
        );
    return AppCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('VERIFICATION & COMMUNICATION', style: TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 1)),
        const SizedBox(height: 8),
        row('Tasks approved', '${report.approved} / ${report.approvalDecisions}', AppColors.success),
        if (report.pendingApproval > 0) row('Awaiting review', '${report.pendingApproval}', AppColors.warning),
        row('Task messages', '${report.totalMessages}', AppColors.cyan),
        row('Parent engagement', report.parentEngagement, AppColors.textPrimary),
        if (report.mostDiscussedCategory != null) row('Most discussed', report.mostDiscussedCategory!, AppColors.textPrimary),
      ]),
    );
  }
}

class _Streaks extends StatelessWidget {
  const _Streaks({required this.c});
  final ProductivityController c;
  @override
  Widget build(BuildContext context) {
    if (c.streaks.isEmpty) return const AppCard(child: Text('No streaks yet.', style: TextStyle(color: AppColors.textMuted)));
    return Column(
      children: c.streaks.map((s) => AppCard(
            padding: const EdgeInsets.all(14),
            child: Row(children: [
              const Icon(Icons.local_fire_department, color: AppColors.warning),
              const SizedBox(width: 12),
              Expanded(child: Text(s.label, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700))),
              Text('${s.current}d', style: const TextStyle(color: AppColors.warning, fontWeight: FontWeight.w900, fontSize: 16)),
              const SizedBox(width: 8),
              Text('best ${s.longest}', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
            ]),
          )).toList(),
    );
  }
}

class _Achievements extends StatelessWidget {
  const _Achievements({required this.c});
  final ProductivityController c;
  @override
  Widget build(BuildContext context) {
    if (c.achievements.isEmpty) return const AppCard(child: Text('No achievements yet — complete tasks to unlock badges.', style: TextStyle(color: AppColors.textMuted)));
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: c.achievements.map((a) => Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(color: AppColors.violet.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.violet.withValues(alpha: 0.3))),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.emoji_events, color: AppColors.violet, size: 16),
              const SizedBox(width: 8),
              Text(a.title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700, fontSize: 12.5)),
            ]),
          )).toList(),
    );
  }
}

class _Rewards extends StatelessWidget {
  const _Rewards({required this.c});
  final ProductivityController c;
  @override
  Widget build(BuildContext context) {
    if (c.rewards.isEmpty) return const AppCard(child: Text('No rewards yet.', style: TextStyle(color: AppColors.textMuted)));
    Color statusColor(String s) => switch (s) {
          'unlocked' => AppColors.success,
          'delivered' => AppColors.cyan,
          _ => AppColors.warning,
        };
    return Column(
      children: c.rewards.map((rw) => AppCard(
            padding: const EdgeInsets.all(14),
            child: Row(children: [
              const Icon(Icons.card_giftcard, color: AppColors.warning),
              const SizedBox(width: 12),
              Expanded(child: Text(rw.title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700))),
              TagChip(label: rw.statusLabel, color: statusColor(rw.status)),
            ]),
          )).toList(),
    );
  }
}
