# Nuatis POS — Replit Agent Prototype

> **THROWAWAY UX PROTOTYPE — DO NOT USE AS BASIS FOR PRODUCTION**
>
> Built in one day on Replit Agent (May 2, 2026) for UX validation only. Code quality is exploratory. Architecture is intentionally wrong. Production POS build follows the separate Master Plan documents (PRD / MVP / Build Checklist) and starts post-Suite-ship (Aug 2026+).
>
> **Prototype version: v6 (through Batch 27 · tag v0.0.9-prototype)**

---

## What This Is

- A tablet-portrait multi-vertical point-of-sale UX prototype (salon, spa, nail bar, tattoo, pet grooming, tanning, laundry — all seven planned launch verticals).
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
- Engine generalisation pattern — adding a new vertical requires only adding to VERTICALS registry + extending VerticalId type
- Walk-in queue (pre-cart customer state, FIFO cap-10, promote-to-ticket hydrates customer + optional service line)
- Cash payment with change calculator (right-to-left cents fill, quick-tender row, mock cash drawer toast)
- Appointment-aware register (Upcoming/History tabs, scheduled/started/no_show status with undo, tap-to-hydrate)
- **Tattoo vertical (4th) — money-shape wrinkle**: two-phase deposit + balance transactions, `totalPaid` revenue truth, deposit transactions excluded from per-staff but counted in payment mix, DEP REQ / DEP PAID appointment badges
- **Split tender**: up to 5 legs in any combination of card and cash, sequential state machine, running ledger with per-leg last4, mock-void disclaimer on cancel when card legs are captured
- **Pet grooming vertical (5th) — state-shape wrinkle**: vaccination gate blocks checkout on missing records, warning path on expiring records (within 30 days), manager PIN override unlocks blocked gate, line-level `vaccinationOverride` field on CartLine
- **Tanning vertical (6th) — duration-shape wrinkle**: session-based service lines (minutes, beds), elapsed-tick counter on active cart line, 6-bed layout with occupancy tracking
- **Shift-state envelope**: per-vertical open-shift concept distinct from device session and operator identity; Start Shift / End Shift modals; Charge gated when no shift open; EndShiftModal summary with refund-adjusted gross, payment mix, and transaction count; shift pill in header shows elapsed duration; `shiftId` stamped on every transaction
- **Laundry vertical (7th) — drop-off/pickup lifecycle**: customer-required drop-off flow, sequential per-vertical tag counter (LAUN-0001 format), DropOffSuccessOverlay with prominent tag display, open tickets persist across days, mock-SMS "ready" notification, pickup hydrates cart and routes through standard checkout, `openTicketId` on pickup transaction; 5-way overlay mutex now includes Open Tickets

---

## Wrinkle Category Framework

The engine generalises beyond uniform service catalogs. Three wrinkle categories have been validated:

- **money-shape** (tattoo): services that require a deposit before the appointment, producing two separate transaction records linked by `appointmentRef`. Revenue truth lives in `totalPaid`, not `totalCents`. Deposit transactions are excluded from per-staff revenue but included in the payment-mix totals.
- **state-shape** (pet grooming): services gated by an external compliance record (vaccination status). The gate has three paths — `clear` (proceed normally), `warning` (within-30-day expiry, advisory only), `blocked` (expired or missing, requires manager PIN override to unlock). The override is recorded as a line-level `vaccinationOverride` flag on `CartLine`.
- **duration-shape** (tanning): services defined by duration (minutes) rather than a fixed service category. The register shows an elapsed-tick counter on active session lines. Bed occupancy is tracked across the grid.

### Ticket-Lifecycle Axis

The wrinkle categories above describe service-line behavior within a single operator interaction. The ticket-lifecycle axis is orthogonal — it describes when a ticket opens, how it persists across visits, and when it closes.

`VerticalConfig` carries a `workflow` flag: `"same_visit"` (default) or `"drop_off"`.

- **same_visit** (all six prior verticals): ticket opens when the first item is added to the cart, all services are rendered and paid before the operator interaction ends, and the ticket closes at checkout. The ticket never persists beyond the current session.
- **drop_off** (laundry): ticket is created without payment at drop-off, receives a sequential tag number (LAUN-0001 format), persists in localStorage as an open ticket across days and page reloads, transitions to READY when the operator marks it ready (triggering a mock-SMS notification), and closes when the customer returns to pick up and pay through standard checkout. The pickup transaction carries `openTicketId` linking back to the original drop-off record.

