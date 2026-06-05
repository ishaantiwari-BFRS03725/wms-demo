// Demo data + helpers for the inbound Gate Entry flow. Everything here is
// deterministic so the same seller / vehicle always produces the same demo
// outcome on screen.

const hash = (s: string) => {
  let h = 0;
  const v = s.trim().toUpperCase();
  for (let i = 0; i < v.length; i++) h = (h * 31 + v.charCodeAt(i)) | 0;
  return Math.abs(h);
};

// Activity a seller's consignment is registered against. Gate passes are cut
// per seller + activity, so this drives both the summary grouping and the
// generated passes.
export type ActivityType = "inward" | "returns" | "pickup";

export const ACTIVITY_META: Record<
  ActivityType,
  { label: string; tone: "blue" | "purple" | "amber" }
> = {
  inward: { label: "Inward", tone: "blue" },
  returns: { label: "Returns", tone: "purple" },
  pickup: { label: "Pickup", tone: "amber" },
};

export const ACTIVITY_TYPES = Object.keys(ACTIVITY_META) as ActivityType[];

// Community / marketplace programs. Sellers affiliated with one are flagged at
// the gate so dock assignment can prioritise clubbed consignments.
export const COMMUNITIES = ["Flipkart", "Amazon", "Meesho"] as const;
export type Community = (typeof COMMUNITIES)[number];

export const COMMUNITY_META: Record<
  Community,
  { dockZone: string; tone: "blue" | "amber" | "pink" }
> = {
  Flipkart: { dockZone: "FK", tone: "blue" },
  Amazon: { dockZone: "AZ", tone: "amber" },
  Meesho: { dockZone: "MS", tone: "pink" },
};

// Master seller directory the gate guard can search and add from.
export interface SellerRecord {
  id: string;
  name: string;
  warehouseId: string;
  skuCount: number;
  defaultActivity: ActivityType;
  asn: string;
  community?: Community;
}

export const SELLER_DIRECTORY: SellerRecord[] = [
  { id: "VEND-2024-081", name: "Global Electronics Ltd.", warehouseId: "WHS-0982-A", skuCount: 142, defaultActivity: "inward", asn: "ASN-2024-00981", community: "Amazon" },
  { id: "VEND-2024-114", name: "Apex Retail Group", warehouseId: "WHS-0441-C", skuCount: 89, defaultActivity: "inward", asn: "ASN-2024-01142", community: "Flipkart" },
  { id: "VEND-2024-002", name: "Skyline Traders", warehouseId: "WHS-0220-B", skuCount: 315, defaultActivity: "pickup", asn: "ASN-2024-00220" },
  { id: "VEND-2024-051", name: "Zenith E-Commerce", warehouseId: "WHS-0610-D", skuCount: 64, defaultActivity: "returns", asn: "ASN-2024-00610", community: "Flipkart" },
  { id: "VEND-2024-077", name: "Northwind Apparel", warehouseId: "WHS-0188-A", skuCount: 208, defaultActivity: "inward", asn: "ASN-2024-00188", community: "Meesho" },
  { id: "VEND-2024-130", name: "Verde Beauty", warehouseId: "WHS-0533-C", skuCount: 47, defaultActivity: "returns", asn: "ASN-2024-00533" },
  { id: "VEND-2024-019", name: "Loom & Linen", warehouseId: "WHS-0301-B", skuCount: 121, defaultActivity: "inward", asn: "ASN-2024-00301", community: "Flipkart" },
  { id: "VEND-2024-205", name: "Rapid Express Logistics", warehouseId: "WHS-0042-E", skuCount: 18, defaultActivity: "pickup", asn: "ASN-2024-00042" },
  { id: "VEND-2024-088", name: "Oceanic Freight Ltd.", warehouseId: "WHS-0777-A", skuCount: 96, defaultActivity: "inward", asn: "ASN-2024-00777", community: "Amazon" },
  { id: "VEND-2024-156", name: "Swift-Link Partners", warehouseId: "WHS-0455-D", skuCount: 73, defaultActivity: "inward", asn: "ASN-2024-00455", community: "Meesho" },
];

