import { useState, useCallback } from "react";

export interface CartLine {
  serviceId: string;
  name: string;
  priceCents: number;
  quantity: number;
}

const STORAGE_KEY = "nuatis-pos:cart";

function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartLine[];
  } catch {
    return [];
  }
}

function saveCart(lines: CartLine[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
}

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>(() => loadCart());

  const addItem = useCallback(
    (serviceId: string, name: string, priceCents: number) => {
      setLines((prev) => {
        const existing = prev.find((l) => l.serviceId === serviceId);
        let next: CartLine[];
        if (existing) {
          next = prev.map((l) =>
            l.serviceId === serviceId
              ? { ...l, quantity: l.quantity + 1 }
              : l,
          );
        } else {
          next = [...prev, { serviceId, name, priceCents, quantity: 1 }];
        }
        saveCart(next);
        return next;
      });
    },
    [],
  );

  const increment = useCallback((serviceId: string) => {
    setLines((prev) => {
      const next = prev.map((l) =>
        l.serviceId === serviceId ? { ...l, quantity: l.quantity + 1 } : l,
      );
      saveCart(next);
      return next;
    });
  }, []);

  const decrement = useCallback((serviceId: string) => {
    setLines((prev) => {
      const next = prev
        .map((l) =>
          l.serviceId === serviceId ? { ...l, quantity: l.quantity - 1 } : l,
        )
        .filter((l) => l.quantity > 0);
      saveCart(next);
      return next;
    });
  }, []);

  const remove = useCallback((serviceId: string) => {
    setLines((prev) => {
      const next = prev.filter((l) => l.serviceId !== serviceId);
      saveCart(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    const next: CartLine[] = [];
    saveCart(next);
    setLines(next);
  }, []);

  return { lines, addItem, increment, decrement, remove, clear };
}
