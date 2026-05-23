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
  - Implement 5% revenue sharing logic for coaching centers in `settleBilling`.
- **Backend**:
  - Use `express-async-errors` for global error handling.
  - Authentication: Firebase ID tokens (Students/Mentors) or Unique Code (Coaching Centers).
  - Webhook handlers (Razorpay) must be idempotent.
- **Frontend**:
  - Use **Zustand** for lightweight state management.
  - Follow the role-based navigation (Student vs. Mentor).
  - Web dashboard (Next.js) for Coaching Partners.
  - Calls are VoIP (in-app) using **Agora SDK**.
  - Call timer is maintained on the app screen.
- **Real-time**:
  - Mentor presence is managed via Redis heartbeats (TTL: 60s).
  - Initial chat feature handled via **Agora Chat**.

## Core Workflows
1. **Call Initiation**: Validate wallet balance (min ₹10), check mentor presence, initiate Agora VoIP call session.
2. **Billing**: Atomic debit of student wallet and credit of mentor pending payout upon call completion (first 5 min free). Calculate and credit 5% revenue share to the linked coaching center if applicable.
3. **Coaching Partner Login**: Coaching centers login using their unique referral code to access their student aggregation dashboard.
4. **Telegram Admin Referrals**: Students generate personalized codes on the website using an admin's master code. Upon first-time signup in the app with this code, the student gets a wallet credit (variable ₹) and the admin gets a commission (variable ₹).
5. **Payouts**: Weekly batch jobs for mentor and coaching center payouts via Razorpay X, deducting TDS if applicable. Manual processing for Telegram admin payout requests via UPI.

## Project Structure
- `/backend`: API server, Prisma schema, services (Agora, Razorpay, Firebase).
- `/frontend`: React Native Expo application.
- `/supabase`: Supabase configuration and migrations.

## Development Guidelines
- Always refer to `VISION.md` for detailed product requirements and business logic.
- Keep `IMPLEMENTATION_NOTES.md` updated with technical changes.
- Ensure all new API endpoints are documented in the API Reference section of `VISION.md`.

## SVG & Asset Guidelines
- **Component**: Always use `Image` from `expo-image` for rendering SVG assets in the frontend. The standard `Image` component from `react-native` does not support SVGs natively.
- **Preparation**: Ensure SVG files do not contain CSS variables (e.g., `var(--fill-0, #color)`). Use standard hex codes for colors.
- **Styling**: For monochromatic icons (like arrows), use the `tintColor` prop on the `Image` component to ensure proper contrast against different background colors.
