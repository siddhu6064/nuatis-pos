import { useState, useEffect, useRef } from "react";
import { useActiveVertical } from "@/hooks/useActiveVertical";
import { useVerticalSettings } from "@/hooks/useVerticalSettings";
import { normalizePhone, formatPhone } from "@/lib/phone";
import type { SettingsStaff } from "@/lib/verticalSettings";
import { STAFF } from "@/lib/staff";
import { formatCurrency } from "@/lib/currency";
import { calcTaxWithRate } from "@/lib/cartMath";

type Tab = "business" | "tax" | "staff";

interface SettingsOverlayProps {
  onClose: () => void;
}

const PREVIEW_SUBTOTAL = 10000; // $100.00 for tax preview

export function SettingsOverlay({ onClose }: SettingsOverlayProps) {
  const { activeVerticalId, config } = useActiveVertical();
  const { settings, updateBusiness, updateTaxRate, updateTipPresets, updateStaff, resetSection } =
    useVerticalSettings();

  // Close when vertical switches
  const prevVerticalRef = useRef(activeVerticalId);
  useEffect(() => {
    if (prevVerticalRef.current !== activeVerticalId) {
      onClose();
    }
    prevVerticalRef.current = activeVerticalId;
  }, [activeVerticalId, onClose]);

  // ESC to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (isAnyDirty) {
          setShowDiscardConfirm(true);
        } else {
          onClose();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [tab, setTab] = useState<Tab>("business");
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // ── Business draft ──────────────────────────────────────────────────────────
  const [bizName, setBizName] = useState(settings.business.name);
  const [bizAddress, setBizAddress] = useState(settings.business.address);
  const [bizPhone, setBizPhone] = useState(settings.business.phone);
  const [bizDirty, setBizDirty] = useState(false);

  // ── Tax + Tips draft ─────────────────────────────────────────────────────────
  const [taxRateStr, setTaxRateStr] = useState(
    String(settings.taxRatePercent),
  );
  const [tipRows, setTipRows] = useState<string[]>(
    settings.tipPresets.map(String),
  );
  const [taxTipsDirty, setTaxTipsDirty] = useState(false);

  // ── Staff draft ──────────────────────────────────────────────────────────────
  const [staffDraft, setStaffDraft] = useState<SettingsStaff[]>(
    settings.staff.map((s) => ({ ...s })),
  );
  const [staffDirty, setStaffDirty] = useState(false);

  const isAnyDirty = bizDirty || taxTipsDirty || staffDirty;

  // ── Business validation ──────────────────────────────────────────────────────
  const bizPhoneDigits = normalizePhone(bizPhone);
  const bizPhoneValid = bizPhoneDigits.length >= 10;
  const bizValid =
    bizName.trim().length > 0 &&
    bizAddress.trim().length > 0 &&
    bizPhoneValid;
  const bizSaveEnabled = bizDirty && bizValid;

  // ── Tax + Tips validation ────────────────────────────────────────────────────
  const taxParsed = parseFloat(taxRateStr);
  const taxValid =
    !isNaN(taxParsed) && taxParsed >= 0 && taxParsed <= 15;
  const parsedPresets = tipRows.map((r) => parseInt(r, 10));
  const presetsValid =
    tipRows.length >= 1 &&
    parsedPresets.every((v) => !isNaN(v) && v >= 0 && v <= 100) &&
    parsedPresets.some((v) => v > 0);
  const taxTipsSaveEnabled = taxTipsDirty && taxValid && presetsValid;

  // ── Staff validation ─────────────────────────────────────────────────────────
  const staffValid =
    staffDraft.every((s) => s.firstName.trim().length > 0) &&
    staffDraft.some((s) => s.active);
  const staffSaveEnabled = staffDirty && staffValid;

  // ── Save handlers ─────────────────────────────────────────────────────────────
  function saveBusiness() {
    updateBusiness({
      name: bizName.trim(),
      address: bizAddress.trim(),
      phone: bizPhoneDigits.length === 10
        ? formatPhone(bizPhoneDigits)
        : bizPhone.trim(),
    });
    setBizDirty(false);
  }

  function saveTaxTips() {
    updateTaxRate(taxParsed);
    updateTipPresets(parsedPresets);
    setTaxTipsDirty(false);
  }

  function saveStaff() {
    updateStaff(staffDraft);
    setStaffDirty(false);
  }

  // ── Reset handler ─────────────────────────────────────────────────────────────
  function doReset() {
    setShowResetConfirm(false);
    if (tab === "business") {
      resetSection("business");
      setBizName(config.business.name);
      setBizAddress(config.business.address);
      setBizPhone(config.business.phone);
      setBizDirty(false);
    } else if (tab === "tax") {
      resetSection("tax");
      resetSection("tips");
      setTaxRateStr("8.25");
      setTipRows(["15", "18", "20", "25"]);
      setTaxTipsDirty(false);
    } else {
      resetSection("staff");
      setStaffDraft(STAFF.map((s) => ({ ...s, active: true })));
      setStaffDirty(false);
    }
  }

  // ── Bottom bar ───────────────────────────────────────────────────────────────
  function getSaveEnabled() {
    if (tab === "business") return bizSaveEnabled;
    if (tab === "tax") return taxTipsSaveEnabled;
    return staffSaveEnabled;
  }

  function handleSave() {
    if (tab === "business") saveBusiness();
    else if (tab === "tax") saveTaxTips();
    else saveStaff();
  }

  function handleBackdropClick() {
    if (isAnyDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  }

  // ── Tax preview math ─────────────────────────────────────────────────────────
  const previewTaxCents = taxValid
    ? calcTaxWithRate(PREVIEW_SUBTOTAL, taxParsed)
    : 0;
  const previewTotalCents = PREVIEW_SUBTOTAL + previewTaxCents;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(15,15,16,0.85)" }}
      onClick={handleBackdropClick}
    >
      {/* Discard confirm */}
      {showDiscardConfirm && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="bg-white rounded-2xl p-6 w-[340px] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p
              className="text-[18px] font-bold text-gray-900 mb-2"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Discard changes?
            </p>
            <p
              className="text-[14px] text-gray-500 mb-5"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              You have unsaved changes. Discard them and close?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 h-[44px] rounded-lg border text-[14px] font-medium text-gray-700 hover:bg-gray-50"
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  borderColor: "#D1D5DB",
                }}
              >
                Keep Editing
              </button>
              <button
                onClick={onClose}
                className="flex-1 h-[44px] rounded-lg text-[14px] font-semibold text-white"
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  backgroundColor: "#DC2626",
                }}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="bg-white rounded-2xl w-full max-w-[720px] flex flex-col"
        style={{ maxHeight: "88vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div
          className="px-6 pt-5 pb-0 flex-shrink-0 border-b"
          style={{ borderColor: "#E5E7EB" }}
        >
          <div className="flex items-start justify-between mb-1">
            <div>
              <p
                className="text-[22px] font-bold text-gray-900"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Settings · {config.displayName}
              </p>
              <p
                className="text-[13px] text-gray-400 mt-0.5"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                These settings apply to {config.displayName} only. Switch
                verticals to edit theirs.
              </p>
            </div>
            <button
              onClick={handleBackdropClick}
              className="text-[20px] text-gray-400 hover:text-gray-700 transition-colors leading-none mt-1 ml-4 flex-shrink-0"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Tab strip */}
          <div className="flex gap-0 mt-4">
            {(["business", "tax", "staff"] as Tab[]).map((t) => {
              const labels: Record<Tab, string> = {
                business: "Business",
                tax: "Tax & Tips",
                staff: "Staff",
              };
              const isActive = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-4 pb-3 pt-1 text-[14px] transition-all duration-100 relative"
                  style={{
                    fontFamily: "'Epilogue', sans-serif",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#E84A00" : "#6B7280",
                  }}
                >
                  {labels[t]}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t"
                      style={{ backgroundColor: "#E84A00" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ── Business tab ── */}
          {tab === "business" && (
            <div className="space-y-5">
              <div>
                <p
                  className="text-[18px] font-semibold text-gray-900 mb-0.5"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  Business Identity
                </p>
                <p
                  className="text-[12px] text-gray-400 italic"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  Shown on every receipt.
                </p>
              </div>

              <div className="space-y-4">
                <LabeledInput
                  label="Business Name"
                  value={bizName}
                  maxLength={60}
                  onChange={(v) => {
                    setBizName(v);
                    setBizDirty(true);
                  }}
                  error={
                    bizDirty && bizName.trim().length === 0
                      ? "Required"
                      : undefined
                  }
                />
                <LabeledInput
                  label="Street Address"
                  value={bizAddress}
                  maxLength={100}
                  onChange={(v) => {
                    setBizAddress(v);
                    setBizDirty(true);
                  }}
                  error={
                    bizDirty && bizAddress.trim().length === 0
                      ? "Required"
                      : undefined
                  }
                />
                <LabeledInput
                  label="Phone"
                  value={bizPhone}
                  onChange={(v) => {
                    setBizPhone(v);
                    setBizDirty(true);
                  }}
                  error={
                    bizDirty && !bizPhoneValid ? "Enter a valid phone number" : undefined
                  }
                />
              </div>

              {/* Live preview card */}
              <div
                className="rounded-xl p-5 text-center"
                style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}
              >
                <p
                  className="text-[11px] uppercase tracking-widest text-gray-400 mb-3"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  Receipt preview
                </p>
                <p
                  className="text-[18px] font-bold text-gray-900 mb-0.5"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  {bizName || "\u00A0"}
                </p>
                <p
                  className="text-[12px] text-gray-500"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  {bizAddress || "\u00A0"}
                </p>
                <p
                  className="text-[12px] text-gray-500"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  {bizPhone || "\u00A0"}
                </p>
              </div>
            </div>
          )}

          {/* ── Tax & Tips tab ── */}
          {tab === "tax" && (
            <div className="space-y-8">
              {/* Tax section */}
              <div className="space-y-4">
                <div>
                  <p
                    className="text-[18px] font-semibold text-gray-900 mb-0.5"
                    style={{ fontFamily: "'Fraunces', serif" }}
                  >
                    Tax Rate
                  </p>
                  <p
                    className="text-[12px] text-gray-400"
                    style={{ fontFamily: "'Epilogue', sans-serif" }}
                  >
                    Applied to subtotal on every ticket. Production will use
                    TaxJar by location.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-[120px]">
                    <input
                      type="number"
                      min={0}
                      max={15}
                      step={0.001}
                      value={taxRateStr}
                      onChange={(e) => {
                        setTaxRateStr(e.target.value);
                        setTaxTipsDirty(true);
                      }}
                      className="w-full h-[44px] pl-3 pr-8 text-[15px] rounded-lg border outline-none tabular-nums"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        borderColor: taxValid ? "#D1D5DB" : "#DC2626",
                        backgroundColor: "white",
                      }}
                    />
                    <span
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-gray-400"
                      style={{ fontFamily: "'Epilogue', sans-serif" }}
                    >
                      %
                    </span>
                  </div>
                  {!taxValid && (
                    <p
                      className="text-[12px]"
                      style={{
                        fontFamily: "'Epilogue', sans-serif",
                        color: "#DC2626",
                      }}
                    >
                      Enter 0–15
                    </p>
                  )}
                </div>

                {/* Tax live preview */}
                {taxValid && (
                  <div
                    className="flex items-center gap-2 px-4 py-3 rounded-lg"
                    style={{ backgroundColor: "#F3F4F6" }}
                  >
                    <span
                      className="text-[13px] text-gray-500"
                      style={{ fontFamily: "'Epilogue', sans-serif" }}
                    >
                      $100.00 →
                    </span>
                    <span
                      className="text-[13px] font-medium text-gray-700"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      tax {formatCurrency(previewTaxCents)}
                    </span>
                    <span
                      className="text-[13px] text-gray-500"
                      style={{ fontFamily: "'Epilogue', sans-serif" }}
                    >
                      →
                    </span>
                    <span
                      className="text-[13px] font-semibold text-gray-900"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      total {formatCurrency(previewTotalCents)}
                    </span>
                  </div>
                )}
              </div>

              {/* Tip presets section */}
              <div className="space-y-4">
                <div>
                  <p
                    className="text-[18px] font-semibold text-gray-900 mb-0.5"
                    style={{ fontFamily: "'Fraunces', serif" }}
                  >
                    Tip Presets
                  </p>
                  <p
                    className="text-[12px] text-gray-400"
                    style={{ fontFamily: "'Epilogue', sans-serif" }}
                  >
                    Operator sees these as quick-tap buttons during checkout.
                  </p>
                </div>

                <div className="space-y-2">
                  {tipRows.map((val, idx) => {
                    const parsed = parseInt(val, 10);
                    const rowInvalid =
                      val !== "" && (isNaN(parsed) || parsed < 0 || parsed > 100);
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <span
                          className="text-[13px] text-gray-500 w-16 flex-shrink-0"
                          style={{ fontFamily: "'Epilogue', sans-serif" }}
                        >
                          Preset {idx + 1}
                        </span>
                        <div className="relative w-[88px]">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={val}
                            onChange={(e) => {
                              const next = [...tipRows];
                              next[idx] = e.target.value;
                              setTipRows(next);
                              setTaxTipsDirty(true);
                            }}
                            className="w-full h-[40px] pl-3 pr-7 text-[14px] rounded-lg border outline-none tabular-nums"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              borderColor: rowInvalid ? "#DC2626" : "#D1D5DB",
                              backgroundColor: "white",
                            }}
                          />
                          <span
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[13px] text-gray-400"
                            style={{ fontFamily: "'Epilogue', sans-serif" }}
                          >
                            %
                          </span>
                        </div>
                        {tipRows.length > 1 && (
                          <button
                            onClick={() => {
                              setTipRows(tipRows.filter((_, i) => i !== idx));
                              setTaxTipsDirty(true);
                            }}
                            className="text-[13px] text-gray-400 hover:text-red-500 transition-colors"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {tipRows.length < 6 && (
                  <button
                    onClick={() => {
                      setTipRows([...tipRows, ""]);
                      setTaxTipsDirty(true);
                    }}
                    className="text-[13px] font-medium transition-colors"
                    style={{
                      fontFamily: "'Epilogue', sans-serif",
                      color: "#E84A00",
                    }}
                  >
                    + Add Preset
                  </button>
                )}

                {!presetsValid && taxTipsDirty && (
                  <p
                    className="text-[12px]"
                    style={{
                      fontFamily: "'Epilogue', sans-serif",
                      color: "#DC2626",
                    }}
                  >
                    At least one preset must be between 1–100.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Staff tab ── */}
          {tab === "staff" && (
            <div className="space-y-5">
              <div>
                <p
                  className="text-[18px] font-semibold text-gray-900 mb-0.5"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  Staff Members
                </p>
                <p
                  className="text-[12px] text-gray-400"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  Only active staff appear in the operator switcher and per-line
                  picker.
                </p>
              </div>

              <div className="space-y-2">
                {staffDraft.map((s, idx) => {
                  const activeCount = staffDraft.filter((x) => x.active).length;
                  const isLastActive = s.active && activeCount === 1;
                  const nameEmpty = s.firstName.trim().length === 0;

                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{
                        backgroundColor: s.active ? "white" : "#F9FAFB",
                        border: `1px solid ${s.active ? "#E5E7EB" : "#F3F4F6"}`,
                        opacity: s.active ? 1 : 0.65,
                      }}
                    >
                      <input
                        type="text"
                        value={s.firstName}
                        placeholder="First name"
                        onChange={(e) => {
                          const next = [...staffDraft];
                          next[idx] = { ...next[idx], firstName: e.target.value };
                          setStaffDraft(next);
                          setStaffDirty(true);
                        }}
                        className="flex-1 h-[36px] px-3 text-[14px] rounded-lg border outline-none"
                        style={{
                          fontFamily: "'Epilogue', sans-serif",
                          borderColor: nameEmpty && staffDirty ? "#DC2626" : "#D1D5DB",
                          backgroundColor: "white",
                        }}
                      />
                      <input
                        type="text"
                        value={s.role}
                        placeholder="Role"
                        onChange={(e) => {
                          const next = [...staffDraft];
                          next[idx] = { ...next[idx], role: e.target.value };
                          setStaffDraft(next);
                          setStaffDirty(true);
                        }}
                        className="w-[110px] h-[36px] px-3 text-[14px] rounded-lg border outline-none"
                        style={{
                          fontFamily: "'Epilogue', sans-serif",
                          borderColor: "#D1D5DB",
                          backgroundColor: "white",
                        }}
                      />

                      {/* Active toggle */}
                      <button
                        onClick={() => {
                          if (isLastActive) return; // can't deactivate last active
                          const next = [...staffDraft];
                          next[idx] = { ...next[idx], active: !next[idx].active };
                          setStaffDraft(next);
                          setStaffDirty(true);
                        }}
                        title={isLastActive ? "At least one staff must be active" : undefined}
                        className="h-[28px] px-2.5 rounded-md text-[11px] font-semibold flex-shrink-0 transition-all"
                        style={{
                          fontFamily: "'Epilogue', sans-serif",
                          backgroundColor: s.active ? "#D1FAE5" : "#F3F4F6",
                          color: s.active ? "#059669" : "#9CA3AF",
                          cursor: isLastActive ? "not-allowed" : "pointer",
                        }}
                      >
                        {s.active ? "Active" : "Inactive"}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (isLastActive) return;
                          const next = staffDraft.filter((_, i) => i !== idx);
                          setStaffDraft(next);
                          setStaffDirty(true);
                        }}
                        disabled={isLastActive}
                        title={isLastActive ? "Cannot delete last active staff" : "Remove"}
                        className="text-[13px] text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                        style={{
                          cursor: isLastActive ? "not-allowed" : "pointer",
                          opacity: isLastActive ? 0.4 : 1,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  const newStaff: SettingsStaff = {
                    id: `staff_custom_${Date.now()}`,
                    firstName: "",
                    role: "",
                    active: true,
                  };
                  setStaffDraft([...staffDraft, newStaff]);
                  setStaffDirty(true);
                }}
                className="text-[13px] font-medium transition-colors"
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  color: "#E84A00",
                }}
              >
                + Add Staff
              </button>

              {staffDirty && !staffValid && (
                <p
                  className="text-[12px]"
                  style={{
                    fontFamily: "'Epilogue', sans-serif",
                    color: "#DC2626",
                  }}
                >
                  {!staffDraft.some((s) => s.active)
                    ? "At least one staff must be active."
                    : "All staff names are required."}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div
          className="flex items-center justify-between px-6 py-4 border-t flex-shrink-0"
          style={{ borderColor: "#E5E7EB" }}
        >
          <div>
            {showResetConfirm ? (
              <div className="flex items-center gap-2">
                <span
                  className="text-[13px] text-gray-600"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  Reset to defaults?
                </span>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="text-[13px] font-medium text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
                  style={{ fontFamily: "'Epilogue', sans-serif" }}
                >
                  Cancel
                </button>
                <button
                  onClick={doReset}
                  className="text-[13px] font-semibold px-3 py-1 rounded-lg text-white"
                  style={{
                    fontFamily: "'Epilogue', sans-serif",
                    backgroundColor: "#DC2626",
                  }}
                >
                  Confirm
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="text-[13px] font-medium transition-colors"
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  color: "#DC2626",
                }}
              >
                Reset This Section
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!getSaveEnabled() && (
              <button
                onClick={onClose}
                className="h-[44px] px-5 rounded-lg text-[14px] font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                Done
              </button>
            )}
            {getSaveEnabled() && (
              <button
                onClick={handleSave}
                className="h-[44px] px-6 rounded-lg text-[14px] font-semibold text-white transition-all active:scale-[0.97]"
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  backgroundColor: "#E84A00",
                }}
              >
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared input component ────────────────────────────────────────────────────

interface LabeledInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  error?: string;
}

function LabeledInput({
  label,
  value,
  onChange,
  maxLength,
  error,
}: LabeledInputProps) {
  return (
    <div>
      <label
        className="block text-[12px] font-medium text-gray-600 mb-1"
        style={{ fontFamily: "'Epilogue', sans-serif" }}
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[44px] px-3 text-[14px] rounded-lg border outline-none"
        style={{
          fontFamily: "'Epilogue', sans-serif",
          borderColor: error ? "#DC2626" : "#D1D5DB",
          backgroundColor: "white",
        }}
      />
      {error && (
        <p
          className="mt-1 text-[11px]"
          style={{
            fontFamily: "'Epilogue', sans-serif",
            color: "#DC2626",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