// Dock assignment — driven by the community program and the vehicle type
// brought in (bigger vehicles get a deeper bay). Deterministic for the demo.
export const dockForCommunity = (
  community: Community,
  vehicleType: string,
): string => {
  const zone = COMMUNITY_META[community].dockZone;
  const idx = VEHICLE_TYPES.findIndex((v) => v.label === vehicleType);
  const bay = 1 + ((idx < 0 ? hash(community) : idx) % 6);
  return `DOCK-${zone}-${String(bay).padStart(2, "0")}`;
};

// A Trip ID represents a pre-clubbed, community-program consignment. The
// individual sellers are known to the system but are not surfaced at the gate —
// only the community and the auto-assigned dock are shown.
export interface TripInfo {
  tripId: string;
  community: Community;
  dock: string;
  sellers: SellerRecord[];
  clubbedCount: number;
}

export const getTripInfo = (
  tripId: string,
  vehicleType: string,
): TripInfo => {
  const key = tripId.trim().toUpperCase();
  const h = hash(key);
  const community = COMMUNITIES[h % COMMUNITIES.length];
  // Club every seller affiliated with this community, plus pad to >=3 so the
  // demo always looks like a multi-seller clubbed trip.
  const inCommunity = SELLER_DIRECTORY.filter((s) => s.community === community);
  const others = SELLER_DIRECTORY.filter((s) => s.community !== community);
  const sellers = [...inCommunity];
  let i = 0;
  while (sellers.length < 3 && i < others.length) sellers.push(others[i++]);
  return {
    tripId: key,
    community,
    dock: dockForCommunity(community, vehicleType),
    sellers,
    clubbedCount: sellers.length,
  };
};

// Vehicle types — picking one suggests a max weight capacity the guard can
// still override.
export interface VehicleType {
  label: string;
  maxWeight: number; // kg
}

export const VEHICLE_TYPES: VehicleType[] = [
  { label: "Tata Ace (Mini)", maxWeight: 750 },
  { label: "Pickup 8ft", maxWeight: 1500 },
  { label: "Eicher 14ft", maxWeight: 4000 },
  { label: "Eicher 19ft", maxWeight: 5000 },
  { label: "Container 20ft", maxWeight: 10000 },
  { label: "Container 32ft", maxWeight: 18000 },
];

// Line items shown per seller on the review summary. Shape depends on the
// activity so each group reads like the real document it represents.
export interface InwardLine {
  kind: "inward";
  description: string;
  invoice: string;
  qty: number;
  weight: number;
}
export interface ReturnsLine {
  kind: "returns";
  description: string;
  rma: string;
  reason: string;
  qty: number;
}
export interface PickupLine {
  kind: "pickup";
  description: string;
  pickupRef: string;
  pallets: number;
  dock: string;
}
export type SummaryLine = InwardLine | ReturnsLine | PickupLine;

const INWARD_GOODS = [
  'Pro 14" Laptops - Space Grey (M3)',
  'Ultra-Wide Monitors 34" Curved',
  "Cotton Crew Tees - Assorted",
  "Stainless Cookware Set (5pc)",
  "LED Smart Bulbs (4-pack)",
];
const RETURN_GOODS = [
  "Wireless Headphones (Model X)",
  "Vitamin C Serum 30ml",
  "Running Shoes - Size 9",
  "Bluetooth Speaker Mini",
];
const RETURN_REASONS = [
  "Defective Packaging",
  "Wrong Item Shipped",
  "Customer Cancelled",
  "Quality Issue",
];
const PICKUP_GOODS = [
  "Bulk Furniture Assembly Kits",
  "Palletised Beverage Cartons",
  "Recalled Stock - Batch Lot",
];

const rid = (seed: string, n: number) => {
  const chars = "0123456789";
  let x = hash(seed);
  let out = "";
  for (let i = 0; i < n; i++) {
    out += chars[x % 10];
    x = Math.floor(x / 10) + (x % 7) + 13;
  }
  return out;
};

