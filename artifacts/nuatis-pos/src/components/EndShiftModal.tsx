import { useState } from "react";
import type { Shift } from "@/lib/shifts";
import { formatElapsed } from "@/lib/shifts";
import { formatCurrency } from "@/lib/currency";
import { transactionsKey } from "@/lib/storage";
import type { Transaction } from "@/hooks/useCheckout";

interface EndShiftModalProps {
  shift: Shift;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ShiftSummary {
  closedAt: number;
  transactionCount: number;
  grossRevenueCents: number;
  cardCents: number;
  cashCents: number;
}

function computeSummary(shift: Shift): ShiftSummary {
  const closedAt = Date.now();
  try {
    const key = transactionsKey(shift.verticalId);
    const raw = localStorage.getItem(key);
    const txs: Transaction[] = raw ? (JSON.parse(raw) as Transaction[]) : [];
    const shiftTxs = txs.filter((tx) => tx.shiftId === shift.id);

    let grossRevenueCents = 0;
    let cardCents = 0;
    let cashCents = 0;

    for (const tx of shiftTxs) {
      const revenue = tx.totalPaid ?? tx.totalCents;
      const refundDeduct = tx.refundedTotalCents ?? 0;
      const net = Math.max(0, revenue - refundDeduct);
      grossRevenueCents += net;

      if (tx.paymentMethod === "split" && tx.payments) {
        for (const p of tx.payments) {
          if (p.method === "card") cardCents += p.amountCents;
          else if (p.method === "cash") cashCents += p.amountCents;
        }
      } else if (tx.paymentMethod === "card") {
        cardCents += net;
      } else if (tx.paymentMethod === "cash") {
        cashCents += net;
      }
    }

    return {
      closedAt,
      transactionCount: shiftTxs.length,
      grossRevenueCents,
      cardCents,
      cashCents,
    };
  } catch {
    return {
      closedAt,
      transactionCount: 0,
      grossRevenueCents: 0,
      cardCents: 0,
      cashCents: 0,
    };
  }
}

function formatHHMM(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function EndShiftModal({ shift, onConfirm, onCancel }: EndShiftModalProps) {
  // Summary computed once at mount — closedAt is stable
  const [summary] = useState<ShiftSummary>(() => computeSummary(shift));

  const duration = formatElapsed(shift.startedAt);

  const totalMix = summary.cardCents + summary.cashCents;
  const cardPct =
    totalMix > 0 ? Math.round((summary.cardCents / totalMix) * 100) : 0;
  const cashPct =
    totalMix > 0 ? Math.round((summary.cashCents / totalMix) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(15,15,16,0.85)" }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[440px] overflow-hidden"
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
            End Shift
          </p>
          <button
            onClick={onCancel}
            className="text-[20px] text-gray-400 hover:text-gray-700 transition-colors leading-none"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Shift metadata */}
          <div
            className="rounded-xl px-4 py-3"
            style={{ backgroundColor: "#F8F7F4" }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-[12px] text-gray-500"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                Opened by
              </span>
              <span
                className="text-[13px] font-semibold text-gray-900"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                {shift.openedByStaffName}
              </span>
            </div>
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-[12px] text-gray-500"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                Opened at
              </span>
              <span
                className="text-[13px] font-semibold tabular-nums"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "#111827",
                }}
              >
                {formatHHMM(shift.startedAt)}
              </span>
            </div>
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-[12px] text-gray-500"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                Closing at
              </span>
              <span
                className="text-[13px] font-semibold tabular-nums"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "#111827",
                }}
              >
                {formatHHMM(summary.closedAt)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span
                className="text-[12px] text-gray-500"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                Duration
              </span>
              <span
                className="text-[13px] font-semibold text-gray-700"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                {duration}
              </span>
            </div>
          </div>

          {/* Transaction count + gross revenue */}
          <div className="flex gap-3">
            <div
              className="flex-1 rounded-xl px-4 py-3 text-center"
              style={{ backgroundColor: "#F8F7F4" }}
            >
              <p
                className="text-[30px] font-bold"
                style={{ fontFamily: "'Fraunces', serif", color: "#111827" }}
              >
                {summary.transactionCount}
              </p>
              <p
                className="text-[11px] text-gray-500 mt-0.5"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                Transactions
              </p>
            </div>
            <div
              className="flex-1 rounded-xl px-4 py-3 text-center"
              style={{ backgroundColor: "#F0FDF4" }}
            >
              <p
                className="text-[30px] font-bold tabular-nums"
                style={{ fontFamily: "'Fraunces', serif", color: "#15803D" }}
              >
                {formatCurrency(summary.grossRevenueCents)}
              </p>
              <p
                className="text-[11px] mt-0.5"
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  color: "#15803D",
                }}
              >
                Gross (refund-adj.)
              </p>
            </div>
          </div>

          {/* Payment mix */}
          <div
            className="rounded-xl px-4 py-3 border"
            style={{ borderColor: "#E5E7EB" }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              Payment mix
            </p>
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[13px] text-gray-700"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                Card
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="text-[11px] text-gray-400"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  {cardPct}%
                </span>
                <span
                  className="text-[14px] font-semibold tabular-nums"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "#111827",
                  }}
                >
                  {formatCurrency(summary.cardCents)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span
                className="text-[13px] text-gray-700"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                Cash
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="text-[11px] text-gray-400"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  {cashPct}%
                </span>
                <span
                  className="text-[14px] font-semibold tabular-nums"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "#111827",
                  }}
                >
                  {formatCurrency(summary.cashCents)}
                </span>
              </div>
            </div>
          </div>

          {summary.transactionCount === 0 && (
            <p
              className="text-[12px] text-gray-400 text-center"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              No shift-stamped transactions in this shift.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 pt-1 flex flex-col gap-2">
          <button
            onClick={onConfirm}
            className="w-full h-[52px] rounded-xl text-[15px] font-semibold text-white transition-all duration-150 active:scale-[0.98]"
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: "#DC2626",
            }}
          >
            Close Shift
          </button>
          <button
            onClick={onCancel}
            className="w-full text-center text-[13px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
