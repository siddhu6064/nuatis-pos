import { useEffect } from "react";
import type { Staff } from "@/lib/staff";
import type { SettingsStaff } from "@/lib/verticalSettings";

interface StaffSwitcherProps {
  staff: SettingsStaff[];
  activeStaffId: string;
  onSelect: (staff: Staff) => void;
  onClose: () => void;
}

export function StaffSwitcher({
  staff,
  activeStaffId,
  onSelect,
  onClose,
}: StaffSwitcherProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-xl p-6 w-[340px]"
        style={{ backgroundColor: "white" }}
        onClick={(e) => e.stopPropagation()}
      >
        <p
          className="text-[18px] font-bold text-gray-900 mb-4"
          style={{ fontFamily: "'Epilogue', sans-serif" }}
        >
          Switch Staff
        </p>
        <div className="flex flex-col gap-2">
          {staff.map((s) => {
            const isActive = s.id === activeStaffId;
            return (
              <button
                key={s.id}
                onClick={() => {
                  onSelect({ id: s.id, firstName: s.firstName, role: s.role });
                  onClose();
                }}
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-left transition-colors duration-100"
                style={{
                  backgroundColor: isActive ? "#FFF0E8" : "#F3F4F6",
                  border: isActive
                    ? "2px solid #E84A00"
                    : "2px solid transparent",
                }}
              >
                <div>
                  <p
                    className="text-[16px] font-semibold text-gray-900"
                    style={{ fontFamily: "'Epilogue', sans-serif" }}
                  >
                    {s.firstName}
                  </p>
                  <p
                    className="text-[13px] text-gray-500"
                    style={{ fontFamily: "'Epilogue', sans-serif" }}
                  >
                    {s.role}
                  </p>
                </div>
                {isActive && (
                  <span
                    className="text-[12px] font-semibold"
                    style={{
                      color: "#E84A00",
                      fontFamily: "'Epilogue', sans-serif",
                    }}
                  >
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
