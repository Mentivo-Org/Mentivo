# Mentivo

**Per-minute voice mentorship for JEE aspirants — talk to a real IIT student, right now, for as long as you need.**

[mentivo.in](https://www.mentivo.in)

---

## Table of Contents

- [What is Mentivo?](#what-is-mentivo)
- [The Problem](#the-problem)
- [Core Mechanic](#core-mechanic)
- [Revenue Model](#revenue-model)
- [Who Uses Mentivo](#who-uses-mentivo)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Core Workflows](#core-workflows)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Getting Started](#getting-started)
- [Production Build & Start Commands](#production-build--start-commands)
- [Database Setup](#database-setup)
- [Team](#team)

---

## What is Mentivo?

Mentivo is a marketplace that connects JEE (Joint Entrance Examination) aspirants — and their parents — with verified, currently-enrolled IIT students for live, one-on-one voice mentorship. There are no monthly plans, no bundled packages, and no long-term commitments. A student opens the app, sees who's online, taps to call, and pays only for the minutes they actually talk.

Think of it as the difference between hiring a tutor for a semester and calling a friend who happens to have cracked JEE and is willing to walk you through your doubt, your strategy, or your anxiety about the exam — right now, for exactly as long as the conversation is useful.

## The Problem

Preparing for JEE is one of the most high-pressure academic journeys in India. Aspirants and their parents are flooded with:

- **Expensive, rigid coaching packages** that don't adapt to a specific doubt or a single bad week
- **A trust gap** — nobody outside the IIT ecosystem can credibly tell you what studying there is *actually* like, which branches are worth fighting for, or whether a strategy will hold up
- **No lightweight way to just ask** — most mentorship products are built around scheduled sessions, subscriptions, or courses, when what a stressed 12th grader often needs is a 7-minute phone call

Mentivo removes the friction between "I have a question" and "I'm talking to someone qualified to answer it."

## Core Mechanic

The entire product is built around one simple loop:

1. **Wallet, not subscription.** Students (or their parents) top up a prepaid in-app wallet using UPI, cards, or netbanking.
2. **Browse verified mentors.** Every mentor is a currently-enrolled IIT student who has gone through identity and university verification.
3. **Call, don't book.** If a mentor shows as "Available," the student taps to call immediately — no scheduling, no waiting for a slot.
4. **Pay per minute.** Calls are billed at **₹10/minute**, deducted live from the wallet as the call happens, with an on-screen timer visible throughout.
5. **First 5 minutes are free** for every new user, so trying the product costs nothing.
6. **Hang up whenever.** The moment the call ends, billing stops. No minimum call length, no cancellation fees.

This "metered, on-demand" mechanic is deliberately closer to a ride-hailing app or a prepaid SIM than to an edtech subscription — the goal is to make expert access feel as frictionless as making a phone call.

## Revenue Model

Every rupee that flows through a call is split transparently:

| Share | Recipient | Purpose |
|---|---|---|
| **~70% (₹7/min)** | Mentor | Direct payout to the IIT student for their time |
| **30%** | Platform | Covers infrastructure, verification, payments, and support |
| **5%** (of platform's take, from students on that partner's referral) | Coaching Centers | Revenue share when a coaching institute's students use the platform |

Mentor payouts are automated and settle weekly via **Razorpay X**, so mentors aren't left chasing payments for a side-hustle they're fitting around their own coursework.

## Who Uses Mentivo

- **Supply side:** Verified current students across all IITs, who mentor part-time between classes
- **Demand side:** JEE aspirants in Class 11/12, "droppers" (students repeating a prep year), and parents who want an informed second opinion on strategy, branch choice, or their child's preparation

## Architecture

Mentivo is built as a **pnpm monorepo** with clearly separated concerns for the user-facing product and the administrative/partner tooling. Each piece is deployed and scaled independently, but they share types, database schema conventions, and tooling config through the monorepo.

```
                        ┌───────────────────────────┐
                        │   React Native (Expo)     │
                        │      Mobile App           │
                        │  (Students & Mentors)     │
                        └────────────┬──────────────┘
                                     │  REST / WebSocket
                                     ▼
                    ┌────────────────────────────────┐
                    │        Load Balancer           │
                    │   (routes to backend workers)  │
                    └───────────────┬────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
     ┌───────────────────┐  ┌──────────────────┐   ┌───────────────────┐
     │  Backend Main     │  │ Backend Worker   │   │   Redis           │
     │  (Express API)    │◄─┤ (BullMQ jobs)    │──►│ (presence, cache) │
     └─────────┬─────────┘  └─────────┬────────┘   └───────────────────┘
               │                      │
               ▼                      ▼
     ┌──────────────────────────────────────┐
     │   PostgreSQL (via Supabase)          │
     │        + Prisma ORM                  │
     └──────────────────────────────────────┘
                    ┌─────────────────────┐
                    │  Admin Dashboard    │
                    │    (Next.js)        │
                    └─────────┬───────────┘
                              │  hits Backend Main
                              │  on its admin port
                              ▼
                    (same Backend Main / Express API
                     shown above, admin routes)

     ┌────────────────────────────────────────┐
     │         Website (Next.js)              │
     │     Coaching Partner Dashboard,        │
     │      Telegram Admin Referrals          │
     └────────────────────────────────────────┘

     External services woven throughout:
     Agora (VoIP calling) · Razorpay Standard (top-ups) ·
     Razorpay X (mentor payouts) · Firebase (auth + push) ·
     Supabase Storage (photos, ID cards, recordings)
```

**Design principles behind the architecture:**

- **Separation of user vs. admin surfaces.** The admin backend and admin frontend are intentionally decoupled from the main consumer-facing backend, so platform operations (moderation, partner management, payouts oversight) never compete for resources or deploy cycles with the live calling product.
- **Presence lives in Redis, not Postgres.** Because "is this mentor available right now" needs to be read and written constantly and cheaply, mentor online/offline state is tracked via Redis heartbeats rather than round-tripping to the relational database.
- **Billing is job-queue driven.** Wallet debits, mentor payout accrual, and cleanup of abandoned calls are handled by BullMQ background workers, keeping the request/response path for starting a call fast while billing correctness happens asynchronously and atomically.
- **A dedicated load balancer** sits in front of the backend to route traffic across the main API and worker processes, supporting horizontal scaling as call volume grows.

## Tech Stack

### Frontend & Mobile
- **Framework:** React Native (Expo)
- **State Management:** Zustand
- **UI & Styling:** NativeWind (Tailwind CSS for React Native)
- **Communication:** Agora SDK for VoIP voice calls and in-app chat
- **Push Notifications:** Firebase Cloud Messaging (FCM)

### Web (Dashboards)
- **Framework:** Next.js
- **Purpose:** Coaching Partner Dashboard, Telegram Admin Referral tooling, and System Admin Management

### Backend
- **Runtime:** Node.js (20 LTS)
- **Framework:** Express.js
- **Database:** PostgreSQL, hosted on Supabase
- **ORM:** Prisma
- **Cache & Presence:** Redis (via ioredis)
- **Job Queue:** BullMQ
- **Authentication:** Firebase Admin SDK (Google/Email ID tokens) plus unique institution codes for coaching-center logins

### Services
- **Agora:** In-app VoIP calling with a live, on-screen billing timer
- **Razorpay Standard:** Student wallet top-ups (UPI, Cards, Netbanking)
- **Razorpay X:** Automated weekly payouts to mentor bank accounts
- **Supabase Storage:** Mentor profile photos, university ID verification documents, and call recordings

## Core Workflows

1. **Call Initiation** — Before a call connects, the server validates the student's wallet balance (minimum ₹10), confirms the mentor's presence status in Redis, and generates a short-lived, dynamic Agora token scoped to that specific call.
2. **Billing Engine** — When a call ends, an atomic transaction moves it from `Active` to `Settling`: the student's wallet is debited, the mentor's pending payout balance is credited, and the system accounts for the first-5-minutes-free tier and any applicable coaching-center commission — all in a single consistent operation.
3. **Referral System** — Telegram Admins distribute master referral codes; students can also generate their own personal codes from the website. Sign-ups that use a referral code trigger automatic wallet credits for the referred student and commission accrual for the referring admin.
4. **Coaching Partner Integration** — Institutes log in with a unique institution code to a dedicated Next.js dashboard, where they can track their enrolled students' usage of the platform and their share of platform revenue.
5. **Presence System** — Mentors broadcast an "Available" heartbeat to Redis every 60 seconds (TTL-based). If a mentor's heartbeat lapses mid-call, an automated sweeper detects the abandoned session and resolves billing fairly rather than leaving a call stuck in limbo.

## Project Structure

```
├── backend/            # Express API (incl. admin routes on a dedicated admin port), Prisma schema, services, and background jobs
├── frontend/            # React Native Expo application (students & mentors)
├── admin-frontend/      # Next.js Admin Dashboard for platform management
├── website/              # Next.js web dashboards for coaching partners and admins
├── supabase/             # Supabase configuration and database migrations
├── load-balancer/       # Traffic routing in front of backend services
```

## Deployment

Mentivo is hosted across **Render** and **Vercel** for high availability and clean separation between compute-heavy backend services and static/edge-friendly frontends.

**User Platform**
- Backend API — Render
- Frontend / Website — Vercel

**Administrative Platform**
- Admin Backend — Render (separate, dedicated account for isolation)
- Admin Dashboard — Vercel

## Getting Started

Mentivo is structured as a monorepo managed with `pnpm` workspaces.

### Development Commands

Start every service concurrently (main backend, worker, load balancer, admin dashboard, and website):

```bash
pnpm dev
```

Or run individual services during development:

```bash
# Backend Main
pnpm --filter backend dev:backend-main

# Backend Worker
pnpm --filter backend dev:backend-worker

# Load Balancer
pnpm --filter load-balancer start

# Admin Dashboard
pnpm --filter mentivo-admin-frontend dev

# Website
pnpm --filter website dev
```

## Production Build & Start Commands

| Service | Directory | Build Command | Start Command |
|---|---|---|---|
| Backend Main & Worker | `/backend` | `pnpm install && pnpm run render:build` | `pnpm run start` |
| Load Balancer | `/load-balancer` | `pnpm install && pnpm run render:build` | `pnpm run start` |
| Admin Dashboard | `/admin-frontend` | `pnpm install && pnpm run build` | `pnpm run start` |
| Website & Partner Portal | `/website` | `pnpm install && pnpm run build` | `pnpm run start` |
| Mobile App | `/frontend` | `npm install` | `npx expo start` (or EAS build) |

## Database Setup

Before running the backend in production, apply Prisma migrations:

```bash
cd backend
npx prisma migrate deploy
```

> N.B. - In actual production environment **Github Actions** is used for prisma migration. 

## Github Actions

I have set up multiple Github Actions for production deployment, to make **my life** easier.

- [Prisma Migration](https://github.com/Ayan-Bain/Mentivo/actions/workflows/prisma-migrate.yml)
- [Build Mobile App](https://github.com/Ayan-Bain/Mentivo/actions/workflows/release.yml)
- [Deploy Services](https://github.com/Ayan-Bain/Mentivo/actions/workflows/deploy_services.yml)

## Team

- **Abhiraj** — CEO
- **Ayan** — CTO

---

*Mentivo — Connecting Aspirants with Excellence.*