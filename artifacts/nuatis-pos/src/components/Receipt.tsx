import type { Transaction } from "@/hooks/useCheckout";
import { STAFF } from "@/lib/staff";
import { formatCurrency } from "@/lib/currency";
import { calcLineDiscountCents, calcLineTotalCents } from "@/lib/cartMath";
import { elapsedMinutes } from "@/lib/pricing";
import { useVerticalSettings } from "@/hooks/useVerticalSettings";

interface ReceiptProps {
  transaction: Transaction;
  linkedDepositTx?: Transaction;
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

function formatShortDatetime(isoString: string): string {
  const d = new Date(isoString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function Divider() {
  return <hr className="border-t border-gray-200 my-3" />;
}

export function Receipt({ transaction, linkedDepositTx }: ReceiptProps) {
  const { settings } = useVerticalSettings();
  const businessInfo = settings.business;

  const txShort = transaction.id.slice(-8).toUpperCase();
  const isComped = transaction.compApplied ?? false;
  const paymentMethod = transaction.paymentMethod ?? "card";
  const isCash = paymentMethod === "cash";
  const isSplit = paymentMethod === "split";
  const isDepositTx = (transaction.type ?? "service") === "deposit";
  const depositApplied = transaction.depositApplied ?? 0;
  const hasDepositCredit = !isDepositTx && depositApplied > 0;

  const allRefundedLineIds = new Set(
    (transaction.refunds ?? []).flatMap((r) => r.lineIds),
  );
  const hasAnyRefund = allRefundedLineIds.size > 0;
  const isFullyRefunded = transaction.lineItems.every((l) =>
    allRefundedLineIds.has(l.lineId),
  );
  const isPartiallyRefunded = hasAnyRefund && !isFullyRefunded;
  const refundStampText = isFullyRefunded
    ? "FULLY REFUNDED"
    : isPartiallyRefunded
      ? "PARTIALLY REFUNDED"
      : null;

  const refundedTotalCents = transaction.refundedTotalCents ?? 0;
  const netCents = transaction.totalCents - refundedTotalCents;

  const splitPayments = isSplit ? (transaction.payments ?? []) : [];

  // B22: vaccination override lines
  const overriddenLines = transaction.lineItems.filter(
    (l) => l.vaccinationOverride,
  );
  const hasVaccinationOverrides = overriddenLines.length > 0;

  // B32: pack-burn lines
  const packBurnLines = transaction.lineItems.filter((l) => l.usedPackId);
  const isPackBurn = packBurnLines.length > 0 && !isComped && !isDepositTx;

  return (
    <div
      className="text-gray-900 text-[13px] w-full relative"
      style={{ fontFamily: "'Epilogue', sans-serif" }}
    >
      {/* DEPOSIT stamp */}
      {isDepositTx && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "4px",
            fontFamily: "'Fraunces', serif",
            fontSize: "14px",
            fontWeight: 700,
            color: "#7C3AED",
            transform: "rotate(-8deg)",
            userSelect: "none",
            pointerEvents: "none",
            letterSpacing: "0.05em",
          }}
        >
          DEPOSIT
        </div>
      )}

      {/* PACK REDEMPTION stamp */}
      {isPackBurn && !hasAnyRefund && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "4px",
            fontFamily: "'Fraunces', serif",
            fontSize: "12px",
            fontWeight: 700,
            color: "#16A34A",
            transform: "rotate(-8deg)",
            userSelect: "none",
            pointerEvents: "none",
            letterSpacing: "0.05em",
            textAlign: "right",
          }}
        >
          PACK REDEMPTION
        </div>
      )}

      {/* COMPED stamp */}
      {isComped && !hasAnyRefund && !isDepositTx && (
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

      {/* Refund stamp */}
      {refundStampText && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "4px",
            fontFamily: "'Fraunces', serif",
            fontSize: "11px",
            fontWeight: 700,
            color: "#DC2626",
            transform: "rotate(-8deg)",
            userSelect: "none",
            pointerEvents: "none",
            letterSpacing: "0.05em",
            textAlign: "right",
          }}
        >
          {refundStampText}
        </div>
      )}

      {/* Business header */}
      <div className="text-center mb-3">
        <p
          className="text-[22px] font-bold mb-0.5"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          {businessInfo.name}
        </p>
        <p className="text-[12px] text-gray-500">{businessInfo.address}</p>
        <p className="text-[12px] text-gray-500">{businessInfo.phone}</p>
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
          {isDepositTx && (
            <span
              className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ color: "#7C3AED", backgroundColor: "#F3E8FF", fontFamily: "'Epilogue', sans-serif" }}
            >
              DEPOSIT
            </span>
          )}
          {isSplit && (
            <span
              className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ color: "#0369A1", backgroundColor: "#E0F2FE", fontFamily: "'Epilogue', sans-serif" }}
            >
              SPLIT
            </span>
          )}
          {hasVaccinationOverrides && (
            <span
              className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ color: "#92400E", backgroundColor: "#FEF3C7", fontFamily: "'Epilogue', sans-serif" }}
            >
              VACC OVERRIDE
            </span>
          )}
          {isPackBurn && (
            <span
              className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ color: "#15803D", backgroundColor: "#DCFCE7", fontFamily: "'Epilogue', sans-serif" }}
            >
              PACK
            </span>
          )}
        </p>
        {transaction.customer && (
          <p className="text-[12px] text-gray-700 font-medium">
            Customer: {transaction.customer.firstName}{" "}
            {transaction.customer.lastName}
          </p>
        )}
        {isComped && !isDepositTx && (
          <p className="text-[12px] font-semibold" style={{ color: "#DC2626" }}>
            COMPED · {transaction.compReason ?? "No reason given"}
          </p>
        )}
      </div>

      <Divider />

      {/* Line items */}
      <div className="space-y-2.5">
        {transaction.lineItems.map((line) => {
          const lineTotal = calcLineTotalCents(line);
          const discountCents = calcLineDiscountCents(line);
          const staffMember = line.staffId ? STAFF.find((s) => s.id === line.staffId) : undefined;
          const isRefunded = allRefundedLineIds.has(line.lineId);
          const hasOverride = Boolean(line.vaccinationOverride);

          // B23: session suffix
          const isSessionLine =
            line.sessionStartedAt !== undefined && line.sessionEndedAt !== undefined;
          const sessionMins = isSessionLine
            ? elapsedMinutes(
                Math.max(0, (line.sessionEndedAt ?? line.sessionStartedAt!) - line.sessionStartedAt!),
              )
            : 0;

          return (
            <div key={line.lineId} style={{ opacity: isRefunded ? 0.5 : 1 }}>
              <div className="flex justify-between items-baseline">
                <span
                  className="text-[13px] font-medium text-gray-900"
                  style={
                    isRefunded
                      ? { textDecoration: "line-through", color: "#9CA3AF" }
                      : {}
                  }
                >
                  {/* B23: session suffix */}
                  {isSessionLine
                    ? `${line.name} · ${sessionMins}m session`
                    : line.name}
                  {/* B32: pack burn badge */}
                  {line.usedPackId && !isRefunded && (
                    <span
                      className="ml-1.5 text-[9px] font-bold px-1 py-0.5 rounded"
                      style={{
                        fontFamily: "'Epilogue', sans-serif",
                        color: "#15803D",
                        backgroundColor: "#DCFCE7",
                        verticalAlign: "middle",
                      }}
                    >
                      PACK CREDIT
                    </span>
                  )}
                  {/* B22: vacc override badge */}
                  {hasOverride && !isRefunded && (
                    <span
                      className="ml-1.5 text-[9px] font-bold px-1 py-0.5 rounded"
                      style={{
                        fontFamily: "'Epilogue', sans-serif",
                        color: "#92400E",
                        backgroundColor: "#FEF3C7",
                        verticalAlign: "middle",
                      }}
                    >
                      VACC OVERRIDE
                    </span>
                  )}
                </span>
                <span
                  className="text-[13px] font-medium tabular-nums ml-4"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: isRefunded ? "#9CA3AF" : "#111827",
                    textDecoration: isRefunded ? "line-through" : "none",
                  }}
                >
                  {formatCurrency(lineTotal)}
                </span>
              </div>
              <div className="flex justify-start">
                <span
                  className="text-[11px] text-gray-400 pl-2 tabular-nums"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {isSessionLine
                    ? `${sessionMins}m session`
                    : `${line.quantity} × ${formatCurrency(line.priceCents)}`}
                  {staffMember && (
                    <span style={{ fontFamily: "'Epilogue', sans-serif" }}>
                      {" "}
                      · {staffMember.firstName}
                    </span>
                  )}
                </span>
              </div>
              {(line.modifiers ?? []).map((mod) => (
                <div
                  key={mod.id}
                  className="flex justify-between items-baseline pl-4 mt-0.5"
                >
                  <span className="text-[12px] text-gray-400">+ {mod.name}</span>
                  <span
                    className="text-[12px] text-gray-400 tabular-nums"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    +{formatCurrency(mod.priceCents)}
                  </span>
                </div>
              ))}
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
                    style={{ color: "#DC2626", fontFamily: "'JetBrains Mono', monospace" }}
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
      {isPackBurn ? (
        <div className="space-y-1">
          <div className="flex justify-between text-[15px] font-bold pt-1 border-t border-gray-200 mt-1">
            <span style={{ fontFamily: "'Epilogue', sans-serif", color: "#374151" }}>Total</span>
            <span
              className="tabular-nums"
              style={{ fontFamily: "'Fraunces', serif", color: "#16A34A" }}
            >
              $0.00
            </span>
          </div>
          <p className="text-[12px] pt-0.5" style={{ color: "#15803D" }}>
            No charge — pack credit applied
          </p>
        </div>
      ) : isDepositTx ? (
        <div className="space-y-1">
          <div className="flex justify-between text-[15px] font-bold text-gray-900 pt-1 border-t border-gray-200 mt-1">
            <span style={{ fontFamily: "'Epilogue', sans-serif" }}>Deposit</span>
            <span
              className="tabular-nums"
              style={{ fontFamily: "'Fraunces', serif", color: "#7C3AED" }}
            >
              {formatCurrency(transaction.totalCents)}
            </span>
          </div>
          {(transaction.depositBalanceDueCents ?? 0) > 0 && (
            <div className="flex justify-between text-[12px] text-gray-500 pt-1">
              <span>Balance due at service</span>
              <span className="tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {formatCurrency(transaction.depositBalanceDueCents!)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-[12px] text-gray-600 pt-0.5">
            <span>Payment</span>
            <span style={{ fontFamily: "'Epilogue', sans-serif" }}>
              {isCash ? "Cash" : "Card"}
            </span>
          </div>
          {isCash && transaction.amountTendered !== undefined && (
            <>
              <div className="flex justify-between text-[12px] text-gray-600">
                <span>Tendered</span>
                <span className="tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {formatCurrency(transaction.amountTendered)}
                </span>
              </div>
              <div className="flex justify-between text-[12px] text-gray-600">
                <span>Change</span>
                <span className="tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {formatCurrency(transaction.changeGiven ?? 0)}
                </span>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex justify-between text-[12px] text-gray-600">
            <span>Subtotal</span>
            <span className="tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {formatCurrency(transaction.subtotalCents)}
            </span>
          </div>
          <div className="flex justify-between text-[12px] text-gray-600">
            <span>Tax</span>
            <span className="tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {formatCurrency(transaction.taxCents)}
            </span>
          </div>
          {transaction.tipCents > 0 && (
            <div className="flex justify-between text-[12px] text-gray-600">
              <span>Tip</span>
              <span className="tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {formatCurrency(transaction.tipCents)}
              </span>
            </div>
          )}

          {hasDepositCredit && (
            <div className="flex justify-between text-[12px]" style={{ color: "#15803D" }}>
              <span>Deposit applied</span>
              <span className="tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                −{formatCurrency(depositApplied)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-[15px] font-bold text-gray-900 pt-1 border-t border-gray-200 mt-1">
            <span style={{ fontFamily: "'Epilogue', sans-serif" }}>
              {hasDepositCredit ? "Balance paid" : "Total"}
            </span>
            <span
              className="tabular-nums"
              style={{
                fontFamily: "'Fraunces', serif",
                color: isComped ? "#DC2626" : "inherit",
              }}
            >
              {formatCurrency(
                hasDepositCredit
                  ? (transaction.totalPaid ?? transaction.totalCents)
                  : transaction.totalCents,
              )}
            </span>
          </div>

          {isSplit ? (
            <div className="space-y-1 pt-0.5">
              {splitPayments.map((p, i) => (
                <div key={i}>
                  {p.method === "card" ? (
                    <div className="flex justify-between text-[12px] text-gray-600">
                      <span>Card payment</span>
                      <span className="tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {formatCurrency(p.amountCents)} · ****{p.mockLast4 ?? "0000"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-[12px] text-gray-600">
                      <span>Cash payment</span>
                      <span className="tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {formatCurrency(p.amountCents)} · Tndr{" "}
                        {formatCurrency(p.tenderedCents ?? p.amountCents)} · Chg{" "}
                        {formatCurrency(p.changeCents ?? 0)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              <div className="flex justify-between text-[13px] font-semibold text-gray-800 pt-0.5">
                <span style={{ fontFamily: "'Epilogue', sans-serif" }}>Total paid</span>
                <span className="tabular-nums" style={{ fontFamily: "'Fraunces', serif" }}>
                  {formatCurrency(splitPayments.reduce((s, p) => s + p.amountCents, 0))}
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-[12px] text-gray-600 pt-0.5">
                <span>Payment</span>
                <span style={{ fontFamily: "'Epilogue', sans-serif" }}>
                  {isCash ? "Cash" : "Card · Visa •••• 4242"}
                </span>
              </div>
              {isCash && transaction.amountTendered !== undefined && (
                <>
                  <div className="flex justify-between text-[12px] text-gray-600">
                    <span>Tendered</span>
                    <span className="tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {formatCurrency(transaction.amountTendered)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[12px] text-gray-600">
                    <span>Change</span>
                    <span className="tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {formatCurrency(transaction.changeGiven ?? 0)}
                    </span>
                  </div>
                </>
              )}
            </>
          )}

          {(transaction.refunds ?? []).map((refund, i) => (
            <div key={refund.id} className="flex justify-between text-[12px] pt-0.5" style={{ color: "#DC2626" }}>
              <span style={{ fontFamily: "'Epilogue', sans-serif" }}>
                Refund #{i + 1} · {formatShortDatetime(refund.refundedAt)}
              </span>
              <span className="tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                −{formatCurrency(refund.totalRefundCents)}
              </span>
            </div>
          ))}

          {hasAnyRefund && (
            <div className="flex justify-between text-[13px] font-semibold pt-1 border-t border-gray-200">
              <span style={{ fontFamily: "'Epilogue', sans-serif", color: "#374151" }}>Net</span>
              <span className="tabular-nums" style={{ fontFamily: "'Fraunces', serif", color: "#374151" }}>
                {formatCurrency(netCents)}
              </span>
            </div>
          )}
        </div>
      )}

      <Divider />

      {/* B32: Pack redemption footnote */}
      {isPackBurn && (
        <div
          className="mb-2 px-2 py-1.5 rounded-lg"
          style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}
        >
          <p
            className="text-[10px] font-semibold mb-0.5"
            style={{ color: "#15803D", fontFamily: "'Epilogue', sans-serif" }}
          >
            PACK REDEMPTION
          </p>
          {packBurnLines.map((line) => (
            <p
              key={line.lineId}
              className="text-[10px]"
              style={{ color: "#16A34A", fontFamily: "'Epilogue', sans-serif" }}
            >
              {line.name}: 1 session deducted from {line.usedPackName ?? "class pack"}
            </p>
          ))}
        </div>
      )}

      {/* B33: Project stage footnote */}
      {transaction.projectReceipt && (() => {
        const pr = transaction.projectReceipt;
        const isLastStage = pr.stagesRemainingAfter === 0;
        return (
          <div
            className="mb-2 px-2 py-1.5 rounded-lg"
            style={{ backgroundColor: "#FAF6F0", border: "1px solid #C4A882" }}
          >
            <p
              className="text-[10px] font-semibold mb-0.5"
              style={{ color: "#4A3120", fontFamily: "'Epilogue', sans-serif" }}
            >
              PROJECT STAGE
            </p>
            {isLastStage ? (
              <p
                className="text-[10px]"
                style={{ color: "#9B7F5E", fontFamily: "'Epilogue', sans-serif" }}
              >
                Project complete · {formatCurrency(pr.projectTotalCents)} total paid
              </p>
            ) : (
              <p
                className="text-[10px]"
                style={{ color: "#9B7F5E", fontFamily: "'Epilogue', sans-serif" }}
              >
                {pr.stageLabel} ({pr.stagePct}%) · {formatCurrency(pr.paidCentsAfter)} paid of{" "}
                {formatCurrency(pr.projectTotalCents)} total · {pr.stagesRemainingAfter}{" "}
                {pr.stagesRemainingAfter === 1 ? "stage" : "stages"} remaining
              </p>
            )}
          </div>
        );
      })()}

      {/* Linked deposit footnote */}
      {hasDepositCredit && linkedDepositTx && (
        <p className="text-[11px] text-gray-400 mb-2">
          Deposit of {formatCurrency(depositApplied)} collected{" "}
          {formatShortDatetime(linkedDepositTx.completedAt)} · Txn #
          {linkedDepositTx.id.slice(-8).toUpperCase()}
        </p>
      )}

      {/* B22: Vaccination override footnote */}
      {hasVaccinationOverrides && (
        <div
          className="mb-2 px-2 py-1.5 rounded-lg"
          style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}
        >
          <p
            className="text-[10px] font-semibold text-amber-700 mb-0.5"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            VACCINATION OVERRIDE
          </p>
          {overriddenLines.map((line) => (
            <p
              key={line.lineId}
              className="text-[10px] text-amber-600"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              {line.name}: {line.vaccinationOverride!.blockers.join("; ")} — mgr approved{" "}
              {new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "2-digit",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }).format(new Date(line.vaccinationOverride!.overriddenAt))}
            </p>
          ))}
        </div>
      )}

      <p className="text-[12px] text-gray-600">
        {isPackBurn
          ? "No charge — pack credit"
          : isDepositTx
            ? "Deposit received — balance due at service"
            : isComped
              ? "No charge — comped"
              : isSplit
                ? "Split tender — card + cash"
                : isCash
                  ? "Cash payment"
                  : "Card · Visa •••• 4242"}
      </p>

      <Divider />

      <p
        className="text-center text-[16px] text-gray-700"
        style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 600 }}
      >
        Thank you
      </p>
    </div>
  );
}
