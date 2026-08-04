# Sessions Feature — Implementation Plan (Final)

Add a **subscription-based scheduled video call** system to Mentivo, exposed as a 5th "Sessions" tab in the bottom navigator. Students subscribe to 6- or 12-month plans, get 2 video sessions/month with mentors, and negotiate mutually agreed times before each session.

---

## Decisions Log

All decisions from our discussion, consolidated:

| # | Decision |
|---|----------|
| 1 | Minimum advance booking: **6 hours** |
| 2 | Session extension: **both parties can request**, requires **mutual consent** |
| 3 | Mentor assessment form: **enabled**, toggleable from admin dashboard |
| 4 | Assessment tags: **admin-configurable** |
| 5 | Assessment reports: **both** coaching centre web dashboard **and** email CSV |
| 6 | Assessments: **coaching-centre-facing only** (students cannot see) |
| 7 | Mentors **can see** past assessment entries from other mentors about the same student |
| 8 | Coaching discount: via **separate referral code** at checkout (not auto-detect) |
| 9 | Referral codes: **expirable** (manual + auto-expiry date) |
| 10 | Referral validation: student must be **linked** to the coaching centre that owns the code |
| 11 | Reusable for renewals: **yes**, if referral code hasn't expired |
| 12 | Revenue share: **per-referral-code**, configurable, defaults to coaching centre's commission rate |
| 13 | Existing 5% revenue share on per-minute calls: **removed** |
| 14 | Slot booking: **auto-confirm** for available slots, negotiate only for custom times |
| 15 | Cancellation cutoff: **3 hours** before session |
| 16 | Session topic/agenda: **required** field when booking |
| 17 | Agora: **same channel infrastructure** for both voice calls and video sessions |
| 18 | Payment: **external web checkout** (Play Store compliant) |
| 19 | No session rollover: use-it-or-lose-it |
| 20 | No auto-renewal: student manually re-purchases |

---

## User Review Required

> [!IMPORTANT]
> **Coaching Centre Revenue Change**: The existing 5% revenue share on per-minute calls will be **removed** from `settleBilling()`. Coaching centres will instead earn a **configurable revenue share on session subscriptions** when students use their referral code. Please confirm this is the intended trade-off.

> [!WARNING]
> **Screen Sharing**: I'm including Agora screen sharing in the video call screen (critical for JEE problem-solving). Agora SDK supports this natively. Please flag if you'd rather defer this.

> [!IMPORTANT]
> **Session Prep Materials**: I'm including a feature where mentors can attach links/notes to a confirmed booking ("Review these problems before our session"). This is low-effort and high-impact. Flag if you'd rather skip.

---

## Proposed Changes

### Per-Session Economics

| Plan | Normal | Coaching | Sessions | Per-Session (Normal) | Per-Session (Coaching) |
|------|--------|----------|----------|---------------------|----------------------|
| 6 months | ₹3,600 | ₹2,999 | 12 (2/mo) | ₹300.00 | ₹249.92 |
| 12 months | ₹7,200 | ₹5,999 | 24 (2/mo) | ₹300.00 | ₹249.96 |

**Default fee split** (configurable via admin): 60% mentor / 40% platform

| | Normal (₹300/session) | Coaching (₹250/session) |
|---|---|---|
| Mentor earns | ₹180.00 | ₹150.00 |
| Platform earns | ₹120.00 | ₹100.00 |

**Coaching centre revenue share**: Configurable per referral code, defaults to centre's `commission_rate`. Applied to the subscription `amountPaid`.
- Example: 5% of ₹2,999 = ₹149.95 credited to coaching centre balance per subscription.

---

### Database Schema

#### [MODIFY] [schema.prisma](file:///c:/Projects/Mentivo/backend/prisma/schema.prisma)

**New enums:**

```prisma
enum SessionBookingStatus {
  PROPOSED
  MENTOR_COUNTERED
  STUDENT_COUNTERED
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  EXPIRED
  NO_SHOW
}
```

**New models:**

