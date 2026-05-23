# Mentivo — Complete Technical Documentation

> Per-minute IITian mentorship marketplace. This document covers the full tech stack, backend architecture, service integrations, build roadmap, and a prompt to scaffold the app.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [Database Schema](#4-database-schema)
5. [Backend Setup](#5-backend-setup)
6. Service Integrations
   - [Agora — VoIP Calling & Chat](#61-agora--voip-calling--chat)
   - [Razorpay — Payments & Payouts](#62-razorpay--payments--payouts)
   - [Firebase — Auth & Notifications](#63-firebase--auth--notifications)
   - [Supabase — Hosting & Storage](#64-supabase--hosting--storage)

7. [Core Business Logic](#7-core-business-logic)
8. [API Reference](#8-api-reference)
9. [Build Roadmap](#9-build-roadmap)
10. [Environment Variables](#10-environment-variables)
11. [App Scaffolding Prompt](#11-app-scaffolding-prompt)

---

## 1. Product Overview

Mentivo is a **per-minute voice mentorship marketplace** connecting JEE aspirants (and their parents) in Tier-2/3 India with verified, current IIT students.

| Dimension | Detail |
|-----------|--------|
| Core mechanic | ₹10/min VoIP call, wallet-based, no subscription |
| Supply | Verified current IIT students across all IITs |
| Demand | JEE aspirants Class 11/12, droppers, parents |
| GTM | Offline-first via coaching institutes (Partners), then schools, then creators |
| Revenue | 30% platform commission on every call |
| Mentor share | 70% — ~₹7/min, ~₹70 per 10-min call |
| Coaching share | 5% revenue share for partner coaching centers on their students' usage |
| Free tier | First 5 minutes free for new users |

---

## 2. Tech Stack

### Frontend
| Layer | Technology | Reason |
|-------|-----------|--------|
| Mobile app | React Native (Expo → bare) | Single codebase for Android + iOS; Android-first |
| Partner Dashboard | Next.js (Website) | Web-based dashboard for coaching centers |
| State management | Zustand | Lightweight, no boilerplate |
| Navigation | React Navigation v6 | De-facto standard |
| HTTP client | Axios | Interceptors for auth tokens |
| UI components | NativeWind + custom components | Tailwind-class styling in RN |
| Push notifications | `@react-native-firebase/messaging` | FCM integration |
| VoIP & Chat | Agora SDK | In-app voice calls and initial chat feature |

### Backend
| Layer | Technology | Reason |
|-------|-----------|--------|
| Runtime | Node.js 20 LTS | Async-first, huge ecosystem |
| Framework | Express.js | Minimal, well-understood |
| Database | PostgreSQL (Supabase) | ACID transactions for billing |
| Cache / presence | Redis (Upstash or Supabase) | Mentor online/offline status, rate limiting |
| ORM | Prisma | Type-safe queries, easy migrations |
| Auth | Firebase Auth / Custom Code | Student/Mentor: Firebase; Coaching Center: Unique Code |
| File storage | Supabase Storage | Mentor profile photos, call recordings |
| Background jobs | BullMQ + Redis | Payout batch jobs, low-balance watchers |
| CDN | Supabase CDN | Asset delivery |

### Calling & Chat
| Service | Role |
|---------|------|
| Agora | VoIP voice calls & Chat — In-app communication with call timer on screen |

### Payments
| Service | Role |
|---------|------|
| Razorpay Standard | Student wallet top-up (UPI, cards, netbanking) |
| Razorpay X | Automated weekly payouts to mentor bank accounts |

### DevOps
| Tool | Role |
|------|------|
| AWS EC2 / Vercel | API server |
| Supabase | Primary DB & Storage |
| Redis | Presence & Job queues |
| PM2 | Node process manager |
| GitHub Actions | CI/CD pipeline |
| Sentry | Error monitoring |

---

## 3. System Architecture

```
┌──────────────────────────────────────────────┐
│              React Native App                │
│  (Student: browse, call, wallet, ratings)    │
│  (Mentor: go online, earnings, history)      │
│  (Call Screen: VoIP, Live Timer)             │
└────────────────────┬─────────────────────────┘
                     │ HTTPS REST
                     ▼
┌──────────────────────────────────────────────┐
│           Node.js / Express API              │
│                                              │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │  Auth layer │  │   Business logic     │  │
│  │ (Firebase/  │  │   (calls, billing,   │  │
│  │  Google)    │  │    ratings, payouts) │  │
│  └─────────────┘  └──────────────────────┘  │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │  Webhook    │  │   BullMQ job queue   │  │
│  │  handlers   │  │   (payouts, alerts)  │  │
│  └─────────────┘  └──────────────────────┘  │
└──────┬──────────────────────────────┬────────┘
       │                              │
       ▼                              ▼
┌─────────────┐              ┌──────────────────┐
│ PostgreSQL  │              │      Redis        │
│ (Supabase)  │              │  (presence,       │
│             │              │   job queues)     │
└─────────────┘              └──────────────────┘
       │
       │ integrations
       ▼
┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│   Agora     │   │   Razorpay   │   │   Supabase   │
│ (VoIP &     │   │ (top-up +    │   │   Storage    │
│  Chat)      │   │  payouts)    │   │   (photos)   │
└─────────────┘   └──────────────┘   └──────────────┘
```

### Call flow (critical path)

```
Student taps "Call Now"
        │
        ▼
POST /calls/initiate
  → check wallet balance ≥ ₹10
  → check mentor is online (Redis)
  → generate Agora Token
  → store call_session { status: 'pending', channel_id }
        │
        ▼
App joins Agora Channel
  → Student joins channel
  → Mentor receives push notification/socket event to join
  → VoIP call starts in-app
  → App screen starts timer
        │
        ▼
App updates status to 'in-progress'
  → POST /calls/:id/start
  → Update call_session { status: 'active', started_at }
        │
        ▼
Call ends (either party hangs up, or max duration hit)
  → App leaves Agora Channel
  → POST /calls/:id/end
  → settleBilling(sessionId, durationSecs) — atomic DB transaction:
      • debit student wallet
      • credit mentor pending_payout
      • update call_session { status: 'settled' }
        │
        ▼
POST /calls/:id/rate (student submits 1–5 star rating)
```

---

## 4. Database Schema

```sql
-- Users (both students and mentors)
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT UNIQUE NOT NULL,
  phone             TEXT UNIQUE NOT NULL,              -- collected but unverified
  is_email_verified BOOLEAN DEFAULT FALSE,
  name              TEXT,
  role              TEXT NOT NULL CHECK (role IN ('student', 'mentor', 'admin')),
  firebase_uid      TEXT UNIQUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Mentor profiles
CREATE TABLE mentor_profiles (
  mentor_id       UUID PRIMARY KEY REFERENCES users(id),
  iit_name        TEXT NOT NULL,                    -- e.g. 'IIT Bombay'
  branch          TEXT,
  year            INT,
  verified        BOOLEAN DEFAULT FALSE,
  id_doc_url      TEXT,                              -- Supabase Storage URL
  bio             TEXT,
  photo_url       TEXT,
  rate_per_min    NUMERIC(6,2) DEFAULT 10.00,
  avg_rating      NUMERIC(3,2) DEFAULT 0,
  total_calls     INT DEFAULT 0,
  is_online       BOOLEAN DEFAULT FALSE,
  last_online_at  TIMESTAMPTZ
);

-- Student wallets
CREATE TABLE wallets (
  user_id   UUID PRIMARY KEY REFERENCES users(id),
  balance   NUMERIC(10,2) DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mentor earnings ledger
CREATE TABLE mentor_balances (
  mentor_id       UUID PRIMARY KEY REFERENCES users(id),
  pending_payout  NUMERIC(10,2) DEFAULT 0,
  total_earned    NUMERIC(10,2) DEFAULT 0,
  total_withdrawn NUMERIC(10,2) DEFAULT 0
);

-- Wallet top-up transactions
CREATE TABLE wallet_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  amount          NUMERIC(10,2) NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('topup', 'debit', 'refund')),
  razorpay_order_id  TEXT,
  razorpay_payment_id TEXT,
  status          TEXT DEFAULT 'pending',            -- pending | success | failed
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Call sessions
CREATE TABLE call_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES users(id),
  mentor_id       UUID NOT NULL REFERENCES users(id),
  agora_channel_id TEXT,                             -- Agora Channel ID
  status          TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending','active','settled','failed','refunded')),
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  duration_secs   INT DEFAULT 0,
  amount_charged  NUMERIC(10,2) DEFAULT 0,
  mentor_earning  NUMERIC(10,2) DEFAULT 0,
  platform_fee    NUMERIC(10,2) DEFAULT 0,
  is_free         BOOLEAN DEFAULT FALSE,             -- first-call free flag
  settled_at      TIMESTAMPTZ,
  recording_url   TEXT,                              -- Supabase Storage URL
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Ratings
CREATE TABLE ratings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID UNIQUE REFERENCES call_sessions(id),
  student_id  UUID REFERENCES users(id),
  mentor_id   UUID REFERENCES users(id),
  score       INT NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Mentor payout records
CREATE TABLE payouts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id         UUID REFERENCES users(id),
  amount            NUMERIC(10,2) NOT NULL,
  razorpay_payout_id TEXT,
  status            TEXT DEFAULT 'pending',
  tds_deducted      NUMERIC(10,2) DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Coaching partner referrals
CREATE TABLE coaching_centers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  code            TEXT UNIQUE NOT NULL,              -- unique login code
  commission_rate NUMERIC(3,2) DEFAULT 0.05,        -- 5% revenue share
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Coaching center earnings ledger
CREATE TABLE coaching_center_balances (
  center_id       UUID PRIMARY KEY REFERENCES coaching_centers(id),
  pending_payout  NUMERIC(10,2) DEFAULT 0,
  total_earned    NUMERIC(10,2) DEFAULT 0,
  total_withdrawn NUMERIC(10,2) DEFAULT 0
);

-- Update users to link to coaching centers
ALTER TABLE users ADD COLUMN coaching_center_id UUID REFERENCES coaching_centers(id);

-- Indexes
CREATE INDEX idx_users_coaching_center ON users(coaching_center_id);
CREATE INDEX idx_coaching_centers_code ON coaching_centers(code);
```

---

## 5. Backend Setup

### Project structure

```
mentivo-api/
├── src/
│   ├── config/
│   │   ├── db.js           # Prisma client (Supabase)
│   │   ├── redis.js        # Redis client (ioredis)
│   │   └── firebase.js     # Firebase Admin SDK
│   ├── middleware/
│   │   ├── auth.js         # Verify Firebase/Google ID token
│   │   ├── rateLimit.js    # Per-user rate limiting (Redis)
│   │   └── validate.js     # Zod schema validation
│   ├── routes/
│   │   ├── auth.js         # POST /auth/verify
│   │   ├── mentors.js      # GET /mentors, GET /mentors/:id
│   │   ├── calls.js        # POST /calls/initiate, POST /calls/:id/start, POST /calls/:id/end
│   │   ├── wallet.js       # POST /wallet/topup, GET /wallet/balance
│   │   ├── ratings.js      # POST /calls/:id/rate
│   │   ├── payouts.js      # Admin: trigger weekly payouts
│   │   └── webhooks.js     # POST /webhooks/razorpay
│   ├── services/
│   │   ├── agora.js        # Agora Token generation
│   │   ├── razorpay.js     # Razorpay API wrapper
│   │   ├── billing.js      # settleBilling() — atomic transaction
│   │   ├── presence.js     # Mentor online/offline via Redis
│   │   └── notifications.js # FCM push notifications
│   ├── jobs/
│   │   ├── payoutJob.js    # Weekly mentor payout batch
│   │   └── balanceWatcher.js # Watcher for low balance
│   └── app.js
├── prisma/
│   └── schema.prisma
├── .env
└── package.json
```

### Initial setup

```bash
# Init project
mkdir mentivo-api && cd mentivo-api
npm init -y
npm install express prisma @prisma/client ioredis axios
npm install razorpay firebase-admin bullmq zod helmet cors morgan
npm install agora-access-token dotenv express-async-errors

# Dev dependencies
npm install -D nodemon eslint

# Init Prisma
npx prisma init
```

### `src/app.js`

```js
require('dotenv').config();
require('express-async-errors');

const express  = require('express');
const helmet   = require('helmet');
const cors     = require('cors');
const morgan   = require('morgan');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') }));
app.use(morgan('combined'));

// Raw body needed for webhook signature verification
app.use('/webhooks/razorpay', express.raw({ type: 'application/json' }));
app.use(express.json());

// Routes
app.use('/auth',     require('./routes/auth'));
app.use('/mentors',  require('./routes/mentors'));
app.use('/calls',    require('./routes/calls'));
app.use('/wallet',   require('./routes/wallet'));
app.use('/ratings',  require('./routes/ratings'));
app.use('/webhooks', require('./routes/webhooks'));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Mentivo API running on port ${PORT}`));
```

### `src/middleware/auth.js`

```js
const admin = require('../config/firebase');

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    req.email = decoded.email;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

## 6. Service Integrations

### 6.1 Agora — VoIP Calling & Chat

**How it works:** Mentivo uses Agora for in-app VoIP calls. When a student initiates a call, the server generates an Agora RTC token for a specific channel. Both student and mentor join this channel to communicate. Initial chat is also handled via Agora Chat.

**Setup steps:**
1. Sign up at [agora.io](https://agora.io)
2. Create a project and get App ID and App Certificate
3. Enable Real-time Communications (RTC) and Agora Chat

**`src/services/agora.js`**

```js
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

function generateToken(channelName, uid) {
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    privilegeExpiredTs
  );

  return token;
}

module.exports = { generateToken };
```

**`src/routes/calls.js` — Call Initiation**

```js
const router = require('express').Router();
const { generateToken } = require('../services/agora');
const db = require('../config/db');

router.post('/initiate', async (req, res) => {
  const { mentorId } = req.body;
  const studentId = req.user.id;

  // 1. Validate wallet balance
  const wallet = await db.wallet.findUnique({ where: { userId: studentId } });
  if (!wallet || wallet.balance < 10) return res.status(402).json({ error: 'Insufficient balance' });

  // 2. Create session
  const channelName = `call_${Date.now()}_${studentId}`;
  const session = await db.callSession.create({
    data: {
      student_id: studentId,
      mentor_id: mentorId,
      agora_channel_id: channelName,
      status: 'pending'
    }
  });

  // 3. Generate tokens for both
  const studentToken = generateToken(channelName, studentId);
  const mentorToken = generateToken(channelName, mentorId);

  res.json({ sessionId: session.id, channelName, studentToken, mentorToken });
});

router.post('/:id/start', async (req, res) => {
  await db.callSession.update({
    where: { id: req.params.id },
    data: { status: 'active', startedAt: new Date() }
  });
  res.sendStatus(200);
});

router.post('/:id/end', async (req, res) => {
  const { durationSecs } = req.body;
  const billing = require('../services/billing');
  await billing.settle(req.params.id, durationSecs);
  res.sendStatus(200);
});

module.exports = router;
```

**`src/services/billing.js`**

```js
const db = require('../config/db');

const RATE_PER_MIN   = 10;   // ₹10 per minute
const MENTOR_SHARE   = 0.70; // 70%
const FREE_SECONDS   = 300;  // first 5 minutes free

async function settle(sessionId, durationSecs, recordingUrl) {
  const billableSecs  = Math.max(0, durationSecs - FREE_SECONDS);
  const billableMins  = Math.ceil(billableSecs / 60);
  const totalCharge   = billableMins * RATE_PER_MIN;
  const mentorEarning = parseFloat((totalCharge * MENTOR_SHARE).toFixed(2));
  const platformFee   = parseFloat((totalCharge - mentorEarning).toFixed(2));

  // Atomic transaction — debit wallet AND credit mentor in one operation
  await db.$transaction(async (tx) => {
    if (totalCharge > 0) {
      // Debit student wallet — will throw if balance constraint violated
      await tx.$executeRaw`
        UPDATE wallets
        SET balance = balance - ${totalCharge}, updated_at = NOW()
        WHERE user_id = (SELECT student_id FROM call_sessions WHERE id = ${sessionId}::uuid)
          AND balance >= ${totalCharge}
      `;

      // Credit mentor ledger
      await tx.mentorBalance.updateMany({
        where: { mentorId: { equals: db.$raw(`(SELECT mentor_id FROM call_sessions WHERE id = '${sessionId}')`) } },
        data: {
          pendingPayout: { increment: mentorEarning },
          totalEarned:   { increment: mentorEarning },
        }
      });
    }

    // Settle the session record
    await tx.callSession.update({
      where: { id: sessionId },
      data: {
        status:        'settled',
        durationSecs,
        amountCharged: totalCharge,
        mentorEarning,
        platformFee,
        recordingUrl,
        settledAt:     new Date(),
      }
    });
  });
}

module.exports = { settle };
```

---

### 6.2 Razorpay — Payments & Payouts

**Two separate products:** Razorpay Standard for student wallet top-ups, and Razorpay X for mentor payouts.

**`src/services/razorpay.js`**

```js
const Razorpay = require('razorpay');
const crypto   = require('crypto');

const rz = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create a Razorpay order for wallet top-up
async function createTopupOrder(amountRupees, userId) {
  return rz.orders.create({
    amount:   amountRupees * 100,  // Razorpay uses paise
    currency: 'INR',
    notes:    { userId, type: 'wallet_topup' },
  });
}

// Verify Razorpay payment signature after checkout
function verifyPayment(orderId, paymentId, signature) {
  const body   = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body).digest('hex');
  return expected === signature;
}

// Payout to mentor bank account via Razorpay X
async function payoutToMentor(mentorId, amountRupees, bankAccountId) {
  return rz.payouts.create({
    account_number: process.env.RAZORPAY_X_ACCOUNT,
    fund_account_id: bankAccountId,
    amount:          amountRupees * 100,
    currency:        'INR',
    mode:            'IMPS',
    purpose:         'payout',
    notes:           { mentorId, type: 'mentor_payout' },
  });
}

module.exports = { createTopupOrder, verifyPayment, payoutToMentor };
```

**Wallet top-up flow (route)**

```js
// POST /wallet/topup — step 1: create order
router.post('/topup', auth, async (req, res) => {
  const { amount } = req.body; // e.g. 100, 200, 500
  if (amount < 10) return res.status(400).json({ error: 'Minimum top-up ₹10' });

  const order = await razorpay.createTopupOrder(amount, req.user.id);

  // Store pending transaction
  await db.walletTransaction.create({
    data: { userId: req.user.id, amount, type: 'topup',
            razorpayOrderId: order.id, status: 'pending' }
  });

  res.json({ orderId: order.id, amount, currency: 'INR',
             key: process.env.RAZORPAY_KEY_ID });
});

// POST /wallet/topup/confirm — step 2: verify and credit wallet
router.post('/topup/confirm', auth, async (req, res) => {
  const { orderId, paymentId, signature } = req.body;

  if (!razorpay.verifyPayment(orderId, paymentId, signature)) {
    return res.status(400).json({ error: 'Payment verification failed' });
  }

  await db.$transaction(async (tx) => {
    const txn = await tx.walletTransaction.findFirst({
      where: { razorpayOrderId: orderId, status: 'pending' }
    });
    await tx.wallet.update({
      where: { userId: txn.userId },
      data:  { balance: { increment: txn.amount } }
    });
    await tx.walletTransaction.update({
      where: { id: txn.id },
      data:  { status: 'success', razorpayPaymentId: paymentId }
    });
  });

  res.json({ success: true });
});
```

---

### 6.3 Firebase — Auth & Notifications

**Auth (Email/Google)**

```js
// src/config/firebase.js
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId:   process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  })
});

module.exports = admin;
```

The React Native app handles authentication using Firebase Auth (or Google Sign-In). After login, Firebase returns an ID token sent to the API in the `Authorization: Bearer <token>` header. Your `auth.js` middleware verifies it and extracts the user's email.

**Push notifications**

```js
// src/services/notifications.js
const admin = require('../config/firebase');

async function sendMentorOnlineAlert(studentFcmTokens, mentorName) {
  await admin.messaging().sendEachForMulticast({
    tokens: studentFcmTokens,
    notification: {
      title: `${mentorName} is online`,
      body:  'Tap to start a session now',
    },
    data: { type: 'mentor_online' },
  });
}

async function sendLowBalanceAlert(fcmToken, balance) {
  await admin.messaging().send({
    token: fcmToken,
    notification: {
      title: 'Low wallet balance',
      body:  `You have ₹${balance} left — top up to keep calling`,
    },
    data: { type: 'low_balance' },
  });
}

async function sendPostCallRatingPrompt(fcmToken, sessionId, mentorName) {
  await admin.messaging().send({
    token: fcmToken,
    notification: {
      title: 'How was your session?',
      body:  `Rate your call with ${mentorName}`,
    },
    data: { type: 'rate_call', sessionId },
  });
}

module.exports = { sendMentorOnlineAlert, sendLowBalanceAlert, sendPostCallRatingPrompt };
```

---

### 6.4 Supabase — Hosting & Storage

**Hosting**

The API server can be hosted on **Vercel**, **AWS EC2**, or directly via **Supabase Edge Functions** (if preferred). Primary database and storage are handled by Supabase.

**Supabase Storage — Profile photos and call recordings**

```js
// src/services/storage.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function getUploadUrl(bucket, path) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path);
  return data.signedUrl;
}

function getPublicUrl(bucket, path) {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  return data.publicUrl;
}

module.exports = { getUploadUrl, getPublicUrl };
```

---

## 7. Core Business Logic

### Mentor online/offline presence (Redis)

```js
// src/services/presence.js
const redis = require('../config/redis');
const ONLINE_TTL = 300; // 60s TTL — mentor must heartbeat every 30s

async function setOnline(mentorId, fcmToken) {
  await redis.setex(`presence:${mentorId}`, ONLINE_TTL, JSON.stringify({ fcmToken }));
  await db.mentorProfile.update({
    where: { mentorId },
    data:  { isOnline: true, lastOnlineAt: new Date() }
  });
}

async function setOffline(mentorId) {
  await redis.del(`presence:${mentorId}`);
  await db.mentorProfile.update({
    where: { mentorId },
    data:  { isOnline: false }
  });
}

async function isOnline(mentorId) {
  return !!(await redis.exists(`presence:${mentorId}`));
}

async function getOnlineMentors() {
  const keys = await redis.keys('presence:*');
  return keys.map(k => k.replace('presence:', ''));
}
```

### Pre-call wallet check

```js
// In POST /calls/initiate
const MIN_BALANCE = 10; // must have at least ₹10 (1 min)

const wallet = await db.wallet.findUnique({ where: { userId: studentId } });
if (!wallet || wallet.balance < MIN_BALANCE) {
  return res.status(402).json({
    error: 'Insufficient balance',
    balance: wallet?.balance || 0,
    required: MIN_BALANCE,
  });
}
```

### Rating and mentor score update

```js
// POST /calls/:id/rate
router.post('/:id/rate', auth, async (req, res) => {
  const { score, comment } = req.body;
  const session = await db.callSession.findUnique({ where: { id: req.params.id } });

  await db.$transaction(async (tx) => {
    await tx.rating.create({
      data: { sessionId: session.id, studentId: req.user.id,
              mentorId: session.mentorId, score, comment }
    });

    // Recalculate mentor's average rating
    const { _avg } = await tx.rating.aggregate({
      where:   { mentorId: session.mentorId },
      _avg:    { score: true },
    });

    await tx.mentorProfile.update({
      where: { mentorId: session.mentorId },
      data:  { avgRating: _avg.score, totalCalls: { increment: 1 } }
    });
  });

  res.json({ success: true });
});
```

---

## 8. API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/verify` | — | Exchange Firebase/Google token for user record |
| POST | `/auth/coaching/login` | — | Login for coaching centers via unique code |
| GET | `/coaching/dashboard` | Center | Aggregated data of students for coaching center |
| GET | `/mentors` | Required | List online mentors with filters |
| GET | `/mentors/:id` | Required | Single mentor profile |
| PATCH | `/mentors/me/online` | Mentor | Set online status + heartbeat |
| POST | `/calls/initiate` | Required | Start an Agora VoIP session |
| POST | `/calls/:id/start` | Required | Mark call as active (start billing) |
| POST | `/calls/:id/end` | Required | End call and trigger settlement |
| GET | `/calls/:id` | Required | Get call session details |
| POST | `/calls/:id/rate` | Required | Submit post-call rating |
| GET | `/wallet/balance` | Required | Get student wallet balance |
| POST | `/wallet/topup` | Required | Create Razorpay top-up order |
| POST | `/wallet/topup/confirm` | Required | Confirm payment + credit wallet |
| POST | `/webhooks/razorpay` | — (signed) | Razorpay payment callbacks |

---

## 9. Build Roadmap

### Phase 1 — MVP (Weeks 1–6)
**Goal:** One working end-to-end VoIP call with billing.

| Week | Tasks |
|------|-------|
| 1 | Agora account setup. Razorpay account setup. Firebase project. Supabase project provisioned. |
| 2 | DB schema + Prisma migrations. Auth middleware (Firebase/Google). `/auth/verify` endpoint. |
| 3 | Agora `generateToken()` service. `/calls/initiate` route. Call screen with VoIP integration. |
| 4 | `settleBilling()` atomic transaction. Wallet debit + mentor credit. Test end-to-end in-app. |
| 5 | Razorpay wallet top-up flow (create order → confirm → credit). Wallet balance check before calls. |
| 6 | React Native app: Google login, mentor list, single-tap call, in-app timer, wallet top-up. |

**Exit criteria:** A real in-app VoIP call completes between two devices, wallet is debited correctly, mentor earnings are credited.

---

### Phase 2 — Trust layer (Weeks 7–14)
**Goal:** Verification, ratings, partner dashboard, mentor app.

| Week | Tasks |
|------|-------|
| 7–8 | Mentor onboarding: profile creation, ID doc upload to Supabase, admin verification panel. |
| 9–10 | Post-call rating flow. Mentor average score calculation. Auto-flag mentors below 3.0. |
| 11–12 | Coaching Partner Portal: Unique code login, student aggregation dashboard, 5% revenue share logic. |
| 13–14 | FCM push notifications: mentor online alerts, low balance warning, post-call rating prompt. |

---

### Phase 3 — Payouts + quality (Weeks 15–20)
**Goal:** Automated payouts, quality monitoring, production hardening.

| Week | Tasks |
|------|-------|
| 15–16 | Razorpay X payout integration. Weekly BullMQ batch job. TDS deduction logic. Mentor earnings screen. |
| 17–18 | Quality monitoring: monitor call drops, Agora quality logs, student feedback. |
| 19 | Sentry error monitoring. Supabase CDN for assets. Load testing with k6. |
| 20 | Play Store submission. Soft launch with first coaching partner batch. |

---

## 10. Environment Variables

```env
# Server
PORT=3000
API_BASE_URL=https://api.mentivo.in
ALLOWED_ORIGINS=https://mentivo.in,exp://

# Database
DATABASE_URL=postgresql://user:pass@db.supabase.co:5432/postgres

# Redis
REDIS_URL=redis://your-redis-host:6379

# Firebase
FIREBASE_PROJECT_ID=mentivo-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@mentivo-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."

# Agora
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_app_certificate

# Razorpay
RAZORPAY_KEY_ID=rzp_live_XXXX
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_X_ACCOUNT=4564563214567654   # Razorpay X account number

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_key

# Incentives & Referrals
REFERRAL_STUDENT_INCENTIVE=50
REFERRAL_ADMIN_INCENTIVE=20
```

---

## 11. App Scaffolding Prompt

Use this prompt with any capable AI coding assistant to scaffold the full Mentivo application.

---

```
Build a full-stack per-minute mentorship marketplace app called Mentivo.
Here is the complete specification:

=== PRODUCT ===
Mentivo connects JEE aspirants with verified IIT students via in-app VoIP calls.
Students pay ₹10/min. Mentors keep 70%. First 5 minutes are free for new users.
Phone number is mandatory (collected but unverified); login via Email/Password (verified) or Google.

=== BACKEND (Node.js + Express + PostgreSQL + Redis) ===

Build a REST API with the following:

1. AUTH
   - Firebase Admin SDK for verifying ID tokens (Email/Google)
   - Middleware: extract token, verify, attach req.user (id, email, etc.)

2. DATABASE (PostgreSQL via Prisma on Supabase)
   Tables: users (email, phone, role, is_email_verified), mentor_profiles,
   wallets, mentor_balances, wallet_transactions, call_sessions (agora_channel_id),
   ratings, payouts, referrals

3. AGORA INTEGRATION (VoIP & Chat)
   - POST /calls/initiate: generate Agora RTC tokens for student/mentor
   - POST /calls/:id/start: mark started_at
   - POST /calls/:id/end: call settleBilling(duration)
   - Initial chat feature using Agora Chat

4. BILLING (settleBilling)
   - Atomic Prisma transaction: debit student wallet, credit mentor, update session.
   - Ceil minutes, subtract 5 min free for first-timers.

5. RAZORPAY
   - Wallet top-up (Standard) and Mentor Payouts (Razorpay X).

6. ROUTES
   /auth/verify, /mentors, /mentors/:id, /calls/initiate, /calls/:id/start,
   /calls/:id/end, /calls/:id/rate, /wallet/balance, /wallet/topup

=== FRONTEND (React Native + Expo) ===

1. LOGIN: Google Sign-In or Email/Password with verification.
2. MENTOR LIST: Filter by IIT, rating, online status.
3. CALL SCREEN: Agora RTC integration, live timer, running cost, End Call.
4. CHAT: First-step chat via Agora Chat.
5. WALLET: Razorpay integration for top-up.

Generate complete code for backend and frontend, Prisma schema, and setup docs.
```

---

*Document version 1.0 — Mentivo internal technical reference*
*Founders: Abhiraj (CEO) · Ayan (CTO)*## 8. API Endpoints Generated
- **POST /auth/verify:** Receives email, role, name, uid. Finds or creates the user in the database. Returns user object. Used as a mock authentication setup.
- **General Notes:**
   - The Exotel setup was intentionally bypassed as per instructions.
   - Additional routing scaffolds for calls, wallets, etc are set up but only basic Auth is actively wired for immediate UI integration.

## 9. Screens Generated
- LandingPage (`src/screens/LandingPage.js`): Homepage for discovery
- FindAMentor (`src/screens/FindAMentor.js`): Discovery page for viewing available mentors
- BookYourSession (`src/screens/BookYourSession.js`): Calendar/Slot selection flow
- MentorDashboard (`src/screens/MentorDashboard.js`): Analytics and session tracking for mentors
- SessionChat (`src/screens/SessionChat.js`): In-session messaging view
- AudioCall (`src/screens/AudioCall.js`): Live mentor-student call view.

## Integration
The frontend utilizes a bottom tab navigator for primary pages (Home, Discovery, Mentor Dashboard) and nested stack screens for Book Session, Audio Call, and Session Chat to emulate practical app flow. The backend Express API runs concurrently with Prisma/PostgreSQL to test auth flows.
Google Sign-In or Email/Password with verification.
2. MENTOR LIST: Filter by IIT, rating, online status.
3. CALL SCREEN: Agora RTC integration, live timer, running cost, End Call.
4. CHAT: First-step chat via Agora Chat.
5. WALLET: Razorpay integration for top-up.

Generate complete code for backend and frontend, Prisma schema, and setup docs.
```

---

*Document version 1.0 — Mentivo internal technical reference*
*Founders: Abhiraj (CEO) · Ayan (CTO)*## 8. API Endpoints Generated
- **POST /auth/verify:** Receives email, role, name, uid. Finds or creates the user in the database. Returns user object. Used as a mock authentication setup.
- **General Notes:**
   - The Exotel setup was intentionally bypassed as per instructions.
   - Additional routing scaffolds for calls, wallets, etc are set up but only basic Auth is actively wired for immediate UI integration.

## 9. Screens Generated
- LandingPage (`src/screens/LandingPage.js`): Homepage for discovery
- FindAMentor (`src/screens/FindAMentor.js`): Discovery page for viewing available mentors
- BookYourSession (`src/screens/BookYourSession.js`): Calendar/Slot selection flow
- MentorDashboard (`src/screens/MentorDashboard.js`): Analytics and session tracking for mentors
- SessionChat (`src/screens/SessionChat.js`): In-session messaging view
- AudioCall (`src/screens/AudioCall.js`): Live mentor-student call view.

## Integration
The frontend utilizes a bottom tab navigator for primary pages (Home, Discovery, Mentor Dashboard) and nested stack screens for Book Session, Audio Call, and Session Chat to emulate practical app flow. The backend Express API runs concurrently with Prisma/PostgreSQL to test auth flows.
