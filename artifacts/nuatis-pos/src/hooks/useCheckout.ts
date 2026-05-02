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

export interface Transaction {
  id: string;
  lineItems: CartLine[];
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
  paymentMethod: "card" | "cash";
  amountTendered?: number;
  changeGiven?: number;
  completedAt: string;
  customer: CartCustomer | null;
  receiptDelivery?: "print" | "email" | "sms" | "none";
  receiptDestination?: string;
  compApplied: boolean;
  compReason: string | null;
  refunds?: RefundRecord[];
  refundedTotalCents?: number;
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
  paymentMethod?: "card" | "cash";
  amountTendered?: number;
  changeGiven?: number;
}

function appendTransaction(tx: Transaction, verticalId: string): void {
  try {
    const key = transactionsKey(verticalId);
    const raw = localStorage.getItem(key);
    const existing: Transaction[] = raw
      ? (JSON.parse(raw) as Transaction[])
      : [];
    const updated = [...existing, tx].slice(-10);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // silent fail
  }
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

    if (method === "cash") {
      // Cash: skip card reader simulation, go directly to receipt
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
      };
      setCompletedTx(tx);
      setState("receipt");
      return;
    }

    // Card: existing 2-sec reader simulation
    setProcessingTotalCents(data.totalCents);
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
