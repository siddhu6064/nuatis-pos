import type { Service } from "@/lib/services";

export const LAUNDRY_SERVICES: Service[] = [
  // Wash & Fold
  { id: "lau_wf_small", name: "Wash & Fold Small", priceCents: 1500, durationMinutes: 0, category: "wash_fold" },
  { id: "lau_wf_medium", name: "Wash & Fold Medium", priceCents: 2500, durationMinutes: 0, category: "wash_fold" },
  { id: "lau_wf_large", name: "Wash & Fold Large", priceCents: 4000, durationMinutes: 0, category: "wash_fold" },
  // Dry Clean
  { id: "lau_dc_shirt", name: "Dry Clean Shirt", priceCents: 700, durationMinutes: 0, category: "dry_clean" },
  { id: "lau_dc_suit", name: "Dry Clean Suit", priceCents: 2500, durationMinutes: 0, category: "dry_clean" },
  // Specialty
  { id: "lau_comforter", name: "Comforter", priceCents: 3000, durationMinutes: 0, category: "specialty" },
  { id: "lau_wedding_gown", name: "Wedding Gown", priceCents: 12000, durationMinutes: 0, category: "specialty" },
  { id: "lau_iron_only", name: "Iron-Only", priceCents: 500, durationMinutes: 0, category: "specialty" },
  // Add-Ons
  { id: "lau_rush", name: "Same-Day Rush", priceCents: 1000, durationMinutes: 0, category: "add_ons" },
  { id: "lau_hypo_detergent", name: "Hypoallergenic Detergent", priceCents: 300, durationMinutes: 0, category: "add_ons" },
  { id: "lau_garment_bags", name: "Plastic Garment Bags", priceCents: 200, durationMinutes: 0, category: "add_ons" },
  { id: "lau_stain_treatment", name: "Stain Treatment", priceCents: 500, durationMinutes: 0, category: "add_ons" },
];

export const LAUNDRY_CATEGORY_COLORS: Record<string, string> = {
  wash_fold: "#DBEAFE",
  dry_clean: "#BAE6FD",
  specialty: "#EDE9FE",
  add_ons: "#FEF3C7",
};

export const LAUNDRY_MODIFIERS_BY_SERVICE: Record<string, never[]> = {};
