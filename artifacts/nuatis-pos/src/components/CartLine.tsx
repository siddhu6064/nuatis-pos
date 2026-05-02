import { useState } from "react";
import type { CartLine as CartLineType } from "@/hooks/useCart";
import type { Modifier } from "@/lib/modifiers";
import { STAFF } from "@/lib/staff";
import { getModifiersForService } from "@/lib/modifiers";
import { formatCurrency } from "@/lib/currency";
import { calcLineTotalCents } from "@/lib/cartMath";

interface CartLineProps {
  line: CartLineType;
  isPulsing: boolean;
  frozen: boolean;
  onIncrement: (lineId: string) => void;
  onDecrement: (lineId: string) => void;
  onRemove: (lineId: string) => void;
  onStaffChange: (lineId: string, staffId: string) => void;
  onToggleModifier: (lineId: string, modifier: Modifier) => void;
}

export function CartLine({
  line,
  isPulsing,
  frozen,
  onIncrement,
  onDecrement,
  onRemove,
  onStaffChange,
  onToggleModifier,
}: CartLineProps) {
  const [staffPickerOpen, setStaffPickerOpen] = useState(false);
  const [modPickerOpen, setModPickerOpen] = useState(false);

  const lineTotal = calcLineTotalCents(line);
  const assignedStaff = STAFF.find((s) => s.id === line.staffId);
  const applicableMods = getModifiersForService(line.serviceId);
  const hasApplicableMods = applicableMods.length > 0;

  return (
    <div
      className="px-4 py-3 transition-colors duration-200"
      style={{ backgroundColor: isPulsing ? "#FFF0E8" : "transparent" }}
    >
      {/* Service name + total */}
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

      {/* Active modifier chips (summary view when picker closed) */}
      {line.modifiers.length > 0 && !modPickerOpen && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {line.modifiers.map((m) => (
            <span
              key={m.id}
              className="text-[11px] px-1.5 py-0.5 rounded-md"
              style={{
                fontFamily: "'Epilogue', sans-serif",
                backgroundColor: "#FFF0E8",
                color: "#E84A00",
                border: "1px solid #E84A00",
              }}
            >
              {m.name}
            </span>
          ))}
        </div>
      )}

      {/* Qty controls + remove */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => !frozen && onDecrement(line.lineId)}
            className="w-8 h-8 rounded-lg bg-black/6 hover:bg-black/10 text-gray-700 font-medium text-[15px] flex items-center justify-center transition-colors duration-100 active:scale-95"
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
            onClick={() => !frozen && onIncrement(line.lineId)}
            className="w-8 h-8 rounded-lg bg-black/6 hover:bg-black/10 text-gray-700 font-medium text-[15px] flex items-center justify-center transition-colors duration-100 active:scale-95"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <button
          onClick={() => !frozen && onRemove(line.lineId)}
          className="text-[13px] font-medium text-gray-400 hover:text-red-500 transition-colors duration-100 px-1"
          aria-label="Remove item"
        >
          ✕
        </button>
      </div>

      {/* Staff attribution */}
      <div className="mt-1.5">
        {!staffPickerOpen ? (
          <button
            onClick={() => !frozen && setStaffPickerOpen(true)}
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
                  setStaffPickerOpen(false);
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
              onClick={() => setStaffPickerOpen(false)}
              className="h-[26px] px-2 rounded-md text-[11px] text-gray-400 hover:text-gray-600"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Modifier picker */}
      {hasApplicableMods && (
        <div className="mt-1">
          {!modPickerOpen ? (
            <button
              onClick={() => !frozen && setModPickerOpen(true)}
              className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors duration-100"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              + Add-ons
            </button>
          ) : (
            <div className="flex flex-wrap gap-1 items-center mt-0.5">
              {applicableMods.map((mod) => {
                const active = line.modifiers.some((m) => m.id === mod.id);
                return (
                  <button
                    key={mod.id}
                    onClick={() => !frozen && onToggleModifier(line.lineId, mod)}
                    className="h-[26px] px-2 rounded-md text-[11px] transition-all duration-100"
                    style={{
                      fontFamily: "'Epilogue', sans-serif",
                      fontWeight: active ? 700 : 500,
                      backgroundColor: active ? "#FFF0E8" : "#F9FAFB",
                      color: active ? "#E84A00" : "#6B7280",
                      border: active
                        ? "1.5px solid #E84A00"
                        : "1.5px solid #D1D5DB",
                    }}
                  >
                    {mod.name} +{formatCurrency(mod.priceCents)}
                  </button>
                );
              })}
              <button
                onClick={() => setModPickerOpen(false)}
                className="h-[26px] px-2 rounded-md text-[11px] text-gray-400 hover:text-gray-600"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
