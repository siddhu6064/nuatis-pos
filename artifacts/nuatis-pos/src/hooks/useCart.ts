import { useState, useCallback, useEffect, useRef } from "react";
import { STAFF } from "@/lib/staff";
import type { CartCustomer } from "@/lib/customers";
import type { Modifier } from "@/lib/modifiers";
import type { SessionPricing } from "@/lib/services";
import { cartKey, cartMetaKey } from "@/lib/storage";
import { useActiveVertical } from "@/hooks/useActiveVertical";
import { getServiceFinalPriceCents } from "@/lib/pricing";

export interface VaccinationOverride {
  overriddenAt: number;   // epoch ms when manager approved
  blockers: string[];     // human-readable blocker strings at time of override
}

export interface CartLine {
  lineId: string;
  serviceId: string;
  name: string;
  priceCents: number;
  quantity: number;
  staffId: string;
  modifiers: Modifier[];
  discountPercent: number;
  // B22: present only on pet_grooming lines added via manager PIN override
  vaccinationOverride?: VaccinationOverride;
  // B23: session-based tanning lines
  sessionStartedAt?: number;  // epoch ms; defined = session started
  sessionEndedAt?: number;    // epoch ms; defined = session locked
  sessionPricing?: SessionPricing; // stored for price recomputation
  // B32: class-pack burn lines (priceCents = 0 for these)
  usedPackId?: string;
  usedPackName?: string;
  usedPackAmortizedCents?: number;
}

export type { CartCustomer };

interface CartMeta {
  appointmentRef: string | null;
  depositApplied: number;
}

function loadCart(verticalId: string): CartLine[] {
  try {
    const raw = localStorage.getItem(cartKey(verticalId));
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
        ...(l.vaccinationOverride ? { vaccinationOverride: l.vaccinationOverride as VaccinationOverride } : {}),
        // B23: restore session fields
        ...(typeof l.sessionStartedAt === "number" ? { sessionStartedAt: l.sessionStartedAt } : {}),
        ...(typeof l.sessionEndedAt === "number" ? { sessionEndedAt: l.sessionEndedAt } : {}),
        ...(l.sessionPricing ? { sessionPricing: l.sessionPricing as SessionPricing } : {}),
        ...(typeof l.usedPackId === "string" ? { usedPackId: l.usedPackId } : {}),
        ...(typeof l.usedPackName === "string" ? { usedPackName: l.usedPackName } : {}),
        ...(typeof l.usedPackAmortizedCents === "number" ? { usedPackAmortizedCents: l.usedPackAmortizedCents } : {}),
      }));
  } catch {
    return [];
  }
}

function loadCartMeta(verticalId: string): CartMeta {
  try {
    const raw = localStorage.getItem(cartMetaKey(verticalId));
    if (!raw) return { appointmentRef: null, depositApplied: 0 };
    const parsed = JSON.parse(raw) as Partial<CartMeta>;
    return {
      appointmentRef: typeof parsed.appointmentRef === "string" ? parsed.appointmentRef : null,
      depositApplied: typeof parsed.depositApplied === "number" ? parsed.depositApplied : 0,
    };
  } catch {
    return { appointmentRef: null, depositApplied: 0 };
  }
}

function saveCartMeta(verticalId: string, meta: CartMeta): void {
  try {
    localStorage.setItem(cartMetaKey(verticalId), JSON.stringify(meta));
  } catch {
    // silent fail
  }
}

