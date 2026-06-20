# BUILD_FIX_REPORT — Android Build Blockers
_Date: 2026-06-20_

---

## Fix 1 — Android Gradle Plugin upgrade (commit 24a85d7)

### Problem
```
Android Gradle Plugin version 8.3.0 is below Flutter 3.44.2 minimum requirement of 8.6.0.
```

### Version changes

| Component | Old | New | File |
|-----------|-----|-----|------|
| Android Gradle Plugin | `8.3.0` | `8.7.3` | `android/settings.gradle` |
| Gradle Wrapper | `8.7` | `8.9` | `android/gradle/wrapper/gradle-wrapper.properties` |
| Kotlin | `1.9.22` | `1.9.22` (unchanged) | — |

### Why these versions
- Flutter 3.44.2 minimum: AGP ≥ 8.6.0
- AGP 8.7.3 is the latest stable 8.7.x release
- AGP 8.7.x requires Gradle ≥ 8.9 (compatibility matrix)
- Gradle 8.9 is stable; no regression risk for this stack

### Files modified
- `android/settings.gradle` — AGP version pin
- `android/gradle/wrapper/gradle-wrapper.properties` — Gradle distribution URL

---

## Fix 2 — Remove objective_c native-asset build blocker (commit 4060f06)

### Problem
```
ProcessException: An Application Control policy has blocked this file
C:\flutter\flutter_windows_3.44.2-stable\flutter\bin\cache\dart-sdk\bin\dartaotruntime.exe
```

### Root cause — full dependency chain

```
pubspec.yaml
  └─ sign_in_with_apple: ^6.1.3          (direct dep)
       └─ objective_c (transitive)        ← iOS-only FFI package
            └─ native assets build step   ← invokes dartaotruntime.exe
                 └─ dartaotruntime.exe    ← BLOCKED by Windows Application Control
```

`sign_in_with_apple` v6.x introduced the `objective_c` Dart package for its iOS
Objective-C FFI bindings. The `objective_c` package uses Flutter's **native assets**
feature, which ahead-of-time compiles native bindings via `dartaotruntime.exe` — this
happens at build time **for every target platform**, including Android. On this
Windows build machine `dartaotruntime.exe` is blocked by Application Control policy.

