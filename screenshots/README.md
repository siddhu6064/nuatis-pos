# Nuatis POS — Screenshot Capture Checklist

> Manual capture step — not performed by Replit Agent. Capture at 1024×768 (iPad portrait) after prototype is stable at tag v0.0.11-prototype.
>
> Each item below is one intended screenshot. Check off after capture. File naming convention: `{slug}.png`, stored in this directory.

---

## Register Grid (per vertical)

- [ ] `register-salon.png` — Salon tile grid (12 tiles, pink/cream/lavender/peach category colors); cart empty; "Salon" vertical pill in header
- [ ] `register-spa.png` — Spa tile grid; cart empty; "Spa" vertical pill
- [ ] `register-nail-bar.png` — Nail Bar tile grid; cart empty; "Nail Bar" vertical pill
- [ ] `register-tattoo.png` — Tattoo tile grid; cart empty; "Tattoo" vertical pill; DEP REQ badge visible on at least one appointment in the Appts overlay (open overlay for the shot)
- [ ] `register-pet-grooming.png` — Pet Grooming tile grid; cart empty; "Pet Grooming" vertical pill
- [ ] `register-tanning.png` — Tanning tile grid; bed occupancy indicators visible on at least one bed; "Tanning" vertical pill
- [ ] `register-laundry.png` — Laundry tile grid; 12 services in muted blue + bronze palette; cart empty; "Laundry" vertical pill; "Open: N" header pill visible
- [ ] `register-yoga.png` — Yoga & Pilates tile grid; sage-green / cream palette; cart empty; "Yoga & Pilates" vertical pill; "Classes: N" sage-green header pill visible (N = total enrolled across all slots at seed = 32)

---

## Cart States

- [ ] `cart-with-lines.png` — Cart with 2–3 service lines, customer attached, tip selected, subtotal/tax/total row visible; no special wrinkle active
- [ ] `cart-tanning-session.png` — Tanning vertical; cart with an active session line showing elapsed-tick counter (e.g. "0:47 elapsed"); session minutes and bed label visible on the line
- [ ] `cart-vaccination-blocked.png` — Pet Grooming vertical; cart with a service line; red vaccination-blocked banner visible above the cart footer; Charge button disabled or gated
- [ ] `cart-vaccination-warning.png` — Pet Grooming vertical; cart with a service line; amber vaccination-warning banner visible (within-30-day expiry); Charge button accessible
- [ ] `cart-deposit-banner.png` — Tattoo vertical; cart hydrated from an appointment with a completed deposit; deposit-credit banner visible ("Deposit applied: −$X.XX"); balance-due amount visible in total row
- [ ] `cart-drop-off-mode.png` — Laundry vertical; cart with 2–3 services; "Drop-Off Mode" label visible in cart header; customer attached (required for drop-off); Charge button shows "Drop Off" label
- [ ] `cart-class-booking-banner.png` — Yoga & Pilates vertical; cart hydrated via class booking flow; sage-green 🧘 class booking banner visible above line items showing class time and name (e.g. "Class booking · 12:00 PM · Power Yoga"); member attached

---

## Payment Flows

- [ ] `split-modal-midflow.png` — SplitTenderModal open; 3 legs already captured in the running ledger (e.g. CARD $40.00 ****2847, CARD $25.00 ****5391, CASH $15.00 Tndr $20.00 · Chg $5.00); remaining amount showing 4th leg composition in progress
- [ ] `split-modal-void-disclaimer.png` — SplitTenderModal cancel overlay; void-disclaimer visible listing 2 captured card legs with amounts and `****XXXX` last4s; "Yes, Cancel" and "Keep Going" buttons visible
- [ ] `cash-tender-modal.png` — CashTenderModal open; quick-tender row showing Exact + round-up suggestions; tendered amount entered; "Change due: $X.XX" label visible in green
- [ ] `split-complete-receipt.png` — CheckoutOverlay receipt state after a 3-leg split; receipt shows each payment leg (2× card with last4, 1× cash with tendered/change); SPLIT badge visible

---

## Vaccination Gate Flow

- [ ] `vaccination-pin-override.png` — Manager PIN modal open, triggered by vaccination-blocked gate; reason text visible ("Vaccination override required"); 4-box PIN entry visible
- [ ] `vaccination-override-confirmed.png` — Cart line after manager PIN accepted; line shows `vaccinationOverride` indicator; red blocked banner cleared

---

## Shift State Flow (B26)

- [ ] `shift-open-header.png` — Header with an open shift; shift pill showing elapsed duration (e.g. "Shift · 1h 23m"); active staff name visible adjacent to pill
- [ ] `start-shift-modal.png` — StartShiftModal open; active staff selector visible; starting cash float keypad displayed; "Open Shift" confirm button visible
- [ ] `end-shift-modal.png` — EndShiftModal open; shift summary visible — refund-adjusted gross, payment mix (Card / Cash / Split breakdown), transaction count; "Close Shift" confirm button visible
- [ ] `shift-no-shift-pill.png` — Header with no open shift; "No shift open" pill state visible; Charge button in cart disabled with tooltip indicating shift required

---

## Drop-Off / Pickup Flow (B27)

