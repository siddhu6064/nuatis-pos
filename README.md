# Nuatis POS — Replit Agent Prototype

> **THROWAWAY UX PROTOTYPE — DO NOT USE AS BASIS FOR PRODUCTION**
>
> Built in one day on Replit Agent (May 2, 2026) for UX validation only. Code quality is exploratory. Architecture is intentionally wrong. Production POS build follows the separate Master Plan documents (PRD / MVP / Build Checklist) and starts post-Suite-ship (Aug 2026+).
>
> **Prototype version: v4 (through Batch 20 · tag v0.0.5-prototype)**

---

## What This Is

- A tablet-portrait multi-vertical point-of-sale UX prototype (salon + spa + nail bar + tattoo — launch trio plus first wrinkle-vertical).
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
- Walk-in queue (pre-cart customer state, FIFO cap-10, promote-to-ticket hydrates customer + optional service line)
- Cash payment with change calculator (right-to-left cents fill, quick-tender row, mock cash drawer toast)
- Appointment-aware register (Upcoming/History tabs, scheduled/started/no_show status with undo, tap-to-hydrate)
- Deposit pattern on tattoo vertical (two-phase transactions, deposit + balance, totalPaid revenue math, deposit transactions excluded from per-staff but counted in payment mix)
- Split tender card + cash (single transaction, payments[] array, internal modal state machine, payment mix routes card/cash legs independently)

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

## Transaction Record Shape

All transactions are stored in `nuatis-pos:{verticalId}:transactions` (capped at 50). The shape as of B20:

```typescript
interface Transaction {
  id: string;
  lineItems: CartLine[];
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;                         // pre-deposit, pre-split gross
  paymentMethod: "card" | "cash" | "split";
  // Single-method cash only:
  amountTendered?: number;
  changeGiven?: number;
  // Split-tender only (paymentMethod === 'split'):
  payments?: SplitPayment[];                  // in order of settlement
  completedAt: string;                        // ISO 8601
  customer: CartCustomer | null;
  receiptDelivery?: "print" | "email" | "sms" | "none";
  receiptDestination?: string;
  compApplied: boolean;
  compReason: string | null;
  refunds?: RefundRecord[];
  refundedTotalCents?: number;
  // B19 extensions:
  type?: "service" | "deposit";              // default "service" on legacy reads
  depositApplied?: number;                   // cents credited from prior deposit tx
  appointmentRef?: string;                   // links to Appointment.id
  totalPaid?: number;                        // actual revenue: totalCents − depositApplied
  depositBalanceDueCents?: number;           // deposit tx only: servicePriceCents − depositAmountCents
}

interface SplitPayment {
  method: "card" | "cash";
  amountCents: number;
  processedAt: number;                       // Date.now() at the moment this leg settled
  // Cash leg only:
  tenderedCents?: number;
  changeCents?: number;
}
```

**Revenue truth**: `transaction.totalPaid` (not `totalCents`) is the authoritative revenue figure. For split transactions, `totalPaid = sum(payments[].amountCents)` — change given to the customer is excluded. For deposit transactions (`type === 'deposit'`), `totalPaid` is the deposit amount. Per-staff revenue iterates `type === 'service'` line revenue only; deposit transactions are excluded from per-staff breakdown.

**Backward compatibility**: legacy records from B1–B16 have no `payments`, `type`, `depositApplied`, or `totalPaid` fields. All reads use safe defaults (`?? "card"`, `?? 0`, `?? []`). Existing records never crash.

---

## localStorage Keys

| Key | Purpose |
|---|---|
| `nuatis-pos:activeVerticalId` | Currently selected vertical (shared across verticals) |
| `nuatis-pos:activeStaffId` | Currently selected staff (shared across verticals) |
| `nuatis-pos:salon:cart` | Salon active cart |
| `nuatis-pos:salon:transactions` | Salon transaction log (last 50) |
| `nuatis-pos:salon:heldTickets` | Salon held tickets (cap 5) |
| `nuatis-pos:salon:settings` | Salon settings overrides |
| `nuatis-pos:salon:waitlist` | Salon walk-in queue (cap 10) |
| `nuatis-pos:salon:appointments` | Salon appointments (seeded on first load) |
| `nuatis-pos:salon:cartMeta` | Salon deposit context (appointmentRef + depositApplied) |
| `nuatis-pos:spa:cart` | Spa active cart |
| `nuatis-pos:spa:transactions` | Spa transaction log (last 50) |
| `nuatis-pos:spa:heldTickets` | Spa held tickets (cap 5) |
| `nuatis-pos:spa:settings` | Spa settings overrides |
| `nuatis-pos:spa:waitlist` | Spa walk-in queue (cap 10) |
| `nuatis-pos:spa:appointments` | Spa appointments (seeded on first load) |
| `nuatis-pos:spa:cartMeta` | Spa deposit context |
| `nuatis-pos:nail_bar:cart` | Nail Bar active cart |
| `nuatis-pos:nail_bar:transactions` | Nail Bar transaction log (last 50) |
| `nuatis-pos:nail_bar:heldTickets` | Nail Bar held tickets (cap 5) |
| `nuatis-pos:nail_bar:settings` | Nail Bar settings overrides |
| `nuatis-pos:nail_bar:waitlist` | Nail Bar walk-in queue (cap 10) |
| `nuatis-pos:nail_bar:appointments` | Nail Bar appointments (seeded on first load) |
| `nuatis-pos:nail_bar:cartMeta` | Nail Bar deposit context |
| `nuatis-pos:tattoo:cart` | Tattoo active cart |
| `nuatis-pos:tattoo:transactions` | Tattoo transaction log (last 50) |
| `nuatis-pos:tattoo:heldTickets` | Tattoo held tickets (cap 5) |
| `nuatis-pos:tattoo:settings` | Tattoo settings overrides |
| `nuatis-pos:tattoo:waitlist` | Tattoo walk-in queue (cap 10) |
| `nuatis-pos:tattoo:appointments` | Tattoo appointments with deposit fields (seeded on first load) |
| `nuatis-pos:tattoo:cartMeta` | Tattoo deposit context (primary use case for cartMeta) |

