# Phase 4 Implementation Plan

_Date: 2026-06-20_

---

## Scope

1. **Logo parity** — Extract lucide Shield/ShieldCheck SVG paths; use as Flutter asset everywhere
2. **ParentSetup** — 5-step wizard (`/setup` equivalent)
3. **ConnectChild** — Parent pairing code display + QR (`/connect` equivalent)
4. **ChildSetup** — Child profile form (`/child-setup` equivalent)
5. **ChildConnected** — Pairing success screen (`/child/connected` equivalent)

---

## Logo Implementation

### Step 1 — Create SVG assets
```
alphaguard_flutter/assets/icons/
  shield.svg           ← lucide Shield (exact path from v1.17.0)
  shield_check.svg     ← lucide ShieldCheck (shield path + checkmark)
```

### Step 2 — Add flutter_svg to pubspec.yaml
```yaml
flutter_svg: ^2.0.10
```

### Step 3 — Uncomment assets section in pubspec.yaml
```yaml
flutter:
  uses-material-design: true
  assets:
    - assets/icons/
```

### Step 4 — Update AppLogo widget
Replace `Icon(Icons.verified_user_outlined)` with:
```dart
SvgPicture.asset(
  'assets/icons/shield.svg',
  width: size * 0.50,
  height: size * 0.50,
  colorFilter: const ColorFilter.mode(AppColors.cyan, BlendMode.srcIn),
)
```

### Step 5 — Update WelcomeScreen hero
Replace shield in welcome with `shield_check.svg` at larger size (strokeWidth via asset).

### Step 6 — Update OnboardingScreen illustrations
AiArt center icon → `shield_check.svg`
PrivacyArt center icon → `shield_check.svg`

### Step 7 — Android adaptive icon
Create vector drawable using the same path:
```
android/app/src/main/res/drawable/ic_launcher_foreground.xml
android/app/src/main/res/drawable/ic_launcher_background.xml
android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml
android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml
```

---

## Phase 4 Screen Implementation

### Screen 1: ParentSetup (5-step wizard)

**Route:** `/setup` (new) — accessible after login, before `/connect`  
**Source:** frontend-v2 `src/screens/parent/ParentSetup.jsx`

**Steps:**
1. **Welcome** — "Let's set up your family" intro, what's needed list
2. **Location** — permission request card, "Enable"/"Skip" options
3. **Contacts** — add emergency contacts form (name, phone, relationship)
4. **Notifications** — permission request card
5. **Finish** — summary + "Go to Dashboard" / "Connect a Child"

**Router change:** After parent login → `/setup` (not directly to `/home`)
**Completion:** Mark setup done in LifecycleService, navigate to `/connect`

**Flutter file:** `lib/presentation/screens/parent_setup_screen.dart`

---

### Screen 2: ConnectChild (QR + code display)

**Route:** `/connect` (new) — shown after ParentSetup finishes  
**Source:** frontend-v2 `src/screens/parent/ConnectChild.jsx`

**Content:**
- Heading: "Connect Your Child's Device"
- The parent's 6-digit pairing code (fetched from backend)
- Visual code display (large digits, spaced)
- QR code rendered via code (or simple box with digits for MVP)
- "Skip for now" → `/home` (dashboard)
- Auto-navigates to `/home` once child connects (via socket event)

**Backend:** `GET /family/pairing-code` or existing pairing endpoint  
**Socket:** listens for `child:paired` event → navigate to `/home`

**Flutter file:** `lib/presentation/screens/connect_child_screen.dart`

---

### Screen 3: ChildSetup (profile form)

**Route:** `/child-setup` (new) — on child device, before pairing  
**Source:** frontend-v2 `src/screens/ChildSetup.jsx` (public/ChildSetup.jsx)

**Fields:**
- Child's name (text input)
- Age (number or picker)
- Grade (text/picker)
- School name (text, optional)
- Emoji (emoji picker — 8 options: 🦁🐯🦊🐺🦅🐉🦋🌟)
- Color accent (color swatch row — 6 options: cyan, blue, violet, emerald, rose, amber)

**Completion:** Stores locally (SharedPreferences), navigates to `/pair`

**Flutter file:** `lib/presentation/screens/child_setup_screen.dart`

---

### Screen 4: ChildConnected (success)

**Route:** `/child-connected` (new) — shown on child device after pairing completes  
**Source:** frontend-v2 `src/screens/child/ChildConnected.jsx`

**Content:**
- Shield checkmark animation (success illustration)
- "You're connected!" headline
- Child name + parent greeting
- "Start AlphaGuard" button → `/home` (ChildShell)

**Flutter file:** `lib/presentation/screens/child/child_connected_screen.dart`

---

## Router Changes

```dart
// New routes:
GoRoute(path: '/setup', builder: (_, __) => const ParentSetupScreen()),
GoRoute(path: '/connect', builder: (_, __) => const ConnectChildScreen()),
GoRoute(path: '/child-setup', builder: (_, __) => const ChildSetupScreen()),
GoRoute(path: '/child-connected', builder: (_, __) => const ChildConnectedScreen()),

// Redirect update:
// After parent login completes, check isSetupDone:
//   !isSetupDone → /setup
//   isSetupDone + !hasChild → /connect  
//   isSetupDone + hasChild → /home
```

The redirect logic in app_router.dart will be enhanced to check
`auth.isSetupDone` (from LifecycleService) to route new parents through setup.

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `assets/icons/shield.svg` | CREATE |
| `assets/icons/shield_check.svg` | CREATE |
| `pubspec.yaml` | MODIFY (add flutter_svg + assets) |
| `lib/presentation/widgets/app_logo.dart` | MODIFY (use SvgPicture) |
| `lib/presentation/screens/welcome_screen.dart` | MODIFY (use shield_check.svg) |
| `lib/presentation/screens/onboarding_screen.dart` | MODIFY (illustrations) |
| `lib/presentation/screens/parent_setup_screen.dart` | CREATE |
| `lib/presentation/screens/connect_child_screen.dart` | CREATE |
| `lib/presentation/screens/child_setup_screen.dart` | CREATE |
| `lib/presentation/screens/child/child_connected_screen.dart` | CREATE |
| `lib/app_router.dart` | MODIFY (4 new routes + redirect logic) |
| `android/app/src/main/res/drawable/ic_launcher_foreground.xml` | CREATE |
| `android/app/src/main/res/drawable/ic_launcher_background.xml` | CREATE |
| `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` | CREATE |
| `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml` | CREATE |

**Total: 15 files (5 new, 6 modified, 4 Android XML)**

---

## Parity Target After Phase 4

| Category | Before | After |
|----------|--------|-------|
| Logo (in-app) | 0% (wrong icon) | **100%** |
| Logo (launcher) | 0% | **80%** (adaptive, legacy PNGs remain) |
| Onboarding flow | 95% | **98%** |
| Setup flows | 0% | **85%** |
| **Overall** | ~72% | **~82%** |