- [ ] `drop-off-success-overlay.png` — DropOffSuccessOverlay shown immediately after drop-off; LAUN-0001 tag number displayed prominently; service summary visible; customer name shown
- [ ] `open-tickets-overlay.png` — OpenTicketsOverlay open; at least one IN PROGRESS (amber badge) and one READY (green badge) ticket visible; "Mark Ready" and "Pick Up" buttons visible on respective tickets; "Open: N" pill visible in header behind overlay
- [ ] `open-tickets-switch-confirm.png` — Switch-confirmation banner inside OpenTicketsOverlay; shown when operator taps "Pick Up" — confirms switching the cart to pickup mode for the selected ticket
- [ ] `pickup-cart-banner.png` — Cart in pickup mode; banner at top showing "Returning Customer Pickup" or equivalent pickup-mode label; "Return to In Progress" button visible in banner; cart lines pre-filled from the original drop-off ticket

---

## Class Enrollment Flow (B29)

- [ ] `classes-overlay-all-slots.png` — ClassesOverlay open (right-drawer); all 6 seed slots visible with distinct capacity badge colors: green (partial/empty), amber (near-capacity — 8/10 Yin Yoga), red FULL (Hot Yoga 12/12); "Classes: N" sage-green pill visible in header; Book button disabled on the FULL slot
- [ ] `classes-overlay-roster-expanded.png` — ClassesOverlay with one slot expanded showing enrolled member roster (names + enrolled-time labels); Cancel button visible on at least one enrollment row; slot with 3+ enrollments preferred for this shot
- [ ] `classes-capacity-full-state.png` — ClassesOverlay focused on a full slot (Hot Yoga 12/12); red FULL badge visible; Book button visibly disabled (greyed out) with tooltip or label indicating class is full; capacity count showing 12/12
- [ ] `classes-header-pill.png` — Header showing "Classes: N" sage-green pill (N = total enrolled across all 6 slots = 32 at seed); Classes pill positioned in the header pill row alongside Waitlist / Appts / Open Tickets pills; no other overlay open
- [ ] `classes-cart-booking-banner.png` — Cart after completing class booking flow; 🧘 sage-green banner above line items confirming class time and service name; member name visible in customer pill; service line showing class service price
- [ ] `classes-customer-search-yoga.png` — CustomerSearch modal open in yoga mode (triggered from ClassesOverlay Book flow); "Yoga & Pilates" sage-green badge visible in header of modal; member list showing seeded yoga customers; "Member phone or name" placeholder visible
- [ ] `classes-6way-mutex.png` — ClassesOverlay open with all other overlays (Waitlist, Appointments, Today's Sales, Open Tickets) visibly closed; demonstrates 6-way overlay mutex — only Classes surface open at once
- [ ] `classes-capacity-race-toast.png` — (capture if reproducible in two-tab scenario) Toast visible reading "Class is full — booking cancelled" after capacity race condition: slot became full between CustomerSearch open and customer selection

---

## Overlay Surfaces

- [ ] `todays-sales-summary.png` — Today's Sales (ReportsOverlay) summary view; 5-stat row (Gross, Discounts, Refunds, Net, Transactions) visible; per-staff table visible; at least one SPLIT badge and one DEPOSIT badge in the transaction list
- [ ] `todays-sales-receipt-detail.png` — ReportsOverlay with a split transaction's receipt detail open; RefundPicker line checkboxes visible
- [ ] `settings-business-tab.png` — SettingsOverlay Business tab; business name/address/phone inputs; live receipt preview panel on the right
- [ ] `settings-tax-tips-tab.png` — SettingsOverlay Tax & Tips tab; tax rate input; tip preset CRUD row visible
- [ ] `settings-staff-tab.png` — SettingsOverlay Staff tab; staff rows with active/deactivate/delete controls; "Add Staff" button visible

---

## Queue and Appointment Surfaces

- [ ] `waitlist-overlay.png` — WaitlistOverlay open; 2–3 walk-in entries in FIFO order; "Start Service" button on at least one entry; "Waitlist: N" pill visible in header behind overlay
- [ ] `appointments-upcoming.png` — AppointmentsOverlay Upcoming tab; 3–4 appointments with status badges (scheduled, started, DEP REQ, DEP PAID); "Start Service" / "Take Deposit" buttons visible
- [ ] `appointments-hydrate.png` — RegisterPage after tapping "Start Service" on an appointment; cart pre-filled with the appointment's service and customer; deposit banner visible if appointment had a deposit

---

## Vertical Switcher

- [ ] `vertical-switcher.png` — VerticalSwitcher modal open; all 8 verticals visible (Salon, Spa, Nail Bar, Tattoo, Pet Grooming, Tanning, Laundry, Yoga & Pilates); active vertical highlighted; cart-has-items gate note visible if cart is non-empty

---

## Manager PIN

- [ ] `pin-modal-discount.png` — Manager PIN modal triggered by a >20% discount; reason text "Discount above 20% threshold" visible; 4-box entry at various fill states

---

> **Total intended captures: 45**
>
> Capture order suggestion: verticals (8) → cart states (7) → payment flows (4) → vaccination gate (2) → shift state (4) → drop-off/pickup (4) → class enrollment (8) → overlays (5) → queues/appointments (3) → switcher (1) → PIN (1).
