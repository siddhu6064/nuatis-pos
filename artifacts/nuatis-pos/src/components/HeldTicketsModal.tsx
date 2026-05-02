import { useState, useEffect } from "react";
import type { HeldTicket } from "@/lib/heldTickets";
import { STAFF } from "@/lib/staff";
import { formatCurrency } from "@/lib/currency";
import { calcSubtotal, calcTax, calcTotal } from "@/lib/cartMath";

interface HeldTicketsModalProps {
  tickets: HeldTicket[];
  currentCartHasItems: boolean;
  onResume: (ticket: HeldTicket) => void;
  onDiscard: (id: string) => void;
  onClose: () => void;
}

function formatHeldTime(isoString: string): string {
  return new Intl.DateTimeFormat("en-US", { timeStyle: "short" }).format(
    new Date(isoString),
  );
}

function ticketStaffLabel(ticket: HeldTicket): string {
  const ids = [...new Set(ticket.lineItems.map((l) => l.staffId))];
  if (ids.length === 0) return "—";
  if (ids.length === 1) {
    const s = STAFF.find((st) => st.id === ids[0]);
    return s ? s.firstName : "—";
  }
  return "Multiple";
}

function ticketTotal(ticket: HeldTicket): number {
  if (ticket.compApplied) return 0;
  const subtotal = calcSubtotal(ticket.lineItems);
  const tax = calcTax(subtotal);
  return calcTotal(subtotal, tax, 0);
}

export function HeldTicketsModal({
  tickets,
  currentCartHasItems,
  onResume,
  onDiscard,
  onClose,
}: HeldTicketsModalProps) {
  const [confirmResumeTicket, setConfirmResumeTicket] =
    useState<HeldTicket | null>(null);
  const [confirmDiscardId, setConfirmDiscardId] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleResumeTap(ticket: HeldTicket) {
    if (currentCartHasItems) {
      setConfirmResumeTicket(ticket);
    } else {
      onResume(ticket);
    }
  }

  const sorted = [...tickets].reverse();

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-xl w-[420px] max-h-[80vh] flex flex-col"
        style={{ backgroundColor: "white" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: "#E5E7EB" }}
        >
          <p
            className="text-[18px] font-bold text-gray-900"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Held Tickets
          </p>
          <button
            onClick={onClose}
            className="text-[18px] text-gray-400 hover:text-gray-700 transition-colors leading-none"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {sorted.map((ticket) => {
            const isConfirmingResume = confirmResumeTicket?.id === ticket.id;
            const isConfirmingDiscard = confirmDiscardId === ticket.id;
            const customerLabel = ticket.customer
              ? `${ticket.customer.firstName} ${ticket.customer.lastName}`
              : "Walk-in";
            const itemCount = ticket.lineItems.reduce(
              (s, l) => s + l.quantity,
              0,
            );
            const total = ticketTotal(ticket);
            const staffLabel = ticketStaffLabel(ticket);
            const isComped = ticket.compApplied ?? false;

            return (
              <div
                key={ticket.id}
                className="rounded-xl border px-4 py-3"
                style={{ borderColor: "#E5E7EB", backgroundColor: "#FAFAFA" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-[14px] font-medium text-gray-500 tabular-nums flex-shrink-0"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {formatHeldTime(ticket.heldAt)}
                    </span>
                    {isComped && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{
                          fontFamily: "'Epilogue', sans-serif",
                          color: "#DC2626",
                          backgroundColor: "#FEE2E2",
                        }}
                      >
                        COMPED
                      </span>
                    )}
                    <span
                      className="text-[14px] font-medium text-gray-900 truncate"
                      style={{ fontFamily: "'Epilogue', sans-serif" }}
                    >
                      {customerLabel}
                    </span>
                  </div>
                  <span
                    className="text-[16px] font-semibold tabular-nums ml-3 flex-shrink-0"
                    style={{
                      fontFamily: "'Fraunces', serif",
                      color: isComped ? "#DC2626" : "#111827",
                    }}
                  >
                    {formatCurrency(total)}
                  </span>
                </div>

                <p
                  className="text-[12px] text-gray-400 mt-0.5"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  {itemCount} item{itemCount !== 1 ? "s" : ""} · {staffLabel}
                  {isComped && ticket.compReason && (
                    <span style={{ color: "#DC2626" }}>
                      {" "}· {ticket.compReason}
                    </span>
                  )}
                </p>

                {isConfirmingResume && (
                  <div
                    className="mt-2 p-2 rounded-lg text-[13px]"
                    style={{ backgroundColor: "#FFF7ED", border: "1px solid #FED7AA" }}
                  >
                    <p className="text-gray-700 mb-2" style={{ fontFamily: "'Epilogue', sans-serif" }}>
                      Replace current cart?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setConfirmResumeTicket(null); onResume(ticket); }}
                        className="flex-1 h-[32px] rounded-lg text-[13px] font-semibold text-white"
                        style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: "#E84A00" }}
                      >
                        Replace
                      </button>
                      <button
                        onClick={() => setConfirmResumeTicket(null)}
                        className="flex-1 h-[32px] rounded-lg text-[13px] font-medium text-gray-700"
                        style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: "#F3F4F6" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {isConfirmingDiscard && (
                  <div
                    className="mt-2 p-2 rounded-lg text-[13px]"
                    style={{ backgroundColor: "#FFF5F5", border: "1px solid #FCA5A5" }}
                  >
                    <p className="text-gray-700 mb-2" style={{ fontFamily: "'Epilogue', sans-serif" }}>
                      Discard this ticket?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setConfirmDiscardId(null); onDiscard(ticket.id); }}
                        className="flex-1 h-[32px] rounded-lg text-[13px] font-semibold text-white"
                        style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: "#DC2626" }}
                      >
                        Discard
                      </button>
                      <button
                        onClick={() => setConfirmDiscardId(null)}
                        className="flex-1 h-[32px] rounded-lg text-[13px] font-medium text-gray-700"
                        style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: "#F3F4F6" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {!isConfirmingResume && !isConfirmingDiscard && (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleResumeTap(ticket)}
                      className="h-[36px] px-4 rounded-lg text-[13px] font-semibold text-white"
                      style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: "#E84A00" }}
                    >
                      Resume
                    </button>
                    <button
                      onClick={() => setConfirmDiscardId(ticket.id)}
                      className="h-[36px] w-[36px] rounded-lg text-[14px] text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
                      style={{ backgroundColor: "#F3F4F6" }}
                      aria-label="Discard held ticket"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
