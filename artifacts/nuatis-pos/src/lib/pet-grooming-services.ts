import type { Service } from "@/lib/services";
import type { Modifier } from "@/lib/modifiers";

/**
 * 12 pet grooming services with explicit vaccination requirements.
 * requiresVaccinations: [] = no requirement (curbside / minimally-handled).
 * requiresVaccinations: ['rabies'] = close-contact services.
 * requiresVaccinations: ['rabies', 'bordetella'] = heavy-bath / boarding-adjacent.
 */
export const PET_GROOMING_SERVICES: Service[] = [
  // Quick / curbside — no vaccination required (pet stays leashed, minimal handling)
  { id: "pg_nail_trim",    name: "Nail Trim",            priceCents: 2500,  durationMinutes: 15, category: "quick_services", requiresVaccinations: [] },
  { id: "pg_teeth_brush",  name: "Teeth Brushing",        priceCents: 2000,  durationMinutes: 15, category: "quick_services", requiresVaccinations: [] },

  // Bathing — rabies required
  { id: "pg_bath_sm",      name: "Bath & Brush (Small)",  priceCents: 4500,  durationMinutes: 45, category: "bathing",        requiresVaccinations: ["rabies"] },
  { id: "pg_bath_lg",      name: "Bath & Brush (Large)",  priceCents: 6500,  durationMinutes: 60, category: "bathing",        requiresVaccinations: ["rabies"] },
  { id: "pg_puppy_bath",   name: "Puppy Bath & Brush",    priceCents: 5500,  durationMinutes: 45, category: "bathing",        requiresVaccinations: ["rabies"] },

  // Grooming — rabies required
  { id: "pg_groom_sm",     name: "Full Groom (Small)",    priceCents: 7500,  durationMinutes: 75, category: "grooming",       requiresVaccinations: ["rabies"] },

  // Spa — rabies required
  { id: "pg_blueberry",    name: "Blueberry Facial",      priceCents: 3500,  durationMinutes: 30, category: "spa",            requiresVaccinations: ["rabies"] },
  { id: "pg_ear_clean",    name: "Ear Cleaning",          priceCents: 2500,  durationMinutes: 20, category: "spa",            requiresVaccinations: ["rabies"] },
  { id: "pg_paw_treat",    name: "Paw Treatment",         priceCents: 3000,  durationMinutes: 20, category: "spa",            requiresVaccinations: ["rabies"] },

  // Heavy / boarding-adjacent — rabies + bordetella required
  { id: "pg_groom_lg",     name: "Full Groom (Large)",    priceCents: 9500,  durationMinutes: 90, category: "grooming",       requiresVaccinations: ["rabies", "bordetella"] },
  { id: "pg_deshed",       name: "De-Shed Treatment",     priceCents: 8500,  durationMinutes: 75, category: "grooming",       requiresVaccinations: ["rabies", "bordetella"] },
  { id: "pg_heavy_bath",   name: "Heavy Bath & Blowout",  priceCents: 12000, durationMinutes: 90, category: "bathing",        requiresVaccinations: ["rabies", "bordetella"] },
];

export const PET_GROOMING_MODIFIERS_BY_SERVICE: Record<string, Modifier[]> = {
  pg_groom_sm: [
    { id: "pg_addon_nail_sm",      name: "Extra Nail Trim",        priceCents: 1000 },
  ],
  pg_groom_lg: [
    { id: "pg_addon_nail_lg",      name: "Extra Nail Trim",        priceCents: 1000 },
    { id: "pg_addon_blueberry_lg", name: "Blueberry Facial Add-on",priceCents: 1500 },
  ],
  pg_deshed: [
    { id: "pg_addon_conditioning", name: "Conditioning Treatment", priceCents: 2000 },
  ],
  pg_heavy_bath: [
    { id: "pg_addon_dematting",    name: "Dematting",              priceCents: 2500 },
  ],
};

// Green / teal palette — distinct from all existing verticals:
// Salon:   pink/amber/purple/orange
// Spa:     emerald-200/rose/amber/sky
// Nail Bar: softer-pink/violet/rose/lemon
// Tattoo:  gray/red/slate/cyan/indigo
export const PET_GROOMING_CATEGORY_COLORS: Record<string, string> = {
  quick_services: "#F0FDF4",  // green-50  (very light — low-risk category)
  bathing:        "#CFFAFE",  // cyan-100
  grooming:       "#D1FAE5",  // emerald-100
  spa:            "#E0F2F1",  // custom teal-50
};
