import type { Service } from "@/lib/services";
import type { Modifier } from "@/lib/modifiers";

export const TATTOO_SERVICES: Service[] = [
  { id: "tattoo_consultation",  name: "Consultation",                    priceCents: 5000,  durationMinutes: 30,  category: "consultation" },
  { id: "tattoo_small",         name: "Small Tattoo (< 2\")",            priceCents: 15000, durationMinutes: 60,  category: "line_work"    },
  { id: "tattoo_medium",        name: "Medium Tattoo (3–5\")",           priceCents: 30000, durationMinutes: 120, category: "line_work"    },
  { id: "tattoo_large",         name: "Large Tattoo (6–8\")",            priceCents: 50000, durationMinutes: 180, category: "line_work"    },
  { id: "tattoo_xl",            name: "Extra-Large / Sleeve Section",    priceCents: 80000, durationMinutes: 300, category: "line_work"    },
  { id: "tattoo_shading_sm",    name: "Black & Grey Shading (Small)",    priceCents: 20000, durationMinutes: 90,  category: "shading"      },
  { id: "tattoo_shading_lg",    name: "Black & Grey Shading (Large)",    priceCents: 40000, durationMinutes: 180, category: "shading"      },
  { id: "tattoo_color_sm",      name: "Color Fill (Small)",              priceCents: 25000, durationMinutes: 90,  category: "color_fill"   },
  { id: "tattoo_color_lg",      name: "Color Fill (Large)",              priceCents: 45000, durationMinutes: 180, category: "color_fill"   },
  { id: "tattoo_coverup",       name: "Cover-Up",                        priceCents: 40000, durationMinutes: 180, category: "specialty"    },
  { id: "tattoo_fine_line",     name: "Fine Line",                       priceCents: 18000, durationMinutes: 90,  category: "specialty"    },
  { id: "tattoo_touch_up",      name: "Touch-Up",                        priceCents: 10000, durationMinutes: 45,  category: "specialty"    },
];

export const TATTOO_MODIFIERS_BY_SERVICE: Record<string, Modifier[]> = {
  tattoo_medium: [
    { id: "tattoo_addon_detail",    name: "Extra Detail Work", priceCents: 5000 },
  ],
  tattoo_large: [
    { id: "tattoo_addon_detail_lg", name: "Extra Detail Work", priceCents: 8000 },
    { id: "tattoo_addon_color",     name: "Add Color",         priceCents: 10000 },
  ],
  tattoo_xl: [
    { id: "tattoo_addon_color_xl",  name: "Add Color",         priceCents: 15000 },
  ],
  tattoo_shading_lg: [
    { id: "tattoo_addon_blend",     name: "Extended Blending", priceCents: 5000 },
  ],
};

// Distinct from salon/spa/nail_bar palettes
export const TATTOO_CATEGORY_COLORS: Record<string, string> = {
  consultation: "#E5E7EB",  // neutral gray
  line_work:    "#FCA5A5",  // red-300
  shading:      "#CBD5E1",  // slate-300
  color_fill:   "#67E8F9",  // cyan-300
  specialty:    "#A5B4FC",  // indigo-300
};
