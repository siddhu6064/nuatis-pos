# Nuatis POS — Replit Agent Prototype

> **THROWAWAY UX PROTOTYPE — DO NOT USE AS BASIS FOR PRODUCTION**
>
> Built in one day on Replit Agent (May 2, 2026) for UX validation only. Code quality is exploratory. Architecture is intentionally wrong. Production POS build follows the separate Master Plan documents (PRD / MVP / Build Checklist) and starts post-Suite-ship (Aug 2026+).

---

## What This Is

- A tablet-portrait multi-vertical point-of-sale UX prototype (salon + spa).
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
- Per-line % discount with manager-override gate above 20%
- Whole-ticket comp with 6-reason picker
- Manager PIN override modal (4-box auto-advance, mock-validate)
- Line-level partial refund with proportional tax allocation
- REFUNDED / PARTIAL / COMPED transaction badges
- Multi-vertical engine (salon + spa) via config alone
- Header vertical switcher with cart-empty gating
- Per-vertical namespaced localStorage

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
| Manager Auth | bcrypt PIN hash + audit log | Mock — any 4 digits accepted |
| Refund | Stripe Refund API | Mock 1500ms simulated |

These deviations are intentional. The prototype was built to answer UX questions, not architecture questions. Production answers all the architecture questions and ignores this code entirely.

---

## What Is NOT In This Prototype (By Design)

- Stripe Terminal hardware integration
- Multi-tenant isolation
- Offline mode + sync queue
- Real authentication beyond Replit's
- Real receipt delivery (no Resend, no Telnyx, no printer driver)
- TaxJar (8.25% flat tax hardcoded)
- PIN auth for staff
- Multi-station support, real-time sync
- Customer profiles / purchase history
- Tip allocation across staff
- Date range reporting (Today / All toggle only)
- Cross-vertical aggregated reporting (Suite-side concern)
- Vertical lock at signup (production-only behavior)
- PIN brute-force lockout
- Real refund processing (Stripe Refund API)
- Audit log viewer
- Discount limits per staff role
- Z report with cash drawer reconciliation
- Nail bar vertical (3rd launch trio member, not validated)

---

## localStorage Keys

| Key | Purpose |
|---|---|
| `nuatis-pos:activeVerticalId` | Currently selected vertical (shared across verticals) |
| `nuatis-pos:activeStaffId` | Currently selected staff (shared across verticals) |
| `nuatis-pos:salon:cart` | Salon active cart |
| `nuatis-pos:salon:transactions` | Salon transaction log (last 10) |
| `nuatis-pos:salon:heldTickets` | Salon held tickets (cap 5) |
| `nuatis-pos:spa:cart` | Spa active cart |
| `nuatis-pos:spa:transactions` | Spa transaction log (last 10) |
| `nuatis-pos:spa:heldTickets` | Spa held tickets (cap 5) |

Legacy unprefixed keys (`nuatis-pos:cart`, `nuatis-pos:transactions`, `nuatis-pos:heldTickets`) are migrated to `nuatis-pos:salon:*` on first boot and then deleted.

---

## Hardcoded Mock Data

- **2 verticals** — Salon and Spa, each with 12 services and service-specific modifiers (`lib/verticals.ts`)
- **Salon business** — "Nuatis POS Demo Salon · 123 Main St, Austin, TX 78701 · (512) 555-0100"
- **Spa business** — "Nuatis POS Demo Spa · 456 Wellness Ave, Austin, TX 78704 · (512) 555-0200"
- **Salon services** (`lib/services.ts`) — Women's Cut, Men's Cut, Beard Trim, Kids Cut, Highlights Full, Color Root, Gloss, Olaplex Treatment, Deep Conditioning, Wax, Blowout, Polish Change
- **Spa services** (`lib/verticals.ts`) — Swedish Massage, Deep Tissue Massage, Hot Stone Massage, Prenatal Massage, Classic Facial, Anti-Aging Facial, Hydrating Facial, Body Scrub, Detox Body Wrap, Aromatherapy Wrap, Foot Reflexology, Sauna Session
- **3 staff shared across verticals** (`lib/staff.ts`) — Maria / Stylist, James / Colorist, Lisa / Stylist
- **6 customers shared across verticals** (`lib/customers.ts`) — Sarah Chen, Marcus Rodriguez, Priya Patel, David Kim, Emma Thompson, Jordan Williams
- **Service-specific modifiers** — Salon: Women's Cut, Men's Cut, Highlights Full, Color Root, Gloss. Spa: Swedish Massage, Deep Tissue, Hot Stone, Classic Facial, Anti-Aging Facial
- **Mock card** — "Card • Visa •••• 4242" on every receipt
- **Manager PIN** — ANY 4 digits accepted (mock validation — no real PIN check)

---

## Running Locally

```bash
pnpm install
pnpm --filter @workspace/nuatis-pos run dev
```

Open the Replit-provided URL. Replit Auth gates the app — log in with any Replit account.

---

## Batch History

| Batch | Summary |
|---|---|
| Batch 1 | Auth + register grid |
| Batch 2 | Cart + tax + persistence |
| Batch 3 | Tip + simulated card reader |
| Batch 4 | Receipt + mock delivery |
| Batch 5 | Customer attach + staff attribution |
| Batch 6 | Today's Sales overlay |
| Batch 7 | Modifiers + Hold/Resume |
| Batch 8 | README + cleanup + tag v0.0.1-prototype |
| Batch 9 | Discount + comp |
| Batch 10 | Manager PIN + refund |
| Batch 11 | Spa vertical + multi-vertical engine |
| Batch 12 | Final docs + tag v0.0.2-prototype |

---

## When Production Build Starts

- Read the three Master Plan documents (PRD, MVP, Build Checklist).
- Ignore this code.
- Take only the visual decisions and flow patterns documented in screenshots/notes from prototype day.
