import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/ai_report.dart';
import '../../../data/repositories/productivity_repository.dart';
import '../../../services/socket/socket_service.dart';
import '../../../state/productivity_controller.dart';
import '../../widgets/app_card.dart';

class AiReportsScreen extends StatelessWidget {
  const AiReportsScreen({super.key, required this.childId, this.childName});
  final String childId;
  final String? childName;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: ChangeNotifierProvider<ProductivityController>(
        create: (ctx) => ProductivityController(
          repo: ctx.read<ProductivityRepository>(),
          socket: ctx.read<SocketService>(),
          childId: childId,
        )..load(),
        child: _AiReportsView(childName: childName),
      ),
    );
  }
}

class _AiReportsView extends StatefulWidget {
  const _AiReportsView({this.childName});
  final String? childName;

  @override
  State<_AiReportsView> createState() => _AiReportsViewState();
}

class _AiReportsViewState extends State<_AiReportsView> {
  @override
  Widget build(BuildContext context) {
    final c = context.watch<ProductivityController>();
    final r = c.report;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        title: Text('${widget.childName ?? 'Child'}\'s AI Safety Report', style: const TextStyle(fontWeight: FontWeight.w900)),
        actions: [
          if (r != null)
            IconButton(
              icon: const Icon(Icons.share_outlined),
              tooltip: 'Export / Share Report',
              onPressed: () => _showExportDialog(context, r),
            ),
        ],
      ),
      body: SafeArea(
        child: c.loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
            : Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: ListView(
                  children: [
                    const SizedBox(height: 8),
                    _PeriodSelector(value: c.period, onChanged: c.setPeriod),
                    const SizedBox(height: 16),
                    if (c.reportBusy && r == null)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 40),
                        child: Center(child: CircularProgressIndicator(color: AppColors.cyan)),
                      )
                    else if (r == null)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.all(30.0),
                          child: Text('No safety data logged for this period.', style: TextStyle(color: AppColors.textMuted)),
                        ),
                      )
                    else ...[
                      _SafetyScoreHeader(report: r),
                      const SizedBox(height: 12),
                      _MetricsDashboard(report: r),
                      const SizedBox(height: 16),
                      const SectionLabel('Safety & Analytics Metrics'),
                      _WeeklyReportDetails(report: r),
                      const SizedBox(height: 16),
                      const SectionLabel('Risk Detections'),
                      _RiskDetectionsCard(report: r),
                      const SizedBox(height: 16),
                      const SectionLabel('Recommendations'),
                      _RecommendationsCard(report: r),
                      const SizedBox(height: 16),
                      const SectionLabel('Historical Reports'),
                      _HistoricalReportsCard(report: r, controller: c),
                      const SizedBox(height: 32),
                    ],
                  ],
                ),
              ),
      ),
    );
  }

  void _showExportDialog(BuildContext context, AiReport r) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.bgElevated,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text('Export Safety Report', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Safety Score: ${r.safetyScore}/100', style: const TextStyle(color: AppColors.textSecondary, fontSize: 14.5)),
            Text('Risk Classification: ${r.riskScore}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 14.5)),
            const SizedBox(height: 12),
            const Text('Generate a formatted report export containing geofence logs, screen time patterns, and device logs.', style: TextStyle(color: AppColors.textMuted, fontSize: 12.5)),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted))),
          ElevatedButton.icon(
            icon: const Icon(Icons.print, size: 16),
            label: const Text('Print / PDF Preview'),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.cyan, foregroundColor: Colors.black, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            onPressed: () {
              Navigator.of(ctx).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('PDF compiled! Sending printable preview...'), behavior: SnackBarBehavior.floating),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _PeriodSelector extends StatelessWidget {
  const _PeriodSelector({required this.value, required this.onChanged});
  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    const options = ['daily', 'weekly', 'monthly'];
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.04), borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
      child: Row(
        children: options.map((opt) {
          final active = opt == value;
          return Expanded(
            child: GestureDetector(
              onTap: () => onChanged(opt),
              child: Container(
                height: 36,
                alignment: Alignment.center,
                decoration: BoxDecoration(color: active ? Colors.white.withValues(alpha: 0.08) : null, borderRadius: BorderRadius.circular(12)),
                child: Text(opt[0].toUpperCase() + opt.substring(1), style: TextStyle(color: active ? AppColors.textPrimary : AppColors.textMuted, fontWeight: FontWeight.w700, fontSize: 13.5)),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _SafetyScoreHeader extends StatelessWidget {
  const _SafetyScoreHeader({required this.report});
  final AiReport report;

  Color _scoreColor(int s) {
    if (s >= 85) return AppColors.success;
    if (s >= 60) return AppColors.warning;
    return AppColors.danger;
  }

  @override
  Widget build(BuildContext context) {
    final score = report.safetyScore;
    final color = _scoreColor(score);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: LinearGradient(colors: [color.withValues(alpha: 0.14), AppColors.bgElevated]),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 76,
                height: 76,
                child: CircularProgressIndicator(
                  value: score / 100,
                  strokeWidth: 9,
                  backgroundColor: Colors.white.withValues(alpha: 0.06),
                  color: color,
                ),
              ),
              Text('$score', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 24)),
            ],
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text('SAFETY STATUS: ', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8)),
                      child: Text(report.riskScore.toUpperCase(), style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 10.5)),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(report.summary, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12.5, height: 1.45)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricsDashboard extends StatelessWidget {
  const _MetricsDashboard({required this.report});
  final AiReport report;

  Color _scoreColor(int s) {
    if (s >= 85) return AppColors.success;
    if (s >= 60) return AppColors.warning;
    return AppColors.danger;
  }

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 0.9,
      children: [
        _scoreCard('Screen Time', report.screenTimeScore, Icons.screen_search_desktop_outlined),
        _scoreCard('Compliance', report.locationComplianceScore, Icons.location_on_outlined),
        _scoreCard('Device Health', report.deviceHealthScore, Icons.battery_charging_full_outlined),
      ],
    );
  }

  Widget _scoreCard(String title, int score, IconData icon) {
    final color = _scoreColor(score);
    return AppCard(
      padding: const EdgeInsets.all(12),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 8),
          Text(score.toString(), style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 20)),
          const SizedBox(height: 4),
          Text(title, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textMuted, fontSize: 10.5, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _WeeklyReportDetails extends StatelessWidget {
  const _WeeklyReportDetails({required this.report});
  final AiReport report;

  @override
  Widget build(BuildContext context) {
    final screenMins = report.totalScreenTimeMins;
    final hours = screenMins ~/ 60;
    final mins = screenMins % 60;

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total Screen Time', style: TextStyle(color: AppColors.textSecondary, fontSize: 13.5)),
              Text('${hours}h ${mins}m', style: const TextStyle(color: AppColors.cyan, fontWeight: FontWeight.w800, fontSize: 14.5)),
            ],
          ),
          const Divider(color: AppColors.border, height: 24),
          const Text('Top Apps Foreground Activity', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800)),
          const SizedBox(height: 10),
          ...report.topApps.map((a) {
            final appName = a['app'] as String;
            final appMins = a['durationMins'] as int;
            final pct = screenMins > 0 ? appMins / screenMins : 0.0;
            return Padding(
              padding: const EdgeInsets.only(bottom: 10.0),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(appName, style: const TextStyle(color: AppColors.textPrimary, fontSize: 12.5, fontWeight: FontWeight.w700)),
                      Text('${appMins}m', style: const TextStyle(color: AppColors.textMuted, fontSize: 11.5)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: pct,
                      minHeight: 6,
                      backgroundColor: Colors.white.withValues(alpha: 0.04),
                      color: AppColors.cyan,
                    ),
                  ),
                ],
              ),
            );
          }),
          const Divider(color: AppColors.border, height: 24),
          _row('School Arrival On-Time', '${report.locationComplianceScore}%'),
          _row('Battery Cycle Patterns', report.batteryHealthPatterns),
          _row('Emergency SOS Alerts', '${report.sosEventsCount} alerts'),
          _row('Location Exemption Alerts', '${report.locationAnomaliesCount} alerts'),
          _row('Tampering Warnings', '${report.deviceTamperingAttemptsCount} alerts'),
        ],
      ),
    );
  }

  Widget _row(String label, String val) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 5.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
            Text(val, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700, fontSize: 13)),
          ],
        ),
      );
}

