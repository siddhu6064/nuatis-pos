import type { Transaction } from "@/hooks/useCheckout";
import type { Staff } from "@/lib/staff";
import { calcLineTotalCents, calcLineDiscountCents } from "@/lib/cartMath";

export interface DailySummary {
  revenueCents: number;
  tipCents: number;
  count: number;
  avgTicketCents: number;
  discountCents: number;
  refundCents: number;
}

export function calcDailySummary(transactions: Transaction[]): DailySummary {
  const count = transactions.length;
  // Use totalPaid for revenue (handles deposit-applied service txs correctly).
  // Legacy records without totalPaid fall back to totalCents transparently.
  const revenueCents = transactions.reduce(
    (sum, tx) => sum + (tx.totalPaid ?? tx.totalCents),
    0,
  );
  const tipCents = transactions.reduce((sum, tx) => sum + tx.tipCents, 0);
  const avgTicketCents = count === 0 ? 0 : Math.round(revenueCents / count);
  const discountCents = transactions.reduce(
    (sum, tx) =>
      sum +
      tx.lineItems.reduce((s, line) => s + calcLineDiscountCents(line), 0),
    0,
  );
  const refundCents = transactions.reduce(
    (sum, tx) => sum + (tx.refundedTotalCents ?? 0),
    0,
  );
  return {
    revenueCents,
    tipCents,
    count,
    avgTicketCents,
    discountCents,
    refundCents,
  };
}

export interface StaffSummary {
  staffId: string;
  firstName: string;
  role: string;
  revenueCents: number;
  txCount: number;
}

export function calcPerStaffSummary(
  transactions: Transaction[],
  staffList: Staff[],
): StaffSummary[] {
  // Exclude deposit transactions — their synthetic lines have staffId="" and
  // are already excluded from per-staff matching, but we filter explicitly too.
  const serviceTxs = transactions.filter(
    (tx) => (tx.type ?? "service") === "service",
  );

  return staffList.map((staff) => {
    const txCount = serviceTxs.filter((tx) =>
      tx.lineItems.some((line) => line.staffId === staff.id),
    ).length;

    const revenueCents = serviceTxs.reduce((sum, tx) => {
      if (tx.compApplied) return sum;

      const refundedLineIds = new Set(
        (tx.refunds ?? []).flatMap((r) => r.lineIds),
      );

      return (
        sum +
        tx.lineItems
          .filter((line) => line.staffId === staff.id)
          .reduce((s, line) => {
            if (refundedLineIds.has(line.lineId)) return s;
            return s + calcLineTotalCents(line);
          }, 0)
      );
    }, 0);

    return {
      staffId: staff.id,
      firstName: staff.firstName,
      role: staff.role,
      revenueCents,
      txCount,
    };
  });
}
