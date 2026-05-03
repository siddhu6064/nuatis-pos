import { useState, useRef } from "react";
import type { CartLine } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/currency";
import { Toast } from "@/components/Toast";

interface DropOffSuccessOverlayProps {
  tag: string;
  customerName: string;
  lines: CartLine[];
  onDone: () => void;
}

export function DropOffSuccessOverlay({
  tag,
  customerName,
  lines,
  onDone,
}: DropOffSuccessOverlayProps) {
  const [copyToast, setCopyToast] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleCopyTag() {
    navigator.clipboard.writeText(tag).catch(() => {});
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    setCopyToast(true);
    copyTimerRef.current = setTimeout(() => setCopyToast(false), 1500);
  }

  const totalCents = lines.reduce(
    (s, l) => s + l.priceCents * l.quantity,
    0,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(15,15,16,0.94)" }}
    >
      {copyToast && <Toast message="Tag copied to clipboard" />}

      <div
        className="w-[460px] rounded-2xl p-8 flex flex-col items-center gap-5"
        style={{ backgroundColor: "#1A1A1C", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
      >
        {/* Success label */}
        <p
          className="text-[13px] font-semibold uppercase tracking-widest"
          style={{ fontFamily: "'Epilogue', sans-serif", color: "#60A5FA", letterSpacing: "0.12em" }}
        >
          Dropped Off
        </p>

        {/* Tag */}
        <div className="flex flex-col items-center gap-1">
          <p
            className="text-[56px] font-bold tracking-widest"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: "#60A5FA" }}
          >
            {tag}
          </p>
        </div>

        {/* Customer */}
        <p
          className="text-[18px] font-medium"
          style={{ fontFamily: "'Epilogue', sans-serif", color: "#E5E7EB" }}
        >
          {customerName}
        </p>

        {/* Line list */}
        <div
          className="w-full rounded-xl px-4 py-3 flex flex-col gap-2"
          style={{ backgroundColor: "#111113" }}
        >
          {lines.map((l) => (
            <div key={l.lineId} className="flex items-center justify-between">
              <span
                className="text-[13px]"
                style={{ fontFamily: "'Epilogue', sans-serif", color: "#9CA3AF" }}
              >
                {l.name}
                {l.quantity > 1 ? ` ×${l.quantity}` : ""}
              </span>
              <span
                className="text-[13px] tabular-nums"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: "#9CA3AF" }}
              >
                {formatCurrency(l.priceCents * l.quantity)}
              </span>
            </div>
          ))}
          <div className="h-px bg-white/10 my-0.5" />
          <div className="flex items-center justify-between">
            <span
              className="text-[14px] font-semibold"
              style={{ fontFamily: "'Epilogue', sans-serif", color: "#E5E7EB" }}
            >
              Ticket total
            </span>
            <span
              className="text-[14px] font-semibold tabular-nums"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: "#E5E7EB" }}
            >
              {formatCurrency(totalCents)}
            </span>
          </div>
        </div>

        {/* Copy Tag */}
        <button
          onClick={handleCopyTag}
          className="w-full h-[48px] rounded-xl text-[15px] font-semibold transition-all duration-150 active:scale-[0.98]"
          style={{
            fontFamily: "'Epilogue', sans-serif",
            backgroundColor: "#1E3A5F",
            color: "#60A5FA",
            border: "1.5px solid #2563EB",
          }}
        >
          Copy Tag
        </button>

        {/* Done */}
        <button
          onClick={onDone}
          className="w-full h-[56px] rounded-xl text-[18px] font-semibold text-white transition-all duration-150 active:scale-[0.98]"
          style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: "#2563EB" }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
