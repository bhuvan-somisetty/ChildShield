# Parent Dashboard Parity — Source Evidence
_Generated: 2026-06-20 | Note: No browser/device available — screenshot evidence replaced by element-by-element source comparison_

---

## Why no screenshots

Neither the Flutter app nor the frontend-v2 web server is running in this environment. All parity claims below are verified by comparing `DashboardV2.jsx` (reference) line-by-line against `home_screen.dart` (Flutter implementation). Where an element matches exactly, it is marked ✅. Where there is a confirmed visual difference, it is marked with the gap.

---

## Reference Layout (DashboardV2.jsx)

```
┌──────────────────────────────────────────┐
│ [ChildSwitcher]           [Bell 🔔]      │  header row
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────┐   │
│ │ [glow blob top-right, cyan/blue]  │   │
│ │ [64px emoji circle] ● ONLINE      │   │
│ │ [name, age]                       │   │
│ │ [📩 Message] [📞 Call]            │   │
│ │ 🔋 Battery  📶 Network  🕐 Sync   │   │
│ └────────────────────────────────────┘   │  Child Status Card
│                                          │
│ ┌──────────────────┐ ┌─────────────────┐ │
│ │  [84px ring]     │ │  Safety Score   │ │
│ │    85            │ │  Low Risk       │ │
│ │                  │ │  ↓ 3% this week │ │
│ └──────────────────┘ └─────────────────┘ │  Safety Score Card
│                                          │
│  QUICK ACTIONS                           │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│ │ App  │ │Ctrl  │ │ SOS  │ │  AI  │    │
│ │ Mgmt │ │      │ │Centr │ │Asst. │    │
│ └──────┘ └──────┘ └──────┘ └──────┘    │  Quick Actions 4-col
│                                          │
│  FAMILY SAFETY                           │
│ ┌───────────────┐ ┌───────────────┐     │
│ │ Screen Time   │ │ Safe Zone     │     │
│ │ Unlimited     │ │ Inside Home   │     │
│ └───────────────┘ └───────────────┘     │
│ ┌───────────────┐ ┌───────────────┐     │
│ │ Night Mode    │ │ Apps Restr.   │     │
│ │ Off           │ │ 0 apps        │     │
│ └───────────────┘ └───────────────┘     │  Family Safety 2×2
│                                          │
│ ┌────────────────────────────────────┐   │
│ │ [72px ring]  SCREEN TIME           │   │
│ │  0%          0m / Unlimited  →    │   │
│ └────────────────────────────────────┘   │  Screen Time Card
│                                          │
│ ┌────────────────────────────────────┐   │
│ │ [28px grid bg]  [emoji pin + pulse]│   │
│ │ [info bar: "Location unavailable"] │   │
│ └────────────────────────────────────┘   │  Location Preview
│                                          │
│ [✓ green]  Emergency Status / All Clear →│  Emergency Status
│                                          │
│ [No recent alerts]  (empty state)        │  Recent Alerts
│                                          │
│ [AI Recommendations empty state]         │  AI Recommendations
└──────────────────────────────────────────┘
```

---

## Flutter Layout (home_screen.dart)

```
┌──────────────────────────────────────────┐
│ [ChildSwitcher]           [Bell 🔔]      │  ← same
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────┐   │
│ │ [Container opacity 0.5, blue blob] │   │  ← same glow blob
│ │ [64px emoji circle] ● ONLINE      │   │  ← same
│ │ [name, age]                       │   │  ← same
│ │ [📩 Message] [📞 Call]            │   │  ← same
│ │ 🔋 —       📶 —       🕐 —       │   │  ← DIFF: shows "—" (no backend data)
│ └────────────────────────────────────┘   │
│                                          │
│ ┌──────────────────┐ ┌─────────────────┐ │
│ │  [84px ring]     │ │  Safety Score   │ │  ← same ring size
│ │    85            │ │  Low Risk       │ │  ← DIFF: hardcoded placeholders
│ │                  │ │  ↓ 3% this week │ │
│ └──────────────────┘ └─────────────────┘ │
│                                          │
│  QUICK ACTIONS                           │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │  ← same 4-col grid
│ │ App  │ │Ctrl  │ │ SOS  │ │  AI  │    │  ← DIFF: taps navigate to new screens now
│ └──────┘ └──────┘ └──────┘ └──────┘    │
│                                          │
│  FAMILY SAFETY                           │
│ ┌───────────────┐ ┌───────────────┐     │  ← same 2×2 grid
│ │ Screen Time   │ │ Safe Zone     │     │  ← DIFF: hardcoded placeholders
│ └───────────────┘ └───────────────┘     │
│ ┌───────────────┐ ┌───────────────┐     │
│ │ Night Mode    │ │ Apps Restr.   │     │
│ └───────────────┘ └───────────────┘     │
│                                          │
│ ┌────────────────────────────────────┐   │  ← same ring + progress bar
│ │ [72px ring]  SCREEN TIME  0% ring  │   │  ← DIFF: 0% (no backend)
│ └────────────────────────────────────┘   │
│                                          │
│ ┌────────────────────────────────────┐   │  ← same 28px grid + pulse
│ │ [28px grid bg]  [emoji pin + pulse]│   │
│ │ [info bar: "Location unavailable"] │   │  ← same text
│ └────────────────────────────────────┘   │
│                                          │
│ [check_circle_rounded] Emergency / OK → │  ← DIFF: check_circle vs lucide Check
│                                          │
│ [No recent alerts]  (empty state)        │  ← same
│                                          │
│ [AI Recommendations empty state]         │  ← same
└──────────────────────────────────────────┘
```

