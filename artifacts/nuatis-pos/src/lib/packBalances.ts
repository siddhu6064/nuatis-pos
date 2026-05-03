const STORAGE_VERSION = "v1";

function packKey(verticalId: string): string {
  return `nuatis-pos:${STORAGE_VERSION}:${verticalId}:customerPacks`;
}

export interface PackBalance {
  id: string;
  packServiceId: string;
  packServiceName: string;
  validForServiceIds: string[];
  sessionsRemaining: number;
  sessionsTotal: number;
  amortizedCents: number;
  purchasedAt: number;
  transactionId: string;
  expiresAt?: number;
}

function loadAll(verticalId: string): Record<string, Record<string, PackBalance>> {
  try {
    const raw = localStorage.getItem(packKey(verticalId));
    return raw ? (JSON.parse(raw) as Record<string, Record<string, PackBalance>>) : {};
  } catch {
    return {};
  }
}

function saveAll(verticalId: string, all: Record<string, Record<string, PackBalance>>): void {
  try {
    localStorage.setItem(packKey(verticalId), JSON.stringify(all));
  } catch {
  }
}

export function getPacksForCustomer(
  verticalId: string,
  customerId: string,
): Record<string, PackBalance> {
  return loadAll(verticalId)[customerId] ?? {};
}

export function getApplicablePacks(
  verticalId: string,
  customerId: string,
  serviceId: string,
): PackBalance[] {
  const packs = getPacksForCustomer(verticalId, customerId);
  return Object.values(packs).filter(
    (p) => p.sessionsRemaining > 0 && p.validForServiceIds.includes(serviceId),
  );
}

export function writePackBalance(
  verticalId: string,
  customerId: string,
  pack: PackBalance,
): void {
  const all = loadAll(verticalId);
  all[customerId] = { ...(all[customerId] ?? {}), [pack.id]: pack };
  saveAll(verticalId, all);
}

export function decrementPackBalance(
  verticalId: string,
  customerId: string,
  packId: string,
): PackBalance | null {
  const all = loadAll(verticalId);
  const packs = all[customerId];
  if (!packs || !packs[packId]) return null;
  const pack = packs[packId];
  if (pack.sessionsRemaining <= 0) return null;
  const updated: PackBalance = { ...pack, sessionsRemaining: pack.sessionsRemaining - 1 };
  all[customerId] = { ...packs, [packId]: updated };
  saveAll(verticalId, all);
  return updated;
}

export function incrementPackBalance(
  verticalId: string,
  customerId: string,
  packId: string,
): PackBalance | null {
  const all = loadAll(verticalId);
  const packs = all[customerId];
  if (!packs || !packs[packId]) return null;
  const pack = packs[packId];
  const updated: PackBalance = {
    ...pack,
    sessionsRemaining: Math.min(pack.sessionsTotal, pack.sessionsRemaining + 1),
  };
  all[customerId] = { ...packs, [packId]: updated };
  saveAll(verticalId, all);
  return updated;
}
