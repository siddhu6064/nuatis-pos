import { useState } from "react";
import type { Appointment } from "@/lib/appointments";
import type { Transaction } from "@/hooks/useCheckout";
import { addTransactionDirect } from "@/hooks/useCheckout";
import { formatCurrency } from "@/lib/currency";
import { formatAppointmentTime } from "@/lib/appointments";
import { CashTenderModal } from "./CashTenderModal";

interface TakeDepositModalProps {
  appointment: Appointment;
  verticalId: string;
  onDepositCaptured: (txId: string) => void;
  onClose: () => void;
}

function buildDepositTx(
  appt: Appointment,
  method: "card" | "cash",
  amountTendered?: number,
  changeGiven?: number,
): Transaction {
  const nameParts = appt.customerName.trim().split(/\s+/);
  const firstName = nameParts[0] ?? appt.customerName;
  const lastName = nameParts.slice(1).join(" ");
  const amount = appt.depositAmountCents ?? 0;
  const balance = Math.max(0, appt.servicePriceCents - amount);

  return {
    id: crypto.randomUUID(),
    lineItems: [
      {
        lineId: crypto.randomUUID(),
        serviceId: appt.serviceId,
        name: `Deposit · ${appt.serviceName}`,
        priceCents: amount,
        quantity: 1,
        staffId: "", // sentinel — excluded from per-staff revenue
        modifiers: [],
        discountPercent: 0,
      },
    ],
    subtotalCents: amount,
    taxCents: 0,
    tipCents: 0,
    totalCents: amount,
    paymentMethod: method,
    ...(method === "cash" && amountTendered !== undefined
      ? { amountTendered, changeGiven: changeGiven ?? 0 }
      : {}),
    completedAt: new Date().toISOString(),
    customer: { id: appt.id, firstName, lastName, phone: appt.customerPhone },
    compApplied: false,
    compReason: null,
    type: "deposit",
    totalPaid: amount,
    appointmentRef: appt.id,
    depositBalanceDueCents: balance,
  };
}

export function TakeDepositModal({
  appointment,
  verticalId,
  onDepositCaptured,
  onClose,
}: TakeDepositModalProps) {
  const [processing, setProcessing] = useState(false);
  const [showCash, setShowCash] = useState(false);
  const depositAmount = appointment.depositAmountCents ?? 0;

  function handleCardDeposit() {
    setProcessing(true);
    setTimeout(() => {
      const tx = buildDepositTx(appointment, "card");
      addTransactionDirect(verticalId, tx);
      onDepositCaptured(tx.id);
    }, 2000);
  }

  function handleCashDeposit(amountTendered: number) {
    const changeGiven = Math.max(0, amountTendered - depositAmount);
    const tx = buildDepositTx(appointment, "cash", amountTendered, changeGiven);
    addTransactionDirect(verticalId, tx);
    setShowCash(false);
    onDepositCaptured(tx.id);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: "rgba(15,15,16,0.85)" }}
        onClick={!processing ? onClose : undefined}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-[420px] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "#E5E7EB" }}
          >
            <p
              className="text-[20px] font-bold text-gray-900"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Take Deposit
            </p>
            {!processing && (
              <button
                onClick={onClose}
                className="text-[20px] text-gray-400 hover:text-gray-700 transition-colors leading-none"
              >
                ✕
              </button>
            )}
          </div>

          {/* Appointment summary */}
          <div className="px-5 pt-4 pb-2">
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: "#F8F7F4" }}
            >
              <p
                className="text-[17px] font-semibold text-gray-900 mb-0.5"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                {appointment.customerName}
              </p>
              <p
                className="text-[13px] text-gray-500 mb-0.5"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                {appointment.serviceName} · with {appointment.staffName}
              </p>
              <p
                className="text-[12px] text-gray-400"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {formatAppointmentTime(appointment.scheduledAt)}
              </p>
            </div>

            {/* Deposit amount */}
            <div className="mt-4 mb-1 flex items-center justify-between">
              <span
                className="text-[14px] text-gray-500"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                Service total
              </span>
              <span
                className="text-[14px] font-medium text-gray-700 tabular-nums"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {formatCurrency(appointment.servicePriceCents)}
              </span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-[14px] text-gray-500"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                Balance due at service
              </span>
              <span
                className="text-[14px] font-medium text-gray-700 tabular-nums"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {formatCurrency(appointment.servicePriceCents - depositAmount)}
              </span>
            </div>
            <div
              className="flex items-center justify-between pt-2 mt-2 border-t"
              style={{ borderColor: "#E5E7EB" }}
            >
              <span
                className="text-[18px] font-semibold text-gray-900"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                Deposit due now
              </span>
              <span
                className="text-[24px] font-bold tabular-nums"
                style={{ fontFamily: "'Fraunces', serif", color: "#7C3AED" }}
              >
                {formatCurrency(depositAmount)}
              </span>
            </div>
          </div>

          {/* Actions */}
          {processing ? (
            <div className="px-5 py-6 flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: "#7C3AED",
                      animation: "dot-fade 1.2s ease-in-out infinite",
                      animationDelay: `${i * 400}ms`,
                    }}
                  />
                ))}
              </div>
              <p
                className="text-[14px] text-gray-500"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                Present card to reader…
              </p>
              <p
                className="text-[28px] font-bold tabular-nums"
                style={{ fontFamily: "'Fraunces', serif", color: "#7C3AED" }}
              >
                {formatCurrency(depositAmount)}
              </p>
            </div>
          ) : (
            <div className="px-5 pb-5 pt-3 flex gap-2">
              <button
                onClick={handleCardDeposit}
                className="flex-1 h-[52px] rounded-xl text-[16px] font-semibold text-white transition-all duration-150 active:scale-[0.98]"
                style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: "#7C3AED" }}
              >
                Card {formatCurrency(depositAmount)}
              </button>
              <button
                onClick={() => setShowCash(true)}
                className="flex-1 h-[52px] rounded-xl text-[16px] font-semibold text-white transition-all duration-150 active:scale-[0.98]"
                style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: "#7C3AED" }}
              >
                Cash {formatCurrency(depositAmount)}
              </button>
            </div>
          )}
        </div>
      </div>

      {showCash && (
        <CashTenderModal
          totalCents={depositAmount}
          onConfirm={handleCashDeposit}
          onCancel={() => setShowCash(false)}
          confirmLabel="Take Deposit"
          zIndex={60}
        />
      )}
    </>
  );
}
