import { useState } from "react";
import type { CartLine as CartLineType } from "@/hooks/useCart";
import { STAFF } from "@/lib/staff";
import { formatCurrency } from "@/lib/currency";

interface CartLineProps {
  line: CartLineType;
  isPulsing: boolean;
  onIncrement: (lineId: string) => void;
  onDecrement: (lineId: string) => void;
  onRemove: (lineId: string) => void;
  onStaffChange: (lineId: string, staffId: string) => void;
}

export function CartLine({
  line,
  isPulsing,
  onIncrement,
  onDecrement,
  onRemove,
  onStaffChange,
}: CartLineProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const lineTotal = line.priceCents * line.quantity;
  const assignedStaff = STAFF.find((s) => s.id === line.staffId);

  return (
    <div
      className="px-4 py-3 transition-colors duration-200"
      style={{ backgroundColor: isPulsing ? "#FFF0E8" : "transparent" }}
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
            onClick={() => onDecrement(line.lineId)}
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
            onClick={() => onIncrement(line.lineId)}
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
          onClick={() => onRemove(line.lineId)}
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

      {/* Staff attribution */}
      <div className="mt-1.5">
        {!pickerOpen ? (
          <button
            onClick={() => setPickerOpen(true)}
            className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors duration-100"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            → {assignedStaff?.firstName ?? "Unassigned"}
          </button>
        ) : (
          <div className="flex gap-1 flex-wrap">
            {STAFF.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  onStaffChange(line.lineId, s.id);
                  setPickerOpen(false);
                }}
                className="h-[26px] px-2.5 rounded-md text-[11px] font-medium transition-colors duration-100"
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  backgroundColor:
                    s.id === line.staffId ? "#E84A00" : "#F3F4F6",
                  color: s.id === line.staffId ? "white" : "#374151",
                }}
              >
                {s.firstName}
              </button>
            ))}
            <button
              onClick={() => setPickerOpen(false)}
              className="h-[26px] px-2 rounded-md text-[11px] text-gray-400 hover:text-gray-600"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
