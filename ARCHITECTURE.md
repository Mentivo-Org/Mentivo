# Mentivo — Architecture

Reverse-engineered from the code on branch `new-fricking-update`. This describes **what the system actually does today**, not the target design. Where the code contradicts `README.md`, the code wins and the discrepancy is called out in [§13 Known Drift](#13-known-drift--sharp-edges).

Mentivo is a per-minute voice mentorship marketplace: JEE aspirants call verified IIT students over Agora VoIP and are billed from a prepaid wallet at a per-minute rate.

---

## Table of Contents

1. [System Map](#1-system-map)
2. [Repository Layout](#2-repository-layout)
3. [Request Path & Process Topology](#3-request-path--process-topology)
4. [API Versioning (v1/v2)](#4-api-versioning-v1v2)
5. [Data Model](#5-data-model)
6. [Authentication & Identity](#6-authentication--identity)
7. [Presence](#7-presence)
8. [The Call Lifecycle](#8-the-call-lifecycle-core-flow)
9. [Billing & Payments](#9-billing--payments)
10. [Chat](#10-chat)
11. [Notifications & Realtime](#11-notifications--realtime)
12. [Background Jobs](#12-background-jobs)
13. [Known Drift & Sharp Edges](#13-known-drift--sharp-edges)
14. [Deployment & Environments](#14-deployment--environments)
15. [Where to Look for What](#15-where-to-look-for-what)

---

## 1. System Map

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Mobile App      │  │  Website         │  │  Admin Dashboard │
│  Expo / RN       │  │  Next.js         │  │  Next.js         │
│  students+mentors│  │  mentivo.in      │  │  admin.mentivo.in│
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │ REST + Socket.io    │ REST (cookies)      │ REST /api/admin
         └──────────┬──────────┴─────────────────────┘
                    ▼
         ┌────────────────────────────────────┐
         │  load-balancer/  (Express, :8080)  │
         │  • IP sticky sessions (in-memory)  │
         │  • /api/admin → main instance only │
         │  • WS upgrade proxy                │
         │  • logs every req/res → Postgres   │
         └──────────────────┬─────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
  │ Backend MAIN  │  │ Worker 1      │  │ Worker N      │
  │ ENABLE_ADMIN  │  │               │  │               │
  │   _API=true   │  │               │  │               │
  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘
          │  each process = 1 gateway + v1 + v2 (+ admin on main)
          └──────────────────┼──────────────────┘
                             ▼
   ┌─────────────────┐  ┌─────────────┐  ┌──────────────────────┐
   │ PostgreSQL      │  │ Redis       │  │ External services    │
   │ (Supabase)      │  │ presence,   │  │ Agora RTC + Chat     │
   │ + Prisma 7      │  │ cache, OTP, │  │ Razorpay / X         │
   │                 │  │ broadcast   │  │ Firebase FCM         │
   │                 │  │ locks       │  │ Supabase Auth+Storage│
   └─────────────────┘  └─────────────┘  │ Resend (admin email) │
                                          └──────────────────────┘
```

**Design intent readable from the code:**

- **The admin plane is physically separated.** Admin routes only exist on the process started with `ENABLE_ADMIN_API=true`, and the load balancer pins `/api/admin/*` to that one instance. Worker instances return `404 Admin API is disabled on this instance`.
- **Presence is Redis-first, Postgres-backed.** "Is this mentor callable right now" must be cheap; Postgres is the durable fallback that rehydrates Redis on a cold cache.
- **Billing is settled atomically at call end**, not streamed. A DB-level status lock (`active → settling → settled`) makes settlement idempotent under concurrent end/sweep/reject paths.
- **Two live API versions run side by side** so an old installed APK keeps working against frozen v1 semantics while the current app talks v2.
- **Sticky sessions exist because Socket.io has no Redis adapter.** `emitToUser` is process-local, so a user's HTTP and WS traffic must land on the same node.

---

## 2. Repository Layout

pnpm workspace (`pnpm-workspace.yaml`), `nodeLinker: hoisted`.

| Workspace | Stack | Role |
|---|---|---|
| `backend/` | Node 20+, Express 5, TypeScript (run directly via node's TS support, `nodemon src/app.ts`), Prisma 7 | Gateway + v1 API + v2 API + admin API + cron jobs |
| `frontend/` | Expo SDK 54, RN 0.81, React 19, React Navigation | Student & mentor mobile app (Android is the shipped target) |
| `website/` | Next.js 16 App Router, Zustand, Tailwind | Public site, student/mentor web dashboard, partner referral pages |
| `admin-frontend/` | Next.js 16 App Router, Tailwind | Internal ops dashboard |
| `load-balancer/` | Express + `http-proxy-middleware` + `pg` | Sticky-session router and centralized request logger |
| `supabase/` | SQL | Supabase project config + one migration |

Root `package.json` orchestrates local dev with `concurrently`:

```
pnpm dev   → backend-main (3000 / v1:4000 / v2:4001 / admin:5000, ENABLE_ADMIN_API=true)
             backend-worker (3002 / v1:4002 / v2:4003, ENABLE_ADMIN_API=false)
             load-balancer (8080 → main + worker)
             admin-frontend (5001)
             website (3001)
```

Note the shape: **one "backend" deploy is one OS process hosting several Express servers on different ports.**

---

## 3. Request Path & Process Topology

### 3.1 Load balancer — `load-balancer/index.js`

- Builds `userNodes = [MAIN_INSTANCE_URL, ...WORKER_URLS]`.
- **Sticky routing**: an in-memory `Map<ip, {node, lastSeen}>`. First request from an IP gets a node via round-robin; subsequent requests reuse it. Entries expire after 30 min idle, swept every 5 min. *This map is per-LB-process and non-persistent — an LB restart reshuffles every session.*
- `/api/admin/*` bypasses stickiness and always goes to `MAIN_INSTANCE_URL`.
- WebSocket upgrades are proxied through the same user proxy (`server.on('upgrade')`).
- **Every request/response is logged to Postgres** `log_entries` via a raw `pg` pool (`max: 3`). It buffers response chunks, forces `Accept-Encoding: identity`, gunzips if the backend compressed anyway, strips NUL bytes (JSONB can't store them), and stores method/endpoint/status/duration/IP/response body. `/api/logs/app/stream` and `/health` are excluded.

### 3.2 Backend gateway — `backend/src/app.ts`

Boots as one process on `PORT` (default 3000) and **imports the sub-apps for side effects**, so each one starts its own HTTP server:

```ts
import './v1/app.ts';          // listens on PORT_V1
import './v2/app.ts';          // listens on PORT_V2
if (ENABLE_ADMIN_API) import('./admin/app.ts');   // listens on PORT_ADMIN
```

Routing rules, in order:

1. `/api/config/version` → handled by the gateway itself (`modules/version/version.controller.ts`, reads `app_version.json`).
2. `/api/admin/*` → admin proxy with `pathRewrite: '^/api/admin' → '/api'`; 404 if admin is disabled on this instance.
3. Everything else → `x-api-version` header (or `?version=`) equal to `v2` selects the v2 proxy, otherwise **v1 is the default**.
4. WS upgrades apply the same version rule, reading the version from the header or the handshake query string.

CORS is enforced at the gateway *and* re-enforced in each sub-app. Allowed: `mentivo.in`, `*.mentivo.in`, localhost 3000/3001, no-Origin requests (mobile), and **everything when `NODE_ENV !== 'production'`**.

### 3.3 Sub-app anatomy — `backend/src/v2/app.ts`

Common shape for v1/v2:

```
cookie-parser → CORS → /api/webhooks (express.raw, BEFORE json parsing) →
express.json → trust proxy → rate limit on /api/auth (100 / 15 min) →
request logger → routes → global error handler
```

then on listen: `ensureStorageBuckets()` (creates the Supabase Storage buckets) and `startJobs()` (registers all node-cron jobs).

Routers mounted: `auth`, `coaching`, `mentors`, `calls`, `wallet`, `chat`, `chat-moderation`, `profile-picture`, `ask`, `partners`, `config`, `agora/token`, `webhooks`. v1 additionally has `voucher`.

### 3.4 Admin API — `backend/src/admin/app.ts`

Separate Express app with `helmet`, `morgan`, its own CORS allowlist (`admin.mentivo.in`, `dev.mentivo.in`, localhost:5001) and a global 100-req/15-min limiter. Routers: `auth`, `students`, `mentors`, `email`, `notifications`, `moderation`, `profile-deletion`, `partners`, `config`, `logs`, `database`, `vouchers`, `billing`. It also owns one cron job (partner stats sync, Sundays 01:13).

---

## 4. API Versioning (v1/v2)

`src/v1/` is a **byte-for-byte snapshot of `src/v2/`**, produced by `backend/scripts/snapshot.js` (`pnpm snapshot:v1`), which deletes `src/v1` and copies `src/v2` over it. v1 then freezes while v2 continues to evolve; today ~17 files have diverged.

Version selection is client-driven:

1. `backend/app_version.json` holds `{ "min_v1": "1.0.3", "min_v2": "1.0.3" }`.
2. On boot, `frontend/context/VersionContext.tsx` fetches `/api/config/version` and compares against `Constants.expoConfig.version`:
   - `version < min_v1` → **hard-block** with a non-dismissible "Update Required" dialog.
   - `min_v1 ≤ version < min_v2` → route to **v1** + soft "Update Available" dialog.
   - otherwise → route to **v2**.
3. The resolved version is written to `api.defaults.headers.common['x-api-version']` and read by `socketManager` for the socket handshake (query + `extraHeaders`).
4. If the version check fails (backend unreachable), the client falls back to **v1** and continues.

**Operational consequence:** a bug fix must be applied to v2 *and* deliberately re-snapshotted into v1, or v1 clients keep the bug. Editing v1 by hand is silently destroyed by the next `snapshot:v1`.

---

## 5. Data Model

Single PostgreSQL database (Supabase-hosted), Prisma schema at `backend/prisma/schema.prisma`, 40 migrations. `@@map` is used throughout, so Prisma model names are camelCase while tables are snake_case.

### Core entities

| Model | Purpose | Notes |
|---|---|---|
| `User` | Every actor except platform admins | `role`: `student \| mentor \| coaching_partner \| telegram_partner \| other_partner`. Carries both referral-graph fields (`referralCode`, `referredByReferralCode`, `commissionMethod`, `commissionValue`, `studentBonusValue`) and product fields (`favouriteMentors String[]`, `isFreeAvailable`). |
| `MentorProfile` | 1:1 with mentor `User` | `verificationStatus` (PENDING/VERIFIED/REJECTED), `mentorlevel` (Verified/Standard/Signature/Fellow), `rate_per_min` (default ₹7), `avg_rating`, `total_calls`, `isOnline`, `id_doc_url`. |
| `CallSession` | The transaction record for one call | Status is a free-form string, not an enum — see §8.1. Stores the rate snapshot (`ratePerMin`), `durationSecs`, `lastHeartbeatAt`, and the money split (`amountCharged`/`mentorEarning`/`platformFee`). |
| `Wallet` / `MentorBalance` / `CoachingCenterBalance` / `PartnerBalance` | Four separate ledgers | Students hold `balance`; the other three hold `pendingPayout` / `totalEarned` / `totalWithdrawn`. |
| `WalletTransaction` | Top-up & credit audit trail | `type`: `topup`, `voucher_installment`, `referral_signup_bonus`, … keyed by `razorpayOrderId`. |
| `Payout` | Weekly mentor settlement record | `status`: `processing` (Razorpay X) or `manual_pending`. |

### Chat & moderation

`ChatSession` (unique per `[studentId, mentorId]`, holds `agoraConvId`, optionally linked to a `CallSession`), `ChatMessage` (unique `agoraMsgId`, stores `validationResult` JSON), `ChatValidationRule`, `ChatRateLimit`.

### Community ("Ask")

`Question` → `Answer` (unique per `[questionId, mentorId]`) → `AnswerVote` (unique per `[answerId, userId]`), configured by a singleton `AskConfig` row (`id = "default"`).

### Platform / ops

`AppSetting` (key→value; drives pricing, free-call toggles, feature flags at runtime), `LogEntry` (written by both the LB and the backend), `Notification` / `NotificationLog`, `EmailLog`, `FCMToken`, `RefreshToken`, `MentorPromotionCondition`, `VoucherSubscription`, `CoachingCenter`, `Rating`.

**`AppSetting` is the runtime control plane.** Pricing (`price_<Level>`, `discount_<Level>`), `free_call_enabled`, and `free_call_duration_mins` are read per-request from this table (`utils/pricing.ts`), so ops changes in the admin dashboard take effect without a deploy.

---

## 6. Authentication & Identity

There are **two independent auth systems**.

### 6.1 User auth (`backend/src/v2/utils/jwt.ts`, `auth/authenticateUser.ts`)

- Mentivo mints its **own HS256 JWTs** — access token 7 days, refresh token 60 days persisted in `refresh_tokens`. Supabase is used only as an OTP/email/identity provider; the Prisma `User` row is the source of truth.
- `authenticateUser` reads `cookies.accessToken` first (web), then `Authorization: Bearer` (mobile), verifies, loads the `User` from Postgres, and attaches it to `req.user`.
- **Transport is chosen by the `x-client-type` header.** `mobile` → tokens returned in the JSON body; anything else → httpOnly cookies set by the server and no tokens in the body.
- Sign-up paths: email + OTP (via Supabase `signInWithOtp`), and native Google sign-in. Mentors are gated at signup by an IIT email-domain check (`utils/mailIdLoader.ts` + `iit_mailId.json`).
- The mobile axios client (`frontend/services/api.ts`) retries once on `401 "Invalid or expired token"`, deduplicates concurrent refreshes behind a single shared promise, and calls `socketManager.reconnectWithNewToken()` so the WS session re-authenticates too. A failed refresh wipes local storage.
- **`JWT_SECRET`/`JWT_REFRESH_SECRET` fall back to hardcoded defaults** if unset; the module logs a loud `[SECURITY]` error at boot rather than refusing to start.

### 6.2 Admin auth (`backend/src/admin/`)

Completely separate: email must end in `@mentivo.in` → 6-digit OTP stored in Redis for 10 min → emailed via Resend → verified → **its own** access/refresh JWTs stored in `admin_accessToken` / `admin_refreshToken` cookies (domain `.mentivo.in` in production). **Admins have no `User` row**; identity is just the email inside the JWT (`GET /api/admin/auth/me` returns `{ email, name: null }`).

---

## 7. Presence

`backend/src/v2/services/presence.ts`. Redis key `presence:<mentorId>` holding `{ state, fcmToken?, updatedAt }`.

| Function | Effect |
|---|---|
| `setAvailable` | `SET presence:<id> {state:'available'}` **(no TTL)** + `mentor_profiles.isOnline = true` |
| `lockToBusy` | `SET presence:<id> {state:'busy'}` — Redis only, DB untouched |
| `setOffline` | `DEL presence:<id>` + `isOnline = false` |
| `getPresenceState` | Redis hit wins; on a miss it falls back to `mentor_profiles.isOnline` and **rehydrates Redis** |
| `getAvailableMentors` | `KEYS presence:*` + `MGET`; if Redis is empty, it bulk-rehydrates from every `isOnline: true` row |

State is therefore **explicitly transitioned, not heartbeat-expired**: a mentor goes busy when a call starts and is returned to available by `performEndCall`, `rejectCall`, the missed-call timeout, or the sweeper. If a process dies between "lock busy" and "release", the mentor stays busy until the sweeper's `setAvailable` runs.

Liveness is checked out-of-band instead: `services/pingMentors.ts` sends a data-only `type: 'ping'` FCM at 09:00/14:00/17:00 IST, the app answers with `POST /api/mentors/me/pong` from its background handler, and a 02:00 IST job audits who never ponged.

---

## 8. The Call Lifecycle (core flow)

Owned by `backend/src/v2/controllers/callController.ts` (1034 lines — the densest file in the repo) and `frontend/context/CallContext.tsx`.

### 8.1 Status machine

`CallSession.status` is a plain string. Observed values:

```
scheduled ──────────────────────────────────► (reminder → normal flow)

calling ──► ringing ──► active ──► completed ──► settling ──► settled
   │           │           │
   │           │           └──► (heartbeat: balance exhausted) ──► completed
   ├──► rejected                    (sweeper: heartbeat stale)  ──► completed
   ├──► missed   (60s no answer, or lost a broadcast race)
   ├──► cancelled (ended before it went active)
   └──► failed   (mentor had no FCM token)
```

### 8.2 Initiating a call — `POST /api/calls/initiate`

1. `getPresenceState(mentorId)` must be `available`.
2. Wallet balance must be **≥ ₹10** (else `402`).
3. Free-call eligibility = global `free_call_enabled` **and** `user.isFreeAvailable === true`.
4. `lockToBusy(mentorId)`.
5. Channel name = `sha256(studentId + ':' + mentorId)` — deterministic per pair.
6. Create `CallSession { status: 'calling', is_free, ratePerMin }` — the rate is **snapshotted onto the row** so later pricing changes don't retroactively alter the call.
7. Agora RTC tokens: the **student token's expiry encodes affordability** — `floor(balance / rate) * 60 + freeSeconds + 60s buffer`. The mentor gets a flat 3600s token.
8. Get-or-create the `ChatSession` and link it to this call (`isInCallChat = true`).
9. Signal the mentor **twice**: Socket.io `incoming_call_v2` to the mentor's user room (instant, foreground) *and* a high-priority data-only FCM (wakes a backgrounded/killed app).
10. **No FCM token for the mentor ⇒ hard fail**: mentor forced offline, session marked `failed`, `400` to the caller.
11. Arm a 60-second in-process `setTimeout` that flips a still-unanswered call to `missed`, releases the mentor, and pushes cancel notifications to both sides.

### 8.3 On the device

`CallContext` is a single global provider that owns the entire call: Agora engine listeners, the duration timer, the heartbeat, the Notifee ongoing-call foreground service (with `FOREGROUND_SERVICE_TYPE_MICROPHONE` and an "End Call" action), and post-call navigation (caller → rating screen).

It listens for terminal state on **three redundant channels**, because any one of them can be missed on mobile:

- Socket.io `call_status_changed`
- an FCM-derived `DeviceEventEmitter` event
- a **3-second polling loop** on `GET /api/calls/:id/status`, active only while `calling`/`ringing`

`endCallSession` is guarded by `isEndingCallRef` so all three paths converge on one teardown.

### 8.4 Heartbeat — `PATCH /api/calls/:id/heartbeat` (every 10s)

The heartbeat is not just liveness; it is the **live budget enforcer**:

1. Update `lastHeartbeatAt`, re-assert `lockToBusy` (self-healing if Redis was flushed).
2. Recompute `totalAllowedSecs = floor(balance / rate) * 60 + (isFree ? freeSeconds : 0)`.
3. `remaining ≤ 0` → server-side `performEndCall`.
4. `remaining ≤ 180` → one-shot low-balance warning push, deduped by a Redis key with 1h TTL.

Client-side, a `heartbeatInFlightRef` guard skips a tick rather than stacking requests on a slow network.

### 8.5 Ending

`performEndCall(sessionId)` is the single funnel used by the client `/end` route, the heartbeat terminator, and the sweeper:

- Only acts on `active | calling | ringing` (idempotent by construction).
- `duration = endedAt − startedAt`; `active → completed`, anything earlier → `cancelled`.
- Releases the mentor, emits socket + FCM status to both parties.
- **Only `completed` calls are settled.**

### 8.6 Free-call matchmaking — `POST /api/calls/free-matchmaking`

A fan-out race, coordinated entirely in Redis:

1. Pick up to **6** available mentors, sorted ascending by `total_calls` (favours new mentors).
2. Create one `CallSession` per mentor, all tagged into a `broadcastGroupId` (keys TTL 35s), and ring all of them via FCM.
3. The **first mentor whose device calls `GET /api/calls/:id/status` wins** via `SETNX broadcast_lock:<group>`. The winner's fetch cancels every sibling session (`missed` + cancel push); losers get a synthetic `missed` response so their UI drops out cleanly.
4. Meanwhile the student's HTTP request **blocks server-side**, polling Redis once per second for up to 30 seconds, then returns the winning session's tokens — or `404 "No mentors answered"`.

This holds an Express request open for up to 30s; it works, but it is the one place where a long-poll competes with the LB/proxy timeouts.

---

## 9. Billing & Payments

### 9.1 Settlement — `backend/src/v2/services/billing.ts`

Everything happens inside one `prisma.$transaction`:

1. **Atomic lock**: `updateMany({ where: { id, status: in ['active','completed','ringing','calling'] }, data: { status: 'settling' } })`. If `count === 0`, another path already claimed it → return. This is what makes double-settlement impossible when the client `/end`, the heartbeat terminator, and the sweeper all fire.
2. Resolve `ratePerMin` from the mentor's level via `AppSetting` (discount price wins over list price; falls back to `mentor_profiles.rate_per_min`, else ₹10).
3. `billableSecs = isFree ? max(0, duration − freeSeconds) : duration`; `billableMins = ceil(billableSecs / 60)` — **billing rounds up to the whole minute**.
4. `totalCharge = billableMins × ratePerMin`; mentor share is a hardcoded `MENTOR_SHARE = 0.70`.
5. **Wallet clamp**: if the wallet can't cover the charge, only the remaining balance is taken and the 70/30 split is recomputed on the collected amount. The platform absorbs the shortfall rather than letting the wallet go negative.
6. Debit `Wallet`, credit `MentorBalance` (`pendingPayout` + `totalEarned`), increment `total_calls`.
7. If the student has a `coachingCenterId`, credit **5% of the collected amount** to `CoachingCenterBalance`.
8. Finalize the row: `settled`, with the money split and `settledAt` persisted.

### 9.2 Top-ups (Razorpay)

`POST /api/wallet/topup` creates a Razorpay order and a `pending` `WalletTransaction`. Crediting happens through **two independent paths that must not double-credit**:

- **Client confirm** (`/topup/confirm`): verifies the HMAC signature, then re-fetches the payment from Razorpay's API and requires `status === 'captured'` and a matching `order_id`.
- **Webhook** (`/api/webhooks/razorpay`, mounted with `express.raw` before the JSON parser so the raw body is signature-verifiable): handles `payment.captured` / `payment.failed`.

Both guard with the same idempotency primitive — `updateMany({ where: { razorpayOrderId, status: 'pending' } })`, and bail if `count === 0`. Both also verify `payment.amount − payment.fee === expected × 100`; a mismatch is logged as `[CRITICAL]` and the credit is skipped rather than guessed.

### 9.3 Payouts

Weekly cron (Mon 03:00): every `MentorBalance` with `pendingPayout ≥ ₹100` is zeroed and moved to `totalWithdrawn` inside a transaction, and a `Payout` row is written. If `ENABLE_RAZORPAY_X !== 'true'`, the payout is recorded as `manual_pending` and the UPI ID is logged for a human to pay — **the Razorpay X leg is a flag-gated stub today.**

### 9.4 Referrals & vouchers

- `services/referralService.ts` handles `commissionMethod: 'per_signup'` at profile completion: credits `PartnerBalance` and the new student's wallet, deduped by looking for an existing `referral_signup_bonus` transaction. `percent_revenue` partners are intended to accrue at settlement time.
- `VoucherSubscription` is a prepaid plan drip-fed by a daily job: one installment credited to the wallet per month until `installmentsRemaining` hits 0.

---

## 10. Chat

Agora Chat (IM) with Mentivo as the system of record.

- **ID mapping**: Agora rejects hyphens, so `utils/agoraUtils.ts` converts UUID ⇄ 32-char lowercase hex in both directions.
- **Token issuance**: `GET /api/chat/token` mints an Agora user token (24h) and lazily registers the user with Agora.
- **Send path** (`chatController.sendMessage`): validate → send via **Agora REST from the server** → persist to `chat_messages` with the returned `agoraMsgId` → bump the session → fire an FCM push to the recipient. The code comments state webhooks are unavailable on the current Agora plan, which is why the server writes the message itself.
- **Webhook path** (`services/chat/agoraChatWebhook.ts`) exists and handles `message_send` / `message_delivered` / `message_read` with optional HMAC-SHA1 verification. On `message_send` it validates and, if the message is bad, **recalls it from Agora**. It also enforces that **only students may open a new chat**.
- **Validation engine** (`services/chat/validation.ts`) runs three checks and blocks if any is severity `block`: rate limit, PII detection (`piiDetector`), URL detection (`urlDetector`). Results are stored on the message as JSON for moderation review.
- **Moderation**: `/api/chat-moderation` (user-facing report/block) plus the admin dashboard's chat moderation page.
- **Session identity**: one `ChatSession` per `[studentId, mentorId]` pair, reused across calls; a call links itself to that session rather than creating a new thread.

---

## 11. Notifications & Realtime

### Socket.io (`backend/src/v2/config/socket.ts`)

One Socket.io server per sub-app, attached to that sub-app's HTTP server. Auth is a handshake middleware verifying the same access JWT (`auth.token` or `Authorization` header). On connect, the socket **joins a room named after the `userId`** — so `emitToUser(userId, event, data)` is just `io.to(userId).emit(...)`.

Timings are tuned for Render's ~55s idle cut-off: `pingInterval 25s + pingTimeout 20s = 45s`. Transports are `['polling', 'websocket']` so mobile can start with polling and upgrade.

**There is no Redis adapter.** Emits reach only sockets connected to the emitting process — which is precisely why the load balancer does sticky sessions and why `CallContext` keeps an independent polling fallback.

### FCM (`backend/src/v2/services/notifications.ts` + `frontend/index.js`)

Call signaling is deliberately **data-only** (no `notification` block) so the RN background handler always runs and can render the custom full-screen incoming-call UI via Notifee, instead of letting the OS draw a plain notification.

Device-side channels (created in `frontend/index.js`):

| Channel | Importance | Used for |
|---|---|---|
| `incoming_calls_v2` | HIGH | Ringing, custom ringtone, `fullScreenAction`, Accept/Reject actions |
| `ongoing_calls` | LOW | The in-call foreground service notification with a chronometer |
| `messages` | HIGH | Chat + high-priority admin broadcasts |
| `messages_quiet` | DEFAULT | Admin broadcasts sent at normal priority |

Message types handled in the background: `incoming_call_v2`, `call_cancelled`, `call_status_changed`, `chat`, `ping`, `marked_offline`, and `source: 'admin-dashboard'` broadcasts. Rejecting from the notification calls `POST /calls/:id/reject` directly from the background handler; accepting stashes `pendingCallData` in AsyncStorage and launches the activity.

Crashlytics is wired to the global JS error handler in `index.js`.

---

## 12. Background Jobs

**`node-cron`, in-process, in-memory** (`backend/src/v2/jobs/index.ts`) — started by `startJobs()` on each sub-app's listen callback. No queue, no distributed lock.

| Schedule | Job | What it does |
|---|---|---|
| `* * * * *` | **Abandoned call sweeper** | Finds `active` calls whose `lastHeartbeatAt` is >30s stale, ends them **at the last heartbeat timestamp** (so the student isn't billed for dead air), releases the mentor, settles |
| `* * * * *` | Upcoming call reminder | Pushes to both parties ~10 min before a `scheduled` call; deduped by a Redis key |
| `0 3 * * 1` | Weekly payouts | See §9.3 |
| `30 0 * * *` | Wallet transaction cleanup | Deletes `pending` transactions older than 24h |
| `0 1 * * *` | Top mentors recalculation | Rebuilds the cached leaderboard |
| `15 0 * * *` | Voucher installments | Credits due `VoucherSubscription` installments |
| `0 9,14,17 * * *` IST | Mentor ping | Data-only FCM liveness probe to online mentors |
| `0 2 * * *` IST | Ping audit | Reviews yesterday's ping/pong results |
| (own schedule) | Mentor promotion job | `jobs/promotionJob.ts`, level-ups against `MentorPromotionCondition` |
| `13 1 * * 0` | Partner stats sync | Lives in the **admin** app (`admin/app.ts`) |

Failures are written to `log_entries` (level `WARN`/`ERROR`) so they surface in the admin logs page.

---

## 13. Known Drift & Sharp Edges

Things a new engineer will otherwise discover the hard way.

**README says X, code does Y:**

| `README.md` claims | Reality |
|---|---|
| BullMQ job queue | `node-cron`, in-process. No BullMQ dependency exists. |
| Mobile uses Zustand + NativeWind | Mobile uses React Context + SWR + `StyleSheet`. Zustand is only in `website/`; NativeWind is nowhere. |
| Mentors heartbeat to Redis every 60s (TTL-based presence) | Presence keys have **no TTL**; state is transitioned explicitly. The FCM ping/pong is the (much slower) liveness check. |
| ₹10/min flat | Rate is per-mentor-level, resolved at runtime from `AppSetting`; `mentor_profiles.rate_per_min` defaults to **₹7**, and ₹10 is only the last-resort fallback. |

**Structural risks:**

1. **Cron jobs run once per sub-app, per instance.** `startJobs()` is called by both `v1/app.ts` and `v2/app.ts`, so a single backend process schedules every job **twice** — and each additional worker instance schedules them again. The sweeper and settlement are idempotent (thanks to the `settling` lock), but payouts, voucher installments, and reminders rely on softer guards (Redis dedupe keys, `pendingPayout ≥ 100`). Worth a distributed lock or a dedicated scheduler instance.
2. **Port default collision**: `v1/app.ts` defaults `PORT_V1` to **4001**, which is also `v2`'s default `PORT_V2`. The gateway meanwhile expects v1 on **4000**. Everything works only because every deploy sets both env vars explicitly.
3. **Socket.io has no Redis adapter.** Cross-instance `emitToUser` silently no-ops. Correctness currently depends on LB sticky sessions holding — and that map is per-LB-process, in-memory, and lost on restart.
4. **`redis.keys('presence:*')` on a hot path** (`getAvailableMentors`, used by mentor listings and free matchmaking). `KEYS` is O(N) and blocking; `SCAN` or a presence set would scale better. `cache.ts` already uses `SCAN` for invalidation, so the pattern exists in-repo.
5. **JWT secrets have insecure hardcoded defaults.** The app boots and logs an error instead of refusing to start.
6. **`/api/debug-storage` is unauthenticated** and reflects the decoded role/ref of the Supabase service key plus bucket names.
7. **In production, CORS is bypassed entirely when `NODE_ENV !== 'production'`** — correct behavior depends on that env var being set on every deploy.
8. **Missed-call timeouts are `setTimeout` in memory.** A process restart within that 60s window leaves the session in `calling` until the sweeper — which only looks at `active` calls — never reaches it. Such rows can linger.
9. **v1/v2 duplication is a full source copy.** Hand-edits to `src/v1` are destroyed by the next `snapshot:v1`; fixes must land in v2 and be re-snapshotted.
10. **`frontend/constants/endpoint.ts` ships a hardcoded LAN IP** (`http://192.168.0.120:8080/api`) with the production URLs commented out. Release builds depend on remembering to flip this line.
11. **No automated tests anywhere.** CI (`verify.yml`) only runs `tsc --noEmit` on `admin-frontend` and `website`; `backend` and `frontend` have `verify` scripts that CI never invokes.

---

## 14. Deployment & Environments

| Component | Host | Build | Start |
|---|---|---|---|
| Backend main + workers | Render | `pnpm install && pnpm run render:build` | `pnpm start` → `node src/app.ts` |
| Load balancer | Render | `pnpm run render:build` | `pnpm start` |
| Website | Vercel | `pnpm build` | `pnpm start` |
| Admin dashboard | Vercel (separate account) | `pnpm build` | `pnpm start` |
| Mobile app | GitHub Actions → Gradle release APK/AAB | `release.yml` (manual, takes a version input) | — |

`backend/scripts/render-build.sh` copies `/etc/secrets/firebase-secrets.json` into the project root, installs deps, and runs `prisma generate`. Note it does **not** run migrations.

**GitHub Actions** (`.github/workflows/`):

- `deploy_services.yml` — manual, checkbox-driven deploy of LB / main backend / workers / admin frontend / website / dev nodes.
- `prisma-migrate.yml` — manual; previews `prisma migrate status` before deploying migrations. **This is the production migration path**, not `render-build.sh`.
- `release.yml` — manual Android release build (includes a symlink workaround for Metro's monorepo root resolution).
- `render-load-balancer.yml` — stop/resume/restart the LB service via the Render API.
- `verify.yml` — PR gate: `tsc --noEmit` on `admin-frontend` and `website`.
- `codeql.yml` — path-filtered CodeQL (JS for backend/website/LB/admin, Java for `frontend/`).

Local infra: `docker-compose.yml` provides Postgres 15 and Redis 7. Redis is optional — `config/redis.ts` falls back to an in-memory mock (with a loud warning) when `REDIS_URL` is absent.

Env vars are catalogued in `environment_variables.md`.

---

## 15. Where to Look for What

| I need to… | Start here |
|---|---|
| Understand request routing | `backend/src/app.ts`, `load-balancer/index.js` |
| Change call behavior | `backend/src/v2/controllers/callController.ts` + `frontend/context/CallContext.tsx` |
| Change money | `backend/src/v2/services/billing.ts`, `routes/wallet.ts`, `routes/webhooks.ts` |
| Change pricing / free-call rules | `backend/src/v2/utils/pricing.ts` + the `app_settings` table (edit via admin dashboard) |
| Change who's shown as online | `backend/src/v2/services/presence.ts` |
| Change auth | `backend/src/v2/controllers/loginController.ts`, `utils/jwt.ts`, `auth/authenticateUser.ts` |
| Change the schema | `backend/prisma/schema.prisma` + a migration, then run `prisma-migrate.yml` |
| Change background processing | `backend/src/v2/jobs/index.ts` |
| Change chat rules | `backend/src/v2/services/chat/validation.ts` (+ `piiDetector`, `urlDetector`, `rateLimiter`) |
| Change push notifications | `backend/src/v2/services/notifications.ts` + `frontend/index.js` |
| Add an admin tool | `backend/src/admin/routes/` + `admin-frontend/app/dashboard/` |
| Cut a new API version | Edit `src/v2/`, run `pnpm --filter backend snapshot:v1`, bump `backend/app_version.json` |
| Debug production traffic | `log_entries` table → admin dashboard `/dashboard/developer-options/logs` |

---

*Generated by reverse-engineering the codebase. If you change the architecture, change this file in the same PR.*