The lifecycle axis is separate from the money-shape axis: drop-off deposits are intentionally out of scope for this prototype. Production would likely combine both (drop-off + deposit) for some verticals; the prototype keeps the two axes independent for clarity.

---

## Payment Shapes

- **Card**: single-leg, 2-second simulated reader, mock Visa.
- **Cash**: `CashTenderModal` — right-to-left cents keypad, quick-tender row (Exact + round-up suggestions), live change-due display, mock cash drawer toast.
- **Split tender**: `SplitTenderModal` — sequential N-leg state machine (up to 5 legs). Each leg is independently either card (simulated reader inside modal, generates a unique 4-digit mock last4 per leg) or cash (full cash sub-flow with change calculator). A running ledger shows all captured legs during composition. On cancel after any card leg is captured, a void-disclaimer overlay lists each captured card leg with its amount and last4, and notes that a production implementation would call the Stripe Terminal void API to reverse them.

---

## Shift State

Each vertical maintains its own open-shift envelope, distinct from the Replit device session and from operator (active staff) identity.

- **StartShiftModal**: operator selects active staff and enters a starting cash float via the same `appendCashDigit` / `backspaceCashDigit` / `appendDoubleCashZero` helpers used by `CashTenderModal`. Shift record written to `nuatis-pos:{v}:currentShift` and appended to `nuatis-pos:{v}:shifts` log. `shiftId` generated at open time and stamped on every subsequent transaction in that vertical.
- **Header shift pill**: shows elapsed duration when a shift is open; shows a "No shift open" state otherwise. Duration display rides existing `useClock` re-renders as a pragmatic prototype shortcut (see Stack Deviations).
- **Charge gating**: the Charge button is disabled and shows a tooltip when no shift is open for the active vertical. Operators must open a shift before accepting payment.
- **EndShiftModal**: displays a shift summary — refund-adjusted gross revenue, payment mix (Card / Cash / Split breakdown), and transaction count for the shift. Operator confirms to close; `currentShift` key is cleared and the closed record is written to `shifts` log.

Shift state is per-vertical. Switching verticals shows that vertical's own shift state. Opening or closing a shift in one vertical has no effect on other verticals.

---

## Drop-Off / Pickup Workflow

The laundry vertical demonstrates the drop-off ticket-lifecycle shape:

1. **Drop-off**: operator adds services to the cart and taps "Drop Off" (the Charge button label changes based on `workflow === 'drop_off'`). A customer must be attached — the drop-off is blocked without one. A sequential tag counter increments per vertical (LAUN-0001, LAUN-0002, …) and is persisted to `nuatis-pos:{v}:tagCounter`.
2. **DropOffSuccessOverlay**: shown on successful drop-off. Displays the tag number prominently and a summary of the services. The ticket is written to `nuatis-pos:{v}:openTickets` with status `IN_PROGRESS`.
3. **Open Tickets overlay** ("Open: N" pill in header): lists all open tickets for the current vertical. Tickets show `IN_PROGRESS` (amber badge) or `READY` (green badge). Operator can tap "Mark Ready" to transition status — this fires a mock-SMS toast to the customer's phone number.
4. **Pickup**: operator taps "Pick Up" on a READY ticket in the overlay. The cart is hydrated with the original services and the customer. A banner indicates pickup mode and includes a "Return to In Progress" button. Checkout proceeds through the standard flow; the completed transaction carries `openTicketId` linking to the original open-ticket record. The open ticket is moved to `nuatis-pos:{v}:closedTickets` on successful pickup.

Tag numbers are sequential per vertical and persist across page reloads via the `tagCounter` localStorage key. In this prototype, the tag prefix (`LAUN-`) is hardcoded to laundry; production would read the prefix from per-vertical config.

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

**setInterval invariant**: the codebase contains exactly **one** `setInterval`, located in `hooks/useElapsedTick.ts` (drives the tanning session elapsed-tick counter). `Header`'s `useClock` was migrated from `setInterval` to `setTimeout`-recursion in Batch 23 to preserve this invariant. All other timers in the codebase use `setTimeout` only.

