import '../api/api_client.dart';
import '../models/safety.dart';

/// Safety & monitoring API: push registration, location (+history with date range),
/// safe zones (CRUD + edit), SOS, radar events, zone analytics, and battery.
class SafetyRepository {
  SafetyRepository(this._api);
  final ApiClient _api;

  // ── Push device registration ───────────────────────────────────────────
  Future<void> registerPush(String token, String platform) => _api.post('/push/register', body: {'token': token, 'platform': platform});

  // ── Location ────────────────────────────────────────────────────────────
  Future<LocationPoint?> latest(String childId) async {
    final r = await _api.get('/location/$childId') as Map<String, dynamic>;
    final loc = r['location'] as Map<String, dynamic>?;
    return loc == null ? null : LocationPoint.fromJson(loc);
  }

  /// Fetch location history. Optional [from]/[to] are epoch-millisecond timestamps
  /// for daily (from=startOfDay) or weekly (from=startOfWeek) filtering.
  Future<List<LocationPoint>> history(String childId, {int limit = 100, int? from, int? to}) async {
    final query = <String, String>{'limit': '$limit'};
    if (from != null) query['from'] = '$from';
    if (to != null)   query['to']   = '$to';
    final r = await _api.get('/location/$childId/history', query: query) as Map<String, dynamic>;
    return (r['history'] as List).map((e) => LocationPoint.fromJson(e as Map<String, dynamic>)).toList();
  }

  // ── Battery ─────────────────────────────────────────────────────────────
  Future<BatteryStatus?> battery(String childId) async {
    try {
      final r = await _api.get('/battery/$childId') as Map<String, dynamic>;
      final b = r['battery'] as Map<String, dynamic>?;
      return b == null ? null : BatteryStatus.fromJson({...b, 'childId': childId});
    } catch (_) { return null; }
  }

  // ── Safe zones ──────────────────────────────────────────────────────────
  Future<List<SafeZone>> zones() async {
    final r = await _api.get('/zones') as Map<String, dynamic>;
    return (r['zones'] as List).map((e) => SafeZone.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<SafeZone> createZone({
    required String name,
    required double lat,
    required double lng,
    required double radius,
    String type = 'custom',
    String? address,
    String? expectedArrival,
    String? expectedDeparture,
    int graceMin = 15,
    String? childId,
  }) async {
    final r = await _api.post('/zones', body: {
      'name': name, 'lat': lat, 'lng': lng, 'radius': radius, 'type': type,
      if (address != null)          'address': address,
      if (expectedArrival != null)  'expectedArrival': expectedArrival,
      if (expectedDeparture != null)'expectedDeparture': expectedDeparture,
      'graceMin': graceMin,
      if (childId != null) 'childId': childId,
    }) as Map<String, dynamic>;
    return SafeZone.fromJson(r['zone'] as Map<String, dynamic>);
  }

  Future<SafeZone> updateZone(String id, Map<String, dynamic> patch) async {
    final r = await _api.patch('/zones/$id', body: patch) as Map<String, dynamic>;
    return SafeZone.fromJson(r['zone'] as Map<String, dynamic>);
  }

  Future<void> deleteZone(String id) => _api.delete('/zones/$id');

  // ── Zone events ─────────────────────────────────────────────────────────
  Future<List<ZoneEvent>> zoneEvents({String? childId, int limit = 50}) async {
    final query = <String, String>{'limit': '$limit'};
    if (childId != null) query['childId'] = childId;
    final r = await _api.get('/zone-events', query: query) as Map<String, dynamic>;
    return (r['events'] as List).map((e) => ZoneEvent.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Map<String, dynamic>> zoneAnalytics(String zoneId) async {
    final r = await _api.get('/zones/$zoneId/events') as Map<String, dynamic>;
    return r;
  }

  // ── Radar timeline ──────────────────────────────────────────────────────
  Future<RadarSummary?> radarSummary(String childId) async {
    try {
      final r = await _api.get('/radar/summary/$childId') as Map<String, dynamic>;
      final s = r['summary'] as Map<String, dynamic>?;
      return s == null ? null : RadarSummary.fromJson(s);
    } catch (_) { return null; }
  }

  Future<List<RadarEvent>> radarEvents(String childId, {int limit = 100, String? severity, int? from, int? to}) async {
    final query = <String, String>{'limit': '$limit'};
    if (severity != null) query['severity'] = severity;
    if (from != null)     query['from']     = '$from';
    if (to != null)       query['to']       = '$to';
    final r = await _api.get('/radar/events/$childId', query: query) as Map<String, dynamic>;
    return (r['events'] as List).map((e) => RadarEvent.fromJson(e as Map<String, dynamic>)).toList();
  }

  // Report location permission revoked/disabled from child device.
  Future<void> reportLocationDisabled({bool revoked = false}) => _api.post('/radar/location-disabled', body: {'revoked': revoked});

  // ── SOS ─────────────────────────────────────────────────────────────────
  Future<List<SosEvent>> sosList() async {
    final r = await _api.get('/sos') as Map<String, dynamic>;
    return (r['sos'] as List).map((e) => SosEvent.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> resolveSos(String id) => _api.post('/sos/$id/resolve');

  // Child telemetry (used by the child app's location service).
  Future<void> pushLocation(double lat, double lng, {double? accuracy, double? speed}) =>
      _api.post('/location', body: {'lat': lat, 'lng': lng, if (accuracy != null) 'accuracy': accuracy, if (speed != null) 'speed': speed});

  Future<void> pushBattery(int level, {bool charging = false}) =>
      _api.post('/battery', body: {'level': level, 'charging': charging});

  // Trigger SOS from child device via REST (also emitted on socket).
  Future<void> triggerSos({Map<String, double>? location}) =>
      _api.post('/sos', body: {if (location != null) 'location': location});
}
