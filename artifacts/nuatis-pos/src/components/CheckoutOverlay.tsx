import { useState } from "react";
import type { CheckoutState, Transaction } from "@/hooks/useCheckout";
import type { CartCustomer } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/currency";
import { Receipt } from "./Receipt";
import { Toast } from "./Toast";
import { CustomerSearch } from "./CustomerSearch";

interface CheckoutOverlayProps {
  state: CheckoutState;
  processingTotalCents: number;
  completedTx: Transaction | null;
  onCompleteDelivery: (
    delivery: "print" | "email" | "sms" | "none",
    destination?: string,
  ) => void;
  onAttachCustomerPostSale: (customer: CartCustomer) => void;
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

const EMAIL_RE = /^\S+@\S+\.\S+$/;
function isValidEmail(v: string): boolean {
  return EMAIL_RE.test(v);
}
function isValidPhone(v: string): boolean {
  return v.replace(/\D/g, "").length >= 10;
}

interface DeliveryPanelProps {
  tx: Transaction;
  onCompleteDelivery: CheckoutOverlayProps["onCompleteDelivery"];
  onAttachCustomerPostSale: (c: CartCustomer) => void;
  onNewSale: () => void;
}

function DeliveryPanel({
  tx,
  onCompleteDelivery,
  onAttachCustomerPostSale,
  onNewSale,
}: DeliveryPanelProps) {
  const [expandedChannel, setExpandedChannel] = useState<"email" | "sms" | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [smsInput, setSmsInput] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [newSaleVisible, setNewSaleVisible] = useState(false);
  const [deliveryDone, setDeliveryDone] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);

  function fireDelivery(type: "print" | "email" | "sms" | "none", dest?: string) {
    setDeliveryDone(true);
    onCompleteDelivery(type, dest);
    if (type === "none") {
      setNewSaleVisible(true);
    } else {
      const msg =
        type === "print"
          ? "Sent to printer (mock)"
          : type === "email"
            ? "Email sent (mock)"
            : "SMS sent (mock)";
      setToastMsg(msg);
      setTimeout(() => {
        setToastMsg(null);
        setNewSaleVisible(true);
      }, 1500);
    }
  }

  const btnBase =
    "w-full h-[56px] rounded-lg text-[16px] font-semibold transition-all duration-150 active:scale-[0.98]";

