import { useState, useCallback, useEffect } from "react";
import type { CartLine } from "@/hooks/useCart";
import {
  type OpenTicket,
  loadOpenTickets,
  createDropOff,
  markTicketReady,
  completePickupTicket,
} from "@/lib/openTickets";
import { useActiveVertical } from "@/hooks/useActiveVertical";

export type { OpenTicket };

export function useOpenTickets() {
  const { activeVerticalId } = useActiveVertical();

  const [openTickets, setOpenTickets] = useState<OpenTicket[]>(() =>
    loadOpenTickets(activeVerticalId),
  );

  // Reload when vertical changes
  useEffect(() => {
    setOpenTickets(loadOpenTickets(activeVerticalId));
  }, [activeVerticalId]);

  /**
   * Drop off a new ticket. Returns the created OpenTicket (with tag).
   */
  const dropOff = useCallback(
    (
      customerId: string,
      customerName: string,
      lines: CartLine[],
    ): OpenTicket => {
      const ticket = createDropOff(activeVerticalId, customerId, customerName, lines);
      setOpenTickets((prev) => [...prev, ticket]);
      return ticket;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeVerticalId],
  );

  /**
   * Transition in_progress → ready_for_pickup. Returns customer name for
   * mock-SMS toast.
   */
  const markReady = useCallback(
    (ticketId: string): string => {
      const updated = markTicketReady(activeVerticalId, ticketId);
      setOpenTickets(updated);
      const ticket = updated.find((t) => t.id === ticketId);
      return ticket?.customerName ?? "";
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeVerticalId],
  );

  /**
   * Returns the lines + customer info from a ticket for cart hydration.
   * Does NOT mutate the ticket — caller still needs completePickup when
   * payment succeeds.
   */
  const pickUp = useCallback(
    (ticketId: string): { lines: CartLine[]; customerId: string; customerName: string; tag: string } | null => {
      const ticket = openTickets.find((t) => t.id === ticketId);
      if (!ticket) return null;
      return {
        lines: ticket.lines,
        customerId: ticket.customerId,
        customerName: ticket.customerName,
        tag: ticket.tag,
      };
    },
    [openTickets],
  );

  /**
   * Move ticket to closedTickets after successful payment.
   */
  const completePickup = useCallback(
    (ticketId: string, transactionId: string) => {
      const { openTickets: remaining } = completePickupTicket(
        activeVerticalId,
        ticketId,
        transactionId,
      );
      setOpenTickets(remaining);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeVerticalId],
  );

  const activeCount = openTickets.filter(
    (t) => t.status === "in_progress" || t.status === "ready_for_pickup",
  ).length;

  return {
    openTickets,
    activeCount,
    dropOff,
    markReady,
    pickUp,
    completePickup,
  };
}
