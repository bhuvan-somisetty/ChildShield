import '../../data/api/api_client.dart';
import '../../data/models/child.dart';
import '../../data/models/parent.dart';
import '../../data/models/session.dart';
import '../../data/repositories/auth_repository.dart';
import '../lifecycle/lifecycle_service.dart';
import '../socket/socket_service.dart';
import 'google_auth.dart';
import 'token_storage.dart';

/// Orchestrates authentication across the API, secure token storage, the socket,
/// Google sign-in and lifecycle flags. Role-aware: a parent signs in with
/// email/Google; a child claims a pairing code. Every path resolves the
/// authoritative identity via `/me`.
class AuthService {
  AuthService({
    required ApiClient api,
    required AuthRepository repo,
    required TokenStorage storage,
    required GoogleAuth google,
    required SocketService socket,
    required LifecycleService lifecycle,
  })  : _api = api,
        _repo = repo,
        _storage = storage,
        _google = google,
        _socket = socket,
        _lifecycle = lifecycle;

  final ApiClient _api;
  final AuthRepository _repo;
  final TokenStorage _storage;
  final GoogleAuth _google;
  final SocketService _socket;
  final LifecycleService _lifecycle;

  Session? _session;
  Session? get session => _session;
  Parent? get parent => _session?.parent;
  Child? get child => _session?.child;
  String? get role => _session?.role;
  String? get pairingId => _session?.pairingId;
  bool get isAuthenticated => _session != null;

  /// Connect transports + resolve the role-aware session from /me.
  Future<void> _activate(String token) async {
    _api.setToken(token);
    _socket.connect(token);
    _session = await _repo.me();
  }

  /// Restore a persisted session on launch (auto-login). Clears a stale token.
  Future<bool> tryAutoLogin() async {
    final token = await _storage.read();
    if (token == null || token.isEmpty) return false;
    try {
      await _activate(token);
      return true;
    } catch (_) {
      await logout();
      return false;
    }
  }

  Future<void> login(String email, String password) async {
    final r = await _repo.login(email: email.trim().toLowerCase(), password: password);
    await _persist(r.token);
  }

  Future<void> register(String email, String password, String name, {String? pin}) async {
    final r = await _repo.register(email: email.trim().toLowerCase(), password: password, name: name, pin: pin);
    await _persist(r.token);
  }

  /// Google sign-in. Returns false if the user cancelled the popup.
  Future<bool> googleSignIn() async {
    final code = await _google.getServerAuthCode();
    if (code == null) return false;
    final r = await _repo.google(code);
    await _persist(r.token);
    return true;
  }

  /// Apple sign-in — not available on Android.
  /// Returns false so callers treat it as a cancellation.
  Future<bool> appleSignIn() async => false;

  /// Child device: claim a pairing code → child session.
  Future<void> claimChild(String code) async {
    final token = await _repo.claim(code);
    await _persist(token);
  }

  Future<void> _persist(String token) async {
    await _storage.save(token);
    await _lifecycle.markFirstLogin();
    await _activate(token);
  }

  Future<void> logout() async {
    _session = null;
    _api.setToken(null);
    _socket.disconnect();
    await _storage.clear();
    try {
      await _google.signOut();
    } catch (_) {/* ignore */}
  }
}
