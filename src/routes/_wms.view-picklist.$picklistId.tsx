import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_wms/view-picklist/$picklistId")({
  head: () => ({
    meta: [{ title: "Picklist Detail — Outbound" }],
  }),
  component: PicklistDetailPage,
});

// ─── Types & mock data ────────────────────────────────────────────────────────

type LineStatus = "Picked" | "Part Picked" | "Pending";

interface PicklistLine {
  status: LineStatus;
  storageLocation: string;
  lpn: string;
  productCode: string;
  description: string;
  category: string;
  lot: string;
  expectedQty: number;
  pickedQty: number;
  remarks: string;
}

const LINES: PicklistLine[] = [
  {
    status: "Picked",
    storageLocation: "A-12-03-B2",
    lpn: "LPN-7781024",
    productCode: "600179",
    description: "boAt Airdopes 141 TWS Earbuds",
    category: "Audio",
    lot: "BTH-AD141-0423",
    expectedQty: 24,
    pickedQty: 24,
    remarks: "—",
  },
  {
    status: "Part Picked",
    storageLocation: "A-12-04-A1",
    lpn: "LPN-7781025",
    productCode: "600822",
    description: "boAt Rockerz 450 Bluetooth Headphones",
    category: "Audio",
    lot: "BTH-RK450-0123",
    expectedQty: 18,
    pickedQty: 11,
    remarks: "Short pick — bin running low",
  },
  {
    status: "Pending",
    storageLocation: "A-13-01-A2",
    lpn: "LPN-7781026",
    productCode: "601002",
    description: "boAt Type-C 500 Charging Cable",
    category: "Accessories",
    lot: "—",
    expectedQty: 30,
    pickedQty: 0,
    remarks: "Awaiting replenishment",
  },
  {
    status: "Picked",
    storageLocation: "A-14-02-C1",
    lpn: "LPN-7781027",
    productCode: "600900",
    description: "boAt Stone 350 Bluetooth Speaker",
    category: "Speakers",
    lot: "—",
    expectedQty: 12,
    pickedQty: 12,
    remarks: "—",
  },
  {
    status: "Part Picked",
    storageLocation: "A-15-01-B3",
    lpn: "LPN-7781028",
    productCode: "601000",
    description: "boAt Wave Call Smartwatch",
    category: "Wearables",
    lot: "BTH-WV-0224",
    expectedQty: 16,
    pickedQty: 9,
    remarks: "Damaged units set aside",
  },
];

interface PickedSkuRow {
  pickNo: string;
  orderNo: string;
  storageLocation: string;
  bin: string;
  pickLpn: string;
  productCode: string;
  description: string;
  lotNo: string;
  mrp: string;
  mfg: string;
  expiry: string;
  pickedQty: number;
  pnaQty: number;
  pickerName: string;
}

