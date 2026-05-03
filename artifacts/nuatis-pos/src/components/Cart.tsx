import { useState } from "react";
import type { CartLine as CartLineType, CartCustomer } from "@/hooks/useCart";
import type { CheckoutState } from "@/hooks/useCheckout";
import type { Modifier } from "@/lib/modifiers";
import { CartLine } from "./CartLine";
import { TipPicker } from "./TipPicker";
import { CompModal } from "./CompModal";
import { formatCurrency } from "@/lib/currency";
import { calcSubtotal, calcTaxWithRate, calcTotal } from "@/lib/cartMath";
import { useVerticalSettings } from "@/hooks/useVerticalSettings";

interface CartProps {
  lines: CartLineType[];
  pulsingServiceId: string | null;
  onIncrement: (lineId: string) => void;
  onDecrement: (lineId: string) => void;
  onRemove: (lineId: string) => void;
  onClear: () => void;
  onHold: () => void;
  onStaffChange: (lineId: string, staffId: string) => void;
  onToggleModifier: (lineId: string, modifier: Modifier) => void;
  onSetDiscount: (lineId: string, percent: number) => void;
  compApplied: boolean;
  compReason: string | null;
  onApplyComp: (reason: string) => void;
  onRemoveComp: () => void;
  customer: CartCustomer | null;
  onOpenCustomerSearch: () => void;
  onDetachCustomer: () => void;
  checkoutState: CheckoutState;
  tipCents: number;
  selectedPreset: string | null;
  onStartCheckout: () => void;
  onCancelCheckout: () => void;
  onConfirmCard: () => void;
  onOpenCash: () => void;
  onOpenSplit: () => void;
  onTipPresetSelect: (preset: string, subtotalCents: number) => void;
  onCustomTipApply: (cents: number) => void;
  depositApplied?: number;
  // B23: session support
  elapsedTick: number;
  stopSession: (lineId: string) => void;
  // B26: shift gate
  isShiftOpen: boolean;
  // B27: drop-off workflow
  workflow: "same_visit" | "drop_off";
  openTicketId: string | null;
  openTicketTag: string | null;
  pickupCustomerName: string | null;
  onDropOff: () => void;
  onReturnToInProgress: () => void;
}

const SESSION_GATE_TOOLTIP = "Stop all sessions before checkout";
const SHIFT_GATE_TOOLTIP = "Open a shift to transact";

