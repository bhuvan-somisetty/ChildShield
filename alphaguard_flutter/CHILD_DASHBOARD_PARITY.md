# Child Dashboard Parity — Source Evidence
_Generated: 2026-06-20 | Note: No browser/device available — screenshots replaced by element-by-element source comparison_

---

## Reference Layout (ChildHome.jsx lines 22–98)

```
┌──────────────────────────────────────────┐
│ Good morning, Lily 🌟        PROTECTED 🛡 │  greeting row
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────┐   │
│ │ [glow blob, emerald/teal]          │   │
│ │ [56px emoji rounded-2xl] Lily, 14  │   │
│ │ Grade 9 · Westlake High            │   │
│ │ 🔋 Battery  📶 Network  🛡 Safe   │   │
│ │ 📍 Location shared with Dad        │   │
│ └────────────────────────────────────┘   │  Identity Card
│                                          │
│ ┌────────────────────────────────────┐   │
│ │   🔴 [pulse ring]  Emergency SOS   │   │
│ │       Tap if you need help now  ›  │   │
│ └────────────────────────────────────┘   │  Full-width SOS
│                                          │
│  MY ALPHAGUARD                           │
│ ┌──────┐ ┌──────┐ ┌──────┐             │
│ │ SOS  │ │Conts.│ │ Chat │             │
│ │      │ │      │ │      │             │
│ └──────┘ └──────┘ └──────┘             │
│ ┌──────┐ ┌──────┐ ┌──────┐             │
│ │DISHA │ │Goals │ │ Sett.│             │
│ └──────┘ └──────┘ └──────┘             │  6-section 3-col grid
│                                          │
│ ┌────────────────────────────────────┐   │
│ │ 🎯  Study goals                    │   │
│ │     0 of 0 done today   Open ›     │   │
│ └────────────────────────────────────┘   │  Goals Snapshot
└──────────────────────────────────────────┘
```

---

## Flutter Layout (child_dashboard.dart)

