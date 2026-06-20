import 'package:shared_preferences/shared_preferences.dart';

import '../../core/config/env.dart';

/// Local app-lifecycle flags (first install, onboarding, first login, last
/// bundle version, seen What's-New). Mirrors the web client's lifecycle so the
/// behaviour is identical across platforms. The backend owns only the *version*.
class LifecycleService {
  LifecycleService(this._prefs);
  final SharedPreferences _prefs;

  static const _kInstalled       = 'ag_installed_at';
  static const _kOnboarded       = 'ag_onboarded';
  static const _kOnboardingBuild = 'ag_onboarding_build'; // stamp written by markOnboarded()
  static const _kFirstLogin      = 'ag_first_login_at';
  static const _kAppVersion      = 'ag_app_version';
  static const _kSeenWhatsNew    = 'ag_seen_whatsnew';
  static const _kUpdateDismissed = 'ag_update_dismissed';

  /// Bump this string whenever onboarding MUST be re-shown to existing users
  /// (new T&C acceptance, major flow change, etc.).  Any device whose stored
  /// _kOnboardingBuild differs from this value is treated as not-yet-onboarded.
  static const String _onboardingBuild = '2.1';

  static Future<LifecycleService> create() async =>
      LifecycleService(await SharedPreferences.getInstance());

  // ── Install ──────────────────────────────────────────────────────────────

  /// Called once at every cold start.
  ///
  /// TRUE FRESH INSTALL: _kInstalled is absent → SharedPreferences just came
  /// back empty (or user uninstalled+reinstalled). We clear both onboarding
  /// flags so the full Welcome→Onboarding→Role flow always runs on a brand-new
  /// device. Then we record the install timestamp.
  ///
  /// UPDATE / REINSTALL-OVER-OLD-APK: _kInstalled already exists → we leave
  /// the flags untouched. isOnboarded() will still return false for any session
  /// that was completed before _onboardingBuild '2.1' was introduced (because
  /// _kOnboardingBuild will be absent or mismatched).
  Future<void> markInstalled() async {
    if (!_prefs.containsKey(_kInstalled)) {
      await _prefs.remove(_kOnboarded);
      await _prefs.remove(_kOnboardingBuild);
      await _prefs.remove(_kFirstLogin);
      await _prefs.setInt(_kInstalled, DateTime.now().millisecondsSinceEpoch);
    }
  }

  // ── Onboarding ────────────────────────────────────────────────────────────

  /// True only when the user has explicitly completed onboarding on this build.
  ///
  /// Two conditions must both be true:
  ///   1. _kOnboarded == true          (user pressed "Get Started" at the end)
  ///   2. _kOnboardingBuild == '2.1'   (was written by THIS version of markOnboarded)
  ///
  /// Scenario coverage:
  ///   • Fresh install (no prior data)       → false  [_kInstalled absent, cleared in markInstalled]
  ///   • Old APK replaced without uninstall  → false  [_kOnboardingBuild absent]
  ///   • Debug build replaced by release APK → false  [_kOnboardingBuild absent]
  ///   • User completed onboarding this build → true  [both keys match]
  ///   • Returning user after logout          → true  [both keys survive logout]
  bool get isOnboarded {
    final completed = _prefs.getBool(_kOnboarded) ?? false;
    if (!completed) return false;
    return (_prefs.getString(_kOnboardingBuild) ?? '') == _onboardingBuild;
  }

  /// Written when the user reaches the end of the onboarding carousel and
  /// taps "Get Started". Also stamps the build version so isOnboarded works.
  Future<void> markOnboarded() async {
    await _prefs.setBool(_kOnboarded, true);
    await _prefs.setString(_kOnboardingBuild, _onboardingBuild);
  }

  /// Dev/QA helper — clears the onboarding flag so the full flow runs again.
  Future<void> resetOnboarding() async {
    await _prefs.remove(_kOnboarded);
    await _prefs.remove(_kOnboardingBuild);
  }

  // ── First login ──────────────────────────────────────────────────────────

  Future<void> markFirstLogin() async {
    if (!_prefs.containsKey(_kFirstLogin)) {
      await _prefs.setInt(_kFirstLogin, DateTime.now().millisecondsSinceEpoch);
    }
  }

  // ── Version / What's New ─────────────────────────────────────────────────

  /// Returns the previous bundle version when this launch is the first on a new
  /// build (user just updated). Records the current version. First-ever run
  /// returns null (no What's New for a brand-new user). Mirrors web behaviour.
  String? consumeVersionChange() {
    final last = _prefs.getString(_kAppVersion);
    if (last != Env.appVersion) _prefs.setString(_kAppVersion, Env.appVersion);
    if (last == null) return null;
    return last != Env.appVersion ? last : null;
  }

  bool whatsNewSeen(String v) => _prefs.getString(_kSeenWhatsNew) == v;
  Future<void> markWhatsNewSeen(String v) => _prefs.setString(_kSeenWhatsNew, v);

  bool updateDismissed(String v) => _prefs.getString(_kUpdateDismissed) == v;
  Future<void> dismissUpdate(String v) => _prefs.setString(_kUpdateDismissed, v);

  // ── Semver compare ───────────────────────────────────────────────────────

  static int compareVersions(String a, String b) {
    final pa = a.split('.').map((e) => int.tryParse(e) ?? 0).toList();
    final pb = b.split('.').map((e) => int.tryParse(e) ?? 0).toList();
    final n = pa.length > pb.length ? pa.length : pb.length;
    for (var i = 0; i < n; i++) {
      final d = (i < pa.length ? pa[i] : 0) - (i < pb.length ? pb[i] : 0);
      if (d != 0) return d > 0 ? 1 : -1;
    }
    return 0;
  }
}
