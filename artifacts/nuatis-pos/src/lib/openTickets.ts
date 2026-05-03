import type { CartLine } from "@/hooks/useCart";
import { openTicketsKey, closedTicketsKey, tagCounterKey } from "@/lib/storage";

export type OpenTicketStatus = "in_progress" | "ready_for_pickup" | "picked_up";

export interface OpenTicket {
  id: string;
  verticalId: string;
  tag: string;
  customerId: string;
  customerName: string;
  lines: CartLine[];
  droppedOffAt: number;
  markedReadyAt?: number;
  pickedUpAt?: number;
  status: OpenTicketStatus;
}

// ── Tag counter ───────────────────────────────────────────────────────────────

function loadTagCounter(verticalId: string): number {
  try {
    const raw = localStorage.getItem(tagCounterKey(verticalId));
    if (!raw) return 0;
    return parseInt(raw, 10) || 0;
  } catch {
    return 0;
  }
}

function incrementTagCounter(verticalId: string): number {
  const next = loadTagCounter(verticalId) + 1;
  try {
    localStorage.setItem(tagCounterKey(verticalId), String(next));
  } catch {}
  return next;
}

/**
 * Generates the next sequential tag for a vertical.
 * Format: "{VERT}-{0001-padded}" where VERT is the first 4 chars of the
 * verticalId uppercased. For "laundry" this yields "LAUN-0001".
 */
function generateTag(verticalId: string): string {
  const prefix = verticalId.slice(0, 4).toUpperCase();
  const counter = incrementTagCounter(verticalId);
  return `${prefix}-${String(counter).padStart(4, "0")}`;
}

// ── Open tickets storage ──────────────────────────────────────────────────────

export function loadOpenTickets(verticalId: string): OpenTicket[] {
  try {
    const raw = localStorage.getItem(openTicketsKey(verticalId));
    if (!raw) return [];
    return JSON.parse(raw) as OpenTicket[];
  } catch {
    return [];
  }
}

function saveOpenTickets(verticalId: string, tickets: OpenTicket[]): void {
  try {
    localStorage.setItem(openTicketsKey(verticalId), JSON.stringify(tickets));
  } catch {}
}

// ── Closed tickets storage ────────────────────────────────────────────────────

export function loadClosedTickets(verticalId: string): OpenTicket[] {
  try {
    const raw = localStorage.getItem(closedTicketsKey(verticalId));
    if (!raw) return [];
    return JSON.parse(raw) as OpenTicket[];
  } catch {
    return [];
  }
}

function saveClosedTickets(verticalId: string, tickets: OpenTicket[]): void {
  try {
    localStorage.setItem(closedTicketsKey(verticalId), JSON.stringify(tickets));
  } catch {}
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Creates a new drop-off ticket, assigns a sequential tag, persists it,
 * and returns the full OpenTicket record.
 */
export function createDropOff(
  verticalId: string,
  customerId: string,
  customerName: string,
  lines: CartLine[],
): OpenTicket {
  const ticket: OpenTicket = {
    id: crypto.randomUUID(),
    verticalId,
    tag: generateTag(verticalId),
    customerId,
    customerName,
    lines,
    droppedOffAt: Date.now(),
    status: "in_progress",
  };
  const existing = loadOpenTickets(verticalId);
  saveOpenTickets(verticalId, [...existing, ticket]);
  return ticket;
}

/**
 * Transitions a ticket from in_progress → ready_for_pickup.
 * Returns the updated list.
 */
export function markTicketReady(
  verticalId: string,
  ticketId: string,
): OpenTicket[] {
  const tickets = loadOpenTickets(verticalId);
  const updated = tickets.map((t) =>
    t.id === ticketId
      ? { ...t, status: "ready_for_pickup" as OpenTicketStatus, markedReadyAt: Date.now() }
      : t,
  );
  saveOpenTickets(verticalId, updated);
  return updated;
}

/**
 * Moves a ticket from openTickets to closedTickets (status = picked_up).
 * Caps closedTickets at 50 most-recent entries.
 * Returns updated open and closed lists.
 */
export function completePickupTicket(
  verticalId: string,
  ticketId: string,
  _transactionId: string,
): { openTickets: OpenTicket[]; closedTickets: OpenTicket[] } {
  const open = loadOpenTickets(verticalId);
  const ticket = open.find((t) => t.id === ticketId);
  const remaining = open.filter((t) => t.id !== ticketId);
  saveOpenTickets(verticalId, remaining);

  const closed = loadClosedTickets(verticalId);
  if (ticket) {
    const closedTicket: OpenTicket = {
      ...ticket,
      status: "picked_up",
      pickedUpAt: Date.now(),
    };
    const capped = [...closed, closedTicket].slice(-50);
    saveClosedTickets(verticalId, capped);
    return { openTickets: remaining, closedTickets: capped };
  }
  return { openTickets: remaining, closedTickets: closed };
}
