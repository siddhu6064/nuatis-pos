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
import {
  TANNING_SERVICES,
  TANNING_MODIFIERS_BY_SERVICE,
  TANNING_CATEGORY_COLORS,
} from "@/lib/tanning-services";
import {
  LAUNDRY_SERVICES,
  LAUNDRY_MODIFIERS_BY_SERVICE,
  LAUNDRY_CATEGORY_COLORS,
} from "@/lib/laundry-services";
import {
  YOGA_SERVICES,
  YOGA_MODIFIERS_BY_SERVICE,
  YOGA_CATEGORY_COLORS,
} from "@/lib/yoga-services";

export type VerticalId = "salon" | "spa" | "nail_bar" | "tattoo" | "pet_grooming" | "tanning" | "laundry" | "yoga_pilates";

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
  workflow: "same_visit" | "drop_off";
  customerTerm: string;
  staffTerm: string;
  serviceTerm: string;
  // B29: true for verticals that have a class schedule
  classEnabled?: boolean;
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

const NAIL_BAR_CATEGORY_COLORS: Record<string, string> = {
  manicures: "#FCE7F3",
  pedicures: "#DDD6FE",
  enhancements: "#FFE4E6",
  art_addons: "#FEF9C3",
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
    workflow: "same_visit",
    customerTerm: "client",
    staffTerm: "stylist",
    serviceTerm: "service",
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
    workflow: "same_visit",
    customerTerm: "client",
    staffTerm: "therapist",
    serviceTerm: "service",
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
    workflow: "same_visit",
    customerTerm: "client",
    staffTerm: "technician",
    serviceTerm: "service",
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
    workflow: "same_visit",
    customerTerm: "client",
    staffTerm: "artist",
    serviceTerm: "service",
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
    workflow: "same_visit",
    customerTerm: "owner",
    staffTerm: "groomer",
    serviceTerm: "service",
  },
  tanning: {
    id: "tanning",
    displayName: "Tanning",
    tagline: "UV beds, spray tan, red light therapy",
    business: {
      name: "Sun Studio",
      address: "100 Bronze Blvd, Austin, TX 78706",
      phone: "(512) 555-0600",
    },
    services: TANNING_SERVICES,
    modifiersByService: TANNING_MODIFIERS_BY_SERVICE,
    categoryColors: TANNING_CATEGORY_COLORS,
    workflow: "same_visit",
    customerTerm: "client",
    staffTerm: "staff",
    serviceTerm: "session",
  },
  laundry: {
    id: "laundry",
    displayName: "Laundry",
    tagline: "Wash & fold, dry cleaning, specialty care",
    business: {
      name: "Clean & Press",
      address: "200 Linen Way, Austin, TX 78707",
      phone: "(512) 555-0700",
    },
    services: LAUNDRY_SERVICES,
    modifiersByService: LAUNDRY_MODIFIERS_BY_SERVICE,
    categoryColors: LAUNDRY_CATEGORY_COLORS,
    workflow: "drop_off",
    customerTerm: "customer",
    staffTerm: "staff",
    serviceTerm: "order",
  },
  yoga_pilates: {
    id: "yoga_pilates",
    displayName: "Yoga & Pilates",
    tagline: "Classes, private sessions, and mind-body wellness",
    business: {
      name: "Flow Studio",
      address: "300 Serenity Lane, Austin, TX 78708",
      phone: "(512) 555-0800",
    },
    services: YOGA_SERVICES,
    modifiersByService: YOGA_MODIFIERS_BY_SERVICE,
    categoryColors: YOGA_CATEGORY_COLORS,
    workflow: "same_visit",
    customerTerm: "member",
    staffTerm: "instructor",
    serviceTerm: "class",
    classEnabled: true,
  },
};

export function getActiveVerticalConfig(id: VerticalId): VerticalConfig {
  return VERTICALS[id];
}
