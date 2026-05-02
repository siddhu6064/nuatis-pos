import { useState } from "react";
import type { Transaction } from "@/hooks/useCheckout";
import { STAFF } from "@/lib/staff";
import { formatCurrency } from "@/lib/currency";
import { calcLineTotalCents } from "@/lib/cartMath";

interface RefundPickerProps {
  transaction: Transaction;
  refundedLineIds: Set<string>;
  onComplete: (selectedLineIds: string[]) => void;
  onCancel: () => void;
}

export function RefundPicker({
  transaction: tx,
  refundedLineIds,
  onComplete,
  onCancel,
}: RefundPickerProps) {
  const eligibleLines = tx.lineItems.filter(
    (l) => !refundedLineIds.has(l.lineId),
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);

  const allSelected = eligibleLines.length > 0 &&
    eligibleLines.every((l) => selectedIds.has(l.lineId));

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(eligibleLines.map((l) => l.lineId)));
    }
  }

  function toggleLine(lineId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) {
        next.delete(lineId);
      } else {
        next.add(lineId);
      }
      return next;
    });
  }

  const selectedLines = eligibleLines.filter((l) => selectedIds.has(l.lineId));
  const lineRefundCents = selectedLines.reduce(
    (s, l) => s + calcLineTotalCents(l),
    0,
  );
  const taxRefundCents =
    tx.subtotalCents > 0
      ? Math.round((lineRefundCents / tx.subtotalCents) * tx.taxCents)
      : 0;
  const totalRefundCents = lineRefundCents + taxRefundCents;
  const canConfirm = selectedIds.size > 0 && !processing;

  function handleConfirm() {
    if (!canConfirm) return;
    setProcessing(true);
    setTimeout(() => {
      onComplete(Array.from(selectedIds));
    }, 1500);
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Processing overlay */}
      {processing && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        >
          <p
            className="text-white text-[16px] font-semibold"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Processing refund…
          </p>
        </div>
      )}

      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
        style={{ borderColor: "#E5E7EB" }}
      >
        <p
          className="text-[22px] font-bold text-gray-900"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Refund Items
        </p>
        <button
          onClick={onCancel}
          className="text-[14px] font-medium text-gray-500 hover:text-gray-800 transition-colors"
          style={{ fontFamily: "'Epilogue', sans-serif" }}
        >
          Cancel
        </button>
      </div>

      {/* Refund All toggle */}
      <div
        className="px-5 py-3 border-b flex items-center justify-between flex-shrink-0"
        style={{ borderColor: "#E5E7EB" }}
      >
        <span
          className="text-[14px] font-medium text-gray-700"
          style={{ fontFamily: "'Epilogue', sans-serif" }}
        >
          Refund All
        </span>
        <button
          onClick={toggleAll}
          className="w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center transition-all duration-100"
          style={{
            borderColor: allSelected ? "#DC2626" : "#D1D5DB",
            backgroundColor: allSelected ? "#DC2626" : "white",
          }}
          aria-label="Toggle refund all"
        >
          {allSelected && (
            <span className="text-white text-[13px] font-bold leading-none">
              ✓
            </span>
          )}
        </button>
      </div>

      {/* Line list */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {eligibleLines.map((line) => {
          const checked = selectedIds.has(line.lineId);
          const staff = STAFF.find((s) => s.id === line.staffId);
          const lineTotal = calcLineTotalCents(line);
          return (
            <button
              key={line.lineId}
              onClick={() => toggleLine(line.lineId)}
              className="w-full text-left px-3 py-3 rounded-xl flex items-center gap-3 transition-colors duration-100 mb-1"
              style={{ backgroundColor: checked ? "#FFF5F5" : "#FAFAFA" }}
            >
              <div
                className="w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-100"
                style={{
                  borderColor: checked ? "#DC2626" : "#D1D5DB",
                  backgroundColor: checked ? "#DC2626" : "white",
                }}
              >
                {checked && (
                  <span className="text-white text-[13px] font-bold leading-none">
                    ✓
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[14px] font-medium text-gray-900 truncate"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  {line.name}
                </p>
                <p
                  className="text-[12px] text-gray-400"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  {line.quantity} × {formatCurrency(line.priceCents)}
                  {staff ? ` · ${staff.firstName}` : ""}
                  {line.discountPercent > 0
                    ? ` · −${line.discountPercent}%`
                    : ""}
                </p>
              </div>
              <span
                className="text-[14px] font-semibold text-gray-900 tabular-nums flex-shrink-0"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {formatCurrency(lineTotal)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer: live total + buttons */}
      <div
        className="px-5 pt-3 pb-4 border-t flex-shrink-0"
        style={{ borderColor: "#E5E7EB" }}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-[13px] text-gray-500"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Lines
          </span>
          <span
            className="text-[13px] tabular-nums text-gray-800"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            −{formatCurrency(lineRefundCents)}
          </span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-[13px] text-gray-500"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Tax (proportional)
          </span>
          <span
            className="text-[13px] tabular-nums text-gray-800"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            −{formatCurrency(taxRefundCents)}
          </span>
        </div>
        <div className="flex items-center justify-between mb-3 pt-2 border-t" style={{ borderColor: "#E5E7EB" }}>
          <span
            className="text-[15px] font-semibold"
            style={{ fontFamily: "'Epilogue', sans-serif", color: "#DC2626" }}
          >
            Refund Total
          </span>
          <span
            className="text-[18px] font-bold tabular-nums"
            style={{ fontFamily: "'Fraunces', serif", color: "#DC2626" }}
          >
            −{formatCurrency(totalRefundCents)}
          </span>
        </div>
        <p
          className="text-[11px] text-gray-400 mb-3"
          style={{ fontFamily: "'Epilogue', sans-serif" }}
        >
          Tip is not refunded per policy.
        </p>
        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="w-full h-[52px] rounded-xl text-[16px] font-semibold text-white transition-all duration-100"
          style={{
            fontFamily: "'Epilogue', sans-serif",
            backgroundColor: canConfirm ? "#DC2626" : "#D1D5DB",
            cursor: canConfirm ? "pointer" : "not-allowed",
          }}
        >
          {selectedIds.size === 0
            ? "Select lines to refund"
            : `Confirm Refund −${formatCurrency(totalRefundCents)}`}
        </button>
      </div>
    </div>
  );
}
