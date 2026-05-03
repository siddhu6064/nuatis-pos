import { useState } from "react";
import type { OpenTicket } from "@/lib/openTickets";
import { formatElapsed } from "@/lib/shifts";

interface OpenTicketsOverlayProps {
  tickets: OpenTicket[];
  currentPickupTicketId: string | null;
  onMarkReady: (ticketId: string) => void;
  onPickUp: (ticketId: string) => void;
  onClose: () => void;
}

function StatusBadge({ status }: { status: OpenTicket["status"] }) {
  if (status === "ready_for_pickup") {
    return (
      <span
        className="h-[20px] px-2 rounded-full text-[11px] font-semibold flex items-center"
        style={{
          fontFamily: "'Epilogue', sans-serif",
          backgroundColor: "#DCFCE7",
          color: "#15803D",
        }}
      >
        READY
      </span>
    );
  }
  return (
    <span
      className="h-[20px] px-2 rounded-full text-[11px] font-semibold flex items-center"
      style={{
        fontFamily: "'Epilogue', sans-serif",
        backgroundColor: "#FEF3C7",
        color: "#92400E",
      }}
    >
      IN PROGRESS
    </span>
  );
}

export function OpenTicketsOverlay({
  tickets,
  currentPickupTicketId,
  onMarkReady,
  onPickUp,
  onClose,
}: OpenTicketsOverlayProps) {
  // If the operator picks a different ticket while one is already hydrated,
  // show an inline confirmation before proceeding.
  const [pendingSwitchId, setPendingSwitchId] = useState<string | null>(null);

  function handlePickUp(ticketId: string) {
    if (currentPickupTicketId && currentPickupTicketId !== ticketId) {
      setPendingSwitchId(ticketId);
      return;
    }
    onPickUp(ticketId);
  }

  function confirmSwitch() {
    if (pendingSwitchId) {
      onPickUp(pendingSwitchId);
      setPendingSwitchId(null);
    }
  }

  const sorted = [...tickets].sort((a, b) => b.droppedOffAt - a.droppedOffAt);
  const isEmpty = sorted.length === 0;

  return (
    <div
      className="fixed inset-0 z-40 flex"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
    >
      <div
        className="ml-auto h-full w-[560px] flex flex-col shadow-2xl"
        style={{ backgroundColor: "#F8F7F4" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-black/10 flex-shrink-0"
          style={{ backgroundColor: "#F8F7F4" }}
        >
          <span
            className="text-[20px] font-bold text-gray-900"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Open Tickets
          </span>
          <button
            onClick={onClose}
            className="text-[22px] text-gray-400 hover:text-gray-600 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5"
          >
            ✕
          </button>
        </div>

        {/* Switch confirmation banner */}
        {pendingSwitchId && (
          <div
            className="mx-4 mt-4 p-4 rounded-xl border flex flex-col gap-3"
            style={{ backgroundColor: "#FEF3C7", borderColor: "#FDE68A" }}
          >
            <p
              className="text-[13px] font-medium"
              style={{ fontFamily: "'Epilogue', sans-serif", color: "#92400E" }}
            >
              A pickup is already in progress. Switching will clear the current
              cart. Continue?
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmSwitch}
                className="flex-1 h-[36px] rounded-lg text-[13px] font-semibold text-white"
                style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: "#B45309" }}
              >
                Switch pickup
              </button>
              <button
                onClick={() => setPendingSwitchId(null)}
                className="flex-1 h-[36px] rounded-lg text-[13px] font-medium text-gray-600 border border-gray-300"
                style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: "white" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {isEmpty ? (
            <div className="flex items-center justify-center h-40">
              <p
                className="text-[15px] text-gray-400 text-center"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                No open tickets
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sorted.map((ticket) => {
                const isCurrentPickup = ticket.id === currentPickupTicketId;
                return (
                  <div
                    key={ticket.id}
                    className="rounded-xl p-4 border"
                    style={{
                      backgroundColor: isCurrentPickup ? "#EFF6FF" : "white",
                      borderColor: isCurrentPickup ? "#BFDBFE" : "#E5E7EB",
                    }}
                  >
                    {/* Top row: tag + status */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-[18px] font-bold tracking-wider"
                        style={{ fontFamily: "'JetBrains Mono', monospace", color: "#1D4ED8" }}
                      >
                        {ticket.tag}
                      </span>
                      <div className="flex items-center gap-2">
                        {isCurrentPickup && (
                          <span
                            className="h-[20px] px-2 rounded-full text-[11px] font-semibold flex items-center"
                            style={{
                              fontFamily: "'Epilogue', sans-serif",
                              backgroundColor: "#DBEAFE",
                              color: "#1D4ED8",
                            }}
                          >
                            IN CART
                          </span>
                        )}
                        <StatusBadge status={ticket.status} />
                      </div>
                    </div>

                    {/* Customer + meta */}
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="text-[14px] font-medium text-gray-800"
                        style={{ fontFamily: "'Epilogue', sans-serif" }}
                      >
                        {ticket.customerName}
                      </span>
                      <span
                        className="text-[12px] text-gray-400"
                        style={{ fontFamily: "'Epilogue', sans-serif" }}
                      >
                        ·
                      </span>
                      <span
                        className="text-[12px] text-gray-400"
                        style={{ fontFamily: "'Epilogue', sans-serif" }}
                      >
                        {formatElapsed(ticket.droppedOffAt)} ago
                      </span>
                      <span
                        className="text-[12px] text-gray-400"
                        style={{ fontFamily: "'Epilogue', sans-serif" }}
                      >
                        ·
                      </span>
                      <span
                        className="text-[12px] text-gray-400"
                        style={{ fontFamily: "'Epilogue', sans-serif" }}
                      >
                        {ticket.lines.reduce((s, l) => s + l.quantity, 0)}{" "}
                        {ticket.lines.reduce((s, l) => s + l.quantity, 0) === 1
                          ? "item"
                          : "items"}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      {ticket.status === "in_progress" && (
                        <button
                          onClick={() => onMarkReady(ticket.id)}
                          className="flex-1 h-[36px] rounded-lg text-[13px] font-semibold border transition-all duration-150 active:scale-[0.98]"
                          style={{
                            fontFamily: "'Epilogue', sans-serif",
                            backgroundColor: "white",
                            color: "#92400E",
                            borderColor: "#FDE68A",
                          }}
                        >
                          Mark Ready
                        </button>
                      )}
                      <button
                        onClick={() => handlePickUp(ticket.id)}
                        className="flex-1 h-[36px] rounded-lg text-[13px] font-semibold text-white transition-all duration-150 active:scale-[0.98]"
                        style={{
                          fontFamily: "'Epilogue', sans-serif",
                          backgroundColor: "#2563EB",
                        }}
                      >
                        Pick Up
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
