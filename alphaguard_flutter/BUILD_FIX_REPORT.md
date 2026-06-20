# BUILD_FIX_REPORT — Android Gradle Upgrade
_Date: 2026-06-20_

---

## Problem

```
Android Gradle Plugin version 8.3.0 is below Flutter 3.44.2 minimum requirement of 8.6.0.
```

Flutter 3.44.2 raised its minimum AGP requirement to **8.6.0**. The project was pinned to AGP 8.3.0.

---

## Version Changes

| Component | Old | New | File |
|-----------|-----|-----|------|
| Android Gradle Plugin (AGP) | `8.3.0` | `8.7.3` | `android/settings.gradle` line 24 |
| Gradle Wrapper | `8.7` | `8.9` | `android/gradle/wrapper/gradle-wrapper.properties` line 5 |
| Kotlin | `1.9.22` | `1.9.22` (unchanged) | `android/settings.gradle` line 25 |
| `compileSdk` | `36` | `36` (unchanged) | `android/app/build.gradle` |
| `targetSdk` | `36` | `36` (unchanged) | `android/app/build.gradle` |

---

## Files Modified

### `android/settings.gradle`
```diff
- id "com.android.application" version "8.3.0" apply false
+ id "com.android.application" version "8.7.3" apply false
```

### `android/gradle/wrapper/gradle-wrapper.properties`
```diff
- distributionUrl=https\://services.gradle.org/distributions/gradle-8.7-all.zip
+ distributionUrl=https\://services.gradle.org/distributions/gradle-8.9-all.zip
```

### Files NOT modified
- `android/build.gradle` — no AGP reference, no change needed
- `android/app/build.gradle` — applies AGP by plugin ID (no version pin), no change needed
- Any Dart/Flutter source files — purely a build toolchain fix

---

## Compatibility Verification

### AGP ↔ Gradle compatibility matrix
| AGP version | Minimum Gradle | Used here |
|-------------|----------------|-----------|
| 8.3.0 | 8.4 | old (failed) |
| 8.6.x | 8.7 | meets Flutter 3.44.2 minimum |
| **8.7.3** | **8.9** | **✅ selected** |

AGP 8.7.3 requires Gradle ≥ 8.9. Gradle 8.9 is used. ✅

### Flutter 3.44.2 requirements met
| Requirement | Required | Provided |
|-------------|----------|---------|
| AGP minimum | ≥ 8.6.0 | 8.7.3 ✅ |
| Gradle minimum (for AGP 8.7.x) | ≥ 8.9 | 8.9 ✅ |
| Kotlin | ≥ 1.8.0 | 1.9.22 ✅ |
| compileSdk | ≥ 35 | 36 ✅ |
| Java | 17 | 17 ✅ |

### Why 8.7.3 instead of minimum 8.6.1
- AGP 8.6.1 would also work, but requires Gradle 8.7 (same as before — no wrapper change).
- AGP 8.7.3 is the latest stable 8.7.x release and matches what `flutter create` generates for Flutter 3.44.2.
- Gradle 8.9 is a stable release with no known regressions for this stack.
- No app functionality, namespaces, minSdk, or proguard rules were changed.

---

## Build Command

```bash
cd alphaguard_flutter
flutter build apk --release
```

Expected output location:
```
build/app/outputs/flutter-apk/app-release.apk
```

---

## No Functional Changes

This commit only modifies Android build toolchain version pins. All Dart code, Flutter plugin versions, app logic, screens, routes, and assets are unchanged.
