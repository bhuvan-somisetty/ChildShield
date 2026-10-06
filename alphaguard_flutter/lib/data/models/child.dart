/// Child profile (the `publicChild` shape from /api/children).
class Child {
  const Child({
    required this.id,
    required this.name,
    this.age,
    this.grade,
    this.school,
    this.emoji = '🧒',
    this.color = '#10b981',
    this.online = false,
    this.pairingId,
    this.pairingCode,
    this.pairingStatus,
    this.familyId,
    this.battery,
    this.location,
  });

  final String id;
  final String name;
  final int? age;
  final String? grade;
  final String? school;
  final String emoji;
  final String color;
  final bool online;
  final String? pairingId;
  final String? pairingCode;
  final String? pairingStatus;
  final String? familyId;
  // Telemetry from backend — present when child has reported battery/location.
  final Map<String, dynamic>? battery;  // {level: int, charging: bool, at: int}
  final Map<String, dynamic>? location; // {lat, lng, accuracy, at}

  int? get batteryLevel => battery?['level'] as int?;
  bool get batteryCharging => (battery?['charging'] as bool?) ?? false;
  int? get lastSeenAt => battery?['at'] as int? ?? location?['at'] as int?;

  factory Child.fromJson(Map<String, dynamic> j) {
    final pairing = j['pairing'] as Map<String, dynamic>?;
    return Child(
      id: j['id'] as String,
      name: (j['name'] ?? 'Child') as String,
      age: j['age'] as int?,
      grade: j['grade'] as String?,
      school: j['school'] as String?,
      emoji: (j['emoji'] ?? '🧒') as String,
      color: (j['color'] ?? '#10b981') as String,
      online: (j['online'] ?? false) as bool,
      pairingId: pairing?['id'] as String?,
      pairingCode: pairing?['code'] as String?,
      pairingStatus: pairing?['status'] as String?,
      familyId: j['familyId'] as String?,
      battery: j['battery'] as Map<String, dynamic>?,
      location: j['location'] as Map<String, dynamic>?,
    );
  }

  Child copyWithBattery(Map<String, dynamic>? bat) => Child(
    id: id, name: name, age: age, grade: grade, school: school,
    emoji: emoji, color: color, online: online, pairingId: pairingId,
    pairingCode: pairingCode, pairingStatus: pairingStatus, familyId: familyId,
    battery: bat, location: location,
  );

  Child copyWithName(String newName) => Child(
    id: id, name: newName, age: age, grade: grade, school: school,
    emoji: emoji, color: color, online: online, pairingId: pairingId,
    pairingCode: pairingCode, pairingStatus: pairingStatus, familyId: familyId,
    battery: battery, location: location,
  );
}
