# Nuatis POS — Architecture Overview

> Throwaway UX prototype (May 2, 2026). All state in localStorage. No backend required beyond Replit Auth. See README.md for the full context.
>
> **v4 — through Batch 20 (split tender). Tag: v0.0.5-prototype.**

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
│               │   ├── "Today's Sales"  — opens ReportsOverlay, gated on idle
│               │   ├── live clock (useClock)
│               │   ├── active staff + Switch — opens StaffSwitcher
│               │   └── Account dropdown — "Settings" + logout
│               ├── ServiceTile  (×12)   — grid from active vertical config
│               ├── Cart                 — useVerticalSettings for taxRatePercent + tipPresets
│               │   ├── customer pill    — opens CustomerSearch / detach
│               │   ├── deposit banner   — shown when appointmentRef + depositApplied > 0
│               │   ├── CartLine  (×N)   — useVerticalSettings for active staff list
│               │   │   ├── qty controls
│               │   │   ├── staff picker — inline chips from settings.staff (active only)
│               │   │   ├── modifier picker
│               │   │   └── discount picker — presets 5/10/15/20% + custom; >20% gates PIN
│               │   ├── CompModal        — 6-reason comp picker
│               │   ├── TipPicker        — presets from settings.tipPresets + custom input
│               │   └── Charge / Card / Cash / Split buttons
│               ├── CheckoutOverlay      — full-screen, processing + receipt states
│               │   ├── processing spinner  (card path only; split skips this)
│               │   ├── Receipt          — useVerticalSettings for business identity
│               │   ├── delivery buttons — print / email / sms / none
│               │   └── CustomerSearch (post-sale attach)
│               ├── CashTenderModal      — z-50, right-to-left keypad, quick-tender row
│               ├── SplitTenderModal     — z-50, allocation state machine + cash sub-flow
│               ├── StaffSwitcher        — modal, active staff from settings.staff
│               ├── CustomerSearch       — modal, phone-first search + inline create
│               ├── ReportsOverlay       — reads from active vertical's transaction namespace
│               │   ├── summary view     — 5-stat row + per-staff + list + SPLIT/DEPOSIT badges
│               │   ├── receipt detail   — Receipt (useVerticalSettings for business identity)
│               │   └── RefundPicker     — line checkboxes + live total + 1500ms processing
│               ├── HeldTicketsModal     — per-vertical held ticket list
│               ├── WaitlistOverlay      — FIFO queue, cap 10, AddWalkInModal, promote-to-ticket
│               ├── AppointmentsOverlay  — Upcoming/History tabs, status state machine, TakeDepositModal
│               ├── VerticalSwitcher     — modal, all 4 verticals, gated when cart has items
│               ├── SettingsOverlay      — owner UX; 3 tabs: Business / Tax & Tips / Staff
│               │   ├── Business tab     — name/address/phone inputs + live receipt preview
│               │   ├── Tax & Tips tab   — tax rate input + tip preset CRUD
│               │   └── Staff tab        — staff row CRUD (add/deactivate/delete)
│               ├── PinModal             — 4-box auto-advance, any 4 digits accepted (mock)
│               └── Toast                — fixed top-right, 1500ms auto-dismiss
```

---

## Hooks

| Hook | File | Responsibility |
|---|---|---|
| `useCart` | `hooks/useCart.ts` | Line items, customer, comp state, deposit context (appointmentRef + depositApplied), cart mutations, per-vertical localStorage write-through |
| `useCheckout` | `hooks/useCheckout.ts` | Checkout state machine + transaction persistence; handles card, cash, and split-tender paths; `SplitPayment[]` on transaction when `paymentMethod === 'split'` |
| `useActiveStaff` | `hooks/useActiveStaff.ts` | Current operator identity, persisted to `nuatis-pos:activeStaffId` (shared) |
| `useManagerOverride` | `hooks/useManagerOverride.ts` | Promise-based PIN gate; `requestManagerOverride(reason)` returns `Promise<boolean>`; mock — any 4 digits accepted |
| `useActiveVertical` | `hooks/useActiveVertical.ts` | Active vertical id + full config; persisted to `nuatis-pos:activeVerticalId`; reloads cart/held on switch |
| `useVerticalSettings` | `hooks/useVerticalSettings.ts` | Per-vertical settings overrides (business identity, tax rate, tip presets, staff); falls back to `lib/verticals.ts` defaults; persists to `nuatis-pos:{verticalId}:settings` |
| `useWaitlist` | `hooks/useWaitlist.ts` | Per-vertical walk-in queue (FIFO, cap 10); persists to `nuatis-pos:{verticalId}:waitlist` |
| `useAppointments` | `hooks/useAppointments.ts` | Per-vertical appointment list; seed-on-first-load; status state machine (scheduled → started / no_show); `takeDeposit(id, txId)` writes depositStatus + txId |

---

## State Architecture

- **`useCart`** — owns `lines: CartLine[]`, `customer`, `compApplied`, `compReason`, `appointmentRef`, `depositApplied`. Every mutation immediately writes to `nuatis-pos:{verticalId}:cart`. Deposit context (`appointmentRef` + `depositApplied`) is persisted to `nuatis-pos:{verticalId}:cartMeta` separately — written by `setDepositContext(apptId, depositCents)` when hydrating from an appointment, cleared by `clearDepositContext()` on checkout completion or cart clear. Reloads from new namespace when `activeVerticalId` changes.
- **`useCheckout`** — owns checkout state machine and in-flight/completed transaction. Three `confirmCheckout` paths: `card` (2-sec sim → processing → receipt), `cash` (skips processing → receipt directly), `split` (card already settled in SplitTenderModal → skips processing → receipt directly). Appends to `nuatis-pos:{verticalId}:transactions` (capped at 50) on delivery confirmation. Exports `addTransactionDirect(verticalId, tx)` for deposit transactions written outside the normal checkout flow.
- **`useActiveStaff`** — reads/writes `nuatis-pos:activeStaffId`. Shared across all verticals. Default `STAFF[0]`. `RegisterPage` watches `settings.staff` (active IDs) and falls back to first active staff if the persisted ID is no longer in the active list.
- **`useManagerOverride`** — imperative modal pattern. `requestManagerOverride(reason)` creates a Promise, mounts `PinModal`, resolves `true` on any 4-digit entry, `false` on cancel/ESC. No prop-drilling; available to any descendant via context.
- **`useActiveVertical`** — reads/writes `nuatis-pos:activeVerticalId`. Provides `{ activeVerticalId, setActiveVerticalId, config }` where `config = VERTICALS[activeVerticalId]`. Switching triggers cart reload and held-ticket reload in `RegisterPage`.
- **`useVerticalSettings`** — per-vertical settings overrides via Context, falls back to `lib/verticals.ts` defaults at runtime via `getDefaults(verticalId)`, persists per-vertical to `nuatis-pos:{verticalId}:settings`. Reloads when `activeVerticalId` changes. All update callbacks are stable refs (no re-creation on vertical switch — uses `verticalIdRef` pattern).
- **`useWaitlist`** — per-vertical walk-in queue, cap 10, persisted to `nuatis-pos:{verticalId}:waitlist`. `addEntry` appends; `removeEntry` deletes by id. Promoting a walk-in to the register calls `onStartService(entry)` in `RegisterPage`, which calls `attachCustomer` + `addItem` and then `removeEntry`.
- **`useAppointments`** — per-vertical appointment list, seeded on first load from `lib/appointments.ts` seed functions. `startAppointment(id)` sets status `"started"`. `markNoShow(id)` sets `"no_show"`. `resetStatus(id)` returns to `"scheduled"`. `takeDeposit(id, txId)` sets `depositStatus: "taken"` and `depositTxId: txId`. Deposit transactions are written via `addTransactionDirect` from `TakeDepositModal` before the appointment status is updated.

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
- `idle → tip`: operator taps "Charge" on non-empty cart
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
- **Walk-in promote** → `WaitlistOverlay` taps "Start Service" → `onStartService(entry)` → `RegisterPage` calls `attachCustomer` + `addItem` + `removeEntry(id)` → overlay closes
- **Appointment hydrate** → `AppointmentsOverlay` taps "Start Service" → `onStartAppointment(appt)` → `RegisterPage` calls `attachCustomer`, `addItem`, `setActiveStaff`, `setDepositContext(apptId, depositCents)` if deposit taken, `startAppointment(apptId)` → overlay closes
- **Take deposit** → `TakeDepositModal` opens from `AppointmentsOverlay` → operator charges card/cash → `addTransactionDirect(verticalId, depositTx)` writes deposit transaction → `onDepositCaptured(txId)` calls `takeDeposit(apptId, txId)` in `useAppointments` → appointment `depositStatus` → `"taken"` → modal closes, DEP PAID badge shows
- **Charge tap (card)** → `useCheckout.startCheckout()` → `idle → tip` → operator taps "Card $X.XX" → `confirmCheckout({ paymentMethod: 'card', ... })` → `tip → processing` → 2000ms → `processing → receipt`
- **Cash tap** → operator taps "Cash $X.XX" → `CashTenderModal` opens (z-50) → right-to-left keypad fills tendered amount → "Confirm Cash $X.XX" → `handleConfirmCash(tenderedCents)` → `confirmCheckout({ paymentMethod: 'cash', amountTendered, changeGiven, ... })` → `tip → receipt` (skips processing) → cash drawer toast fires
- **Split tap** → operator taps "Split Card + Cash" → `SplitTenderModal` opens (z-50) → operator allocates card + cash portions via keypad or "Split evenly" → "Charge Card $X" → 2-sec card sim inside modal → card settled → "Tender Cash $X" → cash sub-flow inside modal (same keypad pivots to tendered-amount mode) → cash confirmed → "Complete Split Sale" enabled → `handleConfirmSplit(payments)` → `confirmCheckout({ paymentMethod: 'split', splitPayments: payments, ... })` → `tip → receipt` (no global processing spinner) → cash drawer toast fires if any leg is cash
- **Refund** → `ReceiptDetail` calls `requestManagerOverride('Refund authorization')` → on approval → `RefundPicker` → `onComplete(lineIds)` → `RefundRecord` appended to transaction → localStorage updated
- **Delivery choice** → `useCheckout.completeDelivery(channel)` → append to `nuatis-pos:{verticalId}:transactions` → `receipt → completed`
- **New Sale** → `useCart.clear()` + `clearDepositContext()` + `useCheckout.completeSale()` → `completed → idle`
- **Vertical switch** → `setActiveVerticalId(id)` → localStorage write → context update → `useCart` reloads from new namespace → `useVerticalSettings` reloads settings for new vertical → `RegisterPage` reloads held tickets + waitlist count + appointments → tile grid re-renders with new vertical's services + colors
- **Settings save** → `SettingsOverlay` tab save → calls `updateBusiness / updateTaxRate / updateTipPresets / updateStaff` → `VerticalSettingsContext` state updates → all consumers (Cart, TipPicker, Receipt, StaffSwitcher, CartLine) re-render with new values

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

---

## Storage Architecture

Per-vertical namespacing: `nuatis-pos:{verticalId}:{key}`

| Key pattern | Example | Scope |
|---|---|---|
| `nuatis-pos:{v}:cart` | `nuatis-pos:salon:cart` | Per-vertical |
| `nuatis-pos:{v}:transactions` | `nuatis-pos:spa:transactions` | Per-vertical |
| `nuatis-pos:{v}:heldTickets` | `nuatis-pos:salon:heldTickets` | Per-vertical |
| `nuatis-pos:{v}:settings` | `nuatis-pos:nail_bar:settings` | Per-vertical |
| `nuatis-pos:{v}:waitlist` | `nuatis-pos:salon:waitlist` | Per-vertical |
| `nuatis-pos:{v}:appointments` | `nuatis-pos:tattoo:appointments` | Per-vertical |
| `nuatis-pos:{v}:cartMeta` | `nuatis-pos:tattoo:cartMeta` | Per-vertical |
| `nuatis-pos:activeVerticalId` | — | Shared (no prefix) |
| `nuatis-pos:activeStaffId` | — | Shared (no prefix) |

**Key helpers** (`lib/storage.ts`): `cartKey(v)`, `transactionsKey(v)`, `heldTicketsKey(v)`, `settingsKey(v)`, `waitlistKey(v)`, `appointmentsKey(v)`, `cartMetaKey(v)`, `ACTIVE_VERTICAL_KEY`, `ACTIVE_STAFF_KEY`.

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

**Isolation guarantee**: switching verticals never merges or copies cart/transaction/held/settings/waitlist/appointments data across namespaces. Each vertical starts fresh or resumes its own last state.

---

## Key Library Modules

| File | Exports | Notes |
|---|---|---|
| `lib/verticals.ts` | `VerticalId`, `VerticalConfig`, `VERTICALS`, `getActiveVerticalConfig` | Central per-vertical config: services, modifiers, category colors, business identity defaults for all 4 verticals (salon, spa, nail_bar, tattoo) |
| `lib/verticalSettings.ts` | `SettingsStaff`, `VerticalSettings`, `SettingsSection`, `getDefaults`, `getVerticalSettings`, `setVerticalSettings`, `resetSection`, `resetAll` | Settings override layer; reads defaults from `lib/verticals.ts` at runtime; pure functions, no React |
| `lib/storage.ts` | `cartKey`, `transactionsKey`, `heldTicketsKey`, `settingsKey`, `waitlistKey`, `appointmentsKey`, `cartMetaKey`, `ACTIVE_STAFF_KEY`, `ACTIVE_VERTICAL_KEY`, `runMigrations` | Storage key helpers + one-time migration |
| `lib/services.ts` | `SERVICES`, `Service`, `CATEGORY_COLORS`, `formatPrice`, `formatDuration` | 12 salon services; `category` is `string` (widened for multi-vertical) |
| `lib/tattoo-services.ts` | `TATTOO_SERVICES`, `TATTOO_MODIFIERS_BY_SERVICE`, `TATTOO_CATEGORY_COLORS` | 12 tattoo services with size/complexity modifiers |
| `lib/staff.ts` | `STAFF`, `Staff` | 3 hardcoded staff members, shared as defaults; per-vertical staff list is editable via Settings |
| `lib/customers.ts` | `CUSTOMERS`, `Customer`, `CartCustomer`, `addCustomerInMemory` | 6 seed customers; `addCustomerInMemory` mutates in-memory array only (lost on reload by design) |
| `lib/modifiers.ts` | `Modifier`, `MODIFIERS_BY_SERVICE`, `getModifiersForService` | Salon modifiers only; spa and nail bar modifiers defined inline in `lib/verticals.ts` |
| `lib/heldTickets.ts` | `HeldTicket`, `getHeldTickets`, `holdTicket`, `resumeTicket`, `removeHeldTicket` | All functions take `verticalId: string`; cap 5 per vertical |
| `lib/appointments.ts` | `Appointment`, `getAppointments`, `saveAppointments`, `takeAppointmentDeposit`, `formatAppointmentTime` | Seed functions per vertical; tattoo seeds include `depositRequired`, `depositAmountCents`, `depositStatus` fields |
| `lib/waitlist.ts` | `WaitlistEntry`, `getWaitlist`, `saveWaitlist` | FIFO queue, cap 10 per vertical; pure storage functions |
| `lib/cartMath.ts` | `calcLineTotalCents`, `calcLineDiscountCents`, `calcSubtotal`, `calcTax`, `calcTaxWithRate`, `calcTip`, `calcTotal`, `TAX_RATE`, `MANAGER_DISCOUNT_THRESHOLD` | Pure functions, integer cents only; `calcTaxWithRate` is canonical at runtime |
| `lib/cashMath.ts` | `appendCashDigit`, `appendDoubleCashZero`, `backspaceCashDigit`, `computeQuickTenders`, `CASH_TENDER_CAP` | Right-to-left cents-fill helpers + quick-tender row computation; used by both `CashTenderModal` and `SplitTenderModal` |
| `lib/reports.ts` | `DailySummary`, `calcDailySummary`, `StaffSummary`, `calcPerStaffSummary` | `DailySummary` includes `discountCents` + `refundCents`; per-staff excludes refunded lines, comped transactions, and deposit transactions |
| `lib/currency.ts` | `formatCurrency` | Formats integer cents as `$X.XX` |
| `lib/phone.ts` | `normalizePhone`, `formatPhone` | `normalizePhone` strips non-digits; used for phone validation in CustomerSearch and SettingsOverlay |

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
- String-literal type guards on `VerticalId` (e.g. `saved === "salon" || saved === "spa" || saved === "nail_bar" || saved === "tattoo"` in `useActiveVertical.ts`) — production should use `Object.keys(VERTICALS).includes(saved)` with cast pattern
- `addTransactionDirect` module-level escape hatch (production: all transactions go through the server-authoritative path)
- In-memory-only appointment seed approach (production: appointments come from the database)

---

## Key Commands

```bash
pnpm run typecheck          # full typecheck across all workspace packages
pnpm --filter @workspace/nuatis-pos run dev   # start the POS frontend
pnpm --filter @workspace/api-server run dev   # start the auth API server
pnpm --filter @workspace/api-spec run codegen # regenerate API hooks from OpenAPI
pnpm --filter @workspace/db run push          # push DB schema (dev only)
```
