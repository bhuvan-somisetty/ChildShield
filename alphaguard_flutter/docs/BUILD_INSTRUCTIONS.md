# AlphaGuard Flutter — Build Instructions

**Date:** 2026-06-14

## Prerequisites

- **Flutter** (latest stable, ≥3.24) and Dart ≥3.4 — `flutter --version`
- Android: Android Studio + SDK (API 34), a device/emulator (API 23+)
- iOS: Xcode 15+, CocoaPods, a Simulator or device (macOS only)
- The AlphaGuard **backend-v2** running and reachable (local `:4000` or deployed HTTPS)

## 1. Generate native platform folders

This repo ships `lib/`, `pubspec.yaml`, and the key Android/iOS overrides. Generate the rest of the native scaffolding (Gradle wrapper, Runner project, etc.):

```bash
cd alphaguard_flutter
flutter create --platforms=android,ios --org ai.alphaguard .
```
`flutter create` is non-destructive to existing files — it fills in only what's missing, then our `AndroidManifest.xml`, `build.gradle`, and `Info.plist` overrides apply.

## 2. Install dependencies

```bash
flutter pub get
# iOS only:
cd ios && pod install && cd ..
```

## 3. Run (development)

The API base is configured via `--dart-define=AG_API=...` (default `http://10.0.2.2:4000`, which is the Android emulator's alias for the host machine's `localhost`).

```bash
# Android emulator → local backend
flutter run -d android --dart-define=AG_API=http://10.0.2.2:4000

# Physical Android device → backend on your LAN
flutter run -d <device> --dart-define=AG_API=http://192.168.1.50:4000

# iOS (needs HTTPS backend or an ATS dev exception)
flutter run -d ios --dart-define=AG_API=https://your-backend.example.com

# Desktop (fastest for responsive sweeps 320→1366)
flutter run -d windows --dart-define=AG_API=http://localhost:4000
```

Optional Google sign-in:
```bash
--dart-define=AG_GOOGLE_CLIENT_ID=<your-web/server-oauth-client-id>
```

## 4. Build release artifacts

```bash
# Android App Bundle (Play Store)
flutter build appbundle --release --dart-define=AG_API=https://your-backend.example.com

# Android APK
flutter build apk --release --dart-define=AG_API=https://your-backend.example.com

# iOS (then archive in Xcode)
flutter build ipa --release --dart-define=AG_API=https://your-backend.example.com
```

Before publishing:
- Replace the debug signing config in `android/app/build.gradle` with a release keystore.
- Set a Development Team + bundle id in Xcode (`ios/Runner.xcodeproj`).
- Remove `android:usesCleartextTraffic="true"` and use HTTPS.
- Add the Google OAuth clients (Android SHA-1, iOS URL scheme, web/server client id).
- Bump `version:` in `pubspec.yaml` and `Env.appVersion` together, and publish a matching changelog entry on the backend (`POST /admin/changelog`) so What's New shows.

## 5. Quality gates

```bash
flutter analyze     # static analysis (lints in analysis_options.yaml)
flutter test        # unit/widget tests (add under test/)
dart format .
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Network errors on Android emulator | Use `10.0.2.2` (not `localhost`) for the host backend |
| iOS "cleartext not permitted" | Use HTTPS, or add a temporary ATS exception for dev |
| First request very slow | Render free tier cold start (~90s) — the UI fails soft and retries |
| `flutter_secure_storage` build error | Ensure `minSdk >= 23` in `android/app/build.gradle` |
| Google sign-in returns null code | Configure the OAuth clients + `serverClientId` |
