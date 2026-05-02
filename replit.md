# Nuatis POS — Architecture Overview

> Throwaway UX prototype (May 2, 2026). All state in localStorage. No backend required beyond Replit Auth. See README.md for the full context.

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
│   └── ManagerOverrideProvider           — promise-based PIN gate in context
│       ├── LoginPage                     — Replit Auth sign-in screen
│       └── RegisterPage                  — main wiring of all state
│           ├── Header
│           │   ├── vertical pill         — "Salon ▾" / "Spa ▾", opens VerticalSwitcher
│           │   ├── brand
│           │   ├── "Held: N" pill        — per-vertical held count, gated on idle
│           │   ├── "Today's Sales" link  — opens ReportsOverlay, gated on idle
│           │   ├── live clock (useClock)
│           │   ├── active staff + Switch — opens StaffSwitcher
│           │   └── Account dropdown      — Replit user email + logout
│           ├── ServiceTile  (×12)        — grid from active vertical config, color pre-computed
│           ├── Cart
│           │   ├── customer pill         — opens CustomerSearch / detach
│           │   ├── CartLine  (×N)
│           │   │   ├── qty controls      — increment / decrement / remove
│           │   │   ├── staff picker      — inline chip list
│           │   │   ├── modifier picker   — inline toggleable chips (from active vertical config)
│           │   │   └── discount picker   — presets 5/10/15/20% + custom; >20% gates PIN
│           │   ├── CompModal             — 6-reason comp picker
│           │   ├── TipPicker             — presets + custom input, tip state only
│           │   └── Charge / Confirm button
│           ├── CheckoutOverlay           — full-screen, processing + receipt states
│           │   ├── processing spinner
│           │   ├── Receipt               — line items + modifier sub-rows + math + refund rows
│           │   ├── delivery buttons      — print / email / sms / none
│           │   └── CustomerSearch (post-sale attach)
│           ├── StaffSwitcher             — modal, chip list of 3 staff
│           ├── CustomerSearch            — modal, phone-first search + inline create
│           ├── ReportsOverlay            — reads from active vertical's transaction namespace
│           │   ├── summary view          — 5-stat row (Txns/Tips/Avg/Discounts/Refunds) + per-staff + list
│           │   ├── receipt detail view   — Receipt + Refund button + re-delivery buttons
│           │   └── RefundPicker          — line checkboxes + live total + 1500ms processing
│           ├── HeldTicketsModal          — per-vertical held ticket list, resume + discard
│           ├── VerticalSwitcher          — modal, Salon + Spa rows, gated when cart has items
│           ├── PinModal                  — 4-box auto-advance, any 4 digits accepted (mock)
│           └── Toast                     — fixed top-right, 1500ms auto-dismiss
```

---

## Hooks

| Hook | File | Responsibility |
|---|---|---|
| `useCart` | `hooks/useCart.ts` | Line items, customer, comp state, cart mutations, per-vertical localStorage write-through |
| `useCheckout` | `hooks/useCheckout.ts` | Checkout state machine + transaction persistence to active vertical's namespace |
| `useActiveStaff` | `hooks/useActiveStaff.ts` | Current operator identity, persisted to `nuatis-pos:activeStaffId` (shared) |
| `useManagerOverride` | `hooks/useManagerOverride.ts` | Promise-based PIN gate; `requestManagerOverride(reason)` returns `Promise<boolean>`; mock — any 4 digits accepted |
| `useActiveVertical` | `hooks/useActiveVertical.ts` | Active vertical id + full config; persisted to `nuatis-pos:activeVerticalId`; reloads cart/held on switch |

---

## State Architecture

- **`useCart`** — owns `lines: CartLine[]`, `customer`, `compApplied`, `compReason`. Every mutation immediately writes to `nuatis-pos:{verticalId}:cart`. Reloads from new namespace when `activeVerticalId` changes. Provides: `addItem`, `increment`, `decrement`, `remove`, `changeStaff`, `toggleModifier`, `setDiscount`, `applyComp`, `removeComp`, `attachCustomer`, `detachCustomer`, `loadHeld`, `clear`.
- **`useCheckout`** — owns checkout state machine and in-flight/completed transaction. Appends to `nuatis-pos:{verticalId}:transactions` (capped at 10) on delivery confirmation.
- **`useActiveStaff`** — reads/writes `nuatis-pos:activeStaffId`. Shared across all verticals. Default `STAFF[0]`.
- **`useManagerOverride`** — imperative modal pattern. `requestManagerOverride(reason)` creates a Promise, mounts `PinModal`, resolves `true` on any 4-digit entry, `false` on cancel/ESC. No prop-drilling; available to any descendant via context.
- **`useActiveVertical`** — reads/writes `nuatis-pos:activeVerticalId`. Provides `{ activeVerticalId, setActiveVerticalId, config }` where `config = VERTICALS[activeVerticalId]`. Switching triggers cart reload and held-ticket reload in `RegisterPage`.

---

## Checkout State Machine

```
         startCheckout()
  idle ──────────────────► tip
   ▲                         │
   │   cancelCheckout()      │ confirmCheckout()
   │◄────────────────────────┘
   │                         │
   │                         ▼
   │               processing ── 2000ms setTimeout ──► receipt
   │               (800ms if compApplied)                  │
   │                                                        │
   │               completeSale() ◄── completeDelivery() ──┘
   │                    │
   └────────────────────┘
         (also calls useCart.clear)
