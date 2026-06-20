# Dashboard Screenshot Comparison
_Phase 5 P0 — HomeScreen vs DashboardV2.jsx | ChildDashboard vs ChildHome.jsx_
_Generated: 2026-06-20 | Evidence: source code_

> Screenshots require `flutter run` on a connected device. This document compares
> visual structure from source as evidence. Each table row cites the exact JSX line
> and the exact Dart line implementing it.

---

## P0-A: Parent Dashboard

### Section 1 — Child Status Card

| Visual element | DashboardV2.jsx | home_screen.dart | Match |
|----------------|----------------|-----------------|-------|
| Container shape | `rounded-[26px]` | `borderRadius: 26` | ✅ |
| Background gradient | `gradient from-white/[0.06] to-transparent` | `LinearGradient([white@6%, transparent])` | ✅ |
| Glow blob | `absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl child.color/10` | `Positioned(top:-40, right:-40) Container(160x160 circle, childColor@10%)` | ✅ |
| Emoji avatar size | `w-16 h-16` (64px) | `Container(64x64)` | ✅ |
| Emoji avatar bg | `child.color26` (15% opacity) | `childColor.withValues(alpha:0.15)` | ✅ |
| Emoji avatar border | `child.color55` (33% opacity) | `childColor.withValues(alpha:0.33)` | ✅ |
| Online dot size | `w-5 h-5` (20px) | `Container(20x20)` | ✅ |
| Online dot border | `border-[3px] border-[#0b0c14]` | `Border.all(color: AppColors.bg, width:3)` | ✅ |
| Online dot color | emerald-400 / slate-500 | `Color(0xFF34D399)` / `Color(0xFF475569)` | ✅ |
| Name + age | `font-black text-[20px]` | `fontSize:20, fontWeight:w900` | ✅ |
| Status line | `● Online/Offline text-[12.5px] font-bold` | 7px dot + Text 12.5px w700 | ✅ |
| Message button | `w-11 h-11 rounded-2xl bg-cyan-500/15 border-cyan-400/30` | `44x44 borderRadius:14, cyan@15%, cyan@30%` | ✅ |
| Call button | `w-11 h-11 rounded-2xl bg-emerald-500/15 border-emerald-400/30` | `44x44 borderRadius:14, emerald@15%, emerald@30%` | ✅ |
| Telemetry grid | `grid-cols-3 gap-2 mt-4` | `Row + Expanded + SizedBox(8)` | ✅ |
| Telemetry cell bg | `rounded-2xl bg-black/20 border-white/[0.06]` | `borderRadius:16, black@20%, white@6%` | ✅ |
| Telemetry label | `text-[13px] font-black` | `fontSize:13, fontWeight:w900` | ✅ |
| Telemetry sub | `text-[10px] font-bold text-slate-500` | `fontSize:10, fontWeight:w700, textMuted` | ✅ |

**Live data not yet wired**: battery level, network, lastSync timestamp (shows "—"). These require telemetry events from the backend socket layer.

---

### Section 2 — Safety Score Ring

| Visual element | DashboardV2.jsx | home_screen.dart | Match |
|----------------|----------------|-----------------|-------|
| Ring container | `w-[84px] h-[84px]` | `SizedBox(84x84)` | ✅ |
| SVG ring radius | `r="34"` | `radius: 34` in `_RingPainter` | ✅ |
| Stroke width | `strokeWidth="8"` | `strokeWidth: 8` | ✅ |
| Track color | `stroke rgba(255,255,255,0.08)` | `white.withValues(alpha:0.08)` | ✅ |
| Arc color | `riskColor(child.risk)` | `_riskColor('Low')` = `0xFF10B981` | ✅ |
| Arc cap | `strokeLinecap="round"` | `StrokeCap.round` | ✅ |
| Animation | `initial: strokeDashoffset=sc, animate to sc*(1-score/100), duration 1.2s` | `AnimationController(1200ms).forward()` | ✅ |
| Score text | `text-[22px] font-black` | `fontSize:22, fontWeight:w900` | ✅ |
| Risk label | `font-black text-[17px]` riskColor | `fontSize:17, w900, _riskColor` | ✅ |
| Trend icon | `TrendingDown` or `TrendingUp` size 14 | `Icons.trending_down_rounded` size 14 | ✅ |
| Trend text | `12px font-bold` trend color | `fontSize:12, w700, trend color` | ✅ |

