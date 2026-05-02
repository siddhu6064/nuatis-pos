# Nuatis POS — Replit Agent Prototype

> **THROWAWAY UX PROTOTYPE — DO NOT USE AS BASIS FOR PRODUCTION**
>
> Built in one day on Replit Agent (May 2, 2026) for UX validation only. Code quality is exploratory. Architecture is intentionally wrong. Production POS build follows the separate Master Plan documents (PRD / MVP / Build Checklist) and starts post-Suite-ship (Aug 2026+).

---

## What This Is

- A tablet-portrait multi-vertical point-of-sale UX prototype (salon + spa + nail bar — full launch trio).
- Single-page React app simulating the operator flow from tile-tap to mock checkout to mock receipt.
- Includes a first-pass owner Settings UX: business identity, tax rate, tip presets, and staff CRUD — all per-vertical.
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
- Nail bar vertical (3rd launch trio member) — engine generalised with 2-file change only
- Owner Settings overlay — business identity edit, tax rate edit, tip preset CRUD, staff CRUD
- Per-vertical settings scoping — edits in one vertical don't affect others
- Settings layer overrides config defaults dynamically (Receipt, tax math, tip presets, staff list all read from settings hook, not constants)
- Engine generalisation pattern — adding a 4th vertical requires only adding to VERTICALS registry + extending VerticalId type

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
| Settings | Database-backed settings table per tenant | localStorage per-vertical override layer |

These deviations are intentional. The prototype was built to answer UX questions, not architecture questions. Production answers all the architecture questions and ignores this code entirely.

---

## What Is NOT In This Prototype (By Design)

- Stripe Terminal hardware integration
- Multi-tenant isolation
- Offline mode + sync queue
- Real authentication beyond Replit's
- Real receipt delivery (no Resend, no Telnyx, no printer driver)
- TaxJar location-based tax (rate is user-configurable in Settings but still a flat manual entry, not location-computed)
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
- Service / modifier editing from Settings (services are config-locked for prototype)
- Receipt logo upload
- Multi-currency, locale, language picker
- Business hours / holidays config
- PIN gate on Settings (production gates with role check)
- Settings backend / API persistence

---

## localStorage Keys

| Key | Purpose |
|---|---|
| `nuatis-pos:activeVerticalId` | Currently selected vertical (shared across verticals) |
| `nuatis-pos:activeStaffId` | Currently selected staff (shared across verticals) |
| `nuatis-pos:salon:cart` | Salon active cart |
| `nuatis-pos:salon:transactions` | Salon transaction log (last 10) |
| `nuatis-pos:salon:heldTickets` | Salon held tickets (cap 5) |
| `nuatis-pos:salon:settings` | Salon settings overrides |
| `nuatis-pos:spa:cart` | Spa active cart |
| `nuatis-pos:spa:transactions` | Spa transaction log (last 10) |
| `nuatis-pos:spa:heldTickets` | Spa held tickets (cap 5) |
| `nuatis-pos:spa:settings` | Spa settings overrides |
| `nuatis-pos:nail_bar:cart` | Nail Bar active cart |
| `nuatis-pos:nail_bar:transactions` | Nail Bar transaction log (last 10) |
| `nuatis-pos:nail_bar:heldTickets` | Nail Bar held tickets (cap 5) |
| `nuatis-pos:nail_bar:settings` | Nail Bar settings overrides |

**Total: 14 keys** (2 shared + 4 per vertical × 3 verticals).

Settings keys are write-on-edit only — if a vertical's settings have never been changed, the key does not exist and `getVerticalSettings()` returns defaults from `lib/verticals.ts` at runtime.

Legacy unprefixed keys (`nuatis-pos:cart`, `nuatis-pos:transactions`, `nuatis-pos:heldTickets`) are migrated to `nuatis-pos:salon:*` on first boot and then deleted.

---

## Hardcoded Mock Data

- **3 verticals** — Salon, Spa, and Nail Bar (full launch trio), each with 12 services and service-specific modifiers (`lib/verticals.ts`)
- **Salon business** — "Nuatis POS Demo Salon · 123 Main St, Austin, TX 78701 · (512) 555-0100" — **editable via Settings**
- **Spa business** — "Nuatis POS Demo Spa · 456 Wellness Ave, Austin, TX 78704 · (512) 555-0200" — **editable via Settings**
- **Nail Bar business** — "Nuatis POS Demo Nail Bar · 789 Polish Lane, Austin, TX 78702 · (512) 555-0300" — **editable via Settings**
- **Salon services** (`lib/services.ts`) — Women's Cut, Men's Cut, Beard Trim, Kids Cut, Highlights Full, Color Root, Gloss, Olaplex Treatment, Deep Conditioning, Wax, Blowout, Polish Change
- **Spa services** (`lib/verticals.ts`) — Swedish Massage, Deep Tissue Massage, Hot Stone Massage, Prenatal Massage, Classic Facial, Anti-Aging Facial, Hydrating Facial, Body Scrub, Detox Body Wrap, Aromatherapy Wrap, Foot Reflexology, Sauna Session
- **Nail Bar services** (`lib/verticals.ts`) — Basic Manicure, Gel Manicure, French Manicure, Polish Change, Basic Pedicure, Gel Pedicure, Spa Pedicure, Acrylic Full Set, Acrylic Fill, Dip Powder, Nail Art (Simple), Paraffin Wax Treatment
- **3 staff shared across verticals** (`lib/staff.ts`) — Maria / Stylist, James / Colorist, Lisa / Stylist — **staff list is now editable per-vertical via Settings** (add / deactivate / delete)
- **6 customers shared across verticals** (`lib/customers.ts`) — Sarah Chen, Marcus Rodriguez, Priya Patel, David Kim, Emma Thompson, Jordan Williams
- **Service-specific modifiers** — Salon: Women's Cut, Men's Cut, Highlights Full, Color Root, Gloss. Spa: Swedish Massage, Deep Tissue, Hot Stone, Classic Facial, Anti-Aging Facial. Nail Bar: Basic Mani, Gel Mani, Basic Pedi, Gel Pedi, Acrylic Full Set, Dip Powder
- **Default tax rate** — 8.25% flat (configurable per-vertical via Settings; TaxJar not integrated)
- **Default tip presets** — 15%, 18%, 20%, 25% (configurable per-vertical via Settings)
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
| Batch 13 | Nail Bar vertical (launch trio complete; 2-file change) |
| Batch 14 | Owner Settings overlay (business + tax + tips + staff, per-vertical) |
| Batch 15 | Final wrap (README + replit.md + tag v0.0.3-prototype) |

---

## When Production Build Starts

- Read the three Master Plan documents (PRD, MVP, Build Checklist).
- Ignore this code.
- Take only the visual decisions and flow patterns documented in screenshots/notes from prototype day.
