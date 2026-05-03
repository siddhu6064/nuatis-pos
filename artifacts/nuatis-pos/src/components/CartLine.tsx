import { useState } from "react";
import type { CartLine as CartLineType } from "@/hooks/useCart";
import type { Modifier } from "@/lib/modifiers";
import { formatCurrency } from "@/lib/currency";
import {
  calcLineTotalCents,
  calcLineDiscountCents,
  MANAGER_DISCOUNT_THRESHOLD,
} from "@/lib/cartMath";
import { formatElapsed, elapsedMinutes } from "@/lib/pricing";
import { useManagerOverride } from "@/hooks/useManagerOverride";
import { useActiveVertical } from "@/hooks/useActiveVertical";
import { useVerticalSettings } from "@/hooks/useVerticalSettings";

interface CartLineProps {
  line: CartLineType;
  isPulsing: boolean;
  frozen: boolean;
  onIncrement: (lineId: string) => void;
  onDecrement: (lineId: string) => void;
  onRemove: (lineId: string) => void;
  onStaffChange: (lineId: string, staffId: string) => void;
  onToggleModifier: (lineId: string, modifier: Modifier) => void;
  onSetDiscount: (lineId: string, percent: number) => void;
  // B23: session support
  elapsedTick: number;
  stopSession: (lineId: string) => void;
}

const DISCOUNT_PRESETS = [5, 10, 15, 20] as const;