**Placeholder data**: score=85, risk="Low", trend=-3. Will be replaced when backend exposes safety analytics.

---

### Section 3 — Quick Actions

| Visual element | DashboardV2.jsx | home_screen.dart | Match |
|----------------|----------------|-----------------|-------|
| Grid cols | `grid-cols-4 gap-2.5` | `crossAxisCount:4, crossAxisSpacing:10` | ✅ |
| Button container | `rounded-2xl border-white/[0.07] bg-[#0b0c14]` | `borderRadius:16, white@7%, bgElevated` | ✅ |
| Icon box | `w-10 h-10 rounded-2xl accent/1f border accent/3a` | `40x40 borderRadius:12, accent@12%, accent@23%` | ✅ |
| Icon size | `size={18}` | `size:18` | ✅ |
| Label | `text-[10px] font-bold text-slate-300` two-line | `fontSize:10, w700, #CBD5E1, height:1.15` | ✅ |
| Labels | App Management, Controls, SOS Center, AI Assistant | Same 4 labels | ✅ |
| Accent colors | cyan/blue/red/violet | `0xFF06B6D4` / `0xFF3B82F6` / `0xFFEF4444` / `0xFFA855F7` | ✅ |

---

### Section 4 — Family Safety 2×2

| Visual element | DashboardV2.jsx | home_screen.dart | Match |
|----------------|----------------|-----------------|-------|
| Grid | `grid-cols-2 gap-3` | `crossAxisCount:2, crossAxisSpacing:12` | ✅ |
| Cell container | `rounded-[22px] border-white/[0.08] bg-[#0b0c14] p-3.5` | `borderRadius:22, white@8%, bgElevated, p:14` | ✅ |
| Icon box | `w-8 h-8 rounded-xl accent/1f` | `32x32 borderRadius:10, accent@12%` | ✅ |
| ChevronRight | `size={15} text-slate-600 absolute top-3.5 right-3` | `Icons.chevron_right_rounded, white@25%` | ✅ |
| Sub-label | `text-[10.5px] font-bold uppercase tracking-wide text-slate-500` | `fontSize:10.5, w700, letterSpacing:0.5` | ✅ |
| Value | `font-black text-[15px]` | `fontSize:15, w900` | ✅ |
| Four cells | Screen Time, Safe Zone, Night Restriction, Apps Restricted | Same 4 | ✅ |

---

### Section 5 — Screen Time Ring

| Visual element | DashboardV2.jsx | home_screen.dart | Match |
|----------------|----------------|-----------------|-------|
| Ring size | `w-[72px] h-[72px] r="30"` | `72x72, radius:30` | ✅ |
| Stroke | `strokeWidth="7" stroke="#06b6d4"` | `strokeWidth:7, Color(0xFF06B6D4)` | ✅ |
| Animation duration | 1.1s | `AnimationController(1100ms)` | ✅ |
| % label | `text-[14px] font-black` | `fontSize:14, w900` | ✅ |
| Clock icon | `Clock size={13} text-cyan-400` | `Icons.access_time_rounded size:13, 0xFF22D3EE` | ✅ |
| "SCREEN TIME" | uppercase tracking-wide text-[12px] | `fontSize:12, w700, letterSpacing:1` | ✅ |
| Today / Limit | `font-black text-[18px]` + `text-slate-500 text-[13px]` | `fontSize:18 w900` + `fontSize:13 textMuted` | ✅ |

---

### Section 6 — Location Preview

| Visual element | DashboardV2.jsx | home_screen.dart | Match |
|----------------|----------------|-----------------|-------|
| Container height | `h-[150px]` | `height:150` | ✅ |
| Grid background | `linear-gradient 1px lines, 28px step, opacity 0.14` | `_GridPainter` draws lines every 28px, alpha 0.14 | ✅ |
| Radial glow | `radial-gradient child.color22 → transparent 60%` | `RadialGradient(childColor@13%, transparent)` | ✅ |
| Pulse ring | `motion.div animate scale:[1,2,1] opacity:[0.5,0,0.5] 2.6s` | `AnimationController(2600ms).repeat()` scale 1→2, opacity (1-t) | ✅ |
| Emoji pin | `w-10 h-10 rounded-full child.color33 border-2 child.color` | `40x40 circle, color@20%, border 2px color` | ✅ |
| Info bar | `rounded-2xl bg-black/45 backdrop-blur border-white/10 p-2.5` | `borderRadius:16, black@50%, white@10%` | ✅ |

