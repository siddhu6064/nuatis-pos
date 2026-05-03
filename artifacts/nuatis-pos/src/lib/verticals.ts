import type { Service } from "@/lib/services";
import type { Modifier } from "@/lib/modifiers";
import { SERVICES, CATEGORY_COLORS } from "@/lib/services";
import { MODIFIERS_BY_SERVICE } from "@/lib/modifiers";
import { TATTOO_SERVICES, TATTOO_MODIFIERS_BY_SERVICE, TATTOO_CATEGORY_COLORS } from "@/lib/tattoo-services";
import {
  PET_GROOMING_SERVICES,
  PET_GROOMING_MODIFIERS_BY_SERVICE,
  PET_GROOMING_CATEGORY_COLORS,
} from "@/lib/pet-grooming-services";

export type VerticalId = "salon" | "spa" | "nail_bar" | "tattoo" | "pet_grooming";

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

// ── Nail bar services ─────────────────────────────────────────────────────────

const NAIL_BAR_SERVICES: Service[] = [
  // Manicures
  { id: "nail_basic_mani", name: "Basic Manicure", priceCents: 2500, durationMinutes: 30, category: "manicures" },
  { id: "nail_gel_mani", name: "Gel Manicure", priceCents: 4500, durationMinutes: 45, category: "manicures" },
  { id: "nail_french_mani", name: "French Manicure", priceCents: 3500, durationMinutes: 45, category: "manicures" },
  { id: "nail_polish_change", name: "Polish Change", priceCents: 1500, durationMinutes: 15, category: "manicures" },
  // Pedicures
  { id: "nail_basic_pedi", name: "Basic Pedicure", priceCents: 4000, durationMinutes: 45, category: "pedicures" },
  { id: "nail_gel_pedi", name: "Gel Pedicure", priceCents: 6000, durationMinutes: 60, category: "pedicures" },
  { id: "nail_spa_pedi", name: "Spa Pedicure", priceCents: 5500, durationMinutes: 60, category: "pedicures" },
  // Enhancements
  { id: "nail_acrylic_full", name: "Acrylic Full Set", priceCents: 6500, durationMinutes: 75, category: "enhancements" },
  { id: "nail_acrylic_fill", name: "Acrylic Fill", priceCents: 4000, durationMinutes: 45, category: "enhancements" },
  { id: "nail_dip_powder", name: "Dip Powder", priceCents: 5000, durationMinutes: 60, category: "enhancements" },
  // Art & Add-Ons
  { id: "nail_art_simple", name: "Nail Art (Simple)", priceCents: 1000, durationMinutes: 15, category: "art_addons" },
  { id: "nail_paraffin", name: "Paraffin Wax Treatment", priceCents: 1500, durationMinutes: 15, category: "art_addons" },
];

const NAIL_BAR_MODIFIERS_BY_SERVICE: Record<string, Modifier[]> = {
  nail_basic_mani: [
    { id: "nail_addon_paraffin", name: "Paraffin Add-on", priceCents: 1000 },
    { id: "nail_addon_french", name: "French Tip Add-on", priceCents: 800 },
  ],
  nail_gel_mani: [
    { id: "nail_addon_french_gel", name: "French Tip Add-on", priceCents: 1000 },
    { id: "nail_addon_chrome", name: "Chrome Finish", priceCents: 1500 },
  ],
  nail_basic_pedi: [
    { id: "nail_addon_callus", name: "Callus Treatment", priceCents: 1000 },
    { id: "nail_addon_paraffin_pedi", name: "Paraffin Add-on", priceCents: 1500 },
  ],
  nail_gel_pedi: [
    { id: "nail_addon_callus_gel", name: "Callus Treatment", priceCents: 1000 },
  ],
  nail_acrylic_full: [
    { id: "nail_addon_length", name: "Extra Length", priceCents: 1500 },
    { id: "nail_addon_design", name: "Design Per Nail", priceCents: 500 },
  ],
  nail_dip_powder: [
    { id: "nail_addon_ombre", name: "Ombre Effect", priceCents: 1500 },
  ],
};

// Nail bar category colors — visually distinct from all 8 salon + spa colors:
// Salon:   cuts #FBCFE8, color #FEF3C7, treatments #E9D5FF, styling #FED7AA
// Spa:     massages #A7F3D0, facials #FECDD3, body #FDE68A, wellness #BAE6FD
// Nail bar uses softer pink, soft violet, light rose, pale lemon — no hex reuse
const NAIL_BAR_CATEGORY_COLORS: Record<string, string> = {
  manicures: "#FCE7F3",   // softer pink   (≠ salon cuts #FBCFE8)
  pedicures: "#DDD6FE",   // soft violet   (≠ salon treatments #E9D5FF)
  enhancements: "#FFE4E6", // light rose    (≠ spa facials #FECDD3)
  art_addons: "#FEF9C3",  // pale lemon    (≠ spa body #FDE68A)
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
  nail_bar: {
    id: "nail_bar",
    displayName: "Nail Bar",
    tagline: "Manicures, pedicures, and nail enhancements",
    business: {
      name: "Nuatis POS Demo Nail Bar",
      address: "789 Polish Lane, Austin, TX 78702",
      phone: "(512) 555-0300",
    },
    services: NAIL_BAR_SERVICES,
    modifiersByService: NAIL_BAR_MODIFIERS_BY_SERVICE,
    categoryColors: NAIL_BAR_CATEGORY_COLORS,
  },
  tattoo: {
    id: "tattoo",
    displayName: "Tattoo",
    tagline: "Custom tattoos, touch-ups, and consultations",
    business: {
      name: "Nuatis POS Demo Tattoo",
      address: "321 Ink Blvd, Austin, TX 78705",
      phone: "(512) 555-0400",
    },
    services: TATTOO_SERVICES,
    modifiersByService: TATTOO_MODIFIERS_BY_SERVICE,
    categoryColors: TATTOO_CATEGORY_COLORS,
  },
  pet_grooming: {
    id: "pet_grooming",
    displayName: "Pet Grooming",
    tagline: "Grooming, bathing, and spa services for pets",
    business: {
      name: "Paws & Claws Grooming",
      address: "555 Bark Ave, Austin, TX 78703",
      phone: "(512) 555-0500",
    },
    services: PET_GROOMING_SERVICES,
    modifiersByService: PET_GROOMING_MODIFIERS_BY_SERVICE,
    categoryColors: PET_GROOMING_CATEGORY_COLORS,
  },
};

export function getActiveVerticalConfig(id: VerticalId): VerticalConfig {
  return VERTICALS[id];
}
