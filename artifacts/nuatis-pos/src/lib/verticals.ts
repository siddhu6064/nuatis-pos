import type { Service } from "@/lib/services";
import type { Modifier } from "@/lib/modifiers";
import { SERVICES, CATEGORY_COLORS } from "@/lib/services";
import { MODIFIERS_BY_SERVICE } from "@/lib/modifiers";

export type VerticalId = "salon" | "spa";

export interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
}

export interface VerticalConfig {
  id: VerticalId;
  displayName: string;
  tagline: string;
  business: BusinessInfo;
  services: Service[];
  modifiersByService: Record<string, Modifier[]>;
  categoryColors: Record<string, string>;
}

// ── Spa services ─────────────────────────────────────────────────────────────

const SPA_SERVICES: Service[] = [
  // Massages
  { id: "spa_swedish_60", name: "Swedish Massage", priceCents: 9000, durationMinutes: 60, category: "massages" },
  { id: "spa_deep_tissue_60", name: "Deep Tissue Massage", priceCents: 11000, durationMinutes: 60, category: "massages" },
  { id: "spa_hot_stone_60", name: "Hot Stone Massage", priceCents: 13000, durationMinutes: 60, category: "massages" },
  { id: "spa_prenatal_60", name: "Prenatal Massage", priceCents: 9500, durationMinutes: 60, category: "massages" },
  // Facials
  { id: "spa_classic_facial", name: "Classic Facial", priceCents: 8500, durationMinutes: 60, category: "facials" },
  { id: "spa_antiaging_facial", name: "Anti-Aging Facial", priceCents: 12500, durationMinutes: 75, category: "facials" },
  { id: "spa_hydrating_facial", name: "Hydrating Facial", priceCents: 9500, durationMinutes: 60, category: "facials" },
  // Body
  { id: "spa_body_scrub", name: "Body Scrub", priceCents: 7500, durationMinutes: 45, category: "body" },
  { id: "spa_detox_wrap", name: "Detox Body Wrap", priceCents: 11000, durationMinutes: 60, category: "body" },
  { id: "spa_aroma_wrap", name: "Aromatherapy Wrap", priceCents: 9500, durationMinutes: 60, category: "body" },
  // Wellness
  { id: "spa_reflexology", name: "Foot Reflexology", priceCents: 6500, durationMinutes: 30, category: "wellness" },
  { id: "spa_sauna", name: "Sauna Session", priceCents: 4000, durationMinutes: 30, category: "wellness" },
];

const SPA_MODIFIERS_BY_SERVICE: Record<string, Modifier[]> = {
  spa_swedish_60: [
    { id: "addon_30min_upgrade_swedish", name: "+30 min Upgrade", priceCents: 4000 },
    { id: "addon_aromatherapy", name: "Aromatherapy Oil", priceCents: 2000 },
  ],
  spa_deep_tissue_60: [
    { id: "addon_30min_upgrade_deep", name: "+30 min Upgrade", priceCents: 5000 },
  ],
  spa_hot_stone_60: [
    { id: "addon_30min_upgrade_hotstone", name: "+30 min Upgrade", priceCents: 6000 },
  ],
  spa_classic_facial: [
    { id: "addon_led_light", name: "LED Light Therapy", priceCents: 2500 },
    { id: "addon_eye_treatment_classic", name: "Eye Treatment", priceCents: 2000 },
  ],
  spa_antiaging_facial: [
    { id: "addon_eye_treatment_aa", name: "Eye Treatment", priceCents: 2000 },
  ],
};

// ── Vertical registry ─────────────────────────────────────────────────────────

export const VERTICALS: Record<VerticalId, VerticalConfig> = {
  salon: {
    id: "salon",
    displayName: "Salon",
    tagline: "Hair, color, and styling services",
    business: {
      name: "Nuatis POS Demo Salon",
      address: "123 Main St, Austin, TX 78701",
      phone: "(512) 555-0100",
    },
    services: SERVICES,
    modifiersByService: MODIFIERS_BY_SERVICE,
    categoryColors: CATEGORY_COLORS,
  },
  spa: {
    id: "spa",
    displayName: "Spa",
    tagline: "Massage, facials, body treatments, wellness",
    business: {
      name: "Nuatis POS Demo Spa",
      address: "456 Wellness Ave, Austin, TX 78704",
      phone: "(512) 555-0200",
    },
    services: SPA_SERVICES,
    modifiersByService: SPA_MODIFIERS_BY_SERVICE,
    categoryColors: {
      massages: "#A7F3D0",
      facials: "#FECDD3",
      body: "#FDE68A",
      wellness: "#BAE6FD",
    },
  },
};

export function getActiveVerticalConfig(id: VerticalId): VerticalConfig {
  return VERTICALS[id];
}
