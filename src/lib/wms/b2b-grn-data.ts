// Shared data, ids and in-memory persistence for the B2B GRN flow — kept
// here so the capture screen (/b2b-grn/new) and the landing list (/b2b-grn)
// can both reach the same store without passing state across routes.

export interface CatalogueItem {
  sku: string;
  name: string;
  packSizes: number[];
}

export const CATALOGUE: CatalogueItem[] = [
  { sku: "SKU-99201-WH", name: "boAt Airdopes 141 TWS Earbuds", packSizes: [1, 6, 12] },
  { sku: "SKU-44023-BL", name: "boAt Rockerz 255 Neckband", packSizes: [1, 6] },
  { sku: "SKU-77312-RD", name: "boAt Stone 350 Bluetooth Speaker", packSizes: [1, 6] },
  { sku: "SKU-50118-GR", name: "boAt Wave Call Smartwatch", packSizes: [1, 12] },
  { sku: "SKU-60090-BK", name: "boAt Bassheads 100 Wired Earphones", packSizes: [1, 12, 24] },
];

export const findSku = (raw: string) =>
  CATALOGUE.find((c) => c.sku.toLowerCase() === raw.trim().toLowerCase());

export type QcStatus = "pending" | "good" | "bad";

export interface GrnLot {
  id: string;
  sku: string;
  skuName: string;
  packSize: number;
  batch: string;
  mrp: string;
  expiry: string;
  boxCount: number;
  qty: number;
  createdAt: string;
}

export interface GrnBox {
  boxId: string;
  sku: string;
  skuName: string;
  packSize: number;
  batch: string;
  mrp: string;
  expiry: string;
  lpn: string | null;
  qc: QcStatus;
}

export interface B2bGrnDoc {
  id: string;
  gatePass: string;
  seller: string;
  asn: string;
  warehouseId: string;
  lots: GrnLot[];
  boxes: GrnBox[];
  createdBy: string;
  createdAt: string;
}

export const nowStamp = () =>
  new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const sanitizeBatch = (batch: string) => batch.trim().toUpperCase().replace(/\s+/g, "");

export const boxIdFor = (sku: string, batch: string, packSize: number, seq: number) =>
  `${sku}_${sanitizeBatch(batch)}_${packSize}_${String(seq).padStart(3, "0")}`;

let lotSeq = 1;
export const nextLotId = () => `B2BLOT-${String(lotSeq++).padStart(4, "0")}`;

let grnSeq = 1;
export const nextGrnId = () => `B2BGRN-${String(grnSeq++).padStart(4, "0")}`;

// ─── Demo seed — a few already-completed GRNs so the landing page has
// something to show before anyone has run the capture flow. ids are drawn
// from the same counters a real "Complete GRN" uses, so the next live GRN
// continues the sequence (B2BGRN-0004, B2BLOT-0006, …).

interface SeedLotSpec {
  sku: string;
  packSize: number;
  batch: string;
  mrp: string;
  expiry: string;
  boxCount: number;
  qcPattern: QcStatus[]; // one entry per box, cycled if shorter than boxCount
}

const buildSeedLot = (spec: SeedLotSpec, warehouseStub: string): { lot: GrnLot; boxes: GrnBox[] } => {
  const cat = findSku(spec.sku)!;
  const seq = 1;
  const boxes: GrnBox[] = Array.from({ length: spec.boxCount }, (_, i) => ({
    boxId: boxIdFor(spec.sku, spec.batch, spec.packSize, seq + i),
    sku: spec.sku,
    skuName: cat.name,
    packSize: spec.packSize,
    batch: spec.batch,
    mrp: spec.mrp,
    expiry: spec.expiry,
    lpn: `LPN-${warehouseStub}-${String(i + 1).padStart(2, "0")}`,
    qc: spec.qcPattern[i % spec.qcPattern.length],
  }));
  const lot: GrnLot = {
    id: nextLotId(),
    sku: spec.sku,
    skuName: cat.name,
    packSize: spec.packSize,
    batch: spec.batch,
    mrp: spec.mrp,
    expiry: spec.expiry,
    boxCount: spec.boxCount,
    qty: spec.boxCount * spec.packSize,
    createdAt: "",
  };
  return { lot, boxes };
};

const buildSeedDoc = (
  gatePass: string,
  seller: string,
  asn: string,
  warehouseId: string,
  warehouseStub: string,
  createdAt: string,
  lotSpecs: SeedLotSpec[],
): B2bGrnDoc => {
  const built = lotSpecs.map((s) => buildSeedLot(s, warehouseStub));
  return {
    id: nextGrnId(),
    gatePass,
    seller,
    asn,
    warehouseId,
    lots: built.map((b) => ({ ...b.lot, createdAt })),
    boxes: built.flatMap((b) => b.boxes),
    createdBy: "R. Mehta",
    createdAt,
  };
};

const b2bGrnDocs: B2bGrnDoc[] = [
  buildSeedDoc(
    "GP-2024-008901",
    "Global Electronics Ltd.",
    "ASN-2024-00981",
    "WHS-0982-A",
    "0982A",
    "15 Nov, 10:42",
    [
      { sku: "SKU-99201-WH", packSize: 12, batch: "B2409-H", mrp: "₹1299", expiry: "2027-06-01", boxCount: 4, qcPattern: ["good"] },
      { sku: "SKU-44023-BL", packSize: 6, batch: "B2410-A", mrp: "₹1499", expiry: "2027-08-15", boxCount: 3, qcPattern: ["good"] },
    ],
  ),
  buildSeedDoc(
    "GP-2024-009015",
    "Apex Retail Group",
    "ASN-2024-01142",
    "WHS-0441-C",
    "0441C",
    "16 Nov, 09:15",
    [
      { sku: "SKU-77312-RD", packSize: 6, batch: "B2411-C", mrp: "₹2999", expiry: "2027-05-20", boxCount: 5, qcPattern: ["good", "good", "good", "good", "bad"] },
    ],
  ),
  buildSeedDoc(
    "GP-2024-009102",
    "Global Electronics Ltd.",
    "ASN-2024-00981",
    "WHS-0982-A",
    "0982A",
    "16 Nov, 15:30",
    [
      { sku: "SKU-60090-BK", packSize: 24, batch: "B2412-F", mrp: "₹399", expiry: "2027-09-10", boxCount: 2, qcPattern: ["good"] },
      { sku: "SKU-50118-GR", packSize: 12, batch: "B2412-G", mrp: "₹1799", expiry: "2027-07-05", boxCount: 2, qcPattern: ["good"] },
    ],
  ),
].reverse();

export const listB2bGrnDocs = () => b2bGrnDocs;
export const saveB2bGrnDoc = (doc: B2bGrnDoc) => {
  b2bGrnDocs.unshift(doc);
};
