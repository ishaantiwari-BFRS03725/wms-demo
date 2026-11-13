// Demo data + search engine for Universal Search.
//
// Read-only lookup across the WMS record types. The rules enforced here mirror
// the PRD: complete-field exact matching (never prefix/substring/fuzzy), one
// warehouse at a time, seller/record permissions applied BEFORE ranking,
// counting, pagination and relationship expansion, and `Not recorded` rather
// than an invented zero/location/status.
//
// In the real product each block below is a separate adapter hitting its own
// system of record (box register, bin master, location master, inventory,
// inbound, order, task). Here they are seeded arrays so the screen can
// demonstrate behaviour — including the collisions and permission cases the
// acceptance criteria call out.

// ─── Types ──────────────────────────────────────────────────────────────────

export type RecordType =
  | "box"
  | "bin"
  | "location"
  | "sku"
  | "batch"
  | "usn"
  | "inbound"
  | "order"
  | "task";

/** Groups render in this order — the order of the PRD search-types table. */
export const TYPE_ORDER: RecordType[] = [
  "box",
  "bin",
  "location",
  "sku",
  "batch",
  "usn",
  "inbound",
  "order",
  "task",
];

export const TYPE_LABEL: Record<RecordType, string> = {
  box: "Box",
  bin: "Bin / tote",
  location: "Location",
  sku: "SKU / inventory",
  batch: "Batch / lot",
  usn: "USN",
  inbound: "Inbound reference",
  order: "Order / shipment",
  task: "Task / manifest",
};

export type Tone = "ok" | "warn" | "risk" | "sys" | "neutral";

export interface MatchedField {
  label: string;
  value: string;
}

export interface SummaryRow {
  label: string;
  /** `null` renders as `Not recorded` — never 0, "Available" or a guess. */
  value: string | null;
  /** Restricted fields are dropped entirely rather than revealed as hidden. */
  restricted?: boolean;
  /** Set for a historical value that must never read as current. */
  historical?: boolean;
}

export interface RelatedEntry {
  /** Seller-scoped entries are filtered against the user's seller scope. */
  seller?: string;
  text: string;
}

export interface RelatedBlock {
  label: string;
  entries: RelatedEntry[];
  viewAll?: { label: string; to: string };
}

export interface SourceRecord {
  /** Stable record id — the deterministic sort tiebreak. */
  id: string;
  type: RecordType;
  warehouse: string;
  /** Absent means the record is not seller-scoped (bins, locations, tasks). */
  seller?: string;
  /** Primary identifier shown as the result headline. */
  primary: string;
  /** Searchable fields — matched whole-value, case-insensitively. */
  fields: MatchedField[];
  context?: string;
  status?: string;
  statusTone?: Tone;
  lastUpdated?: string;
  summary: SummaryRow[];
  related?: RelatedBlock;
  /** Absent means there is no verified destination — "Detail view unavailable". */
  destination?: { label: string; to: string };
  /** Shown as a caveat line under the summary. */
  note?: string;
}

// ─── Scope: warehouses and seller permissions ───────────────────────────────

export interface Warehouse {
  code: string;
  name: string;
  authorised: boolean;
}

export const WAREHOUSES: Warehouse[] = [
  { code: "BLR-01", name: "Bengaluru · Hoskote", authorised: true },
  { code: "MUM-01", name: "Mumbai · Bhiwandi", authorised: true },
  { code: "DEL-02", name: "Delhi · Tauru", authorised: false },
];

export const AUTHORISED_WAREHOUSES = WAREHOUSES.filter((w) => w.authorised);

/** The single warehouse the signed-in user is logged in for — not a choice made on this screen. */
export const CURRENT_WAREHOUSE = AUTHORISED_WAREHOUSES[0];

/** Sellers this signed-in user may see. Everything else is filtered server-side. */
export const AUTHORISED_SELLERS = ["Northwind Apparel", "Acme Electronics", "Loom & Linen"];

/** Seeded but never visible — proves denied records leak no row, count or label. */
export const DENIED_SELLER = "Vega Living";

const permitted = (seller?: string) => !seller || AUTHORISED_SELLERS.includes(seller);

// ─── Seed records ───────────────────────────────────────────────────────────

