import { useState } from "react";

interface TipPickerProps {
  subtotalCents: number;
  selectedPreset: string | null;
  onPresetSelect: (preset: string, subtotalCents: number) => void;
  onCustomApply: (cents: number) => void;
}

const PRESETS = [
  { key: "none", label: "No Tip" },
  { key: "15", label: "15%" },
  { key: "18", label: "18%" },
  { key: "20", label: "20%" },
  { key: "25", label: "25%" },
  { key: "custom", label: "Custom" },
] as const;

function parseDollarsToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d+(\.\d{0,2})?$/.test(trimmed)) return null;
  const dotIndex = trimmed.indexOf(".");
  if (dotIndex === -1) {
    return parseInt(trimmed, 10) * 100;
  }
  const dollars = parseInt(trimmed.slice(0, dotIndex), 10);
  const centsStr = trimmed.slice(dotIndex + 1).padEnd(2, "0").slice(0, 2);
  const cents = parseInt(centsStr, 10);
  return dollars * 100 + cents;
}

export function TipPicker({
  subtotalCents,
  selectedPreset,
  onPresetSelect,
  onCustomApply,
}: TipPickerProps) {
  const [customInput, setCustomInput] = useState("");

  const parsedCustomCents = parseDollarsToCents(customInput);
  const customValid = parsedCustomCents !== null;

  function handleCustomInputChange(value: string) {
    // only allow digits and one dot with up to 2 decimal places
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setCustomInput(value);
    }
  }

  function handleApply() {
    if (parsedCustomCents !== null) {
      onCustomApply(parsedCustomCents);
    }
  }

  return (
    <div className="px-4 pt-3 pb-2">
      <p
        className="text-[12px] font-medium text-gray-500 uppercase tracking-wide mb-2"
        style={{ fontFamily: "'Epilogue', sans-serif" }}
      >
        Add a tip
      </p>

      <div className="flex gap-1.5">
        {PRESETS.map((preset) => {
          const isSelected = selectedPreset === preset.key;
          return (
            <button
              key={preset.key}
              onClick={() => onPresetSelect(preset.key, subtotalCents)}
              className="
                flex-1 h-[52px] rounded-lg text-[13px] font-semibold
                transition-all duration-100
                border
              "
              style={{
                fontFamily: "'Epilogue', sans-serif",
                backgroundColor: isSelected ? "#FFF0E8" : "#F0EFEC",
                borderColor: isSelected ? "#E84A00" : "transparent",
                color: isSelected ? "#E84A00" : "#374151",
                fontWeight: isSelected ? 700 : 500,
              }}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {selectedPreset === "custom" && (
        <div className="flex items-center gap-2 mt-2">
          <div
            className="flex items-center flex-1 border rounded-lg overflow-hidden"
            style={{ borderColor: "#D1D5DB", backgroundColor: "white" }}
          >
            <span
              className="pl-3 pr-1 text-[15px] text-gray-500"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              $
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={customInput}
              onChange={(e) => handleCustomInputChange(e.target.value)}
              placeholder="0.00"
              className="
                flex-1 py-2.5 pr-3 text-[15px] text-gray-900
                outline-none bg-transparent
              "
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
              autoFocus
            />
          </div>
          <button
            onClick={handleApply}
            disabled={!customValid}
            className="
              h-[42px] px-4 rounded-lg text-[14px] font-semibold text-white
              transition-all duration-100
            "
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: customValid ? "#E84A00" : "#D1D5DB",
              cursor: customValid ? "pointer" : "not-allowed",
            }}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
