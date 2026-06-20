# Route Parity Report
_Source: frontend-v2 App.jsx routes vs. alphaguard_flutter app_router.dart_
_Generated: 2026-06-20_

---

## Legend
- ✅ Route exists and screen is implemented
- ⚠️ Route exists but screen content differs from frontend-v2
- ❌ Route missing or screen is a placeholder

---

## Auth & Onboarding Flow

| frontend-v2 route | Component | Flutter route | Flutter screen | Status |
|-------------------|-----------|---------------|----------------|--------|
| `/` (index) | `Splash` | `/splash` | `SplashScreen` | ✅ |
| `/welcome` | `Welcome` | `/welcome` | `WelcomeScreen` | ✅ |
| `/onboarding` | `Onboarding` | `/onboarding` | `OnboardingScreen` | ✅ |
| `/role` | `RoleSelection` | `/role` | `RoleSelectionScreen` | ✅ |
| `/login` | `Login` | `/login` | `LoginScreen` | ⚠️ Missing back button; Google icon wrong; extra Apple button not in web |
| `/signup` | `Signup` | `/signup` | `SignupScreen` | ⚠️ PIN step; check Google/Apple parity |
| `/forgot` | `ForgotPassword` | `/forgot` | `ForgotPasswordScreen` | ✅ |
| `/child-setup` | `ChildSetup` | `/child-setup` | `ChildSetupScreen` | ✅ |
| `/pair` | `ChildPairing` | `/pair` | `ChildPairingScreen` | ⚠️ Needs visual audit |

---

## Parent Setup Flow (post-login, first time)

| frontend-v2 route | Component | Flutter route | Flutter screen | Status |
|-------------------|-----------|---------------|----------------|--------|
| `/setup` | `ParentSetup` | `/setup` | `ParentSetupScreen` | ⚠️ Implemented; visual diff not audited against live |
| `/connect` | `ConnectChild` | `/connect` | `ConnectChildScreen` | ⚠️ Implemented; no QR code |
| `/child/connected` | `ChildConnected` | `/child-connected` | `ChildConnectedScreen` | ✅ |
| `/child/activate` | `ChildActivation` | `/child-activate` | `ChildActivationScreen` | ✅ |

---

## Parent App Shell (`/app/*`)

| frontend-v2 route | Component | Flutter equivalent | Status |
|-------------------|-----------|--------------------|--------|
| `/app/home` | `DashboardV2` | `HomeScreen` (Tab 1) | ❌ **CRITICAL** — Flutter HomeScreen is a task list, not a dashboard |
| `/app/tasks` | `TasksCenter` | `TasksScreen` (Tab 2) | ⚠️ Needs audit |
| `/app/location` | `FamilyRadar` | `FamilyRadarScreen` (Tab 3) | ⚠️ Needs audit |
| `/app/reports` | `AIReports` | `AIReportsScreen` (Tab 4) | ⚠️ Needs audit |
| `/app/settings` | `SettingsHub` | Settings tab | ⚠️ Needs audit |
| `/app/controls` | `SecurityCenter` + `NightRestrictions` + `AppManagement` | No direct route | ❌ MISSING |
| `/app/app-management` | `AppManagement` | No route | ❌ MISSING |
| `/app/emergency` | `EmergencyCommand` | `/sos` partial | ❌ MISSING — `/sos` is SOS alert, not command center |
| `/app/chat` | `ChatCenter` | `ChatScreen` (inside shell) | ⚠️ Route mismatch; ChatCenter is parent-to-child chat |
| `/app/ai` | `AICopilot` / `VoiceAI` | `AssistantScreen` | ⚠️ Needs audit |
| `/app/notifications` | `NotificationCenter` | `NotificationInboxScreen` | ⚠️ Needs audit |
| `/app/approvals` | `ApprovalsCenter` | No route | ❌ MISSING |
| `/app/permissions` | `PermissionsCenter` | No route | ❌ MISSING |
| `/app/targets` | `TargetsPanel` | `TargetsScreen` | ⚠️ Needs audit |
| `/app/rewards` | `RewardsPanel` | `RewardsScreen` | ⚠️ Needs audit |
| `/app/planner` | `Planner` | `CalendarView` / `AgendaView` | ⚠️ Not a top-level route |
| `/app/support` | `SupportCenter` | `SupportScreen` | ⚠️ Needs audit |
| `/app/user-manual` | `UserManual` | `UserManualScreen` | ✅ |
| `/app/admin` | `AdminSupport` | `AdminScreen` | ✅ |
| `/app/voice-ai` | `VoiceAI` | No route | ❌ MISSING |
| `/app/disha` | DISHA (floating bubble) | FAB → `AssistantScreen` | ⚠️ Web is a draggable overlay, Flutter is modal push |
| `/app/add-safe-zone` | `AddSafeZone` | Sheet inside `FamilyRadarScreen` | ⚠️ Different pattern |
| `/app/legal/privacy` | `PublicLegal` | `PrivacyPolicyScreen` | ✅ |
| `/app/legal/terms` | `PublicLegal` | `TermsConditionsScreen` | ✅ |
| `/app/consent` | `Consent` | `LegalConsentScreen` | ✅ |

