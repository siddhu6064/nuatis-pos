# Nuatis POS — Architecture Overview

> Throwaway UX prototype (May 2, 2026). All state in localStorage. No backend required beyond Replit Auth. See README.md for the full context.
>
> **v6 — through Batch 27 (laundry vertical + drop-off/pickup lifecycle). Tag: v0.0.9-prototype.**

---

## Stack

- **Monorepo tool**: pnpm workspaces
- **Frontend**: React 18 + Vite, TypeScript strict, Tailwind v4
- **Auth**: Replit Auth (OpenID Connect with PKCE) — `lib/replit-auth-web`
- **API**: Express 5 (`artifacts/api-server`) — only used for auth session routes
- **Database**: PostgreSQL + Drizzle ORM (`lib/db`) — only used for Replit Auth sessions
- **Fonts**: Fraunces (brand/prices, serif), Epilogue (UI text, sans), JetBrains Mono (numbers/clock)
- **Accent**: `#E84A00` · Background: `#F8F7F4` · Overlay bg: `#0F0F10`
- **Manager override**: `#7C3AED` (purple) · Discount/comp/refund: `#DC2626` (red)

---

## Monorepo Layout

```
artifacts/
  nuatis-pos/        ← React + Vite frontend (the prototype)
  api-server/        ← Express auth routes only
lib/
  db/                ← Drizzle schema (users, sessions)
  replit-auth-web/   ← useAuth() browser hook
  api-spec/          ← OpenAPI contract (auth endpoints only)
```

---

## Component Tree

```
App.tsx
├── runMigrations()                       — module-level, runs before React renders
├── ActiveVerticalProvider                — active vertical id + config in context
│   └── VerticalSettingsProvider          — per-vertical settings override layer in context
│       └── ManagerOverrideProvider       — promise-based PIN gate in context
│           ├── LoginPage                 — Replit Auth sign-in screen
│           └── RegisterPage              — main wiring of all state
│               ├── Header
│               │   ├── vertical pill     — "Salon ▾" etc., opens VerticalSwitcher
│               │   ├── brand
│               │   ├── "Held: N" pill   — per-vertical held count, gated on idle
│               │   ├── "Waitlist: N"    — opens WaitlistOverlay, gated on idle
│               │   ├── "Appts: N"       — opens AppointmentsOverlay, gated on idle
│               │   ├── "Open: N"        — opens OpenTicketsOverlay (drop-off verticals)
│               │   ├── shift pill        — elapsed duration when shift open; "No shift open" otherwise
│               │   ├── "Today's Sales"  — opens ReportsOverlay, gated on idle
│               │   ├── live clock (useClock — setTimeout-recursion only, no setInterval)
│               │   ├── active staff + Switch — opens StaffSwitcher
│               │   └── Account dropdown — "Settings" + logout
│               ├── StartShiftModal       — active staff selector + starting cash float keypad
│               ├── EndShiftModal         — shift summary (gross, payment mix, tx count) + close confirm
│               ├── ServiceTile  (×12)   — grid from active vertical config
│               ├── Cart                 — useVerticalSettings for taxRatePercent + tipPresets
│               │   ├── customer pill    — opens CustomerSearch / detach
│               │   ├── deposit banner   — shown when appointmentRef + depositApplied > 0
│               │   ├── vaccination gate banner — shown on pet_grooming with blocked/warning status
│               │   ├── drop-off mode label — shown when workflow === 'drop_off'
│               │   ├── pickup mode banner — shown when cart loaded from open ticket; includes "Return to In Progress" button
│               │   ├── CartLine  (×N)   — useVerticalSettings for active staff list
│               │   │   ├── qty controls
│               │   │   ├── staff picker — inline chips from settings.staff (active only)
│               │   │   ├── modifier picker
│               │   │   ├── discount picker — presets 5/10/15/20% + custom; >20% gates PIN
│               │   │   ├── session ticker  — elapsed time display (tanning only, useElapsedTick)
│               │   │   └── vaccination override flag — set when manager PIN unlocks blocked gate
│               │   ├── CompModal        — 6-reason comp picker
│               │   ├── TipPicker        — presets from settings.tipPresets + custom input
│               │   └── Charge / Card / Cash / Split / Drop Off buttons
│               ├── CheckoutOverlay      — full-screen, processing + receipt states
│               │   ├── processing spinner  (card path only; split skips this)
│               │   ├── Receipt          — useVerticalSettings for business identity
│               │   ├── delivery buttons — print / email / sms / none
│               │   └── CustomerSearch (post-sale attach)
│               ├── DropOffSuccessOverlay — tag number prominent display + service summary
│               ├── CashTenderModal      — z-50, right-to-left keypad, quick-tender row
│               ├── SplitTenderModal     — z-50, N-leg sequential state machine (up to 5 legs)
│               │   ├── leg-picker mode  — amount keypad + Card/Cash action buttons
│               │   ├── card-processing  — 2-sec reader sim per leg, per-leg mockLast4 generated
│               │   ├── cash-tendering   — full cash sub-flow (quick-tender + keypad + change)
│               │   └── void-disclaimer  — cancel overlay lists all captured card legs with last4
│               ├── StaffSwitcher        — modal, active staff from settings.staff
│               ├── CustomerSearch       — modal, phone-first search + inline create
│               ├── ReportsOverlay       — reads from active vertical's transaction namespace
│               │   ├── summary view     — 5-stat row + per-staff + list + SPLIT/DEPOSIT badges
│               │   ├── receipt detail   — Receipt (useVerticalSettings for business identity)
│               │   └── RefundPicker     — line checkboxes + live total + 1500ms processing
│               ├── HeldTicketsModal     — per-vertical held ticket list
│               ├── WaitlistOverlay      — FIFO queue, cap 10, AddWalkInModal, promote-to-ticket
│               ├── AppointmentsOverlay  — Upcoming/History tabs, status state machine, TakeDepositModal
│               ├── OpenTicketsOverlay   — IN PROGRESS (amber) + READY (green) tickets; Mark Ready + Pick Up actions; switch-confirmation banner on pickup
│               ├── VerticalSwitcher     — modal, all 7 verticals, gated when cart has items
│               ├── SettingsOverlay      — owner UX; 3 tabs: Business / Tax & Tips / Staff
│               │   ├── Business tab     — name/address/phone inputs + live receipt preview
│               │   ├── Tax & Tips tab   — tax rate input + tip preset CRUD
│               │   └── Staff tab        — staff row CRUD (add/deactivate/delete)
│               ├── PinModal             — 4-box auto-advance, any 4 digits accepted (mock)
│               └── Toast                — fixed top-right, 1500ms auto-dismiss
```

