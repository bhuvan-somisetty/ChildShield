import '../api/api_client.dart';
import '../models/parent.dart';
import '../models/session.dart';

/// Auth endpoints, exactly as documented. Returns a token + parent on success.
class AuthResult {
  const AuthResult(this.token, this.parent, {this.needsPin = false});
  final String token;
  final Parent parent;
  final bool needsPin;
}

class AuthRepository {
  AuthRepository(this._api);
  final ApiClient _api;

  Future<AuthResult> register({required String email, required String password, required String name, String? pin}) async {
    final r = await _api.post('/auth/parent/register', body: {
      'email': email,
      'password': password,
      'name': name,
      if (pin != null) 'pin': pin,
    }) as Map<String, dynamic>;
    return AuthResult(r['token'] as String, Parent.fromJson(r['parent'] as Map<String, dynamic>));
  }

  Future<AuthResult> login({required String email, required String password}) async {
    final r = await _api.post('/auth/parent/login', body: {'email': email, 'password': password}) as Map<String, dynamic>;
    return AuthResult(r['token'] as String, Parent.fromJson(r['parent'] as Map<String, dynamic>));
  }

  Future<AuthResult> google(String code) async {
    final r = await _api.post('/auth/google', body: {'code': code}) as Map<String, dynamic>;
    return AuthResult(
      r['token'] as String,
      Parent.fromJson(r['parent'] as Map<String, dynamic>),
      needsPin: (r['needsPin'] ?? false) as bool,
    );
  }

  Future<AuthResult> apple({required String identityToken, String? email, String? name}) async {
    final r = await _api.post('/auth/apple', body: {
      'identityToken': identityToken,
      if (email != null) 'email': email,
      if (name != null) 'name': name,
    }) as Map<String, dynamic>;
    return AuthResult(
      r['token'] as String,
      Parent.fromJson(r['parent'] as Map<String, dynamic>),
      needsPin: (r['needsPin'] ?? false) as bool,
    );
  }

  /// Validates the persisted token + returns the current identity (auto-login).
  /// Role-aware: works for both parent and child sessions.
  Future<Session> me() async {
    final r = await _api.get('/me') as Map<String, dynamic>;
    return Session.fromMe(r);
  }

  /// Child device claims a 6-digit pairing code → child JWT. Returns the token
  /// (the session is then resolved via /me, uniform with the parent flow).
  Future<String> claim(String code, {String platform = 'flutter'}) async {
    final r = await _api.post('/pair/claim', body: {'code': code.trim(), 'platform': platform}) as Map<String, dynamic>;
    return r['token'] as String;
  }

  /// Request a password reset email. Always succeeds (anti-enumeration).
  Future<void> forgotPassword(String email) => _api.post('/auth/parent/forgot', body: {'email': email.trim().toLowerCase()});

  /// Complete a reset with the emailed token + a new password.
  Future<void> resetPassword(String token, String password) => _api.post('/auth/parent/reset', body: {'token': token.trim(), 'password': password});

  Future<Map<String, dynamic>> consentStatus() async {
    final r = await _api.get('/consent/status') as Map<String, dynamic>;
    return r;
  }

  Future<void> saveConsent(List<String> acceptedDocs) async {
    await _api.post('/consent', body: {
      'acceptedDocs': acceptedDocs,
      'method': 'app_settings',
    });
  }
}