**Total: 30 keys** (2 shared + 7 per-vertical × 4 verticals).

Settings and cartMeta keys are write-on-edit only — if a vertical's settings have never been changed, the key does not exist and `getVerticalSettings()` returns defaults from `lib/verticals.ts` at runtime. cartMeta is written when an appointment with a deposit is loaded to the register and cleared on checkout completion.

Legacy unprefixed keys (`nuatis-pos:cart`, `nuatis-pos:transactions`, `nuatis-pos:heldTickets`) are migrated to `nuatis-pos:salon:*` on first boot and then deleted.

---

## Hardcoded Mock Data

- **4 verticals** — Salon, Spa, Nail Bar, and Tattoo. The launch trio (salon, spa, nail_bar) are uniform-service verticals. Tattoo is the first wrinkle-vertical, carrying the deposit pattern to validate two-phase transaction flows beyond what a uniform service catalog requires.
- **Salon business** — "Nuatis POS Demo Salon · 123 Main St, Austin, TX 78701 · (512) 555-0100" — **editable via Settings**
- **Spa business** — "Nuatis POS Demo Spa · 456 Wellness Ave, Austin, TX 78704 · (512) 555-0200" — **editable via Settings**
- **Nail Bar business** — "Nuatis POS Demo Nail Bar · 789 Polish Lane, Austin, TX 78702 · (512) 555-0300" — **editable via Settings**
- **Tattoo business** — "Nuatis POS Demo Tattoo · 321 Ink Blvd, Austin, TX 78703 · (512) 555-0400" — **editable via Settings**
- **Salon services** (`lib/services.ts`) — Women's Cut, Men's Cut, Beard Trim, Kids Cut, Highlights Full, Color Root, Gloss, Olaplex Treatment, Deep Conditioning, Wax, Blowout, Polish Change
- **Spa services** (`lib/verticals.ts`) — Swedish Massage, Deep Tissue Massage, Hot Stone Massage, Prenatal Massage, Classic Facial, Anti-Aging Facial, Hydrating Facial, Body Scrub, Detox Body Wrap, Aromatherapy Wrap, Foot Reflexology, Sauna Session
- **Nail Bar services** (`lib/verticals.ts`) — Basic Manicure, Gel Manicure, French Manicure, Polish Change, Basic Pedicure, Gel Pedicure, Spa Pedicure, Acrylic Full Set, Acrylic Fill, Dip Powder, Nail Art (Simple), Paraffin Wax Treatment
- **Tattoo services** (`lib/tattoo-services.ts`) — 12 services including flash tattoo, small/medium/large custom, fine line, lettering, color fill, blackwork, cover-up, black & grey shading, touch-up, consultation
- **3 staff shared across verticals** (`lib/staff.ts`) — Maria / Stylist, James / Colorist, Lisa / Stylist — **staff list is now editable per-vertical via Settings** (add / deactivate / delete)
- **6 customers shared across verticals** (`lib/customers.ts`) — Sarah Chen, Marcus Rodriguez, Priya Patel, David Kim, Emma Thompson, Jordan Williams
- **6 appointments per vertical** (`lib/appointments.ts`) — seeded on first load for each vertical; tattoo appointments include deposit fields (`depositRequired`, `depositAmountCents`, `depositStatus`) on 4 of 6 entries
- **Service-specific modifiers** — Salon: Women's Cut, Men's Cut, Highlights Full, Color Root, Gloss. Spa: Swedish Massage, Deep Tissue, Hot Stone, Classic Facial, Anti-Aging Facial. Nail Bar: Basic Mani, Gel Mani, Basic Pedi, Gel Pedi, Acrylic Full Set, Dip Powder. Tattoo: Custom/Large work modifiers for size/complexity
- **Default tax rate** — 8.25% flat (configurable per-vertical via Settings; TaxJar not integrated)
- **Default tip presets** — 15%, 18%, 20%, 25% (configurable per-vertical via Settings)
- **Mock card** — "Card · Visa •••• 4242" on every card or split-card payment
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
| Batch 16 | Walk-in queue (FIFO cap-10, per-vertical, promote-to-ticket) |
| Batch 17 | Cash payment with change calculator (right-to-left keypad, quick-tender row, cash drawer toast) |
| Batch 18 | Appointment-aware register (Upcoming/History tabs, status state machine, tap-to-hydrate) |
| Batch 19 | Tattoo vertical (4th vertical) + deposit pattern (two-phase transactions, totalPaid revenue truth) |
| Batch 20 | Split tender card + cash (SplitTenderModal state machine, payments[] on Transaction, split-aware payment mix) |
| Batch 21 | Docs wrap (README + replit.md v4 + tag v0.0.5-prototype) |

---

## When Production Build Starts

- Read the three Master Plan documents (PRD, MVP, Build Checklist).
- Ignore this code.
- Take only the visual decisions and flow patterns documented in screenshots/notes from prototype day.
