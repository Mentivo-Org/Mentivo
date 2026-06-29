# Mentivo Environment Variables Guide

This document lists all environment variables used across the Mentivo project, where to obtain them, and which instances (Render/Vercel) require them.

---

## 1. Load Balancer (Render)
These variables control routing and logging for the main entry point of your backend.

| Variable | Description | Where to Obtain |
|---|---|---|
| `MAIN_INSTANCE_URL` | URL of the main backend instance | Render Dashboard (e.g., `https://mentivo-main.onrender.com`) |
| `WORKER_URLS` | Comma-separated URLs of worker instances | Render Dashboard (e.g., `https://worker1.onrender.com,https://worker2...`) |
| `DATABASE_URL` | Supabase Connection Pooler URL | Supabase Dashboard → Database → Settings |
| `DIRECT_URL` | Supabase Direct Connection URL | Supabase Dashboard → Database → Settings |

*(Render automatically injects `PORT` and `RENDER_INSTANCE_ID`)*

---

## 2. Main Backend (Render)
This is the core API server that handles business logic, admin operations, and third-party integrations.

### Render Logging & Infrastructure
| Variable | Description | Where to Obtain |
|---|---|---|
| `RENDER_API_KEY` | Key to fetch logs from Render API | Render Dashboard → Account Settings → API Keys |
| `RENDER_MAIN_BACKEND_SERVICE_ID` | Service ID for the main backend | Render Dashboard (from the URL: `srv-xxxxxx`) |
| `RENDER_WORKER_SERVICE_IDS` | Comma-separated labels and IDs for workers | E.g., `Worker 1:srv-abc,Worker 2:srv-def` |
| `ENABLE_ADMIN_API` | Set to `true` to enable admin routes on this instance | Manual Configuration |
| `ALLOWED_ORIGINS` | CORS allowed origins (e.g., `*` or your domains) | Manual Configuration |

### Supabase & Database
| Variable | Description | Where to Obtain |
|---|---|---|
| `DATABASE_URL` | Supabase Connection Pooler URL | Supabase Dashboard → Database |
| `DIRECT_URL` | Supabase Direct Connection URL | Supabase Dashboard → Database |
| `SUPABASE_URL` | Project URL | Supabase Dashboard → API Settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin API Key (Service Role) | Supabase Dashboard → API Settings |
| `SUPABASE_ID_CARD_BUCKET_NAME` | Storage bucket for mentor docs | Supabase Dashboard → Storage |
| `SUPABASE_PROFILE_PICTURE_BUCKET_NAME` | Storage bucket for profile pictures | Supabase Dashboard → Storage |
| `SUPABASE_STORAGE_ACCESS_KEY` | S3 Access Key for Supabase | Supabase Dashboard → Storage → Settings |
| `SUPABASE_STORAGE_SECRET` | S3 Secret Key for Supabase | Supabase Dashboard → Storage → Settings |

### Authentication & Security
| Variable | Description | Where to Obtain |
|---|---|---|
| `ACCESS_TOKEN_SECRET` or `JWT_SECRET` | Secret for signing JWTs | Generate securely (e.g., `openssl rand -hex 32`) |
| `REFRESH_TOKEN_SECRET` or `JWT_REFRESH_SECRET`| Secret for refresh tokens | Generate securely |

### Redis
| Variable | Description | Where to Obtain |
|---|---|---|
| `REDIS_URL` | Connection string for Redis | Upstash or Render Redis Dashboard |

### Firebase
*Note: If you use the `firebase-secrets.json` file in Render's Secret Files, you do **not** need these.*
| Variable | Description | Where to Obtain |
|---|---|---|
| `FIREBASE_PROJECT_ID` | Firebase Project ID | Firebase Console → Project Settings |
| `FIREBASE_CLIENT_EMAIL` | Service Account Email | Firebase Console → Service Accounts |
| `FIREBASE_PRIVATE_KEY` | Service Account Private Key | Firebase Console → Service Accounts |

### Agora (Voice & Chat)
| Variable | Description | Where to Obtain |
|---|---|---|
| `AGORA_APP_ID` | App ID | Agora Console → Project Management |
| `AGORA_APP_CERTIFICATE` | App Certificate | Agora Console → Project Management |
| `AGORA_CHAT_ORG_NAME` | Chat Organization Name | Agora Console → Chat Project |
| `AGORA_CHAT_APP_NAME` | Chat Application Name | Agora Console → Chat Project |
| `AGORA_CHAT_REST_URL` | Chat REST API URL | Agora Console → Chat Project |

### Razorpay & Resend
| Variable | Description | Where to Obtain |
|---|---|---|
| `RAZORPAY_KEY_ID` | Razorpay API Key | Razorpay Dashboard |
| `RAZORPAY_KEY_SECRET` | Razorpay API Secret | Razorpay Dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | Secret for validating webhooks | Razorpay Dashboard → Webhooks |
| `RAZORPAY_X_ACCOUNT` | RazorpayX Account ID | RazorpayX Dashboard |
| `ENABLE_RAZORPAY_X` | Enable Payouts (`true`/`false`) | Manual Configuration |
| `RESEND_API_KEY` | API Key for transactional emails | Resend Dashboard |

---

## 3. Worker Instances (Render)
Worker instances are strictly for handling load and do not run the admin API.

| Variable | Description | Where to Obtain |
|---|---|---|
| **Same as Main Backend** | Workers need the exact same environment variables as the Main Backend, **except**: | - |
| `ENABLE_ADMIN_API` | Set to `false` or omit entirely | - |
| `RENDER_API_KEY` | Not needed (workers don't fetch logs) | - |
| `RENDER_WORKER_SERVICE_IDS` | Not needed | - |
| `RENDER_MAIN_BACKEND_SERVICE_ID` | Not needed | - |

---

## 4. Admin Dashboard (Vercel)
| Variable | Description | Where to Obtain |
|---|---|---|
| `NEXT_PUBLIC_ADMIN_API_URL` | URL pointing to your Load Balancer's admin routes | `https://your-load-balancer.onrender.com/api/admin` |

---

## 5. Website (Vercel)
| Variable | Description | Where to Obtain |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL pointing to your Load Balancer's main routes | `https://your-load-balancer.onrender.com/api` |