The five overlay surfaces (WaitlistOverlay, AppointmentsOverlay, ReportsOverlay, SettingsOverlay, OpenTicketsOverlay) participate in a **5-way mutex**: only one can be open at a time. Opening any overlay closes any other that is open.

---

## Hooks

| Hook | File | Responsibility |
|---|---|---|
| `useCart` | `hooks/useCart.ts` | Line items, customer, comp state, deposit context (appointmentRef + depositApplied), vaccination gate state, cart mutations, per-vertical localStorage write-through |
| `useCheckout` | `hooks/useCheckout.ts` | Checkout state machine + transaction persistence; handles card, cash, and split-tender paths; `SplitPayment[]` on transaction when `paymentMethod === 'split'`; each card leg carries `mockLast4` |
| `useActiveStaff` | `hooks/useActiveStaff.ts` | Current operator identity, persisted to `nuatis-pos:activeStaffId` (shared) |
| `useManagerOverride` | `hooks/useManagerOverride.ts` | Promise-based PIN gate; `requestManagerOverride(reason)` returns `Promise<boolean>`; mock — any 4 digits accepted |
| `useActiveVertical` | `hooks/useActiveVertical.ts` | Active vertical id + full config; persisted to `nuatis-pos:activeVerticalId`; reloads cart/held on switch |
| `useVerticalSettings` | `hooks/useVerticalSettings.ts` | Per-vertical settings overrides (business identity, tax rate, tip presets, staff); falls back to `lib/verticals.ts` defaults; persists to `nuatis-pos:{verticalId}:settings` |
| `useWaitlist` | `hooks/useWaitlist.ts` | Per-vertical walk-in queue (FIFO, cap 10); persists to `nuatis-pos:{verticalId}:waitlist` |
| `useAppointments` | `hooks/useAppointments.ts` | Per-vertical appointment list; seed-on-first-load; status state machine (scheduled → started / no_show); `takeDeposit(id, txId)` writes depositStatus + txId |
| `useElapsedTick` | `hooks/useElapsedTick.ts` | **Only `setInterval` in the codebase.** Drives the elapsed-time counter on active tanning session cart lines. Cleans up on unmount. |
| `useShift` | `hooks/useShift.ts` | Per-vertical open-shift envelope. Hydrates from `nuatis-pos:{v}:currentShift` on mount. Exposes `openShift(staffId, startingCashCents)`, `closeShift()`, and the current `shift` record. No React provider — used as a direct hook. `shiftId` flows into `useCheckout` for transaction stamping. |
| `useOpenTickets` | `hooks/useOpenTickets.ts` | Per-vertical open-ticket list for drop-off verticals. Reads/writes `nuatis-pos:{v}:openTickets` and `nuatis-pos:{v}:closedTickets`. Exposes `createTicket`, `markReady`, `closeTicket`, and the `openTickets` array. |

---

## setInterval Invariant

The codebase contains exactly **one** `setInterval`, located in `hooks/useElapsedTick.ts`. All other timers use `setTimeout` only.

- `Header`'s `useClock` was originally implemented with `setInterval` and was migrated to a `setTimeout`-recursion pattern in **Batch 23** to preserve this invariant.
- `SplitTenderModal`'s 2-second card-reader simulation uses `setTimeout` only (documented in a comment at the call site).
- Any future timer added to the codebase must use `setTimeout`-recursion or `requestAnimationFrame` — never a bare `setInterval`.
- **Shift pill duration display**: the shift pill's elapsed-duration label rides `useClock`'s re-renders rather than maintaining its own timer. This is a pragmatic prototype shortcut — production should compute duration purely from `shift.startedAt` on each render without depending on upstream re-renders.

---

## State Architecture

- **`useCart`** — owns `lines: CartLine[]`, `customer`, `compApplied`, `compReason`, `appointmentRef`, `depositApplied`. Every mutation immediately writes to `nuatis-pos:{verticalId}:cart`. Deposit context (`appointmentRef` + `depositApplied`) is persisted to `nuatis-pos:{verticalId}:cartMeta` separately — written by `setDepositContext(apptId, depositCents)` when hydrating from an appointment, cleared by `clearDepositContext()` on checkout completion or cart clear. Reloads from new namespace when `activeVerticalId` changes.
- **`useCheckout`** — owns checkout state machine and in-flight/completed transaction. Three `confirmCheckout` paths: `card` (2-sec sim → processing → receipt), `cash` (skips processing → receipt directly), `split` (card already settled in SplitTenderModal → skips processing → receipt directly). Appends to `nuatis-pos:{verticalId}:transactions` (capped at 50) on delivery confirmation. Exports `addTransactionDirect(verticalId, tx)` for deposit transactions written outside the normal checkout flow. Stamps `shiftId` from the current open shift (via `useShift`) onto every transaction record at write time.
- **`useShift`** — per-vertical open-shift state. Reads `nuatis-pos:{v}:currentShift` on mount. `openShift(staffId, startingCashCents)` creates a new `Shift` record with a generated `shiftId`, writes it to `currentShift`, and appends it to `nuatis-pos:{v}:shifts`. `closeShift()` moves the current shift record (with `closedAt` timestamp) to the shifts log and clears `currentShift`. No provider — consumed as a direct hook in `RegisterPage` and `Header`. `shiftId` is passed into `useCheckout` for transaction stamping.
- **`useOpenTickets`** — per-vertical open-ticket state for `workflow === 'drop_off'` verticals. `createTicket(lines, customer, tagNumber)` writes a new open ticket to `nuatis-pos:{v}:openTickets` with status `IN_PROGRESS`. `markReady(ticketId)` transitions status to `READY` and fires the mock-SMS toast. `closeTicket(ticketId, transactionId)` moves the record (with `closedAt` + `transactionId`) to `nuatis-pos:{v}:closedTickets`.
- **`useActiveStaff`** — reads/writes `nuatis-pos:activeStaffId`. Shared across all verticals. Default `STAFF[0]`. `RegisterPage` watches `settings.staff` (active IDs) and falls back to first active staff if the persisted ID is no longer in the active list.
- **`useManagerOverride`** — imperative modal pattern. `requestManagerOverride(reason)` creates a Promise, mounts `PinModal`, resolves `true` on any 4-digit entry, `false` on cancel/ESC. No prop-drilling; available to any descendant via context.
- **`useActiveVertical`** — reads/writes `nuatis-pos:activeVerticalId`. Provides `{ activeVerticalId, setActiveVerticalId, config }` where `config = VERTICALS[activeVerticalId]`. Switching triggers cart reload and held-ticket reload in `RegisterPage`.
- **`useVerticalSettings`** — per-vertical settings overrides via Context, falls back to `lib/verticals.ts` defaults at runtime via `getDefaults(verticalId)`, persists per-vertical to `nuatis-pos:{verticalId}:settings`. Reloads when `activeVerticalId` changes. All update callbacks are stable refs (no re-creation on vertical switch — uses `verticalIdRef` pattern).
- **`useWaitlist`** — per-vertical walk-in queue, cap 10, persisted to `nuatis-pos:{verticalId}:waitlist`. `addEntry` appends; `removeEntry` deletes by id. Promoting a walk-in to the register calls `onStartService(entry)` in `RegisterPage`, which calls `attachCustomer` + `addItem` and then `removeEntry`.
- **`useAppointments`** — per-vertical appointment list, seeded on first load from `lib/appointments.ts` seed functions. `startAppointment(id)` sets status `"started"`. `markNoShow(id)` sets `"no_show"`. `resetStatus(id)` returns to `"scheduled"`. `takeDeposit(id, txId)` sets `depositStatus: "taken"` and `depositTxId: txId`. Deposit transactions are written via `addTransactionDirect` from `TakeDepositModal` before the appointment status is updated.
- **`useElapsedTick`** — drives the elapsed-second counter on active tanning session lines. Uses the codebase's sole `setInterval` (1000ms). Cleans up the interval on unmount.

