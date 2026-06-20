# AlphaGuard Flutter — frontend-v2 Parity Progress

_Source of truth: https://alphaguard-v2.vercel.app_  
_Last updated: 2026-06-20_

---

## Phase 1 — Onboarding Flow ✅ COMPLETE

### Changes
| File | Action | Status |
|------|--------|--------|
| `lib/presentation/screens/welcome_screen.dart` | **CREATED** | ✅ |
| `lib/presentation/screens/onboarding_screen.dart` | **REWRITTEN** | ✅ |
| `lib/presentation/screens/role_selection_screen.dart` | **CREATED** | ✅ |
| `lib/app_router.dart` | **UPDATED** routes + redirect | ✅ |
| `lib/presentation/widgets/app_logo.dart` | **UPDATED** logoSize param | ✅ |

### Flow parity
| Step | frontend-v2 | Flutter (before) | Flutter (after) |
|------|-------------|-----------------|----------------|
| 1 | `/` → Splash | `/splash` ✅ | `/splash` ✅ |
| 2 | `/welcome` — hero, "Protect What Matters Most" | ❌ MISSING | ✅ WelcomeScreen |
| 3 | `/onboarding` — 6 sections (7 content steps) | ⚠️ 5 generic slides | ✅ 6 sections matching |
| 4 | `/role` — Parent / Child card selection | ❌ MISSING | ✅ RoleSelectionScreen |
| 5 | `/login` (parent) or `/pair` (child) | `/login` directly | ✅ via /role |

### Onboarding section parity
| Section | frontend-v2 | Flutter (after) |
|---------|-------------|----------------|
| how — How AlphaGuard Works | ✅ | ✅ (AiArt + 3 StepRows) |
| parentGuide — 7-step setup | ✅ | ✅ (7 StepRows) |
| parentFeatures — 8 feature tiles | ✅ | ✅ (2-col Wrap) |
| childGuide — 6-step setup | ✅ | ✅ (6 StepRows) |
| childFeatures — 6 feature tiles | ✅ | ✅ (6 feature tiles) |
| privacy — 4 commitments + legal links | ✅ | ✅ (CommitRows + legal) |

---

## Phase 2 — Navigation Structure ✅ COMPLETE

### Parent Shell
| Position | frontend-v2 | Flutter (before) | Flutter (after) |
|----------|-------------|-----------------|----------------|
| Tab 1 | Home (grid icon) | Home ✅ | Home (grid icon) ✅ |
| Tab 2 | Tasks | Tasks ✅ | Tasks ✅ |
| Tab 3 | **Location (MapPin)** | Chat ❌ | **Location (MapPin) ✅** |
| Tab 4 | **Reports (Sparkles)** | DISHA ❌ | **Reports (Sparkles) ✅** |
| Tab 5 | **Settings (gear)** | Insights ❌ | **Settings (gear) ✅** |
| Float | **DISHA draggable bubble** | Missing ❌ | **Violet/cyan FAB ✅** |
| Header | **Child Switcher + Bell** | Missing ❌ | **AppBar with both ✅** |

### Child Shell
| Position | frontend-v2 | Flutter (before) | Flutter (after) |
|----------|-------------|-----------------|----------------|
| Tab 1 | Home | Home ✅ | Home ✅ |
| Tab 2 | Tasks | Tasks ✅ | Tasks ✅ |
| **CENTER** | **🔴 SOS (raised, pulsing)** | DISHA ❌ | **🔴 SOS FAB ✅** |
| Tab 4 | Rewards | Chat ❌ | Rewards ✅ |
| Tab 5 | **Achievements (Trophy)** | Rewards ❌ | **Achievements ✅** |

---

## Phase 3 — Branding ✅ COMPLETE (partial — SVG pending until Phase 4)

| Element | frontend-v2 | Flutter (before) | Flutter (after) |
|---------|-------------|-----------------|----------------|
| Logo icon | Shield (lucide, code-rendered) | verified_user_outlined | **SVG (Phase 4) ✅** |
| Logo gradient | blue→cyan | blue→cyan ✅ | blue→cyan ✅ |
| Brand name | "AlphaGuard AI" | "AlphaGuard AI" ✅ | "AlphaGuard AI" ✅ |
| Tagline | "FAMILY SAFETY PLATFORM" | present ✅ | present ✅ |
| logoSize param | badge variant | not supported | **supported ✅** |
| Welcome glow | blue animated pulse | N/A | **animated RadialGradient ✅** |
| Welcome float | y oscillation 0→-7 | N/A | **AnimationController ✅** |

