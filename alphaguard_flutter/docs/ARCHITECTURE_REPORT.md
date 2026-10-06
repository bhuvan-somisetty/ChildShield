# AlphaGuard Flutter — Architecture Report

**Date:** 2026-06-14 · **Pattern:** Clean architecture (layered) + Provider DI + declarative routing.

## 1. Layering

```
presentation (screens, widgets)        ← Flutter/UI only
        │ uses
state (AuthController : ChangeNotifier) ← UI-facing state, no business rules
        │ delegates
services (auth, socket, lifecycle, update)  ← orchestration, no UI imports
        │ uses
data (repositories → api_client + models)   ← API contract, JSON↔model
        │ talks to
core (config, theme, responsive, utils)     ← cross-cutting, dependency-free
```

**Dependency rule:** dependencies point inward/downward only. `presentation → state → services → data → core`. The data and services layers contain **no Flutter imports** (except `foundation` for `ChangeNotifier`), so they are unit-testable and portable.

## 2. Layer responsibilities

| Layer | Files | Responsibility |
|-------|-------|----------------|
| **core** | `config/env.dart`, `theme/*`, `responsive/*`, `utils/result.dart` | Environment, brand theme, adaptive breakpoints, helpers. No app logic. |
| **data/api** | `api_client.dart`, `api_exception.dart` | Dio REST client; injects JWT; maps errors to `ApiException` (`{error}` message + status). |
| **data/models** | `parent`, `child`, `task`, `message`, `version_info` | Immutable models with `fromJson`, mirroring the documented `public*` shapes. |
| **data/repositories** | `auth`, `family`, `task` | One method per documented endpoint; returns models. |
| **services/auth** | `token_storage`, `google_auth`, `auth_service` | Secure JWT persistence, Google code flow, login/register/auto-login/logout orchestration. |
| **services/socket** | `socket_service`, `socket_events` | Single JWT-authenticated Socket.IO connection; subscribe returns a disposer (no listener leaks). |
| **services/lifecycle** | `lifecycle_service`, `update_service` | First-launch/onboarding/version flags; version check via backend. |
| **state** | `auth_controller` | `ChangeNotifier` exposing `status/busy/error`; the router's `refreshListenable`. |
| **presentation** | `screens/*`, `widgets/*` | Stateless-first widgets; all layout via `ResponsiveShell` + responsive helpers. |

## 3. Dependency injection

`main.dart` is the composition root. Singletons (`ApiClient`, `SocketService`, `LifecycleService`) and repositories/services are constructed once and provided via `MultiProvider`. The **shared `ApiClient`** holds the JWT (set by `AuthService`), so every repository call and the socket handshake use the same token with no circular dependency.

## 4. Routing & flow

`go_router` with a single `redirect` keyed off `AuthController.status`:

```
unknown          → /splash       (bootstrap: markInstalled + auto-login)
unauthenticated  → /onboarding   (if !onboarded, once) → /login | /signup
authenticated    → /home         (wrapped in UpdateGate)
```

`refreshListenable: authController` rebuilds routes on sign-in/out. The `UpdateGate` overlays optional/mandatory update + What's New without blocking the app on a slow version check.

## 5. Realtime contract

`SocketService` connects `io(Env.apiBase, { auth: { token }, transports: ['websocket'] })`. Event names are centralized in `socket_events.dart` to match the backend exactly. Subscriptions return a disposer that screens call in `dispose()` — the same anti-leak discipline used in the hardened web client. The home screen demonstrates live `task:upserted`.

## 6. State management choice

**Provider + ChangeNotifier** — minimal, stable, first-party-recommended, and sufficient for this app's scope. It keeps the state layer thin and testable. (Riverpod/BLoC are viable later; the clean layering means swapping the state layer would not touch services/data.)

## 7. Error handling

Repositories throw `ApiException(status, message)`; `AuthController` maps `401/403/429/network` to user-safe copy. The data/service layers never surface raw exceptions to the UI. Offline/cold-start (Render) is tolerated: auto-login and the update check fail soft.

## 8. Why this is migration-ready

Every screen the web app has maps to: a repository method (REST) + optional socket subscription (realtime) + a responsive widget. New screens are added in `presentation/` and reuse the existing api/socket/state layers — no architectural changes needed to migrate Tasks, Chat, Rewards, AI Reports, etc.
