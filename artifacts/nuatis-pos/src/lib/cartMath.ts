import type { CartLine } from "@/hooks/useCart";

export const TAX_RATE = 0.0825;

// Discounts above this percentage require manager override (PIN)
export const MANAGER_DISCOUNT_THRESHOLD = 20;

export function calcLineTotalCents(line: CartLine): number {
  const modifierTotal = (line.modifiers ?? []).reduce(
    (s, m) => s + m.priceCents,
    0,
  );
  const preDiscount = (line.priceCents + modifierTotal) * line.quantity;
  const discount = line.discountPercent ?? 0;
  if (discount === 0) return preDiscount;
  return Math.round(preDiscount * (1 - discount / 100));
}

export function calcLineDiscountCents(line: CartLine): number {
  const modifierTotal = (line.modifiers ?? []).reduce(
    (s, m) => s + m.priceCents,
    0,
  );
  const preDiscount = (line.priceCents + modifierTotal) * line.quantity;
  const discount = line.discountPercent ?? 0;
  if (discount === 0) return 0;
  const postDiscount = Math.round(preDiscount * (1 - discount / 100));
  return preDiscount - postDiscount;
}

export function calcSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + calcLineTotalCents(line), 0);
}

export function calcTax(subtotalCents: number): number {
  return Math.round(subtotalCents * TAX_RATE);
}

export function calcTaxWithRate(
  subtotalCents: number,
  ratePercent: number,
): number {
  return Math.round(subtotalCents * (ratePercent / 100));
}

export function calcTip(subtotalCents: number, percent: number): number {
  return Math.round(subtotalCents * (percent / 100));
}

export function calcTotal(
  subtotalCents: number,
  taxCents: number,
  tipCents = 0,
): number {
  return subtotalCents + taxCents + tipCents;
}
