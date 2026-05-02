import { useState, useEffect } from "react";

const COMP_REASONS = [
  "Loyalty Reward",
  "Manager Discount",
  "Promo / Voucher",
  "Service Issue",
  "Quality Issue",
  "Other",
] as const;

interface CompModalProps {
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export function CompModal({ onConfirm, onClose }: CompModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherText, setOtherText] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isOther = selectedReason === "Other";
  const canConfirm =
    selectedReason !== null && (!isOther || otherText.trim().length > 0);

  function handleConfirm() {
    if (!canConfirm || !selectedReason) return;
    const reason = isOther ? otherText.trim() : selectedReason;
    onConfirm(reason);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[400px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div className="px-6 pt-6 pb-4">
          <p
            className="text-[22px] font-bold text-gray-900"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Comp this ticket?
          </p>
          <p
            className="text-[13px] text-gray-500 mt-1"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Select a reason to proceed.
          </p>
        </div>

        {/* Reason list */}
        <div className="px-4 pb-2 flex flex-col gap-1.5">
          {COMP_REASONS.map((reason) => {
            const active = selectedReason === reason;
            return (
              <button
                key={reason}
                onClick={() => setSelectedReason(reason)}
                className="w-full h-[52px] rounded-xl text-left px-4 text-[15px] font-medium transition-all duration-100"
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  fontWeight: active ? 700 : 500,
                  backgroundColor: active ? "#FFF0E8" : "#F9FAFB",
                  color: active ? "#E84A00" : "#374151",
                  border: active
                    ? "2px solid #E84A00"
                    : "2px solid transparent",
                }}
              >
                {reason}
              </button>
            );
          })}

          {/* Other text input */}
          {isOther && (
            <input
              type="text"
              value={otherText}
              onChange={(e) =>
                setOtherText(e.target.value.slice(0, 60))
              }
              placeholder="Describe reason…"
              maxLength={60}
              autoFocus
              className="w-full h-[42px] px-3 text-[14px] rounded-lg border outline-none"
              style={{
                fontFamily: "'Epilogue', sans-serif",
                borderColor: "#E84A00",
              }}
            />
          )}
        </div>

        {/* Buttons */}
        <div className="px-4 pt-3 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-[52px] rounded-xl text-[15px] font-semibold transition-all duration-100"
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: "white",
              color: "#E84A00",
              border: "2px solid #E84A00",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1 h-[52px] rounded-xl text-[15px] font-semibold text-white transition-all duration-100"
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: canConfirm ? "#E84A00" : "#D1D5DB",
              cursor: canConfirm ? "pointer" : "not-allowed",
            }}
          >
            Confirm Comp
          </button>
        </div>
      </div>
    </div>
  );
}