```prisma
// ── Session Plans (configured by admin) ──
model SessionPlan {
  id               String   @id @default(uuid()) @db.Uuid
  name             String   // "6 Months", "12 Months"
  durationMonths   Int      // 6 or 12
  sessionsPerMonth Int      @default(2)
  priceNormal      Decimal  @db.Decimal(10, 2) // ₹3600, ₹7200
  priceCoaching    Decimal  @db.Decimal(10, 2) // ₹2999, ₹5999
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  subscriptions    SessionSubscription[]

  @@map("session_plans")
}

// ── Coaching Centre Referral Codes for Session Discounts ──
model SessionReferralCode {
  id                  String    @id @default(uuid()) @db.Uuid
  coachingCenterId    String    @db.Uuid
  code                String    @unique
  revenueSharePercent Decimal   @db.Decimal(5, 2) // defaults to centre's commission_rate
  expiresAt           DateTime? // null = no auto-expiry
  isActive            Boolean   @default(true) // manual expiry toggle
  usageCount          Int       @default(0)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  coachingCenter      CoachingCenter @relation(fields: [coachingCenterId], references: [id])
  subscriptions       SessionSubscription[]

  @@map("session_referral_codes")
}

// ── Student's active subscription ──
model SessionSubscription {
  id                    String   @id @default(uuid()) @db.Uuid
  userId                String   @db.Uuid
  planId                String   @db.Uuid
  referralCodeId        String?  @db.Uuid // null if no referral code used
  amountPaid            Decimal  @db.Decimal(10, 2)
  status                String   @default("active") // active, expired, cancelled
  startDate             DateTime @default(now())
  endDate               DateTime
  sessionsUsedThisMonth Int      @default(0)
  currentMonthStart     DateTime @default(now())
  razorpayOrderId       String?
  razorpayPaymentId     String?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  user                  User               @relation(fields: [userId], references: [id])
  plan                  SessionPlan        @relation(fields: [planId], references: [id])
  referralCode          SessionReferralCode? @relation(fields: [referralCodeId], references: [id])
  bookings              SessionBooking[]

  @@map("session_subscriptions")
}

// ── Individual session booking with negotiation ──
model SessionBooking {
  id                String               @id @default(uuid()) @db.Uuid
  subscriptionId    String               @db.Uuid
  studentId         String               @db.Uuid
  mentorId          String               @db.Uuid

  // Topic & Agenda (required at booking)
  subject           String               // "Physics", "Chemistry", "Math"
  topic             String               // "Rotational Dynamics", "Organic Chemistry", etc.
  description       String               // What they need help with (free text)

  // Scheduling
  proposedTime      DateTime             // currently proposed time
  proposedBy        String               // "student" or "mentor"
  status            SessionBookingStatus @default(PROPOSED)
  negotiationRound  Int                  @default(1)

  // Session execution
  agoraChannelId    String?
  startedAt         DateTime?
  endedAt           DateTime?
  durationSecs      Int?
  maxDurationSecs   Int                  @default(1800) // 30 min = 1800s
  extendedSecs      Int                  @default(0)    // up to 600s (10 min)
  extensionRequestedBy String?           // who requested extension
  extensionAccepted Boolean?             // whether the other party accepted

  // Financials
  mentorEarning     Decimal?             @db.Decimal(10, 2)
  platformFee       Decimal?             @db.Decimal(10, 2)

  // Cancellation
  cancelledBy       String?              // "student", "mentor", "system"
  cancellationReason String?

  // Prep materials (mentor can attach after confirmation)
  prepNotes         String?              // mentor's prep notes/links for the student

  // Deadlines
  expiresAt         DateTime             // 12h deadline for response (custom time proposals)
  createdAt         DateTime             @default(now())
  updatedAt         DateTime             @updatedAt

  subscription      SessionSubscription  @relation(fields: [subscriptionId], references: [id])
  student           User                 @relation("sessionBookingsStudent", fields: [studentId], references: [id])
  mentor            User                 @relation("sessionBookingsMentor", fields: [mentorId], references: [id])
  negotiations      SessionNegotiation[]
  assessment        SessionAssessment?

  @@map("session_bookings")
}

// ── Negotiation history ──
model SessionNegotiation {
  id           String   @id @default(uuid()) @db.Uuid
  bookingId    String   @db.Uuid
  proposedBy   String   // "student" or "mentor"
  proposedTime DateTime
  message      String?  // optional message with the proposal
  createdAt    DateTime @default(now())

  booking      SessionBooking @relation(fields: [bookingId], references: [id])

  @@map("session_negotiations")
}

// ── Mentor availability slots (weekly recurring) ──
model MentorAvailabilitySlot {
  id        String   @id @default(uuid()) @db.Uuid
  mentorId  String   @db.Uuid
  dayOfWeek Int      // 0=Sun, 1=Mon, ..., 6=Sat
  startTime String   // "15:00" (24h format)
  endTime   String   // "17:00"
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  mentor    User     @relation(fields: [mentorId], references: [id])

  @@map("mentor_availability_slots")
}

// ── Mentor Assessment Form (post-session) ──
model SessionAssessment {
  id          String   @id @default(uuid()) @db.Uuid
  bookingId   String   @unique @db.Uuid
  mentorId    String   @db.Uuid
  studentId   String   @db.Uuid
  strongTags  String[] // selected tag IDs from admin-configured list
  strongNotes String?  // free text elaboration
  weakTags    String[] // selected tag IDs from admin-configured list
  weakNotes   String?  // free text elaboration
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  booking     SessionBooking @relation(fields: [bookingId], references: [id])
  mentor      User           @relation("assessmentsMentor", fields: [mentorId], references: [id])
  student     User           @relation("assessmentsStudent", fields: [studentId], references: [id])

  @@map("session_assessments")
}

// ── Assessment Report (aggregated, admin-reviewed) ──
model AssessmentReport {
  id               String   @id @default(uuid()) @db.Uuid
  coachingCenterId String   @db.Uuid
  periodStart      DateTime
  periodEnd        DateTime
  status           String   @default("pending") // pending, reviewed, sent
  csvData          String   @db.Text // editable CSV content (JSON stringified)
  reviewedAt       DateTime?
  reviewedBy       String?  // admin user ID
  sentAt           DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  coachingCenter   CoachingCenter @relation(fields: [coachingCenterId], references: [id])

  @@map("assessment_reports")
}
```

