import { useState } from "react";
import type { SplitPayment } from "@/hooks/useCheckout";
import { formatCurrency } from "@/lib/currency";
import {
  appendCashDigit,
  appendDoubleCashZero,
  backspaceCashDigit,
  computeQuickTenders,
} from "@/lib/cashMath";

interface SplitTenderModalProps {
  totalCents: number;     // post-deposit balance to split
  onConfirmSplit: (payments: SplitPayment[]) => void;
  onClose: () => void;
}

type SplitMode = "allocating" | "card-processing" | "cash-tendering";
type AllocateSide = "card" | "cash";

const NUM_BTN =
  "h-[52px] rounded-xl text-[20px] font-semibold tabular-nums transition-all duration-75 active:scale-95 select-none";

export function SplitTenderModal({
  totalCents,
  onConfirmSplit,
  onClose,
}: SplitTenderModalProps) {
  const [mode, setMode] = useState<SplitMode>("allocating");
  const [activeSide, setActiveSide] = useState<AllocateSide>("card");

  const [cardCents, setCardCents] = useState(0);
  const [cashCents, setCashCents] = useState(0);

  const [cardSettled, setCardSettled] = useState(false);
  const [cardProcessedAt, setCardProcessedAt] = useState<number | null>(null);
  const [cashSettled, setCashSettled] = useState(false);
  const [cashProcessedAt, setCashProcessedAt] = useState<number | null>(null);

  // Cash sub-flow state
  const [cashTenderedCents, setCashTenderedCents] = useState(0);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const remaining = totalCents - cardCents - cashCents;

  const canComplete =
    mode === "allocating" &&
    remaining === 0 &&
    (cardCents === 0 || cardSettled) &&
    (cashCents === 0 || cashSettled) &&
    cardCents + cashCents > 0;

  const canChargeCard =
    mode === "allocating" && cardCents > 0 && !cardSettled;
  const canTenderCash =
    mode === "allocating" && cashCents > 0 && !cashSettled;
  const canConfirmCash = cashTenderedCents >= cashCents;
  const cashChange = Math.max(0, cashTenderedCents - cashCents);

  // ── Allocate mode keypad ───────────────────────────────────────────────────

  function handleAllocateDigit(d: number) {
    if (mode !== "allocating") return;
    if (activeSide === "card" && !cardSettled) {
      const next = appendCashDigit(cardCents, d);
      setCardCents(Math.min(next, totalCents - cashCents));
    } else if (activeSide === "cash" && !cashSettled) {
      const next = appendCashDigit(cashCents, d);
      setCashCents(Math.min(next, totalCents - cardCents));
    }
  }

  function handleAllocateDoubleZero() {
    if (mode !== "allocating") return;
    if (activeSide === "card" && !cardSettled) {
      const next = appendDoubleCashZero(cardCents);
      setCardCents(Math.min(next, totalCents - cashCents));
    } else if (activeSide === "cash" && !cashSettled) {
      const next = appendDoubleCashZero(cashCents);
      setCashCents(Math.min(next, totalCents - cardCents));
    }
  }

  function handleAllocateBackspace() {
    if (mode !== "allocating") return;
    if (activeSide === "card" && !cardSettled)
      setCardCents(backspaceCashDigit(cardCents));
    else if (activeSide === "cash" && !cashSettled)
      setCashCents(backspaceCashDigit(cashCents));
  }

  function handleSplitEvenly() {
    if (cardSettled || cashSettled) return;
    // Odd cent goes to Card (arbitrary tiebreaker)
    setCardCents(Math.ceil(totalCents / 2));
    setCashCents(Math.floor(totalCents / 2));
  }

  // ── Card charge ────────────────────────────────────────────────────────────

  function handleChargeCard() {
    if (!canChargeCard) return;
    setMode("card-processing");
    setTimeout(() => {
      setCardSettled(true);
      setCardProcessedAt(Date.now());
      setMode("allocating");
      // Auto-switch to cash if card was active side
      if (activeSide === "card") setActiveSide("cash");
    }, 2000);
  }

  // ── Cash tender sub-flow ───────────────────────────────────────────────────

  function handleTenderCash() {
    if (!canTenderCash) return;
    setCashTenderedCents(0);
    setMode("cash-tendering");
  }

  function handleTenderDigit(d: number) {
    setCashTenderedCents((prev) => appendCashDigit(prev, d));
  }
  function handleTenderDoubleZero() {
    setCashTenderedCents((prev) => appendDoubleCashZero(prev));
  }
  function handleTenderBackspace() {
    setCashTenderedCents((prev) => backspaceCashDigit(prev));
  }

  function handleConfirmCash() {
    if (!canConfirmCash) return;
    setCashSettled(true);
    setCashProcessedAt(Date.now());
    setMode("allocating");
    // Auto-switch to card if there's something left
    if (activeSide === "cash") setActiveSide("card");
  }

  // ── Complete ───────────────────────────────────────────────────────────────

  function handleComplete() {
    if (!canComplete) return;
    const payments: SplitPayment[] = [];
    if (cardCents > 0) {
      payments.push({
        method: "card",
        amountCents: cardCents,
        processedAt: cardProcessedAt ?? Date.now(),
      });
    }
    if (cashCents > 0) {
      payments.push({
        method: "cash",
        amountCents: cashCents,
        processedAt: cashProcessedAt ?? Date.now(),
        tenderedCents: cashTenderedCents,
        changeCents: cashChange,
      });
    }
    onConfirmSplit(payments);
  }

  // ── Cancel ─────────────────────────────────────────────────────────────────

  function handleCancel() {
    if (cardSettled || cashSettled) {
      setShowCancelConfirm(true);
    } else {
      onClose();
    }
  }

  // ── Remaining colour ───────────────────────────────────────────────────────

  let remainingColor = "#E84A00"; // orange = still owed
  if (remaining === 0) remainingColor = "#15803D"; // green = balanced
  else if (remaining < 0) remainingColor = "#DC2626"; // red = impossible but defensive

  const quickTenders = computeQuickTenders(cashCents);

  const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, "00", 0, "⌫"] as const;

  // ── Portion card component (inline) ───────────────────────────────────────

  function PortionCard({
    side,
    cents,
    settled,
    processing,
  }: {
    side: AllocateSide;
    cents: number;
    settled: boolean;
    processing: boolean;
  }) {
    const isActive = activeSide === side && !settled;
    return (
      <div
        className="flex-1 rounded-xl p-3 border-2 transition-all duration-150"
        style={{
          borderColor: settled
            ? "#BBF7D0"
            : isActive
              ? "#E84A00"
              : "#E5E7EB",
          backgroundColor: settled
            ? "#F0FDF4"
            : isActive
              ? "#FFF7F4"
              : "white",
        }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="text-[11px] font-semibold uppercase tracking-wide text-gray-500"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            {side === "card" ? "Card" : "Cash"}
          </span>
          {settled ? (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: "#D1FAE5",
                color: "#15803D",
                fontFamily: "'Epilogue', sans-serif",
              }}
            >
              🔒 {side === "card" ? "CHARGED" : "TENDERED"}
            </span>
          ) : processing ? (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: "#FEF3C7",
                color: "#92400E",
                fontFamily: "'Epilogue', sans-serif",
              }}
            >
              PROCESSING
            </span>
          ) : (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: "#F3F4F6",
                color: "#9CA3AF",
                fontFamily: "'Epilogue', sans-serif",
              }}
            >
              PENDING
            </span>
          )}
        </div>
        <p
          className="text-[28px] font-bold tabular-nums leading-none"
          style={{
            fontFamily: "'Fraunces', serif",
            color: settled ? "#15803D" : "#111827",
            opacity: processing ? 0.4 : 1,
          }}
        >
          {formatCurrency(cents)}
        </p>
        {/* Cash settled: show tender details */}
        {side === "cash" && settled && cashTenderedCents > 0 && (
          <p
            className="text-[10px] text-gray-500 mt-0.5"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Tndr {formatCurrency(cashTenderedCents)} · Chg{" "}
            {formatCurrency(cashChange)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(15,15,16,0.85)" }}
      onClick={showCancelConfirm ? undefined : handleCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[480px] flex flex-col overflow-hidden relative"
        style={{ maxHeight: "94vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cancel confirm overlay */}
        {showCancelConfirm && (
          <div className="absolute inset-0 z-20 bg-black/50 flex items-center justify-center p-6 rounded-2xl">
            <div className="bg-white rounded-2xl p-5 w-full shadow-2xl">
              <p
                className="text-[18px] font-bold text-gray-900 mb-1"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Cancel split?
              </p>
              <p
                className="text-[13px] text-gray-500 mb-4 leading-snug"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                Any card charges already processed would be voided in
                production. This is a prototype — no actual void occurs.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 h-[44px] rounded-xl text-[14px] font-semibold text-white"
                  style={{
                    fontFamily: "'Epilogue', sans-serif",
                    backgroundColor: "#DC2626",
                  }}
                >
                  Yes, Cancel
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 h-[44px] rounded-xl text-[14px] font-semibold"
                  style={{
                    fontFamily: "'Epilogue', sans-serif",
                    backgroundColor: "#F3F4F6",
                    color: "#374151",
                  }}
                >
                  Keep Going
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: "#E5E7EB" }}
        >
          <div>
            <p
              className="text-[20px] font-bold text-gray-900"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              {mode === "cash-tendering" ? "Cash Tender" : "Split Tender"}
            </p>
            <p
              className="text-[12px] text-gray-400 mt-0.5"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Total: {formatCurrency(totalCents)}
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="text-[20px] text-gray-400 hover:text-gray-700 transition-colors leading-none"
          >
            ✕
          </button>
        </div>

        {/* ── Cash tendering sub-flow ──────────────────────────────────────── */}
        {mode === "cash-tendering" ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Amount display */}
            <div
              className="px-5 py-4 border-b flex-shrink-0 text-center"
              style={{ borderColor: "#E5E7EB", backgroundColor: "#F8F7F4" }}
            >
              <p
                className="text-[12px] text-gray-400 mb-1"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                Amount tendered
              </p>
              <p
                className="text-[44px] font-bold tabular-nums leading-none"
                style={{ fontFamily: "'Fraunces', serif", color: "#111827" }}
              >
                {formatCurrency(cashTenderedCents)}
              </p>
              <p
                className="text-[14px] font-medium mt-1"
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  color: canConfirmCash
                    ? cashChange === 0
                      ? "#6B7280"
                      : "#16A34A"
                    : "#9CA3AF",
                }}
              >
                {cashTenderedCents === 0
                  ? `Need ${formatCurrency(cashCents)}`
                  : !canConfirmCash
                    ? `Need ${formatCurrency(cashCents - cashTenderedCents)} more`
                    : cashChange === 0
                      ? "No change due"
                      : `Change due: ${formatCurrency(cashChange)}`}
              </p>
            </div>

            {/* Quick tenders */}
            <div
              className="px-4 py-2 flex gap-2 overflow-x-auto flex-shrink-0 border-b"
              style={{ borderColor: "#E5E7EB" }}
            >
              {quickTenders.map((amount, i) => (
                <button
                  key={amount}
                  onClick={() => setCashTenderedCents(amount)}
                  className="flex-shrink-0 h-[40px] px-3 rounded-xl text-[12px] font-semibold transition-all duration-75 active:scale-95 flex flex-col items-center justify-center leading-tight"
                  style={{
                    fontFamily: "'Epilogue', sans-serif",
                    backgroundColor:
                      cashTenderedCents === amount ? "#FFF0E8" : "#F3F4F6",
                    color:
                      cashTenderedCents === amount ? "#E84A00" : "#374151",
                    border:
                      cashTenderedCents === amount
                        ? "1.5px solid #E84A00"
                        : "1.5px solid transparent",
                    minWidth: i === 0 ? "88px" : "60px",
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

            {/* Cash keypad */}
            <div className="px-4 py-2 grid grid-cols-3 gap-2 flex-shrink-0">
              {KEYS.map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    if (k === "⌫") handleTenderBackspace();
                    else if (k === "00") handleTenderDoubleZero();
                    else handleTenderDigit(k as number);
                  }}
                  className={NUM_BTN}
                  style={{
                    fontFamily:
                      k === "⌫"
                        ? "'Epilogue', sans-serif"
                        : "'JetBrains Mono', monospace",
                    backgroundColor: k === "⌫" ? "#FEE2E2" : "#F3F4F6",
                    color: k === "⌫" ? "#DC2626" : "#111827",
                    fontSize: k === "⌫" ? "18px" : "20px",
                  }}
                >
                  {k}
                </button>
              ))}
            </div>

            {/* Confirm cash */}
            <div className="px-4 pb-4 flex-shrink-0">
              <button
                onClick={canConfirmCash ? handleConfirmCash : undefined}
                disabled={!canConfirmCash}
                className="w-full h-[52px] rounded-xl text-[15px] font-semibold text-white transition-all duration-150 active:scale-[0.98] mb-2"
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  backgroundColor: canConfirmCash ? "#E84A00" : "#D1D5DB",
                  cursor: canConfirmCash ? "pointer" : "not-allowed",
                }}
              >
                Confirm Cash {formatCurrency(cashCents)}
              </button>
              <button
                onClick={() => setMode("allocating")}
                className="w-full text-center text-[13px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                ← Back to split
              </button>
            </div>
          </div>
        ) : (
          /* ── Allocating / card-processing ────────────────────────────────── */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Portion cards */}
            <div className="px-4 pt-4 pb-3 flex gap-3 flex-shrink-0">
              <PortionCard
                side="card"
                cents={cardCents}
                settled={cardSettled}
                processing={mode === "card-processing"}
              />
              <PortionCard
                side="cash"
                cents={cashCents}
                settled={cashSettled}
                processing={false}
              />
            </div>

            {/* Remaining display */}
            <div className="px-4 mb-3 flex-shrink-0">
              <div
                className="rounded-xl px-4 py-2.5 flex items-center justify-between"
                style={{
                  backgroundColor: remaining === 0 ? "#F0FDF4" : "#F8F7F4",
                }}
              >
                <span
                  className="text-[13px] font-medium text-gray-500"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  Remaining
                </span>
                <span
                  className="text-[22px] font-bold tabular-nums"
                  style={{
                    fontFamily: "'Fraunces', serif",
                    color: remainingColor,
                  }}
                >
                  {formatCurrency(remaining)}
                </span>
              </div>
            </div>

            {/* Card processing animation */}
            {mode === "card-processing" ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8 flex-1">
                <div className="flex items-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: "#E84A00",
                        animation: "dot-fade 1.2s ease-in-out infinite",
                        animationDelay: `${i * 400}ms`,
                      }}
                    />
                  ))}
                </div>
                <p
                  className="text-[14px] text-gray-500"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  Present card to reader…
                </p>
                <p
                  className="text-[30px] font-bold tabular-nums"
                  style={{ fontFamily: "'Fraunces', serif", color: "#111827" }}
                >
                  {formatCurrency(cardCents)}
                </p>
              </div>
            ) : (
              <>
                {/* Segmented control */}
                <div className="px-4 mb-2 flex-shrink-0">
                  <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                    {(["card", "cash"] as const).map((side) => {
                      const settled =
                        side === "card" ? cardSettled : cashSettled;
                      return (
                        <button
                          key={side}
                          onClick={() => !settled && setActiveSide(side)}
                          disabled={settled}
                          className="flex-1 h-[32px] rounded-lg text-[13px] font-semibold transition-all duration-100"
                          style={{
                            fontFamily: "'Epilogue', sans-serif",
                            backgroundColor:
                              activeSide === side ? "white" : "transparent",
                            color: settled
                              ? "#9CA3AF"
                              : activeSide === side
                                ? "#E84A00"
                                : "#6B7280",
                            boxShadow:
                              activeSide === side
                                ? "0 1px 3px rgba(0,0,0,0.1)"
                                : "none",
                            cursor: settled ? "not-allowed" : "pointer",
                          }}
                        >
                          {side === "card" ? "Card" : "Cash"}
                          {settled && " 🔒"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Split evenly + keypad */}
                <div className="px-4 mb-2 flex-shrink-0">
                  <button
                    onClick={handleSplitEvenly}
                    disabled={cardSettled && cashSettled}
                    className="w-full h-[34px] rounded-xl text-[13px] font-semibold transition-all duration-75 active:scale-[0.98] mb-2"
                    style={{
                      fontFamily: "'Epilogue', sans-serif",
                      backgroundColor: "#F3F4F6",
                      color:
                        cardSettled && cashSettled ? "#9CA3AF" : "#374151",
                      cursor:
                        cardSettled && cashSettled
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    Split evenly
                  </button>

                  <div className="grid grid-cols-3 gap-2">
                    {KEYS.map((k) => {
                      const sideLocked =
                        activeSide === "card" ? cardSettled : cashSettled;
                      return (
                        <button
                          key={k}
                          onClick={() => {
                            if (sideLocked) return;
                            if (k === "⌫") handleAllocateBackspace();
                            else if (k === "00") handleAllocateDoubleZero();
                            else handleAllocateDigit(k as number);
                          }}
                          disabled={sideLocked}
                          className={NUM_BTN}
                          style={{
                            fontFamily:
                              k === "⌫"
                                ? "'Epilogue', sans-serif"
                                : "'JetBrains Mono', monospace",
                            backgroundColor:
                              k === "⌫"
                                ? sideLocked
                                  ? "#F3F4F6"
                                  : "#FEE2E2"
                                : "#F3F4F6",
                            color:
                              k === "⌫"
                                ? sideLocked
                                  ? "#9CA3AF"
                                  : "#DC2626"
                                : sideLocked
                                  ? "#9CA3AF"
                                  : "#111827",
                            fontSize: k === "⌫" ? "18px" : "20px",
                            cursor: sideLocked ? "not-allowed" : "pointer",
                          }}
                        >
                          {k}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="px-4 pb-4 flex-shrink-0 flex flex-col gap-2">
                  {canComplete ? (
                    <button
                      onClick={handleComplete}
                      className="w-full h-[52px] rounded-xl text-[16px] font-semibold text-white transition-all duration-150 active:scale-[0.98]"
                      style={{
                        fontFamily: "'Epilogue', sans-serif",
                        backgroundColor: "#E84A00",
                      }}
                    >
                      Complete Split Sale
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={canChargeCard ? handleChargeCard : undefined}
                        disabled={!canChargeCard}
                        className="flex-1 h-[52px] rounded-xl text-[13px] font-semibold text-white transition-all duration-150 active:scale-[0.98]"
                        style={{
                          fontFamily: "'Epilogue', sans-serif",
                          backgroundColor: canChargeCard
                            ? "#E84A00"
                            : "#D1D5DB",
                          cursor: canChargeCard ? "pointer" : "not-allowed",
                        }}
                      >
                        {cardSettled
                          ? `Card ${formatCurrency(cardCents)} ✓`
                          : `Charge Card ${formatCurrency(cardCents)}`}
                      </button>
                      <button
                        onClick={canTenderCash ? handleTenderCash : undefined}
                        disabled={!canTenderCash}
                        className="flex-1 h-[52px] rounded-xl text-[13px] font-semibold text-white transition-all duration-150 active:scale-[0.98]"
                        style={{
                          fontFamily: "'Epilogue', sans-serif",
                          backgroundColor: canTenderCash
                            ? "#E84A00"
                            : "#D1D5DB",
                          cursor: canTenderCash ? "pointer" : "not-allowed",
                        }}
                      >
                        {cashSettled
                          ? `Cash ${formatCurrency(cashCents)} ✓`
                          : `Tender Cash ${formatCurrency(cashCents)}`}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
