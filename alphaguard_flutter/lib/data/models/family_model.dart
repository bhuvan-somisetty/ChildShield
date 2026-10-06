import 'child.dart';
import 'device_model.dart';
import 'family_member.dart';

class FamilyModel {
  const FamilyModel({
    required this.id,
    required this.name,
    required this.ownerId,
    required this.createdAt,
    required this.members,
    required this.children,
    required this.devices,
  });

  final String id;
  final String name;
  final String ownerId;
  final int createdAt;
  final List<FamilyMember> members;
  final List<Child> children;
  final List<DeviceModel> devices;

  factory FamilyModel.fromJson(Map<String, dynamic> j) => FamilyModel(
        id: j['id'] as String,
        name: (j['name'] ?? '') as String,
        ownerId: (j['ownerId'] ?? '') as String,
        createdAt: (j['createdAt'] ?? 0) as int,
        members: (j['members'] as List? ?? [])
            .map((e) => FamilyMember.fromJson(e as Map<String, dynamic>))
            .toList(),
        children: (j['children'] as List? ?? [])
            .map((e) => Child.fromJson(e as Map<String, dynamic>))
            .toList(),
        devices: (j['devices'] as List? ?? [])
            .map((e) => DeviceModel.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
