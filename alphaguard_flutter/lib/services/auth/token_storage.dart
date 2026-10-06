import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Secure persistence for the JWT (Keychain on iOS, EncryptedSharedPreferences
/// on Android). Used for auto-login across app restarts.
///
/// Android 16 / Pixel 9a (Titan M2) compatibility:
///   EncryptedSharedPreferences calls into Android Keystore. On Android 16 the
///   Keystore initialisation for a fresh install or reinstall can block the
///   platform channel indefinitely (key generation stalls on Titan M2 security
///   chip). Every call is wrapped in a 6 s timeout + broad exception catch so a
///   Keystore hang never freezes the splash screen. On any failure the stored
///   keys are deleted so the next launch starts clean.
class TokenStorage {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );
  static const _key = 'ag_jwt';
  static const _sessionKey = 'ag_session_cache';
  static const _kTimeout = Duration(seconds: 6);

  Future<void> save(String token) async {
    try {
      await _storage.write(key: _key, value: token).timeout(_kTimeout);
    } catch (e) {
      _log('[STORAGE] save() failed: $e');
    }
  }

  /// Returns the stored JWT or null.
  /// Never throws — on timeout or Keystore error returns null and wipes storage
  /// so the next launch treats the device as a fresh install.
  Future<String?> read() async {
    try {
      _log('[STORAGE] READ START');
      final v = await _storage.read(key: _key).timeout(_kTimeout);
      _log('[STORAGE] READ COMPLETE — ${v != null ? "JWT FOUND" : "NO JWT"}');
      return v;
    } catch (e) {
      // Covers: TimeoutException (Keystore stall on Android 16 / Titan M2),
      // PlatformException (key invalidated after reinstall), and any other
      // EncryptedSharedPreferences failure. Wipe and treat as no token.
      _log('[STORAGE] READ FAILED ($e) — wiping storage, treating as fresh install');
      _wipeAll();
      return null;
    }
  }

  Future<void> clear() async {
    try {
      await _storage.delete(key: _key).timeout(_kTimeout);
      await _storage.delete(key: _sessionKey).timeout(_kTimeout);
    } catch (e) {
      _log('[STORAGE] clear() failed: $e');
      _wipeAll();
    }
  }

  Future<void> saveOfflineSession(Map<String, dynamic> data) async {
    try {
      await _storage.write(key: _sessionKey, value: jsonEncode(data)).timeout(_kTimeout);
    } catch (e) {
      _log('[STORAGE] saveOfflineSession() failed: $e');
    }
  }

  Future<Map<String, dynamic>?> readOfflineSession() async {
    try {
      final raw = await _storage.read(key: _sessionKey).timeout(_kTimeout);
      if (raw == null) return null;
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  void _wipeAll() {
    // Fire-and-forget; if deleteAll also hangs, it won't block the caller.
    _storage.deleteAll().catchError((_) {});
  }

  void _log(String msg) {
    // ignore: avoid_print
    print(msg);
  }
}
