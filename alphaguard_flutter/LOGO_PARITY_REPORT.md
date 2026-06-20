# AlphaGuard Logo Parity Report

_Audited: 2026-06-20_

---

## 1. Source of Truth — frontend-v2

### How the logo is defined
The AlphaGuard logo is **entirely code-rendered in JSX** using the `lucide-react` library (v1.17.0).
There is no physical PNG, SVG, or image file in the repository — the logo is composed at runtime.

### Canonical brand component
**File:** `frontend-v2/src/components/ui/Brand.jsx`

```jsx
// Logo box — 52×52, rounded-2xl
<div className="inline-flex items-center justify-center rounded-2xl
  bg-gradient-to-br from-blue-600/25 to-cyan-500/10
  border border-blue-500/30
  shadow-[0_0_28px_rgba(37,99,235,0.3)]"
  style={{ width: 52, height: 52 }}>
  <Shield size={26} className="text-cyan-400" />
</div>
```

### Exact SVG path (lucide-react v1.17.0 — `Shield`)
Extracted from `node_modules/lucide-react/dist/esm/icons/shield.mjs`:

```
d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6
   a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0
   C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
```

SVG attributes: `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`,
`stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"`

### ShieldCheck variant (Welcome hero + onboarding illustrations)
Same shield path + checkmark path:
```
d="m9 12 2 2 4-4"
```
Used at: Welcome.jsx hero (56px, strokeWidth=1.8, text-cyan-300), OnboardingArt.jsx AiArt, PrivacyArt.

---

## 2. Current State — Flutter App

| Location | Current icon | Correct icon | Status |
|----------|-------------|--------------|--------|
| SplashScreen | `Icons.verified_user_outlined` | Lucide `Shield` | ❌ Wrong |
| WelcomeScreen hero | `Icons.verified_user_outlined` | Lucide `ShieldCheck` | ❌ Wrong |
| AppLogo (Login/Signup/Role) | `Icons.verified_user_outlined` | Lucide `Shield` | ❌ Wrong |
| RoleSelectionScreen badge | `Icons.verified_user_outlined` | Lucide `Shield` (badge pill) | ❌ Wrong |
| OnboardingScreen AiArt | `Icons.verified_user_outlined` | Lucide `ShieldCheck` | ❌ Wrong |
| OnboardingScreen PrivacyArt | `Icons.shield_outlined` | Lucide `ShieldCheck` | ❌ Wrong |
| ParentDashboard | N/A | Lucide `Shield` (in header) | — |
| ChildDashboard | N/A | Lucide `Shield` (in header) | — |
| Android launcher (mipmap-*) | Flutter default blue logo | AlphaGuard Shield | ❌ Wrong |
| Android adaptive icon | Not configured | AlphaGuard Shield vector | ❌ Missing |

---

## 3. Solution

### In-app logo (all screens)
**Approach:** Create SVG asset files + add `flutter_svg` package.

Files to create:
- `assets/icons/shield.svg` — exact lucide Shield path (Brand mark)
- `assets/icons/shield_check.svg` — lucide ShieldCheck (Welcome hero)

`flutter_svg` renders the exact path at any size with any color — identical to
how lucide-react renders it in the browser.

### AppLogo widget
Replace `Icon(Icons.verified_user_outlined)` with `SvgPicture.asset('assets/icons/shield.svg', colorFilter: ColorFilter.mode(AppColors.cyan, BlendMode.srcIn))`.

The `AppLogo` widget then becomes the single authoritative source used by:
Splash · Welcome · Login · Signup · RoleSelection · ParentSetup · ConnectChild · ChildSetup

### Android launcher icon
**Approach:** Android vector drawable (API 26+ adaptive icon).

Files to create:
- `android/app/src/main/res/drawable/ic_launcher_foreground.xml` — Shield vector on transparent
- `android/app/src/main/res/drawable/ic_launcher_background.xml` — dark blue gradient
- `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` — adaptive icon manifest
- `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml` — round variant

**Note:** Legacy mipmap PNGs (hdpi/mdpi/xhdpi/xxhdpi/xxxhdpi) remain as API<26 fallback.
To replace them with pixel-perfect icons, run `flutter_launcher_icons` after adding
a proper high-resolution PNG source — outside the scope of this phase.

---

## 4. Design Spec (for the Flutter logo box)

| Property | frontend-v2 value | Flutter equivalent |
|----------|------------------|-------------------|
| Box size | 52×52 px (Brand) / 112×112 (Welcome hero) | Responsive clampScale |
| Corner radius | `rounded-2xl` = 16px at 52px = 30% | `borderRadius: size * 0.30` |
| Background | `from-blue-600/25 to-cyan-500/10`, `br` | `LinearGradient([0x402563EB, 0x1A06B6D4])` |
| Border | `border-blue-500/30` | `Border.all(color: Color(0x4D3B82F6))` |
| Shadow | `0 0 28px rgba(37,99,235,0.3)` | `BoxShadow(color: 0x4D2563EB, blurRadius: 28)` |
| Icon color | `text-cyan-400` = `#22D3EE` | `AppColors.cyan` = `#06B6D4` (close) |
| Icon size | 26 (Brand) / 56 (Welcome) | `size * 0.50` |
| Stroke width | 2 (Shield) / 1.8 (Welcome ShieldCheck) | via colorFilter |

---

## 5. One Logo, Everywhere

After implementation, every surface will use the exact lucide Shield SVG path:

```
Splash → AppLogo (shield.svg)
Welcome → hero (shield_check.svg, large)
Onboarding → AiArt + PrivacyArt (shield_check.svg)
RoleSelection → AppLogo badge pill (shield.svg)
Login / Signup → AppLogo (shield.svg)
ParentSetup → AppLogo (shield.svg)
ConnectChild → AppLogo (shield.svg)
ParentDashboard header → AppLogo small inline (shield.svg)
ChildDashboard header → AppLogo small inline (shield.svg)
Android launcher → vector drawable (shield path)
```
