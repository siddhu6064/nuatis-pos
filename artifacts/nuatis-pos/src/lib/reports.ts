import type { Transaction } from "@/hooks/useCheckout";
import type { Staff } from "@/lib/staff";

export interface DailySummary {
  revenueCents: number;
  tipCents: number;
  count: number;
  avgTicketCents: number;
}

export function calcDailySummary(transactions: Transaction[]): DailySummary {
  const count = transactions.length;
  const revenueCents = transactions.reduce((sum, tx) => sum + tx.totalCents, 0);
  const tipCents = transactions.reduce((sum, tx) => sum + tx.tipCents, 0);
  const avgTicketCents = count === 0 ? 0 : Math.round(revenueCents / count);
  return { revenueCents, tipCents, count, avgTicketCents };
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
  return staffList.map((staff) => {
    const txCount = transactions.filter((tx) =>
      tx.lineItems.some((line) => line.staffId === staff.id),
    ).length;
    const revenueCents = transactions.reduce(
      (sum, tx) =>
        sum +
        tx.lineItems
          .filter((line) => line.staffId === staff.id)
          .reduce((s, line) => s + line.priceCents * line.quantity, 0),
      0,
    );
    return {
      staffId: staff.id,
      firstName: staff.firstName,
      role: staff.role,
      revenueCents,
      txCount,
    };
  });
}
