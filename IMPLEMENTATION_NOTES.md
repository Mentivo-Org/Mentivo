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
### 11. Backend Core Implementation (May 2026)

### 12. Admin Dashboard Implementation (May 2026)

#### Admin Authentication (OTP-based)
- **Email Restriction:** Strictly restricted to `@mentivo.in` domains.
- **Flow:** User requests OTP → OTP generated and stored in Redis (10m expiry) → Sent via Resend → User verifies OTP → JWT Access (7d) and Refresh (30d) tokens issued.
- **Session Persistence:** Tokens held in localStorage for browser persistence.

#### Student & Mentor Management
- **Student & Mentor Management:** Full CRUD operations for students (View, Search, Edit, Delete). Profile creation is blocked. Mentor management includes a dedicated verification portal.
- **Mentor Verification:** Dedicated portal for unverified mentors. Review involves fetching identity documents proxied through the backend as a secure stream (using `GET /mentors/:id/document`) to prevent direct exposure of storage URLs to the frontend.
- **Verification Logs:** Successfully verified mentors log the admin's email (`verified_by`) and the timestamp (`verified_at`).
- **Security:** General update APIs explicitly exclude the `verified` field to prevent unauthorized status changes.

#### Communication Hub (Resend)
- **Flexible Recipient Modes:** Toggle between "Group" mode (using dynamic filters) and "Specific" mode. "Specific" mode allows selecting multiple individual users via a debounced autocomplete search and managing them as a list of recipients.
- **Bulk Sending:** Group emails automatically use batching and BCC (50 recipients per batch) to protect user privacy.
- **Compliance:** All outgoing emails automatically append the Mentivo Admin Team signature.

### Authentication (Email/Google Architecture)
- **Primary Identifier:** Email is the primary unique identifier for all accounts. Phone numbers are mandatory to collect during registration but remain unverified in the initial phase.
- **Firebase Auth:** Integrated Firebase Admin SDK to verify frontend-generated `idToken` (Email/Google) at `POST /api/auth/verify`.
- **Phone Collection:** Phone numbers are required for all users but are currently not verified.
- **Future Roadmap: WhatsApp Verification:** Phone verification will be implemented at a later stage via the Meta WhatsApp Business API. Users will initiate a message containing a unique code to the Mentivo backend, which will then verify the sender's phone number.
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