const BOXES: SourceRecord[] = [
  {
    id: "box-000104",
    type: "box",
    warehouse: "BLR-01",
    seller: "Northwind Apparel",
    primary: "BOX-000104",
    fields: [{ label: "Box ID", value: "BOX-000104" }],
    context: "Pre-GRN case pack · ASN-10021",
    status: "Picked",
    statusTone: "sys",
    lastUpdated: "12 Nov 2026, 08:14",
    summary: [
      { label: "SKU", value: "NW-TSH-BLK-M · Crew Tee Black / M" },
      { label: "Case quantity", value: "24 ea" },
      { label: "Current location", value: null },
      {
        label: "Last recorded location",
        value: "A-01-02-03 · bin BINZ000001 — 12 Nov 2026, 08:14",
        historical: true,
      },
      { label: "Linked order", value: "WMS-100234" },
    ],
    note: "Box is picked, so the source cannot establish a current storage location.",
    destination: { label: "Open Box ID Register", to: "/box-id-register" },
  },
  {
    id: "box-000105",
    type: "box",
    warehouse: "BLR-01",
    seller: "Acme Electronics",
    primary: "BOX-000105",
    fields: [{ label: "Box ID", value: "BOX-000105" }],
    context: "Pre-GRN case pack · ASN-10021",
    status: "Received",
    statusTone: "ok",
    lastUpdated: "12 Nov 2026, 11:02",
    summary: [
      { label: "SKU", value: "AC-EAR-PRO · Wireless Earbuds Pro" },
      { label: "Case quantity", value: "12 ea" },
      { label: "Current location", value: "A-01-02-04 · bin BINZ000001" },
      { label: "Linked inbound reference", value: "ASN-10021 / GRN-803" },
    ],
    destination: { label: "Open Box ID Register", to: "/box-id-register" },
  },
  {
    id: "box-000106",
    type: "box",
    warehouse: "BLR-01",
    seller: "Loom & Linen",
    primary: "SELLER-CASE-013",
    fields: [{ label: "Seller box code", value: "SELLER-CASE-013" }],
    context: "Seller-supplied case code · ASN-10044",
    status: "Open",
    statusTone: "warn",
    lastUpdated: "13 Nov 2026, 07:41",
    summary: [
      { label: "SKU", value: "LL-TOW-BTH · Bath Towel Charcoal" },
      { label: "Case quantity", value: null },
      { label: "Current location", value: null },
      { label: "Linked inbound reference", value: "ASN-10044" },
    ],
    note: "Seller's own case code, no WMS label printed. Case quantity is not captured by this source.",
    destination: { label: "Open Box ID Register", to: "/box-id-register" },
  },
  {
    id: "box-000107",
    type: "box",
    warehouse: "BLR-01",
    seller: "Northwind Apparel",
    primary: "BOX-000107",
    fields: [
      { label: "Box ID", value: "BOX-000107" },
      { label: "Seller box code", value: "ABCD" },
    ],
    context: "Outbound package · manifest MAN-1002",
    status: "In transit",
    statusTone: "sys",
    lastUpdated: "11 Nov 2026, 19:26",
    summary: [
      { label: "SKU", value: "NW-JKT-NVY-L · Bomber Jacket Navy / L" },
      { label: "Case quantity", value: "1 ea" },
      { label: "Current location", value: null },
      { label: "Linked order", value: "WMS-100237" },
    ],
    note: "Outbound package handed to the carrier — no storage location applies.",
  },
  {
    id: "box-000900",
    type: "box",
    warehouse: "BLR-01",
    seller: DENIED_SELLER,
    primary: "BOX-000900",
    fields: [{ label: "Box ID", value: "BOX-000900" }],
    status: "Received",
    statusTone: "ok",
    summary: [{ label: "Current location", value: "A-02-01-01" }],
    destination: { label: "Open Box ID Register", to: "/box-id-register" },
  },
];

const BINS: SourceRecord[] = [
  {
    id: "bin-binz000001-blr",
    type: "bin",
    warehouse: "BLR-01",
    primary: "BINZ000001",
    fields: [{ label: "Bin code", value: "BINZ000001" }],
    context: "Legacy code series · movable bin",
    status: "In use",
    statusTone: "sys",
    lastUpdated: "12 Nov 2026, 11:02",
    summary: [
      { label: "Bin type", value: "Movable bin" },
      { label: "Current location", value: "A-01-02-04" },
      { label: "Current process / reference", value: "Putaway · PUT-1002" },
    ],
    related: {
      label: "Recorded contents",
      entries: [
        { seller: "Acme Electronics", text: "AC-EAR-PRO · 12 ea · Good" },
        { seller: "Acme Electronics", text: "AC-CHG-65W · 30 ea · Good" },
        { seller: "Northwind Apparel", text: "NW-SOC-WHT-L · 64 ea · Good" },
        { seller: "Loom & Linen", text: "LL-PIL-STD · 18 ea · Good" },
        { seller: DENIED_SELLER, text: "VG-LMP-01 · 40 ea · Good" },
      ],
      viewAll: { label: "View all in Bin Inventory", to: "/item-info-update" },
    },
    destination: { label: "Open Bin Inventory", to: "/item-info-update" },
  },
  {
    id: "bin-binz000001-mum",
    type: "bin",
    warehouse: "MUM-01",
    primary: "BINZ000001",
    fields: [{ label: "Bin code", value: "BINZ000001" }],
    context: "Legacy code series · movable bin",
    status: "Empty",
    statusTone: "neutral",
    lastUpdated: "09 Nov 2026, 16:30",
    summary: [
      { label: "Bin type", value: "Movable bin" },
      { label: "Current location", value: "B-04-01-02" },
      { label: "Current process / reference", value: null },
    ],
    note: "Same bin code as BLR-01 — bin codes are scoped to a warehouse, not global.",
    destination: { label: "Open Bin Inventory", to: "/item-info-update" },
  },
  {
    id: "bin-blr000001",
    type: "bin",
    warehouse: "BLR-01",
    primary: "BLR000001",
    fields: [{ label: "Bin code", value: "BLR000001" }],
    context: "Custom site prefix · tote",
    status: "In use",
    statusTone: "sys",
    lastUpdated: "13 Nov 2026, 09:12",
    summary: [
      { label: "Bin type", value: "Tote" },
      { label: "Current location", value: "Pack station P-03" },
      { label: "Current process / reference", value: "Pick · PICK-1002" },
    ],
    related: {
      label: "Recorded contents",
      entries: [
        { seller: "Northwind Apparel", text: "NW-TSH-BLK-M · 2 ea · Good" },
        { seller: "Northwind Apparel", text: "NW-SOC-WHT-L · 3 ea · Good" },
      ],
      viewAll: { label: "View all in Bin Inventory", to: "/item-info-update" },
    },
    destination: { label: "Open Bin Inventory", to: "/item-info-update" },
  },
  {
    id: "bin-mum000001",
    type: "bin",
    warehouse: "MUM-01",
    primary: "MUM000001",
    fields: [{ label: "Bin code", value: "MUM000001" }],
    context: "Custom site prefix · movable bin",
    status: "In use",
    statusTone: "sys",
    lastUpdated: "13 Nov 2026, 06:55",
    summary: [
      { label: "Bin type", value: "Movable bin" },
      { label: "Current location", value: "B-01-01-01" },
      { label: "Current process / reference", value: "Putaway · PUT-2210" },
    ],
    destination: { label: "Open Bin Inventory", to: "/item-info-update" },
  },
  {
    id: "bin-a-01-02-03",
    type: "bin",
    warehouse: "BLR-01",
    primary: "A-01-02-03",
    fields: [{ label: "Bin code", value: "A-01-02-03" }],
    context: "Fixed bin — shares its code with the location",
    status: "Active",
    statusTone: "ok",
    lastUpdated: "12 Nov 2026, 08:14",
    summary: [
      { label: "Bin type", value: "Fixed bin" },
      { label: "Current location", value: "A-01-02-03" },
      { label: "Current process / reference", value: null },
    ],
    related: {
      label: "Recorded contents",
      entries: [
        { seller: "Northwind Apparel", text: "NW-TSH-BLK-M · 420 ea · Good" },
        { seller: "Northwind Apparel", text: "SKU-RED-01 · 96 ea · Good" },
        { seller: "Loom & Linen", text: "LL-BED-KNG · 54 ea · Good" },
        { seller: "Loom & Linen", text: "LL-TOW-BTH · 120 ea · Good" },
        { seller: DENIED_SELLER, text: "VG-CSH-02 · 75 ea · Good" },
      ],
      viewAll: { label: "View all in Bin Inventory", to: "/item-info-update" },
    },
    note: "A fixed bin and a location may share a code. Both are returned as distinct records.",
    destination: { label: "Open Bin Inventory", to: "/item-info-update" },
  },
  {
    id: "bin-tote-0045",
    type: "bin",
    warehouse: "BLR-01",
    primary: "TOTE-0045",
    fields: [{ label: "Tote code", value: "TOTE-0045" }],
    context: "Sortation tote",
    status: "In use",
    statusTone: "sys",
    lastUpdated: "13 Nov 2026, 09:40",
    summary: [
      { label: "Bin type", value: "Tote" },
      { label: "Current location", value: "Sort wall S-1 · slot 12" },
      { label: "Current process / reference", value: "Sort · SORT-220" },
    ],
    destination: { label: "Open Bin Inventory", to: "/item-info-update" },
  },
];

