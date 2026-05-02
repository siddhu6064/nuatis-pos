import { useState, useCallback } from "react";
import { STAFF } from "@/lib/staff";
import type { CartCustomer } from "@/lib/customers";

export interface CartLine {
  lineId: string;
  serviceId: string;
  name: string;
  priceCents: number;
  quantity: number;
  staffId: string;
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

  const addItem = useCallback(
    (serviceId: string, name: string, priceCents: number, staffId: string) => {
      setLines((prev) => {
        const existing = prev.find(
          (l) => l.serviceId === serviceId && l.staffId === staffId,
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

  const attachCustomer = useCallback((c: CartCustomer) => {
    setCustomer(c);
  }, []);

  const detachCustomer = useCallback(() => {
    setCustomer(null);
  }, []);

  const clear = useCallback(() => {
    const next: CartLine[] = [];
    saveCart(next);
    setLines(next);
    setCustomer(null);
  }, []);

  return {
    lines,
    customer,
    addItem,
    increment,
    decrement,
    remove,
    changeStaff,
    attachCustomer,
    detachCustomer,
    clear,
  };
}
