export interface Modifier {
  id: string;
  name: string;
  priceCents: number;
}

export const MODIFIERS_BY_SERVICE: Record<string, Modifier[]> = {
  "womens-cut": [{ id: "wash_style", name: "Wash & Style", priceCents: 1500 }],
  "mens-cut": [
    { id: "beard_addon", name: "Beard Trim Add-on", priceCents: 1500 },
  ],
  "highlights-full": [
    { id: "olaplex", name: "Olaplex Add-on", priceCents: 2500 },
    { id: "toner", name: "Toner", priceCents: 1500 },
  ],
  "color-root": [
    { id: "olaplex", name: "Olaplex Add-on", priceCents: 2500 },
    { id: "long_hair", name: "Long Hair", priceCents: 2000 },
  ],
  gloss: [{ id: "olaplex", name: "Olaplex Add-on", priceCents: 2500 }],
};

export function getModifiersForService(serviceId: string): Modifier[] {
  return MODIFIERS_BY_SERVICE[serviceId] ?? [];
}
