// ─── Kitting mock data ────────────────────────────────────────────────────────
// Shared by the Kit Mapping and Kit Order screens. Frontend-only demo data.

export interface ChildSku {
  sku: string;
  name: string;
  /** Free-to-use inventory available for kitting (after existing blocks). */
  available: number;
  /** Units per pack (case/inner-pack quantity). */
  packSize: number;
}

/** Child component SKUs (must exist in the SKU master as distinct listings). */
export const CHILD_SKUS: ChildSku[] = [
  { sku: "600179", name: "boAt Airdopes 141 TWS Earbuds", available: 240, packSize: 10 },
  { sku: "600822", name: "boAt Rockerz 450 Bluetooth Headphones", available: 85, packSize: 6 },
  { sku: "600868", name: "boAt Bassheads 100 Wired Earphones", available: 120, packSize: 12 },
  { sku: "600900", name: "boAt Stone 350 Bluetooth Speaker", available: 64, packSize: 4 },
  { sku: "601000", name: "boAt Wave Call Smartwatch", available: 40, packSize: 5 },
  { sku: "601002", name: "boAt Type-C 500 Charging Cable", available: 300, packSize: 20 },
  { sku: "601005", name: "boAt Aavante Bar 1160 Soundbar", available: 25, packSize: 2 },
];

export const childBySku = (sku: string): ChildSku | undefined =>
  CHILD_SKUS.find((c) => c.sku === sku);

export interface KitSkuMasterEntry {
  sku: string;
  name: string;
}

/**
 * Kit (mother) SKUs as they exist in the SKU master — distinct listings from
 * their child SKUs. Includes kits that are not yet mapped, so the mapping
 * screen can search and pick any kit SKU from the master.
 */
export const KIT_SKU_MASTER: KitSkuMasterEntry[] = [
  { sku: "700001", name: "boAt Audio Starter Combo" },
  { sku: "700002", name: "boAt Festive Gift Bundle" },
  { sku: "700003", name: "boAt Party Speaker Kit" },
  { sku: "700004", name: "boAt Travel Essentials Combo" },
  { sku: "700005", name: "boAt Work-From-Home Bundle" },
  { sku: "700006", name: "boAt Fitness Combo Pack" },
  { sku: "700007", name: "boAt Premium Gifting Kit" },
];

export const kitMasterBySku = (sku: string): KitSkuMasterEntry | undefined =>
  KIT_SKU_MASTER.find((k) => k.sku === sku);

export interface KitComponent {
  sku: string;
  name: string;
  /** Quantity of this child needed to build ONE unit of the kit. */
  qty: number;
}

export interface KitMapping {
  /** Mother / parent Kit SKU — distinct from its child SKUs. */
  kitSku: string;
  kitName: string;
  components: KitComponent[];
  updatedAt: string;
}

/** Master kit mappings (BOM-like structure). */
export const KIT_MAPPINGS: KitMapping[] = [
  {
    kitSku: "700001",
    kitName: "boAt Audio Starter Combo",
    components: [
      { sku: "600179", name: "boAt Airdopes 141 TWS Earbuds", qty: 1 },
      { sku: "601002", name: "boAt Type-C 500 Charging Cable", qty: 1 },
    ],
    updatedAt: "09/06/2026",
  },
  {
    kitSku: "700002",
    kitName: "boAt Festive Gift Bundle",
    components: [
      { sku: "600822", name: "boAt Rockerz 450 Bluetooth Headphones", qty: 1 },
      { sku: "600868", name: "boAt Bassheads 100 Wired Earphones", qty: 2 },
      { sku: "601002", name: "boAt Type-C 500 Charging Cable", qty: 3 },
    ],
    updatedAt: "08/06/2026",
  },
  {
    kitSku: "700003",
    kitName: "boAt Party Speaker Kit",
    components: [
      { sku: "600900", name: "boAt Stone 350 Bluetooth Speaker", qty: 2 },
      { sku: "601005", name: "boAt Aavante Bar 1160 Soundbar", qty: 1 },
    ],
    updatedAt: "05/06/2026",
  },
];

/**
 * Kit availability is derived from component stock — the kit holds no
 * independent inventory. It equals the smallest number of complete kits the
 * available child quantities can build.
 */
export const kitBuildableQty = (mapping: KitMapping): number =>
  mapping.components.reduce((min, comp) => {
    const avail = childBySku(comp.sku)?.available ?? 0;
    return Math.min(min, Math.floor(avail / comp.qty));
  }, Infinity) || 0;

/**
 * Finished kit SKU stock currently on-hand (built earlier and put away).
 * Used to validate de-kitting orders, which block kit-SKU quantity.
 */
const KIT_ONHAND: Record<string, number> = {
  "700001": 30,
  "700002": 12,
  "700003": 8,
};

export const kitOnHand = (sku: string): number => KIT_ONHAND[sku] ?? 0;

export type KitOrderType = "Kit" | "De-kit";

export type KitOrderStatus =
  | "Open"
  | "Picked"
  | "Kitting Done"
  | "Putaway Done";

export interface KitOrderRow {
  id: string;
  type: KitOrderType;
  kitSku: string;
  kitName: string;
  kitQty: number;
  status: KitOrderStatus;
  createdAt: string;
}

/** Pre-existing kit (assembly) and de-kit orders. */
export const KIT_ORDERS: KitOrderRow[] = [
  {
    id: "DKT-1007",
    type: "De-kit",
    kitSku: "700003",
    kitName: "boAt Party Speaker Kit",
    kitQty: 4,
    status: "Picked",
    createdAt: "09/06/2026 12:05",
  },
  {
    id: "KIT-2042",
    type: "Kit",
    kitSku: "700001",
    kitName: "boAt Audio Starter Combo",
    kitQty: 8,
    status: "Picked",
    createdAt: "09/06/2026 13:10",
  },
  {
    id: "KIT-2041",
    type: "Kit",
    kitSku: "700002",
    kitName: "boAt Festive Gift Bundle",
    kitQty: 10,
    status: "Picked",
    createdAt: "09/06/2026 11:20",
  },
  {
    id: "KIT-2040",
    type: "Kit",
    kitSku: "700001",
    kitName: "boAt Audio Starter Combo",
    kitQty: 25,
    status: "Kitting Done",
    createdAt: "09/06/2026 09:05",
  },
  {
    id: "KIT-2039",
    type: "Kit",
    kitSku: "700003",
    kitName: "boAt Party Speaker Kit",
    kitQty: 5,
    status: "Putaway Done",
    createdAt: "08/06/2026 16:42",
  },
];
