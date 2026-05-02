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
├── LoginPage                         — Replit Auth sign-in screen
└── RegisterPage                      — main wiring of all state
    ├── Header
    │   ├── brand + "Held: N" pill    — held ticket count, gated on idle
    │   ├── "Today's Sales" link      — opens ReportsOverlay, gated on idle
    │   ├── live clock (useClock)
    │   ├── active staff + Switch     — opens StaffSwitcher
    │   └── Account dropdown          — Replit user email + logout
    ├── ServiceTile  (×12)            — grid, onTap → useCart.addItem
    ├── Cart
    │   ├── customer pill             — opens CustomerSearch / detach
    │   ├── CartLine  (×N)
    │   │   ├── qty controls          — increment / decrement / remove
    │   │   ├── staff picker          — inline chip list
    │   │   └── modifier picker       — inline toggleable chips (per-service)
    │   ├── TipPicker                 — presets + custom input, tip state only
    │   └── Charge / Confirm button
    ├── CheckoutOverlay               — full-screen, processing + receipt states
    │   ├── processing spinner
    │   ├── Receipt                   — line items + modifier sub-rows + math
    │   ├── delivery buttons          — print / email / sms / none
    │   └── CustomerSearch (post-sale attach)
    ├── StaffSwitcher                 — modal, chip list of 3 staff
    ├── CustomerSearch                — modal, phone-first search + inline create
    ├── ReportsOverlay                — fixed overlay, summary + receipt detail
    │   ├── summary view              — daily stats + per-staff + transaction list
    │   └── receipt detail view       — Receipt + re-delivery buttons
    ├── HeldTicketsModal              — held ticket list, resume + discard
    └── Toast                        — fixed top-right, 1500ms auto-dismiss
```

### Unused scaffolded components (`components/ui/`)

The Vite template included a full shadcn/ui component library. None of the `ui/` components are used in this prototype — all UI is hand-authored inline. They can be deleted before any production fork.

---

## Hooks

| Hook | File | Responsibility |
|---|---|---|
| `useCart` | `hooks/useCart.ts` | Line items, customer, cart mutations, localStorage write-through |
| `useCheckout` | `hooks/useCheckout.ts` | Checkout state machine + transaction persistence |
| `useActiveStaff` | `hooks/useActiveStaff.ts` | Current operator identity, persisted to localStorage |

---

## State Architecture

- **`useCart`** — owns `lines: CartLine[]` + `customer: CartCustomer | null`. Every mutation immediately writes to `nuatis-pos:cart`. Provides: `addItem`, `increment`, `decrement`, `remove`, `changeStaff`, `toggleModifier`, `attachCustomer`, `detachCustomer`, `loadHeld`, `clear`.
- **`useCheckout`** — owns the checkout state machine and the in-flight/completed transaction. Appends to `nuatis-pos:transactions` (capped at 10) on delivery confirmation.
- **`useActiveStaff`** — reads/writes `nuatis-pos:activeStaffId`. Default is `STAFF[0]`. Active staff is the default `staffId` on new cart lines; NOT restored on hold resume (per-line staffIds are restored instead).

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
   │                     processing  ── 2000ms setTimeout ──►  receipt
   │                                                               │
   │                     completeSale() ◄── completeDelivery() ───┘
   │                          │
   └──────────────────────────┘
         (also calls useCart.clear)
```

Transitions:
- `idle → tip`: operator taps "Charge" on non-empty cart
- `tip → idle`: operator taps "Cancel"
- `tip → processing`: operator taps "Confirm $X.XX"
- `processing → receipt`: 2000ms setTimeout resolves
- `receipt → completed`: operator selects delivery channel
- `completed → idle`: operator taps "New Sale" (`completeSale`)

---

## Data Flow

