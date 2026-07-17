// Demo data for the inbound (box-level) GRN flow. Deterministic so the same
// Box ID always resolves to the same ASN, seller and expected items.
import { SELLER_DIRECTORY } from "./gate-entry-data";

const hash = (s: string) => {
  let h = 0;
  const v = s.trim().toUpperCase();
  for (let i = 0; i < v.length; i++) h = (h * 31 + v.charCodeAt(i)) | 0;
  return Math.abs(h);
};

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

const img = (seed: string) => `https://picsum.photos/seed/${seed}/400/400`;

// Item shown during box-level GRN. Batch details (lot/mfg/expiry) are captured
// by OCR (or manually) during QC, so they are optional on the expected record.
export interface GrnItem {
  sku: string;
  name: string;
  image: string;
  qty: number;
  mrp: string;
  color?: string;
  size?: string;
  weight?: string;
  // Suggested batch values the simulated OCR will read back.
  lot: string;
  mfg: string;
  expiry: string;
}

const CATALOG: Omit<GrnItem, "qty" | "lot" | "mfg" | "expiry">[] = [
  {
    sku: "EL-LAP-14",
    name: 'Pro 14" Laptop - Space Grey',
    image: img("grn-lap14"),
    mrp: "₹1,29,999",
    color: "Space Grey",
    size: '14"',
    weight: "1.6 kg",
  },
  {
    sku: "EL-BUD-PRO",
    name: "Wireless Earbuds Pro",
    image: img("grn-buds"),
    mrp: "₹4,999",
    color: "Black",
    size: "One Size",
    weight: "75 g",
  },
  {
    sku: "AP-TEE-CRW",
    name: "Cotton Crew Tee",
    image: img("grn-tee"),
    mrp: "₹799",
    color: "Navy",
    size: "M",
    weight: "180 g",
  },
  {
    sku: "BT-SER-30",
    name: "Vitamin C Serum 30ml",
    image: img("grn-serum"),
    mrp: "₹899",
    size: "30 ml",
    weight: "45 g",
  },
  {
    sku: "HM-COOK-5P",
    name: "Stainless Cookware Set (5pc)",
    image: img("grn-cook"),
    mrp: "₹6,499",
    color: "Steel",
    weight: "4.2 kg",
  },
  {
    sku: "EL-BULB-4P",
    name: "LED Smart Bulbs (4-pack)",
    image: img("grn-bulb"),
    mrp: "₹1,499",
    weight: "320 g",
  },
];

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const batchFor = (seed: string) => {
  const h = hash(seed);
  const mfgYear = 2024 + (h % 2);
  const mfgMonth = MONTHS[h % 12];
  const expYear = mfgYear + 2;
  const expMonth = MONTHS[(h + 5) % 12];
  return {
    lot: `LOT-${rid(seed, 6)}`,
    mfg: `${mfgMonth} ${mfgYear}`,
    expiry: `${expMonth} ${expYear}`,
  };
};

// Seller-specific QC parameters (used only for seller-first operations).
const SELLER_QC_PARAMS = [
  "Brand seal intact",
  "Serial / IMEI legible",
  "Accessories complete",
  "MRP label present",
  "Tamper sticker unbroken",
];

export interface BoxConsignment {
  boxId: string;
  asn: string;
  seller: string;
  warehouseId: string;
  channel: string;
  sellerFirst: boolean; // seller-first vs seller-agnostic
  qcParams: string[]; // seller-specific QC params (empty when seller-agnostic)
  items: GrnItem[];
}

const CHANNELS = ["Amazon", "Flipkart", "Meesho", "Shopify"];

// Resolve a Box ID → the consignment the WMS already knows from the ASN.
export const boxConsignment = (boxId: string): BoxConsignment => {
  const key = boxId.trim().toUpperCase();
  const h = hash(key);
  const seller = SELLER_DIRECTORY[h % SELLER_DIRECTORY.length];
  const sellerFirst = !!seller.community;
  const count = 2 + (h % 3); // 2–4 distinct items per box
  const items: GrnItem[] = [];
  for (let i = 0; i < count; i++) {
    const base = CATALOG[(h + i * 7) % CATALOG.length];
    if (items.some((it) => it.sku === base.sku)) continue;
    const seed = key + base.sku;
    items.push({
      ...base,
      qty: 1 + (hash(seed) % 3),
      ...batchFor(seed),
    });
  }
  return {
    boxId: key,
    asn: seller.asn,
    seller: seller.name,
    warehouseId: seller.warehouseId,
    channel: CHANNELS[h % CHANNELS.length],
    sellerFirst,
    qcParams: sellerFirst
      ? SELLER_QC_PARAMS.slice(0, 3 + (h % 3))
      : [],
    items,
  };
};

// Tasks queued for GRN after unloading — the operator can pick one instead of
// scanning a Box ID.
export interface GrnTask {
  taskId: string;
  boxId: string;
  seller: string;
  asn: string;
  items: number;
}

export const GRN_TASKS: GrnTask[] = ["BOX-7F3A-001", "BOX-22C9-004", "BOX-9011-002"].map(
  (boxId, i) => {
    const c = boxConsignment(boxId);
    return {
      taskId: `GRN-TASK-${String(4821 + i).padStart(5, "0")}`,
      boxId,
      seller: c.seller,
      asn: c.asn,
      items: c.items.reduce((s, it) => s + it.qty, 0),
    };
  },
);

// GRN document id — one per box GRN'd on the QC table.
let grnSeq = 4471;
export const genGrnDocId = () => `GRN-2024-${String(grnSeq++).padStart(6, "0")}`;

// USN (Unique Serial Number) — one per rejected unit. The barcode is printed
// once the box GRN is completed so each bad piece can be tracked individually.
let usnSeq = 90001;
export const genUsn = () => `USN-${String(usnSeq++).padStart(7, "0")}`;

// WID (Warehouse Item ID) — one per good unit. Good QC prints WID labels the
// same way bad QC prints USNs; only the label kind differs between the modes.
let widSeq = 50001;
export const genWid = () => `WID-${String(widSeq++).padStart(7, "0")}`;

// The QC mode is a property of the scanned bin, not an operator choice: bins
// carrying "BAD"/"REJ" resolve to bad QC (USN labels), everything else to good
// QC (WID labels). This lets one scan set the whole downstream flow.
export const binQcType = (lpn: string): "good" | "bad" =>
  /BAD|REJ/.test(lpn.trim().toUpperCase()) ? "bad" : "good";

// Barcode pattern for printed GRN documents.
export const grnBarcodePattern = (seed: string): number[] => {
  let h = 0;
  for (let i = 0; i < seed.length; i++)
    h = (h * 1103515245 + seed.charCodeAt(i)) | 0;
  const bars: number[] = [];
  let x = Math.abs(h);
  for (let i = 0; i < 44; i++) {
    bars.push(1 + (x & 3));
    x = (x * 1664525 + 1013904223) | 0;
    x = Math.abs(x);
  }
  return bars;
};
