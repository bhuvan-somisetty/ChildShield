class DeviceModel {
  const DeviceModel({
    required this.id,
    required this.deviceId,
    required this.deviceName,
    required this.platform,
    required this.lastSeen,
    required this.agentVersion,
    this.childId,
    this.familyId,
    required this.registrationTimestamp,
    required this.status, // active, inactive
  });

  final String id;
  final String deviceId;
  final String deviceName;
  final String platform;
  final int lastSeen;
  final String agentVersion;
  final String? childId;
  final String? familyId;
  final int registrationTimestamp;
  final String status;

  factory DeviceModel.fromJson(Map<String, dynamic> j) => DeviceModel(
        id: j['id'] as String,
        deviceId: (j['deviceId'] ?? j['id'] ?? '') as String,
        deviceName: (j['deviceName'] ?? 'Unknown Device') as String,
        platform: (j['platform'] ?? 'android') as String,
        lastSeen: (j['lastSeen'] ?? 0) as int,
        agentVersion: (j['agentVersion'] ?? '1.0.0') as String,
        childId: j['childId'] as String?,
        familyId: j['familyId'] as String?,
        registrationTimestamp: (j['registrationTimestamp'] ?? 0) as int,
        status: (j['status'] ?? 'active') as String,
      );
}
