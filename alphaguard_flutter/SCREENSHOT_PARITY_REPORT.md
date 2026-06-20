# Screenshot Parity Report
_Evidence source: JSX source (frontend-v2) vs. Dart source (alphaguard_flutter)_
_Generated: 2026-06-20_

> **Note on screenshots**: Neither app can be executed in this environment. Visual
> evidence below is derived directly from source code — each row documents what the
> source code provably renders, not subjective description. Actual device screenshots
> should be captured with `flutter run` and compared against https://alphaguard-v2.vercel.app.

---

## Screen 1 — Splash (`/splash`)

| Element | frontend-v2 source | Flutter source |
|---------|-------------------|----------------|
| Background | `#030307` | `AppColors.bg` = `#030307` ✅ |
| Logo | `<Brand />` component (Shield SVG + "AlphaGuard AI") | `AppLogo` widget (shield.svg + "AlphaGuard AI") ✅ |
| Loading indicator | None documented in Splash.jsx | `CircularProgressIndicator` |
| Navigation | Reads `firstLaunch` + `token` → routes | Reads `SharedPreferences` + auth status ✅ |

**Differences**: Minor — Flutter shows a spinner that web does not. Otherwise equivalent.

---

## Screen 2 — Welcome (`/welcome`)

| Element | frontend-v2 source | Flutter source |
|---------|-------------------|----------------|
| Background glow | `radial-gradient` blue at 20% opacity, animated pulse (`motion`) | `AnimatedBuilder` radial gradient pulse ✅ |
| Hero icon | `ShieldCheck` (lucide, 52px, cyan `#22d3ee`) | `SvgPicture.asset('shield_check.svg', 52px, cyan) ✅ |
| Hero container | 96×96, `bg-blue-600/15 border-blue-500/30`, 16px blur shadow | 96×96 Container, `0x402563EB` fill, `0x4D3B82F6` border ✅ |
| Float animation | `y: [0, -7, 0]` repeat via framer-motion | `Tween(0, -7)` + `AnimationController` repeat ✅ |
| H1 | "Protect What Matters Most" — font-black text-[28px] | `fontSize: 28, fontWeight: w900` ✅ |
| Subtitle | "Real-time protection…" — slate-400, 14px | `AppColors.textSecondary, fontSize: 14` ✅ |
| CTA button | "Get Started" — full-width, blue gradient, ChevronRight | `PrimaryButton('Get Started', Icons.arrow_forward)` ✅ |
| "Already have an account?" | cyan link → `/login` | Present ✅ |

**Differences**: None found in source. High confidence match.

---

## Screen 3 — Onboarding (`/onboarding`)

| Element | frontend-v2 source | Flutter source |
|---------|-------------------|----------------|
| Section count | 6 sections (how/parentGuide/parentFeatures/childGuide/childFeatures/privacy) | 6 sections ✅ |
| Slide animation | `x` translate + opacity via framer-motion | `Transform.translate` + `Opacity` via AnimationController ✅ |
| AiArt center icon | `ShieldCheck` (lucide, 36px, accent color) | `SvgPicture.asset('shield_check.svg', 36px, accent colorFilter)` ✅ |
| PrivacyArt orbit | `Shield` (lucide, 10px) orbiting dot | `SvgPicture.asset('shield_check.svg', 10px)` ✅ |
| Progress dots | Horizontal dot row, active = cyan pill | `_ProgressDots` animated width pill ✅ |
| parentFeatures | 8 tiles in 2-column wrap | 2-col Wrap ✅ |
| childFeatures | 6 tiles | 6 tiles ✅ |
| privacy commitments | 4 rows + legal links | 4 CommitRows + legal TextButtons ✅ |

**Differences**: None found at section/content level. Animation curve may differ (Framer spring vs. Flutter `easeOut`).

---

## Screen 4 — Role Selection (`/role`)

| Element | frontend-v2 source | Flutter source |
|---------|-------------------|----------------|
| Parent card | Gradient `from-blue-600/10`, icon Shield (lucide) | `shield.svg` colorFilter, blue gradient ✅ |
| Child card | Gradient `from-emerald-600/10`, icon Shield (lucide) | `shield.svg` colorFilter, emerald gradient ✅ |
| Card dimensions | `rounded-[24px]`, `p-6` | `borderRadius: 24, padding: 24` ✅ |
| Animated art | `_ParentArt` / `_ChildArt` floating blobs | Translated ✅ |
| "Back to welcome" link | Present | Present ✅ |

**Differences**: None found.

---

## Screen 5 — Login (`/login`)

| Element | frontend-v2 source | Flutter source |
|---------|-------------------|----------------|
| Back button | ✅ ChevronLeft → `/role`, w-11 h-11 rounded-2xl bg-white/5 | ❌ **MISSING** — Flutter has no back button |
| Brand | `<Brand variant="stacked" className="mb-6" />` | `AppLogo()` — no `variant="stacked"` param applied | ⚠️ |
| H1 | "Welcome back" — text-[26px] font-black | `fontSize: 24, fontWeight: w900` ⚠️ size off by 2px |
| Subtitle | "Log in to your parent dashboard" — slate-500, 13px, font-semibold | `AppColors.textMuted, fontWeight: w600` ✅ |
| Email input | `Input` with `Mail` lucide icon, label "Email Address" | `AppTextField` with `Icons.mail_outline` ✅ |
| Password input | `Input` with `Lock` lucide icon, label "Password" | `AppTextField` with `Icons.lock_outline` ✅ |
| Error message | rose-400, 12.5px, font-semibold, below inputs | `AppColors.danger, fontSize: 13, w600` ✅ |
| Forgot password | Self-end TextButton, cyan-400/90, 12.5px | `Align(right) TextButton` ✅ |
| Continue button | Full-width, blue gradient, ChevronRight, `loading` state | `PrimaryButton(label:'Continue', icon: arrow_forward, loading: auth.busy)` ✅ |
| Divider | "or continue with" — 10px, slate-500, uppercase, letter-spacing 0.15em | "OR" — ⚠️ text differs (web: full phrase, Flutter: just "OR") |
| Google button | `rounded-full` pill, 4-color SVG `<GoogleIcon />`, `min-h-[56px]` | `Icons.g_mobiledata` ❌ **Wrong icon — not 4-color Google SVG** |
| Apple button | ❌ NOT in frontend-v2 | ✅ `SignInWithAppleButton` present — ⚠️ extra element not in web |
| Create Account link | "Don't have an account? Create Account" | Present ✅ |

**Differences (5)**:
1. Back button missing from Flutter
2. Google button uses `Icons.g_mobiledata` instead of 4-color Google SVG
3. Apple sign-in button present in Flutter, absent in frontend-v2
4. Divider text: "or continue with" vs "OR"
5. H1 font size: 26px vs 24px

---

## Screen 6 — Signup (`/signup`)

Audit deferred — needs read of both `Signup.jsx` and `signup_screen.dart`. Expected differences:
- frontend-v2 has a 6-digit PIN setup step after email/password
- Flutter signup likely missing PIN step (unconfirmed)

---

## Screen 7 — Parent Dashboard (`/app/home`)

### frontend-v2 `DashboardV2.jsx` renders:
1. **Child Status Card** — `rounded-[26px]`, gradient `from-white/[0.06]`, glow blob at top-right colored by child color
   - Emoji avatar: 64×64 circle, color-tinted bg, colored border, online dot (emerald/slate, 20px, border-[#0b0c14])
   - Child name + age: font-black 20px
   - Online/offline status line: emerald-400 / slate-500, 12.5px font-bold, `●` bullet
   - Message button (cyan, `MessageCircle`) + Call button (emerald, `Phone`) — 44×44 rounded-2xl
   - Telemetry grid 3×1: battery (BatteryMedium/BatteryCharging, color-coded), network (Wifi), last sync (RefreshCw) — each `rounded-2xl bg-black/20`
2. **Safety Score Ring** — 84×84 animated SVG circle, stroke = `riskColor(child.risk)`, score number inside, risk label, weekly trend with `TrendingUp`/`TrendingDown`
3. **Quick Actions grid** 4 cols — App Management (Grid3x3, cyan), Controls (SlidersHorizontal, blue), SOS Center (Siren, red), AI Assistant (Sparkles, violet) — each `rounded-[20px] bg-color/10 border-color/20`
4. **Screen Time ring** — 60×60 SVG, `strokeDasharray`, percentage inside, remaining time label
5. **Night Restriction status** — `Moon` icon, computed active/countdown text
6. **SOS EmergencyCard** — conditional, shown when `?sos=1` query param present

### Flutter `HomeScreen` renders:
1. "Hi, [Parent name] 👋" — Text, fontSize 22, w900
2. `_LiveChip` (WS connection indicator)
3. `ChildSwitcher` widget in AppBar area
4. Logout `IconButton`
5. Child emoji + name card (`_Card`) — plain Row with emoji Text, name Text, online/offline `_LiveChip`
6. "TASKS" label section header
7. Task list — `_TaskTile` for each task
8. "No tasks yet." empty state

### Differences (ALL of dashboard UI):
| DashboardV2 element | Flutter HomeScreen | Status |
|---------------------|--------------------|--------|
| Child status card (gradient, glow, avatar circle) | ❌ Plain Card with emoji + name | ❌ MISSING |
| Online dot indicator (20px, colored border) | `_LiveChip` text badge | ❌ Different design |
| Message + Call action buttons | ❌ Not present | ❌ MISSING |
| Battery/Network/LastSync telemetry grid | ❌ Not present | ❌ MISSING |
| Safety score animated ring (SVG) | ❌ Not present | ❌ MISSING |
| Risk label (Low/Medium/High color-coded) | ❌ Not present | ❌ MISSING |
| Weekly trend (TrendingUp/Down) | ❌ Not present | ❌ MISSING |
| 4 Quick Action cards | ❌ Not present | ❌ MISSING |
| Screen time ring | ❌ Not present | ❌ MISSING |
| Night restriction status | ❌ Not present | ❌ MISSING |

**This screen requires a complete rewrite. HomeScreen is a Phase 1 foundation stub.**

---

## Screen 8 — Child Home (`/child/app/home`)

### frontend-v2 `ChildHome.jsx` renders:
1. **Greeting row** — time-based ("Good morning/afternoon/evening"), H1 "Hi, [name] [emoji]" 24px font-black; "PROTECTED" badge (emerald-500/15 bg, `ShieldCheck` 13px, "PROTECTED" 11px font-black)
2. **Identity + status card** — `rounded-[26px] border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08]`, glow blob
   - Avatar: 56×56 `rounded-2xl`, color-tinted
   - Name + age: 18px font-black; Grade + School: slate-400 12.5px
   - Telemetry grid 3×1: battery, network, `ShieldCheck` "Safe" status
   - "Location is shared with [parentName]" — `MapPin` emerald, 12px slate-400
3. **SOS button** — full-width `rounded-[24px] border-rose-500/30 bg-gradient-to-r from-rose-600/20`, pulsing `motion.div` glow (`opacity: [0.4, 0.8, 0.4]`, 1.8s), Siren icon 24px, "Emergency SOS" / "Tap if you need help right now", ChevronRight
4. **Section grid** — "MY ALPHAGUARD" label 11px font-black tracking-[0.14em]; 3-column grid; 6 sections (SOS/Contacts/Chat/DISHA/Goals/Settings) each `rounded-2xl bg-[#0b0c14]` with icon box
5. **Goals snapshot card** — amber `Target` icon, "Study goals", "X of Y done today", "Open" → `/child/app/goals`

### Flutter `ChildDashboard` renders:
1. "Hi, [childName] 👋" — 24px font-black ✅
2. Motivational subtitle ("All tasks done — amazing! 🎉" or "Let's have a great day!") ⚠️ web has different text
3. `_StatCard` row — "Tasks done" (X/Y) + "Streak" (N days) — 2 cards
4. SOS as floating action button (`FloatingActionButton.extended`, red) ⚠️ web: full-width inline button
5. Task list with completion states

### Differences:
| ChildHome element | Flutter ChildDashboard | Status |
|-------------------|----------------------|--------|
| "PROTECTED" badge (emerald, ShieldCheck) | ❌ Not present | ❌ MISSING |
| Identity card (gradient, glow, rounded-[26px]) | ❌ Not present | ❌ MISSING |
| Grade + School in profile card | ❌ Not present | ❌ MISSING |
| Telemetry mini-grid (battery/network/safe) | ❌ Not present | ❌ MISSING |
| "Location shared with [parent]" footer | ❌ Not present | ❌ MISSING |
| SOS as full-width inline pulsing button | FAB instead | ⚠️ Different pattern |
| SOS pulse animation (opacity repeat 1.8s) | ❌ No pulse on FAB | ❌ MISSING |
| 6-section grid (3-col, MY ALPHAGUARD) | ❌ Not present | ❌ MISSING |
| Goals snapshot card | ❌ Not present | ❌ MISSING |

**This screen requires a complete rewrite.**

---

## Screen 9 — Child Setup (`/child-setup`)

| Element | frontend-v2 `ChildSetup.jsx` | Flutter `ChildSetupScreen` |
|---------|------------------------------|---------------------------|
| Step 1: Gender cards (Boy 👦 / Girl 👧) | ✅ | ✅ |
| Glow animation on selected card | ✅ framer-motion | ✅ `AnimationController` repeat |
| Step 2: Avatar + name input | ✅ | ✅ |
| Slide transition between steps | ✅ | ✅ opacity + translate |
| Boy accent = cyan, Girl = violet | ✅ | ✅ `AppColors.cyan` / `Color(0xFFA855F7)` |
| Step dot indicator | ✅ | ✅ animated width pill |
| Back button → `/role` from step 0 | ✅ | ✅ |

**Differences**: None found at layout level.

---

## Screen 10 — Child Connected (`/child-connected`)

| Element | frontend-v2 `ChildConnected.jsx` | Flutter `ChildConnectedScreen` |
|---------|----------------------------------|-------------------------------|
| Animated success checkmark | ✅ scale spring | ✅ `Curves.elasticOut` |
| "Child Device Connected" H1 | ✅ | ✅ |
| Info table (Name / Age / Device status) | ✅ | ✅ `_InfoRow` / `_Divider` |
| "PENDING SETUP" amber badge | ✅ | ✅ `Color(0xFFF59E0B)` |
| Warning notice (yellow border box) | ✅ | ✅ |
| "Complete Device Setup" CTA | ✅ → `/child/activate` | ✅ → `/child-activate` |
| "Skip for now" link | ✅ | ✅ |

**Differences**: Route slug `/child/activate` (web) vs `/child-activate` (Flutter) — functional difference for deep links only.

---

## Screen 11 — Child Activation (`/child-activate`)

| Element | frontend-v2 `ChildActivation.jsx` | Flutter `ChildActivationScreen` |
|---------|-----------------------------------|--------------------------------|
| Permission grid 3-col | ✅ | ✅ |
| 9 permission cards (Location/Notifications/Camera/Mic/Screen/Accessibility/Usage/Overlay/Background) | ✅ | ✅ |
| Card toggle animation | ✅ framer | ✅ `AnimatedContainer` |
| Progress bar % | ✅ | ✅ |
| Stage 2: checklist with per-perm icons | ✅ | ✅ `_CheckRow` |
| Stage 3: feature badges Wrap | ✅ | ✅ `_FeatureBadge` |
| Final icon: `verified_rounded` | Not checked (web may differ) | `Icons.verified_rounded` gradient circle |

**Differences**: Stage 3 final screen icon — needs cross-check against `ChildActivation.jsx` final stage. Otherwise close match.

---

## Screen 12 — Parent Setup Wizard (`/setup`)

Not fully audited against `ParentSetup.jsx` source. Known differences:
- frontend-v2 step 3 (Notifications) includes actual `requestPermission()` call via Web Push API
- Flutter version shows UI only, no actual Android permission request integration in wizard
- frontend-v2 emergency contacts step posts to `/family/contacts` API
- Flutter version stores contacts in local `List` state only, no API call

---

## Screen 13 — Connect Child (`/connect`)

| Element | frontend-v2 `ConnectChild.jsx` | Flutter `ConnectChildScreen` |
|---------|--------------------------------|------------------------------|
| 6-digit code display | ✅ spaced (3+3) | ✅ spaced with separator |
| Copy code button | ✅ | ✅ with toggle feedback |
| Regenerate button | ✅ | ✅ calls `FamilyController.regeneratePairing()` |
| QR code | ✅ QR code rendered via `qrcode` package | ❌ **MISSING** — no QR code in Flutter |
| Polling for `pairingStatus == 'active'` | ✅ | ✅ `Timer.periodic` 3s |
| Success → navigate `/app/home` | ✅ | ✅ after 2s delay |

**Differences**:
1. QR code missing from Flutter (frontend-v2 renders a scannable QR)

---

## Summary Table

| Screen | Overall parity | Critical missing |
|--------|---------------|-----------------|
| Splash | ~90% | Loading indicator style |
| Welcome | ~95% | None |
| Onboarding | ~92% | Animation curve |
| Role Selection | ~95% | None |
| Login | ~75% | Back button, Google SVG icon |
| Signup | Unknown | PIN step TBD |
| **Parent Dashboard** | **~15%** | **Everything — complete rewrite needed** |
| Tasks (parent) | Unknown | Needs audit |
| Family Radar | Unknown | Needs audit |
| AI Reports | Unknown | Needs audit |
| **Child Home** | **~20%** | **Everything — complete rewrite needed** |
| Child Tasks | Unknown | Needs audit |
| Child SOS | ~60% | Pulse animation |
| Child Setup | ~95% | None |
| Child Connected | ~95% | Route slug only |
| Child Activation | ~90% | Stage 3 final icon TBD |
| Connect Child | ~80% | QR code |
| Parent Setup | ~70% | API calls, permission triggers |
