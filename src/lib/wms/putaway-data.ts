// Demo data for the GRN-bin putaway flow. A GRN bin holds the good (accepted)
// stock consolidated during GRN; putaway moves it into a storage zone chosen by
// the dominant item category. Deterministic so the demo is repeatable.

export type Category = "Apparel" | "Electronics" | "Beauty" | "Home";

export interface PutawayItem {
  sku: string;
  name: string;
  category: Category;
  qty: number;
  image: string;
}

export interface GrnBin {
  id: string;
  seller: string;
  items: PutawayItem[];
  totalQty: number;
  category: Category; // dominant category → drives the zone suggestion
  zone: string; // e.g. "Zone A"
  aisle: string; // e.g. "Aisle 3"
  zoneLabel: string; // e.g. "Zone A · Apparel"
  location: string; // suggested storage address, e.g. "A-03-12"
  storageBin: string; // suggested destination bin for item-level putaway
}

const img = (seed: string) => `https://picsum.photos/seed/${seed}/400/400`;

const hash = (s: string) => {
  let h = 0;
  const v = s.trim().toUpperCase();
  for (let i = 0; i < v.length; i++) h = (h * 31 + v.charCodeAt(i)) | 0;
  return Math.abs(h);
};

// Each category maps to a storage zone. Mirrors how a real WMS slots stock by
// product family so pickers walk the shortest path later.
const CATEGORY_ZONE: Record<
  Category,
  { zone: string; aisle: string; prefix: string }
> = {
  Apparel: { zone: "Zone A", aisle: "Aisle 1", prefix: "A" },
  Beauty: { zone: "Zone B", aisle: "Aisle 2", prefix: "B" },
  Home: { zone: "Zone C", aisle: "Aisle 4", prefix: "C" },
  Electronics: { zone: "Zone D", aisle: "Aisle 3", prefix: "D" },
};

// Raw bin definitions — seller + items. The zone/location fields are derived
// below so they always stay consistent with the dominant category.
const RAW_BINS: {
  id: string;
  seller: string;
  rack: string;
  items: Omit<PutawayItem, "image">[];
}[] = [
  {
    id: "GRN-BIN-4471",
    seller: "Northwind Apparel",
    rack: "03-12",
    items: [
      { sku: "AP-TEE-CRW", name: "Cotton Crew Tee", category: "Apparel", qty: 4 },
      { sku: "AP-HOD-ZIP", name: "Zip Hoodie - Charcoal", category: "Apparel", qty: 2 },
      { sku: "AP-JEA-SLM", name: "Slim Fit Jeans", category: "Apparel", qty: 3 },
    ],
  },
  {
    id: "GRN-BIN-4472",
    seller: "Acme Electronics",
    rack: "07-04",
    items: [
      { sku: "EL-BUD-PRO", name: "Wireless Earbuds Pro", category: "Electronics", qty: 3 },
      { sku: "EL-CHG-65W", name: "65W GaN Charger", category: "Electronics", qty: 2 },
    ],
  },
  {
    id: "GRN-BIN-4473",
    seller: "Verde Beauty",
    rack: "02-08",
    items: [
      { sku: "BT-SER-30", name: "Vitamin C Serum 30ml", category: "Beauty", qty: 5 },
      { sku: "BT-CRM-50", name: "Hydrating Cream 50ml", category: "Beauty", qty: 2 },
    ],
  },
  {
    id: "GRN-BIN-4474",
    seller: "Loom & Linen",
    rack: "05-01",
    items: [
      { sku: "HM-COOK-5P", name: "Stainless Cookware Set (5pc)", category: "Home", qty: 2 },
      { sku: "HM-TWL-BAT", name: "Cotton Bath Towel", category: "Home", qty: 4 },
    ],
  },
  {
    id: "GRN-BIN-4475",
    seller: "Acme Electronics",
    rack: "07-09",
    items: [
      { sku: "EL-BULB-4P", name: "LED Smart Bulbs (4-pack)", category: "Electronics", qty: 3 },
      { sku: "EL-LAP-14", name: 'Pro 14" Laptop - Space Grey', category: "Electronics", qty: 1 },
    ],
  },
];