export function CartLine({
  line,
  isPulsing,
  frozen,
  onIncrement,
  onDecrement,
  onRemove,
  onStaffChange,
  onToggleModifier,
  onSetDiscount,
  elapsedTick: _elapsedTick, // consumed as dependency to trigger re-render each tick
  stopSession,
}: CartLineProps) {
  const { requestManagerOverride } = useManagerOverride();
  const { config } = useActiveVertical();
  const { settings } = useVerticalSettings();

  const [staffPickerOpen, setStaffPickerOpen] = useState(false);
  const [modPickerOpen, setModPickerOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customRaw, setCustomRaw] = useState("");
  // B23: confirm-abort state for active session removal
  const [confirmRemoveSession, setConfirmRemoveSession] = useState(false);

  // B23: detect session states
  const isActiveSession =
    line.sessionStartedAt !== undefined && line.sessionEndedAt === undefined;
  const isLockedSession =
    line.sessionStartedAt !== undefined && line.sessionEndedAt !== undefined;

  // Compute elapsed for active session (re-evaluated every tick)
  const nowMs = Date.now();
  const sessionStartedAt = line.sessionStartedAt ?? nowMs;
  const elapsedMs = isActiveSession ? Math.max(0, nowMs - sessionStartedAt) : 0;
  const lockedElapsedMs = isLockedSession
    ? Math.max(0, (line.sessionEndedAt ?? nowMs) - sessionStartedAt)
    : 0;

  const lineTotal = calcLineTotalCents(line);
  const discountCents = calcLineDiscountCents(line);

  const activeStaffList = settings.staff.filter((s) => s.active);
  const assignedStaff =
    activeStaffList.find((s) => s.id === line.staffId) ??
    settings.staff.find((s) => s.id === line.staffId);

  const applicableMods: Modifier[] =
    config.modifiersByService[line.serviceId] ?? [];
  const hasApplicableMods = applicableMods.length > 0;
  const hasDiscount = line.discountPercent > 0;
  const isManagerDiscount = line.discountPercent > MANAGER_DISCOUNT_THRESHOLD;
  const hasVaccinationOverride = Boolean(line.vaccinationOverride);

  const stagedValue = parseInt(customRaw, 10);
  const stagedNeedsManager =
    !isNaN(stagedValue) && stagedValue > MANAGER_DISCOUNT_THRESHOLD;

  async function applyCustomDiscount() {
    const val = parseInt(customRaw, 10);
    if (isNaN(val) || val < 1 || val > 99) return;

    if (val > MANAGER_DISCOUNT_THRESHOLD) {
      const approved = await requestManagerOverride(`Line discount of ${val}%`);
      if (!approved) {
        setCustomRaw("");
        return;
      }
    }

    onSetDiscount(line.lineId, val);
    setDiscountOpen(false);
    setCustomMode(false);
    setCustomRaw("");
  }

  // ── B23: Active session rendering ─────────────────────────────────────────
  if (isActiveSession) {
    return (
      <div
        className="px-4 py-3 transition-colors duration-200"
        style={{ backgroundColor: isPulsing ? "#FFF0E8" : "#FFFBEB" }}
      >
        {/* Service name + "—" price placeholder */}
        <div className="flex items-start justify-between mb-1">
          <span
            className="text-[16px] font-medium text-gray-800 leading-tight flex-1 mr-2"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            {line.name}
          </span>
          <span
            className="text-[16px] font-semibold text-gray-400 tabular-nums flex-shrink-0"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            —
          </span>
        </div>

        {/* ACTIVE badge with elapsed time */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-[11px] font-bold px-1.5 py-0.5 rounded"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: "#B45309",
              backgroundColor: "#FDE68A",
              letterSpacing: "0.05em",
            }}
          >
            ACTIVE · {formatElapsed(elapsedMs)} elapsed
          </span>
        </div>

        {/* Stop Session button */}
        <button
          onClick={() => stopSession(line.lineId)}
          className="w-full h-[38px] rounded-lg text-[14px] font-semibold text-white mb-2 transition-all duration-100 active:scale-[0.98]"
          style={{
            fontFamily: "'Epilogue', sans-serif",
            backgroundColor: "#B45309",
          }}
        >
          Stop Session
        </button>

        {/* Remove (with confirm) */}
        {!confirmRemoveSession ? (
          <button
            onClick={() => setConfirmRemoveSession(true)}
            className="text-[12px] font-medium text-gray-400 hover:text-red-500 transition-colors"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            ✕ Remove (abort session)
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span
              className="text-[12px] text-gray-500"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              Abort session?
            </span>
            <button
              onClick={() => {
                onRemove(line.lineId);
                setConfirmRemoveSession(false);
              }}
              className="text-[12px] font-semibold text-red-500 hover:text-red-700 transition-colors"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              Yes, remove
            </button>
            <button
              onClick={() => setConfirmRemoveSession(false)}
              className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Staff attribution */}
        <div className="mt-1.5">
          <button
            onClick={() => !frozen && setStaffPickerOpen((v) => !v)}
            className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            → {assignedStaff?.firstName ?? "Unassigned"}
          </button>
          {staffPickerOpen && (
            <div className="flex gap-1 flex-wrap mt-1">
              {activeStaffList.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onStaffChange(line.lineId, s.id);
                    setStaffPickerOpen(false);
                  }}
                  className="h-[26px] px-2.5 rounded-md text-[11px] font-medium transition-colors duration-100"
                  style={{
                    fontFamily: "'Epilogue', sans-serif",
                    backgroundColor: s.id === line.staffId ? "#B45309" : "#F3F4F6",
                    color: s.id === line.staffId ? "white" : "#374151",
                  }}
                >
                  {s.firstName}
                </button>
              ))}
              <button
                onClick={() => setStaffPickerOpen(false)}
                className="h-[26px] px-2 rounded-md text-[11px] text-gray-400"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── B23: Locked session rendering ────────────────────────────────────────
  if (isLockedSession) {
    const lockedMins = elapsedMinutes(lockedElapsedMs);
    return (
      <div
        className="px-4 py-3 transition-colors duration-200"
        style={{ backgroundColor: isPulsing ? "#FFF0E8" : "transparent" }}
      >
        {/* Service name + final price */}
        <div className="flex items-start justify-between mb-0.5">
          <span
            className="text-[16px] font-medium text-gray-800 leading-tight flex-1 mr-2"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            {line.name}
          </span>
          <span
            className="text-[16px] font-semibold text-gray-900 tabular-nums flex-shrink-0"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {formatCurrency(lineTotal)}
          </span>
        </div>

        {/* SESSION badge */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[11px] font-bold px-1.5 py-0.5 rounded"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: "#6B7280",
              backgroundColor: "#F3F4F6",
              letterSpacing: "0.05em",
            }}
          >
            SESSION · {lockedMins}m
          </span>
        </div>

        {/* Discount sub-row */}
        {hasDiscount && (
          <div className="flex justify-end items-center gap-1 mb-1">
            {isManagerDiscount && (
              <span
                className="text-[10px] font-bold px-1 py-0.5 rounded"
                style={{ color: "#DC2626", backgroundColor: "#FEE2E2", fontFamily: "'Epilogue', sans-serif" }}
              >
                M
              </span>
            )}
            <span
              className="text-[12px] tabular-nums"
              style={{ fontFamily: "'Epilogue', sans-serif", color: "#DC2626" }}
            >
              −{line.discountPercent}% (−{formatCurrency(discountCents)})
            </span>
          </div>
        )}

        {/* Qty: show but no increment (sessions are qty 1) */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1">
            <span
              className="w-7 text-center text-[14px] font-medium text-gray-800 tabular-nums"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              ×1
            </span>
            <span
              className="text-[12px] text-gray-400 ml-1"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              session
            </span>
          </div>
          <button
            onClick={() => !frozen && onRemove(line.lineId)}
            className="text-[13px] font-medium text-gray-400 hover:text-red-500 transition-colors px-1"
            aria-label="Remove session"
          >
            ✕
          </button>
        </div>

        {/* Staff attribution */}
        <div className="mb-1">
          {!staffPickerOpen ? (
            <button
              onClick={() => !frozen && setStaffPickerOpen(true)}
              className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              → {assignedStaff?.firstName ?? "Unassigned"}
            </button>
          ) : (
            <div className="flex gap-1 flex-wrap">
              {activeStaffList.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onStaffChange(line.lineId, s.id);
                    setStaffPickerOpen(false);
                  }}
                  className="h-[26px] px-2.5 rounded-md text-[11px] font-medium transition-colors"
                  style={{
                    fontFamily: "'Epilogue', sans-serif",
                    backgroundColor: s.id === line.staffId ? "#E84A00" : "#F3F4F6",
                    color: s.id === line.staffId ? "white" : "#374151",
                  }}
                >
                  {s.firstName}
                </button>
              ))}
              <button
                onClick={() => setStaffPickerOpen(false)}
                className="h-[26px] px-2 rounded-md text-[11px] text-gray-400"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Discount picker (same as fixed-price) */}
        <div>
          {!discountOpen ? (
            <button
              onClick={() => !frozen && setDiscountOpen(true)}
              className="text-[12px] transition-colors"
              style={{
                fontFamily: "'Epilogue', sans-serif",
                color: hasDiscount ? "#DC2626" : "#9CA3AF",
              }}
            >
              {hasDiscount
                ? `−${line.discountPercent}%${isManagerDiscount ? " M" : ""} ▾`
                : "+ Discount"}
            </button>
          ) : (
            <div className="flex flex-wrap gap-1 items-center mt-0.5">
              {DISCOUNT_PRESETS.map((pct) => {
                const active = line.discountPercent === pct && !customMode;
                return (
                  <button
                    key={pct}
                    onClick={() => {
                      if (!frozen) {
                        setCustomMode(false);
                        setCustomRaw("");
                        onSetDiscount(line.lineId, active ? 0 : pct);
                      }
                    }}
                    className="h-[26px] px-2.5 rounded-md text-[11px] transition-all"
                    style={{
                      fontFamily: "'Epilogue', sans-serif",
                      fontWeight: active ? 700 : 500,
                      backgroundColor: active ? "#FEE2E2" : "#F9FAFB",
                      color: active ? "#DC2626" : "#6B7280",
                      border: active ? "1.5px solid #DC2626" : "1.5px solid #D1D5DB",
                    }}
                  >
                    {pct}%
                  </button>
                );
              })}
              <button
                onClick={() => !frozen && setCustomMode((v) => !v)}
                className="h-[26px] px-2.5 rounded-md text-[11px] transition-all"
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  fontWeight: customMode ? 700 : 500,
                  backgroundColor: customMode ? "#FEE2E2" : "#F9FAFB",
                  color: customMode ? "#DC2626" : "#6B7280",
                  border: customMode ? "1.5px solid #DC2626" : "1.5px solid #D1D5DB",
                }}
              >
                Custom
              </button>
              {customMode && (
                <div className="flex gap-1 items-center w-full mt-1">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={customRaw}
                    onChange={(e) => setCustomRaw(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") void applyCustomDiscount(); }}
                    placeholder="1–99"
                    className="w-16 h-[26px] px-2 text-[12px] rounded-md border outline-none tabular-nums"
                    style={{ fontFamily: "'JetBrains Mono', monospace", borderColor: "#DC2626" }}
                    autoFocus
                  />
                  <span className="text-[12px] text-gray-500" style={{ fontFamily: "'Epilogue', sans-serif" }}>%</span>
                  <button
                    onClick={() => void applyCustomDiscount()}
                    className="h-[26px] px-2 rounded-md text-[11px] font-semibold text-white"
                    style={{
                      fontFamily: "'Epilogue', sans-serif",
                      backgroundColor: stagedNeedsManager ? "#7C3AED" : "#DC2626",
                    }}
                  >
                    {stagedNeedsManager ? "Apply 🔒" : "Apply"}
                  </button>
                </div>
              )}
              <button
                onClick={() => { setDiscountOpen(false); setCustomMode(false); setCustomRaw(""); }}
                className="h-[26px] px-2 rounded-md text-[11px] text-gray-400"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Standard fixed-price line rendering ──────────────────────────────────
  return (
    <div
      className="px-4 py-3 transition-colors duration-200"
      style={{ backgroundColor: isPulsing ? "#FFF0E8" : "transparent" }}
    >
      {/* Service name + total */}
      <div className="flex items-start justify-between mb-0.5">
        <span
          className="text-[16px] font-medium text-gray-800 leading-tight flex-1 mr-2"
          style={{ fontFamily: "'Epilogue', sans-serif" }}
        >
          {line.name}
        </span>
        <span
          className="text-[16px] font-semibold text-gray-900 tabular-nums flex-shrink-0"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          {formatCurrency(lineTotal)}
        </span>
      </div>

      {/* B22: Vaccination override badge */}
      {hasVaccinationOverride && (
        <div className="flex items-center gap-1 mb-1">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{
              fontFamily: "'Epilogue', sans-serif",
              color: "#92400E",
              backgroundColor: "#FEF3C7",
              border: "1px solid #D97706",
            }}
          >
            VACC OVERRIDE
          </span>
        </div>
      )}

      {/* Discount sub-row */}
      {hasDiscount && (
        <div className="flex justify-end items-center gap-1 mb-1">
          {isManagerDiscount && (
            <span
              className="text-[10px] font-bold px-1 py-0.5 rounded"
              style={{ color: "#DC2626", backgroundColor: "#FEE2E2", fontFamily: "'Epilogue', sans-serif" }}
            >
              M
            </span>
          )}
          <span
            className="text-[12px] tabular-nums"
            style={{ fontFamily: "'Epilogue', sans-serif", color: "#DC2626" }}
          >
            −{line.discountPercent}% (−{formatCurrency(discountCents)})
          </span>
        </div>
      )}

      {/* Active modifier chips */}
      {line.modifiers.length > 0 && !modPickerOpen && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {line.modifiers.map((m) => (
            <span
              key={m.id}
              className="text-[11px] px-1.5 py-0.5 rounded-md"
              style={{
                fontFamily: "'Epilogue', sans-serif",
                backgroundColor: "#FFF0E8",
                color: "#E84A00",
                border: "1px solid #E84A00",
              }}
            >
              {m.name}
            </span>
          ))}
        </div>
      )}

      {/* Qty controls + remove */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => !frozen && onDecrement(line.lineId)}
            className="w-8 h-8 rounded-lg bg-black/6 hover:bg-black/10 text-gray-700 font-medium text-[15px] flex items-center justify-center transition-colors active:scale-95"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span
            className="w-7 text-center text-[14px] font-medium text-gray-800 tabular-nums"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {line.quantity}
          </span>
          <button
            onClick={() => !frozen && onIncrement(line.lineId)}
            className="w-8 h-8 rounded-lg bg-black/6 hover:bg-black/10 text-gray-700 font-medium text-[15px] flex items-center justify-center transition-colors active:scale-95"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button
          onClick={() => !frozen && onRemove(line.lineId)}
          className="text-[13px] font-medium text-gray-400 hover:text-red-500 transition-colors px-1"
          aria-label="Remove item"
        >
          ✕
        </button>
      </div>

      {/* Staff attribution */}
      <div className="mb-1">
        {!staffPickerOpen ? (
          <button
            onClick={() => !frozen && setStaffPickerOpen(true)}
            className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            → {assignedStaff?.firstName ?? "Unassigned"}
          </button>
        ) : (
          <div className="flex gap-1 flex-wrap">
            {activeStaffList.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  onStaffChange(line.lineId, s.id);
                  setStaffPickerOpen(false);
                }}
                className="h-[26px] px-2.5 rounded-md text-[11px] font-medium transition-colors"
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  backgroundColor: s.id === line.staffId ? "#E84A00" : "#F3F4F6",
                  color: s.id === line.staffId ? "white" : "#374151",
                }}
              >
                {s.firstName}
              </button>
            ))}
            <button
              onClick={() => setStaffPickerOpen(false)}
              className="h-[26px] px-2 rounded-md text-[11px] text-gray-400"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Modifier picker */}
      {hasApplicableMods && (
        <div className="mb-1">
          {!modPickerOpen ? (
            <button
              onClick={() => !frozen && setModPickerOpen(true)}
              className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              + Add-ons
            </button>
          ) : (
            <div className="flex flex-wrap gap-1 items-center">
              {applicableMods.map((mod) => {
                const active = line.modifiers.some((m) => m.id === mod.id);
                return (
                  <button
                    key={mod.id}
                    onClick={() => !frozen && onToggleModifier(line.lineId, mod)}
                    className="h-[26px] px-2 rounded-md text-[11px] transition-all"
                    style={{
                      fontFamily: "'Epilogue', sans-serif",
                      fontWeight: active ? 700 : 500,
                      backgroundColor: active ? "#FFF0E8" : "#F9FAFB",
                      color: active ? "#E84A00" : "#6B7280",
                      border: active ? "1.5px solid #E84A00" : "1.5px solid #D1D5DB",
                    }}
                  >
                    {mod.name} +{formatCurrency(mod.priceCents)}
                  </button>
                );
              })}
              <button
                onClick={() => setModPickerOpen(false)}
                className="h-[26px] px-2 rounded-md text-[11px] text-gray-400"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}

      {/* Discount picker */}
      <div>
        {!discountOpen ? (
          <button
            onClick={() => !frozen && setDiscountOpen(true)}
            className="text-[12px] transition-colors"
            style={{
              fontFamily: "'Epilogue', sans-serif",
              color: hasDiscount ? "#DC2626" : "#9CA3AF",
            }}
          >
            {hasDiscount
              ? `−${line.discountPercent}%${isManagerDiscount ? " M" : ""} ▾`
              : "+ Discount"}
          </button>
        ) : (
          <div className="flex flex-wrap gap-1 items-center mt-0.5">
            {DISCOUNT_PRESETS.map((pct) => {
              const active = line.discountPercent === pct && !customMode;
              return (
                <button
                  key={pct}
                  onClick={() => {
                    if (!frozen) {
                      setCustomMode(false);
                      setCustomRaw("");
                      onSetDiscount(line.lineId, active ? 0 : pct);
                    }
                  }}
                  className="h-[26px] px-2.5 rounded-md text-[11px] transition-all"
                  style={{
                    fontFamily: "'Epilogue', sans-serif",
                    fontWeight: active ? 700 : 500,
                    backgroundColor: active ? "#FEE2E2" : "#F9FAFB",
                    color: active ? "#DC2626" : "#6B7280",
                    border: active ? "1.5px solid #DC2626" : "1.5px solid #D1D5DB",
                  }}
                >
                  {pct}%
                </button>
              );
            })}
            <button
              onClick={() => !frozen && setCustomMode((v) => !v)}
              className="h-[26px] px-2.5 rounded-md text-[11px] transition-all"
              style={{
                fontFamily: "'Epilogue', sans-serif",
                fontWeight: customMode ? 700 : 500,
                backgroundColor: customMode ? "#FEE2E2" : "#F9FAFB",
                color: customMode ? "#DC2626" : "#6B7280",
                border: customMode ? "1.5px solid #DC2626" : "1.5px solid #D1D5DB",
              }}
            >
              Custom
            </button>
            {customMode && (
              <div className="flex gap-1 items-center w-full mt-1">
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={customRaw}
                  onChange={(e) => setCustomRaw(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void applyCustomDiscount(); }}
                  placeholder="1–99"
                  className="w-16 h-[26px] px-2 text-[12px] rounded-md border outline-none tabular-nums"
                  style={{ fontFamily: "'JetBrains Mono', monospace", borderColor: "#DC2626" }}
                  autoFocus
                />
                <span className="text-[12px] text-gray-500" style={{ fontFamily: "'Epilogue', sans-serif" }}>%</span>
                <button
                  onClick={() => void applyCustomDiscount()}
                  className="h-[26px] px-2 rounded-md text-[11px] font-semibold text-white"
                  style={{
                    fontFamily: "'Epilogue', sans-serif",
                    backgroundColor: stagedNeedsManager ? "#7C3AED" : "#DC2626",
                  }}
                >
                  {stagedNeedsManager ? "Apply 🔒" : "Apply"}
                </button>
              </div>
            )}
            <button
              onClick={() => { setDiscountOpen(false); setCustomMode(false); setCustomRaw(""); }}
              className="h-[26px] px-2 rounded-md text-[11px] text-gray-400"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