- **Tile tap** → `useCart.addItem(serviceId, name, priceCents, activeStaffId)` → dedupe check (same service + staff + no modifiers = increment; else new line) → state update → localStorage write → re-render
- **Modifier toggle** → `useCart.toggleModifier(lineId, modifier)` → splice in/out of `line.modifiers` → state update → localStorage write → subtotal recalculates immediately
- **Hold** → snapshot `{ id, heldAt, customer, lineItems }` → `holdTicket()` → `useCart.clear()` → "Ticket held" toast → "Held: N" pill updates
- **Resume** → `resumeTicket(id)` → `useCart.loadHeld(lineItems, customer)` → modal closes
- **Charge tap** → `useCheckout.startCheckout()` → state `idle → tip`
- **Confirm Charge** → `useCheckout.confirmCheckout(data)` → state `tip → processing` → 2000ms `setTimeout` → state `processing → receipt`
- **Delivery choice** → `useCheckout.completeDelivery(channel)` → append to `nuatis-pos:transactions` → state `receipt → completed`
- **New Sale** → `useCart.clear()` + `useCheckout.completeSale()` → state `completed → idle`

---

## Money Math

All amounts are integer cents throughout. No floating-point arithmetic.

- `calcLineTotalCents(line)` = `(line.priceCents + sum(line.modifiers[].priceCents)) × line.quantity`
- `calcSubtotal(lines)` = `sum(calcLineTotalCents(line))` for all lines
- `TAX_RATE` = `0.0825`
- `taxCents` = `Math.round(subtotalCents × TAX_RATE)`
- `tipCents` calculated on subtotal only (NOT subtotal + tax)
- `totalCents` = `subtotalCents + taxCents + tipCents`
- Per-staff revenue (reports) = sum of `calcLineTotalCents` for lines where `line.staffId === staff.id` — no tax or tip allocation

---

## Key Library Modules

| File | Exports | Notes |
|---|---|---|
| `lib/services.ts` | `SERVICES`, `Service`, `CATEGORY_COLORS`, `formatPrice`, `formatDuration` | 12 hardcoded salon services |
| `lib/staff.ts` | `STAFF`, `Staff` | 3 hardcoded staff members |
| `lib/customers.ts` | `CUSTOMERS`, `Customer`, `CartCustomer`, `addCustomerInMemory` | 6 seed customers; `addCustomerInMemory` mutates in-memory array only (lost on reload by design) |
| `lib/modifiers.ts` | `Modifier`, `MODIFIERS_BY_SERVICE`, `getModifiersForService` | 5 services have modifiers; others return `[]` |
| `lib/heldTickets.ts` | `HeldTicket`, `getHeldTickets`, `holdTicket`, `resumeTicket`, `removeHeldTicket` | Cap 5; persisted to `nuatis-pos:heldTickets` |
| `lib/cartMath.ts` | `calcLineTotalCents`, `calcSubtotal`, `calcTax`, `calcTip`, `calcTotal`, `TAX_RATE` | Pure functions, integer cents only |
| `lib/reports.ts` | `DailySummary`, `calcDailySummary`, `StaffSummary`, `calcPerStaffSummary` | Pure functions; caller filters by date before passing |
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
- 2-second simulated card reader timing
- Receipt as left panel + delivery buttons as right column on success overlay
- "+ Customer" pill above cart header (pre and post-sale attach)
- Active staff in header (operator), Replit user in Account dropdown (device)
- "Held: N" pill in header for queue visibility

## Things to Discard (Architecture Decisions)

- localStorage for everything
- Single-file mutation patterns
- No tenant isolation
- Hardcoded business identity
- Hardcoded customer/staff lists
- 2-second `setTimeout` for "payment"
- Mock toasts for receipt delivery

---

## Key Commands

```bash
pnpm run typecheck          # full typecheck across all workspace packages
pnpm --filter @workspace/nuatis-pos run dev   # start the POS frontend
pnpm --filter @workspace/api-server run dev   # start the auth API server
pnpm --filter @workspace/api-spec run codegen # regenerate API hooks from OpenAPI
pnpm --filter @workspace/db run push          # push DB schema (dev only)
```