const LOCATIONS: SourceRecord[] = [
  {
    id: "loc-a-01-02-03",
    type: "location",
    warehouse: "BLR-01",
    primary: "A-01-02-03",
    fields: [
      { label: "Location code", value: "A-01-02-03" },
      { label: "Location path", value: "BLR-01 / Zone A / Aisle 01 / Rack 02 / Level 03" },
    ],
    context: "Zone A · pick face",
    status: "Active",
    statusTone: "ok",
    lastUpdated: "12 Nov 2026, 08:14",
    summary: [
      { label: "Storage type", value: "Shelf · pick face" },
      { label: "Grade", value: "Good" },
      { label: "Fixed bin", value: "Yes — fixed bin A-01-02-03" },
    ],
    related: {
      label: "Recorded bins and inventory",
      entries: [
        { text: "Bin A-01-02-03 · Fixed bin · Active" },
        { seller: "Northwind Apparel", text: "NW-TSH-BLK-M · 420 ea · Good" },
        { seller: "Northwind Apparel", text: "SKU-RED-01 · 96 ea · Good" },
        { seller: "Loom & Linen", text: "LL-BED-KNG · 54 ea · Good" },
        { seller: "Loom & Linen", text: "LL-TOW-BTH · 120 ea · Good" },
        { seller: DENIED_SELLER, text: "VG-CSH-02 · 75 ea · Good" },
      ],
      viewAll: { label: "View all in Detailed Inventory", to: "/detailed-inventory-view" },
    },
    destination: { label: "Open Detailed Inventory", to: "/detailed-inventory-view" },
  },
  {
    id: "loc-a-01-02-04",
    type: "location",
    warehouse: "BLR-01",
    primary: "A-01-02-04",
    fields: [
      { label: "Location code", value: "A-01-02-04" },
      { label: "Location path", value: "BLR-01 / Zone A / Aisle 01 / Rack 02 / Level 04" },
    ],
    context: "Zone A · reserve",
    status: "Active",
    statusTone: "ok",
    lastUpdated: "12 Nov 2026, 11:02",
    summary: [
      { label: "Storage type", value: "Shelf · reserve" },
      { label: "Grade", value: "Good" },
      { label: "Fixed bin", value: "No" },
    ],
    related: {
      label: "Recorded bins and inventory",
      entries: [
        { text: "Bin BINZ000001 · Movable bin · In use" },
        { seller: "Acme Electronics", text: "AC-EAR-PRO · 12 ea · Good" },
        { seller: "Acme Electronics", text: "AC-CHG-65W · 30 ea · Good" },
        { seller: "Northwind Apparel", text: "NW-SOC-WHT-L · 64 ea · Good" },
      ],
      viewAll: { label: "View all in Detailed Inventory", to: "/detailed-inventory-view" },
    },
    destination: { label: "Open Detailed Inventory", to: "/detailed-inventory-view" },
  },
  {
    id: "loc-r1-l1-p1",
    type: "location",
    warehouse: "BLR-01",
    primary: "R1-L1-P1",
    fields: [
      { label: "Location code", value: "R1-L1-P1" },
      { label: "Location path", value: "BLR-01 / Bulk / Rack 1 / Level 1 / Pallet 1" },
    ],
    context: "Bulk storage",
    status: "Active",
    statusTone: "ok",
    lastUpdated: "13 Nov 2026, 05:20",
    summary: [
      { label: "Storage type", value: "Pallet · bulk" },
      { label: "Grade", value: "Good" },
      { label: "Fixed bin", value: "No" },
    ],
    related: {
      label: "Recorded bins and inventory",
      entries: [
        { text: "Bin BLK-0011 · Movable bin · In use" },
        { text: "Bin BLK-0012 · Movable bin · In use" },
        { text: "Bin BLK-0013 · Movable bin · Empty" },
        { text: "Bin BLK-0014 · Movable bin · In use" },
        { seller: "Northwind Apparel", text: "NW-TSH-BLK-M · 1,200 ea · Good" },
      ],
      viewAll: { label: "View all in Detailed Inventory", to: "/detailed-inventory-view" },
    },
    destination: { label: "Open Detailed Inventory", to: "/detailed-inventory-view" },
  },
  {
    id: "loc-a-01-02-03-del",
    type: "location",
    warehouse: "DEL-02",
    primary: "A-01-02-03",
    fields: [{ label: "Location code", value: "A-01-02-03" }],
    status: "Active",
    statusTone: "ok",
    summary: [{ label: "Storage type", value: "Shelf · pick face" }],
  },
];

