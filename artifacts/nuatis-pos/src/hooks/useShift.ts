import { useState, useCallback, useEffect } from "react";
import { useActiveVertical } from "@/hooks/useActiveVertical";
import type { Shift } from "@/lib/shifts";
import {
  loadCurrentShift,
  saveCurrentShift,
  appendShiftHistory,
} from "@/lib/shifts";
import { currentShiftKey, shiftsHistoryKey } from "@/lib/storage";

export interface UseShiftReturn {
  currentShift: Shift | null;
  isShiftOpen: boolean;
  openShift: (staffId: string, staffName: string, startingCashCents: number) => void;
  closeShift: () => void;
}

export function useShift(): UseShiftReturn {
  const { activeVerticalId } = useActiveVertical();

  const [currentShift, setCurrentShift] = useState<Shift | null>(() =>
    loadCurrentShift(currentShiftKey(activeVerticalId)),
  );

  // Reload shift state whenever the active vertical changes
  useEffect(() => {
    setCurrentShift(loadCurrentShift(currentShiftKey(activeVerticalId)));
  }, [activeVerticalId]);

  const openShift = useCallback(
    (staffId: string, staffName: string, startingCashCents: number) => {
      const shift: Shift = {
        id: crypto.randomUUID(),
        verticalId: activeVerticalId,
        openedByStaffId: staffId,
        openedByStaffName: staffName,
        startedAt: Date.now(),
        startingCashCents,
      };
      saveCurrentShift(currentShiftKey(activeVerticalId), shift);
      setCurrentShift(shift);
    },
    [activeVerticalId],
  );

  const closeShift = useCallback(() => {
    if (!currentShift) return;
    const closed: Shift = { ...currentShift, endedAt: Date.now() };
    appendShiftHistory(shiftsHistoryKey(activeVerticalId), closed);
    saveCurrentShift(currentShiftKey(activeVerticalId), null);
    setCurrentShift(null);
  }, [currentShift, activeVerticalId]);

  return {
    currentShift,
    isShiftOpen: currentShift !== null,
    openShift,
    closeShift,
  };
}
