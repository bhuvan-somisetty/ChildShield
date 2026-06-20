# Dashboard Parity Plan — Phase 5 P0
_Generated: 2026-06-20_

---

## Target

| File to rewrite | Matches | Evidence |
|----------------|---------|---------|
| `lib/presentation/screens/home_screen.dart` | `DashboardV2.jsx` | Audit in FINAL_UI_PARITY_AUDIT.md |
| `lib/presentation/screens/child/child_dashboard.dart` | `ChildHome.jsx` | Audit in FINAL_UI_PARITY_AUDIT.md |

---

## P0-A: HomeScreen → DashboardV2

### Layout sections (in order from DashboardV2.jsx)

| # | Section | JSX source lines | Flutter approach | Data source |
|---|---------|-----------------|------------------|------------|
| 1 | Child Status Card | 69–98 | `_ChildStatusCard` widget | `FamilyController.selectedChild` |
| 2 | Safety Score Ring | 100–113 | `CustomPaint` with `_RingPainter`, `AnimationController` | Placeholder: 85, "Low Risk", -3% |
| 3 | Quick Actions 4-col | 116–127 | `GridView` 4 cols, `_QuickBtn` | Routes: /sos, AssistantScreen, TODO snackbars |
| 4 | Family Safety 2×2 | 129–147 | `GridView` 2 cols, `_SafeCell` | Placeholder data |
| 5 | Screen Time Ring | 149–165 | `CustomPaint` with `_RingPainter`, `AnimationController` | Placeholder: 0% |
| 6 | Location Preview | 167–183 | `CustomPaint` grid + emoji pin, `AnimationController` repeat | Placeholder area "—" |
| 7 | Emergency Status | 186–195 | `_EmerCard` | Placeholder: ok=true |
| 8 | Recent Alerts | 197–211 | Empty state: "No recent alerts" | Empty list |
| 9 | AI Recommendations | 213–223 | Empty state | Empty list |

### Data mapping

| DashboardV2 field | Flutter source | Status |
|-------------------|---------------|--------|
| `child.name` | `FamilyController.selectedChild.name` | ✅ real |
| `child.age` | `selectedChild.age` | ✅ real |
| `child.emoji` | `selectedChild.emoji` | ✅ real |
| `child.color` | `selectedChild.color` (hex string) | ✅ real (parse via `_hex()`) |
| `child.online` | `selectedChild.online` | ✅ real |
| `child.battery` | not in backend model | ⚠️ null → show "—" |
| `child.network` | not in backend model | ⚠️ null → show "—" |
| `tel.lastSyncAt` | not in backend model | ⚠️ null → show "—" |
| `child.safetyScore` | not in backend model | ⚠️ 85 placeholder |
| `child.risk` | not in backend model | ⚠️ "Low" placeholder |
| `child.trend` | not in backend model | ⚠️ -3 placeholder (good = green TrendingDown) |
| `child.screenTime.today` | not in backend model | ⚠️ 0 placeholder |
| `setting.screenLimit` | not in backend model | ⚠️ Infinity → "Unlimited" |
| `child.safeZone` | not in backend model | ⚠️ placeholder |
| `child.location.area` | not in backend model | ⚠️ "—" |
| `child.emergency` | not in backend model | ⚠️ ok=true, "All Clear" |
| `child.alerts` | not in backend model | ⚠️ empty |
| `child.recommendations` | not in backend model | ⚠️ empty |

### Animations

| DashboardV2 animation | Flutter implementation |
|----------------------|----------------------|
| `motion.circle` safety ring (1.2s ease) | `AnimationController(1200ms)` + `CurvedAnimation(Curves.fastOutSlowIn)` |
| `motion.circle` screen time ring (1.1s) | `AnimationController(1100ms)` + same curve |
| Location pulse `scale: [1, 2, 1]` repeat 2.6s | `AnimationController.repeat(reverse:false)` sequence |
| `ago()` refresh every 5s | `Timer.periodic(5s)` → `setState` |

### Quick action routes

| Label | frontend-v2 route | Flutter action |
|-------|------------------|---------------|
| App Management | `/app/app-management` | Snackbar "Coming soon" (route not yet built) |
| Controls | `/app/controls` | Snackbar "Coming soon" |
| SOS Center | `/app/emergency` | `Navigator.push(ChildSosScreen)` via existing `/sos` |
| AI Assistant | `/app/ai` | Push `AssistantScreen()` |

---

## P0-B: ChildDashboard → ChildHome

### Layout sections (in order from ChildHome.jsx)

| # | Section | JSX source lines | Flutter approach | Data source |
|---|---------|-----------------|------------------|------------|
| 1 | Greeting row | 31–37 | Row: time greeting + name, "PROTECTED" badge | `DateTime.now().hour`, `auth.child` |
| 2 | Identity + status card | 39–63 | Gradient container, emoji avatar, grade/school, telemetry 3-grid, location row | `auth.child` full object |
| 3 | Full-width SOS button | 65–73 | Gradient button, `AnimationController.repeat()` glow blur | `Navigator.push(ChildSosScreen)` |
| 4 | Section grid (6 items) | 75–86 | `GridView` 3-col, `_SectionBtn` | Routes to existing child screens |
| 5 | Goals snapshot card | 88–93 | `_GoalsCard` | Placeholder 0/0 |

### Data mapping

| ChildHome field | Flutter source | Status |
|----------------|---------------|--------|
| `profile.name` | `auth.child?.name` | ✅ real |
| `profile.age` | `auth.child?.age` | ✅ real |
| `profile.emoji` | `auth.child?.emoji` | ✅ real |
| `profile.color` | `auth.child?.color` | ✅ real |
| `profile.grade` | `auth.child?.grade` | ✅ real (may be null → "—") |
| `profile.school` | `auth.child?.school` | ✅ real (may be null → "—") |
| `profile.parentName` | `auth.parent?.name` | ✅ via AuthController |
| `tel.battery.level` | not available | ⚠️ "—" |
| `tel.network` | not available | ⚠️ "—" |
| `goals` | not in child model | ⚠️ 0/0 placeholder |

### Section grid mapping

| Label | frontend-v2 route | Flutter route |
|-------|------------------|--------------|
| SOS | `/child/app/sos` | Push `ChildSosScreen` |
| Contacts | `/child/app/contacts` | Push `ChildContactsScreen` |
| Chat | `/child/app/chat` | Snackbar "Coming soon" |
| DISHA | `/child/app/disha` | Snackbar "Coming soon" |
| Goals | `/child/app/goals` | Push `ChildGoalsScreen` |
| Settings | `/child/app/settings` | Push `ChildSettingsScreen` |

### Animations

| ChildHome animation | Flutter implementation |
|--------------------|----------------------|
| SOS glow pulse `opacity: [0.4, 0.8, 0.4]` repeat 1.8s | `AnimationController.repeat(reverse:true)` 900ms |
| No other animations | — |

---

## Files modified

| File | Action |
|------|--------|
| `lib/presentation/screens/home_screen.dart` | **REWRITE** |
| `lib/presentation/screens/child/child_dashboard.dart` | **REWRITE** |

No other files need changes for P0-A/P0-B.