const SKUS: SourceRecord[] = [
  {
    id: "sku-nw-tsh-blk-m",
    type: "sku",
    warehouse: "BLR-01",
    seller: "Northwind Apparel",
    primary: "NW-TSH-BLK-M",
    fields: [
      { label: "WMS SKU", value: "NW-TSH-BLK-M" },
      { label: "Client SKU", value: "CLIENT-1001" },
      { label: "EAN / barcode", value: "8901234567890" },
      { label: "Product name", value: "Crew Tee Black / M" },
    ],
    context: "Crew Tee Black / M",
    status: "Active",
    statusTone: "ok",
    lastUpdated: "12 Nov 2026, 08:14",
    summary: [
      { label: "Grade", value: "Good" },
      { label: "Available quantity", value: "1,620 ea" },
      { label: "Blocked quantity", value: "18 ea" },
    ],
    related: {
      label: "Recorded inventory lines",
      entries: [
        { seller: "Northwind Apparel", text: "A-01-02-03 · bin A-01-02-03 · 420 ea · Good" },
        { seller: "Northwind Apparel", text: "R1-L1-P1 · bin BLK-0011 · 1,200 ea · Good" },
        { seller: "Northwind Apparel", text: "QC hold · bin QC-0002 · 18 ea · Blocked" },
      ],
      viewAll: { label: "View all in Detailed Inventory", to: "/detailed-inventory-view" },
    },
    destination: { label: "Open Detailed Inventory", to: "/detailed-inventory-view" },
  },
  {
    id: "sku-ll-tow-bth",
    type: "sku",
    warehouse: "BLR-01",
    seller: "Loom & Linen",
    primary: "LL-TOW-BTH",
    fields: [
      { label: "WMS SKU", value: "LL-TOW-BTH" },
      { label: "Client SKU", value: "CLIENT-4420" },
      { label: "EAN / barcode", value: "8901234567890" },
      { label: "Product name", value: "Bath Towel Charcoal" },
    ],
    context: "Bath Towel Charcoal",
    status: "Active",
    statusTone: "ok",
    lastUpdated: "13 Nov 2026, 07:41",
    summary: [
      { label: "Grade", value: "Good" },
      { label: "Available quantity", value: "120 ea" },
      { label: "Blocked quantity", value: null },
    ],
    related: {
      label: "Recorded inventory lines",
      entries: [{ seller: "Loom & Linen", text: "A-01-02-03 · bin A-01-02-03 · 120 ea · Good" }],
      viewAll: { label: "View all in Detailed Inventory", to: "/detailed-inventory-view" },
    },
    note: "Same EAN as a Northwind Apparel SKU. Seller records are never merged.",
    destination: { label: "Open Detailed Inventory", to: "/detailed-inventory-view" },
  },
  {
    id: "sku-vg-lmp-01",
    type: "sku",
    warehouse: "BLR-01",
    seller: DENIED_SELLER,
    primary: "VG-LMP-01",
    fields: [
      { label: "WMS SKU", value: "VG-LMP-01" },
      { label: "EAN / barcode", value: "8901234567890" },
      { label: "Product name", value: "Arc Table Lamp" },
    ],
    status: "Active",
    statusTone: "ok",
    summary: [{ label: "Available quantity", value: "40 ea" }],
  },
  {
    id: "sku-ac-ear-pro",
    type: "sku",
    warehouse: "BLR-01",
    seller: "Acme Electronics",
    primary: "AC-EAR-PRO",
    fields: [
      { label: "WMS SKU", value: "AC-EAR-PRO" },
      { label: "Client SKU", value: "CLIENT-2007" },
      { label: "EAN / barcode", value: "8907654321098" },
      { label: "Product name", value: "Wireless Earbuds Pro" },
    ],
    context: "Wireless Earbuds Pro · USN tracked",
    status: "Active",
    statusTone: "ok",
    lastUpdated: "12 Nov 2026, 11:02",
    summary: [
      { label: "Grade", value: "Good" },
      { label: "Available quantity", value: "12 ea" },
      { label: "Blocked quantity", value: null },
    ],
    related: {
      label: "Recorded inventory lines",
      entries: [{ seller: "Acme Electronics", text: "A-01-02-04 · bin BINZ000001 · 12 ea · Good" }],
      viewAll: { label: "View all in Detailed Inventory", to: "/detailed-inventory-view" },
    },
    note: "Source does not provide a blocked quantity for this seller, so none is shown.",
    destination: { label: "Open Detailed Inventory", to: "/detailed-inventory-view" },
  },
  {
    id: "sku-red-01",
    type: "sku",
    warehouse: "BLR-01",
    seller: "Northwind Apparel",
    primary: "SKU-RED-01",
    fields: [
      { label: "WMS SKU", value: "SKU-RED-01" },
      { label: "Client SKU", value: "CLIENT-1009" },
      { label: "EAN / barcode", value: "8901234560001" },
      { label: "Product name", value: "red shirt" },
    ],
    context: "red shirt",
    status: "Active",
    statusTone: "ok",
    lastUpdated: "11 Nov 2026, 15:08",
    summary: [
      { label: "Grade", value: "Good" },
      { label: "Available quantity", value: "96 ea" },
      { label: "Blocked quantity", value: "0 ea" },
    ],
    related: {
      label: "Recorded inventory lines",
      entries: [
        { seller: "Northwind Apparel", text: "A-01-02-03 · bin A-01-02-03 · 96 ea · Good" },
      ],
      viewAll: { label: "View all in Detailed Inventory", to: "/detailed-inventory-view" },
    },
    note: "Product names match whole-field only — `red` or `shirt` alone returns nothing.",
    destination: { label: "Open Detailed Inventory", to: "/detailed-inventory-view" },
  },
];

