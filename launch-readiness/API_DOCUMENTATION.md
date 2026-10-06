# AlphaGuard AI V2 — API & Realtime Contract Documentation

**Base URL:** `${VITE_AG_API}` (default `http://localhost:4000`) · **REST prefix:** `/api` · **Realtime:** Socket.IO at the base URL.
**Audience:** the Flutter client (and any native client). Every capability below is server-enforced and transport-agnostic.

---

## 1. Authentication

JWT bearer tokens. Obtain via register/login/Google; send as `Authorization: Bearer <token>` on REST and in the Socket.IO handshake `auth: { token }` (or `?token=`). Token payload: `{ sub, role: 'parent'|'child', parentId?, childId?, pairingId?, deviceId? }`. Expiry 30 days.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/parent/register` | public (rate-limited) | Create parent → `{ token, parent }` |
| POST | `/api/auth/parent/login` | public (rate-limited) | `{ token, parent }` |
| GET | `/api/auth/parent/email-available?email=` | public | Signup inline check |
| GET | `/api/auth/google/config` | public | `{ enabled, clientId }` |
| POST | `/api/auth/google` | public (rate-limited) | Code→identity→`{ token, parent, needsPin }` |
| POST | `/api/auth/parent/verify-pin` | parent (rate-limited) | `{ ok }` |
| POST | `/api/auth/parent/set-pin` | parent | Set 6-digit PIN |
| GET | `/api/me` | any | Current identity (`role`, `admin`) |
| DELETE | `/api/me` | parent | Hard-delete account + all data |

**Flow:** register/login → `setup` → `connect` (create child + pairing) → dashboard. Google verified server-side (no client identity assertion). Admin status from server email allowlist (`AG_ADMIN_EMAILS`); never client-asserted.

## 2. Pairing & devices

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/children` | parent | Create child + pending pairing (6-digit code) |
| GET | `/api/children` | parent | Children + pairing + presence + battery |
| POST | `/api/pair/claim` | public (rate-limited) | Child claims code → **child token** + device |
| POST | `/api/pair/regenerate` | parent | Revoke pending + mint fresh code |
| POST | `/api/pair/revoke` | parent | Revoke pending code |
| GET | `/api/pair/status` | parent | Pairings list |
| GET | `/api/devices` | parent | Device registry |

## 3. Tasks · proof · approval (Parent Verification)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/tasks[?childId=&category=]` | any | List (child scoped to self) |
| POST | `/api/tasks` | any | Create. Parent may set `requireProof`, `requireApproval` |
| PATCH | `/api/tasks/:id` | any | Edit (incl. `requireProof`/`requireApproval`) |
| POST | `/api/tasks/:id/cycle` | any | ⬜→✅→❌→⬜. Approval-task complete by child → `approvalStatus:'pending'` |
| DELETE | `/api/tasks/:id` | any | Soft delete |
| GET | `/api/tasks/:id/history` | any | Full audit incl. proof + approval events |
| **POST** | **`/api/tasks/:id/proof`** | **child** | Upload `{ kind:'photo'|'screenshot', dataUrl, name }` → `{ proof, task }` |
| **GET** | **`/api/tasks/:id/proof`** | parent + owning child | List proofs (incl. `dataUrl`) |
| **POST** | **`/api/tasks/:id/approve`** | **parent** | Approve pending task → counts toward streaks |
| **POST** | **`/api/tasks/:id/reject`** | **parent** | `{ comment }` → task back to not_started, comment posted to thread |
| GET/POST | `/api/tasks/:id/comments` | any (mutate scoped) | Realtime task discussion thread |
| GET/POST | `/api/task-categories` | any / parent | Built-in + custom categories |
| GET/POST/DELETE | `/api/recurring[...]` | any / parent | Recurring task rules |

**Task object** (`publicTask`): adds `requireProof`, `requireApproval`, `approvalStatus` (`none|pending|approved|rejected`), `approvalComment`, `approvedAt`, `approvedBy`, `proofCount`. **Proof** (`publicProof`): `{ id, taskId, childId, kind, name, mime, dataUrl, at }`. Proof: raster image only (SVG rejected), ≤4MB data-URL.

## 4. Targets · Rewards · Streaks · Achievements · AI Reports

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET/POST/PATCH/DELETE | `/api/targets[...]`, `/api/targets/:id/history` | any/parent | Targets (child may update progress) |
| GET/POST/PATCH/DELETE | `/api/rewards[...]` | any/parent | Rewards/promises (child acknowledges) |
| GET | `/api/streaks/:childId`, `/api/achievements/:childId` | any (scoped) | Gamification |
| POST | `/api/ai/reports` | any (scoped) | `{ childId, period:'daily'|'weekly'|'monthly' }` → enhanced report |

