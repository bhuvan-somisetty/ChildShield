import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/safety.dart';
import '../../../data/repositories/safety_repository.dart';
import '../../widgets/app_card.dart';

class RadarZoneAnalyticsScreen extends StatefulWidget {
  const RadarZoneAnalyticsScreen({required this.zone, super.key});
  final SafeZone zone;

  @override
  State<RadarZoneAnalyticsScreen> createState() => _RadarZoneAnalyticsScreenState();
}

class _RadarZoneAnalyticsScreenState extends State<RadarZoneAnalyticsScreen> {
  bool _loading = true;
  String? _error;
  List<ZoneEvent> _events = [];
  int _entries = 0;
  int _exits = 0;
  int _totalDwellMs = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final repo = context.read<SafetyRepository>();
      final data = await repo.zoneAnalytics(widget.zone.id);
      final evList = (data['events'] as List? ?? [])
          .map((e) => ZoneEvent.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
      final analytics = data['analytics'] as Map? ?? {};

      setState(() {
        _events = evList;
        _entries = analytics['entries'] is num ? (analytics['entries'] as num).toInt() : 0;
        _exits = analytics['exits'] is num ? (analytics['exits'] as num).toInt() : 0;
        _totalDwellMs = analytics['totalDwellMs'] is num ? (analytics['totalDwellMs'] as num).toInt() : 0;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load analytics data';
        _loading = false;
      });
    }
  }

  String _formatDuration(int ms) {
    if (ms <= 0) return '0m';
    final seconds = ms ~/ 1000;
    final minutes = seconds ~/ 60;
    final hours = minutes ~/ 60;
    if (hours > 0) {
      final remMin = minutes % 60;
      return remMin > 0 ? '${hours}h ${remMin}m' : '${hours}h';
    }
    return '${minutes}m';
  }

  String _formatDateTime(int epochMs) {
    if (epochMs <= 0) return 'Unknown time';
    final dt = DateTime.fromMillisecondsSinceEpoch(epochMs).toLocal();
    final now = DateTime.now();
    
    // Check if today
    final isToday = dt.year == now.year && dt.month == now.month && dt.day == now.day;
    // Format hour/minute
    final hour = dt.hour == 0 ? 12 : (dt.hour > 12 ? dt.hour - 12 : dt.hour);
    final min = dt.minute.toString().padLeft(2, '0');
    final ampm = dt.hour >= 12 ? 'PM' : 'AM';
    final timeStr = '$hour:$min $ampm';

    if (isToday) return 'Today at $timeStr';

    // Check if yesterday
    final yest = now.subtract(const Duration(days: 1));
    final isYesterday = dt.year == yest.year && dt.month == yest.month && dt.day == yest.day;
    if (isYesterday) return 'Yesterday at $timeStr';

    final monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${monthNames[dt.month - 1]} ${dt.day} at $timeStr';
  }

  @override
  Widget build(BuildContext context) {
    final hasSchedule = widget.zone.expectedArrival != null || widget.zone.expectedDeparture != null;
    
    // Calculate compliance metrics (simulate rate based on actual event patterns if schedule is present).
    final lates = _events.where((e) => e.type == 'late').length;
    final misseds = _events.where((e) => e.type == 'missed').length;
    final stayed = _events.where((e) => e.type == 'stayed').length;
    final totalOpportunities = _entries + misseds;
    final onTimeCount = _entries - lates;
    final complianceRate = totalOpportunities > 0 
        ? ((onTimeCount / totalOpportunities) * 100).clamp(0, 100).toInt()
        : 100;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.zone.name, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
            const Text('Zone Activity Analytics', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          ],
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        color: AppColors.cyan,
        backgroundColor: AppColors.surface,
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
            : _error != null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error_outline_rounded, color: AppColors.danger, size: 48),
                          const SizedBox(height: 16),
                          Text(_error!, style: const TextStyle(color: AppColors.textSecondary, fontSize: 14)),
                          const SizedBox(height: 16),
                          FilledButton.icon(
                            onPressed: _load,
                            style: FilledButton.styleFrom(backgroundColor: AppColors.cyan),
                            icon: const Icon(Icons.refresh, color: Colors.black),
                            label: const Text('Retry', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),
                  )
                : ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    children: [
                      // Header stats cards
                      Row(
                        children: [
                          Expanded(
                            child: _StatSummaryCard(
                              label: 'Total Entries',
                              value: '$_entries',
                              icon: Icons.login_rounded,
                              color: AppColors.success,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _StatSummaryCard(
                              label: 'Total Exits',
                              value: '$_exits',
                              icon: Icons.logout_rounded,
                              color: AppColors.warning,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: _StatSummaryCard(
                              label: 'Total Dwell Time',
                              value: _formatDuration(_totalDwellMs),
                              icon: Icons.timer_outlined,
                              color: AppColors.cyan,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _StatSummaryCard(
                              label: 'Avg Dwell Time',
                              value: _entries > 0 ? _formatDuration(_totalDwellMs ~/ _entries) : '0m',
                              icon: Icons.av_timer_outlined,
                              color: AppColors.violet,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Schedule compliance section
                      if (hasSchedule) ...[
                        const Text('Schedule & Compliance', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15)),
                        const SizedBox(height: 8),
                        AppCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('Safety Compliance Rate', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                                      const SizedBox(height: 4),
                                      Text(
                                        '$complianceRate%',
                                        style: TextStyle(
                                          color: complianceRate >= 80
                                              ? AppColors.success
                                              : (complianceRate >= 50 ? AppColors.warning : AppColors.danger),
                                          fontSize: 28,
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const Spacer(),
                                  // Circular progress indicator
                                  SizedBox(
                                    width: 50,
                                    height: 50,
                                    child: CircularProgressIndicator(
                                      value: complianceRate / 100,
                                      backgroundColor: AppColors.bg,
                                      color: complianceRate >= 80
                                          ? AppColors.success
                                          : (complianceRate >= 50 ? AppColors.warning : AppColors.danger),
                                      strokeWidth: 6,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              const Divider(color: Color(0x1AFFFFFF), height: 1),
                              const SizedBox(height: 12),
                              _ScheduleMetricRow(
                                label: 'Expected Window',
                                value: [
                                  if (widget.zone.expectedArrival != null) 'Arrive by ${widget.zone.expectedArrival}',
                                  if (widget.zone.expectedDeparture != null) 'Leave by ${widget.zone.expectedDeparture}'
                                ].join(' - '),
                                color: AppColors.textPrimary,
                              ),
                              _ScheduleMetricRow(
                                label: 'Late Arrivals',
                                value: '$lates',
                                color: lates > 0 ? AppColors.warning : AppColors.textSecondary,
                              ),
                              _ScheduleMetricRow(
                                label: 'Missed Arrivals',
                                value: '$misseds',
                                color: misseds > 0 ? AppColors.danger : AppColors.textSecondary,
                              ),
                              _ScheduleMetricRow(
                                label: 'Overstayed Exceptions',
                                value: '$stayed',
                                color: stayed > 0 ? AppColors.warning : AppColors.textSecondary,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),
                      ],

                      // Dwell Time Distribution (Visual Bar Chart)
                      if (_entries > 0) ...[
                        const Text('Recent Dwell Times', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15)),
                        const SizedBox(height: 8),
                        AppCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Dwell time per entry (newest first)', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                              const SizedBox(height: 16),
                              ..._events.where((e) => e.type == 'exit' && e.durationMs != null).take(5).map((e) {
                                final duration = e.durationMs ?? 0;
                                // Normalize bar width based on a max of 8 hours (28,800,000 ms) or maximum seen in the list
                                final maxVal = _events
                                    .where((x) => x.durationMs != null)
                                    .map((x) => x.durationMs!)
                                    .fold(1, (m, val) => val > m ? val : m);
                                final pct = maxVal > 0 ? (duration / maxVal).clamp(0.05, 1.0) : 0.05;
                                
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 12.0),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(_formatDateTime(e.at), style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                                          Text(_formatDuration(duration), style: const TextStyle(color: AppColors.cyan, fontWeight: FontWeight.bold, fontSize: 11)),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Container(
                                        height: 8,
                                        width: double.infinity,
                                        decoration: BoxDecoration(color: AppColors.bg, borderRadius: BorderRadius.circular(4)),
                                        child: FractionallySizedBox(
                                          alignment: Alignment.centerLeft,
                                          widthFactor: pct,
                                          child: Container(
                                            decoration: BoxDecoration(
                                              gradient: AppColors.brandGradient,
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }).toList(),
                              if (_events.where((e) => e.type == 'exit' && e.durationMs != null).isEmpty)
                                const Center(
                                  child: Padding(
                                    padding: EdgeInsets.symmetric(vertical: 8.0),
                                    child: Text('Waiting for completed visits to record durations.', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontStyle: FontStyle.italic)),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),
                      ],

                      // Event Timeline
                      const Text('Zone Event History', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15)),
                      const SizedBox(height: 8),
                      _events.isEmpty
                          ? const AppCard(
                              child: Center(
                                child: Padding(
                                  padding: EdgeInsets.symmetric(vertical: 30.0),
                                  child: Text(
                                    'No events recorded for this zone yet.',
                                    style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                                  ),
                                ),
                              ),
                            )
                          : AppCard(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              child: ListView.separated(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: _events.length,
                                separatorBuilder: (_, __) => const Divider(color: Color(0x14FFFFFF), height: 1),
                                itemBuilder: (_, index) {
                                  final ev = _events[index];
                                  final isEnter = ev.type == 'enter' || ev.type == 'late';
                                  final isExit = ev.type == 'exit';
                                  
                                  IconData evIcon = Icons.info_outline;
                                  Color evColor = AppColors.textSecondary;
                                  String detailText = '';

                                  if (ev.type == 'enter') {
                                    evIcon = Icons.login_rounded;
                                    evColor = AppColors.success;
                                    detailText = 'Entered Safe Zone';
                                  } else if (ev.type == 'exit') {
                                    evIcon = Icons.logout_rounded;
                                    evColor = AppColors.warning;
                                    detailText = ev.durationMs != null
                                        ? 'Exited Safe Zone (Visited for ${_formatDuration(ev.durationMs!)})'
                                        : 'Exited Safe Zone';
                                  } else if (ev.type == 'late') {
                                    evIcon = Icons.report_problem_rounded;
                                    evColor = AppColors.warning;
                                    detailText = 'Arrived Late';
                                  } else if (ev.type == 'missed') {
                                    evIcon = Icons.cancel_rounded;
                                    evColor = AppColors.danger;
                                    detailText = 'Missed Expected Arrival';
                                  } else if (ev.type == 'stayed') {
                                    evIcon = Icons.alarm_on_rounded;
                                    evColor = AppColors.warning;
                                    detailText = 'Overstayed Expected Window';
                                  }

                                  return ListTile(
                                    dense: true,
                                    leading: CircleAvatar(
                                      radius: 14,
                                      backgroundColor: evColor.withValues(alpha: 0.12),
                                      child: Icon(evIcon, color: evColor, size: 14),
                                    ),
                                    title: Text(detailText, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13)),
                                    subtitle: Text(_formatDateTime(ev.at), style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                                  );
                                },
                              ),
                            ),
                    ],
                  ),
      ),
    );
  }
}

class _StatSummaryCard extends StatelessWidget {
  const _StatSummaryCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 16),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 16),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ScheduleMetricRow extends StatelessWidget {
  const _ScheduleMetricRow({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12.5)),
          Text(value, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12.5)),
        ],
      ),
    );
  }
}