**New relations on existing models:**

```prisma
// Add to User model:
sessionSubscriptions     SessionSubscription[]
sessionBookingsStudent   SessionBooking[]       @relation("sessionBookingsStudent")
sessionBookingsMentor    SessionBooking[]        @relation("sessionBookingsMentor")
availabilitySlots        MentorAvailabilitySlot[]
assessmentsMentor        SessionAssessment[]     @relation("assessmentsMentor")
assessmentsStudent       SessionAssessment[]     @relation("assessmentsStudent")
acceptsSessions          Boolean                 @default(true) // mentor toggle

// Add to MentorProfile model:
sessionRating            Decimal?                @db.Decimal(3, 2) // separate rating for sessions
totalSessions            Int                     @default(0)
sessionStrikes           Int                     @default(0) // late cancellation/no-show strikes
sessionBannedUntil       DateTime?               // temporary ban from sessions

// Add to CoachingCenter model:
sessionReferralCodes     SessionReferralCode[]
assessmentReports        AssessmentReport[]
```

**New `AppSetting` keys:**

| Key | Default | Description |
|-----|---------|-------------|
| `session_mentor_share_percent` | `60` | Mentor's % of per-session fee |
| `session_platform_share_percent` | `40` | Platform's % of per-session fee |
| `session_assessment_enabled` | `false` | Toggle assessment form feature |
| `session_assessment_tags` | `[JSON]` | Admin-configurable assessment tags |
| `session_assessment_period_days` | `30` | Aggregation period for reports |
| `session_max_negotiation_rounds` | `3` | Max negotiation rounds before auto-cancel |
| `session_response_deadline_hours` | `12` | Hours before a proposal expires |
| `session_min_advance_hours` | `6` | Minimum hours before session start to book |
| `session_cancellation_cutoff_hours` | `3` | Hours before session where cancellation incurs penalty |
| `session_mentor_strike_ban_days` | `7` | Days a mentor is banned after 3 strikes |
| `session_max_extension_secs` | `600` | Maximum extension allowed (10 min) |

---

### Backend API

---

#### [NEW] [sessions.ts](file:///c:/Projects/Mentivo/backend/src/v1/routes/sessions.ts)