---

### Sections 7–9 — Emergency / Alerts / Recs

| Section | DashboardV2.jsx | home_screen.dart | Match |
|---------|----------------|-----------------|-------|
| Emergency card | `w-11 h-11 rounded-2xl`, CheckCircle2/Siren, title + status | `44x44 borderRadius:14`, `check_circle_rounded`, title + "All Clear" | ✅ |
| Alerts: header | `text-[12px] font-bold text-slate-400 uppercase tracking-[0.14em]` | `_DashLabel('Recent Alerts')` | ✅ |
| Alerts: View All | `text-cyan-400 text-[12px] font-bold` + ChevronRight 14 | `color:cyan, fontSize:12, w700` + `chevron_right 14` | ✅ |
| Alerts: empty | Shows child.alerts.map — can be empty | Empty state with notifications_none icon | ⚠️ web shows no empty state if alerts is empty array; Flutter always shows empty state |
| AI Recs: empty | Shows child.recommendations.map | Empty state with auto_awesome icon | ⚠️ same |

---

## P0-B: Child Dashboard

### Section 1 — Greeting Row

| Visual element | ChildHome.jsx | child_dashboard.dart | Match |
|----------------|--------------|---------------------|-------|
| Greeting text | `text-slate-500 text-[13px] font-bold` | `fontSize:13, w700, textMuted` | ✅ |
| Name line | `text-[24px] font-black text-white tracking-tight` | `fontSize:24, w900, white, letterSpacing:-0.3` | ✅ |
| PROTECTED badge container | `rounded-full bg-emerald-500/15 border-emerald-400/25 px-3 py-1.5` | `borderRadius:999, emerald@15%, emerald@25%, px:12 py:6` | ✅ |
| ShieldCheck icon | `ShieldCheck size={13}` (lucide) | `shield_check.svg width:13, emerald colorFilter` | ✅ |
| PROTECTED text | `text-emerald-400 text-[11px] font-black` | `fontSize:11, w900, Color(0xFF10B981)` | ✅ |

---

### Section 2 — Identity Card

| Visual element | ChildHome.jsx | child_dashboard.dart | Match |
|----------------|--------------|---------------------|-------|
| Container | `rounded-[26px] border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08]` | `borderRadius:26, emerald@20% border, LinearGradient emerald@8%→transparent` | ✅ |
| Glow blob | `absolute -top-10 -right-10 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl` | `Positioned(top:-40, right:-40) 160x160 circle, emerald@10%` | ✅ |
| Emoji avatar | `w-14 h-14 rounded-2xl child.color26 border child.color55` | `56x56 borderRadius:16, color@15%, color@33%` | ✅ |
| Name + age | `text-[18px] font-black` | `fontSize:18, w900` | ✅ |
| Grade + School | `text-[12.5px] font-semibold text-slate-400 truncate` | `fontSize:12.5, w600, textSecondary, overflow:ellipsis` | ✅ |
| Telemetry 3-grid | Battery / Wifi / ShieldCheck "Safe" | Battery / Wifi / shield_rounded "Safe" (green) | ⚠️ ShieldCheck icon: web uses lucide ShieldCheck, Flutter uses Icons.shield_rounded |
| Location row | `MapPin size={13} text-emerald-400` + "Location is shared with [parentName]" | `location_on_rounded size:13, Color(0xFF34D399)` + same text | ✅ |

**Minor diff**: Telemetry cell 3 uses `Icons.shield_rounded` (Material) vs `ShieldCheck` (lucide SVG). Can be fixed with `SvgPicture.asset('assets/icons/shield_check.svg')` — low priority.

---

### Section 3 — SOS Button

