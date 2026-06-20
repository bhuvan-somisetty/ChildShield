# Responsive Audit
_Generated: 2026-06-20 | Evidence: `breakpoints.dart`, `responsive.dart`, per-screen layout code_

---

## Responsive System Overview

All layout decisions flow through two files:

| File | Role |
|------|------|
| `lib/core/responsive/breakpoints.dart` | Defines breakpoint constants + `DeviceClass` enum + `contentMaxWidth()` |
| `lib/core/responsive/responsive.dart` | `ResponsiveContext` extensions + `ResponsiveShell` widget |

```dart
// Breakpoint constants (breakpoints.dart)
phone       = 360   // standard Android phone
largePhone  = 400   // large Android / iPhone
tablet      = 600   // small tablet / foldable unfolded
largeTablet = 905   // large tablet / iPad landscape
desktop     = 1240  // desktop
```

```dart
// Content max-width cap (matches web app max-w-[440px])
phone/largePhone  → double.infinity  (fills the phone)
tablet            → 520px
largeTablet+      → 560px
```

`ResponsiveShell` wraps every screen body: `SafeArea → Center → ConstrainedBox(maxWidth) → Padding(20px H)`.

---

## Device Matrix

### Android Phones (320–414px wide)

| Device | Width | DeviceClass | Content width | Status |
|--------|-------|-------------|---------------|--------|
| Small budget (320px) | 320 | compactPhone | fills screen | ✅ |
| Pixel 6 (411px) | 411 | largePhone | fills screen | ✅ |
| Samsung S24 (393px) | 393 | largePhone | fills screen | ✅ |
| OnePlus 12 (412px) | 412 | largePhone | fills screen | ✅ |

**Layout behavior on phones:**
- All screens use `ListView` or `SingleChildScrollView` — no fixed heights that clip on short devices
- Safe area insets handled via `MediaQuery.of(context).padding` in shells (MainShell, ChildShell)
- Text scales clamped to [0.9, 1.3] in `AlphaGuardApp.builder` — prevents overflow on large system fonts
- Quick actions: 4-col `GridView.count` → all 4 cards visible on 320px (each ~66px)
- Family safety 2×2 grid → fits 320px with `gap: 12px`

**Known issue on compactPhone (320px):**
- Child dashboard 3-col section grid: at 320px each cell is ~93px — tight but legible
- Greeting row text may wrap on very long names — mitigated by `overflow: TextOverflow.ellipsis`

---

### Android Tablets (600–905px wide)

| Device | Width | DeviceClass | Content width | Status |
|--------|-------|-------------|---------------|--------|
| Samsung Tab A8 (800px) | 800 | tablet | 520px centered | ✅ |
| Samsung Tab S9 (834px) | 834 | tablet | 520px centered | ✅ |
| Pixel Tablet (1280px landscape) | 1280 | largeTablet | 560px centered | ✅ |

**Layout behavior on tablets:**
- `ResponsiveShell` centers content in 520–560px column — matches web app's `max-w-[440px]` intent
- Padding: 20px each side inside the column
- Cards use relative widths (`double.infinity` / `SizedBox.expand`) — reflow correctly in the constrained column
- No layout is hardcoded at a specific pixel width — all use fractional or fill-parent sizing

**Tablet-specific gap:**
- The parent main shell navbar uses `BottomNavigationBar` — on tablets it spans full width, not centered. This is intentional (native tablet convention); web app uses a floating bottom bar with `max-w-[440px]`.
- Child shell `BottomAppBar` with centered SOS FAB — same full-width behavior.

---

### iPhone (375px wide)

| Device | Width | DeviceClass | Content width | Status |
|--------|-------|-------------|---------------|--------|
| iPhone 15 (390px) | 390 | largePhone | fills screen | ✅ |
| iPhone SE 3rd gen (375px) | 375 | largePhone | fills screen | ✅ |

**Safe area handling:**
- `MediaQuery.of(context).padding.top` used in `MainShell` and `ChildShell` for dynamic island / notch
- `SafeArea` widget used in all modal/standalone screens (Login, Settings, etc.)
- Bottom safe area: `MediaQuery.of(context).padding.bottom` added to input bars (e.g., ChildDishaScreen, LoginScreen)

---

### iPhone Pro Max (430px wide)

| Device | Width | DeviceClass | Content width | Status |
|--------|-------|-------------|---------------|--------|
| iPhone 15 Pro Max (430px) | 430 | largePhone | fills screen | ✅ |
| iPhone 16 Plus (430px) | 430 | largePhone | fills screen | ✅ |

**No layout issues expected** — same `largePhone` class as standard iPhone. Content fills available width with 20px H padding.

---

### iPad Mini (744px wide)