---

## Architectural Axes Validated

The following distinct design axes have been exercised and validated in this prototype:

1. **6 wrinkle-free verticals (engine generalisation on uniform catalogs)** — salon, spa, nail_bar proven as config-only additions to a common engine; tanning, pet_grooming, tattoo extend the engine with wrinkle-specific fields, each in a 2-file change pattern.
2. **3 service-line wrinkle categories** — money-shape (tattoo: deposit/balance two-phase), state-shape (pet_grooming: vaccination gate), duration-shape (tanning: session minutes + elapsed tick).
3. **1 ticket-lifecycle alternate** — drop_off (laundry): ticket created without payment, persists across visits as an open ticket, closes on pickup. Orthogonal to the wrinkle categories.
4. **Shift envelope** — per-vertical open-shift concept separate from device session and operator identity; Charge gated until a shift is open; transaction stamping with `shiftId`.
5. **Multi-leg split tender** — up to 5 legs in any card+cash combination; sequential state machine with running ledger; per-leg `mockLast4`; void-disclaimer on cancel.
6. **5-way overlay mutex** — Waitlist, Appointments, Today's Sales, Owner Settings, Open Tickets; only one open at a time.

---

## Checkout State Machine

```
         startCheckout()
  idle ──────────────────► tip
   ▲                         │
   │   cancelCheckout()      │ confirmCheckout()
   │◄────────────────────────┘
   │                         │
   │              ┌──────────┴───────────────────────┐
   │              │ card                              │ cash / split
   │              ▼                                   ▼
   │         processing ── 2000ms ──► receipt ◄──── receipt
   │         (800ms if comped)           │
   │                                     │
   │         completeSale() ◄── completeDelivery()
   │              │
   └──────────────┘
         (also calls useCart.clear + clearDepositContext)
```

Transitions:
- `idle → tip`: operator taps "Charge" on non-empty cart (blocked when no shift open)
- `tip → idle`: operator taps "Cancel"
- `tip → processing`: operator taps "Card $X.XX" (card path only)
- `tip → receipt`: operator confirms cash (via CashTenderModal) or completes split (via SplitTenderModal) — cash and split skip the global processing state; card charge for split happens inside SplitTenderModal before `confirmCheckout` is called
- `processing → receipt`: 2000ms setTimeout (800ms if comped)
- `receipt → completed`: operator selects delivery channel
- `completed → idle`: operator taps "New Sale" (`completeSale`)

---

## Data Flow

