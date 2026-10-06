import 'child.dart';
import 'parent.dart';

/// The authenticated identity, role-aware. `/me` returns either a parent or a
/// child session; the router renders the matching shell.
class Session {
  const Session({required this.role, this.parent, this.child, this.pairingId});

  final String role; // 'parent' | 'child'
  final Parent? parent;
  final Child? child;
  final String? pairingId;

  bool get isParent => role == 'parent';
  bool get isChild => role == 'child';

  factory Session.fromMe(Map<String, dynamic> j) {
    final role = (j['role'] ?? 'parent') as String;
    if (role == 'child') {
      final c = j['child'] as Map<String, dynamic>?;
      return Session(role: 'child', child: c != null ? Child.fromJson(c) : null, pairingId: j['pairingId'] as String?);
    }
    final p = j['parent'] as Map<String, dynamic>?;
    return Session(role: 'parent', parent: p != null ? Parent.fromJson(p, admin: (j['admin'] ?? false) as bool) : null);
  }
}
