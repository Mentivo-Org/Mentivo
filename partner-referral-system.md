# Partner Referral System Implementation Plan

## Overview
Convert the @website/ to a partner-only portal where partners can:
1. View their referral statistics and generated value
2. Access their unique referral link (mentivo.in/referral/:code)
3. Track signups and revenue generated through their referrals
4. Earn commissions based on admin-selected method (per signup or percent revenue)

## Database Schema Changes

### 1. Update UserRole Enum
```prisma
enum UserRole {
  student
  mentor
  partner   // ADD THIS
}
```

### 2. Add Partner Fields to User Model
```prisma
model User {
  // ... existing fields ...
  
  // NEW FIELDS FOR PARTNERS
  referralCode        String?   @unique
  referredByReferralCode String?
  commissionMethod    String?   // 'per_signup' or 'percent_revenue'
  commissionValue     Decimal?  @db.Decimal(5, 2)  // e.g., 50.00 for ₹50 or 10.00 for 10%
  createdBy           String?   // Email of admin who created this partner account
  
  // ... existing relations ...
}
```

## API Endpoints

### Admin Backend (admin-backend/src/routes/partners.ts)
```typescript
// Create partner account
POST /api/partners/create
Body: { email: string, phone: string, commissionMethod: 'per_signup'|'percent_revenue', commissionValue: number }
// Returns: { success: true, referralCode: string }

// List partners
GET /api/partners/list
Query: { page?: number, limit?: number }
// Returns: { partners: [...], total: number }

// Update partner commission
PUT /api/partners/:id/commission
Body: { commissionMethod: 'per_signup'|'percent_revenue', commissionValue: number }

// Get partner stats
GET /api/partners/:id/stats
Returns: { 
  referralCode: string,
  totalClicks: number,
  totalSignups: number,
  totalRevenueGenerated: number,
  totalEarned: number,
  pendingPayout: number
}
```

### Backend Auth Updates (backend/src/routes/auth.ts)
Modify signup endpoint to handle referral codes:
```typescript
// In signUpWithEmail controller:
// 1. Check if referral code exists in request
// 2. Validate referral code belongs to active partner
// 3. Store referralCode in user.referredByReferralCode
// 4. Apply signup bonus if commissionMethod is 'per_signup'
// 5. Track referral for revenue sharing if commissionMethod is 'percent_revenue'
```

### Referral Processing Service (New)
Create service to handle:
- Validating referral codes
- Tracking clicks on referral links
- Attributing signups to partners
- Calculating revenue share for percent-based commissions
- Processing partner payouts

## Website Changes (@website/)

### 1. Authentication
- Convert landing page to partner login page
- Implement email/password login for partners only
- Remove student/mentor options

### 2. Partner Dashboard (app/dashboard/page.tsx)
```typescript
export default function PartnerDashboard() {
  const { partner } = usePartner(); // Custom hook to fetch partner data
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Partner Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <StatCard title="Referral Link" value={`mentivo.in/referral/${partner?.referralCode}`} />
        <StatCard title="Total Clicks" value={partner?.stats.totalClicks} />
        <StatCard title="Signups" value={partner?.stats.totalSignups} />
        <StatCard title="Revenue Generated" value={`₹{partner?.stats.totalRevenueGenerated}`} />
        <StatCard title="Earnings" value={`₹{partner?.stats.totalEarned}`} />
        <StatCard title="Pending Payout" value={`₹{partner?.stats.pendingPayout}`} />
      </div>
      
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Your Referral Link</h2>
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <code className="block font-mono bg-white p-2 rounded">
            mentivo.in/referral/{partner?.referralCode}
          </code>
          <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Copy Link
          </button>
        </div>
        
        <h2 className="text-xl font-bold mb-4">Referral Analytics</h2>
        {/* Charts/graphs showing referral performance over time */}
      </div>
    </div>
  );
}
```

### 3. Protected Routes
- All website routes should check for partner authentication
- Redirect unauthenticated users to login page
- Only allow users with role='partner' to access the site

## Deep Linking Updates

### Update frontend/linking.ts
```typescript
const linking = {
  prefixes: ['https://mentivo.in', 'http://mentivo.in'],
  config: {
    screens: {
      // Existing screens...
      PartnerRegister: 'referral/:code', // For referral link handling
    },
  },
};
```

### App Deep Link Handler
When app opens via referral link:
1. Extract referral code from URL
2. Store referral code temporarily
3. On new user signup, associate with referral code
4. Apply appropriate bonus based on partner's commission method

## Email/Notification System

### Admin Backend Email Service
When creating partner account:
1. Generate secure, time-limited password setup link
2. Send email to partner with:
   - Their referral code
   - Referral link (mentivo.in/referral/:code)
   - Password setup link
   - Instructions on how the referral system works
   - Commission method and value selected by admin

### Partner Notifications
- Weekly/monthly email summary of referral performance
- Alert when reaching payout threshold
- Notification when referred user signs up

## Commission Calculation Logic

### Per Signup Model
- When user signs up with referral code:
  - Add fixed amount (commissionValue) to partner's earnings
  - Example: commissionValue = 50 → Partner gets ₹50 per signup

### Percent Revenue Model
- Track revenue generated by referred users:
  - Wallet top-ups
  - Call charges
  - Other monetized actions
  - Partner earns commissionValue% of this revenue
  - Example: commissionValue = 10 → Partner gets 10% of revenue from referrals

### Payout Processing
- Partners can request payout when balance reaches minimum threshold
- Admin approves/processes payouts via admin dashboard
- Update partner's totalWithdrawn and pendingPayout fields

## Security Considerations

1. **Referral Code Generation**
   - Use cryptographically secure random generation
   - Ensure uniqueness (database constraint)
   - Make codes reasonably short but secure (e.g., 8-character alphanumeric)

2. **Rate Limiting**
   - Limit referral link clicks per IP to prevent abuse
   - Limit partner account creation attempts

3. **Data Validation**
   - Validate commission values (reasonable ranges)
   - Ensure referral codes can't be guessed/enumerated easily
   - Sanitize all inputs to prevent injection

4. **Privacy**
   - Partners can only see their own statistics
   - No access to referred users' personal data
   - Aggregate reporting only

## Implementation Phases

### Phase 1: Database & Core API
1. Update Prisma schema with partner fields
2. Generate and apply migration
3. Create partner creation API in admin-backend
4. Implement referral code generation
5. Add email invitation system

### Phase 2: Backend Integration
1. Modify auth signup to handle referrals
2. Create referral tracking service
3. Implement commission calculation logic
4. Add partner stats API endpoints

### Phase 3: Website Transformation
1. Convert website to partner-only authentication
2. Build partner login page
3. Create partner dashboard
4. Implement protected routes
5. Add referral link display

### Phase 4: Mobile App Integration
1. Update deep linking configuration
2. Implement referral code handling in app
3. Test Play Store redirection
4. Verify bonus application on signup

### Phase 5: Testing & Refinement
1. End-to-end testing of referral flow
2. Commission calculation verification
3. Security audit
4. Performance optimization
5. User feedback incorporation

## Estimated Effort
- Database/API: 3-4 days
- Website: 4-5 days  
- Mobile App: 2-3 days
- Testing: 2-3 days
- Total: ~2 weeks

## Success Metrics
1. Partners can successfully create accounts via admin dashboard
2. Referral links correctly track clicks and signups
3. Commissions are calculated accurately per selected method
4. Partners can view their performance dashboard
5. System prevents abuse/fraudulent referrals
6. Email notifications work correctly