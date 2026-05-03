import { useState } from "react";
import type { Staff } from "@/lib/staff";
import { formatCurrency } from "@/lib/currency";
import {
  appendCashDigit,
  appendDoubleCashZero,
  backspaceCashDigit,
} from "@/lib/cashMath";

interface StartShiftModalProps {
  activeStaff: Staff;
  onConfirm: (staffId: string, staffName: string, startingCashCents: number) => void;
  onClose: () => void;
}

const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, "00", 0, "⌫"] as const;

export function StartShiftModal({
  activeStaff,
  onConfirm,
  onClose,
}: StartShiftModalProps) {
  const [cashCents, setCashCents] = useState(0);

  function handleOpen(skipCash: boolean) {
    onConfirm(activeStaff.id, activeStaff.firstName, skipCash ? 0 : cashCents);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(15,15,16,0.85)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[400px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "#E5E7EB" }}
        >
          <p
            className="text-[20px] font-bold text-gray-900"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Start Shift
          </p>
          <button
            onClick={onClose}
            className="text-[20px] text-gray-400 hover:text-gray-700 transition-colors leading-none"
          >
            ✕
          </button>
        </div>

        {/* Opening operator */}
        <div className="px-5 pt-4 pb-3">
          <p
            className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Opening operator
          </p>
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ backgroundColor: "#F3F4F6" }}
          >
            <span
              className="text-[15px] font-semibold text-gray-900"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              {activeStaff.firstName}
            </span>
            <span
              className="text-[13px] text-gray-500"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              · {activeStaff.role}
            </span>
          </div>
        </div>

        {/* Starting cash display */}
        <div className="px-5 pb-2">
          <p
            className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Starting cash float (optional)
          </p>
          <p
            className="text-[42px] font-bold tabular-nums text-center leading-none py-3"
            style={{
              fontFamily: "'Fraunces', serif",
              color: cashCents === 0 ? "#D1D5DB" : "#111827",
            }}
          >
            {formatCurrency(cashCents)}
          </p>
        </div>

        {/* Keypad — reuses cashMath helpers */}
        <div className="px-4 pb-2 grid grid-cols-3 gap-1.5">
          {KEYS.map((k) => (
            <button
              key={k}
              onClick={() => {
                if (k === "⌫") setCashCents((p) => backspaceCashDigit(p));
                else if (k === "00") setCashCents((p) => appendDoubleCashZero(p));
                else setCashCents((p) => appendCashDigit(p, k as number));
              }}
              className="h-[44px] rounded-xl text-[18px] font-semibold tabular-nums transition-all duration-75 active:scale-95 select-none"
              style={{
                fontFamily:
                  k === "⌫" ? "'Epilogue', sans-serif" : "'JetBrains Mono', monospace",
                backgroundColor: k === "⌫" ? "#FEE2E2" : "#F3F4F6",
                color: k === "⌫" ? "#DC2626" : "#111827",
              }}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="px-4 pb-5 pt-3 flex flex-col gap-2">
          <button
            onClick={() => handleOpen(false)}
            className="w-full h-[52px] rounded-xl text-[15px] font-semibold text-white transition-all duration-150 active:scale-[0.98]"
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: "#E84A00",
            }}
          >
            Open Shift
            {cashCents > 0 ? ` · Float ${formatCurrency(cashCents)}` : ""}
          </button>
          <button
            onClick={() => handleOpen(true)}
            className="w-full text-center text-[13px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Skip starting cash
          </button>
        </div>
      </div>
    </div>
  );
}
