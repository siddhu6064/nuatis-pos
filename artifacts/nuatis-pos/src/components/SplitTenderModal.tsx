import { useState, useRef } from "react";
import type { SplitPayment } from "@/hooks/useCheckout";
import { formatCurrency } from "@/lib/currency";
import {
  appendCashDigit,
  appendDoubleCashZero,
  backspaceCashDigit,
  computeQuickTenders,
} from "@/lib/cashMath";

const MAX_LEGS = 5;

// Internal captured leg — richer than SplitPayment (includes cash change details)
interface CapturedLeg {
  method: "card" | "cash";
  amountCents: number;
  capturedAt: number;
  mockLast4?: string;     // card only — 4-digit string, generated once at capture time
  tenderedCents?: number; // cash only
  changeCents?: number;   // cash only
}

type ModalMode = "leg-picker" | "card-processing" | "cash-tendering";

interface SplitTenderModalProps {
  totalCents: number; // post-deposit balance to split
  onConfirmSplit: (payments: SplitPayment[]) => void;
  onClose: () => void;
}

const NUM_BTN =
  "h-[52px] rounded-xl text-[20px] font-semibold tabular-nums transition-all duration-75 active:scale-95 select-none";

const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, "00", 0, "⌫"] as const;

function generateMockLast4(): string {
  return String(Math.floor(Math.random() * 9000) + 1000);
}

