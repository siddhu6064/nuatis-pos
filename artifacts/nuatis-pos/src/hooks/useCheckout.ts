import { useState, useCallback, useRef, useEffect } from "react";
import type { CartLine, CartCustomer } from "@/hooks/useCart";
import { transactionsKey } from "@/lib/storage";
import { useActiveVertical } from "@/hooks/useActiveVertical";

export type CheckoutState =
  | "idle"
  | "tip"
  | "processing"
  | "receipt"
  | "completed";

export interface RefundRecord {
  id: string;
  refundedAt: string;
  lineIds: string[];
  lineRefundCents: number;
  taxRefundCents: number;
  totalRefundCents: number;
  managerOverride: boolean;
}

// B20: Split-tender payment leg (B24: mockLast4 added for card legs)
export interface SplitPayment {
  method: "card" | "cash";
  amountCents: number;
  processedAt: number; // Date.now() at the moment that leg settled
  // Card-only
  mockLast4?: string;  // 4-digit string generated at capture time, stored on leg
  // Cash-only
  tenderedCents?: number;
  changeCents?: number;
}

export interface Transaction {
  id: string;
  lineItems: CartLine[];
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
  paymentMethod: "card" | "cash" | "split";
  amountTendered?: number;
  changeGiven?: number;
  // B20: split-tender payments array (only when paymentMethod === 'split')
  payments?: SplitPayment[];
  completedAt: string;
  customer: CartCustomer | null;
  receiptDelivery?: "print" | "email" | "sms" | "none";
  receiptDestination?: string;
  compApplied: boolean;
  compReason: string | null;
  refunds?: RefundRecord[];
  refundedTotalCents?: number;
  // Extended fields (B19)
  type?: "service" | "deposit";       // default 'service' on legacy read
  depositApplied?: number;            // cents credited from prior deposit
  appointmentRef?: string;            // links to appointment.id
  totalPaid?: number;                 // actual cash that changed hands
  depositBalanceDueCents?: number;    // only on type='deposit': servicePriceCents - depositAmountCents
  // B26: shift stamp — shiftId of the open shift at transaction write time
  shiftId?: string;
  // B27: open ticket link — id of the OpenTicket completed in this transaction
  openTicketId?: string;
  // B29: class slot link — id of the ClassSlot booked in this transaction
  classSlotId?: string;
  // B32: pack purchase — id of the PackBalance created by this transaction
  packPurchaseId?: string;
}

export interface ConfirmData {
  lineItems: CartLine[];
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
  customer: CartCustomer | null;
  compApplied: boolean;
  compReason: string | null;
  paymentMethod?: "card" | "cash" | "split";
  amountTendered?: number;
  changeGiven?: number;
  depositApplied?: number;
  appointmentRef?: string;
  // B20: split-tender
  splitPayments?: SplitPayment[];
  // B26: shift stamp
  shiftId?: string;
  // B27: open ticket link
  openTicketId?: string;
  // B29: class slot link
  classSlotId?: string;
  // B32: pack purchase id to stamp on transaction
  packPurchaseId?: string;
}

function appendTransaction(tx: Transaction, verticalId: string): void {
  try {
    const key = transactionsKey(verticalId);
    const raw = localStorage.getItem(key);
    const existing: Transaction[] = raw
      ? (JSON.parse(raw) as Transaction[])
      : [];
    const updated = [...existing, tx].slice(-50);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // silent fail
  }
}

// ─── Module-level utility: append without going through checkout state machine ─

export function addTransactionDirect(verticalId: string, tx: Transaction): void {
  appendTransaction(tx, verticalId);
}

