import { useState, useEffect } from "react";
import type { Transaction, RefundRecord } from "@/hooks/useCheckout";
import { STAFF } from "@/lib/staff";
import { formatCurrency } from "@/lib/currency";
import { calcDailySummary, calcPerStaffSummary } from "@/lib/reports";
import { calcLineTotalCents } from "@/lib/cartMath";
import { transactionsKey } from "@/lib/storage";
import { useActiveVertical } from "@/hooks/useActiveVertical";
import { incrementPackBalance } from "@/lib/packBalances";
import { Receipt } from "./Receipt";
import { RefundPicker } from "./RefundPicker";
import { Toast } from "./Toast";
import { useManagerOverride } from "@/hooks/useManagerOverride";

function loadTransactions(verticalId: string): Transaction[] {
  try {
    const raw = localStorage.getItem(transactionsKey(verticalId));
    return raw ? (JSON.parse(raw) as Transaction[]) : [];
  } catch {
    return [];
  }
}

function saveTransactions(txs: Transaction[], verticalId: string): void {
  localStorage.setItem(transactionsKey(verticalId), JSON.stringify(txs));
}

function formatTime(isoString: string): string {
  return new Intl.DateTimeFormat("en-US", { timeStyle: "short" }).format(
    new Date(isoString),
  );
}

function formatTodayDate(): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(),
  );
}

function deliveryIcon(tx: Transaction): string {
  if (tx.receiptDelivery === "print") return "P";
  if (tx.receiptDelivery === "email") return "E";
  if (tx.receiptDelivery === "sms") return "S";
  return "—";
}

function txStaffLabel(tx: Transaction): string {
  const ids = [...new Set(tx.lineItems.map((l) => l.staffId))];
  if (ids.length === 0) return "—";
  if (ids.length === 1) {
    const s = STAFF.find((st) => st.id === ids[0]);
    return s ? s.firstName : "—";
  }
  return "Multiple";
}

function txRefundStatus(tx: Transaction): "none" | "partial" | "full" {
  const refundedIds = new Set((tx.refunds ?? []).flatMap((r) => r.lineIds));
  if (refundedIds.size === 0) return "none";
  if (tx.lineItems.every((l) => refundedIds.has(l.lineId))) return "full";
  return "partial";
}

const EMAIL_RE = /^\S+@\S+\.\S+$/;
function isValidEmail(v: string) {
  return EMAIL_RE.test(v);
}
function isValidPhone(v: string) {
  return v.replace(/\D/g, "").length >= 10;
}

interface ReceiptDetailProps {
  tx: Transaction;
  onBack: () => void;
  onClose: () => void;
  onUpdateTransaction: (updated: Transaction) => void;
  allTransactions: Transaction[];
  onSelectTx: (tx: Transaction) => void;
}

