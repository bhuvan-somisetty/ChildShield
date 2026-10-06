import 'package:flutter/foundation.dart';

import '../data/models/safety.dart';
import '../data/repositories/safety_repository.dart';
import '../services/socket/socket_events.dart';
import '../services/socket/socket_service.dart';

/// History date range mode for the Route History tab.
enum HistoryMode { today, week, all }

extension HistoryModeExt on HistoryMode {
  String get label => switch (this) { HistoryMode.today => 'Today', HistoryMode.week => 'This Week', HistoryMode.all => 'All' };

  /// Returns (from, to) epoch-millisecond timestamps, or (null, null) for 'all'.
  (int?, int?) get range {
    final now = DateTime.now();
    switch (this) {
      case HistoryMode.today:
        final start = DateTime(now.year, now.month, now.day);
        return (start.millisecondsSinceEpoch, null);
      case HistoryMode.week:
        final start = now.subtract(const Duration(days: 7));
        return (start.millisecondsSinceEpoch, null);
      case HistoryMode.all:
        return (null, null);
    }
  }
}

/// Family Radar state for one child.
/// Manages: live location, route history (with date-range mode), safe zones,
/// battery status, device-online state, zone events, and radar event timeline.
/// Live via Socket.IO: location:update, zones:update, battery:update, presence,
/// zone:event, sos:alert, radar:event.
class RadarController extends ChangeNotifier {
  RadarController({
    required SafetyRepository repo,
    required SocketService socket,
    required this.childId,
  })  : _repo = repo,
        _socket = socket;

  final SafetyRepository _repo;
  final SocketService _socket;
  final String childId;
  final List<void Function()> _disposers = [];

  // ── State ────────────────────────────────────────────────────────────────
  LocationPoint? latest;
  List<LocationPoint> history = [];
  List<SafeZone> zones = [];
  List<ZoneEvent> zoneEvents = [];
  List<RadarEvent> radarEvents = [];
  BatteryStatus? battery;
  bool isDeviceOnline = false;
  bool loading = true;
  String? error;

  // Route history date filter.
  HistoryMode historyMode = HistoryMode.today;

  // Timeline severity filter (null = all).
  RadarSeverity? severityFilter;

  List<RadarEvent> get filteredRadarEvents => severityFilter == null
      ? radarEvents
      : radarEvents.where((e) => e.severity == severityFilter).toList();

  // ── Load ─────────────────────────────────────────────────────────────────
  Future<void> load() async {
    try {
      final (from, to) = historyMode.range;
      final results = await Future.wait([
        _repo.latest(childId),
        _repo.history(childId, limit: 200, from: from, to: to),
        _repo.zones(),
        _repo.battery(childId),
        _repo.radarEvents(childId, limit: 100),
        _repo.zoneEvents(childId: childId, limit: 50),
      ]);
      latest   = results[0] as LocationPoint?;
      history  = results[1] as List<LocationPoint>;
      zones    = results[2] as List<SafeZone>;
      battery  = results[3] as BatteryStatus?;
      radarEvents = results[4] as List<RadarEvent>;
      zoneEvents  = results[5] as List<ZoneEvent>;
    } catch (e) {
      error = 'Could not load radar data.';
      if (kDebugMode) debugPrint('[RadarController] load error: $e');
    } finally {
      loading = false;
      notifyListeners();
    }
    _subscribe();
  }

  Future<void> reloadHistory() async {
    final (from, to) = historyMode.range;
    try {
      history = await _repo.history(childId, limit: 200, from: from, to: to);
      notifyListeners();
    } catch (_) {}
  }

  void setHistoryMode(HistoryMode mode) {
    if (historyMode == mode) return;
    historyMode = mode;
    notifyListeners();
    reloadHistory();
  }

  void setSeverityFilter(RadarSeverity? s) {
    severityFilter = s;
    notifyListeners();
  }

