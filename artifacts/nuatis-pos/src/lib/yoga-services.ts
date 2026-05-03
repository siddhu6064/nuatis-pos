import type { Service } from "@/lib/services";

export const YOGA_SERVICES: Service[] = [
  { id: "yoga_vinyasa", name: "Vinyasa Flow", priceCents: 2500, durationMinutes: 60, category: "classes", isClass: true },
  { id: "yoga_power", name: "Power Yoga", priceCents: 2500, durationMinutes: 60, category: "classes", isClass: true },
  { id: "yoga_yin", name: "Yin Yoga", priceCents: 2000, durationMinutes: 75, category: "classes", isClass: true },
  { id: "yoga_restorative", name: "Restorative", priceCents: 2000, durationMinutes: 75, category: "classes", isClass: true },
  { id: "yoga_hot", name: "Hot Yoga", priceCents: 3000, durationMinutes: 60, category: "classes", isClass: true },
  { id: "yoga_aerial", name: "Aerial Yoga", priceCents: 3500, durationMinutes: 60, category: "classes", isClass: true },
  { id: "yoga_acro", name: "Acro Yoga", priceCents: 4000, durationMinutes: 60, category: "classes", isClass: true },
  { id: "yoga_beginner", name: "Beginner Flow", priceCents: 2000, durationMinutes: 60, category: "classes", isClass: true },
  { id: "yoga_workshop", name: "Workshop 2hr", priceCents: 5000, durationMinutes: 120, category: "classes", isClass: true },
  { id: "yoga_private", name: "Private Session 60min", priceCents: 9000, durationMinutes: 60, category: "extras" },
  { id: "yoga_mat_rental", name: "Mat Rental", priceCents: 300, durationMinutes: 0, category: "extras" },
  { id: "yoga_towel_rental", name: "Towel Rental", priceCents: 200, durationMinutes: 0, category: "extras" },
];

export const YOGA_CATEGORY_COLORS: Record<string, string> = {
  classes: "#D1EDD4",
  extras: "#FEF9C3",
};

export const YOGA_MODIFIERS_BY_SERVICE: Record<string, never[]> = {};
