export const CASH_TENDER_CAP = 999999; // $9,999.99 in cents

export function appendCashDigit(tendered: number, digit: number): number {
  const next = tendered * 10 + digit;
  return next > CASH_TENDER_CAP ? tendered : next;
}

export function appendDoubleCashZero(tendered: number): number {
  const next = tendered * 100;
  return next > CASH_TENDER_CAP ? tendered : next;
}

export function backspaceCashDigit(tendered: number): number {
  return Math.floor(tendered / 10);
}

/**
 * Returns [exactCents, ...roundUpCents] deduped and sorted ascending.
 * Capped at 6 entries. Round-up amounts are the next strict multiple of
 * $5, $10, $20, $50, $100 above totalCents.
 *
 * Example: $42.30 → [4230, 4500, 5000, 6000, 10000]
 *                   Exact $42.30 / $45 / $50 / $60 / $100
 */
export function computeQuickTenders(totalCents: number): number[] {
  const result: number[] = [totalCents];
  const roundUnits = [500, 1000, 2000, 5000, 10000];

  for (const unit of roundUnits) {
    if (result.length >= 6) break;
    // Next strict multiple of unit above totalCents
    const rounded = Math.floor(totalCents / unit) * unit + unit;
    if (!result.includes(rounded)) {
      result.push(rounded);
    }
  }

  return result;
}
