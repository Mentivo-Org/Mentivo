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
The frontend utilizes a bottom tab navigator for primary pages (Home, Discovery, Mentor Dashboard) and nested stack screens for Book Session, Audio Call, and Session Chat to emulate practical app flow. The backend Express API runs concurrently with Prisma/PostgreSQL (Supabase) to test auth flows.
