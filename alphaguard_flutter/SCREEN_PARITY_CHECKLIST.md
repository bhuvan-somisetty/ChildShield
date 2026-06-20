# Screen Parity Checklist
_frontend-v2 vs. alphaguard_flutter | Updated: 2026-06-20_
_See FINAL_UI_PARITY_AUDIT.md for full evidence. See ROUTE_PARITY_REPORT.md for route mapping._

Legend: ✅ Match confirmed | ⚠️ Partial | ❌ Missing or stub | 🔴 Critical gap

---

## Auth & Onboarding

| # | Screen | Route | Flutter file | Status | Notes |
|---|--------|-------|--------------|--------|-------|
| 1 | Splash | `/splash` | `splash_screen.dart` | ✅ | Minor: Flutter shows spinner, web does not |
| 2 | Welcome | `/welcome` | `welcome_screen.dart` | ✅ | All elements confirmed |
| 3 | Onboarding | `/onboarding` | `onboarding_screen.dart` | ✅ | 6 sections confirmed |
| 4 | Role Selection | `/role` | `role_selection_screen.dart` | ✅ | Cards + art confirmed |
| 5 | Login | `/login` | `login_screen.dart` | ⚠️ | Missing back button; Google icon wrong (g_mobiledata vs 4-color SVG); extra Apple button; divider text; font size 24 vs 26 |
| 6 | Signup | `/signup` | `signup_screen.dart` | ⚠️ | PIN step not verified; needs audit |
| 7 | Forgot Password | `/forgot` | `forgot_password_screen.dart` | ⚠️ | Not audited |
| 8 | Child Setup | `/child-setup` | `child_setup_screen.dart` | ✅ | 2-step gender+name confirmed |
| 9 | Child Pairing | `/pair` | `child_pairing_screen.dart` | ⚠️ | Not audited |

---

## Parent Setup Flow

| # | Screen | Route | Flutter file | Status | Notes |
|---|--------|-------|--------------|--------|-------|
| 10 | Parent Setup Wizard | `/setup` | `parent_setup_screen.dart` | ⚠️ | 5 steps present; API calls for contacts missing; permission triggers missing |
| 11 | Connect Child | `/connect` | `connect_child_screen.dart` | ⚠️ | QR code missing; digit display + polling match |
| 12 | Child Connected | `/child-connected` | `child/child_connected_screen.dart` | ✅ | Success animation + info table confirmed |
| 13 | Child Activation | `/child-activate` | `child/child_activation_screen.dart` | ✅ | 9 perms, 3 stages, feature badges confirmed |

---

## Parent App

| # | Screen | Route | Flutter file | Status | Notes |
|---|--------|-------|--------------|--------|-------|
| 14 | **Parent Dashboard** | `/app/home` | `home_screen.dart` | 🔴 | **STUB** — renders task list only. DashboardV2 requires: child status card, telemetry grid, safety ring, quick actions, screen time ring, night restriction |
| 15 | Tasks Center | `/app/tasks` | `tasks/tasks_screen.dart` | ⚠️ | Not audited |
| 16 | Family Radar | `/app/location` | `safety/family_radar_screen.dart` | ⚠️ | Not audited |
| 17 | AI Reports | `/app/reports` | `productivity/ai_reports_screen.dart` | ⚠️ | Not audited |
| 18 | Settings | `/app/settings` | settings screens | ⚠️ | Not audited |
| 19 | Controls Hub | `/app/controls` | ❌ NO FILE | ❌ | Missing: screen time, night restrictions, app restrictions |
| 20 | App Management | `/app/app-management` | ❌ NO FILE | ❌ | Missing |
| 21 | Emergency Command | `/app/emergency` | ❌ NO FILE | ❌ | `/sos` (SosScreen) is different from EmergencyCommand |
| 22 | Chat Center | `/app/chat` | `chat/chat_screen.dart` | ⚠️ | Not audited; route differs |
| 23 | AI Assistant (DISHA) | `/app/ai` | `assistant/assistant_screen.dart` | ⚠️ | Not audited |
| 24 | Notifications | `/app/notifications` | `settings/notification_inbox_screen.dart` | ⚠️ | Not audited |
| 25 | Approvals Center | `/app/approvals` | ❌ NO FILE | ❌ | Missing |
| 26 | Permissions Center | `/app/permissions` | ❌ NO FILE | ❌ | Missing |
| 27 | Targets Panel | `/app/targets` | `targets/targets_screen.dart` | ⚠️ | Not audited |
| 28 | Rewards Panel | `/app/rewards` | `rewards/rewards_screen.dart` | ⚠️ | Not audited |
| 29 | Planner | `/app/planner` | `tasks/calendar_view.dart` + `agenda_view.dart` | ⚠️ | Not a top-level route in Flutter |
| 30 | Support Center | `/app/support` | `support/support_screen.dart` | ⚠️ | Not audited |
| 31 | Voice AI | `/app/voice-ai` | ❌ NO FILE | ❌ | Fullscreen voice interface missing |
| 32 | User Manual | `/app/user-manual` | `support/user_manual_screen.dart` | ✅ | |