**Subscription & Plans:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/sessions/plans` | List active session plans (shows normal price) |
| `POST` | `/sessions/validate-referral` | Validate referral code: checks code exists, `isActive`, not expired, student's `coaching_center_id` matches. Returns discounted price |
| `POST` | `/sessions/subscribe` | Create Razorpay order (with optional referral code for discount) |
| `POST` | `/sessions/subscribe/confirm` | Confirm payment, activate subscription, credit coaching centre revenue share |
| `GET` | `/sessions/subscription` | Get student's active subscription & monthly usage |

**Booking:**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sessions/book` | Student books a session. Required: `mentorId`, `proposedTime`, `subject`, `topic`, `description`. If time matches mentor's availability slot → **auto-confirm**. If custom time → status `PROPOSED` with 12h expiry |
| `POST` | `/sessions/:id/respond` | Mentor responds: `accept` (→ `CONFIRMED`) or `counter` (new time + optional message → `MENTOR_COUNTERED`) or `decline` (→ `CANCELLED`, session credit refunded) |
| `POST` | `/sessions/:id/counter` | Student counters mentor's proposal (new time → `STUDENT_COUNTERED`). Blocked if `negotiationRound >= max` |
| `POST` | `/sessions/:id/cancel` | Cancel booking. Checks cancellation policy (>3h = free, <3h = penalty) |
| `GET` | `/sessions/bookings` | List bookings filtered by `status`, `role`. Includes upcoming, pending, past |
| `GET` | `/sessions/:id` | Booking detail with full negotiation history |
| `PUT` | `/sessions/:id/prep` | Mentor adds/edits prep notes for confirmed booking |

**Session Execution:**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sessions/:id/join` | Join confirmed session. Generates Agora video+audio token. Updates status → `IN_PROGRESS` when both join. Only active within 5 min of session time |
| `POST` | `/sessions/:id/extend` | Request extension (either party). `requestedBy`, `extraSecs` (max 600). Other party notified to accept/decline |
| `POST` | `/sessions/:id/extend/respond` | Accept or decline extension request |
| `POST` | `/sessions/:id/end` | End session. Settles financials: calculates per-session earning, credits mentor balance |
| `POST` | `/sessions/:id/rate` | Post-session rating (student rates mentor) |

**Mentor Availability:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/sessions/mentor/:id/availability` | Get mentor's weekly availability slots |
| `PUT` | `/sessions/availability` | Mentor sets/updates availability (bulk upsert of slots) |
| `GET` | `/sessions/mentor/:id/calendar` | Get mentor's booked sessions for calendar view (for conflict detection) |
| `PUT` | `/sessions/toggle` | Mentor toggles `acceptsSessions` on/off |