export function Cart({
  lines,
  pulsingServiceId,
  onIncrement,
  onDecrement,
  onRemove,
  onClear,
  onHold,
  onStaffChange,
  onToggleModifier,
  onSetDiscount,
  compApplied,
  compReason,
  onApplyComp,
  onRemoveComp,
  customer,
  onOpenCustomerSearch,
  onDetachCustomer,
  checkoutState,
  tipCents,
  selectedPreset,
  onStartCheckout,
  onCancelCheckout,
  onConfirmCard,
  onOpenCash,
  onOpenSplit,
  onTipPresetSelect,
  onCustomTipApply,
  depositApplied = 0,
  elapsedTick,
  stopSession,
  isShiftOpen,
  workflow,
  openTicketId,
  openTicketTag,
  pickupCustomerName,
  onDropOff,
  onReturnToInProgress,
}: CartProps) {
  const { settings } = useVerticalSettings();
  const [showCompModal, setShowCompModal] = useState(false);

  const subtotalCents = calcSubtotal(lines);
  const rawTaxCents = calcTaxWithRate(subtotalCents, settings.taxRatePercent);
  const rawTotalCents = calcTotal(subtotalCents, rawTaxCents, tipCents);

  const displayTaxCents = compApplied ? 0 : rawTaxCents;
  const displayTotalCents = compApplied ? 0 : rawTotalCents;

  const depositCredit = compApplied ? 0 : depositApplied;
  const balanceCents = Math.max(0, displayTotalCents - depositCredit);
  const hasDeposit = depositCredit > 0;
  const buttonAmount = hasDeposit ? balanceCents : displayTotalCents;

  const splitDisabled = compApplied || buttonAmount < 100;

  const isEmpty = lines.length === 0;
  const isIdle = checkoutState === "idle";
  const inTipState = checkoutState === "tip";
  const frozen = !isIdle;

  // B23: gate checkout when any session line is still active
  const hasActiveSessions = lines.some(
    (l) => l.sessionStartedAt !== undefined && l.sessionEndedAt === undefined,
  );

  // B27: drop-off workflow derived flags
  const isDropOffMode = workflow === "drop_off" && !openTicketId;
  const isPickupMode = workflow === "drop_off" && !!openTicketId;
  const dropOffDisabled = isEmpty || !customer || !isShiftOpen;
  const dropOffTitle = !isShiftOpen
    ? SHIFT_GATE_TOOLTIP
    : !customer
      ? "Customer required for drop-off"
      : isEmpty
        ? "Add items to drop off"
        : undefined;

  const taxLabel = `Tax (${settings.taxRatePercent % 1 === 0 ? settings.taxRatePercent.toFixed(0) : settings.taxRatePercent}%)`;

  return (
    <div
      className="h-full flex flex-col border-l border-black/8"
      style={{ backgroundColor: "#F8F7F4" }}
    >
      {showCompModal && (
        <CompModal
          onConfirm={(reason) => {
            onApplyComp(reason);
            setShowCompModal(false);
          }}
          onClose={() => setShowCompModal(false)}
        />
      )}

      {/* Customer pill */}
      <div
        className="px-4 py-2 border-b border-black/8 flex-shrink-0"
        style={{ minHeight: "40px" }}
      >
        {customer ? (
          <div className="flex items-center justify-between">
            <span
              className="text-[13px] font-medium text-gray-700"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              {customer.firstName} {customer.lastName[0]}.
            </span>
            <button
              onClick={onDetachCustomer}
              className="text-[12px] text-gray-400 hover:text-red-500 transition-colors px-1"
              aria-label="Detach customer"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenCustomerSearch}
            className="text-[13px] font-medium transition-colors duration-100"
            style={{ color: "#E84A00", fontFamily: "'Epilogue', sans-serif" }}
          >
            + Customer
          </button>
        )}
      </div>

      {/* Deposit banner */}
      {hasDeposit && !isEmpty && (
        <div
          className="px-4 py-2 border-b flex-shrink-0 flex items-center gap-2"
          style={{ backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }}
        >
          <span style={{ fontSize: "13px" }}>↩</span>
          <span
            className="text-[12px] font-semibold"
            style={{ color: "#15803D", fontFamily: "'Epilogue', sans-serif" }}
          >
            Deposit on file: {formatCurrency(depositCredit)} · credited at checkout
          </span>
        </div>
      )}

      {/* B27: Pickup mode banner */}
      {isPickupMode && (
        <div
          className="px-4 py-2 border-b flex-shrink-0 flex items-center justify-between"
          style={{ backgroundColor: "#EFF6FF", borderColor: "#BFDBFE", borderBottomWidth: 1 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[14px]">📦</span>
            <span
              className="text-[12px] font-semibold"
              style={{ color: "#1D4ED8", fontFamily: "'Epilogue', sans-serif" }}
            >
              Pickup · {openTicketTag} · {pickupCustomerName}
            </span>
          </div>
          <button
            onClick={onReturnToInProgress}
            className="text-[11px] font-medium transition-colors duration-100"
            style={{ color: "#1D4ED8", fontFamily: "'Epilogue', sans-serif" }}
          >
            Return to In Progress
          </button>
        </div>
      )}

      {/* B23: Active session banner */}
      {hasActiveSessions && (
        <div
          className="px-4 py-2 border-b flex-shrink-0 flex items-center gap-2"
          style={{ backgroundColor: "#FFFBEB", borderColor: "#FDE68A", borderBottomWidth: 1 }}
        >
          <span className="text-[14px]">⏱</span>
          <span
            className="text-[12px] font-semibold"
            style={{ color: "#B45309", fontFamily: "'Epilogue', sans-serif" }}
          >
            Session in progress — stop session to checkout
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/8 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span
            className="text-[22px] font-bold text-gray-900"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Cart
          </span>
          {isDropOffMode && (
            <span
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: "#2563EB", fontFamily: "'Epilogue', sans-serif" }}
            >
              Drop-Off Mode
            </span>
          )}
        </div>
        {!isEmpty && isIdle && (
          <div className="flex items-center gap-3">
            <button
              onClick={onHold}
              className="text-[13px] font-medium text-gray-500 hover:text-amber-600 transition-colors duration-150 px-2 py-1 rounded hover:bg-amber-50"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              Hold
            </button>
            <button
              onClick={onClear}
              className="text-[13px] font-medium text-gray-500 hover:text-red-500 transition-colors duration-150 px-2 py-1 rounded hover:bg-red-50"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Line items */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex items-center justify-center h-32 px-4">
            <p
              className="text-[16px] text-center leading-relaxed"
              style={{ fontFamily: "'Epilogue', sans-serif", color: "#6B7280" }}
            >
              Tap a service to start.
            </p>
          </div>
        ) : (
          <div>
            {lines.map((line, idx) => (
              <div key={line.lineId}>
                <CartLine
                  line={line}
                  isPulsing={pulsingServiceId === line.serviceId}
                  frozen={frozen}
                  onIncrement={onIncrement}
                  onDecrement={onDecrement}
                  onRemove={onRemove}
                  onStaffChange={onStaffChange}
                  onToggleModifier={onToggleModifier}
                  onSetDiscount={onSetDiscount}
                  elapsedTick={elapsedTick}
                  stopSession={stopSession}
                />
                {idx < lines.length - 1 && (
                  <div className="mx-4 h-px bg-black/6" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tip picker (hidden when comped) */}
      {inTipState && (
        <>
          <div className="mx-4 h-px bg-black/8" />
          {compApplied ? (
            <div
              className="px-4 py-4 text-[14px] text-gray-500 italic text-center"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              Comped — no tip applicable
            </div>
          ) : (
            <TipPicker
              subtotalCents={subtotalCents}
              selectedPreset={selectedPreset}
              tipPresets={settings.tipPresets}
              onPresetSelect={onTipPresetSelect}
              onCustomApply={onCustomTipApply}
            />
          )}
        </>
      )}

      {/* Math summary + action */}
      <div className="flex-shrink-0 border-t border-black/8 px-4 pt-3 pb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="text-[14px] text-gray-500"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Subtotal
          </span>
          <span
            className="text-[14px] font-medium text-gray-800 tabular-nums"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {formatCurrency(subtotalCents)}
          </span>
        </div>

        <div className="flex items-center justify-between mb-1.5">
          <span
            className="text-[14px] text-gray-500"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            {taxLabel}
          </span>
          <span
            className="text-[14px] font-medium tabular-nums"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: compApplied ? "#DC2626" : "#1F2937",
            }}
          >
            {formatCurrency(displayTaxCents)}
          </span>
        </div>

        {inTipState && !compApplied && tipCents > 0 && (
          <div className="flex items-center justify-between mb-1.5">
            <span
              className="text-[14px] text-gray-500"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              Tip
            </span>
            <span
              className="text-[14px] font-medium text-gray-800 tabular-nums"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {formatCurrency(tipCents)}
            </span>
          </div>
        )}

        {/* Deposit credit row (tip state only) */}
        {inTipState && hasDeposit && (
          <div className="flex items-center justify-between mb-1.5">
            <span
              className="text-[14px]"
              style={{ fontFamily: "'Epilogue', sans-serif", color: "#15803D" }}
            >
              Deposit credit
            </span>
            <span
              className="text-[14px] font-medium tabular-nums"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: "#15803D" }}
            >
              −{formatCurrency(depositCredit)}
            </span>
          </div>
        )}

        {isIdle && !isEmpty && (
          <div className="flex items-center justify-between mb-2">
            {compApplied ? (
              <div className="flex items-center gap-1.5 w-full">
                <span
                  className="text-[12px] font-semibold flex-1"
                  style={{
                    fontFamily: "'Epilogue', sans-serif",
                    color: "#DC2626",
                  }}
                >
                  COMPED · {compReason}
                </span>
                <button
                  onClick={onRemoveComp}
                  className="text-[12px] text-gray-400 hover:text-red-500 transition-colors"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                  aria-label="Undo comp"
                >
                  ✕ undo
                </button>
              </div>
            ) : (
              /* Comp button gated while sessions active or no open shift */
              <button
                onClick={hasActiveSessions || !isShiftOpen ? undefined : () => setShowCompModal(true)}
                disabled={hasActiveSessions || !isShiftOpen}
                title={!isShiftOpen ? SHIFT_GATE_TOOLTIP : hasActiveSessions ? SESSION_GATE_TOOLTIP : undefined}
                className="text-[12px] font-medium transition-colors duration-100"
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  color: hasActiveSessions || !isShiftOpen ? "#D1D5DB" : "#9CA3AF",
                  cursor: hasActiveSessions || !isShiftOpen ? "not-allowed" : "pointer",
                }}
              >
                Comp Ticket
              </button>
            )}
          </div>
        )}

        {/* Total / Balance due row */}
        <div className="flex items-center justify-between mb-3 pt-2 border-t border-black/8">
          <span
            className="text-[18px] font-semibold text-gray-900"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            {inTipState && hasDeposit ? "Balance due" : "Total"}
          </span>
          <span
            className="text-[22px] font-bold tabular-nums"
            style={{
              fontFamily: "'Fraunces', serif",
              color: compApplied ? "#DC2626" : "#111827",
            }}
          >
            {formatCurrency(inTipState && hasDeposit ? balanceCents : displayTotalCents)}
          </span>
        </div>

        {inTipState && (
          <button
            onClick={onCancelCheckout}
            className="w-full text-center text-[13px] font-medium text-gray-400 hover:text-gray-600 transition-colors duration-150 mb-2"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Cancel
          </button>
        )}

        {/* Action buttons */}
        {inTipState ? (
          compApplied ? (
            <button
              onClick={!isShiftOpen ? undefined : onConfirmCard}
              disabled={!isShiftOpen}
              title={!isShiftOpen ? SHIFT_GATE_TOOLTIP : undefined}
              className="w-full h-[56px] rounded-lg text-[17px] font-semibold text-white transition-all duration-150 active:scale-[0.98]"
              style={{
                fontFamily: "'Epilogue', sans-serif",
                backgroundColor: !isShiftOpen ? "#D1D5DB" : "#E84A00",
                cursor: !isShiftOpen ? "not-allowed" : "pointer",
              }}
            >
              Confirm Comp ($0.00)
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                {/* Card — gated on active sessions and shift */}
                <button
                  onClick={hasActiveSessions || !isShiftOpen ? undefined : onConfirmCard}
                  disabled={hasActiveSessions || !isShiftOpen}
                  title={!isShiftOpen ? SHIFT_GATE_TOOLTIP : hasActiveSessions ? SESSION_GATE_TOOLTIP : undefined}
                  className="flex-1 h-[52px] rounded-lg text-[15px] font-semibold text-white transition-all duration-150 active:scale-[0.98]"
                  style={{
                    fontFamily: "'Epilogue', sans-serif",
                    backgroundColor: hasActiveSessions || !isShiftOpen ? "#D1D5DB" : "#E84A00",
                    cursor: hasActiveSessions || !isShiftOpen ? "not-allowed" : "pointer",
                  }}
                >
                  Card {formatCurrency(buttonAmount)}
                </button>
                {/* Cash — gated on active sessions and shift */}
                <button
                  onClick={hasActiveSessions || !isShiftOpen ? undefined : onOpenCash}
                  disabled={hasActiveSessions || !isShiftOpen}
                  title={!isShiftOpen ? SHIFT_GATE_TOOLTIP : hasActiveSessions ? SESSION_GATE_TOOLTIP : undefined}
                  className="flex-1 h-[52px] rounded-lg text-[15px] font-semibold text-white transition-all duration-150 active:scale-[0.98]"
                  style={{
                    fontFamily: "'Epilogue', sans-serif",
                    backgroundColor: hasActiveSessions || !isShiftOpen ? "#D1D5DB" : "#E84A00",
                    cursor: hasActiveSessions || !isShiftOpen ? "not-allowed" : "pointer",
                  }}
                >
                  Cash {formatCurrency(buttonAmount)}
                </button>
              </div>
              {/* Split — gated on active sessions and shift */}
              <button
                onClick={splitDisabled || hasActiveSessions || !isShiftOpen ? undefined : onOpenSplit}
                disabled={splitDisabled || hasActiveSessions || !isShiftOpen}
                title={!isShiftOpen ? SHIFT_GATE_TOOLTIP : hasActiveSessions ? SESSION_GATE_TOOLTIP : undefined}
                className="w-full h-[40px] rounded-lg text-[13px] font-semibold transition-all duration-150 active:scale-[0.98]"
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  color: splitDisabled || hasActiveSessions || !isShiftOpen ? "#9CA3AF" : "#E84A00",
                  backgroundColor: "white",
                  border: `2px solid ${splitDisabled || hasActiveSessions || !isShiftOpen ? "#E5E7EB" : "#E84A00"}`,
                  cursor: splitDisabled || hasActiveSessions || !isShiftOpen ? "not-allowed" : "pointer",
                }}
              >
                Split Card + Cash
              </button>
            </div>
          )
        ) : isDropOffMode ? (
          // B27: Drop-off mode — Drop Off button replaces Charge
          <button
            onClick={dropOffDisabled ? undefined : onDropOff}
            disabled={dropOffDisabled}
            title={dropOffTitle}
            className="w-full h-[56px] rounded-lg text-[18px] font-semibold text-white transition-all duration-150 active:scale-[0.98]"
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: dropOffDisabled ? "#D1D5DB" : "#2563EB",
              cursor: dropOffDisabled ? "not-allowed" : "pointer",
            }}
          >
            Drop Off
          </button>
        ) : (
          // Idle: Charge button — gated on active sessions and shift
          <button
            onClick={isEmpty || hasActiveSessions || !isShiftOpen ? undefined : onStartCheckout}
            disabled={isEmpty || hasActiveSessions || !isShiftOpen}
            title={!isShiftOpen ? SHIFT_GATE_TOOLTIP : hasActiveSessions ? SESSION_GATE_TOOLTIP : undefined}
            className="w-full h-[56px] rounded-lg text-[18px] font-semibold text-white transition-all duration-150 active:scale-[0.98]"
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: isEmpty || hasActiveSessions || !isShiftOpen ? "#D1D5DB" : "#E84A00",
              cursor: isEmpty || hasActiveSessions || !isShiftOpen ? "not-allowed" : "pointer",
            }}
          >
            {!isShiftOpen ? "Open a shift to charge" : hasActiveSessions ? "Stop session to charge" : "Charge"}
          </button>
        )}
      </div>
    </div>
  );
}
