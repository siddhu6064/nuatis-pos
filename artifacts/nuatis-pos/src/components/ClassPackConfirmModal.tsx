import { useState } from "react";
import type { CartCustomer } from "@/hooks/useCart";
import type { PackBalance } from "@/lib/packBalances";
import { formatCurrency } from "@/lib/currency";

interface ClassPackConfirmModalProps {
  serviceName: string;
  scheduledAt: number;
  normalPriceCents: number;
  customer: CartCustomer;
  applicablePacks: PackBalance[];
  onConfirm: (selectedPackId: string | null) => void;
  onCancel: () => void;
}

export function ClassPackConfirmModal({
  serviceName,
  scheduledAt,
  normalPriceCents,
  customer,
  applicablePacks,
  onConfirm,
  onCancel,
}: ClassPackConfirmModalProps) {
  const [selected, setSelected] = useState<string | null>(
    applicablePacks.length > 0 ? applicablePacks[0].id : null,
  );

  const timeStr = new Date(scheduledAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const customerName = `${customer.firstName} ${customer.lastName}`.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(15,15,16,0.85)" }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[480px] overflow-hidden"
        style={{ fontFamily: "'Epilogue', sans-serif" }}
      >
        <div
          className="px-6 pt-6 pb-4 border-b"
          style={{ borderColor: "#E5E7EB" }}
        >
          <p
            className="text-[20px] font-bold text-gray-900 mb-0.5"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Book Class
          </p>
          <p className="text-[13px] text-gray-500">
            {serviceName} · {timeStr} · {customerName}
          </p>
        </div>

        <div className="px-6 py-4">
          <p className="text-[13px] font-semibold text-gray-700 mb-3">
            Payment method
          </p>

          <div className="flex flex-col gap-2">
            <label
              className="flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors"
              style={{
                borderColor: selected === null ? "#E84A00" : "#E5E7EB",
                backgroundColor: selected === null ? "#FFF7F4" : "white",
              }}
            >
              <input
                type="radio"
                name="payMode"
                value="normal"
                checked={selected === null}
                onChange={() => setSelected(null)}
                className="accent-orange-600"
              />
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-gray-900">
                  Pay regular price
                </p>
                <p
                  className="text-[12px] text-gray-500"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {formatCurrency(normalPriceCents)}
                </p>
              </div>
            </label>

            {applicablePacks.map((pack) => (
              <label
                key={pack.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors"
                style={{
                  borderColor: selected === pack.id ? "#16A34A" : "#E5E7EB",
                  backgroundColor: selected === pack.id ? "#F0FDF4" : "white",
                }}
              >
                <input
                  type="radio"
                  name="payMode"
                  value={pack.id}
                  checked={selected === pack.id}
                  onChange={() => setSelected(pack.id)}
                  className="accent-green-600"
                />
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-gray-900">
                    Use class pack
                  </p>
                  <p className="text-[12px] text-gray-500">
                    {pack.packServiceName} · {pack.sessionsRemaining} session
                    {pack.sessionsRemaining !== 1 ? "s" : ""} remaining · $0 charge
                  </p>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded"
                  style={{ color: "#15803D", backgroundColor: "#DCFCE7" }}
                >
                  PACK
                </span>
              </label>
            ))}
          </div>
        </div>

        <div
          className="px-6 pb-6 flex gap-3"
        >
          <button
            onClick={onCancel}
            className="flex-1 h-[48px] rounded-lg text-[14px] font-semibold"
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: "#F3F4F6",
              color: "#374151",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selected)}
            className="flex-1 h-[48px] rounded-lg text-[14px] font-semibold text-white"
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: selected !== null ? "#16A34A" : "#E84A00",
            }}
          >
            {selected !== null ? "Burn 1 Session" : `Charge ${formatCurrency(normalPriceCents)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
