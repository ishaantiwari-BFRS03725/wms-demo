// Deterministic hashing helpers so every AWB / LPN / USN consistently produces
// the same demo outcome on every run.
const hash = (s: string) => {
  let h = 0;
  const v = s.trim().toUpperCase();
  for (let i = 0; i < v.length; i++) h = (h * 31 + v.charCodeAt(i)) | 0;
  return Math.abs(h);
};

// Seller assignment — used both for gate passes and AWBs so the demo can show
// per-seller grouping consistently.
const SELLERS = [
  "Northwind Apparel",
  "Verde Beauty",
  "Loom & Linen",
  "Acme Electronics",
] as const;

export const sellerFor = (id: string): string =>
  SELLERS[hash(id) % SELLERS.length];

// Hardcoded demo AWBs that always behave in a known way during a demo.
export interface ExpectedReturnItem {
  sku: string;
  name: string;
  qty: number;
  image: string;
  mrp?: string;
  color?: string;
  size?: string;
  weight?: string;
  lot?: string;
  expiry?: string;
}

export interface ReturnAwbProfile {
  type: "identified" | "unidentified";
  channel?: string;
  seller?: string;
  expectedItems?: ExpectedReturnItem[];
}

const img = (seed: string) => `https://picsum.photos/seed/${seed}/400/400`;

export const HARDCODED_RETURN_AWBS: Record<string, ReturnAwbProfile> = {
  "RTN-AMZ-9981": {
    type: "identified",
    channel: "Amazon",
    seller: "Acme Electronics",
    expectedItems: [
      {
        sku: "AC-EAR-PRO",
        name: "Wireless Earbuds Pro",
        qty: 2,
        image: img("ear-pro"),
        mrp: "₹4,999",
        color: "Black",
        size: "One Size",
        weight: "75 g",
      },
      {
        sku: "AC-CHG-65W",
        name: "65W GaN Charger",
        qty: 1,
        image: img("chg-65w"),
        mrp: "₹2,499",
        color: "White",
        size: "One Size",
        weight: "120 g",
      },
    ],
  },
  "RTN-FK-7723": {
    type: "identified",
    channel: "Flipkart",
    seller: "Verde Beauty",
    expectedItems: [
      {
        sku: "VB-SER-30",
        name: "Vitamin C Serum 30ml",
        qty: 1,
        image: img("ser-30"),
        mrp: "₹899",
        size: "30 ml",
        weight: "45 g",
        lot: "LOT-2024-089",
        expiry: "30 Jun 2026",
      },
      {
        sku: "VB-CRM-50",
        name: "Hydrating Cream 50ml",
        qty: 2,
        image: img("crm-50"),
        mrp: "₹1,299",
        size: "50 ml",
        weight: "80 g",
        lot: "LOT-2024-091",
        expiry: "31 Dec 2026",
      },
      {
        sku: "VB-SUN-50",
        name: "Mineral Sunscreen 50ml",
        qty: 1,
        image: img("sun-50"),
        mrp: "₹699",
        size: "50 ml",
        weight: "75 g",
        lot: "LOT-2024-095",
        expiry: "28 Feb 2027",
      },
    ],
  },
  "RTN-UNK-001": {
    type: "unidentified",
  },
  "RTN-UNK-002": {
    type: "unidentified",
  },
};

export const getReturnAwbProfile = (awb: string): ReturnAwbProfile => {
  const key = awb.trim().toUpperCase();
  if (HARDCODED_RETURN_AWBS[key]) return HARDCODED_RETURN_AWBS[key];
  // Fallback — hash-based for any other input
  return hash(key) % 10 < 7
    ? { type: "identified" }
    : { type: "unidentified" };
};

// Hardcoded RAN → profile map. Used by GRN to determine identified /
// unidentified at the RAN stage (matching how Unloading prints separate
// RANs for identified vs unidentified per seller).
export const HARDCODED_RETURN_RANS: Record<string, ReturnAwbProfile> = {
  "RAN-AMZ-7723": HARDCODED_RETURN_AWBS["RTN-AMZ-9981"],
  "RAN-FK-9981": HARDCODED_RETURN_AWBS["RTN-FK-7723"],
  "RAN-UNK-001": { type: "unidentified" },
  "RAN-UNK-002": { type: "unidentified" },
};

export const getReturnRanProfile = (ran: string): ReturnAwbProfile => {
  const key = ran.trim().toUpperCase();
  if (HARDCODED_RETURN_RANS[key]) return HARDCODED_RETURN_RANS[key];
  // Fallback — hash-based, no expected items list for unmapped RANs
  return hash(key) % 10 < 7
    ? { type: "identified" }
    : { type: "unidentified" };
};

// Roughly 70% of returns scanned at the gate are "identified" — i.e. a return
// request already exists in the system. The remaining 30% are "unidentified".
export const awbIsIdentified = (awb: string): boolean =>
  getReturnAwbProfile(awb).type === "identified";

// QC rejection reasons used in the GRN dialog
export const qcRejectReasons = [
  "Damaged",
  "Expired",
  "Faded",
  "Size issue",
  "Pair mismatch",
  "Price mismatch",
  "Stains",
  "Chip off",
  "Rust",
  "Dirty",
  "Missing pieces",
] as const;

export type QcRejectReason = (typeof qcRejectReasons)[number];

// ID generators ---------------------------------------------------------------
const ID_CHARS = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const rnd = (n: number) =>
  Array.from(
    { length: n },
    () => ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)],
  ).join("");

export const genUsnId = () => `USN-${rnd(8)}`;
export const genGrnLpnId = () => `GRN-LPN-${rnd(6)}`;
export const genRanId = () => `RAN-${rnd(8)}`;

// Putaway location helpers — deterministic so the same code always lands at
// the same shelf in the demo.
const STORAGE_BAYS = [
  "RTN-A-01-02",
  "RTN-A-02-04",
  "RTN-B-01-01",
  "RTN-B-03-05",
  "RTN-C-02-03",
  "RTN-C-04-01",
];
const TEMP_HOLDING = "RTN-HOLD-NW-01";

export const storageBayForLpn = (lpn: string) =>
  STORAGE_BAYS[hash(lpn) % STORAGE_BAYS.length];

export const tempHoldingArea = (_usn: string) => TEMP_HOLDING;

// A simple barcode pattern matching the one used for manifest stickers, so all
// printed labels in the demo have a consistent visual.
export const inboundBarcodePattern = (seed: string): number[] => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 1103515245 + seed.charCodeAt(i)) | 0;
  const bars: number[] = [];
  let x = Math.abs(h);
  for (let i = 0; i < 45; i++) {
    bars.push(1 + (x & 3));
    x = (x * 1664525 + 1013904223) | 0;
    x = Math.abs(x);
  }
  return bars;
};
