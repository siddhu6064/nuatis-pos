import { useState, useEffect } from "react";
import type { Transaction } from "@/hooks/useCheckout";
import { STAFF } from "@/lib/staff";
import { formatCurrency } from "@/lib/currency";
import { calcDailySummary, calcPerStaffSummary } from "@/lib/reports";
import { Receipt } from "./Receipt";
import { Toast } from "./Toast";

const TRANSACTIONS_KEY = "nuatis-pos:transactions";

function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    return raw ? (JSON.parse(raw) as Transaction[]) : [];
  } catch {
    return [];
  }
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
}

function ReceiptDetail({ tx, onBack, onClose }: ReceiptDetailProps) {
  const [expandedInput, setExpandedInput] = useState<"email" | "sms" | null>(
    null,
  );
  const [emailInput, setEmailInput] = useState("");
  const [smsInput, setSmsInput] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 1500);
  }

  const txShort = tx.id.slice(-8).toUpperCase();

  const btnCls =
    "flex-1 h-[48px] rounded-lg text-[14px] font-semibold transition-all duration-150 active:scale-[0.97]";

  return (
    <>
      {toastMsg && <Toast message={toastMsg} />}

      {/* Top bar */}
      <div
        className="flex items-center px-5 py-4 border-b flex-shrink-0"
        style={{ borderColor: "#E5E7EB" }}
      >
        <button
          onClick={onBack}
          className="text-[14px] font-medium text-gray-500 hover:text-gray-800 transition-colors mr-3"
          style={{ fontFamily: "'Epilogue', sans-serif" }}
        >
          ← Back
        </button>
        <p
          className="flex-1 text-center text-[18px] font-semibold text-gray-900"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Receipt #{txShort}
        </p>
        <button
          onClick={onClose}
          className="text-[20px] text-gray-400 hover:text-gray-700 transition-colors ml-3 leading-none"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Receipt + delivery */}
      <div className="flex-1 overflow-y-auto p-5">
        <Receipt transaction={tx} />

        <div className="mt-5 pt-4 border-t" style={{ borderColor: "#E5E7EB" }}>
          {/* Inline inputs */}
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
                  backgroundColor: isValidPhone(smsInput)
                    ? "#E84A00"
                    : "#D1D5DB",
                  cursor: isValidPhone(smsInput) ? "pointer" : "not-allowed",
                }}
              >
                Send
              </button>
            </div>
          )}

          {/* 4-button row */}
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
                setExpandedInput((prev) =>
                  prev === "email" ? null : "email",
                )
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
                setExpandedInput((prev) => (prev === "sms" ? null : "sms"))
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
    </>
  );
}

interface ReportsOverlayProps {
  onClose: () => void;
}

export function ReportsOverlay({ onClose }: ReportsOverlayProps) {
  const [viewMode, setViewMode] = useState<"summary" | "receipt">("summary");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState<"today" | "all">("today");
  const [transactions] = useState<Transaction[]>(() => loadTransactions());

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const today = new Date().toDateString();
  const todayTxs = transactions.filter(
    (tx) => new Date(tx.completedAt).toDateString() === today,
  );
  const displayTxs = filter === "today" ? todayTxs : transactions;
  const summary = calcDailySummary(todayTxs);
  const staffSummaries = calcPerStaffSummary(todayTxs, STAFF);

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
        {/* Route to summary or receipt detail */}
        {viewMode === "summary" ? (
          <>
            {/* Top bar */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
              style={{ borderColor: "#E5E7EB" }}
            >
              <p
                className="text-[22px] font-bold text-gray-900"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Today's Sales
              </p>
              <button
                onClick={onClose}
                className="text-[20px] text-gray-400 hover:text-gray-700 transition-colors leading-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              {/* Summary section */}
              <div className="px-5 pt-5 pb-4">
                <p
                  className="text-[14px] text-gray-500 mb-2"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  {formatTodayDate()}
                </p>
                <p
                  className="text-[48px] font-bold text-gray-900 tabular-nums leading-none mb-4"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  {formatCurrency(summary.revenueCents)}
                </p>

                {/* 3-stat row */}
                <div className="flex gap-4 mb-4">
                  {[
                    {
                      label: "Transactions",
                      value: String(summary.count),
                    },
                    {
                      label: "Tips",
                      value: formatCurrency(summary.tipCents),
                    },
                    {
                      label: "Avg Ticket",
                      value: formatCurrency(summary.avgTicketCents),
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex-1 rounded-xl p-3"
                      style={{ backgroundColor: "#F3F4F6" }}
                    >
                      <p
                        className="text-[12px] text-gray-500 mb-0.5"
                        style={{ fontFamily: "'Epilogue', sans-serif" }}
                      >
                        {label}
                      </p>
                      <p
                        className="text-[20px] font-semibold text-gray-900 tabular-nums"
                        style={{ fontFamily: "'Fraunces', serif" }}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* By Staff */}
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
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {s.txCount} txn
                          </span>
                          <span
                            className="text-[14px] font-medium text-gray-900 tabular-nums"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {formatCurrency(s.revenueCents)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Transaction list */}
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
                          backgroundColor:
                            filter === f ? "#FFF0E8" : "#F3F4F6",
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
                    {filter === "today"
                      ? "No sales yet today"
                      : "No transactions saved"}
                  </p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {[...displayTxs].reverse().map((tx) => (
                      <button
                        key={tx.id}
                        onClick={() => {
                          setSelectedTx(tx);
                          setViewMode("receipt");
                        }}
                        className="w-full text-left px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors duration-100"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span
                              className="text-[14px] font-medium text-gray-500 tabular-nums"
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
                            >
                              {formatTime(tx.completedAt)}
                            </span>
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
                            className="text-[16px] font-semibold text-gray-900 tabular-nums"
                            style={{ fontFamily: "'Fraunces', serif" }}
                          >
                            {formatCurrency(tx.totalCents)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 pl-0">
                          <span
                            className="text-[12px] text-gray-400"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
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
                        </div>
                      </button>
                    ))}
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
            />
          )
        )}
      </div>
    </div>
  );
}
