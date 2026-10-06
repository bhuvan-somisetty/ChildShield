/// Safety & monitoring models — location points, safe zones, SOS events,
/// zone events, radar events, and battery status.

class LocationPoint {
  const LocationPoint({
    required this.lat,
    required this.lng,
    this.accuracy,
    this.speed,
    this.at = 0,
  });
  final double lat;
  final double lng;
  final double? accuracy;
  final double? speed; // m/s from GPS; shown only when > 0.5 m/s (≈2 km/h)
  final int at;

  static double _d(dynamic v) => v is num ? v.toDouble() : 0;

  factory LocationPoint.fromJson(Map<String, dynamic> j) => LocationPoint(
        lat: _d(j['lat']),
        lng: _d(j['lng']),
        accuracy: j['accuracy'] is num ? (j['accuracy'] as num).toDouble() : null,
        speed: j['speed'] is num ? (j['speed'] as num).toDouble() : null,
        at: (j['at'] is num) ? (j['at'] as num).toInt() : 0,
      );
}

class SafeZone {
  const SafeZone({
    required this.id,
    required this.name,
    required this.lat,
    required this.lng,
    required this.radius,
    this.type = 'custom',
    this.address,
    this.expectedArrival,
    this.expectedDeparture,
    this.graceMin = 15,
    this.childId,
  });
  final String id;
  final String name;
  final double lat;
  final double lng;
  final double radius; // metres
  final String type;
  final String? address;
  final String? expectedArrival;  // HH:MM
  final String? expectedDeparture; // HH:MM
  final int graceMin;
  final String? childId;

  static double _d(dynamic v) => v is num ? v.toDouble() : 0;

  factory SafeZone.fromJson(Map<String, dynamic> j) => SafeZone(
        id: j['id'].toString(),
        name: (j['name'] ?? 'Safe Zone') as String,
        lat: _d(j['lat']),
        lng: _d(j['lng']),
        radius: j['radius'] is num ? (j['radius'] as num).toDouble() : 100,
        type: (j['type'] ?? 'custom') as String,
        address: j['address'] as String?,
        expectedArrival: j['expectedArrival'] as String?,
        expectedDeparture: j['expectedDeparture'] as String?,
        graceMin: j['graceMin'] is num ? (j['graceMin'] as num).toInt() : 15,
        childId: j['childId'] as String?,
      );

  SafeZone copyWith({String? name, double? radius, String? address, String? expectedArrival, String? expectedDeparture, int? graceMin}) =>
      SafeZone(id: id, name: name ?? this.name, lat: lat, lng: lng, radius: radius ?? this.radius, type: type, address: address ?? this.address, expectedArrival: expectedArrival ?? this.expectedArrival, expectedDeparture: expectedDeparture ?? this.expectedDeparture, graceMin: graceMin ?? this.graceMin, childId: childId);
}

class SosEvent {
  const SosEvent({required this.id, required this.at, required this.status, this.lat, this.lng});
  final String id;
  final int at;
  final String status; // active | resolved
  final double? lat;
  final double? lng;

  bool get isActive => status == 'active';

  factory SosEvent.fromJson(Map<String, dynamic> j) {
    final loc = j['location'] as Map<String, dynamic>?;
    return SosEvent(
      id: j['id'].toString(),
      at: (j['at'] is num) ? (j['at'] as num).toInt() : 0,
      status: (j['status'] ?? 'active') as String,
      lat: loc != null && loc['lat'] is num ? (loc['lat'] as num).toDouble() : null,
      lng: loc != null && loc['lng'] is num ? (loc['lng'] as num).toDouble() : null,
    );
  }
}

/// Zone enter / exit / late / missed / stayed event.
class ZoneEvent {
  const ZoneEvent({
    required this.id,
    required this.childId,
    required this.zoneId,
    required this.zoneName,
    required this.type,
    required this.at,
    this.durationMs,
  });
  final String id;
  final String childId;
  final String zoneId;
  final String zoneName;
  final String type; // enter | exit | late | missed | stayed
  final int at;
  final int? durationMs;