---

## Child App Shell (`/child/app/*`)

| frontend-v2 route | Component | Flutter equivalent | Status |
|-------------------|-----------|--------------------|--------|
| `/child/app/home` | `ChildHome` | `ChildDashboard` (Tab 1) | ❌ **CRITICAL** — Flutter dashboard is task list; web has identity card + section grid + SOS button |
| `/child/app/tasks` | `Tasks` | `ChildTasksScreen` (Tab 2) | ⚠️ Needs audit |
| `/child/app/sos` | `SOS` | `ChildSosScreen` (center FAB) | ⚠️ Implemented; visual parity not confirmed |
| `/child/app/contacts` | `Contacts` | `ChildContactsScreen` | ✅ |
| `/child/app/chat` | `Chat` | `ChildChatScreen` (or ChatScreen?) | ⚠️ Needs audit |
| `/child/app/disha` | `Disha` / `DishaVoice` | No child DISHA route | ❌ MISSING |
| `/child/app/goals` | `Goals` | `ChildGoalsScreen` | ⚠️ Needs audit |
| `/child/app/rewards` | `Rewards` | `ChildRewardsScreen` (Tab 4) | ⚠️ Needs audit |
| `/child/app/achievements` | `Achievements` | `AchievementsScreen` (Tab 5) | ⚠️ Needs audit |
| `/child/app/settings` | `Settings` | `ChildSettingsScreen` | ⚠️ Needs audit |

---

## Route Count Summary

| Category | frontend-v2 routes | Flutter routes | Missing | Mismatch |
|----------|--------------------|----------------|---------|---------|
| Auth/Onboarding | 9 | 9 | 0 | 2 |
| Parent setup flow | 4 | 4 | 0 | 2 |
| Parent shell tabs | 5 | 5 | 0 | 2 |
| Parent sub-routes | 14 | 3 | 7 | 4 |
| Child shell tabs | 5 | 5 | 0 | 3 |
| Child sub-routes | 5 | 3 | 2 | 0 |
| **Total** | **42** | **29** | **9** | **13** |

---

## Critical Gaps (block parity)

1. `/app/home` → `HomeScreen` renders task list, not `DashboardV2` layout
2. `/child/app/home` → `ChildDashboard` renders task list, not `ChildHome` layout
3. `/app/controls` — entire controls hub (screen time, app restrictions, night) missing
4. `/app/approvals` — `ApprovalsCenter` missing
5. `/app/permissions` — `PermissionsCenter` missing
6. `/app/voice-ai` — `VoiceAI` fullscreen missing
7. `/child/app/disha` — DISHA missing from child app entirely
8. `/app/emergency` — `EmergencyCommand` not the same as `/sos` alert
9. Route naming: frontend-v2 uses `/child/connected` and `/child/activate`; Flutter uses `/child-connected` and `/child-activate` (kebab vs slash path — not a functional issue but breaks deep links from web)
