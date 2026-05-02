import { useState, useEffect } from "react";
import { useActiveVertical } from "@/hooks/useActiveVertical";
import { formatPhone } from "@/lib/phone";
import { formatCurrency } from "@/lib/currency";
import { formatAppointmentTime, type Appointment } from "@/lib/appointments";

interface AppointmentsOverlayProps {
  appointments: Appointment[];
  onStartService: (appt: Appointment) => void;
  onMarkNoShow: (id: string) => void;
  onResetStatus: (id: string) => void;
  cartIsIdle: boolean;
  onClose: () => void;
}

type ConfirmState = { id: string; type: "no_show" | "undo" } | null;

function StatusPill({ status }: { status: Appointment["status"] }) {
  const styles: Record<Appointment["status"], { bg: string; color: string; label: string }> = {
    scheduled: { bg: "#FFF0E8", color: "#E84A00", label: "SCHEDULED" },
    started: { bg: "#DCFCE7", color: "#15803D", label: "STARTED" },
    no_show: { bg: "#F3F4F6", color: "#9CA3AF", label: "NO-SHOW" },
  };
  const s = styles[status];
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
      style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

export function AppointmentsOverlay({
  appointments,
  onStartService,
  onMarkNoShow,
  onResetStatus,
  cartIsIdle,
  onClose,
}: AppointmentsOverlayProps) {
  const { config } = useActiveVertical();
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">("upcoming");
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const now = Date.now();
  const fourteenDays = 14 * 24 * 3600000;

  const upcoming = appointments
    .filter((a) => a.status === "scheduled" && a.scheduledAt <= now + fourteenDays)
    .sort((a, b) => a.scheduledAt - b.scheduledAt);

  const history = appointments
    .filter((a) => a.status === "started" || a.status === "no_show")
    .sort((a, b) => {
      const aT = a.startedAt ?? a.noShowAt ?? 0;
      const bT = b.startedAt ?? b.noShowAt ?? 0;
      return bT - aT;
    });

  const scheduledCount = appointments.filter((a) => a.status === "scheduled").length;
  const startedCount = appointments.filter((a) => a.status === "started").length;
  const noShowCount = appointments.filter((a) => a.status === "no_show").length;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (confirmState !== null) {
          setConfirmState(null);
        } else {
          onClose();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, confirmState]);

  function handleNoShowConfirm(id: string) {
    onMarkNoShow(id);
    setConfirmState(null);
  }

  function handleUndoConfirm(id: string) {
    onResetStatus(id);
    setConfirmState(null);
  }

  const tabBase =
    "h-[30px] px-4 rounded-full text-[12px] font-medium transition-all duration-100";

  function AppointmentRow({ appt, tab }: { appt: Appointment; tab: "upcoming" | "history" }) {
    const isConfirmingThis =
      confirmState !== null && confirmState.id === appt.id;
    const phone = appt.customerPhone.length >= 10
      ? formatPhone(appt.customerPhone)
      : appt.customerPhone;

    return (
      <div
        className="rounded-xl border px-4 py-3"
        style={{ borderColor: "#E5E7EB", backgroundColor: "#FAFAFA" }}
      >
        <div className="flex items-start gap-3">
          {/* Time badge */}
          <div
            className="flex-shrink-0 rounded-lg px-2.5 py-1.5 text-center min-w-[100px]"
            style={{ backgroundColor: "#F3F4F6" }}
          >
            {formatAppointmentTime(appt.scheduledAt)
              .split(" ")
              .map((part, i) => (
                <div
                  key={i}
                  className={i === 0 ? "text-[10px] font-semibold text-gray-500" : "text-[13px] font-bold tabular-nums text-gray-900"}
                  style={{ fontFamily: i === 0 ? "'Epilogue', sans-serif" : "'JetBrains Mono', monospace" }}
                >
                  {part}
                </div>
              ))}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span
                className="text-[16px] font-semibold text-gray-900"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                {appt.customerName}
              </span>
              <StatusPill status={appt.status} />
            </div>
            <p
              className="text-[13px] text-gray-500"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              {phone}
            </p>
            <p
              className="text-[12px] text-gray-400 mt-0.5"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              {appt.serviceName} ·{" "}
              <span style={{ fontFamily: "'Fraunces', serif" }}>
                {formatCurrency(appt.servicePriceCents)}
              </span>
            </p>
            <p
              className="text-[12px] text-gray-400 mt-0.5"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              with {appt.staffName}
            </p>
          </div>

          {/* Actions (right side) */}
          {!isConfirmingThis && (
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              {tab === "upcoming" ? (
                <>
                  <button
                    onClick={() => cartIsIdle && onStartService(appt)}
                    disabled={!cartIsIdle}
                    title={!cartIsIdle ? "Finish current ticket first" : undefined}
                    className="h-[34px] px-3 rounded-lg text-[12px] font-semibold text-white transition-opacity"
                    style={{
                      fontFamily: "'Epilogue', sans-serif",
                      backgroundColor: cartIsIdle ? "#E84A00" : "#D1D5DB",
                      cursor: cartIsIdle ? "pointer" : "not-allowed",
                    }}
                  >
                    Start Service
                  </button>
                  <button
                    onClick={() => setConfirmState({ id: appt.id, type: "no_show" })}
                    className="h-[30px] px-3 rounded-lg text-[12px] font-medium transition-colors"
                    style={{
                      fontFamily: "'Epilogue', sans-serif",
                      backgroundColor: "#FEF2F2",
                      color: "#DC2626",
                      border: "1px solid #FECACA",
                    }}
                  >
                    No-Show
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmState({ id: appt.id, type: "undo" })}
                  className="h-[34px] px-3 rounded-lg text-[12px] font-medium transition-colors"
                  style={{
                    fontFamily: "'Epilogue', sans-serif",
                    backgroundColor: "#F3F4F6",
                    color: "#374151",
                  }}
                >
                  Undo
                </button>
              )}
            </div>
          )}
        </div>

        {/* Inline confirms */}
        {isConfirmingThis && confirmState?.type === "no_show" && (
          <div
            className="mt-3 p-3 rounded-xl"
            style={{ backgroundColor: "#FFF5F5", border: "1px solid #FCA5A5" }}
          >
            <p
              className="text-[13px] text-gray-700 mb-2"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              Mark{" "}
              <span className="font-semibold">{appt.customerName}</span> as
              no-show?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleNoShowConfirm(appt.id)}
                className="flex-1 h-[32px] rounded-lg text-[13px] font-semibold text-white"
                style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: "#DC2626" }}
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmState(null)}
                className="flex-1 h-[32px] rounded-lg text-[13px] font-medium text-gray-700"
                style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: "#F3F4F6" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {isConfirmingThis && confirmState?.type === "undo" && (
          <div
            className="mt-3 p-3 rounded-xl"
            style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}
          >
            <p
              className="text-[13px] text-gray-700 mb-2"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              Restore{" "}
              <span className="font-semibold">{appt.customerName}</span> to
              scheduled?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleUndoConfirm(appt.id)}
                className="flex-1 h-[32px] rounded-lg text-[13px] font-semibold text-white"
                style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: "#15803D" }}
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmState(null)}
                className="flex-1 h-[32px] rounded-lg text-[13px] font-medium text-gray-700"
                style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: "#F3F4F6" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const displayList = activeTab === "upcoming" ? upcoming : history;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "rgba(15,15,16,0.85)" }}
      onClick={onClose}
    >
      <div
        className="relative m-auto w-full max-w-[680px] max-h-[88vh] rounded-2xl shadow-2xl flex flex-col"
        style={{ backgroundColor: "white" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: "#E5E7EB" }}
        >
          <div>
            <p
              className="text-[20px] font-bold text-gray-900 leading-tight"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Appointments · {config.displayName}
            </p>
            <p
              className="text-[13px] text-gray-400 mt-0.5"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              {scheduledCount} scheduled · {startedCount} started · {noShowCount} no-show
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[20px] text-gray-400 hover:text-gray-700 transition-colors leading-none"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1.5 px-6 py-3 border-b flex-shrink-0"
          style={{ borderColor: "#E5E7EB" }}
        >
          {(["upcoming", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setConfirmState(null);
              }}
              className={tabBase}
              style={{
                fontFamily: "'Epilogue', sans-serif",
                backgroundColor: activeTab === tab ? "#FFF0E8" : "#F3F4F6",
                color: activeTab === tab ? "#E84A00" : "#6B7280",
                border: activeTab === tab ? "1.5px solid #E84A00" : "1.5px solid transparent",
                fontWeight: activeTab === tab ? 600 : 400,
              }}
            >
              {tab === "upcoming"
                ? `Upcoming (${upcoming.length})`
                : `History (${history.length})`}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {displayList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <p
                className="text-[18px] font-semibold text-gray-400"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {activeTab === "upcoming"
                  ? "No upcoming appointments"
                  : "No appointment history yet"}
              </p>
              {activeTab === "upcoming" && (
                <p
                  className="text-[13px] text-gray-300 text-center max-w-[280px]"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  Appointments will appear here as they're scheduled
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {displayList.map((appt) => (
                <AppointmentRow key={appt.id} appt={appt} tab={activeTab} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
