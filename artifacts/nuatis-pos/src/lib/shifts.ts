export interface Shift {
  id: string;
  verticalId: string;
  openedByStaffId: string;
  openedByStaffName: string;
  startedAt: number;        // epoch ms
  endedAt?: number;         // epoch ms; set when shift is closed
  startingCashCents: number;
}

/**
 * Render-on-pull elapsed-time formatter.
 * Called during component render (no setInterval) — the Header's
 * useClock setTimeout-recursion causes Header to re-render every second,
 * so the shift pill stays current without a separate tick.
 */
export function formatElapsed(startedAt: number): string {
  const ms = Date.now() - startedAt;
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return "just now";
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

export function loadCurrentShift(storageKey: string): Shift | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw) as Shift;
  } catch {
    return null;
  }
}

export function saveCurrentShift(storageKey: string, shift: Shift | null): void {
  try {
    if (shift === null) {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(storageKey, JSON.stringify(shift));
    }
  } catch {
    // silent
  }
}

export function appendShiftHistory(historyKey: string, shift: Shift): void {
  try {
    const raw = localStorage.getItem(historyKey);
    const existing: Shift[] = raw ? (JSON.parse(raw) as Shift[]) : [];
    localStorage.setItem(historyKey, JSON.stringify([...existing, shift]));
  } catch {
    // silent
  }
}