// LOT-2026-04 is deliberately wide: 26 seeded lines, 4 of them owned by the
// denied seller. The user sees 22 — page one holds 20, Load more brings 2.
const LOT_SELLERS = [
  "Northwind Apparel",
  "Acme Electronics",
  DENIED_SELLER,
  "Loom & Linen",
  "Northwind Apparel",
  "Acme Electronics",
  "Loom & Linen",
];

const LOT_SKUS: Record<string, string> = {
  "Northwind Apparel": "NW-TSH-BLK-M",
  "Acme Electronics": "AC-CHG-65W",
  "Loom & Linen": "LL-PIL-STD",
  [DENIED_SELLER]: "VG-CSH-02",
};

const WIDE_LOT: SourceRecord[] = Array.from({ length: 26 }, (_, i) => {
  const seller = LOT_SELLERS[i % LOT_SELLERS.length];
  const sku = LOT_SKUS[seller];
  const seq = String(i + 1).padStart(2, "0");
  return {
    id: `batch-lot-2026-04-${seq}`,
    type: "batch" as const,
    warehouse: "BLR-01",
    seller,
    primary: `${sku} · line ${seq}`,
    fields: [{ label: "Batch / lot number", value: "LOT-2026-04" }],
    context: "Inventory line carrying this lot",
    status: i % 9 === 4 ? "Blocked" : "Good",
    statusTone: (i % 9 === 4 ? "warn" : "ok") as Tone,
    lastUpdated: "12 Nov 2026, 10:0" + (i % 6),
    summary: [
      { label: "SKU", value: sku },
      { label: "Location / bin", value: `R1-L1-P${(i % 4) + 1} · bin BLK-00${11 + (i % 4)}` },
      { label: "Available quantity", value: i % 9 === 4 ? "0 ea" : `${48 + i * 6} ea` },
      { label: "Blocked quantity", value: i % 9 === 4 ? `${24 + i} ea` : null },
    ],
    destination: { label: "Open Detailed Inventory", to: "/detailed-inventory-view" },
  };
});

const BATCHES: SourceRecord[] = [
  ...WIDE_LOT,
  {
    id: "batch-a19-nw",
    type: "batch",
    warehouse: "BLR-01",
    seller: "Northwind Apparel",
    primary: "NW-SOC-WHT-L · line 01",
    fields: [{ label: "Batch / lot number", value: "BATCH-A19" }],
    context: "Inventory line carrying this lot",
    status: "Good",
    statusTone: "ok",
    lastUpdated: "10 Nov 2026, 14:22",
    summary: [
      { label: "SKU", value: "NW-SOC-WHT-L · Ribbed Socks White / L" },
      { label: "Location / bin", value: "A-01-02-04 · bin BINZ000001" },
      { label: "Available quantity", value: "64 ea" },
      { label: "Blocked quantity", value: "0 ea" },
    ],
    destination: { label: "Open Detailed Inventory", to: "/detailed-inventory-view" },
  },
  {
    id: "batch-a19-ll",
    type: "batch",
    warehouse: "BLR-01",
    seller: "Loom & Linen",
    primary: "LL-BED-KNG · line 01",
    fields: [{ label: "Batch / lot number", value: "BATCH-A19" }],
    context: "Inventory line carrying this lot",
    status: "Good",
    statusTone: "ok",
    lastUpdated: "10 Nov 2026, 14:51",
    summary: [
      { label: "SKU", value: "LL-BED-KNG · Cotton Bedsheet King" },
      { label: "Location / bin", value: "A-01-02-03 · bin A-01-02-03" },
      { label: "Available quantity", value: "54 ea" },
      { label: "Blocked quantity", value: null },
    ],
    note: "Two permitted sellers carry the same lot number. Records stay separate.",
    destination: { label: "Open Detailed Inventory", to: "/detailed-inventory-view" },
  },
  {
    id: "batch-a19-vg",
    type: "batch",
    warehouse: "BLR-01",
    seller: DENIED_SELLER,
    primary: "VG-CSH-02 · line 01",
    fields: [{ label: "Batch / lot number", value: "BATCH-A19" }],
    status: "Good",
    statusTone: "ok",
    summary: [{ label: "Available quantity", value: "75 ea" }],
  },
];

