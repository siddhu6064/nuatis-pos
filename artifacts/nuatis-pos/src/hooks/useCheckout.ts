import { useState, useCallback } from "react";
import type { CartLine, CartCustomer } from "@/hooks/useCart";

export type CheckoutState =
  | "idle"
  | "tip"
  | "processing"
  | "receipt"
  | "completed";

export interface Transaction {
  id: string;
  lineItems: CartLine[];
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
  paymentMethod: "card";
  completedAt: string;
  customer: CartCustomer | null;
  receiptDelivery?: "print" | "email" | "sms" | "none";
  receiptDestination?: string;
  compApplied: boolean;
  compReason: string | null;
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
}

const TRANSACTIONS_KEY = "nuatis-pos:transactions";

function appendTransaction(tx: Transaction): void {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    const existing: Transaction[] = raw
      ? (JSON.parse(raw) as Transaction[])
      : [];
    const updated = [...existing, tx].slice(-10);
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));
  } catch {
    // silent fail
  }
}

export function useCheckout(onComplete: () => void) {
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
    setProcessingTotalCents(data.totalCents);
    setState("processing");
    // Comped tickets skip the full card-read simulation — 800ms instead of 2000ms
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
        appendTransaction(updated);
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
