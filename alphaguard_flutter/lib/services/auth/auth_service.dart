import '../../data/api/api_client.dart';
import '../../data/api/api_exception.dart';
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
  /// GET /me is capped at 20 s; with the retry interceptor removed from this
  /// path the worst-case is one 20 s attempt, not 390 s.
  Future<void> _activate(String token) async {
    _api.setToken(token);
    _socket.connect(token);
    debugLog('[AUTH] GET /ME START');
    _session = await _repo.me().timeout(
      const Duration(seconds: 20),
      onTimeout: () => throw Exception('GET /me timed out after 20 s'),
    );
    debugLog('[AUTH] GET /ME SUCCESS — role=${_session?.role}');
    await _cacheSession();
    debugLog('[AUTH] JWT LOADED — role=${_session?.role}');
  }

  Future<void> _cacheSession() async {
    final s = _session;
    if (s == null) return;
    final data = <String, dynamic>{'role': s.role};
    if (s.isChild) {
      data['childId'] = s.child?.id;
      data['childName'] = s.child?.name;
      data['pairingId'] = s.pairingId;
      data['emoji'] = s.child?.emoji ?? '🧒';
      data['color'] = s.child?.color ?? '#10b981';
    } else {
      data['parentId'] = s.parent?.id;
      data['parentName'] = s.parent?.name;
    }
    await _storage.saveOfflineSession(data);
  }

  /// Restore a persisted session on launch (auto-login).
  /// 401 → clear token (revoked). Network errors → restore from offline cache
  /// so a child with a valid JWT is never forced to re-pair.
  Future<bool> tryAutoLogin() async {
    debugLog('[AUTH] SESSION RESTORE START');
    final token = await _storage.read(); // timeout + exception-safe in TokenStorage
    if (token == null || token.isEmpty) {
      debugLog('[AUTH] NO JWT — unauthenticated');
      return false;
    }
    debugLog('[AUTH] JWT FOUND — attempting /me');
    try {
      await _activate(token);
      debugLog('[AUTH] SESSION RESTORED from /me');
      return true;
    } on ApiException catch (e) {
      if (e.isUnauthorized) {
        await logout();
        debugLog('[AUTH] JWT REVOKED (401) — cleared session');
      } else {
        debugLog('[AUTH] API ERROR during /me: ${e.message}');
      }
      return false;
    } catch (e) {
      debugLog('[AUTH] /me FAILED: $e — trying offline cache');
      // Network unavailable — try offline session cache so child isn't forced to re-pair.
      final cached = await _storage.readOfflineSession();
      if (cached != null) {
        _api.setToken(token);
        _session = _sessionFromCache(cached);
        _socket.connect(token); // attempt connection; will retry when network recovers
        debugLog('[AUTH] SESSION RESTORED from offline cache (role=${_session?.role})');
        return true;
      }
      debugLog('[AUTH] Network error + no offline cache — unauthenticated');
      return false;
    }
  }

  Session? _sessionFromCache(Map<String, dynamic> data) {
    final role = data['role'] as String? ?? 'child';
    if (role == 'child') {
      final childId = data['childId'] as String?;
      if (childId == null) return null;
      return Session(
        role: 'child',
        pairingId: data['pairingId'] as String?,
        child: Child(
          id: childId,
          name: (data['childName'] as String?) ?? 'Me',
          emoji: (data['emoji'] as String?) ?? '🧒',
          color: (data['color'] as String?) ?? '#10b981',
        ),
      );
    }
    final parentId = data['parentId'] as String?;
    if (parentId == null) return null;
    return Session(
      role: 'parent',
      parent: Parent(
        id: parentId,
        name: (data['parentName'] as String?) ?? 'Parent',
        email: '',
      ),
    );
  }

  void debugLog(String msg) {
    // ignore: avoid_print
    print(msg);
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
  /// If name/gender are provided (from ChildSetupScreen), they are written to
  /// the child's backend profile immediately after pairing completes.
  Future<void> claimChild(String code, {String? name, String? gender}) async {
    final token = await _repo.claim(code);
    await _persist(token);
    debugLog('[PAIR] PAIR CLAIMED — token saved, pair state restored');
    final childId = _session?.child?.id;
    if (childId != null && (name?.isNotEmpty == true || gender?.isNotEmpty == true)) {
      try {
        final body = <String, dynamic>{};
        if (name != null && name.isNotEmpty) body['name'] = name;
        if (gender != null && gender.isNotEmpty) body['gender'] = gender;
        await _api.patch('/children/$childId', body: body);
        _session = await _repo.me();
        await _cacheSession(); // refresh offline cache with updated name
      } catch (_) {
        // PATCH/me failed — apply name locally so dashboard never shows placeholder
        if (name != null && name.isNotEmpty) {
          final c = _session?.child;
          if (c != null) {
            _session = Session(
              role: _session!.role,
              pairingId: _session!.pairingId,
              child: c.copyWithName(name),
            );
            await _cacheSession();
          }
        }
      }
    }
    await _lifecycle.markChildPaired();
    debugLog('[PAIR] PAIR STATE RESTORED — child is paired');
  }

  Future<void> _persist(String token) async {
    await _storage.save(token);
    debugLog('[AUTH] JWT SAVED');
    await _lifecycle.markFirstLogin();
    await _activate(token);
  }

  Future<void> logout() async {
    _session = null;
    _api.setToken(null);
    _socket.disconnect();
    await _storage.clear(); // clears JWT + offline session cache
    await _lifecycle.clearChildPaired();
    try {
      await _google.signOut();
    } catch (_) {/* ignore */}
    debugLog('[AUTH] LOGOUT — session and offline cache cleared');
  }
}
