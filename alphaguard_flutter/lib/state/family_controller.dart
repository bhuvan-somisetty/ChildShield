import 'package:flutter/foundation.dart';

import '../data/models/child.dart';
import '../data/models/device_model.dart';
import '../data/models/family_model.dart';
import '../data/repositories/family_repository.dart';

/// Manages families, co-parents, guardians, children, device registries,
/// and child switching (active context selection).
class FamilyController extends ChangeNotifier {
  FamilyController(this._repo);
  final FamilyRepository _repo;

  bool _loading = false;
  bool get loading => _loading;

  String? _error;
  String? get error => _error;

  List<FamilyModel> _families = [];
  List<FamilyModel> get families => _families;

  List<Child> _children = [];
  List<Child> get children => _children;

  List<DeviceModel> _devices = [];
  List<DeviceModel> get devices => _devices;

  Child? _selectedChild;
  Child? get selectedChild => _selectedChild;

  Future<void> load() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      _families = await _repo.listFamilies();
      _children = await _repo.listChildren();
      _devices = await _repo.listDevices();

      if (_children.isNotEmpty) {
        if (_selectedChild == null || !_children.any((c) => c.id == _selectedChild!.id)) {
          _selectedChild = _children.first;
        } else {
          _selectedChild = _children.firstWhere((c) => c.id == _selectedChild!.id);
        }
      } else {
        _selectedChild = null;
      }
    } catch (e) {
      _error = 'Could not load family data.';
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  void selectChild(Child? child) {
    if (child == null) {
      _selectedChild = null;
    } else {
      _selectedChild = _children.firstWhere((c) => c.id == child.id, orElse: () => child);
    }
    notifyListeners();
  }

  Future<String> createInvite({required String familyId, required String role, List<String>? permissions}) async {
    final code = await _repo.createInvite(familyId: familyId, role: role, permissions: permissions);
    await load();
    return code;
  }

  Future<void> joinFamily(String code) async {
    await _repo.joinFamily(code);
    await load();
  }

  Future<void> removeMember(String memberId) async {
    await _repo.removeMember(memberId);
    await load();
  }

  Future<void> updateMember(String memberId, {required String role, required List<String> permissions}) async {
    await _repo.updateMember(memberId, role: role, permissions: permissions);
    await load();
  }

  Future<void> updateChild(String childId, Map<String, dynamic> data) async {
    await _repo.updateChild(childId, data);
    await load();
  }

  /// Creates a pending child slot and returns `{ child, pairing: { id, code, status } }`.
  Future<Map<String, dynamic>> createChildWithPairing(Map<String, dynamic> data) async {
    final result = await _repo.createChildWithPairing(data);
    await load();
    return result;
  }

  /// Revokes the old pairing code and mints a new one for the given child.
  Future<Map<String, dynamic>> regeneratePairing(String childId) async {
    return await _repo.regeneratePairing(childId);
  }

  Future<void> deleteDevice(String id) async {
    await _repo.deleteDevice(id);
    await load();
  }
}
