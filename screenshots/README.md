# Nuatis POS — Screenshot Capture Checklist

> Manual capture step — not performed by Replit Agent. Capture at 1024×768 (iPad portrait) after prototype is stable at tag v0.0.7-prototype.
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

---

## Cart States

- [ ] `cart-with-lines.png` — Cart with 2–3 service lines, customer attached, tip selected, subtotal/tax/total row visible; no special wrinkle active
- [ ] `cart-tanning-session.png` — Tanning vertical; cart with an active session line showing elapsed-tick counter (e.g. "0:47 elapsed"); session minutes and bed label visible on the line
- [ ] `cart-vaccination-blocked.png` — Pet Grooming vertical; cart with a service line; red vaccination-blocked banner visible above the cart footer; Charge button disabled or gated
- [ ] `cart-vaccination-warning.png` — Pet Grooming vertical; cart with a service line; amber vaccination-warning banner visible (within-30-day expiry); Charge button accessible
- [ ] `cart-deposit-banner.png` — Tattoo vertical; cart hydrated from an appointment with a completed deposit; deposit-credit banner visible ("Deposit applied: −$X.XX"); balance-due amount visible in total row

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

- [ ] `vertical-switcher.png` — VerticalSwitcher modal open; all 6 verticals visible (Salon, Spa, Nail Bar, Tattoo, Pet Grooming, Tanning); active vertical highlighted; cart-has-items gate note visible if cart is non-empty

---

## Manager PIN

- [ ] `pin-modal-discount.png` — Manager PIN modal triggered by a >20% discount; reason text "Discount above 20% threshold" visible; 4-box entry at various fill states

---

> **Total intended captures: 26**
>
> Capture order suggestion: verticals (6) → cart states (5) → payment flows (4) → vaccination gate (2) → overlays (5) → queues/appointments (3) → switcher (1) → PIN (1).
