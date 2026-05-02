import { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/lib/currency";
import {
  appendCashDigit,
  appendDoubleCashZero,
  backspaceCashDigit,
  computeQuickTenders,
} from "@/lib/cashMath";

interface CashTenderModalProps {
  totalCents: number;
  onConfirm: (amountTendered: number) => void;
  onCancel: () => void;
}

function TenderedDisplay({
  tenderedCents,
  totalCents,
}: {
  tenderedCents: number;
  totalCents: number;
}) {
  const diff = tenderedCents - totalCents;
  const canConfirm = tenderedCents >= totalCents;

  let changeLabel: string;
  let changeColor: string;

  if (tenderedCents === 0) {
    changeLabel = `Need ${formatCurrency(totalCents)} more`;
    changeColor = "#9CA3AF";
  } else if (!canConfirm) {
    changeLabel = `Need ${formatCurrency(-diff)} more`;
    changeColor = "#9CA3AF";
  } else if (diff === 0) {
    changeLabel = "No change due";
    changeColor = "#6B7280";
  } else {
    changeLabel = `Change due: ${formatCurrency(diff)}`;
    changeColor = "#16A34A";
  }

  return (
    <div className="flex flex-col items-center gap-1 py-5">
      <p
        className="text-[42px] font-bold tabular-nums leading-none"
        style={{ fontFamily: "'JetBrains Mono', monospace", color: "#111827" }}
      >
        {formatCurrency(tenderedCents)}
      </p>
      <p
        className="text-[15px] font-medium"
        style={{ fontFamily: "'Epilogue', sans-serif", color: changeColor }}
      >
        {changeLabel}
      </p>
    </div>
  );
}

export function CashTenderModal({
  totalCents,
  onConfirm,
  onCancel,
}: CashTenderModalProps) {
  const [tenderedCents, setTenderedCents] = useState(0);

  const canConfirm = tenderedCents >= totalCents;
  const quickTenders = computeQuickTenders(totalCents);

  const handleDigit = useCallback((d: number) => {
    setTenderedCents((prev) => appendCashDigit(prev, d));
  }, []);

  const handleDoubleZero = useCallback(() => {
    setTenderedCents((prev) => appendDoubleCashZero(prev));
  }, []);

  const handleBackspace = useCallback(() => {
    setTenderedCents((prev) => backspaceCashDigit(prev));
  }, []);

  // Keyboard support
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      if (e.key === "Enter" && canConfirm) {
        onConfirm(tenderedCents);
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        setTenderedCents((prev) => backspaceCashDigit(prev));
        return;
      }
      if (/^[0-9]$/.test(e.key)) {
        setTenderedCents((prev) => appendCashDigit(prev, parseInt(e.key, 10)));
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel, onConfirm, canConfirm, tenderedCents]);

  const numBtnBase =
    "h-[64px] rounded-xl text-[22px] font-semibold tabular-nums transition-all duration-75 active:scale-95 select-none";

  const keys: Array<{ label: string; action: () => void }> = [
    { label: "1", action: () => handleDigit(1) },
    { label: "2", action: () => handleDigit(2) },
    { label: "3", action: () => handleDigit(3) },
    { label: "4", action: () => handleDigit(4) },
    { label: "5", action: () => handleDigit(5) },
    { label: "6", action: () => handleDigit(6) },
    { label: "7", action: () => handleDigit(7) },
    { label: "8", action: () => handleDigit(8) },
    { label: "9", action: () => handleDigit(9) },
    { label: "00", action: handleDoubleZero },
    { label: "0", action: () => handleDigit(0) },
    { label: "⌫", action: handleBackspace },
  ];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ backgroundColor: "rgba(15,15,16,0.75)" }}
      onClick={onCancel}
    >
      <div
        className="rounded-2xl shadow-2xl w-[420px] flex flex-col overflow-hidden"
        style={{ backgroundColor: "white" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: "#E5E7EB" }}
        >
          <div>
            <p
              className="text-[18px] font-bold text-gray-900"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Cash Payment
            </p>
            <p
              className="text-[13px] text-gray-400 mt-0.5"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              Total:{" "}
              <span
                className="font-semibold tabular-nums"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "#111827",
                }}
              >
                {formatCurrency(totalCents)}
              </span>
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-[20px] text-gray-400 hover:text-gray-700 transition-colors leading-none"
          >
            ✕
          </button>
        </div>

        {/* Tendered display */}
        <div
          className="flex-shrink-0 border-b"
          style={{ borderColor: "#E5E7EB", backgroundColor: "#F8F7F4" }}
        >
          <div className="px-4 pt-1 pb-0 text-[12px] font-medium text-gray-400 text-center" style={{ fontFamily: "'Epilogue', sans-serif" }}>
            Amount tendered
          </div>
          <TenderedDisplay
            tenderedCents={tenderedCents}
            totalCents={totalCents}
          />
        </div>

        {/* Quick-tender row */}
        <div
          className="px-4 py-3 flex gap-2 overflow-x-auto flex-shrink-0 border-b"
          style={{ borderColor: "#E5E7EB" }}
        >
          {quickTenders.map((amount, i) => (
            <button
              key={amount}
              onClick={() => setTenderedCents(amount)}
              className="flex-shrink-0 h-[44px] px-3 rounded-xl text-[12px] font-semibold transition-all duration-75 active:scale-95 flex flex-col items-center justify-center leading-tight"
              style={{
                fontFamily: "'Epilogue', sans-serif",
                backgroundColor:
                  tenderedCents === amount ? "#FFF0E8" : "#F3F4F6",
                color: tenderedCents === amount ? "#E84A00" : "#374151",
                border:
                  tenderedCents === amount
                    ? "1.5px solid #E84A00"
                    : "1.5px solid transparent",
                minWidth: i === 0 ? "88px" : "64px",
              }}
            >
              {i === 0 ? (
                <>
                  <span className="text-[10px] font-normal">Exact</span>
                  <span
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {formatCurrency(amount)}
                  </span>
                </>
              ) : (
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {formatCurrency(amount)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Numpad */}
        <div className="px-4 py-3 grid grid-cols-3 gap-2 flex-shrink-0">
          {keys.map((k) => (
            <button
              key={k.label}
              onClick={k.action}
              className={numBtnBase}
              style={{
                fontFamily:
                  k.label === "⌫"
                    ? "'Epilogue', sans-serif"
                    : "'JetBrains Mono', monospace",
                backgroundColor: k.label === "⌫" ? "#FEE2E2" : "#F3F4F6",
                color: k.label === "⌫" ? "#DC2626" : "#111827",
                fontSize: k.label === "⌫" ? "20px" : "22px",
              }}
            >
              {k.label}
            </button>
          ))}
        </div>

        {/* Confirm button */}
        <div className="px-4 pb-4">
          <button
            onClick={() => canConfirm && onConfirm(tenderedCents)}
            disabled={!canConfirm}
            className="w-full h-[56px] rounded-xl text-[16px] font-semibold text-white transition-all duration-150 active:scale-[0.98]"
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: canConfirm ? "#E84A00" : "#D1D5DB",
              cursor: canConfirm ? "pointer" : "not-allowed",
            }}
          >
            Complete Cash Sale
          </button>
        </div>
      </div>
    </div>
  );
}
