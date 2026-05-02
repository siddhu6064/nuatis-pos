import type { CartLine } from "@/hooks/useCart";

export const TAX_RATE = 0.0825;

export function calcLineTotalCents(line: CartLine): number {
  const modifierTotal = (line.modifiers ?? []).reduce(
    (s, m) => s + m.priceCents,
    0,
  );
  return (line.priceCents + modifierTotal) * line.quantity;
}

export function calcSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + calcLineTotalCents(line), 0);
}

export function calcTax(subtotalCents: number): number {
  return Math.round(subtotalCents * TAX_RATE);
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
