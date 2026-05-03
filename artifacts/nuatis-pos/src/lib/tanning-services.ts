import type { Service } from "@/lib/services";

// ── 8 session-based booth/treatment services ───────────────────────────────
// UV Level 1–4: per-minute, 'minute' rounding (Math.ceil partial minute)
// Spray Tan Express, Premium: tier-based pricing
// Red Light Therapy, Hybrid Bed: per-minute

export const TANNING_SERVICES: Service[] = [
  // ── UV Beds (per-minute, 'minute' rounding) ────────────────────────────
  {
    id: "tan_uv1",
    name: "UV Level 1",
    priceCents: 0,
    durationMinutes: 30,
    category: "uv_beds",
    pricing: {
      type: "session",
      roundingMode: "minute",
      perMinuteCents: 60,
      minMinutes: 1,
      maxMinutes: 30,
    },
  },
  {
    id: "tan_uv2",
    name: "UV Level 2",
    priceCents: 0,
    durationMinutes: 30,
    category: "uv_beds",
    pricing: {
      type: "session",
      roundingMode: "minute",
      perMinuteCents: 100,
      minMinutes: 1,
      maxMinutes: 30,
    },
  },
  {
    id: "tan_uv3",
    name: "UV Level 3",
    priceCents: 0,
    durationMinutes: 30,
    category: "uv_beds",
    pricing: {
      type: "session",
      roundingMode: "minute",
      perMinuteCents: 150,
      minMinutes: 1,
      maxMinutes: 30,
    },
  },
  {
    id: "tan_uv4",
    name: "UV Level 4",
    priceCents: 0,
    durationMinutes: 30,
    category: "uv_beds",
    pricing: {
      type: "session",
      roundingMode: "minute",
      perMinuteCents: 200,
      minMinutes: 1,
      maxMinutes: 30,
    },
  },

  // ── Spray Tan (tier-based) ─────────────────────────────────────────────
  {
    id: "tan_spray_express",
    name: "Spray Tan Express",
    priceCents: 0,
    durationMinutes: 20,
    category: "spray_tan",
    pricing: {
      type: "session",
      roundingMode: "tier",
      tiers: [
        { upToMinutes: 5, priceCents: 800 },   // ≤ 5 min  → $8
        { upToMinutes: 10, priceCents: 1500 },  // ≤ 10 min → $15
        { upToMinutes: 15, priceCents: 2000 },  // ≤ 15 min → $20
        { upToMinutes: 20, priceCents: 2500 },  // ≤ 20 min → $25
      ],
    },
  },
  {
    id: "tan_spray_premium",
    name: "Spray Tan Premium",
    priceCents: 0,
    durationMinutes: 30,
    category: "spray_tan",
    pricing: {
      type: "session",
      roundingMode: "tier",
      tiers: [
        { upToMinutes: 10, priceCents: 1800 },  // ≤ 10 min → $18
        { upToMinutes: 20, priceCents: 3000 },  // ≤ 20 min → $30
        { upToMinutes: 30, priceCents: 4000 },  // ≤ 30 min → $40
      ],
    },
  },

  // ── Specialty (per-minute, 'minute' rounding) ──────────────────────────
  {
    id: "tan_red_light",
    name: "Red Light Therapy",
    priceCents: 0,
    durationMinutes: 20,
    category: "therapy",
    pricing: {
      type: "session",
      roundingMode: "minute",
      perMinuteCents: 80,
      minMinutes: 5,
      maxMinutes: 20,
    },
  },
  {
    id: "tan_hybrid_bed",
    name: "Hybrid Bed",
    priceCents: 0,
    durationMinutes: 30,
    category: "therapy",
    pricing: {
      type: "session",
      roundingMode: "minute",
      perMinuteCents: 130,
      minMinutes: 5,
      maxMinutes: 30,
    },
  },

  // ── Fixed-price retail / membership ───────────────────────────────────
  { id: "tan_lotion",       name: "Lotion",              priceCents: 1500, durationMinutes: 0, category: "retail" },
  { id: "tan_eye_prot",     name: "Eye Protection",      priceCents: 300,  durationMinutes: 0, category: "retail" },
  { id: "tan_cleaning_kit", name: "Booth Cleaning Kit",  priceCents: 500,  durationMinutes: 0, category: "retail" },
  { id: "tan_membership",   name: "Membership Top-up",   priceCents: 4900, durationMinutes: 0, category: "retail" },
];

// Warm gold / bronze palette — distinct from all prior five verticals:
// Salon:    cuts #FBCFE8, color #FEF3C7, treatments #E9D5FF, styling #FED7AA
// Spa:      massages #A7F3D0, facials #FECDD3, body #FDE68A, wellness #BAE6FD
// Nail bar: manicures #FCE7F3, pedicures #DDD6FE, enhancements #FFE4E6, art #FEF9C3
// Tattoo:   ink colors (distinct set)
// Pet:      distinct greens/teals
// Tanning:  warm cream/amber/peach/gold — no hex reuse
export const TANNING_CATEGORY_COLORS: Record<string, string> = {
  uv_beds:   "#FFFBEB",  // lightest warm cream (distinct from salon color #FEF3C7)
  spray_tan: "#FED7AA",  // peach/bronze
  therapy:   "#FDE68A",  // golden yellow
  retail:    "#F3F4F6",  // neutral
};

export const TANNING_MODIFIERS_BY_SERVICE: Record<string, never[]> = {};
