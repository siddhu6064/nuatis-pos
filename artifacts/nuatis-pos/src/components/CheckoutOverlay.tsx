import type { CheckoutState } from "@/hooks/useCheckout";
import { formatCurrency } from "@/lib/currency";

interface CheckoutOverlayProps {
  state: CheckoutState;
  totalCents: number;
  onNewSale: () => void;
}

function ProcessingDots() {
  return (
    <div className="flex items-center gap-3 my-8">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-3 h-3 rounded-full bg-white"
          style={{
            animation: "dot-fade 1.2s ease-in-out infinite",
            animationDelay: `${i * 400}ms`,
          }}
        />
      ))}
    </div>
  );
}

function Checkmark() {
  return (
    <div style={{ animation: "check-appear 0.2s ease-out forwards" }}>
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="40" cy="40" r="38" fill="#22C55E" />
        <path
          d="M24 40L35 51L56 29"
          stroke="white"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function CheckoutOverlay({
  state,
  totalCents,
  onNewSale,
}: CheckoutOverlayProps) {
  if (state !== "processing" && state !== "success") return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "#0F0F10" }}
    >
      {state === "processing" && (
        <div className="flex flex-col items-center">
          <p
            className="text-[24px] font-semibold text-white mb-2"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Present card to reader
          </p>
          <ProcessingDots />
          <p
            className="text-[56px] font-bold text-white tabular-nums"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {formatCurrency(totalCents)}
          </p>
        </div>
      )}

      {state === "success" && (
        <div className="flex flex-col items-center gap-4">
          <Checkmark />
          <p
            className="text-[32px] font-semibold text-white mt-2"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Approved
          </p>
          <p
            className="text-[56px] font-bold text-white tabular-nums"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {formatCurrency(totalCents)}
          </p>
          <button
            onClick={onNewSale}
            className="
              mt-4 h-[56px] w-full max-w-[320px]
              rounded-lg text-[18px] font-semibold text-white
              transition-all duration-150
              active:scale-[0.98]
            "
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: "#E84A00",
            }}
          >
            New Sale
          </button>
        </div>
      )}
    </div>
  );
}
