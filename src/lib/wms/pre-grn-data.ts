// Demo data + helpers for Pre-GRN (B2B / Fresh case-pack inbound).
// Lot attributes (SKU, batch, MRP, mfg/expiry, case size) are captured once per
// lot; GRN then receives box-by-box by scanning the Box IDs issued here.
// Created Pre-GRNs and the Box ID register live in module-level stores so they
// survive navigation between the listing, create and detail screens.

const hash = (s: string) => {
  let h = 0;
  const v = s.trim().toUpperCase();
  for (let i = 0; i < v.length; i++) h = (h * 31 + v.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const img = (seed: string) => `https://picsum.photos/seed/${seed}/400/400`;

// ─── Catalogue ──────────────────────────────────────────────────────────────

export interface CatalogueSku {
  sku: string;
  ean: string;
  name: string;
  image: string;
  activeCaseSizes: number[];
  mandatory: { batch: boolean; mrp: boolean };
}

export const CATALOGUE: Record<string, CatalogueSku> = {
  "FR-ALMD500": {
    sku: "FR-ALMD500",
    ean: "8901030501123",
    name: "California Almonds 500g",
    image: img("pregrn-almond"),
    activeCaseSizes: [12, 24],
    mandatory: { batch: true, mrp: true },
  },
  "FR-HNY250": {
    sku: "FR-HNY250",
    ean: "8901030502124",
    name: "Pure Honey 250ml",
    image: img("pregrn-honey"),
    activeCaseSizes: [12, 24, 48],
    mandatory: { batch: true, mrp: true },
  },
  "FR-OAT1KG": {
    sku: "FR-OAT1KG",
    ean: "8901030503125",
    name: "Rolled Oats 1kg",
    image: img("pregrn-oats"),
    activeCaseSizes: [8, 16],
    mandatory: { batch: true, mrp: false },
  },
  "FR-GHEE1L": {
    sku: "FR-GHEE1L",
    ean: "8901030504126",
    name: "Cow Ghee 1L",
    image: img("pregrn-ghee"),
    activeCaseSizes: [12, 24],
    mandatory: { batch: true, mrp: true },
  },
  "FR-DATES400": {
    sku: "FR-DATES400",
    ean: "8901030505127",
    name: "Premium Dates 400g",
    image: img("pregrn-dates"),
    activeCaseSizes: [10, 20],
    mandatory: { batch: false, mrp: true },
  },
};

// ─── ASN / PO ───────────────────────────────────────────────────────────────

export interface PoLine {
  sku: string;
  orderedQty: number;
  expectedMrp: string;
  expectedBatch?: string; // when set, the captured batch must match exactly
}

export interface FreshAsn {
  asnId: string;
  poNumber: string;
  seller: string;
  warehouseId: string;
  hasQrFormat: boolean; // seller has a configured QR layout
  useEanForBoxId: boolean; // Box ID uses the EAN instead of the SKU code
  lines: PoLine[];
}

// ASNs still open for Pre-GRN — these are what the create screen offers.
export const FRESH_ASNS: FreshAsn[] = [
  {
    asnId: "ASN-FR-24118",
    poNumber: "PO-88231",
    seller: "Harvest Foods Co.",
    warehouseId: "WH-DEL-02",
    hasQrFormat: true,
    useEanForBoxId: false,
    lines: [
      { sku: "FR-ALMD500", orderedQty: 960, expectedMrp: "₹449" },
      { sku: "FR-HNY250", orderedQty: 1440, expectedMrp: "₹325", expectedBatch: "B2409-H" },
      { sku: "FR-OAT1KG", orderedQty: 512, expectedMrp: "₹210" },
    ],
  },
  {
    asnId: "ASN-FR-24122",
    poNumber: "PO-88255",
    seller: "Nutri Harvest Pvt Ltd",
    warehouseId: "WH-DEL-02",
    hasQrFormat: false,
    useEanForBoxId: true,
    lines: [
      { sku: "FR-GHEE1L", orderedQty: 720, expectedMrp: "₹699" },
      { sku: "FR-DATES400", orderedQty: 600, expectedMrp: "₹399" },
      { sku: "FR-ALMD500", orderedQty: 480, expectedMrp: "₹449" },
    ],
  },
];

// ASNs already Pre-GRN'd — referenced by the seeded documents below.
const HISTORICAL_ASNS: FreshAsn[] = [
  {
    asnId: "ASN-FR-23890",
    poNumber: "PO-87790",
    seller: "Harvest Foods Co.",
    warehouseId: "WH-DEL-02",
    hasQrFormat: true,
    useEanForBoxId: false,
    lines: [
      { sku: "FR-OAT1KG", orderedQty: 320, expectedMrp: "₹210" },
      { sku: "FR-ALMD500", orderedQty: 480, expectedMrp: "₹449" },
    ],
  },
  {
    asnId: "ASN-FR-24002",
    poNumber: "PO-88104",
    seller: "Nutri Harvest Pvt Ltd",
    warehouseId: "WH-DEL-02",
    hasQrFormat: false,
    useEanForBoxId: true,
    lines: [
      { sku: "FR-GHEE1L", orderedQty: 480, expectedMrp: "₹699" },
      { sku: "FR-DATES400", orderedQty: 400, expectedMrp: "₹399" },
      { sku: "FR-HNY250", orderedQty: 960, expectedMrp: "₹325" },
    ],
  },
  {
    asnId: "ASN-FR-24090",
    poNumber: "PO-88190",
    seller: "Harvest Foods Co.",
    warehouseId: "WH-DEL-02",
    hasQrFormat: true,
    useEanForBoxId: false,
    lines: [
      { sku: "FR-HNY250", orderedQty: 1440, expectedMrp: "₹325" },
      { sku: "FR-ALMD500", orderedQty: 600, expectedMrp: "₹449" },
      { sku: "FR-OAT1KG", orderedQty: 256, expectedMrp: "₹210" },
    ],
  },
];

export const asnById = (id: string): FreshAsn | undefined =>
  [...FRESH_ASNS, ...HISTORICAL_ASNS].find((a) => a.asnId === id);

// ─── Box ID format & serials ────────────────────────────────────────────────
// {SKU or EAN}_{CaseSize}_{BatchID}_{Serial} — the serial continues per
// SKU + case size + batch, across sessions, and is never reused.

const serialCounters = new Map<string, number>();

export const nextBoxSerial = (sku: string, caseSize: number, batch: string): number => {
  const key = `${sku}__${caseSize}__${batch.trim().toUpperCase()}`;
  const next = (serialCounters.get(key) ?? 0) + 1;
  serialCounters.set(key, next);
  return next;
};

export const formatBoxId = (
  asn: FreshAsn,
  sku: string,
  caseSize: number,
  batch: string,
  serial: number,
): string => {
  const skuPart = asn.useEanForBoxId ? CATALOGUE[sku].ean : sku;
  const batchPart = batch.trim().toUpperCase().replace(/\s+/g, "") || "NOBATCH";
  return `${skuPart}_${caseSize}_${batchPart}_${String(serial).padStart(3, "0")}`;
};

// Deterministic "barcode" bars for a printed label — same visual convention as
// the Unloading / GRN box stickers.
export const preGrnBarcodePattern = (seed: string): number[] => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 1103515245 + seed.charCodeAt(i)) | 0;
  const bars: number[] = [];
  let x = Math.abs(h);
  for (let i = 0; i < 40; i++) {
    bars.push(1 + (x & 3));
    x = (x * 1664525 + 1013904223) | 0;
    x = Math.abs(x);
  }
  return bars;
};

