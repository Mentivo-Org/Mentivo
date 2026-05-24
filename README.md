# Mentivo

Mentivo is a per-minute voice mentorship marketplace connecting JEE aspirants (and their parents) with verified, current IIT students.

## 🚀 Product Overview

- **Core Mechanic**: ₹10/min VoIP call, wallet-based, no subscription.
- **Supply**: Verified current IIT students across all IITs.
- **Demand**: JEE aspirants (Class 11/12), droppers, and their parents.
- **Revenue Model**: 
  - 70% Mentor share (~₹7/min).
  - 30% Platform commission.
  - 5% Revenue share for coaching centers on their students' usage.
- **Free Tier**: First 5 minutes free for new users.

## 🛠 Tech Stack

### Frontend & Mobile
- **Framework**: React Native (Expo)
- **State Management**: Zustand
- **UI & Styling**: NativeWind (Tailwind CSS for React Native)
- **Communication**: Agora SDK (VoIP Voice Calls & Chat)
- **Push Notifications**: Firebase Cloud Messaging (FCM)

### Web (Dashboards)
- **Framework**: Next.js
- **Purpose**: Coaching Partner Dashboard, Telegram Admin Referrals, and System Admin Management.

### Backend
- **Runtime**: Node.js (20 LTS)
- **Framework**: Express.js
- **Database**: PostgreSQL (hosted on Supabase)
- **ORM**: Prisma
- **Cache & Presence**: Redis (ioredis)
- **Job Queue**: BullMQ
- **Authentication**: Firebase Admin SDK (Google/Email ID tokens) & Unique Codes (Coaching Centers).

### Services
- **Agora**: In-app VoIP calling with live on-screen timer.
- **Razorpay Standard**: Student wallet top-ups (UPI, Cards, Netbanking).
- **Razorpay X**: Automated weekly payouts to mentor bank accounts.
- **Supabase Storage**: Mentor profile photos, university ID cards, and call recordings.

## 📂 Project Structure

```text
/
├── backend/            # Express API, Prisma schema, services, and jobs
├── frontend/           # React Native Expo application
├── admin-backend/      # Admin-specific Express API with separate Prisma setup
├── admin-frontend/     # Next.js Admin Dashboard for platform management
├── website/            # Next.js web dashboards for partners and admins
├── supabase/           # Supabase configuration and database migrations
├── GEMINI.md           # Project-specific AI guidance
├── VISION.md           # Comprehensive product and technical roadmap
└── IMPLEMENTATION_NOTES.md # Detailed technical logs and API reference
```

## ⚙️ Getting Started

### Prerequisites
- Node.js 20+
- Expo CLI
- Docker (for local development)
- Supabase Project & Redis Instance

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your `.env` file (see `VISION.md` for required keys).
4. Run migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Start the server:
   ```bash
   npm run run
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo server:
   ```bash
   npx expo start
   ```

## 🔄 Core Workflows

1. **Call Initiation**: Server-side validation of student wallet (min ₹10), mentor presence check in Redis, and generation of dynamic Agora tokens.
2. **Billing Engine**: Atomic transaction upon call completion (Active -> Settling) to debit student wallet and credit mentor pending payout, accounting for the 5-minute free tier and coaching center commission.
3. **Referral System**: Telegram Admins share master codes. Students generate personal codes on the website. Signups with these codes trigger automated wallet credits for students and commission for admins.
4. **Coaching Partner Integration**: Institutes login via unique codes to track their students' progress and platform usage via a dedicated Next.js dashboard.
5. **Presence System**: Mentors maintain an "Available" state via Redis heartbeats (60s TTL). An automated sweeper handles abandoned calls to ensure fair billing.

## 👥 Team
- **Abhiraj**: CEO
- **Ayan**: CTO

---
*Mentivo — Connecting Aspirants with Excellence.*
