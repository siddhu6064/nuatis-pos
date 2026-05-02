import type { Transaction } from "@/hooks/useCheckout";
import { STAFF } from "@/lib/staff";
import { formatCurrency } from "@/lib/currency";
import { calcLineDiscountCents } from "@/lib/cartMath";

interface ReceiptProps {
  transaction: Transaction;
}

function formatReceiptDate(isoString: string): string {
  const d = new Date(isoString);
  const datePart = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(d);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  return `${datePart} · ${timePart}`;
}

function Divider() {
  return <hr className="border-t border-gray-200 my-3" />;
}

export function Receipt({ transaction }: ReceiptProps) {
  const txShort = transaction.id.slice(-8).toUpperCase();
  const isComped = transaction.compApplied ?? false;

  return (
    <div
      className="text-gray-900 text-[13px] w-full relative"
      style={{ fontFamily: "'Epilogue', sans-serif" }}
    >
      {/* COMPED stamp */}
      {isComped && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "4px",
            fontFamily: "'Fraunces', serif",
            fontSize: "14px",
            fontWeight: 700,
            color: "#DC2626",
            transform: "rotate(-8deg)",
            userSelect: "none",
            pointerEvents: "none",
            letterSpacing: "0.05em",
          }}
        >
          COMPED
        </div>
      )}

      {/* Business header */}
      <div className="text-center mb-3">
        <p
          className="text-[22px] font-bold mb-0.5"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Nuatis POS Demo Salon
        </p>
        <p className="text-[12px] text-gray-500">
          123 Main St, Austin, TX 78701
        </p>
        <p className="text-[12px] text-gray-500">(512) 555-0100</p>
      </div>

      <Divider />

      {/* Transaction meta */}
      <div className="space-y-0.5 mb-1">
        <p className="text-[12px] text-gray-600">
          {formatReceiptDate(transaction.completedAt)}
        </p>
        <p
          className="text-[12px] text-gray-600"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Txn #{txShort}
        </p>
        {transaction.customer && (
          <p className="text-[12px] text-gray-700 font-medium">
            Customer: {transaction.customer.firstName}{" "}
            {transaction.customer.lastName}
          </p>
        )}
        {isComped && (
          <p
            className="text-[12px] font-semibold"
            style={{ color: "#DC2626" }}
          >
            COMPED · {transaction.compReason ?? "No reason given"}
          </p>
        )}
      </div>

      <Divider />

      {/* Line items */}
      <div className="space-y-2.5">
        {transaction.lineItems.map((line) => {
          const modifierTotal = (line.modifiers ?? []).reduce(
            (s, m) => s + m.priceCents,
            0,
          );
          const lineTotal =
            Math.round(
              (line.priceCents + modifierTotal) *
                line.quantity *
                (1 - (line.discountPercent ?? 0) / 100),
            );
          const discountCents = calcLineDiscountCents(line);
          const staffMember = STAFF.find((s) => s.id === line.staffId);
          return (
            <div key={line.lineId}>
              <div className="flex justify-between items-baseline">
                <span className="text-[13px] font-medium text-gray-900">
                  {line.name}
                </span>
                <span
                  className="text-[13px] font-medium text-gray-900 tabular-nums ml-4"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {formatCurrency(lineTotal)}
                </span>
              </div>
              <div className="flex justify-start">
                <span
                  className="text-[11px] text-gray-400 pl-2 tabular-nums"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {line.quantity} × {formatCurrency(line.priceCents)}
                  {staffMember && (
                    <span style={{ fontFamily: "'Epilogue', sans-serif" }}>
                      {" "}
                      · {staffMember.firstName}
                    </span>
                  )}
                </span>
              </div>
              {/* Modifier sub-rows */}
              {(line.modifiers ?? []).map((mod) => (
                <div
                  key={mod.id}
                  className="flex justify-between items-baseline pl-4 mt-0.5"
                >
                  <span
                    className="text-[12px] text-gray-400"
                    style={{ fontFamily: "'Epilogue', sans-serif" }}
                  >
                    + {mod.name}
                  </span>
                  <span
                    className="text-[12px] text-gray-400 tabular-nums"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    +{formatCurrency(mod.priceCents)}
                  </span>
                </div>
              ))}
              {/* Discount sub-row */}
              {discountCents > 0 && (
                <div className="flex justify-between items-baseline pl-4 mt-0.5">
                  <span
                    className="text-[12px]"
                    style={{ color: "#DC2626", fontFamily: "'Epilogue', sans-serif" }}
                  >
                    Discount −{line.discountPercent}%
                  </span>
                  <span
                    className="text-[12px] tabular-nums"
                    style={{
                      color: "#DC2626",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    −{formatCurrency(discountCents)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Divider />

      {/* Math rows */}
      <div className="space-y-1">
        <div className="flex justify-between text-[12px] text-gray-600">
          <span>Subtotal</span>
          <span
            className="tabular-nums"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {formatCurrency(transaction.subtotalCents)}
          </span>
        </div>
        <div className="flex justify-between text-[12px] text-gray-600">
          <span>Tax (8.25%)</span>
          <span
            className="tabular-nums"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {formatCurrency(transaction.taxCents)}
          </span>
        </div>
        {transaction.tipCents > 0 && (
          <div className="flex justify-between text-[12px] text-gray-600">
            <span>Tip</span>
            <span
              className="tabular-nums"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {formatCurrency(transaction.tipCents)}
            </span>
          </div>
        )}
        <div className="flex justify-between text-[15px] font-bold text-gray-900 pt-1 border-t border-gray-200 mt-1">
          <span style={{ fontFamily: "'Epilogue', sans-serif" }}>Total</span>
          <span
            className="tabular-nums"
            style={{
              fontFamily: "'Fraunces', serif",
              color: isComped ? "#DC2626" : "inherit",
            }}
          >
            {formatCurrency(transaction.totalCents)}
          </span>
        </div>
      </div>

      <Divider />

      <p className="text-[12px] text-gray-600">
        {isComped ? "No charge — comped" : "Card • Visa •••• 4242"}
      </p>

      <Divider />

      <p
        className="text-center text-[16px] text-gray-700"
        style={{
          fontFamily: "'Fraunces', serif",
          fontStyle: "italic",
          fontWeight: 600,
        }}
      >
        Thank you
      </p>
    </div>
  );
}
