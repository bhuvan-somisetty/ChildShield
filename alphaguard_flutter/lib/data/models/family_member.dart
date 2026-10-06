class FamilyMember {
  const FamilyMember({
    required this.id,
    required this.userId,
    required this.name,
    required this.email,
    required this.role,
    required this.permissions,
    this.joinedAt,
  });

  final String id;
  final String userId;
  final String name;
  final String email;
  final String role; // primary_parent, co_parent, guardian
  final List<String> permissions;
  final int? joinedAt;

  factory FamilyMember.fromJson(Map<String, dynamic> j) => FamilyMember(
        id: j['id'] as String,
        userId: (j['userId'] ?? '') as String,
        name: (j['name'] ?? 'Parent') as String,
        email: (j['email'] ?? '') as String,
        role: (j['role'] ?? 'co_parent') as String,
        permissions: List<String>.from(j['permissions'] ?? []),
        joinedAt: j['joinedAt'] as int?,
      );
}