const USNS: SourceRecord[] = [
  {
    id: "usn-001234",
    type: "usn",
    warehouse: "BLR-01",
    seller: "Acme Electronics",
    primary: "USN-001234",
    fields: [{ label: "Unit serial number", value: "USN-001234" }],
    context: "Serial-tracked unit",
    status: "In stock",
    statusTone: "ok",
    lastUpdated: "12 Nov 2026, 11:02",
    summary: [
      { label: "SKU", value: "AC-EAR-PRO · Wireless Earbuds Pro" },
      { label: "Grade", value: "Good" },
      { label: "Associated box", value: "BOX-000105" },
      { label: "Location / bin", value: "A-01-02-04 · bin BINZ000001" },
      { label: "Recorded quantity", value: "1 ea" },
    ],
    destination: { label: "Open GRN — USN Tracking", to: "/grn-usn" },
  },
  {
    id: "usn-001235",
    type: "usn",
    warehouse: "BLR-01",
    seller: "Acme Electronics",
    primary: "USN-001235",
    fields: [{ label: "Unit serial number", value: "USN-001235" }],
    context: "Serial-tracked unit",
    status: "Dispatched",
    statusTone: "sys",
    lastUpdated: "11 Nov 2026, 19:26",
    summary: [
      { label: "SKU", value: "AC-SPK-MINI · Mini Bluetooth Speaker" },
      { label: "Grade", value: "Good" },
      { label: "Associated order", value: "WMS-100238" },
      { label: "Location / bin", value: null },
      {
        label: "Last recorded location",
        value: "A-02-01-03 · bin BINZ000004 — 11 Nov 2026, 16:40",
        historical: true,
      },
    ],
    note: "Unit has left the site, so no current bin is recorded.",
    destination: { label: "Open GRN — USN Tracking", to: "/grn-usn" },
  },
];

const INBOUND: SourceRecord[] = [
  {
    id: "inb-asn-10021",
    type: "inbound",
    warehouse: "BLR-01",
    seller: "Northwind Apparel",
    primary: "ASN-10021",
    fields: [{ label: "ASN", value: "ASN-10021" }],
    context: "Advance shipment notice",
    status: "Unloading complete",
    statusTone: "ok",
    lastUpdated: "12 Nov 2026, 10:48",
    summary: [
      { label: "Reference type", value: "ASN" },
      { label: "Related PO", value: "PO-3391" },
      { label: "Related GRN", value: "GRN-803" },
      { label: "Gate entry", value: "GE-0012" },
    ],
    destination: { label: "Open View GRNs", to: "/view-grn" },
  },
  {
    id: "inb-po-3391",
    type: "inbound",
    warehouse: "BLR-01",
    seller: "Northwind Apparel",
    primary: "PO-3391",
    fields: [{ label: "PO", value: "PO-3391" }],
    context: "Purchase order",
    status: "Partially received",
    statusTone: "warn",
    lastUpdated: "12 Nov 2026, 10:48",
    summary: [
      { label: "Reference type", value: "Purchase order" },
      { label: "Related ASN", value: "ASN-10021" },
      { label: "Related GRN", value: "GRN-803" },
    ],
    note: "The same PO also appears under Order / shipment. No redirect is made for you.",
    destination: { label: "Open View GRNs", to: "/view-grn" },
  },
  {
    id: "inb-stn-009",
    type: "inbound",
    warehouse: "BLR-01",
    seller: "Loom & Linen",
    primary: "STN-009",
    fields: [{ label: "STN", value: "STN-009" }],
    context: "Stock transfer note",
    status: "In transit",
    statusTone: "sys",
    lastUpdated: "13 Nov 2026, 04:10",
    summary: [
      { label: "Reference type", value: "Stock transfer note" },
      { label: "Origin site", value: "MUM-01" },
      { label: "Related GRN", value: null },
    ],
    destination: { label: "Open View GRNs", to: "/view-grn" },
  },
  {
    id: "inb-ge-0012",
    type: "inbound",
    warehouse: "BLR-01",
    seller: "Northwind Apparel",
    primary: "GE-0012",
    fields: [{ label: "Gate entry", value: "GE-0012" }],
    context: "Gate entry",
    status: "Vehicle at dock D-2",
    statusTone: "sys",
    lastUpdated: "13 Nov 2026, 08:05",
    summary: [
      { label: "Reference type", value: "Gate entry" },
      { label: "Vehicle", value: "KA-01-AB-4412" },
      { label: "Related ASN", value: "ASN-10021" },
    ],
    destination: { label: "Open Gate Entry", to: "/gate-entry" },
  },
  {
    id: "inb-gp-0051",
    type: "inbound",
    warehouse: "BLR-01",
    primary: "GP-0051",
    fields: [{ label: "Gate pass", value: "GP-0051" }],
    context: "Returnable gate pass",
    status: "Approved",
    statusTone: "ok",
    lastUpdated: "12 Nov 2026, 17:35",
    summary: [
      { label: "Reference type", value: "Gate pass" },
      { label: "Purpose", value: "Returnable — empty totes to MUM-01" },
      { label: "Related ASN", value: null },
    ],
    destination: { label: "Open Gate Pass Processing", to: "/gate-pass-processing" },
  },
  {
    id: "inb-grn-803",
    type: "inbound",
    warehouse: "BLR-01",
    seller: "Northwind Apparel",
    primary: "GRN-803",
    fields: [{ label: "GRN", value: "GRN-803" }],
    context: "Goods receipt note",
    status: "Completed",
    statusTone: "ok",
    lastUpdated: "12 Nov 2026, 11:02",
    summary: [
      { label: "Reference type", value: "GRN" },
      { label: "Related ASN", value: "ASN-10021" },
      { label: "Related PO", value: "PO-3391" },
    ],
    destination: { label: "Open View GRNs", to: "/view-grn" },
  },
];

