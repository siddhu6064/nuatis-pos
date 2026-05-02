import { useState, useEffect } from "react";
import { useActiveVertical } from "@/hooks/useActiveVertical";
import {
  getWaitlist,
  addToWaitlist,
  removeFromWaitlist,
  type WaitlistEntry,
} from "@/lib/waitlist";

export function useWaitlist() {
  const { activeVerticalId } = useActiveVertical();
  const [entries, setEntries] = useState<WaitlistEntry[]>(() =>
    getWaitlist(activeVerticalId),
  );

  useEffect(() => {
    setEntries(getWaitlist(activeVerticalId));
  }, [activeVerticalId]);

  function addEntry(partial: Omit<WaitlistEntry, "id" | "addedAt">): void {
    const updated = addToWaitlist(activeVerticalId, partial);
    setEntries(updated);
  }

  function removeEntry(id: string): void {
    const updated = removeFromWaitlist(activeVerticalId, id);
    setEntries(updated);
  }

  return { entries, addEntry, removeEntry };
}
