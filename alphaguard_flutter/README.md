# AlphaGuard AI — Flutter Client (Foundation)

Production-grade Flutter foundation for AlphaGuard, consuming the **existing** AlphaGuard V2 backend (REST + Socket.IO) **without any backend or schema changes**. This is the migration foundation — not a full screen migration.

## What's implemented

- **Clean architecture** (api · data · services · socket · state · presentation) with Provider DI.
- **Authentication**: email login/signup, **Google** sign-in (server-verified code flow), **JWT persistence** (secure storage), **auto-login**, **logout**.
- **App lifecycle**: branded **splash**, **first-launch detection**, **onboarding-once**, **update system** (optional + mandatory) and **What's New** — all driven by the existing backend version API.
- **Realtime**: Socket.IO client with JWT handshake; live `task:upserted` proven on the dashboard; full event contract mapped (chat, tasks, rewards, notifications, support).
- **Responsive by construction**: adaptive breakpoints (320→1366), fluid `clamp()` sizing, safe-area + foldable/multi-window support — **no fixed dimensions**.

## Project structure

```
alphaguard_flutter/
├─ pubspec.yaml                 # deps: dio, socket_io_client, go_router, provider,
│                               #       flutter_secure_storage, shared_preferences, google_sign_in
├─ analysis_options.yaml
├─ lib/
│  ├─ main.dart                 # composition root (DI via Provider)
│  ├─ app.dart                  # MaterialApp.router + theme + text-scale clamp
│  ├─ app_router.dart           # go_router + auth/lifecycle redirect
│  ├─ core/
│  │  ├─ config/env.dart        # API base, app version (dart-define overridable)
│  │  ├─ theme/                 # app_colors, app_theme (AlphaGuard dark)
│  │  ├─ responsive/            # breakpoints, responsive helpers + ResponsiveShell
│  │  └─ utils/result.dart
│  ├─ data/
│  │  ├─ api/                   # api_client (Dio+JWT), api_exception
│  │  ├─ models/                # parent, child, task, message, version_info
│  │  └─ repositories/          # auth, family, task
│  ├─ services/
│  │  ├─ auth/                  # token_storage, google_auth, auth_service
│  │  ├─ socket/                # socket_service, socket_events
│  │  └─ lifecycle/             # lifecycle_service, update_service
│  ├─ state/auth_controller.dart
│  └─ presentation/
│     ├─ screens/               # splash, onboarding, login, signup, home, update_gate
│     └─ widgets/               # app_logo, primary_button, app_text_field
├─ android/                     # AndroidManifest, build.gradle (key overrides)
├─ ios/                         # Info.plist (universal iPhone/iPad + purpose strings)
└─ docs/                        # architecture + verification + build + migration reports
```

## Quick start

```bash
# 1) Generate the native platform folders (this repo ships the lib/ + overrides):
flutter create --platforms=android,ios --org ai.alphaguard .

# 2) Install dependencies
flutter pub get

# 3) Run against your backend (default points at the Android-emulator host):
flutter run --dart-define=AG_API=http://10.0.2.2:4000
#   physical device / prod:
flutter run --dart-define=AG_API=https://your-backend.onrender.com
```

See `docs/BUILD_INSTRUCTIONS.md` for full build/release steps and `docs/ARCHITECTURE_REPORT.md` for the app architecture.