const ORDERS: SourceRecord[] = [
  {
    id: "ord-wms-100234",
    type: "order",
    warehouse: "BLR-01",
    seller: "Northwind Apparel",
    primary: "WMS-100234",
    fields: [
      { label: "Order number", value: "WMS-100234" },
      { label: "External order number", value: "AMZ-IN-99812" },
      { label: "Client PO", value: "PO-3391" },
      { label: "AWB", value: "123456789012" },
    ],
    context: "Amazon · Next Day",
    status: "Created",
    statusTone: "neutral",
    lastUpdated: "13 Nov 2026, 09:14",
    summary: [
      { label: "External order number", value: "AMZ-IN-99812" },
      { label: "Client PO", value: "PO-3391" },
      { label: "AWB", value: "123456789012" },
    ],
    note: "This PO also matches an inbound reference. Both groups are shown.",
    destination: { label: "Open order WMS-100234", to: "/orders/WMS-100234" },
  },
  {
    id: "ord-wms-100235",
    type: "order",
    warehouse: "BLR-01",
    seller: "Acme Electronics",
    primary: "WMS-100235",
    fields: [
      { label: "Order number", value: "WMS-100235" },
      { label: "External order number", value: "FK-77231" },
    ],
    context: "Flipkart · Same Day",
    status: "Picked",
    statusTone: "sys",
    lastUpdated: "13 Nov 2026, 08:42",
    summary: [
      { label: "External order number", value: "FK-77231" },
      { label: "AWB", value: "6612004477", restricted: true },
    ],
    note: "AWB is restricted for your role, so the field is omitted rather than flagged as hidden.",
    destination: { label: "Open order WMS-100235", to: "/orders/WMS-100235" },
  },
  {
    id: "ord-wms-100236",
    type: "order",
    warehouse: "BLR-01",
    seller: "Loom & Linen",
    primary: "WMS-100236",
    fields: [
      { label: "Order number", value: "WMS-100236" },
      { label: "External order number", value: "SHP-55120" },
      { label: "AWB", value: "555000111222" },
    ],
    context: "Shopify · Standard",
    status: "Packed",
    statusTone: "sys",
    lastUpdated: "13 Nov 2026, 07:30",
    summary: [
      { label: "External order number", value: "SHP-55120" },
      { label: "Client PO", value: null },
      { label: "AWB", value: "555000111222" },
    ],
    destination: { label: "Open order WMS-100236", to: "/orders/WMS-100236" },
  },
  {
    id: "ord-wms-100238",
    type: "order",
    warehouse: "BLR-01",
    seller: "Acme Electronics",
    primary: "WMS-100238",
    fields: [
      { label: "Order number", value: "WMS-100238" },
      { label: "External order number", value: "AMZ-IN-99847" },
      { label: "Client PO", value: "PO/0033-91" },
      { label: "AWB", value: "000987654321" },
    ],
    context: "Amazon · Same Day",
    status: "Dispatched",
    statusTone: "ok",
    lastUpdated: "11 Nov 2026, 19:26",
    summary: [
      { label: "External order number", value: "AMZ-IN-99847" },
      { label: "Client PO", value: "PO/0033-91" },
      { label: "AWB", value: "000987654321" },
    ],
    note: "Leading zeroes and punctuation are significant — `987654321` and `PO-0033-91` do not match.",
    destination: { label: "Open order WMS-100238", to: "/orders/WMS-100238" },
  },
  {
    id: "ord-wms-100999",
    type: "order",
    warehouse: "BLR-01",
    seller: DENIED_SELLER,
    primary: "WMS-100999",
    fields: [
      { label: "Order number", value: "WMS-100999" },
      { label: "External order number", value: "VG-20031" },
    ],
    status: "Packed",
    statusTone: "sys",
    summary: [{ label: "External order number", value: "VG-20031" }],
  },
];

const TASKS: SourceRecord[] = [
  {
    id: "task-pick-1002",
    type: "task",
    warehouse: "BLR-01",
    primary: "PICK-1002",
    fields: [{ label: "Task ID", value: "PICK-1002" }],
    context: "Pick task",
    status: "In progress",
    statusTone: "sys",
    lastUpdated: "13 Nov 2026, 09:40",
    summary: [
      { label: "Task type", value: "Pick" },
      { label: "Assignee", value: "Rakesh Kumar" },
      { label: "Source", value: "Zone B · aisle 04–07" },
      { label: "Destination", value: "Pack station P-03 · tote BLR000001" },
    ],
    destination: { label: "Open Pick", to: "/pick" },
  },
  {
    id: "task-put-1002",
    type: "task",
    warehouse: "BLR-01",
    primary: "PUT-1002",
    fields: [{ label: "Task ID", value: "PUT-1002" }],
    context: "Putaway task",
    status: "Open",
    statusTone: "warn",
    lastUpdated: "12 Nov 2026, 11:04",
    summary: [
      { label: "Task type", value: "Putaway" },
      { label: "Assignee", value: null },
      { label: "Source", value: "GRN-803 · dock D-2" },
      { label: "Destination", value: "A-01-02-04 · bin BINZ000001" },
    ],
    destination: { label: "Open View Putaway", to: "/view-putaway" },
  },
  {
    id: "task-move-1002",
    type: "task",
    warehouse: "BLR-01",
    primary: "MOVE-1002",
    fields: [{ label: "Task ID", value: "MOVE-1002" }],
    context: "Item movement task",
    status: "Pending approval",
    statusTone: "warn",
    lastUpdated: "13 Nov 2026, 06:18",
    summary: [
      { label: "Task type", value: "Item movement" },
      { label: "Assignee", value: "Sunita Devi" },
      { label: "Source", value: "A-01-02-03 · bin A-01-02-03" },
      { label: "Destination", value: "R1-L1-P1 · bin BLK-0013" },
    ],
    destination: { label: "Open Item Movement", to: "/item-movement" },
  },
  {
    id: "task-man-1002",
    type: "task",
    warehouse: "BLR-01",
    primary: "MAN-1002",
    fields: [{ label: "Manifest ID", value: "MAN-1002" }],
    context: "Carrier manifest",
    status: "Closed",
    statusTone: "ok",
    lastUpdated: "11 Nov 2026, 19:26",
    summary: [
      { label: "Task type", value: "Manifest" },
      { label: "Carrier", value: "Delhivery" },
      { label: "Assignee", value: "Arjun Mehta" },
      { label: "Destination", value: "Dock D-5 · vehicle KA-01-CD-7781" },
    ],
    destination: { label: "Open View Manifests", to: "/view-manifest" },
  },
];