- **Tile tap** → `useCart.addItem(serviceId, name, priceCents, activeStaffId)` → dedupe check → state update → localStorage write → re-render
- **Modifier toggle** → `useCart.toggleModifier(lineId, modifier)` → splice in/out → state update → localStorage write → subtotal recalculates
- **Discount** → inline picker in `CartLine` → `onSetDiscount(lineId, percent)` → if >20%: `requestManagerOverride(reason)` gates first → on approval, `useCart.setDiscount` → localStorage write
- **Comp** → `CompModal` reason picker → `useCart.applyComp(reason)` → Cart zeroes tax/tip/total display; checkout sends `totalCents=0`
- **Hold** → snapshot `{ id, heldAt, customer, lineItems, compApplied, compReason }` → `holdTicket(ticket, verticalId)` → `useCart.clear()` → toast → "Held: N" pill updates
- **Resume** → `resumeTicket(id, verticalId)` → `useCart.loadHeld(lineItems, customer, compApplied, compReason)` → modal closes
- **Vaccination gate** (pet_grooming) → `Cart` reads `vaccinationStatus` from customer or last-known record → renders `blocked` banner (requires PIN override) or `warning` banner (advisory) → manager PIN override → `onOverrideVaccination(lineId)` → sets `vaccinationOverride: true` on `CartLine` → gate clears
- **Tanning session tick** → `CartLine` renders `useElapsedTick(startedAt)` → elapsed seconds display updates every 1000ms via the sole `setInterval` in the codebase
- **Walk-in promote** → `WaitlistOverlay` taps "Start Service" → `onStartService(entry)` → `RegisterPage` calls `attachCustomer` + `addItem` + `removeEntry(id)` → overlay closes
- **Appointment hydrate** → `AppointmentsOverlay` taps "Start Service" → `onStartAppointment(appt)` → `RegisterPage` calls `attachCustomer`, `addItem`, `setActiveStaff`, `setDepositContext(apptId, depositCents)` if deposit taken, `startAppointment(apptId)` → overlay closes
- **Take deposit** → `TakeDepositModal` opens from `AppointmentsOverlay` → operator charges card/cash → `addTransactionDirect(verticalId, depositTx)` writes deposit transaction → `onDepositCaptured(txId)` calls `takeDeposit(apptId, txId)` in `useAppointments` → appointment `depositStatus` → `"taken"` → modal closes, DEP PAID badge shows
- **Shift open** → operator taps "Open Shift" → `StartShiftModal` → staff selector + starting cash keypad → confirm → `useShift.openShift(staffId, startingCashCents)` → `currentShift` written to localStorage → shift pill shows elapsed duration → Charge button enabled
- **Shift close** → operator opens `EndShiftModal` from header → summary computed from `nuatis-pos:{v}:transactions` filtered by `shiftId` → refund-adjusted gross + payment mix → confirm → `useShift.closeShift()` → `currentShift` cleared → shifts log updated → Charge button disabled
- **Drop-off** → operator taps "Drop Off" (laundry vertical, cart non-empty, customer attached) → `useOpenTickets.createTicket(lines, customer, tagNumber)` → `tagCounter` incremented → `DropOffSuccessOverlay` shown with LAUN-XXXX tag → cart cleared → open ticket appears in OpenTicketsOverlay with IN PROGRESS badge
- **Mark Ready** → `OpenTicketsOverlay` "Mark Ready" → `useOpenTickets.markReady(ticketId)` → ticket status → READY → mock-SMS toast with customer phone number → badge turns green
- **Pickup** → `OpenTicketsOverlay` "Pick Up" → switch-confirmation banner → confirm → cart hydrated with original lines + customer → pickup mode banner in cart → operator proceeds through standard checkout → `confirmCheckout` stamps `openTicketId` on transaction → `useOpenTickets.closeTicket(ticketId, transactionId)` → ticket moved to closedTickets
- **Charge tap (card)** → `useCheckout.startCheckout()` → `idle → tip` → operator taps "Card $X.XX" → `confirmCheckout({ paymentMethod: 'card', shiftId, ... })` → `tip → processing` → 2000ms → `processing → receipt`
- **Cash tap** → operator taps "Cash $X.XX" → `CashTenderModal` opens (z-50) → right-to-left keypad fills tendered amount → "Confirm Cash $X.XX" → `handleConfirmCash(tenderedCents)` → `confirmCheckout({ paymentMethod: 'cash', amountTendered, changeGiven, shiftId, ... })` → `tip → receipt` (skips processing) → cash drawer toast fires
- **Split tap** → operator taps "Split Card + Cash" → `SplitTenderModal` opens (z-50) → N-leg sequential state machine → each leg: compose amount via keypad → "Charge Card $X" (2-sec card sim, generates `mockLast4`) or "Tender Cash $X" (cash sub-flow) → running ledger updates → "Complete — N legs" enabled when remaining = 0 → `handleConfirmSplit(payments)` → `confirmCheckout({ paymentMethod: 'split', splitPayments, shiftId, ... })` → `tip → receipt` → cash drawer toast if any cash leg
- **Split cancel (after card leg captured)** → void-disclaimer overlay lists each captured card leg (amount + `****XXXX` last4) → "Yes, Cancel" discards all legs; "Keep Going" dismisses overlay; no actual Stripe void API called
- **Refund** → `ReceiptDetail` calls `requestManagerOverride('Refund authorization')` → on approval → `RefundPicker` → `onComplete(lineIds)` → `RefundRecord` appended to transaction → localStorage updated
- **Delivery choice** → `useCheckout.completeDelivery(channel)` → append to `nuatis-pos:{verticalId}:transactions` → `receipt → completed`
- **New Sale** → `useCart.clear()` + `clearDepositContext()` + `useCheckout.completeSale()` → `completed → idle`
- **Vertical switch** → `setActiveVerticalId(id)` → localStorage write → context update → `useCart` reloads from new namespace → `useVerticalSettings` reloads settings for new vertical → `useShift` hydrates that vertical's currentShift → `useOpenTickets` hydrates that vertical's openTickets → `RegisterPage` reloads held tickets + waitlist count + appointments → tile grid re-renders with new vertical's services + colors
- **Settings save** → `SettingsOverlay` tab save → calls `updateBusiness / updateTaxRate / updateTipPresets / updateStaff` → `VerticalSettingsContext` state updates → all consumers (Cart, TipPicker, Receipt, StaffSwitcher, CartLine) re-render with new values

---

## Wrinkle Category Framework

The config-driven vertical engine generalises beyond uniform service catalogs. Three wrinkle categories have been implemented and validated through B22–B23:

**money-shape** (tattoo, B19): services requiring a prior deposit. Produces two linked `Transaction` records — a `type: 'deposit'` record at appointment time and a `type: 'service'` record at visit time. `totalPaid` is the revenue truth on both. `appointmentRef` cross-links the pair. Deposit transactions are excluded from per-staff revenue allocation.

**state-shape** (pet_grooming, B22): services gated by an external compliance record. Three paths: `clear` (proceed normally), `warning` (expiry within 30 days — advisory only, no block), `blocked` (expired or missing — requires manager PIN override). Override is recorded as `vaccinationOverride: true` on the `CartLine`. Gate logic is purely client-side; in production this would validate against a vaccination record table.

