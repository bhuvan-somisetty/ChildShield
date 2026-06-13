# AlphaGuard Child Agent — Android Enforcement Layer

Real parental-control enforcement **cannot run in a browser** — it requires a
native Android app with system permissions. This module is that app. It hosts the
existing web child app in a WebView and adds the OS-level enforcement the web
layer cannot do.

## Architecture

```
 Parent (web) ──► Backend (Socket.IO) ──► Web child app (WebView)
                                              │  window.AlphaGuard.onNativeEvent ▲
                                              ▼  window.AlphaGuardNative.setPolicy │
                                          EnforcementManager (policy + event bus)
        ┌───────────────┬───────────────┬───────────────┬───────────────┐
   Accessibility    Device Admin    Package Rcvr     VPN/Mock        Location
   (app-lock +      (uninstall +    (install/        detectors       fg service
    screen-time)    tamper)          uninstall)
```

Native components report events to `EnforcementManager`, which forwards them to
the web app over the WebView bridge; the web app emits them on its existing
Socket.IO connection. Policy (locked apps, screen limit, protection flags) flows
the other way: parent → backend → web → `AlphaGuardNative.setPolicy(...)`.

## Components → spec items

| File | Item |
|------|------|
| `AlphaGuardAccessibilityService.kt` + `accessibility_service_config.xml` | (1) Accessibility, (5) Screen-time, (6) App-lock |
| `AlphaGuardDeviceAdmin.kt` + `device_admin.xml` | (2) Device Admin, (10) Uninstall/tamper protection |
| `PackageEventReceiver.kt` | (3) Install detection, (4) Uninstall detection |
| `ScreenTimeEnforcer.kt` (UsageStatsManager) | (5) Screen-time enforcement |
| `AppLockActivity.kt` | (6) Child lock screen + parent-PIN/approval unlock |
| `VpnDetector.kt` (NetworkCapabilities) | (7) VPN/proxy/DNS detection |
| `LocationService.kt` (`isMock`/jump) | (8) Mock-location, (9) Background location |

## Required runtime grants (user must approve)

- **Accessibility** (Settings → Accessibility → AlphaGuard) — foreground-app
  detection for app-lock + screen-time.
- **Device Admin** (`DeviceAdminUtil.enableIntent`) — uninstall protection.
- **Usage Access** (`PACKAGE_USAGE_STATS`) — screen-time totals.
- **Location** incl. **background** + **display-over-other-apps** (`SYSTEM_ALERT_WINDOW`).

## Honest classification

**A. Fully working (with grants):** install/uninstall detection, foreground-app
app-locking, screen-time lock, VPN detection, mock-location detection, background
location, the tamper-on-disable signal.

**B. Requires Android permissions:** everything above needs the user to grant
Accessibility / Device Admin / Usage Access / background location at setup. None
work silently.

**C. Requires OEM restrictions:** truly *blocking* uninstall (vs. detecting +
PIN-gating) needs **Device Owner / managed-device (Android Enterprise)** — a
plain Device Admin can be removed by deactivating it. Battery-optimisation
allow-listing and reliable background execution vary by OEM (MIUI/Samsung kill
background services aggressively). Force-stop cannot be hard-blocked without
Device Owner.

**D. Play Store review considerations:** Accessibility for control, Device Admin,
`QUERY_ALL_PACKAGES`, and background location are all **policy-sensitive**. Google
requires a prominent-disclosure + a Permissions Declaration, and parental-control
apps must follow the Families policy. Distribution is typically via **Android
Enterprise / managed Google Play** for full enforcement; consumer Play Store
builds get detection + soft-enforcement.

## Build

Standard Android Gradle project (Kotlin, minSdk 26, Play Services Location).
`BuildConfig.WEB_APP_URL` points at the deployed web app. Not buildable in this
repo (no Android SDK here) — it is the production enforcement module the web/
backend layers are wired to.
