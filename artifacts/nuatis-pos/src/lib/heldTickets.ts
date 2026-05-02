import type { CartLine, CartCustomer } from "@/hooks/useCart";

export interface HeldTicket {
  id: string;
  heldAt: string;
  customer: CartCustomer | null;
  lineItems: CartLine[];
  compApplied?: boolean;
  compReason?: string | null;
}

const HELD_KEY = "nuatis-pos:heldTickets";
const MAX_HELD = 5;

export function getHeldTickets(): HeldTicket[] {
  try {
    const raw = localStorage.getItem(HELD_KEY);
    return raw ? (JSON.parse(raw) as HeldTicket[]) : [];
  } catch {
    return [];
  }
}

function saveHeldTickets(tickets: HeldTicket[]): void {
  localStorage.setItem(HELD_KEY, JSON.stringify(tickets));
}

export function holdTicket(ticket: HeldTicket): void {
  const current = getHeldTickets();
  const updated = [...current, ticket];
  const capped = updated.length > MAX_HELD ? updated.slice(-MAX_HELD) : updated;
  saveHeldTickets(capped);
}

export function resumeTicket(id: string): HeldTicket | null {
  const current = getHeldTickets();
  const ticket = current.find((t) => t.id === id) ?? null;
  if (!ticket) return null;
  saveHeldTickets(current.filter((t) => t.id !== id));
  return ticket;
}

export function removeHeldTicket(id: string): void {
  const current = getHeldTickets();
  saveHeldTickets(current.filter((t) => t.id !== id));
}
