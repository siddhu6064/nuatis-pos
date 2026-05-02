import { STAFF } from "@/lib/staff";
import { VERTICALS, type VerticalId } from "@/lib/verticals";
import { settingsKey } from "@/lib/storage";

export interface SettingsStaff {
  id: string;
  firstName: string;
  role: string;
  active: boolean;
}

export interface VerticalSettings {
  business: { name: string; address: string; phone: string };
  taxRatePercent: number;
  tipPresets: number[];
  staff: SettingsStaff[];
}

export type SettingsSection = "business" | "tax" | "tips" | "staff";

const DEFAULT_TIP_PRESETS: number[] = [15, 18, 20, 25];

export function getDefaults(verticalId: VerticalId): VerticalSettings {
  const config = VERTICALS[verticalId];
  return {
    business: { ...config.business },
    taxRatePercent: 8.25,
    tipPresets: DEFAULT_TIP_PRESETS,
    staff: STAFF.map((s) => ({ ...s, active: true })),
  };
}

export function getVerticalSettings(verticalId: VerticalId): VerticalSettings {
  try {
    const raw = localStorage.getItem(settingsKey(verticalId));
    if (!raw) return getDefaults(verticalId);
    const stored = JSON.parse(raw) as Partial<VerticalSettings>;
    const defaults = getDefaults(verticalId);
    return {
      business: stored.business ?? defaults.business,
      taxRatePercent: stored.taxRatePercent ?? defaults.taxRatePercent,
      tipPresets:
        Array.isArray(stored.tipPresets) && stored.tipPresets.length > 0
          ? stored.tipPresets
          : defaults.tipPresets,
      staff:
        Array.isArray(stored.staff) && stored.staff.length > 0
          ? stored.staff
          : defaults.staff,
    };
  } catch {
    return getDefaults(verticalId);
  }
}

export function setVerticalSettings(
  verticalId: VerticalId,
  settings: VerticalSettings,
): void {
  try {
    localStorage.setItem(settingsKey(verticalId), JSON.stringify(settings));
  } catch {
    // silent fail
  }
}

export function resetSection(
  verticalId: VerticalId,
  section: SettingsSection,
): VerticalSettings {
  const current = getVerticalSettings(verticalId);
  const defaults = getDefaults(verticalId);
  let updated: VerticalSettings;
  if (section === "business") {
    updated = { ...current, business: defaults.business };
  } else if (section === "tax") {
    updated = { ...current, taxRatePercent: defaults.taxRatePercent };
  } else if (section === "tips") {
    updated = { ...current, tipPresets: defaults.tipPresets };
  } else {
    updated = { ...current, staff: defaults.staff };
  }
  setVerticalSettings(verticalId, updated);
  return updated;
}

export function resetAll(verticalId: VerticalId): VerticalSettings {
  try {
    localStorage.removeItem(settingsKey(verticalId));
  } catch {
    // silent fail
  }
  return getDefaults(verticalId);
}