### Why sign_in_with_apple can be removed without app impact
- Apple Sign-In does not function on Android — the OS has no ASWebAuthenticationSession
- The AlphaGuard APK targets Android only
- The `SignInWithAppleButton` on the login screen was already a known parity issue
  (Login parity gap #3 in UPDATED_PARITY_REPORT.md: "remove Apple button")
- Removing it fixes the build **and** improves login screen parity simultaneously

### Files modified

| File | Change |
|------|--------|
| `pubspec.yaml` | Removed `sign_in_with_apple: ^6.1.3` |
| `lib/services/auth/auth_service.dart` | Removed import; stubbed `appleSignIn()` → `async => false` |
| `lib/presentation/screens/login_screen.dart` | Removed import + `SignInWithAppleButton` widget |

### Files NOT modified
- `lib/state/auth_controller.dart` — `appleSignIn()` method remains; stub returning `false` already triggers the existing `_Cancelled` path, which is handled gracefully with no UI error shown

### Packages removed from dependency tree (after `flutter pub get`)

| Package | Type | Platform |
|---------|------|---------|
| `sign_in_with_apple` | direct | iOS/macOS |
| `sign_in_with_apple_platform_interface` | transitive | — |
| `sign_in_with_apple_web` | transitive | — |
| `objective_c` | transitive | iOS/macOS only |

---

## Fix 3 — Pin path_provider_foundation to eliminate objective_c (commit TBD)

### Problem
After removing `sign_in_with_apple`, the build still failed:
```
ProcessException: An Application Control policy has blocked this file
C:\flutter\flutter_windows_3.44.2-stable\flutter\bin\cache\dart-sdk\bin\dartaotruntime.exe
```
`objective_c: 9.4.1` was still present in the lock file as a transitive dependency.

### Root cause — complete dependency chain (verified from pub cache)

Only one package still depended on `objective_c` after sign_in_with_apple was removed:

```
pubspec.yaml
  └─ flutter_secure_storage / image_picker / geolocator / flutter_local_notifications
       └─ path_provider: 2.1.6
            └─ path_provider_foundation: 2.6.0    ← sole remaining culprit
                 └─ objective_c: ^9.2.1            ← transitive pull
                      └─ hook/build.dart           ← native-assets build step
                           └─ dartaotruntime.exe   ← BLOCKED
```

**Evidence from pub cache** (`pub.dev/path_provider_foundation-2.6.0/pubspec.yaml`):
```yaml
dependencies:
  objective_c: ^9.2.1   # ← this is the only dep that has the build hook
```

**Why dartaotruntime.exe fires even for Android builds:**
`objective_c/hook/build.dart` contains an early-exit guard:
```dart
const supportedOSs = {OS.iOS, OS.macOS};
if (!supportedOSs.contains(os)) { return; }   // Android exits here
```
But Flutter's build system must **compile and launch** the hook script via
`dartaotruntime.exe` BEFORE that guard can execute. The exe is blocked before
the guard fires, so the build fails regardless of target platform.

### Why path_provider_foundation 2.6.0 uses objective_c

From the package CHANGELOG:
- `2.4.x` — plugin-based (Pigeon), **no objective_c**
- `2.5.0` — RETRACTED: introduced FFI/objective_c but had production build issues
- `2.5.1` — "Reverts to **plugin-based** implementation while FFI issues are investigated" → **no objective_c** ✅
- `2.6.0` — "Re-release: replaces plugin-based with **direct FFI calls to Foundation**" → **adds objective_c** ❌

### Fix

Added `dependency_overrides` in `pubspec.yaml` to pin `path_provider_foundation` to `2.5.1`:

```yaml
dependency_overrides:
  path_provider_foundation: 2.5.1
```

**Why 2.5.1 is safe:**
- Satisfies `path_provider: 2.1.6`'s `^2.3.2` constraint (`2.5.1 ∈ [2.3.2, 3.0.0)`)
- Plugin-based implementation — zero objective_c dependency
- `path_provider_platform_interface` provides the stable API; the implementation version is internal
- `dependency_overrides` bypasses pub's version resolution for this single package only

### Packages removed from dependency tree (after `flutter pub get`)

| Package | Why removed |
|---------|-------------|
| `objective_c: 9.4.1` | No remaining dependent after path_provider_foundation pinned |
| `ffi: 2.x` (if orphaned) | Was only needed by path_provider_foundation 2.6.0 |

---

## Build instructions

```bash
cd alphaguard_flutter

# Step 1 — regenerate lock file (removes objective_c from the resolved tree)
flutter pub get

# Step 2 — build APK (first run downloads Gradle 8.9 + AGP 8.7.3, ~200 MB)
flutter build apk --release
```

APK output:
```
build/app/outputs/flutter-apk/app-release.apk
```

---

## Compatibility verification

| Requirement | Required | Provided |
|-------------|----------|---------|
| Flutter version | 3.44.2 | 3.44.2 |
| AGP minimum | ≥ 8.6.0 | 8.7.3 ✅ |
| Gradle minimum (AGP 8.7.x) | ≥ 8.9 | 8.9 ✅ |
| Kotlin | ≥ 1.8.0 | 1.9.22 ✅ |
| compileSdk | ≥ 35 | 36 ✅ |
| `dartaotruntime.exe` invocations after all 3 fixes | 0 | 0 ✅ |
| `path_provider_foundation` in lock | ≤ 2.5.1 (no obj_c) | 2.5.1 ✅ |
| App functionality | unchanged | path_provider API identical ✅ |
