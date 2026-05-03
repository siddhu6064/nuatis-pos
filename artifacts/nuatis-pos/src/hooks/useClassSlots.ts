import { useState, useCallback, useEffect } from "react";
import { useActiveVertical } from "@/hooks/useActiveVertical";
import type { ClassSlot, ClassEnrollment } from "@/lib/classSlots";
import {
  loadClassSlots,
  saveClassSlots,
  seedClassSlots,
  isSlotFull,
  addEnrollmentToSlots,
  removeEnrollmentFromSlots,
  markEnrollmentPaidInSlots,
} from "@/lib/classSlots";

export interface UseClassSlotsReturn {
  slots: ClassSlot[];
  enrollCustomer: (
    slotId: string,
    customerId: string,
    customerName: string,
  ) => ClassEnrollment | null;
  cancelEnrollment: (slotId: string, enrollmentId: string) => void;
  markEnrollmentPaid: (slotId: string, enrollmentId: string, transactionId: string) => void;
  checkSlotFull: (slotId: string) => boolean;
  totalEnrolled: number;
}

export function useClassSlots(): UseClassSlotsReturn {
  const { activeVerticalId } = useActiveVertical();

  const [slots, setSlots] = useState<ClassSlot[]>(() => {
    const loaded = loadClassSlots(activeVerticalId);
    if (loaded.length === 0 && activeVerticalId === "yoga_pilates") {
      const seeded = seedClassSlots(activeVerticalId);
      saveClassSlots(activeVerticalId, seeded);
      return seeded;
    }
    return loaded;
  });

  useEffect(() => {
    const loaded = loadClassSlots(activeVerticalId);
    if (loaded.length === 0 && activeVerticalId === "yoga_pilates") {
      const seeded = seedClassSlots(activeVerticalId);
      saveClassSlots(activeVerticalId, seeded);
      setSlots(seeded);
    } else {
      setSlots(loaded);
    }
  }, [activeVerticalId]);

  const enrollCustomer = useCallback(
    (slotId: string, customerId: string, customerName: string): ClassEnrollment | null => {
      let newEnrollment: ClassEnrollment | null = null;
      setSlots((prev) => {
        if (isSlotFull(prev, slotId)) return prev;
        const enrollment: ClassEnrollment = {
          id: crypto.randomUUID(),
          customerId,
          customerName,
          enrolledAt: Date.now(),
        };
        newEnrollment = enrollment;
        const updated = addEnrollmentToSlots(prev, slotId, enrollment);
        saveClassSlots(activeVerticalId, updated);
        return updated;
      });
      return newEnrollment;
    },
    [activeVerticalId],
  );

  const cancelEnrollment = useCallback(
    (slotId: string, enrollmentId: string) => {
      setSlots((prev) => {
        const updated = removeEnrollmentFromSlots(prev, slotId, enrollmentId);
        saveClassSlots(activeVerticalId, updated);
        return updated;
      });
    },
    [activeVerticalId],
  );

  const markEnrollmentPaid = useCallback(
    (slotId: string, enrollmentId: string, transactionId: string) => {
      setSlots((prev) => {
        const updated = markEnrollmentPaidInSlots(prev, slotId, enrollmentId, transactionId);
        saveClassSlots(activeVerticalId, updated);
        return updated;
      });
    },
    [activeVerticalId],
  );

  const checkSlotFull = useCallback(
    (slotId: string) => isSlotFull(slots, slotId),
    [slots],
  );

  const totalEnrolled = slots.reduce((sum, s) => sum + s.roster.length, 0);

  return {
    slots,
    enrollCustomer,
    cancelEnrollment,
    markEnrollmentPaid,
    checkSlotFull,
    totalEnrolled,
  };
}