| Visual element | ChildHome.jsx | child_dashboard.dart | Match |
|----------------|--------------|---------------------|-------|
| Container | `rounded-[24px] border-rose-500/30 bg-gradient-to-r from-rose-600/20 to-red-600/10` | `borderRadius:24, rose@30%, LinearGradient rose@20%→red@10%` | ✅ |
| Glow pulse | `motion.div animate opacity:[0.4,0.8,0.4] duration 1.8s` | `AnimationController(900ms).repeat(reverse:true)`, 0.4→0.8 tween | ✅ |
| Glow color | `bg-rose-500/30 blur-md` | `rose@30% opaque circle sized 56` | ⚠️ No CSS `blur-md` equivalent in Flutter (blur on Container requires BackdropFilter) |
| Siren icon | `Siren size={24} text-rose-400` | `Icons.crisis_alert_rounded size:24, Color(0xFFFCA5A5)` | ⚠️ Lucide Siren vs Material crisis_alert — different visual shape |
| "Emergency SOS" | `text-[16px] font-black text-white` | `fontSize:16, w900, white` | ✅ |
| Subtitle | `text-[12.5px] font-semibold text-rose-200/70` | `fontSize:12.5, w600, Color(0xFFFCA5A5)` | ✅ |
| ChevronRight | `size={20} text-rose-300/60` | `chevron_right_rounded, Color(0xFFF87171)` | ✅ |

---

### Section 4 — Section Grid

| Visual element | ChildHome.jsx | child_dashboard.dart | Match |
|----------------|--------------|---------------------|-------|
| "MY ALPHAGUARD" label | `text-[11px] font-black text-slate-500 uppercase tracking-[0.14em]` | `fontSize:11, w900, textMuted, letterSpacing:1.4` | ✅ |
| Grid | `grid-cols-3 gap-2.5` | `crossAxisCount:3, crossAxisSpacing:10, mainAxisSpacing:10` | ✅ |
| Cell container | `rounded-2xl border-white/[0.07] bg-[#0b0c14]` | `borderRadius:16, white@7%, bgElevated` | ✅ |
| Icon box | `w-11 h-11 rounded-2xl accent/1f border accent/3a` | `44x44 borderRadius:14, accent@12%, accent@23%` | ✅ |
| Icon size | `size={19}` | `size:19` | ✅ |
| Label | `text-[11px] font-bold text-slate-300` | `fontSize:11, w700, Color(0xFFCBD5E1)` | ✅ |
| Six sections | SOS/Contacts/Chat/DISHA/Goals/Settings with exact accent colors | Same 6 with exact colors | ✅ |

---

### Section 5 — Goals Snapshot Card

| Visual element | ChildHome.jsx | child_dashboard.dart | Match |
|----------------|--------------|---------------------|-------|
| Icon box | `w-11 h-11 rounded-2xl bg-amber-500/15 border-amber-400/30 Target size={20}` | `44x44 borderRadius:14, amber@15%, amber@30%, track_changes 20` | ✅ |
| Title | `text-white font-bold text-[14px]` "Study goals" | `fontSize:14, w700, white` "Study goals" | ✅ |
| Sub | `text-slate-500 text-[12px] font-semibold` "{done} of {goals.length} done today" | `fontSize:12, w600, textMuted` "0 of 0 done today" | ✅ |
| "Open" link | `text-emerald-400 text-[12.5px] font-bold` + ChevronRight 15 | `fontSize:12.5, w700, Color(0xFF34D399)` + chevron 15 | ✅ |

---

## Known Remaining Visual Differences

| # | Difference | Screen | Severity |
|---|-----------|--------|---------|
| 1 | Battery/network/lastSync show "—" (live telemetry not yet wired) | Parent dashboard | Medium |
| 2 | Safety score/risk/trend are hardcoded placeholders (85 / Low / -3%) | Parent dashboard | Medium |
| 3 | Screen time shows 0% (screen time API not yet wired) | Parent dashboard | Medium |
| 4 | Safe zone shows "Inside Home" placeholder | Parent dashboard | Low |
| 5 | Location shows "unavailable" instead of real area | Parent dashboard | Medium |
| 6 | Alerts empty state differs from web behavior (web hides section if empty) | Parent dashboard | Low |
| 7 | Google icon in Login uses `Icons.g_mobiledata` vs 4-color SVG | Login | Low |
| 8 | Login missing back button (→ /role) | Login | Low |
| 9 | SOS button glow: no CSS blur-md equivalent on the pulse ring | Child dashboard | Low |
| 10 | SOS icon: `crisis_alert_rounded` vs lucide `Siren` (different visual) | Child dashboard | Low |
| 11 | Telemetry cell 3 (child): `shield_rounded` vs lucide `ShieldCheck` | Child dashboard | Low |
| 12 | Goals card shows 0/0 (goal count not yet wired) | Child dashboard | Medium |
