# AlphaGuard AI V2 — Realtime Backend (Phase 2)

`Parent ↔ Server ↔ Child` real-time sync. Express REST + Socket.IO + a
persistent JSON database. **No WebRTC** (Phase 3).

## Run

```bash
cd backend-v2
npm install
npm start          # http://localhost:4000  (set PORT to change)
npm test           # end-to-end realtime sync test (20 assertions)
```

Frontend points at the API via `VITE_AG_API` (default `http://localhost:4000`).

## Architecture

```
 Parent app ─┐                          ┌─ Child app
   REST +    ├─►  Express  ──► services ──►  DB (JSON tables)
  Socket.IO ─┘      │            │
                    └─ Socket.IO ┘ rooms:  pairing:<id> (both)
                                           parent:<id>,  child:<id>
```

- **services.js** is the only place that mutates the DB and fans events out over
  Socket.IO, so REST and sockets behave identically.
- **Rooms**: parent + child of a pairing share `pairing:<id>`; the parent also
  has `parent:<id>` for SOS/notifications across children.

## Database (tables)

`parents · children · pairings · devices · messages · sos · locations · battery
· permissions · notifications · appRequests`

`db.js` exposes a `Repo(table)` repository (`insert/update/upsert/find/filter/
remove`). Swap the JSON file for Postgres/SQLite by reimplementing `Repo` only.

## Auth

- **Parent** — email + password (`bcryptjs`), JWT `{ role:'parent', parentId }`.
- **Child** — device-bound, claimed via 6-digit pairing code → JWT
  `{ role:'child', childId, parentId, pairingId, deviceId }`.
- Same JWT authorizes REST (`Authorization: Bearer`) and the Socket.IO handshake.

## Pairing

1. `POST /api/children` (parent) → creates child + pending pairing, returns `code`.
2. `POST /api/pair/claim { code }` (child device) → activates pairing, registers
   the device, returns the child JWT. Parent is notified via `pair:active`.

## Realtime events

| Emit (client → server)                  | Broadcast (server → client)          |
|-----------------------------------------|--------------------------------------|
| `chat:send / chat:typing / chat:read`   | `chat:message / chat:status / chat:typing / chat:read` |
| `sos:trigger` (child)                   | `sos:alert` (parent) + `notification:new` |
| `location:update` (child)               | `location:update` (parent)           |
| `battery:update` (child)                | `battery:update` (parent)            |
| `request:create` (child)                | `request:new` (parent) + `notification:new` |
| `request:decide` (parent)               | `request:update` (child + parent)    |
| connect/disconnect                      | `presence { childId, online }`       |

## Notifications

Each notification is a DB row pushed live via `notification:new` (in-app +
dashboard alert). Web-Push / FCM is a second delivery channel off the same record
(Phase 3) — the record + transport hook already exist.

## Frontend SDK

`frontend-v2/src/lib/agClient.js` — `api.*` (REST) + `rt.*` (socket emitters) +
event subscription. Screens adopt it incrementally to replace their localStorage
stores; the store shapes already match the server payloads.