const PICKED_SKUS: PickedSkuRow[] = [
  {
    pickNo: "PCK-50231",
    orderNo: "AMZ-100231",
    storageLocation: "A-12-03-B2",
    bin: "BIN-0342",
    pickLpn: "LPN-7781024",
    productCode: "600179",
    description: "boAt Airdopes 141 TWS Earbuds",
    lotNo: "BTH-AD141-0423",
    mrp: "₹4,490",
    mfg: "Apr 2024",
    expiry: "—",
    pickedQty: 24,
    pnaQty: 0,
    pickerName: "Ramesh Kumar",
  },
  {
    pickNo: "PCK-50232",
    orderNo: "AMZ-100231",
    storageLocation: "A-12-04-A1",
    bin: "BIN-0357",
    pickLpn: "LPN-7781025",
    productCode: "600822",
    description: "boAt Rockerz 450 Bluetooth Headphones",
    lotNo: "BTH-RK450-0123",
    mrp: "₹3,990",
    mfg: "Jan 2024",
    expiry: "—",
    pickedQty: 11,
    pnaQty: 7,
    pickerName: "Sita Devi",
  },
  {
    pickNo: "PCK-50233",
    orderNo: "FK-558120",
    storageLocation: "A-13-01-A2",
    bin: "BIN-0411",
    pickLpn: "LPN-7781026",
    productCode: "601002",
    description: "boAt Type-C 500 Charging Cable",
    lotNo: "—",
    mrp: "₹699",
    mfg: "Mar 2024",
    expiry: "—",
    pickedQty: 0,
    pnaQty: 30,
    pickerName: "Arjun Mehta",
  },
  {
    pickNo: "PCK-50234",
    orderNo: "FK-558120",
    storageLocation: "A-14-02-C1",
    bin: "BIN-0288",
    pickLpn: "LPN-7781027",
    productCode: "600900",
    description: "boAt Stone 350 Bluetooth Speaker",
    lotNo: "—",
    mrp: "₹2,999",
    mfg: "Feb 2024",
    expiry: "—",
    pickedQty: 12,
    pnaQty: 0,
    pickerName: "Pooja Sharma",
  },
  {
    pickNo: "PCK-50235",
    orderNo: "SHP-204417",
    storageLocation: "A-15-01-B3",
    bin: "BIN-0509",
    pickLpn: "LPN-7781028",
    productCode: "601000",
    description: "boAt Wave Call Smartwatch",
    lotNo: "BTH-WV-0224",
    mrp: "₹1,799",
    mfg: "Feb 2024",
    expiry: "—",
    pickedQty: 9,
    pnaQty: 7,
    pickerName: "Vikas Chauhan",
  },
];

const LINE_BADGE: Record<LineStatus, string> = {
  Picked: "bg-ok-bg text-ok border-ok/30",
  "Part Picked": "bg-warn-bg text-warn border-warn/30",
  Pending: "bg-status-created/15 text-status-created border-status-created/30",
};

const TABS = [
  { key: "picklist", label: "View Picklist" },
  { key: "picked", label: "Picked SKU Details" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ─── Screen ───────────────────────────────────────────────────────────────────

function PicklistDetailPage() {
  const { picklistId } = Route.useParams();
  const [tab, setTab] = useState<TabKey>("picklist");

  const totalExpected = LINES.reduce((s, l) => s + l.expectedQty, 0);
  const totalPicked = LINES.reduce((s, l) => s + l.pickedQty, 0);

  return (
    <div>
      <div className="border-b border-border bg-background px-6 py-5">
        <Link
          to="/view-picklist"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to picklists
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {picklistId}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {LINES.length} lines · {totalPicked} of {totalExpected} units
              picked
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-border">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "picklist" ? (
          <ViewPicklistTable />
        ) : (
          <PickedSkuTable />
        )}
      </div>
    </div>
  );
}

// ─── View Picklist tab ────────────────────────────────────────────────────────

function ViewPicklistTable() {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LINES;
    return LINES.filter((l) =>
      `${l.status} ${l.storageLocation} ${l.lpn} ${l.productCode} ${l.description} ${l.category} ${l.lot} ${l.remarks}`
        .toLowerCase()
        .includes(q),
    );
  }, [query]);

  return (
    <div className="space-y-3">
      <SearchBox
        value={query}
        onChange={setQuery}
        placeholder="Search product, code, location, LPN…"
      />
      <div className="rounded-md border border-border bg-card">
        <Table>
        <TableHeader>
          <TableRow className="bg-muted [&>th]:sticky [&>th]:top-0 [&>th]:z-20 [&>th]:bg-muted [&>th]:shadow-[inset_0_-1px_0_hsl(var(--border))]">
            <TableHead>Status</TableHead>
            <TableHead>Storage Location</TableHead>
            <TableHead>LPN</TableHead>
            <TableHead>Product Code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Lot</TableHead>
            <TableHead className="text-right">Expected Qty</TableHead>
            <TableHead className="text-right">Picked Qty</TableHead>
            <TableHead>Remarks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={10}
                className="py-12 text-center text-sm text-muted-foreground"
              >
                No lines match your search.
              </TableCell>
            </TableRow>
          ) : (
            visible.map((l) => (
            <TableRow key={l.lpn}>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex items-center rounded-[3px] border px-2 py-0.5 text-[9.5px] font-medium font-mono uppercase tracking-[0.06em]",
                    LINE_BADGE[l.status],
                  )}
                >
                  {l.status}
                </span>
              </TableCell>
              <TableCell className="font-mono text-xs">
                {l.storageLocation}
              </TableCell>
              <TableCell className="font-mono text-xs">{l.lpn}</TableCell>
              <TableCell className="font-mono text-xs">
                {l.productCode}
              </TableCell>
              <TableCell>{l.description}</TableCell>
              <TableCell>{l.category}</TableCell>
              <TableCell className="font-mono text-xs">{l.lot}</TableCell>
              <TableCell className="text-right tabular-nums">
                {l.expectedQty}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {l.pickedQty}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {l.remarks}
              </TableCell>
            </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}