```

Transitions:
- `idle → tip`: operator taps "Charge" on non-empty cart
- `tip → idle`: operator taps "Cancel"
- `tip → processing`: operator taps "Confirm $X.XX"
- `processing → receipt`: 2000ms setTimeout (800ms if ticket is comped — no card simulation)
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
- **Charge tap** → `useCheckout.startCheckout()` → state `idle → tip`
- **Confirm Charge** → `useCheckout.confirmCheckout(data)` → state `tip → processing` → setTimeout → state `processing → receipt`
- **Refund** → `ReceiptDetail` calls `requestManagerOverride('Refund authorization')` → on approval → `RefundPicker` → `onComplete(lineIds)` → `RefundRecord` appended to transaction → localStorage updated
- **Delivery choice** → `useCheckout.completeDelivery(channel)` → append to `nuatis-pos:{verticalId}:transactions` → state `receipt → completed`
- **New Sale** → `useCart.clear()` + `useCheckout.completeSale()` → state `completed → idle`
- **Vertical switch** → `setActiveVerticalId(id)` → localStorage write → context update → `useCart` reloads from new namespace → `RegisterPage` reloads held tickets → tile grid re-renders with new vertical's services + colors

---

## Money Math

All amounts are integer cents throughout. No floating-point arithmetic.

- `calcLineTotalCents(line)` = `Math.round((priceCents + sum(modifiers[].priceCents)) × quantity × (1 − discountPercent/100))`
- Discount applied **before** tax — subtotal reflects post-discount line totals
- `calcSubtotal(lines)` = `sum(calcLineTotalCents(line))` for all lines
- `TAX_RATE` = `0.0825`
- `taxCents` = `Math.round(subtotalCents × TAX_RATE)`
- `tipCents` calculated on subtotal only (NOT subtotal + tax)
- `totalCents` = `subtotalCents + taxCents + tipCents`
- **Comp zeroing**: when `compApplied`, `taxCents = 0`, `tipCents = 0`, `totalCents = 0`; `subtotalCents` preserved on receipt for display
- **Refund tax allocation**: `taxRefundCents = Math.round((lineRefundCents / originalSubtotalCents) × originalTaxCents)` — proportional share of tax for selected lines
- **Tip never refunded** on partial or full refunds — tip is voluntary; policy enforced in `RefundPicker`
- `totalRefundCents` = `lineRefundCents + taxRefundCents`
- Per-staff revenue (reports) = sum of `calcLineTotalCents` for lines where `line.staffId === staff.id`, excluding refunded lines and comped transactions

---

## Storage Architecture

Per-vertical namespacing: `nuatis-pos:{verticalId}:{key}`

| Key pattern | Example | Scope |
|---|---|---|
| `nuatis-pos:{v}:cart` | `nuatis-pos:salon:cart` | Per-vertical |
| `nuatis-pos:{v}:transactions` | `nuatis-pos:spa:transactions` | Per-vertical |
| `nuatis-pos:{v}:heldTickets` | `nuatis-pos:salon:heldTickets` | Per-vertical |
| `nuatis-pos:activeVerticalId` | — | Shared (no prefix) |
| `nuatis-pos:activeStaffId` | — | Shared (no prefix) |

**Key helpers** (`lib/storage.ts`): `cartKey(v)`, `transactionsKey(v)`, `heldTicketsKey(v)`, `ACTIVE_VERTICAL_KEY`, `ACTIVE_STAFF_KEY`.

**Migration** (`runMigrations()` in `lib/storage.ts`):
- Runs once at module level in `App.tsx` before React renders
- Copies legacy unprefixed keys (`nuatis-pos:cart`, etc.) → `nuatis-pos:salon:*` (only if the new key doesn't already exist), then deletes the old keys
- Idempotent — re-running on subsequent boots is a no-op once legacy keys are absent
- Wrapped in try/catch; only logs to console on error

**Isolation guarantee**: switching verticals never merges or copies cart/transaction/held data across namespaces. Each vertical starts fresh or resumes its own last state.

---

## Key Library Modules

| File | Exports | Notes |
|---|---|---|
| `lib/verticals.ts` | `VerticalId`, `VerticalConfig`, `VERTICALS`, `getActiveVerticalConfig` | Central per-vertical config: services, modifiers, category colors, business identity |
| `lib/storage.ts` | `cartKey`, `transactionsKey`, `heldTicketsKey`, `ACTIVE_STAFF_KEY`, `ACTIVE_VERTICAL_KEY`, `runMigrations` | Storage key helpers + one-time migration |
| `lib/services.ts` | `SERVICES`, `Service`, `CATEGORY_COLORS`, `formatPrice`, `formatDuration` | 12 salon services; `category` is `string` (widened for multi-vertical) |
| `lib/staff.ts` | `STAFF`, `Staff` | 3 hardcoded staff members, shared across verticals |
| `lib/customers.ts` | `CUSTOMERS`, `Customer`, `CartCustomer`, `addCustomerInMemory` | 6 seed customers; `addCustomerInMemory` mutates in-memory array only (lost on reload by design) |
| `lib/modifiers.ts` | `Modifier`, `MODIFIERS_BY_SERVICE`, `getModifiersForService` | Salon modifiers only; spa modifiers defined inline in `lib/verticals.ts` |
| `lib/heldTickets.ts` | `HeldTicket`, `getHeldTickets`, `holdTicket`, `resumeTicket`, `removeHeldTicket` | All functions take `verticalId: string`; cap 5 per vertical |
| `lib/cartMath.ts` | `calcLineTotalCents`, `calcLineDiscountCents`, `calcSubtotal`, `calcTax`, `calcTip`, `calcTotal`, `TAX_RATE`, `MANAGER_DISCOUNT_THRESHOLD` | Pure functions, integer cents only |
| `lib/reports.ts` | `DailySummary`, `calcDailySummary`, `StaffSummary`, `calcPerStaffSummary` | `DailySummary` includes `discountCents` + `refundCents`; per-staff excludes refunded lines and comped transactions |
| `lib/currency.ts` | `formatCurrency` | Formats integer cents as `$X.XX` |
| `lib/phone.ts` | phone formatting utilities | Used by CustomerSearch |

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
- 2-second simulated card reader timing (800ms for comped tickets)
- Receipt as left panel + delivery buttons as right column on success overlay
- "+ Customer" pill above cart header (pre and post-sale attach)
- Active staff in header (operator), Replit user in Account dropdown (device)
- "Held: N" pill in header for queue visibility
- Manager override gate-on-upgrade-only rule (downgrades don't re-prompt)
- Refund initiated from Today's Sales receipt detail (post-sale only, not from register)
- Refund line-picker pattern with proportional tax allocation
- Per-vertical namespaced storage for engine isolation
- Vertical switcher gated when cart has items
- 4-box PIN entry with auto-advance focus

## Things to Discard (Architecture Decisions)

- localStorage for everything
- Single-file mutation patterns
- No tenant isolation
- Hardcoded business identity
- Hardcoded customer/staff lists
- 2-second `setTimeout` for "payment"
- Mock toasts for receipt delivery
- Mock 4-digit PIN acceptance
- Mock refund processing
- Vertical switcher (production locks vertical at signup per tenant config)
- Cross-namespace migration logic (one-time only, prototype scaffolding)

---

## Key Commands

```bash
pnpm run typecheck          # full typecheck across all workspace packages
pnpm --filter @workspace/nuatis-pos run dev   # start the POS frontend
pnpm --filter @workspace/api-server run dev   # start the auth API server
pnpm --filter @workspace/api-spec run codegen # regenerate API hooks from OpenAPI
pnpm --filter @workspace/db run push          # push DB schema (dev only)
```