  return (
    <>
      {toastMsg && <Toast message={toastMsg} />}
      {showCustomerSearch && (
        <CustomerSearch
          onAttach={(c) => {
            onAttachCustomerPostSale(c);
            setShowCustomerSearch(false);
          }}
          onClose={() => setShowCustomerSearch(false)}
        />
      )}

      <div className="flex flex-col items-center justify-center h-full px-10 gap-3">
        <p
          className="text-white text-[32px] font-semibold mb-1"
          style={{ fontFamily: "'Epilogue', sans-serif" }}
        >
          Approved
        </p>
        <p
          className="text-white text-[52px] font-bold tabular-nums mb-2"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          {formatCurrency(tx.totalCents)}
        </p>

        {/* Post-sale customer attach */}
        {!tx.customer && (
          <button
            onClick={() => setShowCustomerSearch(true)}
            className="text-[13px] font-medium px-3 py-1.5 rounded-lg border transition-colors"
            style={{
              fontFamily: "'Epilogue', sans-serif",
              color: "#E84A00",
              borderColor: "#E84A00",
              backgroundColor: "transparent",
            }}
          >
            + Attach Customer
          </button>
        )}
        {tx.customer && (
          <p
            className="text-[13px] text-gray-400"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            {tx.customer.firstName} {tx.customer.lastName}
          </p>
        )}

        {/* Email input */}
        {expandedChannel === "email" && !deliveryDone && (
          <div className="flex gap-2 w-full max-w-[320px]">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="customer@example.com"
              className="flex-1 h-[44px] rounded-lg px-3 text-[14px] outline-none"
              style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: "white", color: "#111827" }}
              autoFocus
            />
            <button
              onClick={() => fireDelivery("email", emailInput)}
              disabled={!isValidEmail(emailInput)}
              className="h-[44px] px-4 rounded-lg text-[14px] font-semibold text-white"
              style={{
                fontFamily: "'Epilogue', sans-serif",
                backgroundColor: isValidEmail(emailInput) ? "#E84A00" : "#6B7280",
                cursor: isValidEmail(emailInput) ? "pointer" : "not-allowed",
              }}
            >
              Send
            </button>
          </div>
        )}

        {/* SMS input */}
        {expandedChannel === "sms" && !deliveryDone && (
          <div className="flex gap-2 w-full max-w-[320px]">
            <input
              type="tel"
              value={smsInput}
              onChange={(e) => setSmsInput(e.target.value)}
              placeholder="(555) 123-4567"
              className="flex-1 h-[44px] rounded-lg px-3 text-[14px] outline-none"
              style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: "white", color: "#111827" }}
              autoFocus
            />
            <button
              onClick={() => fireDelivery("sms", smsInput)}
              disabled={!isValidPhone(smsInput)}
              className="h-[44px] px-4 rounded-lg text-[14px] font-semibold text-white"
              style={{
                fontFamily: "'Epilogue', sans-serif",
                backgroundColor: isValidPhone(smsInput) ? "#E84A00" : "#6B7280",
                cursor: isValidPhone(smsInput) ? "pointer" : "not-allowed",
              }}
            >
              Send
            </button>
          </div>
        )}

        {/* Delivery buttons */}
        <div className="flex flex-col gap-3 w-full max-w-[320px]">
          <button
            onClick={() => !deliveryDone && fireDelivery("print")}
            disabled={deliveryDone}
            className={btnBase}
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: deliveryDone ? "#4B4B4D" : "#E84A00",
              color: "white",
              cursor: deliveryDone ? "not-allowed" : "pointer",
              opacity: deliveryDone ? 0.5 : 1,
            }}
          >
            Print Receipt
          </button>

          <button
            onClick={() => {
              if (deliveryDone) return;
              setExpandedChannel("email");
              setSmsInput("");
            }}
            disabled={deliveryDone}
            className={btnBase}
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: "white",
              color: deliveryDone ? "#9CA3AF" : "#E84A00",
              border: `2px solid ${deliveryDone ? "#6B7280" : "#E84A00"}`,
              cursor: deliveryDone ? "not-allowed" : "pointer",
              opacity: deliveryDone ? 0.5 : 1,
            }}
          >
            Email Receipt
          </button>

          <button
            onClick={() => {
              if (deliveryDone) return;
              setExpandedChannel("sms");
              setEmailInput("");
            }}
            disabled={deliveryDone}
            className={btnBase}
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: "white",
              color: deliveryDone ? "#9CA3AF" : "#E84A00",
              border: `2px solid ${deliveryDone ? "#6B7280" : "#E84A00"}`,
              cursor: deliveryDone ? "not-allowed" : "pointer",
              opacity: deliveryDone ? 0.5 : 1,
            }}
          >
            SMS Receipt
          </button>

          <button
            onClick={() => !deliveryDone && fireDelivery("none")}
            disabled={deliveryDone}
            className={`${btnBase} text-gray-400`}
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: "transparent",
              cursor: deliveryDone ? "not-allowed" : "pointer",
              opacity: deliveryDone ? 0.4 : 1,
            }}
          >
            No Receipt
          </button>
        </div>

        {newSaleVisible && (
          <button
            onClick={onNewSale}
            className="mt-2 h-[56px] w-full max-w-[320px] rounded-lg text-[18px] font-semibold text-white transition-all duration-150 active:scale-[0.98]"
            style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: "#E84A00" }}
          >
            New Sale
          </button>
        )}
      </div>
    </>
  );
}

export function CheckoutOverlay({
  state,
  processingTotalCents,
  completedTx,
  onCompleteDelivery,
  onAttachCustomerPostSale,
  onNewSale,
}: CheckoutOverlayProps) {
  if (state !== "processing" && state !== "receipt" && state !== "completed") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50" style={{ backgroundColor: "#0F0F10" }}>
      {state === "processing" && (
        <div className="flex items-center justify-center h-full">
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
              {formatCurrency(processingTotalCents)}
            </p>
          </div>
        </div>
      )}

      {(state === "receipt" || state === "completed") && completedTx && (
        <div className="flex h-full">
          <div className="w-[440px] flex-shrink-0 flex items-center justify-center p-6">
            <div
              className="w-full rounded-2xl p-6 overflow-y-auto"
              style={{ backgroundColor: "white", maxHeight: "calc(100vh - 48px)" }}
            >
              <Receipt transaction={completedTx} />
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <DeliveryPanel
              tx={completedTx}
              onCompleteDelivery={onCompleteDelivery}
              onAttachCustomerPostSale={onAttachCustomerPostSale}
              onNewSale={onNewSale}
            />
          </div>
        </div>
      )}
    </div>
  );
}