// ─── Picked SKU Details tab ───────────────────────────────────────────────────

function PickedSkuTable() {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PICKED_SKUS;
    return PICKED_SKUS.filter((s) =>
      `${s.orderNo} ${s.storageLocation} ${s.bin} ${s.pickLpn} ${s.productCode} ${s.description} ${s.lotNo} ${s.mrp} ${s.mfg} ${s.expiry} ${s.pickerName}`
        .toLowerCase()
        .includes(q),
    );
  }, [query]);

  return (
    <div className="space-y-3">
      <SearchBox
        value={query}
        onChange={setQuery}
        placeholder="Search pick, order, product, picker…"
      />
      <div className="rounded-md border border-border bg-card">
        <Table>
        <TableHeader>
          <TableRow className="bg-muted [&>th]:sticky [&>th]:top-0 [&>th]:z-20 [&>th]:bg-muted [&>th]:shadow-[inset_0_-1px_0_hsl(var(--border))]">
            <TableHead>Order No</TableHead>
            <TableHead>Storage Location</TableHead>
            <TableHead>Bin</TableHead>
            <TableHead>Pick LPN</TableHead>
            <TableHead>Product Code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Lot No</TableHead>
            <TableHead className="text-right">MRP</TableHead>
            <TableHead>MFG</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead className="text-right">Picked Qty</TableHead>
            <TableHead className="text-right">PNA Qty</TableHead>
            <TableHead>Picker Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={13}
                className="py-12 text-center text-sm text-muted-foreground"
              >
                No picked SKUs match your search.
              </TableCell>
            </TableRow>
          ) : (
            visible.map((s) => (
            <TableRow
              key={s.pickLpn}
              className={cn(s.pnaQty > 0 && "bg-warn-bg/40 hover:bg-warn-bg/50")}
            >
              <TableCell className="font-mono text-xs">{s.orderNo}</TableCell>
              <TableCell className="font-mono text-xs">
                {s.storageLocation}
              </TableCell>
              <TableCell className="font-mono text-xs">{s.bin}</TableCell>
              <TableCell className="font-mono text-xs">{s.pickLpn}</TableCell>
              <TableCell className="font-mono text-xs">
                {s.productCode}
              </TableCell>
              <TableCell>{s.description}</TableCell>
              <TableCell className="font-mono text-xs">{s.lotNo}</TableCell>
              <TableCell className="text-right tabular-nums">{s.mrp}</TableCell>
              <TableCell className="whitespace-nowrap">{s.mfg}</TableCell>
              <TableCell className="whitespace-nowrap">{s.expiry}</TableCell>
              <TableCell className="text-right tabular-nums font-medium text-ok">
                {s.pickedQty}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {s.pnaQty > 0 ? (
                  <span className="text-warn">{s.pnaQty}</span>
                ) : (
                  <span className="text-muted-foreground">0</span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap">{s.pickerName}</TableCell>
            </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 pl-8"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
