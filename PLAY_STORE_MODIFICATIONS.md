# App Payment Architecture — Modifications & Compliance Guide

## Overview

The original idea had students topping up a wallet **inside the app** via Razorpay, and mentors being paid a percentage of that. This needs structural changes to comply with Google Play's billing policy while keeping Razorpay and avoiding the Play Store's commission cut.

The core principle: **no real money should move inside the app.**

---

## What Changes and Why

| Original | Modified | Reason |
|---|---|---|
| Wallet top-up inside the app (Razorpay) | Top-up moved to your **website** | Google Play billing policy violation |
| "Wallet" terminology in app | "Credits" or "Session Credits" | Avoids financial services classification |
| Financial services declared in Play Console | Declared as **Education** app | Personal developer account + no in-app payment |
| Mentor paid from in-app flow | Mentor paid via **Razorpay Payouts** from backend | Keeps money flow server-side |

---

## New Money Flow Architecture

```
[Student visits your Website]
        |
        | Pays ₹X via Razorpay (Payment Page / Payment Link)
        ↓
[Your Backend]
        |
        | Credits student's account with session credits
        ↓
[Student opens the App]
        |
        | Sees credit balance (read-only, from backend)
        | Books / calls a mentor (spends credits)
        ↓
[Your Backend — after session ends]
        |
        |-- ₹ Mentor's share  →  Mentor's bank (via Razorpay Payouts / Route)
        |-- ₹ Platform's share → Stays in your account
```

**No payment occurs inside the app at any point.**

---

## Changes Required

### 1. App — Remove In-App Payment Flow

- Remove all Razorpay SDK calls from the mobile app.
- Remove the wallet top-up screen entirely.
- Replace the top-up button with a **"Add Credits"** button that opens your website in the device's default browser.

```kotlin
// Android example
val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://yourwebsite.com/add-credits"))
startActivity(intent)
```

- Do **not** use a WebView for the payment page — opening the external browser is important for policy compliance.

---

### 2. App — Wallet Display

- Keep the credit balance visible inside the app — this is fine since it's just reading data, not transacting.
- Rename all references:
  - "Wallet" → "Credits" or "Session Credits"
  - "Top Up" → "Add Credits"
  - "Recharge" → "Add Credits"
- Show a banner or note: *"Credits can be added via our website."*

---

### 3. Website — Add Credits Page

Build a `/add-credits` page on your website that:

- Authenticates the logged-in user (via session token, JWT, or a secure deep link with user ID).
- Shows a list of credit packs (e.g., ₹200 → 20 credits, ₹500 → 55 credits).
- Triggers Razorpay checkout on selection.
- On successful payment, calls your backend to credit the user's account.
- Shows a confirmation and prompts the user to return to the app.

> **Tip:** Pass a `?userId=` or use JWT so the backend knows whose account to credit after payment.

---

### 4. Backend — Credit & Session Logic

- Maintain a `credits` balance per student in your database.
- Deduct credits when a session starts or ends (depending on your billing model — per-minute or fixed).
- Never expose a "withdraw credits to bank" option for students. Credits are **non-refundable and non-withdrawable** (Closed PPI compliance).

---

### 5. Backend — Mentor Payouts

Use **Razorpay Payouts** or **Razorpay Route** to pay mentors.

**Recommended: Razorpay Route (for automatic split)**

- When a session ends, calculate:
  - Mentor's share (e.g., 80% of session value)
  - Platform's share (e.g., 20%)
- Trigger a payout transfer to the mentor's linked bank account via Razorpay Route API.
- Mentors should complete KYC and link their bank account during onboarding.

```
Session Value: ₹200
Mentor receives: ₹160  ← via Razorpay Route/Payout
Platform keeps:  ₹40   ← stays in your Razorpay account
```

This is a **B2P (Business to Person)** payment — the platform paying a service provider — and is completely separate from the student wallet. No RBI PPI concern here.

---

## Google Play Console — What to Declare

### App Content Declaration
- **Financial Services:** Do **not** declare. No in-app financial transaction occurs.
- **Primary Category:** Education
- **Secondary Category:** Communication (if applicable, for the calling feature)

### App Description & Screenshots
- Remove any mention of "pay", "wallet", "top up", "recharge", or "add money" from the app's Play Store listing.
- Screenshots should not show any payment screen (since those now live on the website).
- You may mention: *"Purchase session credits on our website to connect with mentors."*

### Data Safety Section
- Declare collection of: User ID, financial transactions (if you log session billing), app activity.
- Since no payment data is collected inside the app, you do not need to declare payment info under Data Safety.

---

## RBI / PPI Compliance Notes

Since the student wallet holds real money (even if represented as credits):

| Rule | Your Implementation |
|---|---|
| Closed PPI (no RBI license needed) | Credits usable **only** on your platform |
| No cash-out for students | Students cannot withdraw credits to bank |
| No peer transfer | Students cannot send credits to other students |
| Balance cap | Keep max wallet balance at ₹10,000 or below per user |

This keeps you in the **Closed PPI** category, which is exempt from RBI's PPI authorization requirements. Most Indian edtech and gig platforms operate under this model.

---

## Razorpay Setup Checklist

- [ ] **Razorpay Payment Page / Payment Links** — for student credit purchases on website
- [ ] **Razorpay Route** — for splitting session earnings between mentor and platform
- [ ] **Razorpay Payouts** — for disbursing mentor earnings to their bank accounts
- [ ] Mentor onboarding flow with **KYC + bank account linking** (Razorpay Contact + Fund Account API)
- [ ] Webhook setup to credit student account after successful payment

---

## Summary

The app itself becomes a **pure service app** — students browse mentors, book sessions, and attend calls. All money handling happens on your website (incoming) and your backend (outgoing to mentors). This keeps you fully compliant with Google Play policy, avoids their billing cut, and sidesteps the need for a financial services declaration — while your actual payment infrastructure stays entirely on Razorpay.