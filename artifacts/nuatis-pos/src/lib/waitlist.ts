import { waitlistKey } from "@/lib/storage";

export interface WaitlistEntry {
  id: string;
  name: string;
  phone: string;
  serviceId: string | null;
  serviceName: string | null;
  servicePriceCents: number | null;
  addedAt: number;
}

const MAX_WAITLIST = 10;

export function getWaitlist(verticalId: string): WaitlistEntry[] {
  try {
    const raw = localStorage.getItem(waitlistKey(verticalId));
    return raw ? (JSON.parse(raw) as WaitlistEntry[]) : [];
  } catch {
    return [];
  }
}

function saveWaitlist(verticalId: string, entries: WaitlistEntry[]): void {
  localStorage.setItem(waitlistKey(verticalId), JSON.stringify(entries));
}

export function addToWaitlist(
  verticalId: string,
  partial: Omit<WaitlistEntry, "id" | "addedAt">,
): WaitlistEntry[] {
  const current = getWaitlist(verticalId);
  if (current.length >= MAX_WAITLIST) return current;
  const entry: WaitlistEntry = {
    id: crypto.randomUUID(),
    addedAt: Date.now(),
    ...partial,
  };
  const updated = [...current, entry];
  saveWaitlist(verticalId, updated);
  return updated;
}

export function removeFromWaitlist(
  verticalId: string,
  id: string,
): WaitlistEntry[] {
  const current = getWaitlist(verticalId);
  const updated = current.filter((e) => e.id !== id);
  saveWaitlist(verticalId, updated);
  return updated;
}

export function formatWaitElapsed(addedAt: number): string {
  const mins = Math.floor((Date.now() - addedAt) / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export { MAX_WAITLIST };