**Shift pill duration display**: the elapsed-duration display on the shift pill in the header rides `useClock`'s re-renders rather than computing duration independently. This is a pragmatic prototype shortcut — the shift pill updates whenever the clock ticks, not on its own timer. Production should compute shift duration purely from `shift.startedAt` on each render without depending on upstream re-renders.

---

## What Is NOT In This Prototype (By Design)

- Cross-vertical aggregated reporting (Suite-side concern)
- Z-tape / cash drawer reconciliation
- Scheduled tab on walk-in waitlist
- Real backend / real Stripe Terminal / real Supabase Auth
- File uploads (receipt logo, vaccination record PDF)
- Offline mode + sync queue
- Customer-facing display
- Multi-station real-time sync
- PIN auth for staff
- Multi-tenant isolation
- TaxJar location-based tax (rate is user-configurable in Settings but still a flat manual entry)
- Date range reporting (Today / All toggle only)
- Real receipt delivery (no Resend, no Telnyx, no printer driver)
- Audit log viewer
- Discount limits per staff role
- Service / modifier editing from Settings (services are config-locked for prototype)
- Multi-currency, locale, language picker
- Business hours / holidays config
- PIN gate on Settings (production gates with role check)
- Settings backend / API persistence
- Per-leg refund attribution on multi-card split transactions (simple-default: full refund deducted from Card bucket)
- **Shift history viewer** (no past-shift log browser; shifts are stored in localStorage but not surfaced in a dedicated UI)
- **Reports overlay extensions** — per-subcategory, per-vertical, per-status, and any other breakdown axis are declined for this prototype; the Reports surface is validated as a container but content extension is out of scope
- **Decorative animations** on existing mock affordances (e.g. tile tap ripple, cart slide-in motion)
- **Tag printing** — LAUN-XXXX tag number is displayed on-screen only; no label printer integration
- **Real SMS** — "Mark Ready" fires a mock toast only; no Telnyx or Twilio call
- **Multi-day age indicators** on open tickets (open ticket persists but no "aging" or overdue badge)
- **Storage fee logic** for long-stay drop-offs
- **Commercial / B2B account aging** (net-terms billing is a Suite-side concern)
- **Per-pound weight input** for laundry pricing (covered by the duration-shape pattern from tanning; not exercised in laundry prototype)
- **Photo capture at drop-off** (no camera integration)
- **Special handling flags** on open tickets (e.g. delicate / hand-wash)
- **Additional Tier 4 verticals** beyond laundry (tailoring, alterations, shoe repair, dry cleaning are noted as candidates but not built)

---

## Transaction Record Shape

All transactions are stored in `nuatis-pos:{verticalId}:transactions` (capped at 50). The shape as of B27:

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
  payments?: SplitPayment[];                  // in order of settlement, up to 5 legs
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
  // B26 extensions:
  shiftId?: string;                          // open shift at time of checkout; absent on pre-shift transactions
  // B27 extensions:
  openTicketId?: string;                     // laundry pickup only: links back to the originating open-ticket record
}