  // ── Zone management ──────────────────────────────────────────────────────
  Future<SafeZone?> createZone({
    required String name,
    required double lat,
    required double lng,
    required double radius,
    String type = 'custom',
    String? address,
    String? expectedArrival,
    String? expectedDeparture,
    int graceMin = 15,
  }) async {
    try {
      final z = await _repo.createZone(
        name: name, lat: lat, lng: lng, radius: radius, type: type,
        address: address, expectedArrival: expectedArrival,
        expectedDeparture: expectedDeparture, graceMin: graceMin, childId: childId,
      );
      zones = [...zones, z];
      notifyListeners();
      return z;
    } catch (e) {
      if (kDebugMode) debugPrint('[RadarController] createZone error: $e');
      return null;
    }
  }

  Future<bool> updateZone(String id, Map<String, dynamic> patch) async {
    try {
      final updated = await _repo.updateZone(id, patch);
      zones = zones.map((z) => z.id == id ? updated : z).toList();
      notifyListeners();
      return true;
    } catch (_) { return false; }
  }

  Future<bool> deleteZone(String id) async {
    try {
      await _repo.deleteZone(id);
      zones = zones.where((z) => z.id != id).toList();
      notifyListeners();
      return true;
    } catch (_) { return false; }
  }

  // ── Socket subscriptions ─────────────────────────────────────────────────
  void _subscribe() {
    if (_disposers.isNotEmpty) return;

    // Live location from child device.
    _disposers.add(_socket.on(SocketEvents.locationUpdate, (data) {
      if (data is! Map) return;
      final p = LocationPoint.fromJson(Map<String, dynamic>.from(data));
      latest = p;
      history = [p, ...history].take(200).toList();
      notifyListeners();
    }));

    // Safe zones refreshed (after create/delete/edit).
    _disposers.add(_socket.on(SocketEvents.zonesUpdate, (data) {
      if (data is! List) return;
      zones = data.map((e) => SafeZone.fromJson(Map<String, dynamic>.from(e as Map))).toList();
      notifyListeners();
    }));

    // Battery update from child device.
    _disposers.add(_socket.on(SocketEvents.batteryUpdate, (data) {
      if (data is! Map) return;
      final d = Map<String, dynamic>.from(data);
      if (d['childId'] != childId) return;
      battery = BatteryStatus.fromJson({...d, 'childId': childId});
      notifyListeners();
    }));

    // Device online/offline presence.
    _disposers.add(_socket.on(SocketEvents.presence, (data) {
      if (data is! Map) return;
      final d = Map<String, dynamic>.from(data);
      if (d['childId'] != childId) return;
      isDeviceOnline = d['online'] == true;
      notifyListeners();
    }));

    // Zone enter/exit/late events.
    _disposers.add(_socket.on(SocketEvents.zoneEvent, (data) {
      if (data is! Map) return;
      final d = Map<String, dynamic>.from(data);
      if (d['childId'] != childId) return;
      final ze = ZoneEvent.fromJson(d);
      zoneEvents = [ze, ...zoneEvents].take(50).toList();
      notifyListeners();
    }));

    // SOS alerts — appear in radar timeline as 'sos' type critical events.
    _disposers.add(_socket.on(SocketEvents.sosAlert, (data) {
      if (data is! Map) return;
      final d = Map<String, dynamic>.from(data);
      if (d['childId'] != childId) return;
      final ev = RadarEvent.fromJson({
        ...d,
        'type': 'sos',
        'severity': 'critical',
        'title': '🚨 SOS Alert',
        'body': 'Emergency SOS triggered',
        'source': 'sos',
      });
      radarEvents = [ev, ...radarEvents].take(100).toList();
      notifyListeners();
    }));

    // Radar events (device online/offline, battery, location alerts).
    _disposers.add(_socket.on(SocketEvents.radarEvent, (data) {
      if (data is! Map) return;
      final d = Map<String, dynamic>.from(data);
      if (d['childId'] != childId) return;
      final ev = RadarEvent.fromJson(d);
      // Keep device online state in sync.
      if (ev.type == 'device_online')  isDeviceOnline = true;
      if (ev.type == 'device_offline') isDeviceOnline = false;
      radarEvents = [ev, ...radarEvents].take(100).toList();
      notifyListeners();
    }));
  }

  @override
  void dispose() {
    for (final d in _disposers) {
      d();
    }
    _disposers.clear();
    super.dispose();
  }
}