function ReceiptDetail({
  tx,
  onBack,
  onClose,
  onUpdateTransaction,
  allTransactions,
  onSelectTx,
}: ReceiptDetailProps) {
  const { requestManagerOverride } = useManagerOverride();
  const { activeVerticalId } = useActiveVertical();
  const [expandedInput, setExpandedInput] = useState<"email" | "sms" | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [smsInput, setSmsInput] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [inRefundPicker, setInRefundPicker] = useState(false);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 1500);
  }

  const txShort = tx.id.slice(-8).toUpperCase();
  const btnCls =
    "flex-1 h-[48px] rounded-lg text-[14px] font-semibold transition-all duration-150 active:scale-[0.97]";

  const allRefundedLineIds = new Set(
    (tx.refunds ?? []).flatMap((r) => r.lineIds),
  );
  const refundStatus = txRefundStatus(tx);
  const isFullyRefunded = refundStatus === "full";
  const isDepositTx = (tx.type ?? "service") === "deposit";
  const hasPackBurnLine = tx.lineItems.some((l) => l.usedPackId);
  const canRefund = (tx.totalCents > 0 || hasPackBurnLine) && !isFullyRefunded && !isDepositTx;

  // Linked transaction (deposit ↔ service)
  const linkedTx = isDepositTx && tx.appointmentRef
    ? allTransactions.find(
        (t) => (t.type ?? "service") === "service" && t.appointmentRef === tx.appointmentRef,
      )
    : !isDepositTx && tx.appointmentRef && (tx.depositApplied ?? 0) > 0
      ? allTransactions.find(
          (t) => (t.type ?? "service") === "deposit" && t.appointmentRef === tx.appointmentRef,
        )
      : undefined;

  async function handleRefundTap() {
    const approved = await requestManagerOverride("Refund authorization");
    if (approved) {
      setInRefundPicker(true);
    }
  }

  function handleRefundComplete(selectedLineIds: string[]) {
    const selectedLines = tx.lineItems.filter((l) =>
      selectedLineIds.includes(l.lineId),
    );
    const lineRefundCents = selectedLines.reduce(
      (s, l) => s + calcLineTotalCents(l),
      0,
    );
    const taxRefundCents =
      tx.subtotalCents > 0
        ? Math.round((lineRefundCents / tx.subtotalCents) * tx.taxCents)
        : 0;
    const totalRefundCents = lineRefundCents + taxRefundCents;

    const newRefund: RefundRecord = {
      id: crypto.randomUUID(),
      refundedAt: new Date().toISOString(),
      lineIds: selectedLineIds,
      lineRefundCents,
      taxRefundCents,
      totalRefundCents,
      managerOverride: true,
    };

    const updated: Transaction = {
      ...tx,
      refunds: [...(tx.refunds ?? []), newRefund],
      refundedTotalCents: (tx.refundedTotalCents ?? 0) + totalRefundCents,
    };

    onUpdateTransaction(updated);
    // B32: restore pack session for any pack-burn lines being refunded
    if (tx.customer) {
      for (const lineId of selectedLineIds) {
        const line = tx.lineItems.find((l) => l.lineId === lineId);
        if (line?.usedPackId) {
          incrementPackBalance(activeVerticalId, tx.customer.id, line.usedPackId);
        }
      }
    }
    setInRefundPicker(false);
    showToast("Refund processed (mock)");
  }

  return (
    <>
      {toastMsg && <Toast message={toastMsg} />}

      <div
        className="flex items-center px-5 py-4 border-b flex-shrink-0"
        style={{ borderColor: "#E5E7EB" }}
      >
        <button
          onClick={() => {
            if (inRefundPicker) {
              setInRefundPicker(false);
            } else {
              onBack();
            }
          }}
          className="text-[14px] font-medium text-gray-500 hover:text-gray-800 transition-colors mr-3"
          style={{ fontFamily: "'Epilogue', sans-serif" }}
        >
          ← Back
        </button>
        <p
          className="flex-1 text-center text-[18px] font-semibold text-gray-900"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          {inRefundPicker ? "Refund Items" : `Receipt #${txShort}`}
        </p>
        <button
          onClick={onClose}
          className="text-[20px] text-gray-400 hover:text-gray-700 transition-colors ml-3 leading-none"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {inRefundPicker ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          <RefundPicker
            transaction={tx}
            refundedLineIds={allRefundedLineIds}
            onComplete={handleRefundComplete}
            onCancel={() => setInRefundPicker(false)}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-5">
          <Receipt
            transaction={tx}
            linkedDepositTx={
              !isDepositTx ? linkedTx : undefined
            }
          />

          {/* Linked transaction panel */}
          {linkedTx && (
            <button
              onClick={() => onSelectTx(linkedTx)}
              className="w-full text-left mt-3 p-3 rounded-xl border transition-colors hover:bg-gray-50"
              style={{ borderColor: "#E5E7EB" }}
            >
              <p
                className="text-[11px] text-gray-400 mb-0.5"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                {isDepositTx ? "Linked service transaction" : "Linked deposit"}
              </p>
              <div className="flex items-center justify-between">
                <span
                  className="text-[13px] font-medium text-gray-700"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  #{linkedTx.id.slice(-8).toUpperCase()}
                </span>
                <span
                  className="text-[13px] font-semibold tabular-nums"
                  style={{
                    fontFamily: "'Fraunces', serif",
                    color: isDepositTx ? "#E84A00" : "#7C3AED",
                  }}
                >
                  {formatCurrency(linkedTx.totalPaid ?? linkedTx.totalCents)}
                </span>
              </div>
            </button>
          )}

          <div
            className="mt-5 pt-4 border-t"
            style={{ borderColor: "#E5E7EB" }}
          >
            {expandedInput === "email" && (
              <div className="flex gap-2 mb-3">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="customer@example.com"
                  className="flex-1 h-[42px] px-3 text-[14px] rounded-lg border outline-none"
                  style={{
                    fontFamily: "'Epilogue', sans-serif",
                    borderColor: "#D1D5DB",
                  }}
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (!isValidEmail(emailInput)) return;
                    showToast("Email sent (mock)");
                    setEmailInput("");
                    setExpandedInput(null);
                  }}
                  disabled={!isValidEmail(emailInput)}
                  className="h-[42px] px-4 rounded-lg text-[13px] font-semibold text-white"
                  style={{
                    fontFamily: "'Epilogue', sans-serif",
                    backgroundColor: isValidEmail(emailInput)
                      ? "#E84A00"
                      : "#D1D5DB",
                    cursor: isValidEmail(emailInput) ? "pointer" : "not-allowed",
                  }}
                >
                  Send
                </button>
              </div>
            )}
            {expandedInput === "sms" && (
              <div className="flex gap-2 mb-3">
                <input
                  type="tel"
                  value={smsInput}
                  onChange={(e) => setSmsInput(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="flex-1 h-[42px] px-3 text-[14px] rounded-lg border outline-none"
                  style={{
                    fontFamily: "'Epilogue', sans-serif",
                    borderColor: "#D1D5DB",
                  }}
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (!isValidPhone(smsInput)) return;
                    showToast("SMS sent (mock)");
                    setSmsInput("");
                    setExpandedInput(null);
                  }}
                  disabled={!isValidPhone(smsInput)}
                  className="h-[42px] px-4 rounded-lg text-[13px] font-semibold text-white"
                  style={{
                    fontFamily: "'Epilogue', sans-serif",
                    backgroundColor: isValidPhone(smsInput) ? "#E84A00" : "#D1D5DB",
                    cursor: isValidPhone(smsInput) ? "pointer" : "not-allowed",
                  }}
                >
                  Send
                </button>
              </div>
            )}

            {canRefund && (
              <button
                onClick={() => void handleRefundTap()}
                className="w-full h-[48px] rounded-lg text-[14px] font-semibold mb-2 transition-all duration-150 active:scale-[0.97]"
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  backgroundColor: "white",
                  color: "#DC2626",
                  border: "2px solid #DC2626",
                }}
              >
                Refund
              </button>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => showToast("Sent to printer (mock)")}
                className={btnCls}
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  backgroundColor: "#E84A00",
                  color: "white",
                }}
              >
                Print
              </button>
              <button
                onClick={() =>
                  setExpandedInput((p) => (p === "email" ? null : "email"))
                }
                className={btnCls}
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  backgroundColor: "white",
                  color: "#E84A00",
                  border: "2px solid #E84A00",
                }}
              >
                Email
              </button>
              <button
                onClick={() =>
                  setExpandedInput((p) => (p === "sms" ? null : "sms"))
                }
                className={btnCls}
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  backgroundColor: "white",
                  color: "#E84A00",
                  border: "2px solid #E84A00",
                }}
              >
                SMS
              </button>
              <button
                onClick={onBack}
                className={btnCls}
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  backgroundColor: "#F3F4F6",
                  color: "#374151",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface ReportsOverlayProps {
  onClose: () => void;
}

