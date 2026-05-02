import type { CartLine, CartCustomer } from "@/hooks/useCart";
import { heldTicketsKey } from "@/lib/storage";

export interface HeldTicket {
  id: string;
  heldAt: string;
  customer: CartCustomer | null;
  lineItems: CartLine[];
  compApplied?: boolean;
  compReason?: string | null;
}

const MAX_HELD = 5;

export function getHeldTickets(verticalId: string): HeldTicket[] {
  try {
    const raw = localStorage.getItem(heldTicketsKey(verticalId));
    return raw ? (JSON.parse(raw) as HeldTicket[]) : [];
  } catch {
    return [];
  }
}

function saveHeldTickets(verticalId: string, tickets: HeldTicket[]): void {
  localStorage.setItem(heldTicketsKey(verticalId), JSON.stringify(tickets));
}

export function holdTicket(ticket: HeldTicket, verticalId: string): void {
  const current = getHeldTickets(verticalId);
  const updated = [...current, ticket];
  const capped = updated.length > MAX_HELD ? updated.slice(-MAX_HELD) : updated;
  saveHeldTickets(verticalId, capped);
}

export function resumeTicket(
  id: string,
  verticalId: string,
): HeldTicket | null {
  const current = getHeldTickets(verticalId);
  const ticket = current.find((t) => t.id === id) ?? null;
  if (!ticket) return null;
  saveHeldTickets(
    verticalId,
    current.filter((t) => t.id !== id),
  );
  return ticket;
}

export function removeHeldTicket(id: string, verticalId: string): void {
  const current = getHeldTickets(verticalId);
  saveHeldTickets(
    verticalId,
    current.filter((t) => t.id !== id),
  );
}