**Assessment:**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sessions/:id/assessment` | Mentor submits assessment form (strong/weak tags + notes) |
| `GET` | `/sessions/assessments/student/:id` | Mentor views all past assessments for a specific student (from all mentors who've had sessions with that student) |

---

#### [NEW] [sessionService.ts](file:///c:/Projects/Mentivo/backend/src/v1/services/sessionService.ts)

Core business logic:

- `createBooking()` — validate subscription active, sessions remaining this month (`sessionsUsedThisMonth < plan.sessionsPerMonth`), mentor accepts sessions, no time conflict, min 6h advance. If proposed time falls within mentor's availability slot → auto-confirm (status `CONFIRMED`). Otherwise → `PROPOSED` with 12h expiry. Increment `sessionsUsedThisMonth`
- `respondToBooking()` — mentor accept/counter/decline. Accept → `CONFIRMED`. Counter → `MENTOR_COUNTERED`, new 12h expiry. Decline → `CANCELLED`, decrement `sessionsUsedThisMonth`
- `counterBooking()` — student counter with round check
- `cancelBooking()` — policy enforcement. >3h before: refund session credit (decrement `sessionsUsedThisMonth`). <3h before: consume credit (student) / strike (mentor) + refund credit
- `joinSession()` — generate Agora token with `enableVideo`, `enableAudio`. Track who's joined. When both join → `IN_PROGRESS`, start server-side timer
- `requestExtension()` — validate total extension ≤ `session_max_extension_secs`. Notify other party via socket + FCM
- `respondToExtension()` — accept → update `maxDurationSecs` and `extendedSecs`. Decline → no change
- `endSession()` — settle financials in atomic Prisma transaction:
  1. Calculate per-session value: `subscription.amountPaid / totalSessionsInPlan`
  2. `mentorEarning = perSessionValue × (session_mentor_share_percent / 100)`
  3. `platformFee = perSessionValue - mentorEarning`
  4. Credit `mentor_balances.pending_payout`
  5. Update `mentor_profiles.totalSessions`
  6. Update booking status → `COMPLETED`
- `submitAssessment()` — validate `session_assessment_enabled`, save tags + notes
- `getPastAssessments()` — return all assessments for a student, visible to any mentor who has a confirmed/completed booking with that student

---

#### [NEW] [sessionCron.ts](file:///c:/Projects/Mentivo/backend/src/v1/services/sessionCron.ts)

| Schedule | Job | Description |
|----------|-----|-------------|
| Every 5 min | `expireStaleBookings` | Find bookings past `expiresAt` with status `PROPOSED`/`MENTOR_COUNTERED`/`STUDENT_COUNTERED` → set `EXPIRED`, refund session credit |
| Daily midnight | `resetMonthlySessions` | For subscriptions where `currentMonthStart + 30 days ≤ now`: reset `sessionsUsedThisMonth = 0`, advance `currentMonthStart`. Also expire subscriptions past `endDate` |
| 1h before session | `sendSessionReminder1h` | FCM push to both student and mentor |
| 15m before session | `sendSessionReminder15m` | FCM push to both parties |
| 5m after session time | `markNoShows` | If status still `CONFIRMED` (neither joined) → `NO_SHOW`. Apply cancellation penalty to no-show party |
| Configurable period | `generateAssessmentReports` | Aggregate assessments per coaching centre for the period. Generate CSV, create `AssessmentReport` with status `pending` |

---

#### [MODIFY] [billing.ts](file:///c:/Projects/Mentivo/backend/src/v1/services/billing.ts)

- **Remove** the 5% coaching centre revenue share from `settleBilling()` (lines ~90-106)
- Regular per-minute voice calls will no longer credit coaching centre balances

---

#### [MODIFY] [webhooks.ts](file:///c:/Projects/Mentivo/backend/src/v1/routes/webhooks.ts)

- Add handler for `payment.captured` events with `notes.type === 'session_subscription'`
- On capture: activate subscription, set `startDate`/`endDate`, log `WalletTransaction` with type `session_subscription`
- If referral code was used: credit `revenueSharePercent` of `amountPaid` to `coaching_center_balances.pending_payout`, increment referral code `usageCount`

---

### Admin Dashboard

---

#### [NEW] [sessions/page.tsx](file:///c:/Projects/Mentivo/admin-frontend/app/dashboard/sessions/page.tsx)

Admin Sessions management page with tabs:

**Plans Tab:**
- View/edit session plans (name, prices, sessions/month, active toggle)
- Fee distribution: Mentor % / Platform % sliders (must sum to 100)

**Subscriptions Tab:**
- Table: all active subscriptions with student name, plan, start/end date, sessions used/remaining, referral code used
- Filter by plan, status, coaching centre

**Referral Codes Tab:**
- Table: all session referral codes with coaching centre, code, revenue share %, expiry date, active status, usage count
- Actions: create, edit, toggle active, set expiry

**Assessment Config Tab:**
- Toggle `session_assessment_enabled` on/off
- Manage assessment tags (add/remove/edit tag labels for strong and weak categories)
- Set `session_assessment_period_days`

**Assessment Reports Tab:**
- Pending reports: table with coaching centre, period, student count, assessment count
- Click to review: inline CSV editor (table view with editable cells)
- Actions: "Approve & Send" (emails CSV + makes available on coaching dashboard), "Edit", "Reject"

**Analytics Tab:**
- Total sessions completed, active subscriptions, revenue generated
- Average session duration, popular time slots heatmap
- Mentor leaderboard (by sessions completed, average rating)
- Referral code performance (usage, revenue generated per code)

---

#### [NEW] [sessions.ts](file:///c:/Projects/Mentivo/backend/src/admin/routes/sessions.ts)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/sessions/plans` | List all plans |
| `PUT` | `/api/sessions/plans/:id` | Update plan pricing/status |
| `GET` | `/api/sessions/subscriptions` | List all subscriptions (paginated, filterable) |
| `GET` | `/api/sessions/analytics` | Analytics data |
| `PUT` | `/api/sessions/config` | Update fee distribution + all session AppSettings |
| `POST` | `/api/sessions/referral-codes` | Create referral code for a coaching centre |
| `GET` | `/api/sessions/referral-codes` | List all referral codes |
| `PUT` | `/api/sessions/referral-codes/:id` | Edit code (revenue share, expiry, active toggle) |
| `DELETE` | `/api/sessions/referral-codes/:id` | Deactivate/delete code |
| `GET` | `/api/sessions/assessment-tags` | Get current assessment tags config |
| `PUT` | `/api/sessions/assessment-tags` | Update assessment tags |
| `GET` | `/api/sessions/assessment-reports` | List reports (filterable by status) |
| `GET` | `/api/sessions/assessment-reports/:id` | Get report detail with CSV data |
| `PUT` | `/api/sessions/assessment-reports/:id` | Edit CSV data |
| `POST` | `/api/sessions/assessment-reports/:id/send` | Approve and send to coaching centre |