**Report `metrics`** now includes: `approval{requireApprovalCount,approved,rejected,decisions,approvalRate,pendingApproval,byCategory[]}`, `discussions{totalMessages,mostDiscussed[]}`, `parentEngagement{level,parentComments,decisions,parentCreatedTasks}`, `consistency{activeDays,windowDays,consistencyPct,previousConsistencyPct,delta}`, and `insights[]` (human-readable strings) — alongside existing completion/streak/category/target metrics.

## 5. Family Chat · SOS · Telemetry · Requests · Zones · Notifications

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET/POST | `/api/chat/:pairingId/messages` | any (pairing-scoped) | Message history + send (REST mirror) |
| POST | `/api/sos` · GET `/api/sos` · POST `/api/sos/:id/resolve` | child / parent | Emergency SOS |
| POST `/api/location` · GET `/api/location/:childId` | child / parent (scoped) | Location |
| POST `/api/battery` · GET `/api/battery/:childId` | child / parent (scoped) | Battery |
| GET/POST/decide | `/api/requests[...]` | child/parent | App install/delete approvals |
| GET/POST/DELETE | `/api/zones[...]`, `/api/zone-events` | parent | Safe zones + geofence history |
| POST | `/api/enforce/{install,uninstall,security,screentime}` | child | Android agent reports |
| GET/POST | `/api/notifications[...]` | parent | Notification center |
| GET | `/api/security-alerts` | parent | Security center |

## 6. Support · Legal/Consent · Lifecycle · Admin

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| Support tickets / features / ratings | `/api/support/*`, `/api/feature-requests`, `/api/ratings` | parent | User-scoped |
| `/api/announcements`, `/api/changelog` | any | Published content |
| `/api/legal/version`, `/api/consent/status`, `/api/consent`, `/api/data-deletion` | public / parent | Versioned consent + erasure |
| `/api/app/version[?version=]` | public | Update check → `{ currentVersion, minimumVersion, releaseNotes, updateAvailable, mandatory }` |
| `/api/admin/*` (support, features, announcements, changelog, ratings, app-version) | **admin** | Platform admin |

---

## 7. Socket.IO contract

**Handshake:** `io(base, { auth: { token }, transports: ['websocket'] })`. Server emits `ready` on connect. Rooms: parent joins `parent:<id>` + all their `pairing:<id>`; child joins `child:<id>` + its `pairing:<id>`; admins join `admin`.

**Inbound (client → server):** `chat:send {pairingId,text}`, `chat:typing {pairingId,isTyping}`, `chat:read {pairingId,ids}`, `sos:trigger {location}`, `sos:resolve {sosId}`, `location:update {lat,lng,accuracy}`, `battery:update {level,charging}`, `request:create {...}`, `request:decide {requestId,decision}`, `enforce:{install,uninstall,security,tamper,screentime}`, WebRTC: `monitor:request|accept|decline|stop|control`, `webrtc:signal`. All pairing-scoped events are authorized by room membership; parent decisions re-checked by ownership.

**Outbound (server → client):** `ready`, `presence`, `chat:message`, `chat:status`, `chat:typing`, `chat:read`, `sos:alert`, `sos:resolved`, `location:update`, `battery:update`, `request:new`, `request:update`, `notification:new`, `pair:active`, `zones:update`, `zone:event`, `security:alert`, `screentime:locked`, `task:upserted`, `task:deleted`, `task:comment`, **`task:proof`**, `target:upserted`, `target:deleted`, `reward:upserted`, `reward:deleted`, `achievement:unlocked`, `streak:updated`, `report:ready`, `category:upserted`, support/feature/announcement/changelog/rating admin events.

**Delivery semantics:** chat message status transitions `sent → delivered` (recipient present in room) `→ read` (via `chat:read`); typing relayed live; timestamps (`at`, epoch ms) on every message.

---

## 8. Conventions for the Flutter client

- All IDs are server-generated UUID strings; timestamps are epoch-ms integers.
- Errors: non-2xx with `{ error: string }`. 401 = re-auth; 403 = role/permission; 404 = not found / not in family; 429 = rate-limited (`Retry-After`).
- Money/media: monitoring media is **never** stored server-side (WebRTC relay only); proof images are the only stored binary (data-URL in `task_proofs`).
- The REST API and the Socket.IO events are **mirrors** — every realtime mutation has a REST equivalent, so a client can operate REST-only and still receive live updates when the socket connects.