// Dominant category = the one with the most units in the bin.
const dominantCategory = (items: Omit<PutawayItem, "image">[]): Category => {
  const totals = new Map<Category, number>();
  for (const it of items)
    totals.set(it.category, (totals.get(it.category) ?? 0) + it.qty);
  return [...totals.entries()].sort((a, b) => b[1] - a[1])[0][0];
};

const buildBin = (raw: (typeof RAW_BINS)[number]): GrnBin => {
  const category = dominantCategory(raw.items);
  const z = CATEGORY_ZONE[category];
  const items: PutawayItem[] = raw.items.map((it) => ({
    ...it,
    image: img(`putaway-${it.sku}`),
  }));
  const binNo = raw.id.slice(-2);
  return {
    id: raw.id,
    seller: raw.seller,
    items,
    totalQty: items.reduce((s, it) => s + it.qty, 0),
    category,
    zone: z.zone,
    aisle: z.aisle,
    zoneLabel: `${z.zone} · ${category}`,
    location: `${z.prefix}-${raw.rack}`,
    storageBin: `${z.prefix}-BIN-${binNo}`,
  };
};

export const PUTAWAY_BINS: GrnBin[] = RAW_BINS.map(buildBin);

export const getPutawayBin = (id: string): GrnBin | undefined =>
  PUTAWAY_BINS.find((b) => b.id === id.trim().toUpperCase());

// For self-assignment the operator scans GRN bins directly — there is no
// worklist. Any scanned code resolves to a bin: known demo bins keep their
// curated contents, anything else is synthesised deterministically so the demo
// still works when a presenter scans an arbitrary box.
const SYN_SELLERS = [
  "Northwind Apparel",
  "Acme Electronics",
  "Verde Beauty",
  "Loom & Linen",
  "Meadow Home",
];

const SYN_CATALOG: Omit<PutawayItem, "qty" | "image">[] = [
  { sku: "AP-TEE-CRW", name: "Cotton Crew Tee", category: "Apparel" },
  { sku: "AP-HOD-ZIP", name: "Zip Hoodie - Charcoal", category: "Apparel" },
  { sku: "EL-BUD-PRO", name: "Wireless Earbuds Pro", category: "Electronics" },
  { sku: "EL-BULB-4P", name: "LED Smart Bulbs (4-pack)", category: "Electronics" },
  { sku: "BT-SER-30", name: "Vitamin C Serum 30ml", category: "Beauty" },
  { sku: "BT-CRM-50", name: "Hydrating Cream 50ml", category: "Beauty" },
  { sku: "HM-TWL-BAT", name: "Cotton Bath Towel", category: "Home" },
  { sku: "HM-COOK-5P", name: "Stainless Cookware Set (5pc)", category: "Home" },
];

export const resolvePutawayBin = (code: string): GrnBin => {
  const key = code.trim().toUpperCase();
  const known = PUTAWAY_BINS.find((b) => b.id === key);
  if (known) return known;

  const h = hash(key);
  const seller = SYN_SELLERS[h % SYN_SELLERS.length];
  const n = 2 + (h % 2); // 2–3 distinct SKUs
  const items: Omit<PutawayItem, "image">[] = [];
  for (let i = 0; i < n; i++) {
    const base = SYN_CATALOG[(h + i * 3) % SYN_CATALOG.length];
    if (items.some((it) => it.sku === base.sku)) continue;
    items.push({ ...base, qty: 1 + (hash(key + base.sku) % 4) });
  }
  const rack = `${String((h % 12) + 1).padStart(2, "0")}-${String(
    ((h >> 3) % 20) + 1,
  ).padStart(2, "0")}`;
  return buildBin({ id: key, seller, rack, items });
};
