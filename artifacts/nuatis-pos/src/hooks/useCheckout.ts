import { useState, useCallback } from "react";
import type { CartLine } from "@/hooks/useCart";

export type CheckoutState = "idle" | "tip" | "processing" | "success";

export interface Transaction {
  id: string;
  lineItems: CartLine[];
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
  paymentMethod: "card";
  completedAt: string;
}

export interface ConfirmData {
  lineItems: CartLine[];
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
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
    setState("processing");
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
      };
      appendTransaction(tx);
      console.log(tx);
      setCompletedTx(tx);
      setState("success");
    }, 2000);
  }, []);

  const completeSale = useCallback(() => {
    onComplete();
    setTipCents(0);
    setSelectedPreset(null);
    setCompletedTx(null);
    setState("idle");
  }, [onComplete]);

  return {
    state,
    tipCents,
    selectedPreset,
    completedTx,
    startCheckout,
    cancelCheckout,
    selectPreset,
    applyCustomTip,
    confirmCheckout,
    completeSale,
  };
}
