/// AI productivity report from POST /ai/reports. The backend computes a rich
/// deterministic `metrics` object; we keep it as a map plus typed accessors for
/// the fields the dashboard renders (including the verification/communication
/// analytics: approval rate, discussions, parent engagement, consistency,
/// human-readable insights).
class AiReport {
  AiReport({required this.id, required this.period, required this.summary, required this.metrics, required this.at});

  final String id;
  final String period;
  final String summary;
  final Map<String, dynamic> metrics;
  final int at;

  factory AiReport.fromJson(Map<String, dynamic> j) => AiReport(
        id: j['id'].toString(),
        period: (j['period'] ?? 'weekly') as String,
        summary: (j['summary'] ?? '') as String,
        metrics: (j['metrics'] ?? const {}) as Map<String, dynamic>,
        at: (j['at'] ?? 0) as int,
      );

  static int _n(dynamic v) => v is num ? v.toInt() : 0;
  int _int(String k) => _n(metrics[k]);
  Map<String, dynamic> _map(String k) => metrics[k] is Map ? Map<String, dynamic>.from(metrics[k] as Map) : const {};

  int get taskCompletionPct => _int('taskCompletionPct');
  int get taskFailurePct => _int('taskFailurePct');
  int get currentTaskStreak => _int('currentTaskStreak');
  int get avgTargetProgress => _int('avgTargetProgress');
  String get riskLevel => (metrics['riskLevel'] ?? 'Low') as String;
  String get recommendation => (metrics['recommendation'] ?? '') as String;
  String? get mostProductiveTime => metrics['mostProductiveTime'] as String?;

  List<String> get insights => ((metrics['insights'] ?? const []) as List).cast<String>();

  // Approval analytics
  Map<String, dynamic> get approval => _map('approval');
  int get approvalRate => _n(approval['approvalRate']);
  int get approvalDecisions => _n(approval['decisions']);
  int get approved => _n(approval['approved']);
  int get pendingApproval => _n(approval['pendingApproval']);

  // Discussion analytics
  Map<String, dynamic> get discussions => _map('discussions');
  int get totalMessages => _n(discussions['totalMessages']);
  String? get mostDiscussedCategory {
    final list = (discussions['mostDiscussed'] ?? const []) as List;
    if (list.isEmpty) return null;
    return (list.first as Map)['category'] as String?;
  }

  // Parent engagement + consistency
  String get parentEngagement => (_map('parentEngagement')['level'] ?? 'low') as String;
  int get consistencyPct => _n(_map('consistency')['consistencyPct']);
  int get consistencyDelta => _n(_map('consistency')['delta']);

  // Safety Intelligence scores
  int get safetyScore => _int('safetyScore') > 0 ? _int('safetyScore') : 90;
  String get riskScore => (metrics['riskScore'] ?? 'Low') as String;
  int get screenTimeScore => _int('screenTimeScore') > 0 ? _int('screenTimeScore') : 90;
  int get locationComplianceScore => _int('locationComplianceScore') > 0 ? _int('locationComplianceScore') : 95;
  int get deviceHealthScore => _int('deviceHealthScore') > 0 ? _int('deviceHealthScore') : 90;

  // Weekly Report details
  Map<String, dynamic> get weeklyReport => _map('weeklyReport');
  int get totalScreenTimeMins => _n(weeklyReport['totalScreenTimeMins']);
  String get batteryHealthPatterns => (weeklyReport['batteryHealthPatterns'] ?? 'Healthy') as String;
  int get sosEventsCount => _n(weeklyReport['sosEventsCount']);
  int get locationAnomaliesCount => _n(weeklyReport['locationAnomaliesCount']);
  int get deviceTamperingAttemptsCount => _n(weeklyReport['deviceTamperingAttemptsCount']);

  List<Map<String, dynamic>> get topApps {
    final list = (weeklyReport['topApps'] ?? const []) as List;
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  // Risk Detections and Recommendations
  List<Map<String, dynamic>> get riskDetections {
    final list = (metrics['riskDetections'] ?? const []) as List;
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  List<String> get recommendations => ((metrics['recommendations'] ?? const []) as List).cast<String>();

  List<Map<String, dynamic>> get historicalReports {
    final list = (metrics['historicalReports'] ?? const []) as List;
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }
}
