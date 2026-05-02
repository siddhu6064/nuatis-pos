import { useRef, useState, useEffect, useCallback } from "react";

interface PinModalProps {
  reason: string;
  onApprove: () => void;
  onClose: () => void;
}

type PinState = "entering" | "approving" | "approved";

export function PinModal({ reason, onApprove, onClose }: PinModalProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [pinState, setPinState] = useState<PinState>("entering");
  const inputRefs = useRef<Array<HTMLInputElement | null>>([null, null, null, null]);

  useEffect(() => {
    // Auto-focus first box on open
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const triggerApproval = useCallback(() => {
    setPinState("approving");
    // Mock validation: any 4 digits are accepted — no real PIN check.
    setTimeout(() => {
      setPinState("approved");
      setTimeout(() => {
        onApprove();
      }, 350);
    }, 200);
  }, [onApprove]);

  function handleInput(index: number, value: string) {
    if (pinState !== "entering") return;
    const digit = value.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
    if (next.every((d) => d !== "")) {
      triggerApproval();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (pinState !== "entering") return;
    if (e.key === "Backspace") {
      if (digits[index] !== "") {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = "";
        setDigits(next);
      }
    }
  }

  const boxBg =
    pinState === "approved"
      ? "#DCFCE7"
      : pinState === "approving"
        ? "#F3F4F6"
        : "white";
  const boxBorder =
    pinState === "approved"
      ? "#16A34A"
      : pinState === "approving"
        ? "#D1D5DB"
        : "#E5E7EB";
  const digitColor =
    pinState === "approved" ? "#16A34A" : "#111827";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[360px] px-7 py-7 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <p
          className="text-[22px] font-bold text-gray-900 text-center mb-1"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Manager Override Required
        </p>

        {/* Reason subtitle */}
        <p
          className="text-[14px] text-gray-500 text-center mb-6"
          style={{ fontFamily: "'Epilogue', sans-serif" }}
        >
          {reason}
        </p>

        {/* 4 PIN boxes */}
        <div className="flex gap-3 mb-6">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d ? "●" : ""}
              onChange={(e) => handleInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              readOnly={pinState !== "entering"}
              className="text-center text-[28px] font-bold rounded-xl outline-none transition-all duration-150"
              style={{
                width: "56px",
                height: "64px",
                fontFamily: "'JetBrains Mono', monospace",
                backgroundColor: boxBg,
                border: `2px solid ${boxBorder}`,
                color: digitColor,
                caretColor: "transparent",
              }}
              aria-label={`PIN digit ${i + 1}`}
            />
          ))}
        </div>

        {/* Status text */}
        {pinState === "approving" && (
          <p
            className="text-[13px] text-gray-400 mb-4 animate-pulse"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Verifying…
          </p>
        )}
        {pinState === "approved" && (
          <p
            className="text-[13px] font-semibold mb-4"
            style={{ fontFamily: "'Epilogue', sans-serif", color: "#16A34A" }}
          >
            Approved ✓
          </p>
        )}

        {/* Cancel link */}
        {pinState === "entering" && (
          <button
            onClick={onClose}
            className="text-[13px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
