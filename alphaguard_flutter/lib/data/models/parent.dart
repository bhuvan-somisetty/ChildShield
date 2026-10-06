/// Parent account (the `publicParent` shape from /api/me, register, login).
class Parent {
  const Parent({required this.id, required this.email, required this.name, this.admin = false});

  final String id;
  final String email;
  final String name;
  final bool admin;

  factory Parent.fromJson(Map<String, dynamic> j, {bool admin = false}) => Parent(
        id: j['id'] as String,
        email: (j['email'] ?? '') as String,
        name: (j['name'] ?? 'Parent') as String,
        admin: admin,
      );
}