export function useCart() {
  const { activeVerticalId } = useActiveVertical();
  const verticalIdRef = useRef(activeVerticalId);

  const [lines, setLines] = useState<CartLine[]>(() =>
    loadCart(activeVerticalId),
  );
  const [customer, setCustomer] = useState<CartCustomer | null>(null);
  const [compApplied, setCompApplied] = useState(false);
  const [compReason, setCompReason] = useState<string | null>(null);
  const [appointmentRef, setAppointmentRefState] = useState<string | null>(
    () => loadCartMeta(activeVerticalId).appointmentRef,
  );
  const [depositApplied, setDepositAppliedState] = useState<number>(
    () => loadCartMeta(activeVerticalId).depositApplied,
  );

  useEffect(() => {
    verticalIdRef.current = activeVerticalId;
    setLines(loadCart(activeVerticalId));
    setCustomer(null);
    setCompApplied(false);
    setCompReason(null);
    const meta = loadCartMeta(activeVerticalId);
    setAppointmentRefState(meta.appointmentRef);
    setDepositAppliedState(meta.depositApplied);
  }, [activeVerticalId]);

  function saveCart(next: CartLine[]): void {
    localStorage.setItem(cartKey(verticalIdRef.current), JSON.stringify(next));
  }

  /**
   * addItem — adds a fixed-price service line to the cart.
   * If vaccinationOverride is provided, always creates a new line (no dedup).
   * If vaccinationOverride is absent, deduplicates with matching lines that
   * also have no override and are not session lines.
   */
  const addItem = useCallback(
    (
      serviceId: string,
      name: string,
      priceCents: number,
      staffId: string,
      vaccinationOverride?: VaccinationOverride,
    ) => {
      setLines((prev) => {
        // Only dedup fixed-price lines with no override and no session fields
        const existing = vaccinationOverride
          ? undefined
          : prev.find(
              (l) =>
                l.serviceId === serviceId &&
                l.staffId === staffId &&
                l.modifiers.length === 0 &&
                l.discountPercent === 0 &&
                !l.vaccinationOverride &&
                l.sessionStartedAt === undefined,
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
              ...(vaccinationOverride ? { vaccinationOverride } : {}),
            },
          ];
        }
        saveCart(next);
        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /**
   * addSessionItem — adds a session-based service line (B23 tanning).
   * Always creates a new line (no dedup; parallel sessions are allowed).
   * Sets sessionStartedAt = Date.now(), priceCents = 0 (computed on stop).
   */
  const addSessionItem = useCallback(
    (
      serviceId: string,
      name: string,
      sessionPricing: SessionPricing,
      staffId: string,
    ) => {
      setLines((prev) => {
        const next: CartLine[] = [
          ...prev,
          {
            lineId: crypto.randomUUID(),
            serviceId,
            name,
            priceCents: 0,
            quantity: 1,
            staffId,
            modifiers: [],
            discountPercent: 0,
            sessionStartedAt: Date.now(),
            sessionPricing,
          },
        ];
        saveCart(next);
        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /**
   * addPackBurnItem — adds a $0 class line that consumes one session from a pack.
   * Always creates a new line (no dedup). priceCents = 0.
   */
  const addPackBurnItem = useCallback(
    (
      serviceId: string,
      name: string,
      staffId: string,
      usedPackId: string,
      usedPackName: string,
      usedPackAmortizedCents: number,
    ) => {
      setLines((prev) => {
        const next: CartLine[] = [
          ...prev,
          {
            lineId: crypto.randomUUID(),
            serviceId,
            name,
            priceCents: 0,
            quantity: 1,
            staffId,
            modifiers: [],
            discountPercent: 0,
            usedPackId,
            usedPackName,
            usedPackAmortizedCents,
          },
        ];
        saveCart(next);
        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /**
   * stopSession — locks a session line at the computed final price.
   * Sets sessionEndedAt = Date.now() and computes priceCents via getServiceFinalPriceCents.
   */
  const stopSession = useCallback((lineId: string) => {
    setLines((prev) => {
      const line = prev.find((l) => l.lineId === lineId);
      if (!line || line.sessionEndedAt !== undefined) return prev;

      const endedAt = Date.now();
      const startedAt = line.sessionStartedAt ?? endedAt;
      const elapsedMs = Math.max(0, endedAt - startedAt);

      const finalPriceCents = getServiceFinalPriceCents(
        { pricing: line.sessionPricing, priceCents: 0 },
        elapsedMs,
      );

      const next = prev.map((l) =>
        l.lineId === lineId
          ? { ...l, sessionEndedAt: endedAt, priceCents: finalPriceCents }
          : l,
      );
      saveCart(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const increment = useCallback((lineId: string) => {
    setLines((prev) => {
      const next = prev.map((l) =>
        l.lineId === lineId ? { ...l, quantity: l.quantity + 1 } : l,
      );
      saveCart(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remove = useCallback((lineId: string) => {
    setLines((prev) => {
      const next = prev.filter((l) => l.lineId !== lineId);
      saveCart(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeStaff = useCallback((lineId: string, staffId: string) => {
    setLines((prev) => {
      const next = prev.map((l) =>
        l.lineId === lineId ? { ...l, staffId } : l,
      );
      saveCart(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const setDepositContext = useCallback((ref: string, depositCents: number) => {
    setAppointmentRefState(ref);
    setDepositAppliedState(depositCents);
    saveCartMeta(verticalIdRef.current, { appointmentRef: ref, depositApplied: depositCents });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearDepositContext = useCallback(() => {
    setAppointmentRefState(null);
    setDepositAppliedState(0);
    saveCartMeta(verticalIdRef.current, { appointmentRef: null, depositApplied: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setAppointmentRefState(null);
      setDepositAppliedState(0);
      saveCartMeta(verticalIdRef.current, { appointmentRef: null, depositApplied: 0 });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const clear = useCallback(() => {
    const next: CartLine[] = [];
    saveCart(next);
    setLines(next);
    setCustomer(null);
    setCompApplied(false);
    setCompReason(null);
    setAppointmentRefState(null);
    setDepositAppliedState(0);
    saveCartMeta(verticalIdRef.current, { appointmentRef: null, depositApplied: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    lines,
    customer,
    compApplied,
    compReason,
    appointmentRef,
    depositApplied,
    addItem,
    addSessionItem,
    addPackBurnItem,
    stopSession,
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
    setDepositContext,
    clearDepositContext,
    loadHeld,
    clear,
  };
}
