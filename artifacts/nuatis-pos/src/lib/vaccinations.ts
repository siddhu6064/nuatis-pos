export type VaccinationStatus = "valid" | "expiring_soon" | "expired" | "missing";
export type VaccinationRequirement = "rabies" | "bordetella";

export interface VaccinationRecord {
  expiresAt: number; // epoch ms
}

export interface VaccinationCheckResult {
  allowed: boolean;
  blockers: string[];
  warnings: string[];
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function getVaccinationStatus(
  vaccination: VaccinationRecord | undefined,
  nowMs: number,
): VaccinationStatus {
  if (!vaccination) return "missing";
  if (vaccination.expiresAt < nowMs) return "expired";
  if (vaccination.expiresAt < nowMs + THIRTY_DAYS_MS) return "expiring_soon";
  return "valid";
}

interface ServiceRequirements {
  requiresVaccinations?: VaccinationRequirement[];
}

interface CustomerVaccinationData {
  vaccinations?: {
    rabies?: VaccinationRecord;
    bordetella?: VaccinationRecord;
  };
}

export function checkServiceRequirements(
  service: ServiceRequirements,
  customer: CustomerVaccinationData | undefined,
  nowMs: number,
): VaccinationCheckResult {
  const required = service.requiresVaccinations ?? [];
  const vaccinations = customer?.vaccinations;
  const blockers: string[] = [];
  const warnings: string[] = [];

  for (const req of required) {
    const record = vaccinations?.[req];
    const status = getVaccinationStatus(record, nowMs);
    const label = req === "rabies" ? "Rabies" : "Bordetella";

    if (status === "missing" || status === "expired") {
      blockers.push(formatVaccinationStatus(label, status, record?.expiresAt, nowMs));
    } else if (status === "expiring_soon") {
      warnings.push(formatVaccinationStatus(label, status, record?.expiresAt, nowMs));
    }
  }

  return { allowed: blockers.length === 0, blockers, warnings };
}

export function formatVaccinationStatus(
  label: string,
  status: VaccinationStatus,
  expiresAt: number | undefined,
  nowMs: number,
): string {
  if (status === "missing") {
    return `${label} — not on file`;
  }
  if (status === "expired" && expiresAt !== undefined) {
    const daysAgo = Math.floor((nowMs - expiresAt) / (24 * 60 * 60 * 1000));
    if (daysAgo < 31) {
      return `${label} expired ${daysAgo} day${daysAgo === 1 ? "" : "s"} ago`;
    }
    const monthsAgo = Math.floor(daysAgo / 30);
    if (monthsAgo < 13) {
      return `${label} expired ${monthsAgo} month${monthsAgo === 1 ? "" : "s"} ago`;
    }
    const yearsAgo = Math.floor(daysAgo / 365);
    return `${label} expired ${yearsAgo} year${yearsAgo === 1 ? "" : "s"} ago`;
  }
  if (status === "expiring_soon" && expiresAt !== undefined) {
    const daysLeft = Math.ceil((expiresAt - nowMs) / (24 * 60 * 60 * 1000));
    return `${label} expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
  }
  if (status === "valid" && expiresAt !== undefined) {
    const d = new Date(expiresAt);
    const formatted = new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "numeric",
    }).format(d);
    return `${label} valid — expires ${formatted}`;
  }
  return `${label} — ${status}`;
}

/**
 * Returns full vaccination status for every required vaccination,
 * including "valid" entries (for display in the status panel).
 */
export function getFullVaccinationStatuses(
  requirements: VaccinationRequirement[],
  customer: CustomerVaccinationData | undefined,
  nowMs: number,
): Array<{ label: string; status: VaccinationStatus; text: string }> {
  return requirements.map((req) => {
    const record = customer?.vaccinations?.[req];
    const status = getVaccinationStatus(record, nowMs);
    const label = req === "rabies" ? "Rabies" : "Bordetella";
    const text = formatVaccinationStatus(label, status, record?.expiresAt, nowMs);
    return { label, status, text };
  });
}
