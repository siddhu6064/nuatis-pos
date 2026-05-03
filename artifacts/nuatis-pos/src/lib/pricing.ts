import type { Service, SessionPricingMinute, SessionPricingTier } from "@/lib/services";

/**
 * Compute the final price for a service line.
 *
 * - Fixed-price service (no `pricing` field): returns `priceCents`.
 * - Session-based + `sessionElapsedMs` undefined: active session, returns 0.
 * - Session-based + `sessionElapsedMs` defined, 'minute' rounding:
 *     Math.ceil(elapsedMs / 60000) minutes, clamped to [minMinutes, maxMinutes],
 *     multiplied by perMinuteCents.
 * - Session-based + 'tier' rounding:
 *     finds smallest tier with upToMinutes ≥ Math.ceil(elapsedMs / 60000);
 *     if elapsed exceeds all tiers, caps at the largest tier's price.
 * - Defensive: missing config fields → returns 0.
 */
export function getServiceFinalPriceCents(
  service: Pick<Service, "pricing" | "priceCents">,
  sessionElapsedMs?: number,
): number {
  if (!service.pricing) {
    // Fixed-price service
    return service.priceCents;
  }

  if (sessionElapsedMs === undefined) {
    // Active session — price not yet computed
    return 0;
  }

  const elapsedMs = Math.max(0, sessionElapsedMs);
  const elapsedMinutes = Math.ceil(elapsedMs / 60000); // round up partial minutes

  const pricing = service.pricing;

  if (pricing.roundingMode === "minute") {
    const mp = pricing as SessionPricingMinute;
    if (!mp.perMinuteCents) return 0;
    const min = mp.minMinutes ?? 1;
    const max = mp.maxMinutes ?? 30;
    const clamped = Math.max(min, Math.min(max, elapsedMinutes));
    return clamped * mp.perMinuteCents;
  }

  // tier
  const tp = pricing as SessionPricingTier;
  const tiers = tp.tiers;
  if (!tiers || tiers.length === 0) return 0;

  const effectiveMinutes = Math.max(1, elapsedMinutes);
  const matched = tiers.find((t) => t.upToMinutes >= effectiveMinutes);
  if (matched) return matched.priceCents;

  // Exceeds all tiers — cap at largest
  return tiers[tiers.length - 1].priceCents;
}

/** Format elapsed milliseconds as "Xm Ys" string. Clamps to >= 0. */
export function formatElapsed(elapsedMs: number): string {
  const ms = Math.max(0, elapsedMs);
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

/** Compute elapsed minutes (ceiling) from ms. Clamps to >= 0. */
export function elapsedMinutes(elapsedMs: number): number {
  return Math.ceil(Math.max(0, elapsedMs) / 60000);
}