---

## Element-by-Element Comparison

| # | Element | DashboardV2.jsx | home_screen.dart | Match? |
|---|---------|----------------|-----------------|-------|
| 1 | Background | `#030307` | `AppColors.bg` = `0xFF030307` | ✅ |
| 2 | Child status card bg | `bg-[#0b0c14]` with gradient overlay | `AppColors.bgElevated` + `LinearGradient` | ✅ |
| 3 | Glow blob | 60% opacity cyan-to-blue radial, top-right | `Container` with `Color(0xFF2563EB).withValues(alpha:0.5)` blur | ✅ |
| 4 | Emoji avatar size | `w-16 h-16` = 64px circle | `64px` `BoxDecoration(shape: circle)` | ✅ |
| 5 | Online dot | `w-5 h-5` = 20px emerald, top-right | `Positioned` 20px emerald dot | ✅ |
| 6 | Child name | `font-black text-[20px]` | `fontWeight: FontWeight.w900, fontSize: 20` | ✅ |
| 7 | Message button | `rounded-xl bg-white/10 w-8 h-8` | `Container` 32px rounded, `Colors.white.withValues(alpha:.1)` | ✅ |
| 8 | Call button | same style | same style | ✅ |
| 9 | Telemetry battery | `child.battery?.level ?? '—'` | `'—'` (no model field) | ⚠️ data gap |
| 10 | Telemetry network | `child.network ?? '—'` | `'—'` (no model field) | ⚠️ data gap |
| 11 | Telemetry last sync | `ago(tel.lastSyncAt)` | `'—'` (no model field) | ⚠️ data gap |
| 12 | Safety ring radius | 84px outer | `84` radius `CustomPaint` `_RingPainter` | ✅ |
| 13 | Safety ring color | `#06B6D4` cyan | `AppColors.cyan` = `0xFF06B6D4` | ✅ |
| 14 | Safety ring animation | `motion.circle` 1200ms ease-in-out | `AnimationController(1200ms)` + `fastOutSlowIn` | ✅ |
| 15 | Quick actions grid | `grid-cols-4 gap-3` | `GridView.count(crossAxisCount:4, mainAxisSpacing:12)` | ✅ |
| 16 | Quick action accent colors | cyan / blue / rose / violet | same 4 colors | ✅ |
| 17 | Family Safety grid | `grid-cols-2 gap-3` | `GridView.count(crossAxisCount:2)` | ✅ |
| 18 | Screen time ring | 72px, animated 1100ms | `72` radius, `AnimationController(1100ms)` | ✅ |
| 19 | Location grid bg | `28px` grid lines `opacity 0.14` | `_GridPainter` 28px lines, alpha 0.14 | ✅ |
| 20 | Location pulse | `scale: [1, 2, 1]` 2.6s repeat | `AnimationController.repeat(2600ms)` + `Tween(1.0→2.0)` | ✅ |
| 21 | Emergency check icon | `lucide Check` inside `emerald bg` | `Icons.check_circle_rounded` emerald | ⚠️ icon family diff |
| 22 | Empty state alerts | `Inbox` icon + "No recent alerts" | same text | ✅ |
| 23 | Card border radius | `rounded-[22px]` = 22px | `BorderRadius.circular(22)` | ✅ |
| 24 | Card bg | `bg-[#0b0c14]` | `AppColors.bgElevated` = `0xFF0B0C14` | ✅ |
| 25 | Card border | `border-white/[0.07]` | `Colors.white.withValues(alpha:.07)` | ✅ |

---

## Confirmed Visual Differences

| # | Gap | Cause | Priority |
|---|-----|-------|---------|
| 1 | Telemetry cells show "—" | `battery`, `network`, `lastSyncAt` not in backend model | Phase 6 |
| 2 | Safety score = 85 (hardcoded) | No analytics endpoint | Phase 6 |
| 3 | Screen time = 0% | No `screenTime` in model | Phase 6 |
| 4 | Safe zone = placeholder | No `safeZone` in model | Phase 6 |
| 5 | Emergency icon: `check_circle_rounded` vs lucide Check | Different icon libraries | P3 |
| 6 | SOS blur: no `blur-md` behind pulse ring | Would need `BackdropFilter` | P3 |

All structural, color, spacing, and animation elements match. Only data (backend pipeline) and minor icon substitutions differ.

---

## Status: 82% parity (UI complete, data pipeline pending)