---

## Child App

| # | Screen | Route | Flutter file | Status | Notes |
|---|--------|-------|--------------|--------|-------|
| 33 | **Child Home** | `/child/app/home` | `child/child_dashboard.dart` | 🔴 | **STUB** — renders task list only. ChildHome requires: PROTECTED badge, identity card (gradient/glow/grade/school), inline pulsing SOS button, 6-section grid, goals snapshot |
| 34 | Child Tasks | `/child/app/tasks` | `child/child_tasks_screen.dart` | ⚠️ | Not audited |
| 35 | Child SOS | `/child/app/sos` | `child/child_sos_screen.dart` | ⚠️ | FAB present; pulse animation not confirmed |
| 36 | Child Contacts | `/child/app/contacts` | `child/child_contacts_screen.dart` | ✅ | |
| 37 | Child Chat | `/child/app/chat` | `child/child_chat_screen.dart` | ⚠️ | Not audited |
| 38 | **Child DISHA** | `/child/app/disha` | ❌ NO FILE | ❌ | DISHA AI assistant completely missing from child app |
| 39 | Child Goals | `/child/app/goals` | `child/child_goals_screen.dart` | ⚠️ | Not audited |
| 40 | Child Rewards | `/child/app/rewards` | `child/child_rewards_screen.dart` | ⚠️ | Not audited |
| 41 | Child Achievements | `/child/app/achievements` | `achievements/achievements_screen.dart` | ⚠️ | Not audited |
| 42 | Child Settings | `/child/app/settings` | `child/child_settings_screen.dart` | ⚠️ | Not audited |

---

## Summary

| Status | Count | Screens |
|--------|-------|---------|
| ✅ Confirmed match | 9 | Splash, Welcome, Onboarding, Role, Child Setup, Child Connected, Child Activation, Child Contacts, User Manual |
| ⚠️ Partial / not audited | 19 | See table above |
| ❌ Missing entirely | 5 | Controls Hub, App Management, Emergency Command, Approvals, Voice AI, Child DISHA (6 if DISHA counted) |
| 🔴 Critical stub | 2 | Parent Dashboard, Child Home |
| **Total** | **42** | |

**Evidence-based parity: 59%** (see FINAL_UI_PARITY_AUDIT.md for calculation)

---

## Phase 5 Priority Order

1. 🔴 **Rewrite HomeScreen** → match `DashboardV2.jsx` (child status card, rings, quick actions)
2. 🔴 **Rewrite ChildDashboard** → match `ChildHome.jsx` (PROTECTED badge, identity card, section grid)
3. ❌ **Fix Login** (back button, Google SVG icon, Apple button removal, divider text)
4. ❌ **Add Child DISHA screen** (`/child/app/disha`)
5. ❌ **Add QR code** to ConnectChildScreen
6. ❌ **Add Controls Hub** route + screen
7. ❌ **Add ApprovalsCenter** route + screen
8. ⚠️ **Audit + fix** Signup PIN step, Tasks, Radar, Reports, Settings