interface SplitPayment {
  method: "card" | "cash";
  amountCents: number;
  processedAt: number;                       // Date.now() at the moment this leg settled
  // Card leg only (B24):
  mockLast4?: string;                        // 4-digit string, generated once at capture time
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
| `nuatis-pos:{v}:cart` | Active cart for vertical `v` |
| `nuatis-pos:{v}:transactions` | Transaction log for vertical `v` (last 50) |
| `nuatis-pos:{v}:heldTickets` | Held tickets for vertical `v` (cap 5) |
| `nuatis-pos:{v}:settings` | Settings overrides for vertical `v` (write-on-edit only) |
| `nuatis-pos:{v}:waitlist` | Walk-in queue for vertical `v` (cap 10) |
| `nuatis-pos:{v}:appointments` | Appointments for vertical `v` (seeded on first load) |
| `nuatis-pos:{v}:cartMeta` | Deposit context for vertical `v` (appointmentRef + depositApplied; write-on-edit only) |
| `nuatis-pos:{v}:currentShift` | Currently open shift for vertical `v` (B26; absent when no shift open) |
| `nuatis-pos:{v}:shifts` | Closed shift log for vertical `v` (B26) |
| `nuatis-pos:{v}:openTickets` | Open drop-off tickets for vertical `v` (B27; laundry exercises this) |
| `nuatis-pos:{v}:closedTickets` | Closed/picked-up ticket log for vertical `v` (B27; laundry exercises this) |
| `nuatis-pos:{v}:tagCounter` | Sequential tag counter for vertical `v` (B27; laundry exercises this) |

**Total: ~68 keys** at maximum (2 shared + 9 per-vertical × 7 verticals = 65, plus up to 3 laundry-only keys when the laundry vertical has been exercised). Write-on-edit-only keys (settings, cartMeta, currentShift) do not exist until first use, so the practical minimum across a fresh 7-vertical session is lower.

The pattern `nuatis-pos:{verticalId}:{key}` scales to any number of verticals by registry addition only. The openTickets / closedTickets / tagCounter helpers are parameterized by verticalId in `lib/openTickets.ts` but only the laundry vertical exercises them in this prototype.

Legacy unprefixed keys (`nuatis-pos:cart`, `nuatis-pos:transactions`, `nuatis-pos:heldTickets`) are migrated to `nuatis-pos:salon:*` on first boot and then deleted.

---

## Hardcoded Mock Data

- **7 verticals** — Salon, Spa, Nail Bar, Tattoo, Pet Grooming, Tanning, Laundry.
  - Launch trio (salon, spa, nail_bar): uniform-service verticals.
  - Tattoo: money-shape wrinkle (deposit + balance two-phase transactions).
  - Pet Grooming: state-shape wrinkle (vaccination gate with blocked/warning/clear paths).
  - Tanning: duration-shape wrinkle (session-based service lines, elapsed-tick counter, bed occupancy).
  - Laundry: drop-off lifecycle (tag counter, open tickets, mark-ready/pickup flow).
- **Salon business** — "Nuatis POS Demo Salon · 123 Main St, Austin, TX 78701 · (512) 555-0100" — **editable via Settings**
- **Spa business** — "Nuatis POS Demo Spa · 456 Wellness Ave, Austin, TX 78704 · (512) 555-0200" — **editable via Settings**
- **Nail Bar business** — "Nuatis POS Demo Nail Bar · 789 Polish Lane, Austin, TX 78702 · (512) 555-0300" — **editable via Settings**
- **Tattoo business** — "Nuatis POS Demo Tattoo · 321 Ink Blvd, Austin, TX 78703 · (512) 555-0400" — **editable via Settings**
- **Pet Grooming business** — "Nuatis POS Demo Pet Grooming · 555 Paw Lane, Austin, TX 78705 · (512) 555-0500" — **editable via Settings**
- **Tanning business** — "Nuatis POS Demo Tanning · 888 Sun Blvd, Austin, TX 78706 · (512) 555-0600" — **editable via Settings**
- **Laundry business** — "Nuatis POS Demo Laundry · 999 Wash Ave, Austin, TX 78707 · (512) 555-0700" — **editable via Settings**
- **Salon services** (`lib/services.ts`) — Women's Cut, Men's Cut, Beard Trim, Kids Cut, Highlights Full, Color Root, Gloss, Olaplex Treatment, Deep Conditioning, Wax, Blowout, Polish Change
- **Spa services** — Swedish Massage, Deep Tissue Massage, Hot Stone Massage, Prenatal Massage, Classic Facial, Anti-Aging Facial, Hydrating Facial, Body Scrub, Detox Body Wrap, Aromatherapy Wrap, Foot Reflexology, Sauna Session
- **Nail Bar services** — Basic Manicure, Gel Manicure, French Manicure, Polish Change, Basic Pedicure, Gel Pedicure, Spa Pedicure, Acrylic Full Set, Acrylic Fill, Dip Powder, Nail Art (Simple), Paraffin Wax Treatment
- **Tattoo services** (`lib/tattoo-services.ts`) — 12 services including flash tattoo, small/medium/large custom, fine line, lettering, color fill, blackwork, cover-up, black & grey shading, touch-up, consultation
- **Pet Grooming services** (`lib/pet-grooming-services.ts`) — bath & brush, full groom, nail trim, ear cleaning, teeth brushing, de-shedding, flea bath, puppy first groom, cat groom, senior groom, skin treatment, anal gland expression; vaccination gate applies across all services
- **Tanning services** (`lib/tanning-services.ts`) — 6-bed session-based services with duration (minutes) and bed-type attributes; elapsed-tick counter shown on active cart lines
- **Laundry services** (`lib/laundry-services.ts`) — 12 services in muted blue + bronze palette; workflow flag `drop_off`; customer required for drop-off
- **3 staff shared across verticals** (`lib/staff.ts`) — Maria / Stylist, James / Colorist, Lisa / Stylist — **staff list is now editable per-vertical via Settings** (add / deactivate / delete)
- **Laundry customers** (`lib/laundry-customers.ts`) — dedicated seed customer list for the laundry vertical with phone numbers for mock-SMS "ready" notifications
- **6 customers shared across verticals** (`lib/customers.ts`) — Sarah Chen, Marcus Rodriguez, Priya Patel, David Kim, Emma Thompson, Jordan Williams
- **6 appointments per vertical** (seeded on first load; tattoo appointments include deposit fields; pet grooming appointments include vaccination status fields)
- **Default tax rate** — 8.25% flat (configurable per-vertical via Settings; TaxJar not integrated)
- **Default tip presets** — 15%, 18%, 20%, 25% (configurable per-vertical via Settings)
- **Mock card** — unique 4-digit last4 generated per leg at capture time (e.g. `****2847`) — no longer hardcoded `4242`
- **Manager PIN** — ANY 4 digits accepted (mock validation — no real PIN check)

---

## Screenshots

Intended capture surfaces are listed in [`/screenshots/README.md`](/screenshots/README.md). Actual PNG files are captured manually after prototype review — not committed to the repo by Replit Agent.

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
| B1 | Auth + register grid |
| B2 | Cart + tax + persistence |
| B3 | Tip + simulated card reader |
| B4 | Receipt + mock delivery |
| B5 | Customer attach + staff attribution |
| B6 | Today's Sales overlay |
| B7 | Modifiers + Hold/Resume |
| B8 | README + cleanup + tag v0.0.1-prototype |
| B9 | Discount + comp |
| B10 | Manager PIN + refund |
| B11 | Spa vertical + multi-vertical engine |
| B12 | Final docs + tag v0.0.2-prototype |
| B13 | Nail Bar vertical (launch trio complete; 2-file change) |
| B14 | Owner Settings overlay (business + tax + tips + staff, per-vertical) |
| B15 | Final wrap (README + replit.md + tag v0.0.3-prototype) |
| B16 | Walk-in queue (FIFO cap-10, per-vertical, promote-to-ticket) |
| B17 | Cash payment with change calculator (right-to-left keypad, quick-tender row, cash drawer toast) |
| B18 | Appointment-aware register (Upcoming/History tabs, status state machine, tap-to-hydrate) |
| B19 | Tattoo vertical (4th) + deposit pattern (two-phase transactions, totalPaid revenue truth) |
| B20 | Split tender card + cash (SplitTenderModal state machine, payments[] on Transaction, split-aware payment mix) |
| B21 | Docs wrap (README + replit.md v4 + tag v0.0.5-prototype) |
| B22 | Pet grooming vertical (5th) + vaccination state-shape (blocked/warning/clear, PIN override, vaccinationOverride on CartLine) |
| B23 | Tanning vertical (6th) + duration-shape sessions (useElapsedTick, bed occupancy, Header useClock migrated to setTimeout-recursion) |
| B24 | Multi-leg split tender rewrite (up to 5 legs, any card+cash combo, per-leg mockLast4, void disclaimer with last4 ledger) |
| B25 | Docs wrap (README + replit.md v5 + /screenshots/README.md + tag v0.0.7-prototype) |
| B26 | Shift-state envelope (per-vertical open shift, StartShiftModal + EndShiftModal, Charge gated when no shift, shiftId on Transaction) |
| B27 | Laundry vertical (7th) + drop-off/pickup ticket-lifecycle shape (tag counter, open tickets, DropOffSuccessOverlay, OpenTicketsOverlay, mock-SMS mark-ready, openTicketId on pickup transaction) |

---

## When Production Build Starts

- Read the three Master Plan documents (PRD, MVP, Build Checklist).
- Ignore this code.
- Take only the visual decisions and flow patterns documented in screenshots/notes from prototype day.
