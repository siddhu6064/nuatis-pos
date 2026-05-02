import type { CartLine as CartLineType } from "@/hooks/useCart";
import type { CheckoutState } from "@/hooks/useCheckout";
import { CartLine } from "./CartLine";
import { TipPicker } from "./TipPicker";
import { formatCurrency } from "@/lib/currency";
import { calcSubtotal, calcTax, calcTotal } from "@/lib/cartMath";

interface CartProps {
  lines: CartLineType[];
  pulsingServiceId: string | null;
  onIncrement: (serviceId: string) => void;
  onDecrement: (serviceId: string) => void;
  onRemove: (serviceId: string) => void;
  onClear: () => void;
  // checkout
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
  checkoutState,
  tipCents,
  selectedPreset,
  onStartCheckout,
  onCancelCheckout,
  onConfirmCharge,
  onTipPresetSelect,
  onCustomTipApply,
}: CartProps) {
  const subtotalCents = calcSubtotal(lines);
  const taxCents = calcTax(subtotalCents);
  const totalCents = calcTotal(subtotalCents, taxCents, tipCents);
  const isEmpty = lines.length === 0;
  const inTipState = checkoutState === "tip";

  return (
    <div
      className="h-full flex flex-col border-l border-black/8"
      style={{ backgroundColor: "#F8F7F4" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/8 flex-shrink-0">
        <span
          className="text-[22px] font-bold text-gray-900"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Cart
        </span>
        {!isEmpty && !inTipState && (
          <button
            onClick={onClear}
            className="
              text-[13px] font-medium text-gray-500
              hover:text-red-500
              transition-colors duration-150
              px-2 py-1 rounded
              hover:bg-red-50
            "
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Line items — scrollable */}
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
              <div key={line.serviceId}>
                <CartLine
                  line={line}
                  isPulsing={pulsingServiceId === line.serviceId}
                  onIncrement={inTipState ? () => {} : onIncrement}
                  onDecrement={inTipState ? () => {} : onDecrement}
                  onRemove={inTipState ? () => {} : onRemove}
                />
                {idx < lines.length - 1 && (
                  <div className="mx-4 h-px bg-black/6" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tip picker (tip state only) */}
      {inTipState && (
        <>
          <div className="mx-4 h-px bg-black/8" />
          <TipPicker
            subtotalCents={subtotalCents}
            selectedPreset={selectedPreset}
            onPresetSelect={onTipPresetSelect}
            onCustomApply={onCustomTipApply}
          />
        </>
      )}

      {/* Math summary + action button */}
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
            Tax (8.25%)
          </span>
          <span
            className="text-[14px] font-medium text-gray-800 tabular-nums"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {formatCurrency(taxCents)}
          </span>
        </div>

        {inTipState && tipCents > 0 && (
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

        <div className="flex items-center justify-between mb-3 pt-2 border-t border-black/8">
          <span
            className="text-[18px] font-semibold text-gray-900"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Total
          </span>
          <span
            className="text-[22px] font-bold text-gray-900 tabular-nums"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {formatCurrency(totalCents)}
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
          className="
            w-full h-[56px] rounded-lg
            text-[18px] font-semibold text-white
            transition-all duration-150
            active:scale-[0.98]
          "
          style={{
            fontFamily: "'Epilogue', sans-serif",
            backgroundColor: isEmpty ? "#D1D5DB" : "#E84A00",
            cursor: isEmpty ? "not-allowed" : "pointer",
          }}
        >
          {inTipState
            ? `Confirm ${formatCurrency(totalCents)}`
            : "Charge"}
        </button>
      </div>
    </div>
  );
}
