import type { Service } from "@/lib/services";
import type { Modifier } from "@/lib/modifiers";

export const PHOTOGRAPHY_SERVICES: Service[] = [
  // Project-eligible packages (isProject: true)
  { id: "photo_wedding", name: "Wedding Photography Package", priceCents: 300000, durationMinutes: 480, category: "packages", isProject: true },
  { id: "photo_engagement", name: "Engagement Shoot", priceCents: 50000, durationMinutes: 120, category: "packages", isProject: true },
  { id: "photo_portrait", name: "Portrait Session", priceCents: 30000, durationMinutes: 90, category: "packages", isProject: true },
  { id: "photo_event", name: "Event Photography", priceCents: 80000, durationMinutes: 240, category: "packages", isProject: true },
  // Non-project products
  { id: "photo_album", name: "Photo Album", priceCents: 40000, durationMinutes: 0, category: "products" },
  { id: "photo_prints", name: "Prints (per pack)", priceCents: 2500, durationMinutes: 0, category: "products" },
  { id: "photo_digital_gallery", name: "Digital Gallery Access", priceCents: 15000, durationMinutes: 0, category: "products" },
  // Non-project add-on services
  { id: "photo_rush_editing", name: "Rush Editing", priceCents: 20000, durationMinutes: 0, category: "addons" },
  { id: "photo_travel_fee", name: "Travel Fee", priceCents: 15000, durationMinutes: 0, category: "addons" },
  { id: "photo_second_photographer", name: "Second Photographer Add-On", priceCents: 40000, durationMinutes: 0, category: "addons" },
  { id: "photo_drone", name: "Drone Coverage", priceCents: 30000, durationMinutes: 0, category: "addons" },
  { id: "photo_raw_files", name: "Raw Files Release", priceCents: 25000, durationMinutes: 0, category: "addons" },
];

export const PHOTOGRAPHY_CATEGORY_COLORS: Record<string, string> = {
  packages: "#F5ECD7",
  products: "#EDE3D0",
  addons:   "#E8D5B7",
};

export const PHOTOGRAPHY_MODIFIERS_BY_SERVICE: Record<string, Modifier[]> = {};