**duration-shape** (tanning, B23): services defined by session duration (minutes) and resource (bed). The register shows an elapsed-tick counter on active session lines (`useElapsedTick` — the codebase's sole `setInterval`). Bed occupancy state is tracked across the tile grid. Session lines carry `sessionMinutes` and `bedId` fields.

Adding a new wrinkle category requires: extending `CartLine` with the wrinkle-specific fields, adding a gate or display component in `Cart`/`CartLine`, adding a seeded data file for the new vertical, and registering the vertical in `VERTICALS` with an extended `VerticalId` type.

**Ticket-Lifecycle Axis**

The wrinkle categories above describe service-line behavior within a single operator interaction. The ticket-lifecycle axis is orthogonal — it describes when a ticket opens, how it persists across visits, and when it closes. `VerticalConfig` carries a `workflow` flag: `"same_visit"` (default for all six prior verticals) or `"drop_off"` (laundry, B27). The drop-off lifecycle: ticket created without payment at drop-off → persists as an open ticket in localStorage → transitions to READY on mark-ready (mock-SMS) → closes at pickup checkout with `openTicketId` on the transaction. This axis is orthogonal to the wrinkle categories: wrinkles describe what happens inside a service interaction; lifecycle describes the existence and persistence of a ticket across visits.

---

## Money Math

All amounts are integer cents throughout. No floating-point arithmetic.

- `calcLineTotalCents(line)` = `Math.round((priceCents + sum(modifiers[].priceCents)) × quantity × (1 − discountPercent/100))`
- Discount applied **before** tax — subtotal reflects post-discount line totals
- `calcSubtotal(lines)` = `sum(calcLineTotalCents(line))` for all lines
- `TAX_RATE` = `0.0825` — fallback constant only; **not used at runtime**
- `calcTaxWithRate(subtotalCents, ratePercent)` = `Math.round(subtotalCents × (ratePercent / 100))` — **canonical tax helper**; `ratePercent` comes from `settings.taxRatePercent` in `useVerticalSettings`
- `tipCents` calculated on subtotal only (NOT subtotal + tax)
- `totalCents` = `subtotalCents + taxCents + tipCents`
- **Comp zeroing**: when `compApplied`, `taxCents = 0`, `tipCents = 0`, `totalCents = 0`; `subtotalCents` preserved on receipt for display
- **Refund tax allocation**: `taxRefundCents = Math.round((lineRefundCents / originalSubtotalCents) × originalTaxCents)` — proportional share of tax for selected lines
- **Tip never refunded** on partial or full refunds — tip is voluntary; policy enforced in `RefundPicker`
- `totalRefundCents` = `lineRefundCents + taxRefundCents`
- **Revenue truth**: `transaction.totalPaid` is authoritative. For service transactions without a deposit: `totalPaid = totalCents`. For service transactions with a deposit applied: `totalPaid = totalCents − depositApplied` (cash that actually changed hands at the service visit). For deposit transactions: `totalPaid = depositAmountCents`. For split transactions: `totalPaid = sum(payments[].amountCents)` (excludes change returned to customer).
- **Per-staff revenue** (reports) = sum of `calcLineTotalCents` for lines where `line.staffId === staff.id`, excluding refunded lines and comped transactions. Deposit transactions (`type === 'deposit'`) are excluded from per-staff breakdown entirely — the split across staff is attributed at service time, not deposit time.
- **Payment mix** (Today's Sales): split transactions route each `payments[]` leg to its matching bucket — card portion → card revenue, cash portion → cash revenue. A single split transaction can contribute to both the card and cash buckets simultaneously.
- **Cash change**: `changeCents = tenderedCents − cashPortionCents`. Change is excluded from revenue; only `amountCents` (what the business keeps) enters the revenue calculation.
- **Shift summary revenue**: `EndShiftModal` computes refund-adjusted gross by filtering `nuatis-pos:{v}:transactions` for records where `shiftId === currentShift.id`, then subtracting `refundedTotalCents` where present.

---

## Known Limitations

- **Multi-card split refund routing**: when a line-level refund is processed on a split transaction that included multiple card legs, the full refund amount is deducted from the Card bucket in payment-mix totals (`cardNetRevenue -= refundDeduct`). There is no per-leg attribution — the simple-default deducts from the Card bucket regardless of which leg the refunded line's revenue came from. This is correct for the common case (one card leg) but slightly understates Card revenue if the refunded amount was split across multiple card legs. Production would require per-leg refund routing via Stripe Refund API with the correct payment intent ID per leg.
- **Vaccination gate is client-side only**: the blocked/warning/clear status is derived from mock data on the customer record. Production would validate against a live vaccination record table with expiry-date checking.
- **Tanning bed occupancy is in-memory only**: bed state resets on page reload. Production would require a session-management table.
- **Per-leg void on split cancel is not real**: the void-disclaimer overlay lists captured card legs and notes that production would call the Stripe Terminal void API per leg. No actual reversal occurs in the prototype.
- **5-leg cap is a UI guard only**: the modal prevents a 6th leg from being composed. In production, the cap and leg ordering would be enforced server-side.
- **Shift pill rides useClock re-renders**: the elapsed-duration display on the shift pill updates whenever `Header`'s `useClock` fires rather than computing duration independently. This is a prototype shortcut; production should compute duration from `shift.startedAt` on each render without an upstream dependency.
- **Per-pound pricing skipped for laundry**: weight-based pricing (lbs × rate) is intentionally not implemented. The duration-shape pattern from tanning (minutes × rate) covers the same axis conceptually; laundry is exercised as a flat-price service catalog for lifecycle-axis validation only.
- **Drop-off deposits are out of scope**: the ticket-lifecycle axis (drop-off) is kept separate from the money-shape axis (deposit) in this prototype. A production laundry vertical might combine both; the prototype keeps them independent for clarity.
- **Tag counter is per-vertical but laundry-only currently**: the `tagCounter` localStorage helpers in `lib/openTickets.ts` are parameterized by `verticalId`, but only the laundry vertical exercises them. The `LAUN-` tag prefix is hardcoded to laundry; production would read the prefix from per-vertical config.

---

## Storage Architecture

Per-vertical namespacing: `nuatis-pos:{verticalId}:{key}`

| Key pattern | Example | Scope |
|---|---|---|
| `nuatis-pos:{v}:cart` | `nuatis-pos:salon:cart` | Per-vertical |
| `nuatis-pos:{v}:transactions` | `nuatis-pos:spa:transactions` | Per-vertical |
| `nuatis-pos:{v}:heldTickets` | `nuatis-pos:salon:heldTickets` | Per-vertical |
| `nuatis-pos:{v}:settings` | `nuatis-pos:nail_bar:settings` | Per-vertical (write-on-edit only) |
| `nuatis-pos:{v}:waitlist` | `nuatis-pos:salon:waitlist` | Per-vertical |
| `nuatis-pos:{v}:appointments` | `nuatis-pos:tattoo:appointments` | Per-vertical |
| `nuatis-pos:{v}:cartMeta` | `nuatis-pos:tattoo:cartMeta` | Per-vertical (write-on-edit only) |
| `nuatis-pos:{v}:currentShift` | `nuatis-pos:salon:currentShift` | Per-vertical (absent when no shift open) |
| `nuatis-pos:{v}:shifts` | `nuatis-pos:salon:shifts` | Per-vertical |
| `nuatis-pos:{v}:openTickets` | `nuatis-pos:laundry:openTickets` | Per-vertical (laundry exercises this) |
| `nuatis-pos:{v}:closedTickets` | `nuatis-pos:laundry:closedTickets` | Per-vertical (laundry exercises this) |
| `nuatis-pos:{v}:tagCounter` | `nuatis-pos:laundry:tagCounter` | Per-vertical (laundry exercises this) |
| `nuatis-pos:activeVerticalId` | — | Shared (no prefix) |
| `nuatis-pos:activeStaffId` | — | Shared (no prefix) |

**Pattern**: `nuatis-pos:{verticalId}:{key}` — 9 base keys per vertical + 2 shared + 3 laundry-only = up to **68 keys** at maximum across 7 verticals when all settings have been customised. Write-on-edit-only keys (settings, cartMeta, currentShift) do not exist until first use.

**Key helpers** (`lib/storage.ts`): `cartKey(v)`, `transactionsKey(v)`, `heldTicketsKey(v)`, `settingsKey(v)`, `waitlistKey(v)`, `appointmentsKey(v)`, `cartMetaKey(v)`, `currentShiftKey(v)`, `shiftsKey(v)`, `ACTIVE_VERTICAL_KEY`, `ACTIVE_STAFF_KEY`. Open-ticket helpers in `lib/openTickets.ts`: `openTicketsKey(v)`, `closedTicketsKey(v)`, `tagCounterKey(v)`.

**`cartMeta`** stores `{ appointmentRef: string | null, depositApplied: number }`. Written by `useCart.setDepositContext` when an appointment with a completed deposit is loaded to the register. Read back on page reload to restore the deposit credit display. Cleared (set to null/0) on checkout completion, cart clear, or `clearDepositContext`.

**Settings layer** (`lib/verticalSettings.ts`):
- `getDefaults(verticalId)` reads live defaults from `VERTICALS[verticalId].business` + `STAFF` at call time — defaults are NOT baked at build time
- `getVerticalSettings(verticalId)` reads `nuatis-pos:{verticalId}:settings` from localStorage and merges with defaults (stored value wins per field); always returns a complete `VerticalSettings` object, never undefined
- Settings keys are write-on-edit only — if a vertical has never been edited, the key does not exist and the app falls back to defaults silently
- `resetSection(verticalId, section)` patches only the named section back to defaults and rewrites the key; `resetAll(verticalId)` removes the key entirely

**Migration** (`runMigrations()` in `lib/storage.ts`):
- Runs once at module level in `App.tsx` before React renders
- Copies legacy unprefixed keys (`nuatis-pos:cart`, etc.) → `nuatis-pos:salon:*` (only if the new key doesn't already exist), then deletes the old keys
- Idempotent — re-running on subsequent boots is a no-op once legacy keys are absent

**Isolation guarantee**: switching verticals never merges or copies cart/transaction/held/settings/waitlist/appointments/shift data across namespaces. Each vertical starts fresh or resumes its own last state.

---

## Transaction Shape (quick-ref)

```typescript
interface Transaction {
  id: string;
  lineItems: CartLine[];                     // vaccinationOverride per line (pet_grooming)
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
  paymentMethod: "card" | "cash" | "split";
  payments?: SplitPayment[];                 // split only, up to 5 legs
  amountTendered?: number;                   // cash only
  changeGiven?: number;                      // cash only
  completedAt: string;
  customer: CartCustomer | null;
  compApplied: boolean;
  compReason: string | null;
  refunds?: RefundRecord[];
  refundedTotalCents?: number;
  type?: "service" | "deposit";              // money-shape (tattoo): two-phase
  depositApplied?: number;
  appointmentRef?: string;                   // cross-links deposit ↔ service tx pair
  totalPaid?: number;                        // revenue truth
  depositBalanceDueCents?: number;
  shiftId?: string;                          // B26: open shift at checkout time
  openTicketId?: string;                     // B27: laundry pickup only, links to originating drop-off record
}

interface SplitPayment {
  method: "card" | "cash";
  amountCents: number;
  processedAt: number;
  mockLast4?: string;                        // card only — 4 digits, generated at capture time
  tenderedCents?: number;                    // cash only
  changeCents?: number;                      // cash only
}
```

---

## Key Library Modules

| File | Exports | Notes |
|---|---|---|
| `lib/verticals.ts` | `VerticalId`, `VerticalConfig`, `VERTICALS`, `getActiveVerticalConfig` | Central per-vertical config: services, modifiers, category colors, business identity defaults, `workflow` flag for all 7 verticals |
| `lib/verticalSettings.ts` | `SettingsStaff`, `VerticalSettings`, `SettingsSection`, `getDefaults`, `getVerticalSettings`, `setVerticalSettings`, `resetSection`, `resetAll` | Settings override layer; reads defaults from `lib/verticals.ts` at runtime; pure functions, no React |
| `lib/storage.ts` | `cartKey`, `transactionsKey`, `heldTicketsKey`, `settingsKey`, `waitlistKey`, `appointmentsKey`, `cartMetaKey`, `currentShiftKey`, `shiftsKey`, `ACTIVE_STAFF_KEY`, `ACTIVE_VERTICAL_KEY`, `runMigrations` | Storage key helpers + one-time migration |
| `lib/shifts.ts` | `Shift`, `getCurrentShift`, `saveCurrentShift`, `clearCurrentShift`, `appendShiftToLog`, `getShiftsLog` | Per-vertical shift record type + localStorage helpers; `shiftId` is a UUID generated at open time |
| `lib/openTickets.ts` | `OpenTicket`, `OpenTicketStatus`, `getOpenTickets`, `saveOpenTickets`, `getClosedTickets`, `appendClosedTicket`, `getTagCounter`, `incrementTagCounter`, `formatTag` | Drop-off ticket type + per-vertical localStorage helpers; tag format: `{PREFIX}-{NNNN}` |
| `lib/services.ts` | `SERVICES`, `Service`, `CATEGORY_COLORS`, `formatPrice`, `formatDuration` | 12 salon services |
| `lib/tattoo-services.ts` | `TATTOO_SERVICES`, `TATTOO_MODIFIERS_BY_SERVICE`, `TATTOO_CATEGORY_COLORS` | 12 tattoo services with size/complexity modifiers |
| `lib/pet-grooming-services.ts` | `PET_GROOMING_SERVICES`, `PET_GROOMING_CATEGORY_COLORS` | 12 pet grooming services; vaccination gate applies across all |
| `lib/tanning-services.ts` | `TANNING_SERVICES`, `TANNING_CATEGORY_COLORS` | Session-based tanning services with duration + bed-type fields |
| `lib/laundry-services.ts` | `LAUNDRY_SERVICES`, `LAUNDRY_CATEGORY_COLORS` | 12 laundry services in muted blue + bronze palette; flat-price catalog |
| `lib/laundry-customers.ts` | `LAUNDRY_CUSTOMERS` | Seed customer list for the laundry vertical; includes phone numbers for mock-SMS ready notifications |
| `lib/staff.ts` | `STAFF`, `Staff` | 3 hardcoded staff members, shared as defaults; per-vertical staff list is editable via Settings |
| `lib/customers.ts` | `CUSTOMERS`, `Customer`, `CartCustomer`, `addCustomerInMemory` | 6 seed customers; `addCustomerInMemory` mutates in-memory array only (lost on reload by design) |
| `lib/modifiers.ts` | `Modifier`, `MODIFIERS_BY_SERVICE`, `getModifiersForService` | Salon modifiers only; spa and nail bar modifiers defined inline in `lib/verticals.ts` |
| `lib/heldTickets.ts` | `HeldTicket`, `getHeldTickets`, `holdTicket`, `resumeTicket`, `removeHeldTicket` | All functions take `verticalId: string`; cap 5 per vertical |
| `lib/appointments.ts` | `Appointment`, `getAppointments`, `saveAppointments`, `takeAppointmentDeposit`, `formatAppointmentTime` | Seed functions per vertical; tattoo seeds include deposit fields; pet grooming seeds include vaccination status fields |
| `lib/waitlist.ts` | `WaitlistEntry`, `getWaitlist`, `saveWaitlist` | FIFO queue, cap 10 per vertical; pure storage functions |
| `lib/cartMath.ts` | `calcLineTotalCents`, `calcLineDiscountCents`, `calcSubtotal`, `calcTax`, `calcTaxWithRate`, `calcTip`, `calcTotal`, `TAX_RATE`, `MANAGER_DISCOUNT_THRESHOLD` | Pure functions, integer cents only; `calcTaxWithRate` is canonical at runtime |
| `lib/cashMath.ts` | `appendCashDigit`, `appendDoubleCashZero`, `backspaceCashDigit`, `computeQuickTenders`, `CASH_TENDER_CAP` | Right-to-left cents-fill helpers + quick-tender row computation; used by `CashTenderModal`, `SplitTenderModal`, and `StartShiftModal` (starting cash float) |
| `lib/reports.ts` | `DailySummary`, `calcDailySummary`, `StaffSummary`, `calcPerStaffSummary` | `DailySummary` includes `discountCents` + `refundCents`; per-staff excludes refunded lines, comped transactions, and deposit transactions |
| `lib/currency.ts` | `formatCurrency` | Formats integer cents as `$X.XX` |
| `lib/phone.ts` | `normalizePhone`, `formatPhone` | `normalizePhone` strips non-digits; used for phone validation in CustomerSearch and SettingsOverlay |

---

## Batch History

| Batch | Demo-able Outcome |
|---|---|
| B1 | Replit Auth gate + 4×3 tile grid renders for Salon |
| B2 | Cart with line items, subtotal, tax, and localStorage persistence |
| B3 | Tip picker (in-place, no modal) + 2-second simulated card reader |
| B4 | Receipt panel + 4-channel mock delivery (print / email / SMS / none) |
| B5 | Customer attach (phone-first search, pre- and post-sale) + per-line staff attribution |
| B6 | Today's Sales overlay with 5-stat summary and per-staff revenue breakdown |
| B7 | Service modifiers + Hold / Resume tickets (cap 5, persisted) |
| B8 | README + cleanup + tag v0.0.1-prototype |
| B9 | Line-level % discount (>20% gates manager PIN) + whole-ticket comp with 6 reasons |
| B10 | Manager PIN modal (4-box auto-advance) + line-level partial refund with proportional tax |
| B11 | Spa as 2nd vertical — multi-vertical engine proven; config-only change |
| B12 | Final docs + tag v0.0.2-prototype |
| B13 | Nail Bar as 3rd vertical (launch trio complete) — 2-file change only |
| B14 | Owner Settings overlay (Business / Tax & Tips / Staff tabs, per-vertical scope) |
| B15 | Docs wrap + tag v0.0.3-prototype |
| B16 | Walk-in queue (FIFO cap-10, per-vertical, AddWalkInModal, promote-to-ticket) |
| B17 | Cash payment — CashTenderModal with right-to-left keypad, quick-tender row, cash drawer toast |
| B18 | Appointment-aware register — Upcoming/History tabs, status state machine, tap-to-hydrate |
| B19 | Tattoo as 4th vertical + deposit pattern (two-phase transactions, `totalPaid` revenue truth) |
| B20 | Split tender card+cash — SplitTenderModal, `payments[]` on Transaction, split-aware payment mix |
| B21 | Docs wrap + tag v0.0.5-prototype |
| B22 | Pet grooming as 5th vertical + vaccination state-shape (blocked/warning/clear, PIN override, `vaccinationOverride` on `CartLine`) |
| B23 | Tanning as 6th vertical + duration-shape sessions (`useElapsedTick`, bed occupancy, `Header.useClock` migrated to `setTimeout`-recursion) |
| B24 | Multi-leg split tender rewrite — up to 5 legs, any card+cash combo, per-leg `mockLast4`, running ledger, void-disclaimer on cancel |
| B25 | Docs wrap + tag v0.0.7-prototype |
| B26 | Shift-state envelope — per-vertical open shift, `StartShiftModal` + `EndShiftModal`, Charge gated when no shift open, `shiftId` stamped on every transaction, shift pill in header shows elapsed duration |
| B27 | Laundry as 7th vertical + drop-off/pickup ticket-lifecycle shape — tag counter (LAUN-0001), `DropOffSuccessOverlay`, `OpenTicketsOverlay` (IN PROGRESS / READY badges), mock-SMS mark-ready, pickup cart hydration, `openTicketId` on pickup transaction, 5-way overlay mutex |
| B28 | Docs wrap — README v6 + replit.md v6 + screenshots/README.md extended + tag v0.0.9-prototype |

---

## Tag History

| Tag | Batch | What it captured |
|---|---|---|
| v0.0.1-prototype | B8 | Launch trio minus nail bar; tip + card sim; receipt delivery |
| v0.0.2-prototype | B12 | Spa as 2nd vertical; discount + comp; manager PIN; refund |
| v0.0.3-prototype | B15 | Nail Bar (trio complete); Owner Settings overlay; walk-in queue |
| v0.0.4-prototype | B19 | Cash payment; appointments; tattoo + deposit pattern |
| v0.0.5-prototype | B21 | Split tender (2-leg); Today's Sales split-aware payment mix |
| v0.0.6-prototype | B23 | Pet grooming (vaccination state-shape); tanning (duration-shape); setInterval invariant enforced |
| v0.0.7-prototype | B25 | Multi-leg split (up to 5 legs, per-leg last4, void disclaimer); docs wrap v5 |
| v0.0.8-prototype | B27 | Laundry vertical (drop-off/pickup lifecycle); shift-state envelope; 7th vertical; 5-way overlay mutex |
| v0.0.9-prototype | B28 | Docs wrap v6 — README + replit.md + screenshots checklist through B27 |

---

## Why React + Vite Instead of Next.js

Replit Agent workspace did not have Next.js 14 available; switched to Vite without losing UX fidelity. Production migrates to Next.js 14 App Router per locked stack — this prototype is throwaway anyway.

## Why Tailwind v4 Instead of v3

Replit's default project template installed v4. All utility classes used are v3-compatible; production runs v3.

---

## Things to Carry Forward (Visual Decisions)

- 4×3 tile grid with category color coding (cuts pink, color cream, treatments lavender, styling peach)
- Right-side fixed cart at 384px width
- In-place tip selection (no modal)
- 2-second simulated card reader timing (800ms for comped tickets); cash and split skip the global processing overlay
- Receipt as left panel + delivery buttons as right column on success overlay
- "+ Customer" pill above cart header (pre and post-sale attach)
- Active staff in header (operator), Replit user in Account dropdown (device)
- "Held: N" pill in header for queue visibility
- Walk-in queue pill in header ("Waitlist: N") promoting walk-ins to the register without opening a separate search
- Appointments pill in header ("Appts: N") with Upcoming/History tab split and status badge state machine
- Deposit pattern: DEP REQ / DEP PAID badges in appointment list; deposit banner in cart; two-phase transaction pair linked via `appointmentRef`
- Split tender as secondary-weight button (outlined, not accent-filled) below primary Card/Cash buttons — preserves primary path prominence
- Cash change feedback pattern: quick-tender row + live "Change due: $X.XX" label before confirm
- Split running ledger during composition — operator sees all captured legs before committing
- Per-leg last4 on split card legs (not a single shared last4) — accurate for multi-reader flows
- Void-disclaimer overlay on split cancel when card legs are already captured
- Vaccination gate: blocked (red banner, PIN required) vs warning (amber banner, advisory) vs clear (no banner)
- Tanning session elapsed ticker on cart line — visual proof the "session" is live
- Manager override gate-on-upgrade-only rule (downgrades don't re-prompt)
- Refund initiated from Today's Sales receipt detail (post-sale only, not from register)
- Refund line-picker pattern with proportional tax allocation
- SPLIT badge (sky blue) in transaction list distinct from REFUNDED (red), PARTIAL (red), DEPOSIT (purple), COMPED (red)
- Per-vertical namespaced storage for engine isolation
- Vertical switcher gated when cart has items
- 4-box PIN entry with auto-advance focus
- Settings overlay structure (3 tabs: Business, Tax & Tips, Staff) accessed from Account dropdown
- Per-vertical settings scoping pattern
- Settings defaults read from config at runtime — not baked at build time
- Unsaved-edits-confirm pattern on overlay close (dirty-state check before dismiss)
- Account dropdown as the gateway to non-operator surfaces (Settings, future role management)
- Engine generalisation pattern: `VERTICALS` registry + `getActiveVerticalConfig` — adding a vertical requires only registry addition + `VerticalId` type extension
- **Shift envelope as a mental model**: per-vertical open-shift state distinct from device session and operator identity; shift pill in header; Charge gated until shift open; shift summary on close
- **Ticket-lifecycle axis with `workflow` config flag**: `same_visit` vs `drop_off` as a per-vertical config flag cleanly scopes lifecycle behavior to the engine without touching shared checkout logic
- **5-way overlay mutex**: Waitlist, Appointments, Today's Sales, Owner Settings, Open Tickets — only one surface open at a time; provides a clean pattern for adding future overlay surfaces
- **Tag counter pattern**: sequential per-vertical counter persisted to localStorage; `formatTag(counter, prefix)` produces human-readable ticket identifiers (LAUN-0001); easily extensible to other drop-off verticals

## Things to Discard (Architecture Decisions)

- localStorage for everything (production: Supabase)
- Single-file mutation patterns
- No tenant isolation
- Hardcoded business identity (now editable in prototype, but still localStorage-backed)
- Hardcoded customer/staff lists
- 2-second `setTimeout` for "payment"
- Mock toasts for receipt delivery
- Mock 4-digit PIN acceptance
- Mock refund processing
- Vertical switcher (production locks vertical at signup per tenant config)
- Cross-namespace migration logic (one-time only, prototype scaffolding)
- localStorage as the settings backend (production uses Supabase `tenant_settings` table)
- No-PIN-on-Settings (production gates via role check — owner vs operator)
- String-literal type guards on `VerticalId` (production should use `Object.keys(VERTICALS).includes(saved)` with cast pattern)
- `addTransactionDirect` module-level escape hatch (production: all transactions go through the server-authoritative path)
- In-memory-only appointment seed approach (production: appointments come from the database)
- Client-side vaccination gate (production: validate against a `vaccination_records` table with expiry-date checking)
- In-memory tanning bed occupancy (production: session-management table with real-time occupancy)
- **Shift pill's reliance on useClock re-renders** for elapsed-duration display — production should compute duration from `shift.startedAt` on each render, self-contained, without depending on an upstream clock re-render
- **LAUN- tag prefix hardcoded to laundry** — production needs per-vertical tag prefix from `VerticalConfig` (e.g. `config.tagPrefix`) rather than a hardcoded string constant in the drop-off flow

---

## Key Commands

```bash
pnpm run typecheck          # full typecheck across all workspace packages
pnpm --filter @workspace/nuatis-pos run dev   # start the POS frontend
pnpm --filter @workspace/api-server run dev   # start the auth API server
pnpm --filter @workspace/api-spec run codegen # regenerate API hooks from OpenAPI
pnpm --filter @workspace/db run push          # push DB schema (dev only)
```
