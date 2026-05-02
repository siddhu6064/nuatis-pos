import { useState, useEffect } from "react";
import { useActiveVertical } from "@/hooks/useActiveVertical";
import { formatPhone } from "@/lib/phone";
import { formatCurrency } from "@/lib/currency";
import {
  formatWaitElapsed,
  MAX_WAITLIST,
  type WaitlistEntry,
} from "@/lib/waitlist";
import { AddWalkInModal } from "@/components/AddWalkInModal";

interface WaitlistOverlayProps {
  entries: WaitlistEntry[];
  onAdd: (partial: Omit<WaitlistEntry, "id" | "addedAt">) => void;
  onRemove: (id: string) => void;
  onStartService: (entry: WaitlistEntry) => void;
  cartIsIdle: boolean;
  onClose: () => void;
}

export function WaitlistOverlay({
  entries,
  onAdd,
  onRemove,
  onStartService,
  cartIsIdle,
  onClose,
}: WaitlistOverlayProps) {
  const { config } = useActiveVertical();
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const isFull = entries.length >= MAX_WAITLIST;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !showAddModal) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, showAddModal]);

  function handleAdd(partial: Omit<WaitlistEntry, "id" | "addedAt">) {
    onAdd(partial);
    setShowAddModal(false);
  }

  function handleConfirmRemove(id: string) {
    onRemove(id);
    setConfirmRemoveId(null);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex flex-col"
        style={{ backgroundColor: "rgba(15,15,16,0.85)" }}
        onClick={onClose}
      >
        <div
          className="relative m-auto w-full max-w-[680px] max-h-[88vh] rounded-2xl shadow-2xl flex flex-col"
          style={{ backgroundColor: "white" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top bar */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
            style={{ borderColor: "#E5E7EB" }}
          >
            <div>
              <p
                className="text-[20px] font-bold text-gray-900 leading-tight"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Waitlist · {config.displayName}
              </p>
              <p
                className="text-[13px] text-gray-400 mt-0.5"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                {entries.length === 0
                  ? "No one waiting"
                  : `${entries.length} of ${MAX_WAITLIST} spots filled`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Add Walk-in button */}
              <div className="flex flex-col items-end gap-0.5">
                <button
                  onClick={() => !isFull && setShowAddModal(true)}
                  disabled={isFull}
                  className="h-[38px] px-4 rounded-xl text-[13px] font-semibold text-white transition-opacity"
                  style={{
                    fontFamily: "'Epilogue', sans-serif",
                    backgroundColor: isFull ? "#D1D5DB" : "#E84A00",
                    cursor: isFull ? "not-allowed" : "pointer",
                  }}
                >
                  + Walk-in
                </button>
                {isFull && (
                  <p
                    className="text-[11px] text-gray-400"
                    style={{ fontFamily: "'Epilogue', sans-serif" }}
                  >
                    Waitlist full (10 max)
                  </p>
                )}
              </div>

              {/* Close */}
              <button
                onClick={onClose}
                className="text-[20px] text-gray-400 hover:text-gray-700 transition-colors leading-none"
              >
                ✕
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <p
                  className="text-[18px] font-semibold text-gray-400"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  No one waiting
                </p>
                <p
                  className="text-[13px] text-gray-300"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  Tap "+ Walk-in" to add someone to the queue
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {entries.map((entry, idx) => {
                  const isConfirming = confirmRemoveId === entry.id;
                  const displayPhone =
                    entry.phone.length >= 10 ? formatPhone(entry.phone) : null;
                  const elapsed = formatWaitElapsed(entry.addedAt);

                  return (
                    <div
                      key={entry.id}
                      className="rounded-xl border px-4 py-3"
                      style={{
                        borderColor: "#E5E7EB",
                        backgroundColor: "#FAFAFA",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Position badge */}
                        <div
                          className="flex-shrink-0 w-[32px] h-[32px] rounded-full flex items-center justify-center mt-0.5 text-[14px] font-bold"
                          style={{
                            fontFamily: "'Fraunces', serif",
                            backgroundColor: "#FFF0E8",
                            color: "#E84A00",
                          }}
                        >
                          {idx + 1}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="text-[16px] font-semibold text-gray-900 truncate"
                              style={{ fontFamily: "'Epilogue', sans-serif" }}
                            >
                              {entry.name}
                            </span>
                            {/* Wait badge */}
                            <span
                              className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                backgroundColor: "#F3F4F6",
                                color: "#6B7280",
                              }}
                            >
                              {elapsed}
                            </span>
                          </div>

                          {/* Phone */}
                          {displayPhone && (
                            <p
                              className="text-[13px] text-gray-500 mt-0.5"
                              style={{ fontFamily: "'Epilogue', sans-serif" }}
                            >
                              {displayPhone}
                            </p>
                          )}

                          {/* Service */}
                          {entry.serviceName && entry.servicePriceCents !== null && (
                            <p
                              className="text-[12px] text-gray-400 mt-0.5"
                              style={{ fontFamily: "'Epilogue', sans-serif" }}
                            >
                              {entry.serviceName} ·{" "}
                              <span
                                style={{ fontFamily: "'Fraunces', serif" }}
                              >
                                {formatCurrency(entry.servicePriceCents)}
                              </span>
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        {!isConfirming && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() =>
                                cartIsIdle && onStartService(entry)
                              }
                              disabled={!cartIsIdle}
                              title={
                                !cartIsIdle
                                  ? "Finish current ticket first"
                                  : undefined
                              }
                              className="h-[36px] px-3 rounded-lg text-[13px] font-semibold text-white transition-opacity"
                              style={{
                                fontFamily: "'Epilogue', sans-serif",
                                backgroundColor: cartIsIdle
                                  ? "#E84A00"
                                  : "#D1D5DB",
                                cursor: cartIsIdle ? "pointer" : "not-allowed",
                              }}
                            >
                              Start Service
                            </button>
                            <button
                              onClick={() => setConfirmRemoveId(entry.id)}
                              className="h-[36px] w-[36px] rounded-lg text-[14px] text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
                              style={{ backgroundColor: "#F3F4F6" }}
                              aria-label={`Remove ${entry.name} from waitlist`}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Inline confirm remove */}
                      {isConfirming && (
                        <div
                          className="mt-3 p-3 rounded-xl"
                          style={{
                            backgroundColor: "#FFF5F5",
                            border: "1px solid #FCA5A5",
                          }}
                        >
                          <p
                            className="text-[13px] text-gray-700 mb-2"
                            style={{ fontFamily: "'Epilogue', sans-serif" }}
                          >
                            Remove{" "}
                            <span className="font-semibold">{entry.name}</span>{" "}
                            from waitlist?
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleConfirmRemove(entry.id)}
                              className="flex-1 h-[32px] rounded-lg text-[13px] font-semibold text-white"
                              style={{
                                fontFamily: "'Epilogue', sans-serif",
                                backgroundColor: "#DC2626",
                              }}
                            >
                              Remove
                            </button>
                            <button
                              onClick={() => setConfirmRemoveId(null)}
                              className="flex-1 h-[32px] rounded-lg text-[13px] font-medium text-gray-700"
                              style={{
                                fontFamily: "'Epilogue', sans-serif",
                                backgroundColor: "#F3F4F6",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddWalkInModal
          onSubmit={handleAdd}
          onCancel={() => setShowAddModal(false)}
        />
      )}
    </>
  );
}