---

## Phase 4 — Logo Parity + Setup Screens ✅ COMPLETE

### Logo parity
| Surface | Before | After |
|---------|--------|-------|
| `AppLogo` (all screens) | `Icons.verified_user_outlined` | **`assets/icons/shield.svg` (lucide Shield v1.17) ✅** |
| WelcomeScreen hero | `Icons.verified_user_outlined` | **`assets/icons/shield_check.svg` ✅** |
| OnboardingScreen AiArt | `Icons.verified_user_outlined` | **`assets/icons/shield_check.svg` ✅** |
| OnboardingScreen PrivacyArt | `Icons.shield_outlined` | **`assets/icons/shield_check.svg` ✅** |
| RoleSelectionScreen ParentArt | `Icons.verified_user_outlined` | **`assets/icons/shield.svg` ✅** |
| RoleSelectionScreen ChildArt | `Icons.verified_user_outlined` | **`assets/icons/shield.svg` ✅** |
| MainShell header empty state | `Icons.verified_user_outlined` | **`assets/icons/shield.svg` ✅** |
| Android launcher | Flutter blue default | **Adaptive icon (Shield vector) ✅** |

### New screens
| Route | Screen | Status |
|-------|--------|--------|
| `/setup` | ParentSetupScreen (5-step wizard: welcome→location→notifications→contacts→complete) | ✅ |
| `/connect` | ConnectChildScreen (6-digit code display + polling) | ✅ |
| `/child-setup` | ChildSetupScreen (gender + name, 2-step) | ✅ |
| `/child-connected` | ChildConnectedScreen (success + info table) | ✅ |
| `/child-activate` | ChildActivationScreen (9 permission cards → checklist → final) | ✅ |

### New files
| File | Purpose |
|------|---------|
| `assets/icons/shield.svg` | Exact lucide Shield path (v1.17.0) — Brand mark |
| `assets/icons/shield_check.svg` | Exact lucide ShieldCheck path (v1.17.0) — Hero/illustrations |
| `android/.../drawable/ic_launcher_foreground.xml` | Shield vector drawable for adaptive icon |
| `android/.../drawable/ic_launcher_background.xml` | Dark blue launcher background |
| `android/.../mipmap-anydpi-v26/ic_launcher.xml` | Adaptive icon manifest |
| `android/.../mipmap-anydpi-v26/ic_launcher_round.xml` | Round adaptive icon |
| `pubspec.yaml` | Added `flutter_svg: ^2.0.10` + enabled `assets/icons/` |

---

## Parity Score

| Category | Phase 1-3 | Phase 4 |
|----------|-----------|---------|
| Onboarding flow (Welcome → Onboard → Role) | 95% | 95% |
| Parent nav structure | 90% | 90% |
| Child nav structure | 90% | 90% |
| **Logo / Branding** | 55% | **100%** ✅ |
| Setup flows (/setup, /connect, /child-setup) | 0% | **85%** |
| Screen count | 45/55 | **50/55** |
| **Overall** | **~72%** | **~82%** |

---

## Remaining Phases

### Phase 5 — Missing Parent Screens
- [ ] VoiceAI / DISHA Voice (fullscreen immersive)
- [ ] Controls hub (app restrictions, night mode, screen time)
- [ ] ScreenTime Center
- [ ] NightRestrictions
- [ ] AppManagement (install/uninstall list)
- [ ] MonitoringHub + Camera/Audio/Screen stubs
- [ ] ApprovalsCenter (pending child requests)
- [ ] Activity History
- [ ] Analytics (charts)
- [ ] Notification Center
- [ ] Settings Hub (SettingsHubV2 equivalent)
- [ ] Dashboard 4 Quick Action Cards

### Phase 6 — Child App Parity
- [ ] Child Home quick action cards (Chat, DISHA)
- [ ] Voice DISHA for child (fullscreen)
- [ ] Child Dashboard UI parity (greeting, goals progress, status card)

### Phase 7 — Animations & Interactions
- [ ] Page transition curves (spring easing to match framer-motion)
- [ ] Tap feedback (.ag-tap scale 0.97 equivalent)
- [ ] Onboarding slide animation (x-offset fade)
- [ ] DISHA bubble full drag-to-anywhere behavior

### Phase 8 — Production Config
- [ ] Backend URL via `--dart-define=AG_API=https://...` (replace 10.0.2.2:4000)
- [ ] Firebase config for push delivery
- [ ] App icons parity — mipmap PNGs (legacy API<26 devices)
- [ ] i18n (multi-language support)
