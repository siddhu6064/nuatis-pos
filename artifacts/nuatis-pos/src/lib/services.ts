export type Category = "cuts" | "color" | "treatments" | "styling";

export interface Service {
  id: string;
  name: string;
  priceCents: number;
  durationMinutes: number;
  category: Category;
}

export const SERVICES: Service[] = [
  { id: "womens-cut", name: "Women's Cut", priceCents: 5500, durationMinutes: 45, category: "cuts" },
  { id: "mens-cut", name: "Men's Cut", priceCents: 3500, durationMinutes: 30, category: "cuts" },
  { id: "beard-trim", name: "Beard Trim", priceCents: 2000, durationMinutes: 15, category: "cuts" },
  { id: "kids-cut", name: "Kids Cut", priceCents: 2500, durationMinutes: 20, category: "cuts" },
  { id: "highlights-full", name: "Highlights Full", priceCents: 18500, durationMinutes: 120, category: "color" },
  { id: "color-root", name: "Color Root", priceCents: 9500, durationMinutes: 75, category: "color" },
  { id: "gloss", name: "Gloss", priceCents: 6500, durationMinutes: 45, category: "color" },
  { id: "olaplex", name: "Olaplex Treatment", priceCents: 4500, durationMinutes: 30, category: "treatments" },
  { id: "deep-conditioning", name: "Deep Conditioning", priceCents: 3500, durationMinutes: 25, category: "treatments" },
  { id: "wax", name: "Wax", priceCents: 3000, durationMinutes: 20, category: "treatments" },
  { id: "blowout", name: "Blowout", priceCents: 4500, durationMinutes: 30, category: "styling" },
  { id: "polish-change", name: "Polish Change", priceCents: 1500, durationMinutes: 15, category: "styling" },
];

export const CATEGORY_COLORS: Record<Category, string> = {
  cuts: "#FBCFE8",
  color: "#FEF3C7",
  treatments: "#E9D5FF",
  styling: "#FED7AA",
};

export function formatPrice(priceCents: number): string {
  return `$${(priceCents / 100).toFixed(0)}`;
}

export function formatDuration(minutes: number): string {
  return `${minutes} min`;
}
