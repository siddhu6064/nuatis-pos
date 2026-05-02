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
  onConfirmCharge: () => void;
  onTipPresetSelect: (preset: string, subtotalCents: number) => void;
  onCustomTipApply: (cents: number) => void;
}

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
  onConfirmCharge,
  onTipPresetSelect,
  onCustomTipApply,
}: CartProps) {
  const { settings } = useVerticalSettings();
  const [showCompModal, setShowCompModal] = useState(false);

  const subtotalCents = calcSubtotal(lines);
  const rawTaxCents = calcTaxWithRate(subtotalCents, settings.taxRatePercent);
  const rawTotalCents = calcTotal(subtotalCents, rawTaxCents, tipCents);

  const displayTaxCents = compApplied ? 0 : rawTaxCents;
  const displayTotalCents = compApplied ? 0 : rawTotalCents;

  const isEmpty = lines.length === 0;
  const isIdle = checkoutState === "idle";
  const inTipState = checkoutState === "tip";
  const frozen = !isIdle;

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

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/8 flex-shrink-0">
        <span
          className="text-[22px] font-bold text-gray-900"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Cart
        </span>
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
              <button
                onClick={() => setShowCompModal(true)}
                className="text-[12px] font-medium transition-colors duration-100"
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  color: "#9CA3AF",
                }}
              >
                Comp Ticket
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-3 pt-2 border-t border-black/8">
          <span
            className="text-[18px] font-semibold text-gray-900"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Total
          </span>
          <span
            className="text-[22px] font-bold tabular-nums"
            style={{
              fontFamily: "'Fraunces', serif",
              color: compApplied ? "#DC2626" : "#111827",
            }}
          >
            {formatCurrency(displayTotalCents)}
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

        <button
          onClick={
            isEmpty
              ? undefined
              : inTipState
                ? onConfirmCharge
                : onStartCheckout
          }
          disabled={isEmpty}
          className="w-full h-[56px] rounded-lg text-[18px] font-semibold text-white transition-all duration-150 active:scale-[0.98]"
          style={{
            fontFamily: "'Epilogue', sans-serif",
            backgroundColor: isEmpty ? "#D1D5DB" : "#E84A00",
            cursor: isEmpty ? "not-allowed" : "pointer",
          }}
        >
          {inTipState
            ? compApplied
              ? "Confirm Comp ($0.00)"
              : `Confirm ${formatCurrency(displayTotalCents)}`
            : "Charge"}
        </button>
      </div>
    </div>
  );
}
