import 'package:flutter/foundation.dart';

import '../data/api/api_exception.dart';
import '../data/models/child.dart';
import '../data/models/parent.dart';
import '../services/auth/auth_service.dart';
import '../services/lifecycle/lifecycle_service.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

/// UI-facing auth state. Wraps [AuthService] as a [ChangeNotifier] so widgets +
/// the router react to sign-in/out. Role-aware: exposes parent OR child.
class AuthController extends ChangeNotifier {
  AuthController(this._auth, this._lifecycle);

  final AuthService _auth;
  final LifecycleService _lifecycle;

  AuthStatus _status = AuthStatus.unknown;
  AuthStatus get status => _status;
  Parent? get parent => _auth.parent;
  Child? get child => _auth.child;
  String? get role => _auth.role;
  String? get pairingId => _auth.pairingId;
  bool get isChild => _auth.role == 'child';
  bool get isParent => _auth.role == 'parent';
  bool get isOnboarded => _lifecycle.isOnboarded;
  bool get hasEverAuthenticated => _lifecycle.hasEverAuthenticated;
  bool get hasParentSetupDone => _lifecycle.hasParentSetupDone;
  bool get hasParentPaired => _lifecycle.hasParentPaired;

  bool _busy = false;
  bool get busy => _busy;
  String? _error;
  String? get error => _error;
  bool _postLogout = false;
  bool get postLogout => _postLogout;

  /// Called once at app start: record install + attempt auto-login.
  /// Waits for at least 2 s so the splash is always visible.
  ///
  /// tryAutoLogin() is hard-capped at 10 s so a Keystore hang
  /// (Android 16 / Pixel 9a Titan M2 EncryptedSharedPreferences stall)
  /// or a network hang never leaves the splash screen indefinitely.
  Future<void> bootstrap() async {
    _log('[BOOTSTRAP] APP START');
    await _lifecycle.markInstalled();
    _log('[BOOTSTRAP] FIREBASE INIT COMPLETE / STORAGE READ START');
    bool ok = false;
    await Future.wait<void>([
      _auth
          .tryAutoLogin()
          .then((v) {
            ok = v;
          })
          .timeout(
            const Duration(seconds: 10),
            onTimeout: () {
              _log('[BOOTSTRAP] SESSION RESTORE TIMEOUT (10 s) — forcing unauthenticated');
              ok = false;
            },
          )
          .catchError((e) {
            _log('[BOOTSTRAP] SESSION RESTORE ERROR: $e — forcing unauthenticated');
            ok = false;
          }),
      Future<void>.delayed(const Duration(seconds: 2)),
    ]);
    _log('[BOOTSTRAP] SPLASH NAVIGATION START — status=${ok ? "authenticated" : "unauthenticated"}');
    _set(ok ? AuthStatus.authenticated : AuthStatus.unauthenticated);
    _log('[BOOTSTRAP] NAVIGATION COMPLETE');
  }

  void _log(String msg) {
    // ignore: avoid_print
    print(msg);
  }

  Future<bool> login(String email, String password) => _run(() => _auth.login(email, password));
  Future<bool> register(String email, String password, String name, {String? pin}) =>
      _run(() => _auth.register(email, password, name, pin: pin));
  Future<bool> claimChild(String code, {String? name, String? gender}) =>
      _run(() => _auth.claimChild(code, name: name, gender: gender));

  Future<bool> googleSignIn() => _run(() async {
        final ok = await _auth.googleSignIn();
        if (!ok) throw const _Cancelled();
      });

  Future<bool> appleSignIn() => _run(() async {
        final ok = await _auth.appleSignIn();
        if (!ok) throw const _Cancelled();
      });

  Future<void> logout() async {
    _postLogout = true;
    await _auth.logout();
    _set(AuthStatus.unauthenticated);
  }

  Future<void> completeOnboarding() async {
    await _lifecycle.markOnboarded();
    notifyListeners();
  }

  Future<void> markParentSetupDone() async {
    await _lifecycle.markParentSetupDone();
    notifyListeners();
  }

  Future<void> markParentPaired() async {
    await _lifecycle.markParentPaired();
    notifyListeners();
  }

  // ── internals ──
  Future<bool> _run(Future<void> Function() action) async {
    _busy = true;
    _error = null;
    notifyListeners();
    try {
      await action();
      _set(AuthStatus.authenticated);
      return true;
    } on _Cancelled {
      _busy = false;
      notifyListeners();
      return false; // user cancelled — no error shown
    } on ApiException catch (e) {
      _error = e.message;
      _busy = false;
      notifyListeners();
      return false;
    } catch (_) {
      _error = 'Something went wrong. Please try again.';
      _busy = false;
      notifyListeners();
      return false;
    }
  }

  void _set(AuthStatus s) {
    _status = s;
    _busy = false;
    notifyListeners();
  }
}

class _Cancelled implements Exception {
  const _Cancelled();
}