export function SplitTenderModal({
  totalCents,
  onConfirmSplit,
  onClose,
}: SplitTenderModalProps) {
  // ── Core state ─────────────────────────────────────────────────────────────
  const [legs, setLegs] = useState<CapturedLeg[]>([]);
  const [mode, setMode] = useState<ModalMode>("leg-picker");

  // Amount the user is composing for the NEXT leg (clamped to remaining; defaults to full total)
  const [legAmountCents, setLegAmountCents] = useState(totalCents);

  // Cash tender sub-flow: how much the customer has physically given
  const [cashTenderedCents, setCashTenderedCents] = useState(0);

  // Toast (5-leg cap, etc.)
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cancel-with-void-disclaimer overlay
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Track the amount being processed in card-processing mode (stable across the 2s wait)
  const processingAmountRef = useRef(0);

  // ── Derived values ─────────────────────────────────────────────────────────
  const capturedTotal = legs.reduce((s, l) => s + l.amountCents, 0);
  const remaining = totalCents - capturedTotal;

  // On the 5th (final) leg: lock amount to full remaining, disable keypad
  const isLastLeg = legs.length >= MAX_LEGS - 1;
  const effectiveLegAmount = isLastLeg
    ? remaining
    : Math.min(legAmountCents, remaining);

  const capturedCardLegs = legs.filter((l) => l.method === "card");
  const hasCardLegs = capturedCardLegs.length > 0;
  const canComplete = mode === "leg-picker" && remaining === 0 && legs.length > 0;

  // Cash sub-flow
  const cashLegAmount = effectiveLegAmount;
  const canConfirmCash = cashTenderedCents >= cashLegAmount;
  const cashChange = Math.max(0, cashTenderedCents - cashLegAmount);
  const quickTenders = computeQuickTenders(cashLegAmount);

  // ── Toast helper ───────────────────────────────────────────────────────────
  function showToast(msg: string) {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 2200);
  }

  // ── Leg-picker amount keypad ───────────────────────────────────────────────
  function handleDigit(d: number) {
    if (isLastLeg || mode !== "leg-picker") return;
    setLegAmountCents((prev) => Math.min(appendCashDigit(prev, d), remaining));
  }
  function handleDoubleZero() {
    if (isLastLeg || mode !== "leg-picker") return;
    setLegAmountCents((prev) => Math.min(appendDoubleCashZero(prev), remaining));
  }
  function handleBackspace() {
    if (isLastLeg || mode !== "leg-picker") return;
    setLegAmountCents((prev) => backspaceCashDigit(prev));
  }

  // ── Card charge ────────────────────────────────────────────────────────────
  function handleChargeCard() {
    if (legs.length >= MAX_LEGS) {
      showToast("Maximum 5 split legs per transaction");
      return;
    }
    const amount = effectiveLegAmount;
    if (amount <= 0) return;
    processingAmountRef.current = amount;
    setMode("card-processing");
    // 2-second simulated reader — no setInterval, setTimeout only
    setTimeout(() => {
      const mockLast4 = generateMockLast4();
      const newLeg: CapturedLeg = {
        method: "card",
        amountCents: amount,
        capturedAt: Date.now(),
        mockLast4,
      };
      setLegs((prev) => [...prev, newLeg]);
      // Reset leg amount to the new remaining after this capture
      setLegAmountCents(remaining - amount);
      setMode("leg-picker");
    }, 2000);
  }

  // ── Cash tender sub-flow ───────────────────────────────────────────────────
  function handleTenderCash() {
    if (legs.length >= MAX_LEGS) {
      showToast("Maximum 5 split legs per transaction");
      return;
    }
    const amount = effectiveLegAmount;
    if (amount <= 0) return;
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
    const amount = cashLegAmount;
    const newLeg: CapturedLeg = {
      method: "cash",
      amountCents: amount,
      capturedAt: Date.now(),
      tenderedCents: cashTenderedCents,
      changeCents: cashChange,
    };
    setLegs((prev) => [...prev, newLeg]);
    setLegAmountCents(remaining - amount);
    setCashTenderedCents(0);
    setMode("leg-picker");
  }

  // ── Complete ───────────────────────────────────────────────────────────────
  function handleComplete() {
    if (!canComplete) return;
    const payments: SplitPayment[] = legs.map((l) => ({
      method: l.method,
      amountCents: l.amountCents,
      processedAt: l.capturedAt,
      ...(l.mockLast4 !== undefined ? { mockLast4: l.mockLast4 } : {}),
      ...(l.tenderedCents !== undefined ? { tenderedCents: l.tenderedCents } : {}),
      ...(l.changeCents !== undefined ? { changeCents: l.changeCents } : {}),
    }));
    onConfirmSplit(payments);
  }

  // ── Cancel ─────────────────────────────────────────────────────────────────
  function handleCancel() {
    if (mode === "card-processing") return; // cannot cancel mid-reader
    if (hasCardLegs) {
      setShowCancelConfirm(true);
    } else {
      onClose();
    }
  }

  // ── Remaining colour ───────────────────────────────────────────────────────
  const remainingColor =
    remaining === 0 ? "#15803D" : remaining < 0 ? "#DC2626" : "#E84A00";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(15,15,16,0.85)" }}
      onClick={mode === "card-processing" ? undefined : handleCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[480px] flex flex-col overflow-hidden relative"
        style={{ maxHeight: "94vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Toast ──────────────────────────────────────────────────────────── */}
        {toastMsg && (
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl shadow-lg text-[13px] font-semibold text-white"
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: "#DC2626",
              whiteSpace: "nowrap",
            }}
          >
            {toastMsg}
          </div>
        )}

        {/* ── Cancel confirm overlay ──────────────────────────────────────────── */}
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
                className="text-[13px] text-gray-500 mb-3 leading-snug"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                The following card charges have already been captured:
              </p>
              <div className="space-y-1 mb-3">
                {capturedCardLegs.map((leg, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ backgroundColor: "#FEF2F2" }}
                  >
                    <span className="text-[13px] font-semibold text-gray-700" style={{ fontFamily: "'Epilogue', sans-serif" }}>
                      Card
                    </span>
                    <span
                      className="text-[13px] tabular-nums text-gray-900"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {formatCurrency(leg.amountCents)}
                    </span>
                    <span
                      className="text-[12px] text-gray-500"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      ****{leg.mockLast4}
                    </span>
                  </div>
                ))}
              </div>
              <p
                className="text-[11px] text-gray-400 mb-4 leading-snug"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                In production, all captured charges would be reversed via the Stripe Terminal void API. This is a prototype — no actual void occurs.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 h-[44px] rounded-xl text-[14px] font-semibold text-white"
                  style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: "#DC2626" }}
                >
                  Yes, Cancel
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 h-[44px] rounded-xl text-[14px] font-semibold"
                  style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: "#F3F4F6", color: "#374151" }}
                >
                  Keep Going
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal header ───────────────────────────────────────────────────── */}
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
              {legs.length > 0 && (
                <span className="ml-2 text-gray-300">
                  · Leg {legs.length + (mode !== "leg-picker" ? 1 : 0)} of ≤{MAX_LEGS}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={mode === "card-processing" ? undefined : handleCancel}
            className="text-[20px] text-gray-400 hover:text-gray-700 transition-colors leading-none"
            style={{ cursor: mode === "card-processing" ? "not-allowed" : "pointer", opacity: mode === "card-processing" ? 0.3 : 1 }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ── CASH TENDERING SUB-FLOW ─────────────────────────────────────── */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {mode === "cash-tendering" ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Amount display */}
            <div
              className="px-5 py-4 border-b flex-shrink-0 text-center"
              style={{ borderColor: "#E5E7EB", backgroundColor: "#F8F7F4" }}
            >
              <p className="text-[12px] text-gray-400 mb-1" style={{ fontFamily: "'Epilogue', sans-serif" }}>
                Cash — amount tendered
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
                    ? cashChange === 0 ? "#6B7280" : "#16A34A"
                    : "#9CA3AF",
                }}
              >
                {cashTenderedCents === 0
                  ? `Need ${formatCurrency(cashLegAmount)}`
                  : !canConfirmCash
                    ? `Need ${formatCurrency(cashLegAmount - cashTenderedCents)} more`
                    : cashChange === 0
                      ? "No change due"
                      : `Change due: ${formatCurrency(cashChange)}`}
              </p>
            </div>

            {/* Quick tenders */}
            <div className="px-4 py-2 flex gap-2 overflow-x-auto flex-shrink-0 border-b" style={{ borderColor: "#E5E7EB" }}>
              {quickTenders.map((amount, i) => (
                <button
                  key={amount}
                  onClick={() => setCashTenderedCents(amount)}
                  className="flex-shrink-0 h-[40px] px-3 rounded-xl text-[12px] font-semibold transition-all duration-75 active:scale-95 flex flex-col items-center justify-center leading-tight"
                  style={{
                    fontFamily: "'Epilogue', sans-serif",
                    backgroundColor: cashTenderedCents === amount ? "#FFF0E8" : "#F3F4F6",
                    color: cashTenderedCents === amount ? "#E84A00" : "#374151",
                    border: cashTenderedCents === amount ? "1.5px solid #E84A00" : "1.5px solid transparent",
                    minWidth: i === 0 ? "88px" : "60px",
                  }}
                >
                  {i === 0 ? (
                    <>
                      <span className="text-[10px] font-normal">Exact</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(amount)}</span>
                    </>
                  ) : (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(amount)}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Keypad */}
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
                    fontFamily: k === "⌫" ? "'Epilogue', sans-serif" : "'JetBrains Mono', monospace",
                    backgroundColor: k === "⌫" ? "#FEE2E2" : "#F3F4F6",
                    color: k === "⌫" ? "#DC2626" : "#111827",
                    fontSize: k === "⌫" ? "18px" : "20px",
                  }}
                >
                  {k}
                </button>
              ))}
            </div>

            {/* Confirm + back */}
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
                Confirm Cash {formatCurrency(cashLegAmount)}
              </button>
              <button
                onClick={() => setMode("leg-picker")}
                className="w-full text-center text-[13px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                ← Back to split
              </button>
            </div>
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════ */
          /* ── LEG-PICKER / CARD-PROCESSING ─────────────────────────────────── */
          /* ═══════════════════════════════════════════════════════════════════ */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Running ledger (captured legs) */}
            {legs.length > 0 && (
              <div
                className="px-4 pt-3 pb-2 flex-shrink-0 border-b"
                style={{ borderColor: "#E5E7EB" }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  Captured legs
                </p>
                <div className="space-y-1">
                  {legs.map((leg, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{
                            fontFamily: "'Epilogue', sans-serif",
                            backgroundColor: leg.method === "card" ? "#EFF6FF" : "#F0FDF4",
                            color: leg.method === "card" ? "#1D4ED8" : "#16A34A",
                          }}
                        >
                          {leg.method === "card" ? "CARD" : "CASH"}
                        </span>
                        <span
                          className="text-[13px] font-semibold tabular-nums text-gray-900"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {formatCurrency(leg.amountCents)}
                        </span>
                        {leg.method === "card" && leg.mockLast4 && (
                          <span
                            className="text-[12px] text-gray-400"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            ****{leg.mockLast4}
                          </span>
                        )}
                        {leg.method === "cash" && leg.tenderedCents !== undefined && (
                          <span
                            className="text-[11px] text-gray-400"
                            style={{ fontFamily: "'Epilogue', sans-serif" }}
                          >
                            Tndr {formatCurrency(leg.tenderedCents)} · Chg {formatCurrency(leg.changeCents ?? 0)}
                          </span>
                        )}
                      </div>
                      <span className="text-[12px] text-green-600 font-bold">✓</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remaining display */}
            <div className="px-4 py-3 flex-shrink-0">
              <div
                className="rounded-xl px-4 py-2.5 flex items-center justify-between"
                style={{ backgroundColor: remaining === 0 ? "#F0FDF4" : "#F8F7F4" }}
              >
                <span
                  className="text-[13px] font-medium text-gray-500"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  Remaining
                </span>
                <span
                  className="text-[26px] font-bold tabular-nums"
                  style={{ fontFamily: "'Fraunces', serif", color: remainingColor }}
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
                  className="text-[34px] font-bold tabular-nums"
                  style={{ fontFamily: "'Fraunces', serif", color: "#111827" }}
                >
                  {formatCurrency(processingAmountRef.current)}
                </p>
                <p
                  className="text-[12px] text-gray-400"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  Leg {legs.length + 1} of ≤{MAX_LEGS}
                </p>
              </div>
            ) : remaining > 0 ? (
              /* ── New leg composer ──────────────────────────────────────────── */
              <>
                {/* Next leg amount display */}
                <div className="px-4 flex-shrink-0">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1"
                    style={{ fontFamily: "'Epilogue', sans-serif" }}
                  >
                    {isLastLeg ? "Final leg (auto-filled)" : "Next leg amount"}
                  </p>
                  <p
                    className="text-[40px] font-bold tabular-nums leading-none mb-1"
                    style={{
                      fontFamily: "'Fraunces', serif",
                      color: isLastLeg ? "#6B7280" : "#111827",
                    }}
                  >
                    {formatCurrency(effectiveLegAmount)}
                  </p>
                  {isLastLeg && (
                    <p
                      className="text-[11px] text-amber-600"
                      style={{ fontFamily: "'Epilogue', sans-serif" }}
                    >
                      Maximum {MAX_LEGS} legs — amount locked to remaining balance
                    </p>
                  )}
                </div>

                {/* Amount keypad (only when not last leg) */}
                {!isLastLeg && (
                  <div className="px-4 py-2 grid grid-cols-3 gap-1.5 flex-shrink-0">
                    {KEYS.map((k) => (
                      <button
                        key={k}
                        onClick={() => {
                          if (k === "⌫") handleBackspace();
                          else if (k === "00") handleDoubleZero();
                          else handleDigit(k as number);
                        }}
                        className="h-[44px] rounded-xl text-[18px] font-semibold tabular-nums transition-all duration-75 active:scale-95 select-none"
                        style={{
                          fontFamily: k === "⌫" ? "'Epilogue', sans-serif" : "'JetBrains Mono', monospace",
                          backgroundColor: k === "⌫" ? "#FEE2E2" : "#F3F4F6",
                          color: k === "⌫" ? "#DC2626" : "#111827",
                          fontSize: k === "⌫" ? "17px" : "18px",
                        }}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                )}

                {/* Card / Cash action buttons */}
                <div className="px-4 pt-2 pb-3 flex gap-2 flex-shrink-0">
                  <button
                    onClick={handleChargeCard}
                    disabled={effectiveLegAmount <= 0}
                    className="flex-1 h-[52px] rounded-xl text-[14px] font-semibold text-white transition-all duration-150 active:scale-[0.98]"
                    style={{
                      fontFamily: "'Epilogue', sans-serif",
                      backgroundColor: effectiveLegAmount > 0 ? "#E84A00" : "#D1D5DB",
                      cursor: effectiveLegAmount > 0 ? "pointer" : "not-allowed",
                    }}
                  >
                    Charge Card {formatCurrency(effectiveLegAmount)}
                  </button>
                  <button
                    onClick={handleTenderCash}
                    disabled={effectiveLegAmount <= 0}
                    className="flex-1 h-[52px] rounded-xl text-[14px] font-semibold transition-all duration-150 active:scale-[0.98]"
                    style={{
                      fontFamily: "'Epilogue', sans-serif",
                      backgroundColor: effectiveLegAmount > 0 ? "white" : "#F3F4F6",
                      color: effectiveLegAmount > 0 ? "#E84A00" : "#9CA3AF",
                      border: `2px solid ${effectiveLegAmount > 0 ? "#E84A00" : "#E5E7EB"}`,
                      cursor: effectiveLegAmount > 0 ? "pointer" : "not-allowed",
                    }}
                  >
                    Tender Cash {formatCurrency(effectiveLegAmount)}
                  </button>
                </div>
              </>
            ) : (
              /* ── All captured — completion state ───────────────────────────── */
              <div className="flex flex-col items-center justify-center gap-2 py-6 flex-1">
                <span className="text-[32px]">✓</span>
                <p
                  className="text-[15px] font-semibold text-green-700"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  All {legs.length} leg{legs.length !== 1 ? "s" : ""} captured
                </p>
              </div>
            )}

            {/* Complete + cancel footer */}
            <div className="px-4 pb-4 flex-shrink-0 flex flex-col gap-2 mt-auto border-t pt-3" style={{ borderColor: "#E5E7EB" }}>
              <button
                onClick={canComplete ? handleComplete : undefined}
                disabled={!canComplete}
                className="w-full h-[52px] rounded-xl text-[15px] font-semibold text-white transition-all duration-150 active:scale-[0.98]"
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  backgroundColor: canComplete ? "#15803D" : "#D1D5DB",
                  cursor: canComplete ? "pointer" : "not-allowed",
                }}
              >
                {canComplete
                  ? `Complete — ${legs.length} leg${legs.length !== 1 ? "s" : ""}`
                  : `Complete Split Sale`}
              </button>
              {mode !== "card-processing" && (
                <button
                  onClick={handleCancel}
                  className="w-full text-center text-[13px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
