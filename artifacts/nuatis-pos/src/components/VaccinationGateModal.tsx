import { useState } from "react";
import { PinModal } from "@/components/PinModal";
import { getFullVaccinationStatuses } from "@/lib/vaccinations";
import type { VaccinationRequirement } from "@/lib/vaccinations";
import { formatCurrency } from "@/lib/currency";

interface VaccinationOverrideOut {
  overriddenAt: number;
  blockers: string[];
}

interface VaccinationGateModalProps {
  serviceName: string;
  servicePriceCents: number;
  customerName: string;
  petName?: string;
  petBreed?: string;
  petSpecies?: "dog" | "cat" | "other";
  requiresVaccinations: VaccinationRequirement[];
  customerVaccinations?: {
    rabies?: { expiresAt: number };
    bordetella?: { expiresAt: number };
  };
  /** Pre-computed blockers and warnings from checkServiceRequirements */
  blockers: string[];
  warnings: string[];
  /**
   * Called when the operator approves adding the service.
   * - vaccinationOverride is present when a manager PIN was required (BLOCKED mode).
   * - vaccinationOverride is absent when warnings only (the operator tapped "Add anyway").
   */
  onAdd: (vaccinationOverride?: VaccinationOverrideOut) => void;
  onCancel: () => void;
}

const STATUS_ICON: Record<string, string> = {
  valid:          "✓",
  expiring_soon:  "⚠",
  expired:        "✕",
  missing:        "✕",
};

const STATUS_COLOR: Record<string, string> = {
  valid:          "#16A34A",
  expiring_soon:  "#D97706",
  expired:        "#DC2626",
  missing:        "#DC2626",
};

const STATUS_BG: Record<string, string> = {
  valid:          "#F0FDF4",
  expiring_soon:  "#FFFBEB",
  expired:        "#FEF2F2",
  missing:        "#FEF2F2",
};

function speciesEmoji(species?: "dog" | "cat" | "other"): string {
  if (species === "dog") return "🐕";
  if (species === "cat") return "🐈";
  return "🐾";
}

export function VaccinationGateModal({
  serviceName,
  servicePriceCents,
  customerName,
  petName,
  petBreed,
  petSpecies,
  requiresVaccinations,
  customerVaccinations,
  blockers,
  warnings,
  onAdd,
  onCancel,
}: VaccinationGateModalProps) {
  const [showPin, setShowPin] = useState(false);

  const isBlocked = blockers.length > 0;
  const nowMs = Date.now();

  const statuses = getFullVaccinationStatuses(
    requiresVaccinations,
    { vaccinations: customerVaccinations },
    nowMs,
  );

  function handleAddAnyway() {
    // Warning-only: no PIN required, no override record
    onAdd(undefined);
  }

  function handlePinApprove() {
    onAdd({ overriddenAt: Date.now(), blockers });
  }

  return (
    <>
      {/* Gate modal at z-50 */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
        onClick={onCancel}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-[440px] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header bar */}
          <div
            className="flex items-start justify-between px-6 pt-5 pb-4"
            style={{
              borderBottom: "1px solid #F3F4F6",
              backgroundColor: isBlocked ? "#FEF2F2" : "#FFFBEB",
            }}
          >
            <div>
              <p
                className="text-[19px] font-bold leading-snug"
                style={{
                  fontFamily: "'Fraunces', serif",
                  color: isBlocked ? "#DC2626" : "#B45309",
                }}
              >
                {isBlocked ? "Vaccination Required" : "Vaccination Expiring Soon"}
              </p>
              <p
                className="text-[13px] mt-0.5"
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  color: isBlocked ? "#B91C1C" : "#92400E",
                }}
              >
                {isBlocked
                  ? "This service requires up-to-date vaccinations."
                  : "Records are current but expiring. Groomer informed."}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-[20px] leading-none ml-4 mt-0.5"
              style={{ color: isBlocked ? "#DC2626" : "#D97706" }}
            >
              ✕
            </button>
          </div>

          {/* Service + pet summary */}
          <div
            className="px-6 py-4 flex items-start gap-3"
            style={{ borderBottom: "1px solid #F3F4F6" }}
          >
            <div className="flex-1">
              <p
                className="text-[15px] font-semibold text-gray-900"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                {serviceName}
                <span
                  className="ml-2 text-[13px] font-normal tabular-nums"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: "#6B7280" }}
                >
                  {formatCurrency(servicePriceCents)}
                </span>
              </p>
              <p
                className="text-[13px] text-gray-500 mt-0.5"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                Client: {customerName}
              </p>
            </div>
            {petName && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ backgroundColor: "#F0FDF4" }}
              >
                <span className="text-[18px]">{speciesEmoji(petSpecies)}</span>
                <div>
                  <p
                    className="text-[13px] font-semibold text-gray-800 leading-tight"
                    style={{ fontFamily: "'Epilogue', sans-serif" }}
                  >
                    {petName}
                  </p>
                  {petBreed && (
                    <p
                      className="text-[11px] text-gray-400 leading-tight"
                      style={{ fontFamily: "'Epilogue', sans-serif" }}
                    >
                      {petBreed}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Vaccination status list */}
          <div className="px-6 py-4 flex flex-col gap-2.5" style={{ borderBottom: "1px solid #F3F4F6" }}>
            <p
              className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              Vaccination Status
            </p>
            {statuses.map(({ label, status, text }) => (
              <div
                key={label}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
                style={{ backgroundColor: STATUS_BG[status] }}
              >
                <span
                  className="text-[16px] font-bold leading-none w-5 text-center flex-shrink-0"
                  style={{ color: STATUS_COLOR[status] }}
                >
                  {STATUS_ICON[status]}
                </span>
                <p
                  className="text-[13px] font-medium"
                  style={{
                    fontFamily: "'Epilogue', sans-serif",
                    color: STATUS_COLOR[status],
                  }}
                >
                  {text}
                </p>
              </div>
            ))}
          </div>

          {/* Action row */}
          <div className="px-6 py-4 flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 h-[48px] rounded-xl text-[14px] font-semibold transition-all duration-100"
              style={{
                fontFamily: "'Epilogue', sans-serif",
                backgroundColor: "#F3F4F6",
                color: "#374151",
              }}
            >
              Cancel
            </button>
            {isBlocked ? (
              <button
                onClick={() => setShowPin(true)}
                className="flex-1 h-[48px] rounded-xl text-[14px] font-semibold text-white transition-all duration-100 active:scale-[0.98]"
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  backgroundColor: "#DC2626",
                }}
              >
                Override with Manager PIN
              </button>
            ) : (
              <button
                onClick={handleAddAnyway}
                className="flex-1 h-[48px] rounded-xl text-[14px] font-semibold text-white transition-all duration-100 active:scale-[0.98]"
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  backgroundColor: "#D97706",
                }}
              >
                Add anyway
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PIN modal stacks at z-[60] above gate modal at z-50 */}
      {showPin && (
        <PinModal
          reason="Vaccination override — manager approval required"
          onApprove={handlePinApprove}
          onClose={() => setShowPin(false)}
        />
      )}
    </>
  );
}
