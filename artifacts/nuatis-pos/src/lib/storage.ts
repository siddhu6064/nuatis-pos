export const cartKey = (verticalId: string): string =>
  `nuatis-pos:${verticalId}:cart`;

export const transactionsKey = (verticalId: string): string =>
  `nuatis-pos:${verticalId}:transactions`;

export const heldTicketsKey = (verticalId: string): string =>
  `nuatis-pos:${verticalId}:heldTickets`;

export const settingsKey = (verticalId: string): string =>
  `nuatis-pos:${verticalId}:settings`;

export const waitlistKey = (verticalId: string): string =>
  `nuatis-pos:${verticalId}:waitlist`;

export const ACTIVE_STAFF_KEY = "nuatis-pos:activeStaffId";
export const ACTIVE_VERTICAL_KEY = "nuatis-pos:activeVerticalId";

// Legacy (pre-vertical) keys
const LEGACY_CART_KEY = "nuatis-pos:cart";
const LEGACY_TX_KEY = "nuatis-pos:transactions";
const LEGACY_HELD_KEY = "nuatis-pos:heldTickets";

/**
 * One-time migration: moves pre-vertical localStorage keys into the
 * salon-namespaced equivalents, then deletes the legacy keys.
 * Idempotent — safe to call on every app boot.
 */
export function runMigrations(): void {
  try {
    const pairs: Array<[string, string]> = [
      [LEGACY_CART_KEY, cartKey("salon")],
      [LEGACY_TX_KEY, transactionsKey("salon")],
      [LEGACY_HELD_KEY, heldTicketsKey("salon")],
    ];
    for (const [oldKey, newKey] of pairs) {
      const oldValue = localStorage.getItem(oldKey);
      if (oldValue !== null) {
        // Only copy if the new key doesn't already exist
        if (localStorage.getItem(newKey) === null) {
          localStorage.setItem(newKey, oldValue);
        }
        localStorage.removeItem(oldKey);
      }
    }
  } catch (e) {
    console.error("[nuatis-pos] Migration error:", e);
  }
}
