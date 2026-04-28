# Mentivo — Complete Technical Documentation

> Per-minute IITian mentorship marketplace. This document covers the full tech stack, backend architecture, service integrations, build roadmap, and a prompt to scaffold the app.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [Database Schema](#4-database-schema)
5. [Backend Setup](#5-backend-setup)
6. [Service Integrations](#6-service-integrations)
   - [Exotel — Masked Calling](#61-exotel--masked-calling)
   - [Razorpay — Payments & Payouts](#62-razorpay--payments--payouts)
   - [Firebase — OTP & Notifications](#63-firebase--otp--notifications)
   - [AWS — Hosting & Storage](#64-aws--hosting--storage)
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
| Core mechanic | ₹10/min voice call, wallet-based, no subscription |
| Supply | Verified current IIT students across all IITs |
| Demand | JEE aspirants Class 11/12, droppers, parents |
| GTM | Offline-first via coaching institutes, then schools, then creators |
| Revenue | 30% platform commission on every call |
| Mentor share | 70% — ~₹7/min, ~₹70 per 10-min call |
| Free tier | First 5 minutes free for new users |

---

## 2. Tech Stack

### Frontend
| Layer | Technology | Reason |
|-------|-----------|--------|
| Mobile app | React Native (Expo → bare) | Single codebase for Android + iOS; Android-first |
| State management | Zustand | Lightweight, no boilerplate |
| Navigation | React Navigation v6 | De-facto standard |
| HTTP client | Axios | Interceptors for auth tokens |
| UI components | NativeWind + custom components | Tailwind-class styling in RN |
| Push notifications | `@react-native-firebase/messaging` | FCM integration |

### Backend
| Layer | Technology | Reason |
|-------|-----------|--------|
| Runtime | Node.js 20 LTS | Async-first, huge ecosystem |
| Framework | Express.js | Minimal, well-understood |
| Database | PostgreSQL 16 (AWS RDS) | ACID transactions for billing |
| Cache / presence | Redis 7 (AWS ElastiCache) | Mentor online/offline status, rate limiting |
| ORM | Prisma | Type-safe queries, easy migrations |
| Auth | Firebase Auth (phone/OTP) | Handles SMS OTP natively on Android |
| File storage | AWS S3 | Mentor profile photos, call recordings |
| Background jobs | BullMQ + Redis | Payout batch jobs, low-balance watchers |
| CDN | AWS CloudFront | S3 asset delivery |

### Calling
| Service | Role |
|---------|------|
| Exotel | Masked voice calls — neither party sees the other's real number |

### Payments
| Service | Role |
|---------|------|
| Razorpay Standard | Student wallet top-up (UPI, cards, netbanking) |
| Razorpay X | Automated weekly payouts to mentor bank accounts |

### DevOps
| Tool | Role |
|------|------|
| AWS EC2 (t3.small → t3.medium) | API server |
| AWS RDS (PostgreSQL) | Primary DB |
| AWS ElastiCache | Redis |
| AWS S3 + CloudFront | Media storage + CDN |
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
└────────────────────┬─────────────────────────┘
                     │ HTTPS REST
                     ▼
┌──────────────────────────────────────────────┐
│           Node.js / Express API              │
│                                              │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │  Auth layer │  │   Business logic     │  │
│  │  (Firebase) │  │   (calls, billing,   │  │
│  └─────────────┘  │    ratings, payouts) │  │
│                   └──────────────────────┘  │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │  Webhook    │  │   BullMQ job queue   │  │
│  │  handlers   │  │   (payouts, alerts)  │  │
│  └─────────────┘  └──────────────────────┘  │
└──────┬──────────────────────────────┬────────┘
       │                              │
       ▼                              ▼
┌─────────────┐              ┌──────────────────┐
│ PostgreSQL  │              │      Redis        │
│ (RDS)       │              │  (presence,       │
│             │              │   job queues)     │
└─────────────┘              └──────────────────┘
       │
       │ calls out to
       ▼
┌─────────────┐   ┌──────────────┐   ┌──────────┐
│   Exotel    │   │   Razorpay   │   │  AWS S3  │
│ (masked     │   │ (top-up +    │   │ (photos, │
│  calls)     │   │  payouts)    │   │  records)│
└─────────────┘   └──────────────┘   └──────────┘
       │
       │ webhooks back to API
       ▼
  /webhooks/exotel
  /webhooks/razorpay
```

### Call flow (critical path)

```
Student taps "Call Now"
        │
        ▼
POST /calls/initiate
  → check wallet balance ≥ ₹50 (5 min buffer)
  → check mentor is online (Redis)
  → call Exotel API (connect.json)
  → store call_session { status: 'pending', exotel_sid }
        │
        ▼
Exotel bridges the call via virtual number
  → Student's phone rings (incoming from virtual no.)
  → Mentor's phone rings (incoming from virtual no.)
  → Neither party sees the other's real number
        │
        ▼
Exotel fires webhook: Status = 'in-progress'
  → POST /webhooks/exotel?session=<id>
  → Update call_session { status: 'active', started_at }
        │
        ▼
Call ends (either party hangs up, or max duration hit)
        │
        ▼
Exotel fires webhook: Status = 'completed', Duration = N seconds
  → POST /webhooks/exotel?session=<id>
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
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         TEXT UNIQUE NOT NULL,
  name          TEXT,
  role          TEXT NOT NULL CHECK (role IN ('student', 'mentor', 'admin')),
  firebase_uid  TEXT UNIQUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Mentor profiles
CREATE TABLE mentor_profiles (
  mentor_id       UUID PRIMARY KEY REFERENCES users(id),
  iit_name        TEXT NOT NULL,                    -- e.g. 'IIT Bombay'
  branch          TEXT,
  year            INT,
  verified        BOOLEAN DEFAULT FALSE,
  id_doc_url      TEXT,                              -- S3 URL for verification doc
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
  exotel_sid      TEXT,                              -- Exotel's Call.Sid
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
  recording_url   TEXT,                              -- S3 URL
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
CREATE TABLE referrals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_code   TEXT NOT NULL,                     -- coaching centre code
  referred_user_id UUID REFERENCES users(id),
  commission_paid NUMERIC(10,2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_call_sessions_student   ON call_sessions(student_id);
CREATE INDEX idx_call_sessions_mentor    ON call_sessions(mentor_id);
CREATE INDEX idx_call_sessions_exotel    ON call_sessions(exotel_sid);
CREATE INDEX idx_mentor_profiles_online  ON mentor_profiles(is_online) WHERE is_online = TRUE;
CREATE INDEX idx_ratings_mentor          ON ratings(mentor_id);
```

---

## 5. Backend Setup

### Project structure

```
mentivo-api/
├── src/
│   ├── config/
│   │   ├── db.js           # Prisma client
│   │   ├── redis.js        # Redis client (ioredis)
│   │   └── firebase.js     # Firebase Admin SDK
│   ├── middleware/
│   │   ├── auth.js         # Verify Firebase ID token
│   │   ├── rateLimit.js    # Per-user rate limiting (Redis)
│   │   └── validate.js     # Zod schema validation
│   ├── routes/
│   │   ├── auth.js         # POST /auth/verify
│   │   ├── mentors.js      # GET /mentors, GET /mentors/:id
│   │   ├── calls.js        # POST /calls/initiate, GET /calls/:id
│   │   ├── wallet.js       # POST /wallet/topup, GET /wallet/balance
│   │   ├── ratings.js      # POST /calls/:id/rate
│   │   ├── payouts.js      # Admin: trigger weekly payouts
│   │   └── webhooks.js     # POST /webhooks/exotel, /webhooks/razorpay
│   ├── services/
│   │   ├── exotel.js       # Exotel API wrapper
│   │   ├── razorpay.js     # Razorpay API wrapper
│   │   ├── billing.js      # settleBilling() — atomic transaction
│   │   ├── presence.js     # Mentor online/offline via Redis
│   │   └── notifications.js # FCM push notifications
│   ├── jobs/
│   │   ├── payoutJob.js    # Weekly mentor payout batch
│   │   └── balanceWatcher.js # Cut call if wallet empty
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
npm install dotenv express-async-errors

# Dev dependencies
npm install -D nodemon eslint

# Init Prisma
npx prisma init

# Run migrations after writing schema.prisma
npx prisma migrate dev --name init
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
app.use('/webhooks', express.raw({ type: 'application/json' }));
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
    req.phone = decoded.phone_number;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

## 6. Service Integrations

### 6.1 Exotel — Masked Calling

**How it works:** Your server calls Exotel's `Calls/connect.json` endpoint. Exotel calls the student and mentor separately, then bridges both legs — showing your ExoPhone (virtual number) to both parties. Neither sees the other's real number.

**Setup steps:**
1. Sign up at [exotel.com](https://exotel.com)
2. Get your SID, API Key, API Token from the dashboard
3. Buy an ExoPhone number (virtual number)
4. Set your StatusCallback URL in the API call (not the dashboard)

**`src/services/exotel.js`**

```js
const axios = require('axios');

const BASE = `https://api.exotel.com/v1/Accounts/${process.env.EXOTEL_SID}`;
const AUTH = {
  auth: {
    username: process.env.EXOTEL_API_KEY,
    password: process.env.EXOTEL_API_TOKEN,
  }
};

// Initiate a masked call between student and mentor
async function connectCall(studentPhone, mentorPhone, sessionId) {
  const params = new URLSearchParams({
    From:           studentPhone,
    To:             mentorPhone,
    CallerId:       process.env.EXOTEL_VIRTUAL_NUMBER,
    StatusCallback: `${process.env.API_BASE_URL}/webhooks/exotel?session=${sessionId}`,
    Record:         'true',
    MaxDuration:    '3600',
    TimeLimit:      '3600',
  });

  const res = await axios.post(`${BASE}/Calls/connect.json`, params, AUTH);
  return res.data.Call; // { Sid, Status, ... }
}

// End a call programmatically (e.g. wallet empty)
async function endCall(exotelSid) {
  await axios.post(`${BASE}/Calls/${exotelSid}.json`,
    new URLSearchParams({ Status: 'completed' }), AUTH);
}

module.exports = { connectCall, endCall };
```

**`src/routes/webhooks.js` — Exotel handler**

```js
const router  = require('express').Router();
const db      = require('../config/db');
const billing = require('../services/billing');

router.post('/exotel', async (req, res) => {
  // Respond 200 immediately — Exotel retries on delay
  res.sendStatus(200);

  const { CallSid, Status, Duration, RecordingUrl } = req.body;
  const sessionId = req.query.session;
  if (!sessionId) return;

  if (Status === 'in-progress') {
    // Idempotent: only update if still pending
    await db.callSession.updateMany({
      where: { id: sessionId, status: 'pending' },
      data:  { status: 'active', startedAt: new Date(), exotelSid: CallSid }
    });
  }

  if (Status === 'completed') {
    await billing.settle(sessionId, parseInt(Duration || '0', 10), RecordingUrl);
  }
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

### 6.3 Firebase — OTP & Notifications

**OTP Login (phone auth)**

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

The React Native app handles OTP entry natively using `@react-native-firebase/auth`. After the user enters the OTP, Firebase returns an ID token which is sent to your API with every request in the `Authorization: Bearer <token>` header. Your `auth.js` middleware verifies it.

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

### 6.4 AWS — Hosting & Storage

**EC2 setup (Ubuntu 22.04)**

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Clone and run
git clone https://github.com/your-org/mentivo-api.git
cd mentivo-api
npm install --production
npx prisma migrate deploy
pm2 start src/app.js --name mentivo-api
pm2 save && pm2 startup
```

**S3 — Profile photos and call recordings**

```js
// src/services/storage.js
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({ region: process.env.AWS_REGION });

async function getUploadUrl(key, contentType) {
  return getSignedUrl(s3, new PutObjectCommand({
    Bucket:      process.env.S3_BUCKET,
    Key:         key,
    ContentType: contentType,
  }), { expiresIn: 300 }); // 5-min upload window
}

function getPublicUrl(key) {
  return `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`;
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
| POST | `/auth/verify` | — | Exchange Firebase token for user record |
| GET | `/mentors` | Required | List online mentors with filters |
| GET | `/mentors/:id` | Required | Single mentor profile |
| PATCH | `/mentors/me/online` | Mentor | Set online status + heartbeat |
| POST | `/calls/initiate` | Required | Start a masked call |
| GET | `/calls/:id` | Required | Get call session details |
| POST | `/calls/:id/rate` | Required | Submit post-call rating |
| GET | `/wallet/balance` | Required | Get student wallet balance |
| POST | `/wallet/topup` | Required | Create Razorpay top-up order |
| POST | `/wallet/topup/confirm` | Required | Confirm payment + credit wallet |
| POST | `/webhooks/exotel` | — (signed) | Exotel call status callbacks |
| POST | `/webhooks/razorpay` | — (signed) | Razorpay payment callbacks |

---

## 9. Build Roadmap

### Phase 1 — MVP (Weeks 1–6)
**Goal:** One working end-to-end call with billing.

| Week | Tasks |
|------|-------|
| 1 | Exotel account setup. Razorpay account setup. Firebase project. AWS account + EC2 + RDS provisioned. |
| 2 | DB schema + Prisma migrations. Auth middleware. `/auth/verify` endpoint. |
| 3 | Exotel `connectCall()` service. `/calls/initiate` route. Webhook handler skeleton. |
| 4 | `settleBilling()` atomic transaction. Wallet debit + mentor credit. Test end-to-end with two real SIMs. |
| 5 | Razorpay wallet top-up flow (create order → confirm → credit). Wallet balance check before calls. |
| 6 | React Native app: OTP login screen, mentor list, single-tap call, wallet top-up. Internal TestFlight / APK. |

**Exit criteria:** A real masked call completes between two phones, wallet is debited correctly, mentor earnings are credited.

---

### Phase 2 — Trust layer (Weeks 7–14)
**Goal:** Verification, ratings, partner dashboard, mentor app.

| Week | Tasks |
|------|-------|
| 7–8 | Mentor onboarding: profile creation, ID doc upload to S3, admin verification panel. IIT email check (send OTP to @iitX.ac.in). |
| 9–10 | Post-call rating flow. Mentor average score calculation. Auto-flag mentors below 3.0. |
| 11–12 | Partner dashboard (coaching centre login, referral code tracking, commission display). |
| 13–14 | FCM push notifications: mentor online alerts, low balance warning, post-call rating prompt. |

---

### Phase 3 — Payouts + quality (Weeks 15–20)
**Goal:** Automated payouts, quality monitoring, production hardening.

| Week | Tasks |
|------|-------|
| 15–16 | Razorpay X payout integration. Weekly BullMQ batch job. TDS deduction logic. Mentor earnings screen. |
| 17–18 | Balance watcher job: poll active sessions every 60s, end call via Exotel if wallet < ₹10. |
| 19 | Sentry error monitoring. CloudFront for S3 assets. Load testing with k6. |
| 20 | Play Store submission. Soft launch with first coaching partner batch. |

---

### Phase 4 — Scale + online GTM (Month 5+)
**Goal:** Growth channels, premium tiers, adjacent exam verticals.

- Premium mentor tier (₹15–20/min) with separate listing
- Bookable scheduled sessions (calendar-based)
- Creator referral UTM tracking (Instagram, YouTube, Telegram)
- NEET vertical: new mentor category, separate onboarding
- Mentivo-Tuition: small-batch scheduled classes by IITians

---

## 10. Environment Variables

```env
# Server
PORT=3000
API_BASE_URL=https://api.mentivo.in
ALLOWED_ORIGINS=https://mentivo.in,exp://

# Database
DATABASE_URL=postgresql://user:pass@your-rds-host:5432/mentivo

# Redis
REDIS_URL=redis://your-elasticache-host:6379

# Firebase
FIREBASE_PROJECT_ID=mentivo-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@mentivo-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."

# Exotel
EXOTEL_SID=your_sid
EXOTEL_API_KEY=your_api_key
EXOTEL_API_TOKEN=your_api_token
EXOTEL_VIRTUAL_NUMBER=+91XXXXXXXXXX

# Razorpay
RAZORPAY_KEY_ID=rzp_live_XXXX
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_X_ACCOUNT=4564563214567654   # Razorpay X account number

# AWS
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=mentivo-assets
CLOUDFRONT_DOMAIN=d1234abcd.cloudfront.net
```

---

## 11. App Scaffolding Prompt

Use this prompt with any capable AI coding assistant (Claude, GPT-4, Cursor, etc.) to scaffold the full Mentivo application.

---

```
Build a full-stack per-minute mentorship marketplace app called Mentivo.
Here is the complete specification:

=== PRODUCT ===
Mentivo connects JEE aspirants in Tier-2/3 India with verified, current IIT students
via on-demand, per-minute voice calls. Students pay ₹10/min. Mentors keep 70%.
First 5 minutes are free for new users. No subscriptions — pure wallet-based.

=== BACKEND (Node.js + Express + PostgreSQL + Redis) ===

Build a REST API with the following:

1. AUTH
   - Firebase Admin SDK for verifying phone-based OTP tokens
   - Middleware: extract Firebase ID token from Authorization header,
     verify it, attach req.user to every protected route

2. DATABASE (PostgreSQL via Prisma)
   Tables: users, mentor_profiles, wallets, mentor_balances,
   wallet_transactions, call_sessions, ratings, payouts, referrals
   Full schema is provided below — implement it exactly.
   [Insert the schema from Section 4 of this document]

3. REDIS
   - Mentor online/offline presence: key = "presence:{mentorId}",
     TTL = 60s, mentor heartbeats every 30s to stay listed as online
   - BullMQ queues: payout_batch, balance_watcher

4. EXOTEL INTEGRATION (masked calling)
   - POST /calls/initiate: check student wallet ≥ ₹10, check mentor online
     in Redis, call Exotel Calls/connect.json, store call_session {status: pending}
   - POST /webhooks/exotel: handle Status = in-progress (set session active)
     and Status = completed (call settleBilling atomically)
   - settleBilling: atomic Prisma transaction — debit student wallet,
     credit mentor pending_payout, update call_session to settled
   - Billing: billable minutes = ceil((durationSecs - 300) / 60), rate = ₹10/min,
     mentor share = 70%, round up to the next minute, first 5 min free

5. RAZORPAY INTEGRATION (wallet top-up + mentor payouts)
   - POST /wallet/topup: create Razorpay order, store pending transaction
   - POST /wallet/topup/confirm: verify HMAC signature, credit wallet atomically
   - POST /payouts/trigger (admin): BullMQ job, iterate mentors with pending_payout > 0,
     deduct 10% TDS on amounts above threshold, call Razorpay X payout API,
     record in payouts table, zero out pending_payout

6. FIREBASE FCM (push notifications)
   - Send "Mentor is online" to students who favourited that mentor
   - Send "Low balance" alert when wallet drops below ₹20
   - Send "Rate your call" prompt 10 seconds after call ends

7. ROUTES TO BUILD
   POST   /auth/verify
   GET    /mentors                (list online mentors, filter by IIT/rating)
   GET    /mentors/:id            (single mentor profile)
   PATCH  /mentors/me/online      (mentor heartbeat — set presence in Redis)
   PATCH  /mentors/me/offline     (mentor goes offline)
   POST   /calls/initiate         (start masked call)
   GET    /calls/:id              (get session status)
   POST   /calls/:id/rate         (submit 1–5 star rating + recalculate mentor avg)
   GET    /wallet/balance         (student wallet)
   POST   /wallet/topup           (create Razorpay order)
   POST   /wallet/topup/confirm   (verify + credit)
   POST   /webhooks/exotel        (Exotel status callbacks — respond 200 immediately)
   POST   /webhooks/razorpay      (Razorpay payment webhooks)

=== FRONTEND (React Native + Expo) ===

Build two apps in one codebase (role-based navigation):

STUDENT APP screens:
1. OTP Login — phone number entry + 6-digit OTP (Firebase phone auth)
2. Mentor List — scrollable list of online mentors with:
   name, IIT name, branch, year, avg rating (stars), ₹10/min badge,
   "Call Now" button (green), "Favourite" heart icon
3. Mentor Profile — full profile, call history with this mentor, ratings
4. Call Screen — shown during active call: mentor name, live timer (mm:ss),
   running cost display (₹X.XX), "End Call" button
5. Post-Call Rating — 1–5 stars + optional text comment
6. Wallet — current balance, top-up button (₹50 / ₹100 / ₹200 / custom),
   transaction history
7. Call History — list of past sessions with duration, cost, mentor name

MENTOR APP screens:
1. OTP Login (same as student)
2. Go Online toggle — prominent toggle on home screen; sets Redis presence
3. Earnings Dashboard — pending payout, total earned, next payout date
4. Call History — incoming calls, durations, earnings per call
5. Profile — edit bio, photo (upload to S3 signed URL), IIT details

SHARED:
- Bottom tab navigator (role-based tabs)
- Auth state: store Firebase ID token in SecureStore
- Send token in every API request: Authorization: Bearer <token>
- Handle 402 (insufficient balance) — redirect to Wallet screen
- FCM: request notification permissions on first login, store token in backend

=== BUSINESS RULES TO ENFORCE ===
- Students must have ≥ ₹10 wallet balance to initiate a call
- Mentors must be verified (mentor_profiles.verified = true) to appear in list
- Billing rounds up to the next full minute
- First 5 minutes (300 seconds) are free — subtract before billing
- If a call produces 0 billable minutes, no wallet debit occurs
- Mentor average rating is recalculated after every rating submission
- Mentors with avg_rating < 2.5 after 10+ calls are auto-flagged (set flagged = true)
- Payout TDS: deduct 10% TDS on payouts exceeding ₹5,000 cumulative per quarter

=== PROJECT STRUCTURE ===
mentivo-api/      (Node.js backend — structure per the Mentivo tech doc)
mentivo-app/      (React Native Expo app)

=== ENVIRONMENT ===
Backend runs on Node 20. Use Prisma for DB. Use ioredis for Redis.
Use BullMQ for background jobs. Use Zod for request validation.
All routes use async/await with express-async-errors for clean error handling.

Generate:
1. Complete backend with all routes, services, middleware, and DB schema
2. React Native app with all screens and navigation
3. Prisma schema matching the DB schema above
4. package.json files for both projects with all required dependencies
5. .env.example files for both projects
6. README.md with setup instructions for both projects

Make the code production-quality: proper error handling, input validation,
idempotent webhook handlers, atomic DB transactions for all billing operations.
```

---

*Document version 1.0 — Mentivo internal technical reference*
*Founders: Abhiraj (CEO) · Ayan (CTO)*## 8. API Endpoints Generated
- **POST /auth/verify:** Receives phone, role, name, uid. Finds or creates the user in the database. Returns user object. Used as a mock authentication setup.
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