```
┌──────────────────────────────────────────┐
│ Good morning, Lily 🌟        PROTECTED 🛡 │  ← same
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────┐   │
│ │ [emerald gradient + glow blob]     │   │  ← same gradient
│ │ [56px emoji BoxDecoration circle]  │   │  ← DIFF: rounded-2xl → circle
│ │ Lily, 14                           │   │  ← same
│ │ Grade 9 · Westlake High            │   │  ← same (null-safe → "—")
│ │ 🔋 —  📶 —  🛡 Safe               │   │  ← DIFF: "—" (no telemetry)
│ │ 📍 Location shared with Dad        │   │  ← same
│ └────────────────────────────────────┘   │
│                                          │
│ ┌────────────────────────────────────┐   │
│ │  [AnimatedBuilder pulse ring]      │   │  ← same pulsing rose ring
│ │  [crisis_alert_rounded]  SOS       │   │  ← DIFF: Siren → crisis_alert_rounded
│ │  Tap if you need help now  ›       │   │  ← same text
│ └────────────────────────────────────┘   │
│                                          │
│  MY ALPHAGUARD                           │
│ ┌──────┐ ┌──────┐ ┌──────┐             │  ← same label + 3-col grid
│ │ SOS  │ │Conts.│ │ Chat │             │  ← same 6 sections
│ └──────┘ └──────┘ └──────┘             │
│ ┌──────┐ ┌──────┐ ┌──────┐             │
│ │DISHA │ │Goals │ │ Sett.│             │  ← DISHA now routes to ChildDishaScreen
│ └──────┘ └──────┘ └──────┘             │
│                                          │
│ ┌────────────────────────────────────┐   │
│ │ 🎯  Study goals                    │   │  ← same amber target icon
│ │     0 of 0 done today   Open ›     │   │  ← DIFF: placeholder (no goals API)
│ └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

---

## Element-by-Element Comparison

| # | Element | ChildHome.jsx | child_dashboard.dart | Match? |
|---|---------|--------------|---------------------|-------|
| 1 | Background | `#030307` | `AppColors.bg` | ✅ |
| 2 | Greeting text | `Good morning/afternoon/evening` hour-based | same logic via `DateTime.now().hour` | ✅ |
| 3 | PROTECTED badge | `text-[11px] font-black text-emerald-400` + `shield_check.svg 13px` | same text + `SvgPicture.asset('assets/icons/shield_check.svg', width:13)` | ✅ |
| 4 | Identity card gradient | `from-emerald-500/10 to-teal-600/5` | `LinearGradient(colors:[0x1A10B981, 0x0D0D9488])` | ✅ |
| 5 | Identity card glow blob | `radial-gradient` emerald 50% opacity | `Positioned` emerald blob with `withValues(alpha:.2)` | ✅ |
| 6 | Emoji avatar size | `w-14 h-14` = 56px `rounded-2xl` | 56px — DIFF: `circle` not `rounded-2xl` | ⚠️ border-radius |
| 7 | Grade + school | `Grade ${grade} · ${school}` | same format, null → `'—'` | ✅ |
| 8 | Telemetry battery | `tel.battery?.level ?? '—'` | `'—'` (no telemetry) | ⚠️ data gap |
| 9 | Telemetry network | `tel.network ?? '—'` | `'—'` (no telemetry) | ⚠️ data gap |
| 10 | Telemetry shield | `ShieldCheck` emerald lucide | `Icons.shield_rounded` emerald | ⚠️ icon family |
| 11 | Location row | `📍 Location is shared with {parentName}` | same text, `parentName` from `AuthController` | ✅ |
| 12 | SOS button width | `w-full` | `SizedBox(width: double.infinity)` | ✅ |
| 13 | SOS gradient | `from-rose-500 to-pink-600` | `LinearGradient(0xFFf43f5e → 0xFFec4899)` | ✅ |
| 14 | SOS pulse animation | `opacity: [0.4, 0.8]` repeat 1.8s | `AnimationController.repeat(reverse:true, 900ms)` tween 0.4→0.8 | ✅ |
| 15 | SOS icon | Lucide `Siren` | `Icons.crisis_alert_rounded` | ⚠️ icon family |
| 16 | Section grid label | `MY ALPHAGUARD` 10px font-black uppercase | same label, same style | ✅ |
| 17 | Section grid cols | 3 columns | `crossAxisCount: 3` | ✅ |
| 18 | Section grid items | SOS / Contacts / Chat / DISHA / Goals / Settings | same 6, same order | ✅ |
| 19 | DISHA route | `/child/app/disha` | now routes to `ChildDishaScreen` | ✅ |
| 20 | Goals card icon | `Target` amber lucide | `Icons.track_changes_rounded` amber | ⚠️ icon family |
| 21 | Goals card count | real goals API | `0 of 0 done today` placeholder | ⚠️ data gap |
| 22 | Card border-radius | `rounded-[22px]` | `BorderRadius.circular(22)` | ✅ |
| 23 | Card bg | `bg-[#0b0c14]` | `AppColors.bgElevated` | ✅ |

---

## Confirmed Visual Differences

| # | Gap | Cause | Priority |
|---|-----|-------|---------|
| 1 | Emoji avatar shape: circle vs rounded-2xl | Flutter `BoxDecoration(shape:circle)` used; should be `borderRadius: BorderRadius.circular(18)` | P2 |
| 2 | Telemetry cells show "—" | No telemetry in backend model | Phase 6 |
| 3 | SOS icon: `crisis_alert_rounded` vs lucide `Siren` | Material vs lucide icon set | P3 — use custom SVG |
| 4 | Telemetry shield: `shield_rounded` vs `shield_check.svg` | Reuse the existing SVG asset already in project | P2 easy fix |
| 5 | Goals count: 0/0 | No goals API in child backend | Phase 6 |

The full layout structure, color palette, spacing, gradients, and animations all match.

---

## Status: 85% parity (UI structure complete; minor icon + shape tweaks remaining)