export function useCheckout(onComplete: () => void) {
  const { activeVerticalId } = useActiveVertical();
  const verticalIdRef = useRef(activeVerticalId);
  useEffect(() => {
    verticalIdRef.current = activeVerticalId;
  }, [activeVerticalId]);

  const [state, setState] = useState<CheckoutState>("idle");
  const [tipCents, setTipCents] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);
  const [processingTotalCents, setProcessingTotalCents] = useState(0);

  const startCheckout = useCallback(() => {
    setTipCents(0);
    setSelectedPreset(null);
    setState("tip");
  }, []);

  const cancelCheckout = useCallback(() => {
    setTipCents(0);
    setSelectedPreset(null);
    setState("idle");
  }, []);

  const selectPreset = useCallback(
    (preset: string, subtotalCents: number) => {
      setSelectedPreset(preset);
      if (preset === "none") {
        setTipCents(0);
      } else if (preset === "custom") {
        // tipCents stays at current value until Apply
      } else {
        const pct = parseInt(preset, 10);
        setTipCents(Math.round(subtotalCents * (pct / 100)));
      }
    },
    [],
  );

  const applyCustomTip = useCallback((cents: number) => {
    setTipCents(cents);
  }, []);

  const confirmCheckout = useCallback((data: ConfirmData) => {
    const method = data.paymentMethod ?? "card";
    const depositApplied = data.depositApplied ?? 0;
    const totalPaid = Math.max(0, data.totalCents - depositApplied);

    if (method === "split") {
      // Card was already charged and cash already tendered inside SplitTenderModal.
      // Sum of splitPayments.amountCents is the actual revenue (change excluded).
      const payments = data.splitPayments ?? [];
      const splitTotalPaid = payments.reduce((s, p) => s + p.amountCents, 0);
      const tx: Transaction = {
        id: crypto.randomUUID(),
        lineItems: data.lineItems,
        subtotalCents: data.subtotalCents,
        taxCents: data.taxCents,
        tipCents: data.tipCents,
        totalCents: data.totalCents,
        paymentMethod: "split",
        payments,
        completedAt: new Date().toISOString(),
        customer: data.customer,
        compApplied: data.compApplied,
        compReason: data.compReason,
        type: "service",
        totalPaid: depositApplied > 0 ? splitTotalPaid : totalPaid,
        ...(depositApplied > 0 && { depositApplied }),
        ...(data.appointmentRef && { appointmentRef: data.appointmentRef }),
        ...(data.shiftId && { shiftId: data.shiftId }),
        ...(data.openTicketId && { openTicketId: data.openTicketId }),
        ...(data.classSlotId && { classSlotId: data.classSlotId }),
        ...(data.packPurchaseId && { packPurchaseId: data.packPurchaseId }),
      };
      setProcessingTotalCents(tx.totalPaid ?? totalPaid);
      setCompletedTx(tx);
      setState("receipt");
      return;
    }

    if (method === "cash") {
      const tx: Transaction = {
        id: crypto.randomUUID(),
        lineItems: data.lineItems,
        subtotalCents: data.subtotalCents,
        taxCents: data.taxCents,
        tipCents: data.tipCents,
        totalCents: data.totalCents,
        paymentMethod: "cash",
        amountTendered: data.amountTendered,
        changeGiven: data.changeGiven,
        completedAt: new Date().toISOString(),
        customer: data.customer,
        compApplied: data.compApplied,
        compReason: data.compReason,
        type: "service",
        totalPaid,
        ...(depositApplied > 0 && { depositApplied }),
        ...(data.appointmentRef && { appointmentRef: data.appointmentRef }),
        ...(data.shiftId && { shiftId: data.shiftId }),
        ...(data.openTicketId && { openTicketId: data.openTicketId }),
        ...(data.classSlotId && { classSlotId: data.classSlotId }),
        ...(data.packPurchaseId && { packPurchaseId: data.packPurchaseId }),
      };
      setCompletedTx(tx);
      setState("receipt");
      return;
    }

    // Card: 2-sec reader simulation
    setProcessingTotalCents(totalPaid);
    setState("processing");
    const delay = data.compApplied ? 800 : 2000;
    setTimeout(() => {
      const tx: Transaction = {
        id: crypto.randomUUID(),
        lineItems: data.lineItems,
        subtotalCents: data.subtotalCents,
        taxCents: data.taxCents,
        tipCents: data.tipCents,
        totalCents: data.totalCents,
        paymentMethod: "card",
        completedAt: new Date().toISOString(),
        customer: data.customer,
        compApplied: data.compApplied,
        compReason: data.compReason,
        type: "service",
        totalPaid,
        ...(depositApplied > 0 && { depositApplied }),
        ...(data.appointmentRef && { appointmentRef: data.appointmentRef }),
        ...(data.shiftId && { shiftId: data.shiftId }),
        ...(data.openTicketId && { openTicketId: data.openTicketId }),
        ...(data.classSlotId && { classSlotId: data.classSlotId }),
        ...(data.packPurchaseId && { packPurchaseId: data.packPurchaseId }),
      };
      setCompletedTx(tx);
      setState("receipt");
    }, delay);
  }, []);

  const attachCustomerPostSale = useCallback((c: CartCustomer) => {
    setCompletedTx((prev) => (prev ? { ...prev, customer: c } : prev));
  }, []);

  const completeDelivery = useCallback(
    (delivery: "print" | "email" | "sms" | "none", destination?: string) => {
      setCompletedTx((prev) => {
        if (!prev) return prev;
        const updated: Transaction = {
          ...prev,
          receiptDelivery: delivery,
          receiptDestination: destination,
        };
        appendTransaction(updated, verticalIdRef.current);
        return updated;
      });
      setState("completed");
    },
    [],
  );

  const completeSale = useCallback(() => {
    onComplete();
    setTipCents(0);
    setSelectedPreset(null);
    setCompletedTx(null);
    setProcessingTotalCents(0);
    setState("idle");
  }, [onComplete]);

  return {
    state,
    tipCents,
    selectedPreset,
    completedTx,
    processingTotalCents,
    startCheckout,
    cancelCheckout,
    selectPreset,
    applyCustomTip,
    confirmCheckout,
    attachCustomerPostSale,
    completeDelivery,
    completeSale,
  };
}