---

### Website

---

#### [NEW] [subscribe/page.tsx](file:///c:/Projects/Mentivo/website/app/subscribe/page.tsx)

External web checkout page for session plan purchase (Play Store compliant):

1. Receives `userId`, `planId` via query params (deep link from app)
2. Shows plan details and normal price
3. **Referral code input field**: student enters code → `POST /sessions/validate-referral` → if valid, price updates to coaching price with discount badge
4. Razorpay checkout with `notes.type = 'session_subscription'`
5. Success → redirect back to app via deep link
6. Failure → error message with retry option

---

#### [MODIFY] [dashboard/page.tsx](file:///c:/Projects/Mentivo/website/app/coaching/dashboard/page.tsx)

- **Remove** revenue share earnings from per-minute calls
- **Add** "Session Referral Codes" section: active codes, usage count, revenue earned per code
- **Add** "Assessment Reports" section: downloadable reports (only `sent` status), with period dates and student count
- **Add** "Student Sessions" section: which linked students have active subscriptions, sessions completed

---

### Frontend (React Native)

---

#### Bottom Tab Navigator

#### [MODIFY] [RootNavigator.tsx](file:///c:/Projects/Mentivo/frontend/screens/RootNavigator.tsx)

- Add 5th tab: **Sessions** between `Chat` and `Ask`
- Student: `StudentSessionsTab` | Mentor: `MentorSessionsTab`
- New calendar/video icon for the tab
- Update `CustomTabBar` layout for 5 tabs
- Add stack screens: `BookSession`, `SessionNegotiation`, `VideoCallScreen`, `MentorAvailability`, `MentorSessionResponse`, `SessionAssessmentForm`

**New tab order**: Home → Chat → **Sessions** → Ask → Profile

---

#### Student Screens

#### [NEW] [StudentSessionsTab.tsx](file:///c:/Projects/Mentivo/frontend/screens/student/StudentSessionsTab.tsx)

**No subscription state:**
- Attractive CTA showing both plans with pricing (normal price)
- "Have a referral code?" link → reveals input field
- "Subscribe" button → `Linking.openURL` to `/subscribe?userId=X&planId=Y&referralCode=Z`

**Active subscription state:**
- **Header card**: Plan name, sessions remaining (`1 of 2 remaining`), expiry date, progress bar
- **Upcoming sessions**: Confirmed bookings with countdown, "Join" button (active 5 min before). Shows mentor name, subject, topic, prep notes if any
- **Pending**: Bookings awaiting response or needing student counter. Badge count shown on tab
- **"Book a Session" FAB**: Opens `BookSession` screen
- **Past sessions**: History cards with rating, duration, mentor info
- **Quick Rebook**: After completed session, "Book again with [Mentor]" CTA

#### [NEW] [BookSession.tsx](file:///c:/Projects/Mentivo/frontend/screens/student/BookSession.tsx)

1. **Mentor browse**: Reuse `MentorCard`, filtered to `acceptsSessions: true`. Search by name, IIT, branch, subject expertise
2. **Select mentor → View availability**: Calendar showing mentor's weekly slots mapped onto upcoming dates. Grey out slots with existing bookings (conflict check via `/sessions/mentor/:id/calendar`)
3. **Pick a slot** (from availability) → auto-confirm flow:
   - Fill required fields: Subject (picker), Topic (text), Description (text area)
   - "Book Session" → API confirms immediately → success screen