  factory ZoneEvent.fromJson(Map<String, dynamic> j) => ZoneEvent(
        id: j['id'].toString(),
        childId: (j['childId'] ?? '') as String,
        zoneId: (j['zoneId'] ?? '') as String,
        zoneName: (j['zoneName'] ?? 'Safe Zone') as String,
        type: (j['type'] ?? 'enter') as String,
        at: j['at'] is num ? (j['at'] as num).toInt() : 0,
        durationMs: j['durationMs'] is num ? (j['durationMs'] as num).toInt() : null,
      );
}

/// Severity levels for radar events — matches backend contract exactly.
enum RadarSeverity { info, warning, critical }

extension RadarSeverityExt on RadarSeverity {
  static RadarSeverity parse(String? s) {
    switch (s) {
      case 'warning':  return RadarSeverity.warning;
      case 'critical': return RadarSeverity.critical;
      default:         return RadarSeverity.info;
    }
  }

  String get label => name[0].toUpperCase() + name.substring(1);
}

/// Unified radar event — covers zone events, SOS, device online/offline,
/// battery alerts, and location-permission events. Designed to be consumed
/// by AI Reports, Safety Insights, and Family Analytics without changes.
class RadarEvent {
  const RadarEvent({
    required this.id,
    required this.childId,
    required this.type,
    required this.severity,
    required this.title,
    required this.body,
    required this.at,
    this.data = const {},
    this.source = 'radar',
  });

  final String id;
  final String childId;
  /// type values: zone_enter | zone_exit | zone_late | zone_missed | zone_stayed |
  ///              sos | device_online | device_offline |
  ///              battery_low | battery_critical |
  ///              location_disabled | location_revoked
  final String type;
  final RadarSeverity severity;
  final String title;
  final String body;
  final int at;
  final Map<String, dynamic> data;
  final String source; // 'radar' | 'zone' | 'sos'

  factory RadarEvent.fromJson(Map<String, dynamic> j) => RadarEvent(
        id: j['id'].toString(),
        childId: (j['childId'] ?? '') as String,
        type: (j['type'] ?? 'unknown') as String,
        severity: RadarSeverityExt.parse(j['severity'] as String?),
        title: (j['title'] ?? j['type'] ?? '') as String,
        body: (j['body'] ?? '') as String,
        at: j['at'] is num ? (j['at'] as num).toInt() : 0,
        data: (j['data'] is Map ? Map<String, dynamic>.from(j['data'] as Map) : const {}),
        source: (j['source'] ?? 'radar') as String,
      );
}

/// Battery status for a child device.
class BatteryStatus {
  const BatteryStatus({required this.childId, required this.level, required this.charging, required this.at});
  final String childId;
  final int level;     // 0–100
  final bool charging;
  final int at;

  bool get isLow      => level <= 20 && !charging;
  bool get isCritical => level <= 10 && !charging;

  factory BatteryStatus.fromJson(Map<String, dynamic> j) => BatteryStatus(
        childId: (j['childId'] ?? '') as String,
        level: j['level'] is num ? (j['level'] as num).toInt() : 100,
        charging: j['charging'] == true,
        at: j['at'] is num ? (j['at'] as num).toInt() : 0,
      );
}

/// Radar summary — aggregated dashboard data for one child.
class RadarSummary {
  const RadarSummary({
    required this.childId,
    this.childName,
    this.location,
    this.battery,
    this.zoneCount = 0,
    this.recentEvents = const [],
  });
  final String childId;
  final String? childName;
  final LocationPoint? location;
  final BatteryStatus? battery;
  final int zoneCount;
  final List<RadarEvent> recentEvents;

  factory RadarSummary.fromJson(Map<String, dynamic> j) {
    final loc = j['location'] as Map<String, dynamic>?;
    final bat = j['battery'] as Map<String, dynamic>?;
    return RadarSummary(
      childId: (j['childId'] ?? '') as String,
      childName: j['childName'] as String?,
      location: loc != null ? LocationPoint.fromJson(loc) : null,
      battery: bat != null ? BatteryStatus.fromJson({...bat, 'childId': j['childId'] ?? ''}) : null,
      zoneCount: j['zoneCount'] is num ? (j['zoneCount'] as num).toInt() : 0,
      recentEvents: (j['recentEvents'] as List? ?? []).map((e) => RadarEvent.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }
}
