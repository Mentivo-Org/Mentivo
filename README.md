# Mentivo

Mentivo is a per-minute voice mentorship marketplace connecting JEE aspirants (and their parents) with verified, current IIT students.

## 🚀 Product Overview

- **Core Mechanic**: ₹10/min VoIP call, wallet-based, no subscription.
- **Supply**: Verified current IIT students across all IITs.
- **Demand**: JEE aspirants (Class 11/12), droppers, and their parents.
- **Revenue Model**: 30% platform commission; 70% mentor share (~₹7/min).
- **Free Tier**: First 5 minutes free for new users.

## 🛠 Tech Stack

### Frontend
- **Framework**: React Native (Expo)
- **State Management**: Zustand
- **UI & Styling**: NativeWind (Tailwind CSS for React Native)
- **Communication**: Agora SDK (VoIP Voice Calls & Chat)
- **Push Notifications**: Firebase Cloud Messaging (FCM)

### Backend
- **Runtime**: Node.js (20 LTS)
- **Framework**: Express.js
- **Database**: PostgreSQL (hosted on Supabase)
- **ORM**: Prisma
- **Cache & Presence**: Redis (ioredis)
- **Job Queue**: BullMQ
- **Authentication**: Firebase Auth / Google Login

### Services
- **Agora**: In-app VoIP calling, on-screen call timer, and chat.
- **Razorpay Standard**: Student wallet top-ups (UPI, Cards, Netbanking).
- **Razorpay X**: Automated weekly payouts to mentor bank accounts.
- **Supabase Storage**: Mentor profile photos and call recordings.

## 📂 Project Structure

```text
/
├── backend/            # Express API, Prisma schema, services, and jobs
├── frontend/           # React Native Expo application
├── supabase/           # Supabase configuration and database migrations
├── GEMINI.md           # Project-specific AI guidance
├── VISION.md           # Comprehensive product and technical roadmap
└── IMPLEMENTATION_NOTES.md # Technical implementation details and API logs
```

## ⚙️ Getting Started

### Prerequisites
- Node.js 20+
- Expo CLI
- Docker (optional, for local Postgres/Redis)
- Supabase account & project

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env` file (refer to `VISION.md` for required variables).
4. Run Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Start the development server:
   ```bash
   npm run dev
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
3. Start the Expo development server:
   ```bash
   npx expo start
   ```

## 🔄 Core Workflows

1. **Call Initiation**: Validate student wallet balance (min ₹10), check mentor presence via Redis, generate Agora tokens, and initiate the in-app VoIP call.
2. **Billing**: Atomic transaction upon call completion to debit the student's wallet and credit the mentor's pending payout (accounting for the 5-minute free tier).
3. **Payouts**: Weekly batch jobs triggered via BullMQ to process mentor payouts through Razorpay X.

## 👥 Team
- **Abhiraj**: CEO
- **Ayan**: CTO

---
*Mentivo — Connecting Aspirants with Excellence.*
