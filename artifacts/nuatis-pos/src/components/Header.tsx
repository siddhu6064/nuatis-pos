import { useState, useEffect } from "react";
import type { AuthUser } from "@workspace/replit-auth-web";

interface HeaderProps {
  user: AuthUser;
  onLogout: () => void;
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

export function Header({ user, onLogout }: HeaderProps) {
  const clock = useClock();

  const displayEmail =
    user.email ??
    [user.firstName, user.lastName].filter(Boolean).join(" ") ??
    "User";

  return (
    <header
      className="flex items-center justify-between px-6 py-3 border-b border-black/10"
      style={{ backgroundColor: "#F8F7F4" }}
    >
      <span
        className="text-[22px] font-bold text-gray-900 tracking-tight"
        style={{ fontFamily: "'Fraunces', serif" }}
      >
        Nuatis POS
      </span>

      <span
        className="text-[16px] font-medium text-gray-600 tabular-nums"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {clock}
      </span>

      <div className="flex items-center gap-3">
        <span
          className="text-[13px] font-medium text-gray-600"
          style={{ fontFamily: "'Epilogue', sans-serif" }}
        >
          {displayEmail}
        </span>
        <button
          onClick={onLogout}
          className="
            text-[13px] font-medium text-gray-700
            px-3 py-1.5 rounded-lg
            border border-black/10
            hover:bg-black/5
            transition-colors duration-150
          "
          style={{ fontFamily: "'Epilogue', sans-serif" }}
        >
          Log out
        </button>
      </div>
    </header>
  );
}