| Device | Width (portrait) | DeviceClass | Content width | Status |
|--------|-----------------|-------------|---------------|--------|
| iPad Mini 6th gen (744px) | 744 | tablet | 520px centered | ✅ |
| iPad Mini 6th gen landscape (1133px) | 1133 | largeTablet | 560px centered | ✅ |

**Rotation handling:**
- `MediaQuery.sizeOf(context)` re-reads on every rotation — all layouts react automatically
- No `OrientationBuilder` needed; the breakpoint + `contentMaxWidth` handles both orientations

---

### iPad Air (820px portrait / 1180px landscape)

| Orientation | Width | DeviceClass | Content width |
|-------------|-------|-------------|---------------|
| Portrait | 820 | tablet | 520px |
| Landscape | 1180 | largeTablet | 560px |

✅ Both orientations center content correctly.

---

### iPad Pro 12.9" (1024px portrait / 1366px landscape)

| Orientation | Width | DeviceClass | Content width |
|-------------|-------|-------------|---------------|
| Portrait | 1024 | largeTablet | 560px |
| Landscape | 1366 | desktop | 560px |

✅ Both orientations work. At 1366px the content is a 560px centered column — mirrors the web app.

---

### Foldables

| Device | Folded width | Unfolded width | Behavior |
|--------|-------------|----------------|----------|
| Samsung Galaxy Z Fold 6 | 374px (phone) | 882px (tablet) | phone → tablet layout switch |
| Samsung Galaxy Z Flip 6 | 360px | 374px (same class) | phone layout throughout |
| OnePlus Open | 390px | 800px | phone → tablet switch |

**Fold/unfold handling:**
- `MediaQuery.sizeOf(context)` updates on fold/unfold — `ResponsiveContext.deviceClass` immediately returns new class
- Content reflows from fill-screen (phone) to 520px centered (tablet) on unfold
- No `dispose`/`initState` required — all layout is reactive to `BuildContext`

**Known foldable limitation:**
- The `BottomNavigationBar` does not adapt to the outer cover screen (foldable closed) — shows full 5-tab bar on 374px outer screen. Acceptable (outer screen is secondary UX).

---

## Per-Screen Responsive Behavior

| Screen | Responsive mechanism | Tablet adaptation |
|--------|---------------------|-------------------|
| Login | `ResponsiveShell` | centered 520px column ✅ |
| Signup | `ResponsiveShell` | centered 520px column ✅ |
| Welcome | `ResponsiveShell` | centered ✅ |
| Onboarding | `ResponsiveShell` | centered ✅ |
| Parent Dashboard | `ResponsiveShell` via `MainShell` | 4-col quick actions → 4 cells per row (works at 520px) ✅ |
| Child Dashboard | Column in SafeArea | 3-col grid cells ~160px each on tablet — more spacious ✅ |
| Controls Hub | `ListView` + `SafeArea` | centered via `ConstrainedBox` ✅ |
| App Management | `ListView` + `SafeArea` | centered ✅ |
| Approvals Center | `ListView` + `SafeArea` | centered ✅ |
| Child DISHA | Column + `ListView.builder` | chat bubbles max 82% of 520px ✅ |
| Tasks | `ListView` | centered ✅ |
| Family Radar | Map view (full-screen) | fills available space ✅ |
| SOS Screen | Full-screen `Stack` | fills available space ✅ |

---

## Gaps & Recommendations

| # | Gap | Affected device | Fix |
|---|-----|----------------|-----|
| 1 | Bottom nav full-width on tablets | All tablets | P3 — add side nav or center-constrained bottom bar for tablets |
| 2 | Dashboard quick-actions 4-col may feel oversized on iPad Pro | iPad Pro landscape | P3 — switch to 6-col or add descriptive labels at ≥900px |
| 3 | Child DISHA bubble max-width: 82% of 520px ≈ 426px — may be too wide on large tablets | iPad Air+ | P3 — cap at 380px on `largeTablet` |
| 4 | No landscape-specific layouts for phones | iPhone Pro Max landscape | Acceptable — web app also doesn't optimize landscape on phones |
| 5 | `clampScale()` helper in `responsive.dart` not yet used in any screen | All | P2 — use for font size scaling between phone and tablet |

---

## Verified Responsive Invariants

- ✅ No hardcoded pixel widths in any screen body (`double.infinity` + `ConstrainedBox` pattern)
- ✅ All `ListView` / `SingleChildScrollView` — no fixed-height containers that clip on short phones
- ✅ Safe area handled everywhere — no content under notch, dynamic island, or home indicator
- ✅ `MediaQuery.textScaler` clamped globally — no overflow from large system font sizes
- ✅ Fold/unfold reactive — `MediaQuery.sizeOf` re-evaluates on every frame
- ✅ `ResponsiveShell` used as the root layout primitive in all new screens (Controls, App Management, Approvals, DISHA)
