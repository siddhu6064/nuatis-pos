import { useEffect } from "react";
import { VERTICALS, type VerticalId } from "@/lib/verticals";

interface VerticalSwitcherProps {
  activeVerticalId: VerticalId;
  onSwitch: (id: VerticalId) => void;
  onClose: () => void;
}

export function VerticalSwitcher({
  activeVerticalId,
  onSwitch,
  onClose,
}: VerticalSwitcherProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[380px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4">
          <p
            className="text-[22px] font-bold text-gray-900 mb-1"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Switch Vertical
          </p>
          <p
            className="text-[13px] text-gray-500"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Select the service type for this register.
          </p>
        </div>

        <div className="px-4 pb-5 flex flex-col gap-2">
          {(Object.values(VERTICALS) as typeof VERTICALS[VerticalId][]).map(
            (v) => {
              const isActive = v.id === activeVerticalId;
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    if (!isActive) onSwitch(v.id);
                    onClose();
                  }}
                  className="w-full text-left px-5 py-4 rounded-xl transition-all duration-100"
                  style={{
                    backgroundColor: isActive ? "#FFF0E8" : "#F9FAFB",
                    border: isActive
                      ? "2px solid #E84A00"
                      : "2px solid transparent",
                    cursor: isActive ? "default" : "pointer",
                  }}
                >
                  <p
                    className="text-[18px] text-gray-900 leading-snug"
                    style={{
                      fontFamily: "'Fraunces', serif",
                      fontWeight: isActive ? 700 : 600,
                      color: isActive ? "#E84A00" : "#111827",
                    }}
                  >
                    {v.displayName}
                    {isActive && (
                      <span
                        className="ml-2 text-[11px] font-bold align-middle"
                        style={{
                          fontFamily: "'Epilogue', sans-serif",
                          color: "#E84A00",
                        }}
                      >
                        ACTIVE
                      </span>
                    )}
                  </p>
                  <p
                    className="text-[12px] text-gray-500 mt-0.5"
                    style={{ fontFamily: "'Epilogue', sans-serif" }}
                  >
                    {v.tagline}
                  </p>
                </button>
              );
            },
          )}
        </div>
      </div>
    </div>
  );
}