// ─── Attribute helpers ──────────────────────────────────────────────────────

export interface CaptureFill {
  batch?: string;
  mrp?: string;
  mfg?: string;
  expiry?: string;
  caseSize?: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const dateFromHash = (h: number, offsetMonths: number) => {
  const totalIdx = (h % 12) + offsetMonths;
  const year = 2025 + (h % 2) + Math.floor(totalIdx / 12);
  return `01 ${MONTHS[((totalIdx % 12) + 12) % 12]} ${year}`;
};

const bumpMrp = (mrp: string, by: number) => {
  const n = Number(mrp.replace(/[^0-9]/g, ""));
  return Number.isNaN(n) ? mrp : `₹${n + by}`;
};

const caseSizeFor = (sku: string, seed: string) => {
  const sizes = CATALOGUE[sku].activeCaseSizes;
  return sizes[hash(seed) % sizes.length];
};

const batchFor = (asn: FreshAsn, sku: string, suffix: string) => {
  const line = asn.lines.find((l) => l.sku === sku);
  if (line?.expectedBatch) return line.expectedBatch;
  return `B${2400 + (hash(asn.asnId + sku) % 90)}-${suffix}`;
};

// OCR reads every attribute off a photographed label; the operator reviews the
// values before the lot is confirmed.
export const simulateOcr = (
  asn: FreshAsn,
  sku: string,
): Required<Omit<CaptureFill, "caseSize">> => {
  const h = hash(asn.asnId + sku + "ocr");
  const line = asn.lines.find((l) => l.sku === sku);
  return {
    batch: batchFor(asn, sku, "O"),
    mrp: line?.expectedMrp ?? `₹${380 + (h % 420)}`,
    mfg: dateFromHash(h, 0),
    expiry: dateFromHash(h, 18),
  };
};

// ─── Universal scan ─────────────────────────────────────────────────────────
// One scan field accepts whatever the supplier's label carries — the SKU code,
// the box EAN, a seller QR, a batch barcode or the seller's own box code — and
// fills whichever attributes that payload holds.

export type ScanResult =
  | { kind: "sku"; sku: string }
  | { kind: "sku-off-po"; sku: string }
  | { kind: "qr"; sku: string; fill: CaptureFill; filled: string[] }
  | { kind: "qr-unsupported" }
  | { kind: "batch-barcode"; fill: CaptureFill; filled: string[] }
  | { kind: "seller-box-code"; code: string }
  | { kind: "wrong-type"; scannedType: string }
  | { kind: "unknown" };

const QR_PREFIX = "QR|";

// A seller QR carries SKU | case size | batch | MRP | mfg | expiry.
export const buildQrPayload = (asn: FreshAsn, sku: string, opts?: { badMrp?: boolean }) => {
  const h = hash(asn.asnId + sku + "qr");
  const line = asn.lines.find((l) => l.sku === sku);
  const mrp = line?.expectedMrp ?? `₹${400 + (h % 400)}`;
  return [
    "QR",
    sku,
    String(caseSizeFor(sku, asn.asnId + sku + "qr")),
    batchFor(asn, sku, "Q"),
    opts?.badMrp ? bumpMrp(mrp, 50) : mrp,
    dateFromHash(h, 0),
    dateFromHash(h, 18),
  ].join("|");
};

export const interpretScan = (raw: string, asn: FreshAsn): ScanResult => {
  const v = raw.trim();
  if (!v) return { kind: "unknown" };
  const onPo = (sku: string) => asn.lines.some((l) => l.sku === sku);

  // Seller QR payload
  if (v.toUpperCase().startsWith(QR_PREFIX)) {
    if (!asn.hasQrFormat) return { kind: "qr-unsupported" };
    const [, rawSku, rawCase, rawBatch, rawMrp, rawMfg, rawExp] = v.split("|");
    const cat = CATALOGUE[(rawSku ?? "").trim().toUpperCase()];
    if (!cat) return { kind: "qr-unsupported" };
    if (!onPo(cat.sku)) return { kind: "sku-off-po", sku: cat.sku };
    const fill: CaptureFill = {
      caseSize: Number(rawCase) || undefined,
      batch: rawBatch?.trim() || undefined,
      mrp: rawMrp?.trim() || undefined,
      mfg: rawMfg?.trim() || undefined,
      expiry: rawExp?.trim() || undefined,
    };
    const filled = [
      fill.caseSize ? "case size" : null,
      fill.batch ? "batch" : null,
      fill.mrp ? "MRP" : null,
      fill.mfg ? "mfg date" : null,
      fill.expiry ? "expiry" : null,
    ].filter(Boolean) as string[];
    return { kind: "qr", sku: cat.sku, fill, filled };
  }

  // A Box ID scanned where a SKU / attribute barcode is expected
  if (/_\d{3}$/.test(v)) return { kind: "wrong-type", scannedType: "Box ID" };
  if (/^(BIN|RCV)-/i.test(v)) return { kind: "wrong-type", scannedType: "Bin ID" };

  // SKU code or box EAN
  const cat = CATALOGUE[v.toUpperCase()] ?? Object.values(CATALOGUE).find((c) => c.ean === v);
  if (cat)
    return onPo(cat.sku) ? { kind: "sku", sku: cat.sku } : { kind: "sku-off-po", sku: cat.sku };

  // Batch barcode — carries the batch, and the expiry it encodes
  if (/^B\d{3,4}-[A-Z]$/i.test(v)) {
    const batch = v.toUpperCase();
    return {
      kind: "batch-barcode",
      fill: { batch, expiry: dateFromHash(hash(batch), 18) },
      filled: ["batch", "expiry"],
    };
  }

  // The seller's own unique box code
  if (/^(SELLER|SLR|BOX)-[A-Z0-9-]+$/i.test(v)) {
    return { kind: "seller-box-code", code: v.toUpperCase() };
  }

  return { kind: "unknown" };
};

// ─── Reprint reasons ────────────────────────────────────────────────────────

export const REPRINT_REASONS = [
  "Label damaged",
  "Label unreadable / faded",
  "Printer jam mid-print",
  "Wrong label printed",
  "Lost before applying to box",
  "Other",
];

// ─── Records ────────────────────────────────────────────────────────────────

export type BoxStatus = "Open" | "Received" | "Closed" | "Voided";

export interface BoxHistoryEvent {
  event: string;
  at: string;
  by: string;
  detail?: string;
}

export interface BoxRecord {
  boxId: string;
  preGrnId: string;
  lotId: string;
  asnId: string;
  poNumber: string;
  sku: string;
  skuName: string;
  caseSize: number;
  batch: string;
  mrp: string;
  mfg: string;
  expiry: string;
  sellerCode: boolean;
  status: BoxStatus;
  printedCount: number;
  history: BoxHistoryEvent[];
}

export interface LotEntry {
  id: string;
  sku: string;
  skuName: string;
  caseSize: number;
  batch: string;
  mrp: string;
  mfg: string;
  expiry: string;
  boxCount: number;
  qty: number;
  sellerCode: boolean;
  source: string; // how the attributes were captured
  boxIds: string[];
  createdAt: string;
  createdBy: string;
}

export type PreGrnStatus = "Open" | "Closed";

export interface PreGrnDoc {
  id: string;
  asnId: string;
  poNumber: string;
  seller: string;
  warehouseId: string;
  status: PreGrnStatus;
  lots: LotEntry[];
  boxCount: number;
  totalQty: number;
  createdBy: string;
  createdAt: string;
}

export const PRE_GRN_STATUSES: PreGrnStatus[] = ["Open", "Closed"];

// ─── Ids & timestamps ───────────────────────────────────────────────────────

let lotSeq = 301;
export const nextLotId = () => `LOT-${String(lotSeq++).padStart(4, "0")}`;

let docSeq = 142;
export const nextPreGrnId = () => `PGRN-2026-${String(docSeq++).padStart(6, "0")}`;

const pad = (n: number) => String(n).padStart(2, "0");

// dd/mm/yyyy HH:mm — matches the other inbound listings.
export const nowStamp = () => {
  const d = new Date();
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ─── Stores ─────────────────────────────────────────────────────────────────

const boxRegister: BoxRecord[] = [];
const preGrnDocs: PreGrnDoc[] = [];

export const listBoxes = () => boxRegister;
export const listPreGrnDocs = () => preGrnDocs;
export const getPreGrnDoc = (id: string) => preGrnDocs.find((d) => d.id === id);
export const boxesForPreGrn = (id: string) => boxRegister.filter((b) => b.preGrnId === id);
export const boxIdExists = (boxId: string) =>
  boxRegister.some((b) => b.boxId === boxId.trim().toUpperCase());

export const savePreGrnDoc = (doc: PreGrnDoc, boxes: BoxRecord[]) => {
  preGrnDocs.unshift(doc);
  boxRegister.unshift(...boxes);
};

export const logReprint = (boxId: string, reason: string, by: string) => {
  const box = boxRegister.find((b) => b.boxId === boxId);
  if (!box || box.status === "Voided") return;
  box.printedCount += 1;
  box.history.push({ event: "Reprinted", at: nowStamp(), by, detail: reason });
};

// ─── Seed: Pre-GRNs already created ─────────────────────────────────────────

interface SeedLot {
  sku: string;
  caseSize: number;
  batchSuffix: string;
  boxCount: number;
  source: string;
  sellerCodes?: string[];
  reprintReason?: string; // applied to the first box
  voidLast?: boolean;
}

// `boxStage` is where the boxes have reached in their own lifecycle, which is
// tracked separately from the two-state Pre-GRN document status.
const seedDoc = (
  asnId: string,
  status: PreGrnStatus,
  boxStage: Exclude<BoxStatus, "Voided">,
  createdBy: string,
  createdAt: string,
  seedLots: SeedLot[],
) => {
  const asn = asnById(asnId)!;
  const id = nextPreGrnId();
  const day = createdAt.split(" ")[0];
  const lots: LotEntry[] = [];
  const boxes: BoxRecord[] = [];

  seedLots.forEach((s) => {
    const line = asn.lines.find((l) => l.sku === s.sku)!;
    const h = hash(asnId + s.sku + s.batchSuffix);
    const batch = batchFor(asn, s.sku, s.batchSuffix);
    const lotId = nextLotId();
    const useSellerCodes = !!s.sellerCodes?.length;
    const boxIds = useSellerCodes
      ? s.sellerCodes!
      : Array.from({ length: s.boxCount }, () =>
          formatBoxId(asn, s.sku, s.caseSize, batch, nextBoxSerial(s.sku, s.caseSize, batch)),
        );
    const mrp = CATALOGUE[s.sku].mandatory.mrp ? line.expectedMrp : "";
    const lot: LotEntry = {
      id: lotId,
      sku: s.sku,
      skuName: CATALOGUE[s.sku].name,
      caseSize: s.caseSize,
      batch,
      mrp,
      mfg: dateFromHash(h, 0),
      expiry: dateFromHash(h, 18),
      boxCount: boxIds.length,
      qty: boxIds.length * s.caseSize,
      sellerCode: useSellerCodes,
      source: s.source,
      boxIds,
      createdAt,
      createdBy,
    };
    lots.push(lot);

    boxIds.forEach((boxId, i) => {
      const voided = s.voidLast && i === boxIds.length - 1;
      const history: BoxHistoryEvent[] = [
        {
          event: "Created",
          at: createdAt,
          by: createdBy,
          detail: useSellerCodes ? "Seller box code used as Box ID" : undefined,
        },
      ];
      if (!useSellerCodes) history.push({ event: "Printed", at: createdAt, by: createdBy });
      if (s.reprintReason && i === 0) {
        history.push({
          event: "Reprinted",
          at: `${day} 11:50`,
          by: createdBy,
          detail: s.reprintReason,
        });
      }
      if (voided) {
        history.push({
          event: "Voided",
          at: `${day} 17:05`,
          by: "System",
          detail: "Duplicate seller code detected on re-scan",
        });
      } else if (boxStage !== "Open") {
        history.push({ event: "Received at GRN", at: `${day} 13:15`, by: "S. Pillai" });
        if (boxStage === "Closed") {
          history.push({ event: "Put away", at: `${day} 17:40`, by: "System" });
        }
      }
      boxes.push({
        boxId,
        preGrnId: id,
        lotId,
        asnId,
        poNumber: asn.poNumber,
        sku: s.sku,
        skuName: CATALOGUE[s.sku].name,
        caseSize: s.caseSize,
        batch,
        mrp,
        mfg: lot.mfg,
        expiry: lot.expiry,
        sellerCode: useSellerCodes,
        status: voided ? "Voided" : boxStage,
        printedCount: useSellerCodes ? 0 : s.reprintReason && i === 0 ? 2 : 1,
        history,
      });
    });
  });

  savePreGrnDoc(
    {
      id,
      asnId,
      poNumber: asn.poNumber,
      seller: asn.seller,
      warehouseId: asn.warehouseId,
      status,
      lots,
      boxCount: lots.reduce((s, l) => s + l.boxCount, 0),
      totalQty: lots.reduce((s, l) => s + l.qty, 0),
      createdBy,
      createdAt,
    },
    boxes,
  );
};

// Oldest first so the generated ids read in chronological order; each save
// unshifts, leaving the newest document at the top of the listing.
seedDoc("ASN-FR-23890", "Closed", "Closed", "A. Khan", "20/10/2026 09:40", [
  { sku: "FR-OAT1KG", caseSize: 16, batchSuffix: "O", boxCount: 3, source: "manual" },
  {
    sku: "FR-ALMD500",
    caseSize: 24,
    batchSuffix: "A",
    boxCount: 2,
    source: "qr",
    reprintReason: "Label damaged",
  },
]);

seedDoc("ASN-FR-24002", "Closed", "Closed", "R. Mehta", "28/10/2026 10:12", [
  { sku: "FR-GHEE1L", caseSize: 12, batchSuffix: "G", boxCount: 4, source: "ocr" },
  { sku: "FR-DATES400", caseSize: 20, batchSuffix: "D", boxCount: 2, source: "manual" },
]);

seedDoc("ASN-FR-24090", "Open", "Received", "S. Pillai", "09/11/2026 14:22", [
  { sku: "FR-HNY250", caseSize: 48, batchSuffix: "H", boxCount: 5, source: "qr" },
  { sku: "FR-ALMD500", caseSize: 12, batchSuffix: "A", boxCount: 3, source: "barcode" },
]);

seedDoc("ASN-FR-24090", "Open", "Received", "R. Mehta", "10/11/2026 11:05", [
  { sku: "FR-OAT1KG", caseSize: 8, batchSuffix: "O", boxCount: 4, source: "excel" },
]);

seedDoc("ASN-FR-24002", "Open", "Open", "R. Mehta", "11/11/2026 16:20", [
  { sku: "FR-HNY250", caseSize: 48, batchSuffix: "H", boxCount: 3, source: "qr" },
  {
    sku: "FR-DATES400",
    caseSize: 10,
    batchSuffix: "D",
    boxCount: 2,
    source: "manual",
    sellerCodes: ["SELLER-NH-99231", "SELLER-NH-99232"],
    voidLast: true,
  },
]);
