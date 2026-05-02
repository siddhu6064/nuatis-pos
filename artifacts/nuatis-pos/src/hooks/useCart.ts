import { useState, useCallback } from "react";
import { STAFF } from "@/lib/staff";
import type { CartCustomer } from "@/lib/customers";
import type { Modifier } from "@/lib/modifiers";

export interface CartLine {
  lineId: string;
  serviceId: string;
  name: string;
  priceCents: number;
  quantity: number;
  staffId: string;
  modifiers: Modifier[];
  discountPercent: number;
}

export type { CartCustomer };

const STORAGE_KEY = "nuatis-pos:cart";

function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Partial<CartLine>>;
    return parsed
      .filter(
        (l) =>
          l.serviceId &&
          l.name &&
          l.priceCents !== undefined &&
          l.quantity !== undefined,
      )
      .map((l) => ({
        lineId: l.lineId ?? crypto.randomUUID(),
        serviceId: l.serviceId!,
        name: l.name!,
        priceCents: l.priceCents!,
        quantity: l.quantity!,
        staffId: l.staffId ?? STAFF[0].id,
        modifiers: l.modifiers ?? [],
        discountPercent: l.discountPercent ?? 0,
      }));
  } catch {
    return [];
  }
}

function saveCart(lines: CartLine[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
}

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>(() => loadCart());
  const [customer, setCustomer] = useState<CartCustomer | null>(null);
  const [compApplied, setCompApplied] = useState(false);
  const [compReason, setCompReason] = useState<string | null>(null);

  const addItem = useCallback(
    (serviceId: string, name: string, priceCents: number, staffId: string) => {
      setLines((prev) => {
        const existing = prev.find(
          (l) =>
            l.serviceId === serviceId &&
            l.staffId === staffId &&
            l.modifiers.length === 0 &&
            l.discountPercent === 0,
        );
        let next: CartLine[];
        if (existing) {
          next = prev.map((l) =>
            l.lineId === existing.lineId
              ? { ...l, quantity: l.quantity + 1 }
              : l,
          );
        } else {
          next = [
            ...prev,
            {
              lineId: crypto.randomUUID(),
              serviceId,
              name,
              priceCents,
              quantity: 1,
              staffId,
              modifiers: [],
              discountPercent: 0,
            },
          ];
        }
        saveCart(next);
        return next;
      });
    },
    [],
  );

  const increment = useCallback((lineId: string) => {
    setLines((prev) => {
      const next = prev.map((l) =>
        l.lineId === lineId ? { ...l, quantity: l.quantity + 1 } : l,
      );
      saveCart(next);
      return next;
    });
  }, []);

  const decrement = useCallback((lineId: string) => {
    setLines((prev) => {
      const next = prev
        .map((l) =>
          l.lineId === lineId ? { ...l, quantity: l.quantity - 1 } : l,
        )
        .filter((l) => l.quantity > 0);
      saveCart(next);
      return next;
    });
  }, []);

  const remove = useCallback((lineId: string) => {
    setLines((prev) => {
      const next = prev.filter((l) => l.lineId !== lineId);
      saveCart(next);
      return next;
    });
  }, []);

  const changeStaff = useCallback((lineId: string, staffId: string) => {
    setLines((prev) => {
      const next = prev.map((l) =>
        l.lineId === lineId ? { ...l, staffId } : l,
      );
      saveCart(next);
      return next;
    });
  }, []);

  const toggleModifier = useCallback((lineId: string, modifier: Modifier) => {
    setLines((prev) => {
      const next = prev.map((l) => {
        if (l.lineId !== lineId) return l;
        const hasIt = l.modifiers.some((m) => m.id === modifier.id);
        const modifiers = hasIt
          ? l.modifiers.filter((m) => m.id !== modifier.id)
          : [...l.modifiers, modifier];
        return { ...l, modifiers };
      });
      saveCart(next);
      return next;
    });
  }, []);

  const setDiscount = useCallback((lineId: string, percent: number) => {
    setLines((prev) => {
      const next = prev.map((l) =>
        l.lineId === lineId
          ? { ...l, discountPercent: Math.max(0, Math.min(99, percent)) }
          : l,
      );
      saveCart(next);
      return next;
    });
  }, []);

  const applyComp = useCallback((reason: string) => {
    setCompApplied(true);
    setCompReason(reason);
  }, []);

  const removeComp = useCallback(() => {
    setCompApplied(false);
    setCompReason(null);
  }, []);

  const attachCustomer = useCallback((c: CartCustomer) => {
    setCustomer(c);
  }, []);

  const detachCustomer = useCallback(() => {
    setCustomer(null);
  }, []);

  const loadHeld = useCallback(
    (
      lineItems: CartLine[],
      heldCustomer: CartCustomer | null,
      heldCompApplied = false,
      heldCompReason: string | null = null,
    ) => {
      saveCart(lineItems);
      setLines(lineItems);
      setCustomer(heldCustomer);
      setCompApplied(heldCompApplied);
      setCompReason(heldCompReason);
    },
    [],
  );

  const clear = useCallback(() => {
    const next: CartLine[] = [];
    saveCart(next);
    setLines(next);
    setCustomer(null);
    setCompApplied(false);
    setCompReason(null);
  }, []);

  return {
    lines,
    customer,
    compApplied,
    compReason,
    addItem,
    increment,
    decrement,
    remove,
    changeStaff,
    toggleModifier,
    setDiscount,
    applyComp,
    removeComp,
    attachCustomer,
    detachCustomer,
    loadHeld,
    clear,
  };
}
