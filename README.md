# Nuatis POS — Replit Agent Prototype

> **THROWAWAY UX PROTOTYPE — DO NOT USE AS BASIS FOR PRODUCTION**
>
> Built in one day on Replit Agent (May 2, 2026) for UX validation only. Code quality is exploratory. Architecture is intentionally wrong. Production POS build follows the separate Master Plan documents (PRD / MVP / Build Checklist) and starts post-Suite-ship (Aug 2026+).

---

## What This Is

- A tablet-portrait single-vertical (salon) point-of-sale UX prototype.
- Single-page React app simulating the operator flow from tile-tap to mock checkout to mock receipt.
- State lives in localStorage. No backend, no real payments, no real auth beyond Replit's session.

---

## What Was Validated

- Quick-tile register layout at iPad portrait (1024×768)
- Right-side cart vs slide-in (fixed-right won)
- In-place tip selection (no modal interruption)
- Simulated card reader timing (~2 sec)
- Receipt panel + 4-channel mock delivery
- Customer attach pre-sale AND post-sale (phone-first)
- Per-line staff attribution with active-staff default
- Today's Sales overlay with per-staff breakdown
- Service-specific modifiers (fixed price)
- Hold/Resume tickets (cap 5, persisted)

---

## Stack — Deviations From Master Plan

| Layer | Production (locked) | This Prototype |
|---|---|---|
| Framework | Next.js 14 App Router | React 18 + Vite |
| CSS | Tailwind v3 | Tailwind v4 |
| Fonts | next/font/google | `@import url()` in CSS |
| Auth | Supabase Auth + RLS | Replit OIDC |
| Payments | Stripe Terminal SDK (BBPOS) | 2-second `setTimeout` simulation |
| Persistence | Supabase Postgres + RLS | localStorage |
| Receipts | Star TSP100III ESC/POS + Resend + Telnyx | Mock toasts only |
| State | Server-authoritative | In-memory + localStorage |

These deviations are intentional. The prototype was built to answer UX questions, not architecture questions. Production answers all the architecture questions and ignores this code entirely.

---

## What Is NOT In This Prototype (By Design)

- Stripe Terminal hardware integration
- Multi-tenant isolation
- Offline mode + sync queue
- Multi-vertical engine (only salon — 12 hardcoded services)
- Real authentication beyond Replit's
- Real receipt delivery (no Resend, no Telnyx, no printer driver)
- TaxJar (8.25% flat tax hardcoded)
- Manager override flows
- PIN auth for staff
- Audit log
- Discounts, comps, voids, refunds
- Multi-station support, real-time sync
- Customer profiles / purchase history
- Tip allocation across staff
- Date range reporting (Today / All toggle only)
- Configurable business identity (hardcoded to "Nuatis POS Demo Salon")

---

## localStorage Keys

| Key | Purpose |
|---|---|
| `nuatis-pos:cart` | Active cart (lineItems + customer) |
| `nuatis-pos:transactions` | Last 10 completed transactions |
| `nuatis-pos:heldTickets` | Up to 5 held tickets |
| `nuatis-pos:activeStaffId` | Current operator's staff id |

---

## Hardcoded Mock Data

- **12 salon services** (`lib/services.ts`) — Women's Cut, Men's Cut, Beard Trim, Kids Cut, Highlights Full, Color Root, Gloss, Olaplex Treatment, Deep Conditioning, Wax, Blowout, Polish Change
- **3 staff** (`lib/staff.ts`) — Maria / Stylist, James / Colorist, Lisa / Stylist
- **6 customers** (`lib/customers.ts`) — Sarah Chen, Marcus Rodriguez, Priya Patel, David Kim, Emma Thompson, Jordan Williams
- **Service-specific modifiers** (`lib/modifiers.ts`) — only 5 of 12 services have modifiers (Women's Cut, Men's Cut, Highlights Full, Color Root, Gloss)
- **Mock card** — "Card • Visa •••• 4242" on every receipt
- **Business identity** — "Nuatis POS Demo Salon · 123 Main St, Austin, TX 78701 · (512) 555-0100"

---

## Running Locally

```bash
pnpm install
pnpm --filter @workspace/nuatis-pos run dev
```

Open the Replit-provided URL. Replit Auth gates the app — log in with any Replit account.

---

## When Production Build Starts

- Read the three Master Plan documents (PRD, MVP, Build Checklist).
- Ignore this code.
- Take only the visual decisions and flow patterns documented in screenshots/notes from prototype day.
