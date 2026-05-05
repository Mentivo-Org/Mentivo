# Mentivo Project Guidance

Mentivo is a per-minute voice mentorship marketplace connecting JEE aspirants with verified IIT students.

## Tech Stack
- **Backend**: Node.js, Express, Prisma (PostgreSQL via Supabase), Redis (ioredis).
- **Frontend**: React Native (Expo), Zustand (State), NativeWind (UI).
- **Services**: Agora (VoIP Calling & Chat), Razorpay (Payments/Payouts), Firebase (Auth/Push).

## Architecture & Conventions
- **Database**: 
  - Primary database is **Supabase** (PostgreSQL).
  - Always use **Prisma** for database operations in the backend. 
  - Schema is defined in `backend/prisma/schema.prisma`.
  - Enforce atomic transactions for billing and wallet operations.
- **Backend**:
  - Use `express-async-errors` for global error handling.
  - Authentication is handled via Firebase ID tokens or Google Login.
  - Webhook handlers (Razorpay) must be idempotent.
- **Frontend**:
  - Use **Zustand** for lightweight state management.
  - Follow the role-based navigation (Student vs. Mentor).
  - Calls are VoIP (in-app) using **Agora SDK**.
  - Call timer is maintained on the app screen.
- **Real-time**:
  - Mentor presence is managed via Redis heartbeats (TTL: 60s).
  - Initial chat feature handled via **Agora Chat**.

## Core Workflows
1. **Call Initiation**: Validate wallet balance (min ₹10), check mentor presence, initiate Agora VoIP call session.
2. **Billing**: Atomic debit of student wallet and credit of mentor pending payout upon call completion (first 5 min free).
3. **Payouts**: Weekly batch jobs for mentor payouts via Razorpay X, deducting TDS if applicable.

## Project Structure
- `/backend`: API server, Prisma schema, services (Agora, Razorpay, Firebase).
- `/frontend`: React Native Expo application.
- `/supabase`: Supabase configuration and migrations.

## Development Guidelines
- Always refer to `VISION.md` for detailed product requirements and business logic.
- Keep `IMPLEMENTATION_NOTES.md` updated with technical changes.
- Ensure all new API endpoints are documented in the API Reference section of `VISION.md`.