class _RiskDetectionsCard extends StatelessWidget {
  const _RiskDetectionsCard({required this.report});
  final AiReport report;

  @override
  Widget build(BuildContext context) {
    final risks = report.riskDetections;
    if (risks.isEmpty) {
      return const AppCard(
        child: Center(
          child: Text('🟢 No safety risk markers detected.', style: TextStyle(color: AppColors.success, fontWeight: FontWeight.w700, fontSize: 13.5)),
        ),
      );
    }
    return Column(
      children: risks.map((r) {
        final isCritical = r['severity'] == 'critical';
        final color = isCritical ? AppColors.danger : AppColors.warning;
        return AppCard(
          padding: const EdgeInsets.all(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(isCritical ? Icons.error_outline : Icons.warning_amber_rounded, color: color, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(r['title'] as String, style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 14)),
                    const SizedBox(height: 3),
                    Text(r['description'] as String, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _RecommendationsCard extends StatelessWidget {
  const _RecommendationsCard({required this.report});
  final AiReport report;

  @override
  Widget build(BuildContext context) {
    final recs = report.recommendations;
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: recs.map((tip) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 6.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.lightbulb_outline, color: AppColors.warning, size: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(tip, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4)),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _HistoricalReportsCard extends StatelessWidget {
  const _HistoricalReportsCard({required this.report, required this.controller});
  final AiReport report;
  final ProductivityController controller;

  @override
  Widget build(BuildContext context) {
    final list = report.historicalReports;
    if (list.isEmpty) {
      return const AppCard(child: Text('No past reports found.', style: TextStyle(color: AppColors.textMuted)));
    }
    return Column(
      children: list.map((r) {
        final date = DateTime.fromMillisecondsSinceEpoch(r['at'] as int);
        final score = r['safetyScore'] as int;
        return AppCard(
          onTap: () {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Loading report from ${date.toLocal().toString().split(' ')[0]}'), behavior: SnackBarBehavior.floating),
            );
          },
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Report: ${date.toLocal().toString().split(' ')[0]}', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
                  Text('Period: ${r['period']}', style: const TextStyle(color: AppColors.textMuted, fontSize: 11.5)),
                ],
              ),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.04), borderRadius: BorderRadius.circular(8)),
                    child: Text('Score: $score', style: const TextStyle(color: AppColors.cyan, fontWeight: FontWeight.w800, fontSize: 12.5)),
                  ),
                  const SizedBox(width: 8),
                  const Icon(Icons.chevron_right, color: AppColors.textMuted),
                ],
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class SectionLabel extends StatelessWidget {
  const SectionLabel(this.label, {super.key});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4.0, bottom: 8.0),
      child: Text(label.toUpperCase(), style: const TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1)),
    );
  }
}