export const summaryLinesFor = (
  seller: SellerRecord,
  activity: ActivityType,
): SummaryLine[] => {
  const h = hash(seller.id + activity);
  const count = 1 + (h % 2); // 1–2 lines per seller, keeps the demo tidy
  const lines: SummaryLine[] = [];
  for (let i = 0; i < count; i++) {
    const seed = seller.id + activity + i;
    const hh = hash(seed);
    if (activity === "inward") {
      lines.push({
        kind: "inward",
        description: INWARD_GOODS[hh % INWARD_GOODS.length],
        invoice: `INV-${rid(seed, 5)}`,
        qty: 10 + (hh % 40),
        weight: Math.round((40 + (hh % 160)) * 10) / 10,
      });
    } else if (activity === "returns") {
      lines.push({
        kind: "returns",
        description: RETURN_GOODS[hh % RETURN_GOODS.length],
        rma: `RMA-${rid(seed, 4)}`,
        reason: RETURN_REASONS[hh % RETURN_REASONS.length],
        qty: 1 + (hh % 14),
      });
    } else {
      lines.push({
        kind: "pickup",
        description: PICKUP_GOODS[hh % PICKUP_GOODS.length],
        pickupRef: `PU-${rid(seed, 4)}`,
        pallets: 1 + (hh % 8),
        dock: `Dock ${String(1 + (hh % 6)).padStart(2, "0")}`,
      });
    }
  }
  return lines;
};

export const lineWeightFor = (
  seller: SellerRecord,
  activity: ActivityType,
): number =>
  summaryLinesFor(seller, activity).reduce(
    (sum, l) => sum + (l.kind === "inward" ? l.weight : 0),
    0,
  );

// Boxes the gate guard records against a seller's consignment. Deterministic so
// the same seller always suggests the same count; the guard can still override.
export const boxCountForSeller = (sellerId: string): number =>
  10 + (hash(sellerId) % 31); // 10–40

// ---- Unloading (standard inbound) helpers --------------------------------
// A return gate pass uses the RGP- prefix and routes to the returns flow at
// unloading; every other gate pass runs the standard box-based process.
export const isReturnGatePass = (id: string): boolean =>
  id.trim().toUpperCase().startsWith("RGP");

// The consignment an unloading operator sees after scanning a gate pass. Derived
// deterministically so any scanned pass always resolves to the same seller/ASN.
export interface GatePassConsignment {
  gatePass: string;
  seller: SellerRecord;
  asn: string;
  community?: Community;
  boxCount: number; // boxes the guard recorded at gate entry
}

export const consignmentForGatePass = (id: string): GatePassConsignment => {
  const key = id.trim().toUpperCase();
  const seller = SELLER_DIRECTORY[hash(key) % SELLER_DIRECTORY.length];
  return {
    gatePass: key,
    seller,
    asn: seller.asn,
    community: seller.community,
    boxCount: 12 + (hash(key) % 25), // 12–36
  };
};

// Box-ID labels printed for an unloading task. Each is scannable and the printed
// sticker also carries the ASN and the unloading date.
export const genBoxIds = (gatePass: string, count: number): string[] => {
  const stub =
    gatePass.replace(/[^A-Z0-9]/gi, "").slice(-4).toUpperCase() || "0000";
  return Array.from(
    { length: count },
    (_, i) => `BOX-${stub}-${String(i + 1).padStart(3, "0")}`,
  );
};

// Gate pass id — sequential-looking but deterministic per session start.
let gatePassSeq = 8912;
export const genGatePassId = () => `GP-2024-${String(gatePassSeq++).padStart(6, "0")}`;

// Simple CSS barcode pattern (matches the inbound sticker visual).
export const gateBarcodePattern = (seed: string): number[] => {
  let h = 0;
  for (let i = 0; i < seed.length; i++)
    h = (h * 1103515245 + seed.charCodeAt(i)) | 0;
  const bars: number[] = [];
  let x = Math.abs(h);
  for (let i = 0; i < 40; i++) {
    bars.push(1 + (x & 3));
    x = (x * 1664525 + 1013904223) | 0;
    x = Math.abs(x);
  }
  return bars;
};
