import { useState, useEffect, useRef } from "react";
import type { AuthUser } from "@workspace/replit-auth-web";
import type { Staff } from "@/lib/staff";
import type { CheckoutState } from "@/hooks/useCheckout";

interface HeaderProps {
  user: AuthUser;
  onLogout: () => void;
  activeStaff: Staff;
  onSwitchStaff: () => void;
  checkoutState: CheckoutState;
  onOpenReports: () => void;
  heldCount: number;
  onOpenHeldTickets: () => void;
  waitlistCount: number;
  onOpenWaitlist: () => void;
  activeVerticalDisplayName: string;
  switcherDisabled: boolean;
  onOpenVerticalSwitcher: () => void;
  onOpenSettings: () => void;
}

function useClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function Header({
  user,
  onLogout,
  activeStaff,
  onSwitchStaff,
  checkoutState,
  onOpenReports,
  heldCount,
  onOpenHeldTickets,
  waitlistCount,
  onOpenWaitlist,
  activeVerticalDisplayName,
  switcherDisabled,
  onOpenVerticalSwitcher,
  onOpenSettings,
}: HeaderProps) {
  const clock = useClock();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const displayEmail =
    user.email ??
    [user.firstName, user.lastName].filter(Boolean).join(" ") ??
    "Account";

  const actionsEnabled = checkoutState === "idle";

  useEffect(() => {
    if (!accountOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        accountRef.current &&
        !accountRef.current.contains(e.target as Node)
      ) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [accountOpen]);

  return (
    <header
      className="flex items-center justify-between px-6 py-3 border-b border-black/10 flex-shrink-0"
      style={{ backgroundColor: "#F8F7F4" }}
    >
      {/* Left: brand + vertical pill + held pill + waitlist pill + reports link */}
      <div className="flex items-center gap-3">
        <span
          className="text-[22px] font-bold text-gray-900 tracking-tight"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Nuatis POS
        </span>

        {/* Vertical pill */}
        <button
          onClick={!switcherDisabled ? onOpenVerticalSwitcher : undefined}
          disabled={switcherDisabled}
          title={switcherDisabled ? "Clear cart to switch verticals" : undefined}
          className="h-[28px] px-3 rounded-md flex items-center gap-1 text-[13px] font-semibold transition-all duration-100"
          style={{
            fontFamily: "'Epilogue', sans-serif",
            backgroundColor: "white",
            color: switcherDisabled ? "#D1D5DB" : "#E84A00",
            border: `1.5px solid ${switcherDisabled ? "#E5E7EB" : "#E84A00"}`,
            cursor: switcherDisabled ? "not-allowed" : "pointer",
          }}
        >
          {activeVerticalDisplayName} ▾
        </button>

        {/* Held tickets pill */}
        {heldCount > 0 && (
          <button
            onClick={actionsEnabled ? onOpenHeldTickets : undefined}
            className="h-[22px] px-2.5 rounded-full text-[11px] font-semibold text-white transition-opacity duration-150"
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: actionsEnabled ? "#E84A00" : "#D1D5DB",
              cursor: actionsEnabled ? "pointer" : "not-allowed",
            }}
            title={actionsEnabled ? undefined : "Finish current ticket first"}
          >
            Held: {heldCount}
          </button>
        )}

        {/* Waitlist pill — always visible so operators can add the first walk-in */}
        <button
          onClick={onOpenWaitlist}
          className="h-[22px] px-2.5 rounded-full text-[11px] font-semibold transition-colors duration-150"
          style={{
            fontFamily: "'Epilogue', sans-serif",
            backgroundColor: waitlistCount > 0 ? "#E84A00" : "#F3F4F6",
            color: waitlistCount > 0 ? "white" : "#9CA3AF",
            cursor: "pointer",
          }}
        >
          Waitlist{waitlistCount > 0 ? `: ${waitlistCount}` : ""}
        </button>

        {/* Today's Sales link */}
        <button
          onClick={actionsEnabled ? onOpenReports : undefined}
          className="text-[14px] transition-colors duration-150"
          style={{
            fontFamily: "'Epilogue', sans-serif",
            fontWeight: 500,
            color: actionsEnabled ? "#E84A00" : "#D1D5DB",
            cursor: actionsEnabled ? "pointer" : "not-allowed",
          }}
          title={actionsEnabled ? undefined : "Finish current ticket first"}
        >
          Today's Sales
        </button>
      </div>

      {/* Center: clock */}
      <span
        className="text-[16px] font-medium text-gray-600 tabular-nums"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {clock}
      </span>

      {/* Right: staff + account */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p
              className="text-[14px] font-semibold text-gray-900 leading-tight"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              {activeStaff.firstName}
            </p>
            <p
              className="text-[12px] text-gray-500 leading-tight"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              {activeStaff.role}
            </p>
          </div>
          <button
            onClick={onSwitchStaff}
            className="text-[12px] font-medium transition-colors duration-150 px-2 py-1 rounded-md hover:bg-black/5"
            style={{ color: "#E84A00", fontFamily: "'Epilogue', sans-serif" }}
          >
            Switch
          </button>
        </div>

        {/* Account dropdown */}
        <div className="relative" ref={accountRef}>
          <button
            onClick={() => setAccountOpen((o) => !o)}
            className="text-[14px] font-medium text-gray-600 px-2 py-1.5 rounded-lg border border-black/10 hover:bg-black/5 transition-colors duration-150"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            ···
          </button>
          {accountOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-[200px] rounded-xl shadow-lg border py-1 z-30"
              style={{ backgroundColor: "white", borderColor: "#E5E7EB" }}
            >
              <p
                className="px-4 py-2 text-[12px] text-gray-500 truncate"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                {displayEmail}
              </p>
              <div className="h-px mx-3 bg-gray-100" />
              <button
                onClick={() => {
                  setAccountOpen(false);
                  onOpenSettings();
                }}
                className="w-full text-left px-4 py-2.5 text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                Settings
              </button>
              <div className="h-px mx-3 bg-gray-100" />
              <button
                onClick={() => {
                  setAccountOpen(false);
                  onLogout();
                }}
                className="w-full text-left px-4 py-2.5 text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
