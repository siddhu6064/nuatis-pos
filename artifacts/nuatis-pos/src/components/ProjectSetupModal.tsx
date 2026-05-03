import { useState } from "react";
import { formatCurrency } from "@/lib/currency";
import { getPhotographyCustomers } from "@/lib/photography-customers";
import type { CartCustomer } from "@/hooks/useCart";

interface ProjectStageRow {
  label: string;
  pct: number;
  cents: number;
}

interface ProjectSetupModalProps {
  serviceId: string;
  serviceName: string;
  priceCents: number;
  onConfirm: (clientId: string, clientName: string) => void;
  onCancel: () => void;
}

function buildStageRows(totalCents: number): ProjectStageRow[] {
  const alloc0 = Math.round(totalCents * 25 / 100);
  const alloc1 = Math.round(totalCents * 50 / 100);
  const alloc2 = totalCents - alloc0 - alloc1;
  return [
    { label: "Deposit",  pct: 25, cents: alloc0 },
    { label: "Progress", pct: 50, cents: alloc1 },
    { label: "Final",    pct: 25, cents: alloc2 },
  ];
}

export function ProjectSetupModal({
  serviceName,
  priceCents,
  onConfirm,
  onCancel,
}: ProjectSetupModalProps) {
  const stages = buildStageRows(priceCents);
  const [clientQuery, setClientQuery] = useState("");
  const [attachedClient, setAttachedClient] = useState<CartCustomer | null>(null);

  const clients = getPhotographyCustomers();
  const filtered =
    clientQuery.trim() === ""
      ? clients
      : clients.filter((c) =>
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(clientQuery.toLowerCase()),
        );

  const canConfirm = !!attachedClient;

  function handleClientSelect(c: CartCustomer) {
    setAttachedClient(c);
    setClientQuery(`${c.firstName} ${c.lastName}`);
  }

  function handleConfirm() {
    if (!attachedClient) return;
    onConfirm(attachedClient.id, `${attachedClient.firstName} ${attachedClient.lastName}`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onCancel}
    >
      <div
        className="rounded-2xl shadow-2xl w-[480px] max-h-[90vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: "white" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 pt-5 pb-4 border-b"
          style={{ borderColor: "#E5E7EB", backgroundColor: "#FAF6F0" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-widest mb-1"
                style={{ fontFamily: "'Epilogue', sans-serif", color: "#9B7F5E" }}
              >
                New Project
              </p>
              <p
                className="text-[20px] font-bold text-gray-900 leading-tight"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {serviceName}
              </p>
              <p
                className="text-[22px] font-bold mt-0.5"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: "#4A3120" }}
              >
                {formatCurrency(priceCents)}
              </p>
            </div>
          </div>
        </div>

        {/* Stage breakdown */}
        <div
          className="px-5 py-4 border-b"
          style={{ borderColor: "#E5E7EB" }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Default Payment Stages
          </p>
          <div className="flex flex-col gap-2">
            {stages.map((stage, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 rounded-xl"
                style={{ backgroundColor: i === 0 ? "#F5ECD7" : i === 1 ? "#EDE3D0" : "#E8D5B7" }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-[22px] h-[22px] rounded-full text-[11px] font-bold flex items-center justify-center text-white"
                    style={{ backgroundColor: "#9B7F5E" }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="text-[14px] font-medium text-gray-800"
                    style={{ fontFamily: "'Epilogue', sans-serif" }}
                  >
                    {stage.label}
                  </span>
                  <span
                    className="text-[12px] text-gray-500"
                    style={{ fontFamily: "'Epilogue', sans-serif" }}
                  >
                    {stage.pct}%
                  </span>
                </div>
                <span
                  className="text-[15px] font-bold tabular-nums"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: "#4A3120" }}
                >
                  {formatCurrency(stage.cents)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Client search */}
        <div className="px-5 py-4 flex-1 overflow-y-auto">
          <p
            className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Attach Client {!attachedClient && <span className="text-red-400">*</span>}
          </p>
          {attachedClient ? (
            <div
              className="flex items-center justify-between px-3 py-2.5 rounded-xl border"
              style={{ backgroundColor: "#F5ECD7", borderColor: "#C4A882" }}
            >
              <span
                className="text-[14px] font-medium"
                style={{ fontFamily: "'Epilogue', sans-serif", color: "#4A3120" }}
              >
                {attachedClient.firstName} {attachedClient.lastName}
              </span>
              <button
                onClick={() => { setAttachedClient(null); setClientQuery(""); }}
                className="text-[12px] text-gray-400 hover:text-red-500 transition-colors px-1"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={clientQuery}
                onChange={(e) => setClientQuery(e.target.value)}
                placeholder="Search client by name…"
                className="w-full h-[42px] px-3 text-[14px] rounded-xl border outline-none mb-2"
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  borderColor: "#D1D5DB",
                  backgroundColor: "#F9FAFB",
                }}
                autoFocus
              />
              {filtered.length > 0 && (
                <div
                  className="rounded-xl border overflow-hidden"
                  style={{ borderColor: "#E5E7EB" }}
                >
                  {filtered.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleClientSelect(c)}
                      className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                      style={{ borderColor: "#F3F4F6" }}
                    >
                      <span
                        className="text-[14px] font-medium text-gray-800"
                        style={{ fontFamily: "'Epilogue', sans-serif" }}
                      >
                        {c.firstName} {c.lastName}
                      </span>
                      <span
                        className="text-[12px] text-gray-400 ml-2"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {c.phone}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {filtered.length === 0 && clientQuery.trim() !== "" && (
                <p
                  className="text-center text-[13px] text-gray-400 py-4"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  No clients found
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-4 border-t flex gap-3"
          style={{ borderColor: "#E5E7EB" }}
        >
          <button
            onClick={onCancel}
            className="flex-1 h-[48px] rounded-xl text-[14px] font-medium text-gray-600 transition-colors duration-100 hover:bg-gray-50"
            style={{ fontFamily: "'Epilogue', sans-serif", border: "1.5px solid #E5E7EB" }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1 h-[48px] rounded-xl text-[14px] font-bold text-white transition-all duration-100 active:scale-[0.98]"
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: canConfirm ? "#9B7F5E" : "#D1D5DB",
              cursor: canConfirm ? "pointer" : "not-allowed",
            }}
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}