export function ReportsOverlay({ onClose }: ReportsOverlayProps) {
  const { activeVerticalId, config } = useActiveVertical();

  const [viewMode, setViewMode] = useState<"summary" | "receipt">("summary");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState<"today" | "all">("today");
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadTransactions(activeVerticalId),
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function updateTransaction(updated: Transaction) {
    setTransactions((prev) => {
      const next = prev.map((t) => (t.id === updated.id ? updated : t));
      saveTransactions(next, activeVerticalId);
      return next;
    });
    setSelectedTx(updated);
  }

  const today = new Date().toDateString();
  const todayTxs = transactions.filter(
    (tx) => new Date(tx.completedAt).toDateString() === today,
  );
  const displayTxs = filter === "today" ? todayTxs : transactions;
  const summary = calcDailySummary(todayTxs);
  const staffSummaries = calcPerStaffSummary(todayTxs, STAFF);
  const netRevenueCents = summary.revenueCents - summary.refundCents;

  const stats = [
    { label: "Transactions", value: String(summary.count), valueColor: "#111827" },
    { label: "Tips", value: formatCurrency(summary.tipCents), valueColor: "#111827" },
    { label: "Avg Ticket", value: formatCurrency(summary.avgTicketCents), valueColor: "#111827" },
    { label: "Discounts", value: formatCurrency(summary.discountCents), valueColor: "#DC2626" },
    {
      label: "Refunds",
      value: summary.refundCents > 0 ? `−${formatCurrency(summary.refundCents)}` : "$0.00",
      valueColor: summary.refundCents > 0 ? "#DC2626" : "#111827",
    },
  ];

  // Payment mix — today's non-comped transactions, split-aware
  // Split txs contribute each leg to the matching bucket
  let cardNetRevenue = 0;
  let cashNetRevenue = 0;
  for (const tx of todayTxs) {
    if (tx.compApplied) continue;
    const refundDeduct = tx.refundedTotalCents ?? 0;
    const method = tx.paymentMethod ?? "card";
    if (method === "card") {
      cardNetRevenue += (tx.totalPaid ?? tx.totalCents) - refundDeduct;
    } else if (method === "cash") {
      cashNetRevenue += (tx.totalPaid ?? tx.totalCents) - refundDeduct;
    } else if (method === "split") {
      // Defensive: if payments array missing, skip split-level
      for (const p of tx.payments ?? []) {
        if (p.method === "card") cardNetRevenue += p.amountCents;
        else if (p.method === "cash") cashNetRevenue += p.amountCents;
      }
      // Deduct refunds from the card bucket (single refund record, no routing)
      cardNetRevenue -= refundDeduct;
    }
  }
  const showPaymentMix = cardNetRevenue > 0 && cashNetRevenue > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(15,15,16,0.85)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[640px] flex flex-col"
        style={{ maxHeight: "88vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {viewMode === "summary" ? (
          <>
            <div
              className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
              style={{ borderColor: "#E5E7EB" }}
            >
              <div>
                <p
                  className="text-[22px] font-bold text-gray-900"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  Today's Sales
                </p>
                <p
                  className="text-[12px] text-gray-400"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  {config.displayName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-[20px] text-gray-400 hover:text-gray-700 transition-colors leading-none"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="px-5 pt-5 pb-4">
                <p
                  className="text-[14px] text-gray-500 mb-2"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  {formatTodayDate()}
                </p>

                <div className="mb-4">
                  <p
                    className="text-[48px] font-bold text-gray-900 tabular-nums leading-none"
                    style={{ fontFamily: "'Fraunces', serif" }}
                  >
                    {formatCurrency(summary.revenueCents)}
                  </p>
                  {summary.refundCents > 0 && (
                    <p
                      className="text-[12px] text-gray-400 mt-0.5 tabular-nums"
                      style={{ fontFamily: "'Epilogue', sans-serif" }}
                    >
                      Net: {formatCurrency(netRevenueCents)}
                    </p>
                  )}
                </div>

                <div className="flex gap-1.5 mb-3">
                  {stats.map(({ label, value, valueColor }) => (
                    <div
                      key={label}
                      className="flex-1 rounded-xl p-2.5"
                      style={{ backgroundColor: "#F3F4F6" }}
                    >
                      <p
                        className="text-[10px] text-gray-500 mb-0.5"
                        style={{ fontFamily: "'Epilogue', sans-serif" }}
                      >
                        {label}
                      </p>
                      <p
                        className="text-[14px] font-semibold tabular-nums"
                        style={{
                          fontFamily: "'Fraunces', serif",
                          color: valueColor,
                        }}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {showPaymentMix && (
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4"
                    style={{ backgroundColor: "#F3F4F6" }}
                  >
                    <span
                      className="text-[11px] text-gray-500 flex-shrink-0"
                      style={{ fontFamily: "'Epilogue', sans-serif" }}
                    >
                      Payment mix
                    </span>
                    <span
                      className="text-[12px] font-medium text-gray-700 tabular-nums"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Card: {formatCurrency(cardNetRevenue)}
                    </span>
                    <span className="text-gray-300 text-[10px]">·</span>
                    <span
                      className="text-[12px] font-medium text-gray-700 tabular-nums"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Cash: {formatCurrency(cashNetRevenue)}
                    </span>
                  </div>
                )}

                <div
                  className="border-t pt-4"
                  style={{ borderColor: "#E5E7EB" }}
                >
                  <p
                    className="text-[14px] font-semibold text-gray-700 mb-3"
                    style={{ fontFamily: "'Epilogue', sans-serif" }}
                  >
                    By Staff
                  </p>
                  <div className="flex flex-col gap-2">
                    {staffSummaries.map((s) => (
                      <div
                        key={s.staffId}
                        className="flex items-center justify-between py-1"
                      >
                        <div>
                          <span
                            className="text-[14px] font-medium text-gray-800"
                            style={{ fontFamily: "'Epilogue', sans-serif" }}
                          >
                            {s.firstName}
                          </span>
                          <span
                            className="text-[13px] text-gray-400 ml-2"
                            style={{ fontFamily: "'Epilogue', sans-serif" }}
                          >
                            {s.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className="text-[13px] text-gray-500 tabular-nums"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            {s.txCount} txn
                          </span>
                          <span
                            className="text-[14px] font-medium text-gray-900 tabular-nums"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            {formatCurrency(s.revenueCents)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div
                className="border-t px-5 pt-4 pb-5"
                style={{ borderColor: "#E5E7EB" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p
                    className="text-[18px] font-semibold text-gray-900"
                    style={{ fontFamily: "'Fraunces', serif" }}
                  >
                    Recent Transactions
                  </p>
                  <div className="flex gap-1">
                    {(["today", "all"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className="h-[28px] px-3 rounded-full text-[12px] font-medium transition-all duration-100"
                        style={{
                          fontFamily: "'Epilogue', sans-serif",
                          backgroundColor: filter === f ? "#FFF0E8" : "#F3F4F6",
                          color: filter === f ? "#E84A00" : "#6B7280",
                          border:
                            filter === f
                              ? "1.5px solid #E84A00"
                              : "1.5px solid transparent",
                          fontWeight: filter === f ? 600 : 400,
                        }}
                      >
                        {f === "today" ? "Today" : "All"}
                      </button>
                    ))}
                  </div>
                </div>

                {displayTxs.length === 0 ? (
                  <p
                    className="text-center text-[16px] text-gray-400 py-8"
                    style={{ fontFamily: "'Epilogue', sans-serif" }}
                  >
                    {filter === "today" ? "No sales yet today" : "No transactions saved"}
                  </p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {[...displayTxs].reverse().map((tx) => {
                      const refundStatus = txRefundStatus(tx);
                      const refundedCents = tx.refundedTotalCents ?? 0;
                      return (
                        <button
                          key={tx.id}
                          onClick={() => {
                            setSelectedTx(tx);
                            setViewMode("receipt");
                          }}
                          className="w-full text-left px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors duration-100"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="text-[14px] font-medium text-gray-500 tabular-nums"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                              >
                                {formatTime(tx.completedAt)}
                              </span>
                              {(tx.compApplied ?? false) && (
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  style={{
                                    fontFamily: "'Epilogue', sans-serif",
                                    color: "#DC2626",
                                    backgroundColor: "#FEE2E2",
                                  }}
                                >
                                  COMPED
                                </span>
                              )}
                              {(tx.paymentMethod ?? "card") === "cash" && (
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  style={{
                                    fontFamily: "'Epilogue', sans-serif",
                                    color: "#15803D",
                                    backgroundColor: "#DCFCE7",
                                  }}
                                >
                                  CASH
                                </span>
                              )}
                              {refundStatus === "full" && (
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  style={{
                                    fontFamily: "'Epilogue', sans-serif",
                                    color: "#DC2626",
                                    backgroundColor: "#FEE2E2",
                                  }}
                                >
                                  REFUNDED
                                </span>
                              )}
                              {refundStatus === "partial" && (
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  style={{
                                    fontFamily: "'Epilogue', sans-serif",
                                    color: "#DC2626",
                                    backgroundColor: "#FEE2E2",
                                  }}
                                >
                                  PARTIAL
                                </span>
                              )}
                              {(tx.type ?? "service") === "deposit" && (
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  style={{
                                    fontFamily: "'Epilogue', sans-serif",
                                    color: "#7C3AED",
                                    backgroundColor: "#F3E8FF",
                                  }}
                                >
                                  DEPOSIT
                                </span>
                              )}
                              {tx.packPurchaseId && (
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  style={{
                                    fontFamily: "'Epilogue', sans-serif",
                                    color: "#15803D",
                                    backgroundColor: "#DCFCE7",
                                  }}
                                >
                                  PACK PURCHASE
                                </span>
                              )}
                              {tx.projectStageId && (
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  style={{
                                    fontFamily: "'Epilogue', sans-serif",
                                    color: "#4A3120",
                                    backgroundColor: "#F5ECD7",
                                  }}
                                >
                                  PROJECT STAGE
                                </span>
                              )}
                              {!tx.packPurchaseId && tx.lineItems.some((l) => l.usedPackId) && (
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  style={{
                                    fontFamily: "'Epilogue', sans-serif",
                                    color: "#0369A1",
                                    backgroundColor: "#E0F2FE",
                                  }}
                                >
                                  PACK USED
                                </span>
                              )}
                              {(tx.paymentMethod ?? "card") === "split" && (
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  style={{
                                    fontFamily: "'Epilogue', sans-serif",
                                    color: "#0369A1",
                                    backgroundColor: "#E0F2FE",
                                  }}
                                >
                                  SPLIT
                                </span>
                              )}
                              <span
                                className="text-[14px] font-medium text-gray-900"
                                style={{ fontFamily: "'Epilogue', sans-serif" }}
                              >
                                {tx.customer
                                  ? `${tx.customer.firstName} ${tx.customer.lastName}`
                                  : "Walk-in"}
                              </span>
                            </div>
                            <span
                              className="text-[16px] font-semibold text-gray-900 tabular-nums ml-2 flex-shrink-0"
                              style={{ fontFamily: "'Fraunces', serif" }}
                            >
                              {formatCurrency(tx.totalPaid ?? tx.totalCents)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span
                              className="text-[12px] text-gray-400"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              #{tx.id.slice(-8).toUpperCase()}
                            </span>
                            <span
                              className="text-[12px] text-gray-400"
                              style={{ fontFamily: "'Epilogue', sans-serif" }}
                            >
                              {deliveryIcon(tx)}
                            </span>
                            <span
                              className="text-[12px] text-gray-400"
                              style={{ fontFamily: "'Epilogue', sans-serif" }}
                            >
                              {txStaffLabel(tx)}
                            </span>
                            {refundedCents > 0 && (
                              <span
                                className="text-[12px]"
                                style={{
                                  fontFamily: "'Epilogue', sans-serif",
                                  color: "#DC2626",
                                }}
                              >
                                Refunded {formatCurrency(refundedCents)}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          selectedTx && (
            <ReceiptDetail
              tx={selectedTx}
              onBack={() => setViewMode("summary")}
              onClose={onClose}
              onUpdateTransaction={updateTransaction}
              allTransactions={transactions}
              onSelectTx={(linked) => setSelectedTx(linked)}
            />
          )
        )}
      </div>
    </div>
  );
}
