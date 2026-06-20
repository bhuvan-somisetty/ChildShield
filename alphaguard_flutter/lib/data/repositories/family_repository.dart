import '../api/api_client.dart';
import '../models/child.dart';
import '../models/device_model.dart';
import '../models/family_model.dart';

class FamilyRepository {
  FamilyRepository(this._api);
  final ApiClient _api;

  Future<List<Child>> listChildren() async {
    final r = await _api.get('/children') as Map<String, dynamic>;
    return (r['children'] as List).map((e) => Child.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<FamilyModel>> listFamilies() async {
    final r = await _api.get('/families') as Map<String, dynamic>;
    return (r['families'] as List).map((e) => FamilyModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<String> createInvite({
    required String familyId,
    required String role,
    List<String>? permissions,
  }) async {
    final r = await _api.post('/family/invite', body: {
      'familyId': familyId,
      'role': role,
      if (permissions != null) 'permissions': permissions,
    }) as Map<String, dynamic>;
    return r['code'] as String;
  }

  Future<void> joinFamily(String code) async {
    await _api.post('/family/join', body: {'code': code});
  }

  Future<void> removeMember(String memberId) async {
    await _api.delete('/family/members/$memberId');
  }

  Future<void> updateMember(String memberId, {required String role, required List<String> permissions}) async {
    await _api.patch('/family/members/$memberId', body: {'role': role, 'permissions': permissions});
  }

  Future<Child> updateChild(String childId, Map<String, dynamic> data) async {
    final r = await _api.patch('/children/$childId', body: data) as Map<String, dynamic>;
    return Child.fromJson(r['child'] as Map<String, dynamic>);
  }

  /// Creates a pending child slot on the server and returns the 6-digit pairing
  /// code (same as frontend-v2 `api.createChild`). Data fields are optional;
  /// defaults match the frontend-v2 ConnectChild.jsx defaults.
  Future<Map<String, dynamic>> createChildWithPairing(Map<String, dynamic> data) async {
    return await _api.post('/children', body: data) as Map<String, dynamic>;
  }

  /// Revokes the current pending pairing code and mints a fresh one.
  Future<Map<String, dynamic>> regeneratePairing(String childId) async {
    return await _api.post('/pair/regenerate', body: {'childId': childId}) as Map<String, dynamic>;
  }

  Future<List<DeviceModel>> listDevices() async {
    final r = await _api.get('/devices') as Map<String, dynamic>;
    return (r['devices'] as List).map((e) => DeviceModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<DeviceModel> registerDevice({
    required String deviceId,
    required String deviceName,
    required String platform,
    required String agentVersion,
    String? childId,
  }) async {
    final r = await _api.post('/devices/register', body: {
      'deviceId': deviceId,
      'deviceName': deviceName,
      'platform': platform,
      'agentVersion': agentVersion,
      if (childId != null) 'childId': childId,
    }) as Map<String, dynamic>;
    return DeviceModel.fromJson(r['device'] as Map<String, dynamic>);
  }

  Future<void> deleteDevice(String id) async {
    await _api.delete('/devices/$id');
  }
}
