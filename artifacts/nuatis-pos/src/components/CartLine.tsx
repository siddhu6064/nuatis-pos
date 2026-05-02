import type { CartLine as CartLineType } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/currency";

interface CartLineProps {
  line: CartLineType;
  isPulsing: boolean;
  onIncrement: (serviceId: string) => void;
  onDecrement: (serviceId: string) => void;
  onRemove: (serviceId: string) => void;
}

export function CartLine({
  line,
  isPulsing,
  onIncrement,
  onDecrement,
  onRemove,
}: CartLineProps) {
  const lineTotal = line.priceCents * line.quantity;

  return (
    <div
      className="px-4 py-3 transition-colors duration-200"
      style={{
        backgroundColor: isPulsing ? "#FFF0E8" : "transparent",
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="text-[16px] font-medium text-gray-800 leading-tight"
          style={{ fontFamily: "'Epilogue', sans-serif" }}
        >
          {line.name}
        </span>
        <span
          className="text-[16px] font-semibold text-gray-900 ml-2 tabular-nums"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          {formatCurrency(lineTotal)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDecrement(line.serviceId)}
            className="
              w-8 h-8 rounded-lg
              bg-black/6 hover:bg-black/10
              text-gray-700 font-medium text-[15px]
              flex items-center justify-center
              transition-colors duration-100
              active:scale-95
            "
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span
            className="w-7 text-center text-[14px] font-medium text-gray-800 tabular-nums"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {line.quantity}
          </span>
          <button
            onClick={() => onIncrement(line.serviceId)}
            className="
              w-8 h-8 rounded-lg
              bg-black/6 hover:bg-black/10
              text-gray-700 font-medium text-[15px]
              flex items-center justify-center
              transition-colors duration-100
              active:scale-95
            "
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <button
          onClick={() => onRemove(line.serviceId)}
          className="
            text-[13px] font-medium text-gray-400
            hover:text-red-500
            transition-colors duration-100
            px-1
          "
          aria-label="Remove item"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