4. **"Propose custom time"** option → negotiation flow:
   - Date/time picker + subject/topic/description
   - "Send Proposal" → `PROPOSED` status → wait for mentor response

#### [NEW] [SessionNegotiation.tsx](file:///c:/Projects/Mentivo/frontend/screens/student/SessionNegotiation.tsx)

- Timeline view of proposals: who proposed what time, when, with messages
- If `MENTOR_COUNTERED`: show mentor's new time + message, with "Accept" / "Counter" / "Cancel" buttons
- Counter: date/time picker + optional message
- Accept: confirms booking → `CONFIRMED`

---

#### Mentor Screens

#### [NEW] [MentorSessionsTab.tsx](file:///c:/Projects/Mentivo/frontend/screens/mentor/MentorSessionsTab.tsx)

- **Toggle**: "Accept Session Bookings" switch at top
- **Upcoming**: Confirmed sessions with "Join" button, student info, subject/topic, prep notes edit link
- **Pending proposals**: Incoming requests with student info, proposed time, subject/topic/description. Tap to open `MentorSessionResponse`
- **Set Availability**: Link to `MentorAvailability` screen
- **History**: Past sessions with earnings, student name, assessment status
- **Earnings card**: Total session earnings this month, pending payout

#### [NEW] [MentorAvailability.tsx](file:///c:/Projects/Mentivo/frontend/screens/mentor/MentorAvailability.tsx)

- 7-day grid (Mon-Sun)
- Per day: add time slot ranges (e.g., "3:00 PM - 5:00 PM")
- Toggle individual slots on/off
- Save → `PUT /sessions/availability`

#### [NEW] [MentorSessionResponse.tsx](file:///c:/Projects/Mentivo/frontend/screens/mentor/MentorSessionResponse.tsx)

- Student info card (name, coaching centre if any)
- Proposed time, subject, topic, description
- **"View Past Assessments"** link → shows assessments from other mentors about this student
- Actions: "Accept" / "Counter" (new time + message) / "Decline"

#### [NEW] [SessionAssessmentForm.tsx](file:///c:/Projects/Mentivo/frontend/screens/mentor/SessionAssessmentForm.tsx)

Shown after session ends (when `session_assessment_enabled` is true):

- **Student info header**: Name, coaching centre
- **Strong Points**: Multi-select tag chips (from admin-configured tags) + optional free text
- **Weak Points**: Multi-select tag chips + optional free text
- **Submit** → `POST /sessions/:id/assessment`
- **Skip** option (soft nudge: "You've skipped 2 of your last 5 assessments")
- After submit/skip → navigate to session history

---

#### Video Call Screen

#### [NEW] [VideoCallScreen.tsx](file:///c:/Projects/Mentivo/frontend/screens/VideoCallScreen.tsx)

Distinct from voice `InCallScreen.tsx`:

- **Video feeds**: Large remote video (full screen), small local video (PIP, draggable)
- **Agora setup**: `enableVideo()` + `enableAudio()` before `joinChannel()`. Render via `<RtcSurfaceView>`
- **Controls bar** (bottom):
  - Toggle mic (mute/unmute)
  - Toggle camera (on/off)
  - Switch camera (front/back)
  - Screen share toggle (Agora `startScreenCapture()`)
  - Chat toggle (opens in-session chat modal, reuse Agora Chat)
  - End call
- **Timer** (top): Countdown from 30:00 (or 30:00 + extension). Color changes: green → yellow (5 min left) → red (1 min left)
- **Extension flow**: When < 5 min remain, either party sees "Request Extension" button → options: +5 min, +10 min → sends request → other party gets toast with Accept/Decline
- **Auto-end**: Session auto-ends at 0:00. 30-second warning toast before auto-end
- **No PIP/minimize**: Unlike voice calls, video sessions require full attention. Back button shows "End session?" confirmation

---

#### Shared Components

#### [NEW] [SessionBookingCard.tsx](file:///c:/Projects/Mentivo/frontend/components/SessionBookingCard.tsx)

Booking list item with:
- Status badge (color-coded: blue=proposed, orange=countered, green=confirmed, grey=completed)
- Mentor/Student photo + name
- Subject & topic tags
- Proposed time with relative countdown
- Action buttons based on status and role