const ALL_RECORDS: SourceRecord[] = [
  ...BOXES,
  ...BINS,
  ...LOCATIONS,
  ...SKUS,
  ...BATCHES,
  ...USNS,
  ...INBOUND,
  ...ORDERS,
  ...TASKS,
];

// ─── Matching ───────────────────────────────────────────────────────────────

/**
 * Input normalisation: drop a scanner's trailing CR/LF and trim the ends.
 * Internal whitespace, punctuation, leading zeroes and case are all preserved —
 * the value is text, never a number.
 */
export const normaliseQuery = (raw: string) => raw.replace(/[\r\n]+$/g, "").trim();

export const MAX_QUERY_LENGTH = 256;

/** Whole-field, case-insensitive equality. No prefix, substring or fuzzy fallback. */
const fieldMatches = (field: string, query: string) =>
  field.trim().toLowerCase() === query.trim().toLowerCase();

// ─── Engine ─────────────────────────────────────────────────────────────────

export type AdapterHealth = "healthy" | "partial" | "down" | "slow";

/** Adapters taken offline in the "partial outage" demo mode. */
export const PARTIAL_OUTAGE_TYPES: RecordType[] = ["sku", "batch"];

export interface SearchResult {
  record: SourceRecord;
  /** Every field this record matched on — the record is returned once. */
  matched: MatchedField[];
  /** Summary rows after redaction, with `null` meaning `Not recorded`. */
  summary: SummaryRow[];
  /** First 3 authorised related entries, never an unfiltered total. */
  related?: { label: string; entries: string[]; viewAll?: { label: string; to: string } };
}

export interface SearchGroup {
  type: RecordType;
  results: SearchResult[];
}

export interface SearchOutcome {
  groups: SearchGroup[];
  /** Authorised types whose adapter failed — named in the partial-failure notice. */
  failedTypes: RecordType[];
  allFailed: boolean;
  matchCount: number;
}

export interface SearchRequest {
  query: string;
  warehouse: string;
  /** `null` is the default "All types" scope. */
  type: RecordType | null;
  health: AdapterHealth;
}

export function runSearch({ query, warehouse, type, health }: SearchRequest): SearchOutcome {
  const q = normaliseQuery(query);
  const searchable = type ? [type] : TYPE_ORDER;

  if (health === "down") {
    return { groups: [], failedTypes: searchable, allFailed: true, matchCount: 0 };
  }

  const failedTypes =
    health === "partial" ? searchable.filter((t) => PARTIAL_OUTAGE_TYPES.includes(t)) : [];

  const groups: SearchGroup[] = [];
  let matchCount = 0;

  for (const t of searchable) {
    if (failedTypes.includes(t)) continue;

    const results: SearchResult[] = [];

    for (const record of ALL_RECORDS) {
      // Authorisation first — before matching, ranking, counting or expansion.
      if (record.type !== t) continue;
      if (record.warehouse !== warehouse) continue;
      if (!permitted(record.seller)) continue;

      const matched = record.fields.filter((f) => fieldMatches(f.value, q));
      if (matched.length === 0) continue;

      const relatedEntries = record.related?.entries.filter((e) => permitted(e.seller)) ?? [];

      results.push({
        record,
        matched,
        summary: record.summary.filter((row) => !row.restricted),
        related: record.related
          ? {
              label: record.related.label,
              entries: relatedEntries.slice(0, 3).map((e) => e.text),
              viewAll: relatedEntries.length > 3 ? record.related.viewAll : undefined,
            }
          : undefined,
      });
    }

    // Deterministic order: matched value ascending, then stable record id.
    results.sort((a, b) => {
      const av = a.matched[0].value.toLowerCase();
      const bv = b.matched[0].value.toLowerCase();
      if (av !== bv) return av < bv ? -1 : 1;
      return a.record.id < b.record.id ? -1 : 1;
    });

    if (results.length > 0) {
      groups.push({ type: t, results });
      matchCount += results.length;
    }
  }

  return {
    groups,
    failedTypes,
    allFailed:
      failedTypes.length > 0 && groups.length === 0 && failedTypes.length === searchable.length,
    matchCount,
  };
}

export const PAGE_SIZE = 20;

// ─── Demo helpers ───────────────────────────────────────────────────────────

export interface ExampleQuery {
  value: string;
  hint: string;
}

/** Shown before the first search — examples, never recent queries or records. */
export const EXAMPLE_QUERIES: ExampleQuery[] = [
  { value: "BOX-000104", hint: "Box ID · picked, so no current location" },
  { value: "A-01-02-03", hint: "Location and the fixed bin sharing its code" },
  { value: "BINZ000001", hint: "Legacy bin code, scoped to this warehouse" },
  { value: "8901234567890", hint: "EAN shared by two permitted sellers" },
  { value: "LOT-2026-04", hint: "Lot across 22 authorised lines" },
  { value: "PO-3391", hint: "Matches inbound and an order" },
  { value: "USN-001234", hint: "Unit serial number" },
  { value: "PICK-1002", hint: "Pick task" },
  { value: "BOX-000900", hint: "Denied seller · returns nothing" },
];

/** Values a scanner would send, cycled by the simulated-scan button. */
export const SCAN_PAYLOADS = [
  "BOX-000104\r\n",
  "BINZ000001\r\n",
  "8901234567890\r\n",
  "USN-001234\r\n",
  "000987654321\r\n",
];
