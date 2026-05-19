## 8. API Endpoints Generated
- **POST /auth/verify:** Receives email, role, name, uid. Finds or creates the user in the database. Returns user object. Used as a mock authentication setup.
- **POST /auth/coaching/login:** Receives unique coaching center code. Returns session token for partner dashboard.
- **GET /coaching/dashboard:** Returns aggregated student usage data and revenue share details.

## 9. Screens Generated
- LandingPage (`src/screens/LandingPage.js`): Homepage for discovery
- FindAMentor (`src/screens/FindAMentor.js`): Discovery page for viewing available mentors
- BookYourSession (`src/screens/BookYourSession.js`): Calendar/Slot selection flow
- MentorDashboard (`src/screens/MentorDashboard.js`): Analytics and session tracking for mentors
- SessionChat (`src/screens/SessionChat.js`): In-session messaging view (using Agora Chat)
- AudioCall (`src/screens/AudioCall.js`): Live mentor-student call view (using Agora SDK with on-screen timer).
- CoachingDashboard (`website/app/coaching/dashboard/page.tsx`): Web-based dashboard for coaching centers.
- TelegramAdminDashboard (`website/app/admin/referrals/page.tsx`): Web-based dashboard for Telegram admins.
- SystemAdminDashboard (`website/app/superadmin/page.tsx`): Comprehensive management dashboard for platform owners.

## 10. Referral System Technical Details

### Prisma Schema Additions
```prisma
model TelegramAdmin {
  id              String   @id @default(uuid())
  name            String
  telegramHandle  String?  @unique
  referralCode    String   @unique // Master code shared on Telegram
  upiId           String?
  createdAt       DateTime @default(now())
  balance         TelegramAdminBalance?
  referrals       PreSignupReferral[]
  payoutRequests  AdminPayoutRequest[]
}

model TelegramAdminBalance {
  adminId         String        @id
  admin           TelegramAdmin @relation(fields: [adminId], references: [id])
  pendingPayout   Decimal       @default(0)
  totalEarned     Decimal       @default(0)
  totalWithdrawn  Decimal       @default(0)
}

model PreSignupReferral {
  id            String        @id @default(uuid())
  adminId       String
  admin         TelegramAdmin @relation(fields: [adminId], references: [id])
  email         String
  personalCode  String        @unique // Generated unique code for the student
  isUsed        Boolean       @default(false)
  createdAt     DateTime      @default(now())
  User          User[]

  @@unique([email, adminId])
}

model AdminPayoutRequest {
  id          String        @id @default(uuid())
  adminId     String
  admin       TelegramAdmin @relation(fields: [adminId], references: [id])
  amount      Decimal
  upiId       String
  status      String        @default("pending") // pending, completed, rejected
  processedAt DateTime?
  createdAt   DateTime      @default(now())
}
```

### Referral Logic Implementation
1. **Code Generation:** Use a utility to generate short, unique alphanumeric codes (e.g., `MT-XXXX`). Ensure the email is captured to prevent multi-account abuse with the same referral code.
2. **Incentive Handling:**
   - On valid signup with `personalCode`:
     - Fetch `PreSignupReferral` and verify `email` and `isUsed == false`.
     - Transactional update:
       - Update student `Wallet` balance by `REFERRAL_STUDENT_INCENTIVE`.
       - Update `TelegramAdminBalance` (pending + total earned) by `REFERRAL_ADMIN_INCENTIVE`.
       - Mark `PreSignupReferral.isUsed = true`.
       - Link `User.referralCodeUsed` to the referral record.

## Integration
## 11. Backend Core Implementation (May 2026)

### Authentication (Phone-Only Architecture)
- **Primary Identifier:** Switched from Email to Phone Number as the mandatory unique identifier for all accounts.
- **Firebase Phone Auth:** Integrated Firebase Admin SDK to verify frontend-generated `idToken` at `POST /api/auth/phone-login`.
- **Session Management:** Implemented JWT Access Token rotation and secure Refresh Token reuse detection/revocation.
- **User Initialization:** Automated atomic creation of `Wallet` (Students) and `MentorProfile/Balance` (Mentors) during signup.

### Call & Billing Engine (Server-Validated)
- **Agora Security:** Implemented dynamic token expiration capped by student wallet balance (`balance / rate_per_min`).
- **Heartbeat System:** Added `PATCH /api/calls/:id/heartbeat` and `CallSession.last_heartbeat_at` for resilient session tracking.
- **Atomic Billing:** Implemented race-condition-free `settleBilling` using Prisma `updateMany` as a state-lock (Active -> Settling).
- **Abandoned Call Sweeper:** BullMQ job runs every minute to close crashed calls at the last recorded heartbeat timestamp, preventing overcharging.

### Presence & Real-time
- **3-State Presence:** Redis-backed mentor states: `offline`, `available`, `busy`.
- **Atomic Locks:** `lockToBusy()` ensures no two students can initiate a call with the same mentor concurrently.

### Payment Gateway (Hardened Razorpay)
- **Webhooks First:** `POST /api/webhooks/razorpay` acts as the primary source of truth for wallet top-ups with signature verification.
- **Race Condition Prevention:** Atomic updates prevent double-crediting if the client and webhook confirm simultaneously.
- **Amount Verification:** Added sanity checks to ensure captured amounts match the original order request.
- **Manual Payout Mode:** Added `ENABLE_RAZORPAY_X` toggle to support manual UPI payouts via console logging for initial phases.

### Infrastructure & Background Jobs
- **Redis (Upstash):** Optimized `ioredis` configuration with `family: 0` for reliable TLS routing.
- **BullMQ Workers:** Initialized queues for `AbandonedCallSweeper` and `WeeklyPayouts`.
- **Graceful Shutdown:** Configured `SIGTERM` listeners to ensure workers finish tasks before process exit.