#### [NEW] [AvailabilityCalendar.tsx](file:///c:/Projects/Mentivo/frontend/components/AvailabilityCalendar.tsx)

Calendar component showing next 14 days with mentor's availability slots. Used in `BookSession` (student picks) and `MentorAvailability` (mentor edits).

#### [NEW] [VideoCallView.tsx](file:///c:/Projects/Mentivo/frontend/components/VideoCallView.tsx)

Agora video rendering: local/remote `RtcSurfaceView` with layout management, camera switching, PIP positioning.

---

#### Context & State

#### [NEW] [SessionContext.tsx](file:///c:/Projects/Mentivo/frontend/context/SessionContext.tsx)

- Active subscription details (plan, sessions remaining, expiry)
- Pending bookings count (for tab badge)
- Video call state (separate from voice `CallContext`):
  - `sessionId`, `channelName`, `isVideoEnabled`, `isScreenSharing`
  - `timeRemaining`, `extensionRequested`, `extensionAccepted`
- Fetch subscription status on app launch / tab focus

#### [MODIFY] [App.js](file:///c:/Projects/Mentivo/frontend/App.js)

- Add `SessionProvider` to provider hierarchy (after `CallProvider`)

---

### Notification System

| Trigger | Recipient | Message |
|---------|-----------|---------|
| New booking proposal | Mentor | "New session request from {student} for {subject}" |
| Mentor accepted | Student | "Your session with {mentor} is confirmed for {time}" |
| Mentor countered | Student | "{mentor} proposed a different time for your session" |
| Student countered | Mentor | "{student} proposed a different time" |
| Mentor declined | Student | "{mentor} declined your session request. Session credit refunded" |
| Booking expired | Both | "Session booking expired — no response received" |
| 1 hour reminder | Both | "Session with {name} starts in 1 hour" |
| 15 min reminder | Both | "Session with {name} starts in 15 minutes. Get ready!" |
| Session starting | Both | "Your session is starting now. Tap to join" |
| Extension requested | Other party | "{name} requested a {X}-minute extension" |
| Extension accepted | Requester | "Extension accepted! {X} extra minutes added" |
| Subscription expiring | Student | "Your session plan expires in 7 days" |
| Monthly credits reset | Student | "Your 2 session credits for this month are now available!" |
| Assessment report ready | Coaching centre (email) | "Monthly assessment report for your students is ready" |
| Prep notes added | Student | "{mentor} added preparation notes for your upcoming session" |

---

## Verification Plan

### Automated Tests

```bash
# Unit tests for session service
npm run test -- --grep "sessionService"

# Unit tests for cron jobs
npm run test -- --grep "sessionCron"

# Integration: full booking lifecycle
npm run test -- --grep "session-integration"

# Referral code validation
npm run test -- --grep "referral-code"

# Assessment aggregation
npm run test -- --grep "assessment-report"
```

- `sessionService`: booking lifecycle, negotiation rounds, cancellation policy, fee calculation, extension logic
- `sessionCron`: expiry logic, monthly reset, no-show detection, assessment report generation
- Referral codes: validation (expired, inactive, wrong coaching centre, valid), revenue share calculation
- Assessment: form submission, aggregation, CSV generation

### Manual Verification

- **Subscription flow**: App → web checkout → Razorpay → webhook → subscription active in app
- **Referral code flow**: Enter code → validate → discounted price → purchase → coaching centre credited
- **Slot booking** (happy path): Pick available slot → auto-confirm → both join → video works → session ends → rating → assessment form
- **Custom time negotiation**: Propose → counter → counter → confirm (and: propose → 3 rounds → auto-cancel)
- **Video call**: Verify Agora video on Android with both camera feeds, screen sharing, chat
- **Timer & extension**: Verify 30-min countdown, extension request/accept flow, auto-end at 0:00
- **Cancellation**: >3h (free, credit refunded) and <3h (penalty applied, strike for mentor)
- **Assessment**: Form submission, mentor viewing past assessments, admin report review, CSV edit, send to coaching centre
- **Tab navigator**: 5-tab layout renders correctly, badge on Sessions tab for pending bookings
- **All notifications**: Verify FCM fires for each trigger at correct times
- **Admin dashboard**: Plan editing, fee distribution, referral code CRUD, assessment config, report review
