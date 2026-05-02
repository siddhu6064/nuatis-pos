import type { CartLine as CartLineType } from "@/hooks/useCart";
import { CartLine } from "./CartLine";
import { formatCurrency } from "@/lib/currency";
import { calcSubtotal, calcTax, calcTotal } from "@/lib/cartMath";

interface CartProps {
  lines: CartLineType[];
  pulsingServiceId: string | null;
  onIncrement: (serviceId: string) => void;
  onDecrement: (serviceId: string) => void;
  onRemove: (serviceId: string) => void;
  onClear: () => void;
  onCharge: () => void;
}

export function Cart({
  lines,
  pulsingServiceId,
  onIncrement,
  onDecrement,
  onRemove,
  onClear,
  onCharge,
}: CartProps) {
  const subtotalCents = calcSubtotal(lines);
  const taxCents = calcTax(subtotalCents);
  const totalCents = calcTotal(subtotalCents, taxCents);
  const isEmpty = lines.length === 0;

  return (
    <div
      className="h-full flex flex-col border-l border-black/8"
      style={{ backgroundColor: "#F8F7F4" }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/8 flex-shrink-0">
        <span
          className="text-[22px] font-bold text-gray-900"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Cart
        </span>
        {!isEmpty && (
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

      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex items-center justify-center h-32 px-4">
            <p
              className="text-[16px] text-center leading-relaxed"
              style={{
                fontFamily: "'Epilogue', sans-serif",
                color: "#6B7280",
              }}
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
                  onIncrement={onIncrement}
                  onDecrement={onDecrement}
                  onRemove={onRemove}
                />
                {idx < lines.length - 1 && (
                  <div className="mx-4 h-px bg-black/6" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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

        <div className="flex items-center justify-between mb-3">
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

        <div className="flex items-center justify-between mb-4 pt-2 border-t border-black/8">
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

        <button
          onClick={isEmpty ? undefined : onCharge}
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
          Charge
        </button>
      </div>
    </div>
  );
}
