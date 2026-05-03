import { useState } from "react";
import type { ClassSlot, ClassEnrollment } from "@/lib/classSlots";
import { formatElapsed } from "@/lib/shifts";

interface ClassesOverlayProps {
  slots: ClassSlot[];
  onBookRequest: (slotId: string) => void;
  onCancelEnrollment: (slotId: string, enrollmentId: string) => void;
  onClose: () => void;
}

function formatSlotTime(scheduledAt: number): string {
  return new Date(scheduledAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function CapacityBadge({ filled, capacity }: { filled: number; capacity: number }) {
  const isFull = filled >= capacity;
  const pct = capacity > 0 ? filled / capacity : 0;
  const isAmber = !isFull && pct >= 0.8;

  const bg = isFull ? "#FEE2E2" : isAmber ? "#FEF3C7" : "#DCFCE7";
  const color = isFull ? "#DC2626" : isAmber ? "#92400E" : "#15803D";
  const label = isFull ? `FULL · ${filled}/${capacity}` : `${filled}/${capacity}`;

  return (
    <span
      className="h-[20px] px-2 rounded-full text-[11px] font-semibold flex items-center"
      style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: bg, color }}
    >
      {label}
    </span>
  );
}

function RosterRow({
  enrollment,
  onCancel,
}: {
  enrollment: ClassEnrollment;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-black/4">
      <div>
        <span
          className="text-[13px] font-medium text-gray-800"
          style={{ fontFamily: "'Epilogue', sans-serif" }}
        >
          {enrollment.customerName}
        </span>
        <span
          className="ml-2 text-[11px] text-gray-400"
          style={{ fontFamily: "'Epilogue', sans-serif" }}
        >
          {formatElapsed(enrollment.enrolledAt)}
        </span>
        {enrollment.transactionId && (
          <span
            className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: "#DCFCE7",
              color: "#15803D",
            }}
          >
            PAID
          </span>
        )}
      </div>
      <button
        onClick={onCancel}
        className="text-[11px] font-medium text-gray-400 hover:text-red-500 transition-colors px-1.5 py-0.5 rounded"
        style={{ fontFamily: "'Epilogue', sans-serif" }}
        title="Cancel enrollment"
      >
        Cancel
      </button>
    </div>
  );
}

function SlotRow({
  slot,
  onBook,
  onCancelEnrollment,
}: {
  slot: ClassSlot;
  onBook: () => void;
  onCancelEnrollment: (enrollmentId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isFull = slot.roster.length >= slot.capacity;
  const hasRoster = slot.roster.length > 0;

  return (
    <div
      className="border rounded-xl overflow-hidden"
      style={{ borderColor: "#E5E7EB", backgroundColor: "white" }}
    >
      {/* Main row */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-[15px] font-semibold text-gray-900"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              {formatSlotTime(slot.scheduledAt)}
            </span>
            <CapacityBadge filled={slot.roster.length} capacity={slot.capacity} />
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-[13px] text-gray-700 font-medium"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              {slot.serviceName}
            </span>
            <span
              className="text-[12px] text-gray-400"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              · {slot.durationMin}min · {slot.instructorName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-3">
          <button
            onClick={!isFull ? onBook : undefined}
            disabled={isFull}
            title={isFull ? "Class is full" : "Book a spot"}
            className="h-[32px] px-3 rounded-lg text-[13px] font-semibold transition-all duration-100 active:scale-[0.97]"
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: isFull ? "#F3F4F6" : "#D1EDD4",
              color: isFull ? "#9CA3AF" : "#1A6B2A",
              cursor: isFull ? "not-allowed" : "pointer",
            }}
          >
            Book
          </button>

          {hasRoster && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="h-[32px] w-[32px] flex items-center justify-center rounded-lg transition-colors hover:bg-black/5"
              style={{ color: "#6B7280" }}
              title={expanded ? "Collapse roster" : "Expand roster"}
            >
              <span
                className="text-[14px] transition-transform duration-150"
                style={{ display: "inline-block", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                ▾
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Roster (expanded) */}
      {expanded && hasRoster && (
        <div
          className="px-4 pb-3 border-t"
          style={{ borderColor: "#F3F4F6", backgroundColor: "#FAFAFA" }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 pt-2.5 pb-1.5"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Roster
          </p>
          <div className="flex flex-col gap-0.5">
            {slot.roster.map((enrollment) => (
              <RosterRow
                key={enrollment.id}
                enrollment={enrollment}
                onCancel={() => onCancelEnrollment(enrollment.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ClassesOverlay({
  slots,
  onBookRequest,
  onCancelEnrollment,
  onClose,
}: ClassesOverlayProps) {
  const sorted = [...slots].sort((a, b) => a.scheduledAt - b.scheduledAt);
  const totalBooked = slots.reduce((s, slot) => s + slot.roster.length, 0);

  return (
    <div
      className="fixed inset-0 z-40 flex"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
    >
      <div
        className="ml-auto h-full w-[560px] flex flex-col shadow-2xl"
        style={{ backgroundColor: "#F8F7F4" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: "#E5E7EB", backgroundColor: "white" }}
        >
          <div>
            <p
              className="text-[20px] font-bold text-gray-900"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Classes
            </p>
            <p
              className="text-[12px] text-gray-400"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              {sorted.length} {sorted.length === 1 ? "class" : "classes"} today · {totalBooked} enrolled
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[20px] text-gray-400 hover:text-gray-600 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5"
          >
            ✕
          </button>
        </div>

        {/* Slot list */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {sorted.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p
                className="text-[14px] text-gray-400"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                No classes scheduled for today
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sorted.map((slot) => (
                <SlotRow
                  key={slot.id}
                  slot={slot}
                  onBook={() => onBookRequest(slot.id)}
                  onCancelEnrollment={(enrollmentId) => onCancelEnrollment(slot.id, enrollmentId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
