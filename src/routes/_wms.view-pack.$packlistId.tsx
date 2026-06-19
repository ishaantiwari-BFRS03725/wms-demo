import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Printer, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { barcodePattern } from "@/lib/wms/manifest-data";

export const Route = createFileRoute("/_wms/view-pack/$packlistId")({
  head: () => ({
    meta: [{ title: "Packlist Detail — Outbound" }],
  }),
  component: PackDetailPage,
});

// ─── Types & mock data ────────────────────────────────────────────────────────

interface PackSummary {
  channel: string;
  courier: string;
  orderNo: string;
  weight: string;
  dimensions: string;
  awb: string;
  invoiceNo: string;
  boxCount: number;
}

interface ItemRow {
  sku: string;
  description: string;
  boxId: string;
  quantity: number;
  image: string;
}

interface BoxRow {
  boxId: string;
  weight: string;
  dimensions: string;
  quantity: number;
  awb: string;
  lrNo: string;
  createdAt: string;
  closedAt: string | null;
}

// Ship-to + label metadata (shared by every box label for this order)
const LABEL_META = {
  warehouse: "MamaEarth_Gurgaon",
  customerName: "Urban Living Retail Pvt Ltd",
  contactName: "Rahul Sharma",
  phone: "+91 98110 24567",
  address:
    "Plot 14, Sector 18 Industrial Area, Udyog Vihar, Gurgaon, Haryana 122015",
  pkdOn: "16/06/2026",
};

const SUMMARY: PackSummary = {
  channel: "Shopify",
  courier: "Delhivery",
  orderNo: "SHP-204417",
  weight: "4.20 kg",
  dimensions: "40 × 30 × 25 cm",
  awb: "DLV-7781200456",
  invoiceNo: "INV-2026-008841",
  boxCount: 3,
};

const img = (seed: string) => `https://picsum.photos/seed/${seed}/80/80`;

const ITEMS: ItemRow[] = [
  {
    sku: "600179",
    description: "boAt Airdopes 141 TWS Earbuds",
    boxId: "BOX-90433-01",
    quantity: 8,
    image: img("airdopes141"),
  },
  {
    sku: "600822",
    description: "boAt Rockerz 450 Bluetooth Headphones",
    boxId: "BOX-90433-01",
    quantity: 4,
    image: img("rockerz450"),
  },
  {
    sku: "601002",
    description: "boAt Type-C 500 Charging Cable",
    boxId: "BOX-90433-02",
    quantity: 12,
    image: img("typec500"),
  },
  {
    sku: "600900",
    description: "boAt Stone 350 Bluetooth Speaker",
    boxId: "BOX-90433-02",
    quantity: 3,
    image: img("stone350"),
  },
  {
    sku: "601000",
    description: "boAt Wave Call Smartwatch",
    boxId: "BOX-90433-03",
    quantity: 5,
    image: img("wavecall"),
  },
  {
    sku: "601145",
    description: "boAt Bassheads 100 Wired Earphones",
    boxId: "BOX-90433-03",
    quantity: 10,
    image: img("bassheads100"),
  },
  {
    sku: "601302",
    description: "boAt Storm Smartwatch Strap",
    boxId: "BOX-90433-03",
    quantity: 6,
    image: img("stormstrap"),
  },
  {
    sku: "601410",
    description: "boAt Aavante Bar Soundbar",
    boxId: "BOX-90433-03",
    quantity: 2,
    image: img("aavantebar"),
  },
  {
    sku: "601566",
    description: "boAt Lunar Connect Smartwatch",
    boxId: "BOX-90433-03",
    quantity: 4,
    image: img("lunarconnect"),
  },
  {
    sku: "601702",
    description: "boAt Airdopes 161 TWS Earbuds",
    boxId: "BOX-90433-03",
    quantity: 8,
    image: img("airdopes161"),
  },
  {
    sku: "601889",
    description: "boAt Micro USB 150 Cable",
    boxId: "BOX-90433-03",
    quantity: 15,
    image: img("microusb150"),
  },
];

const BOXES: BoxRow[] = [
  {
    boxId: "BOX-90433-01",
    weight: "1.60 kg",
    dimensions: "30 × 20 × 15 cm",
    quantity: 12,
    awb: "DLV-7781200456",
    lrNo: "LR-DLV-558120-01",
    createdAt: "16/06/2026 08:48",
    closedAt: "16/06/2026 09:02",
  },
  {
    boxId: "BOX-90433-02",
    weight: "1.85 kg",
    dimensions: "35 × 25 × 18 cm",
    quantity: 15,
    awb: "DLV-7781200457",
    lrNo: "LR-DLV-558120-02",
    createdAt: "16/06/2026 09:05",
    closedAt: "16/06/2026 09:20",
  },
  {
    boxId: "BOX-90433-03",
    weight: "0.75 kg",
    dimensions: "25 × 18 × 12 cm",
    quantity: 50,
    awb: "DLV-7781200458",
    lrNo: "LR-DLV-558120-03",
    createdAt: "16/06/2026 09:24",
    closedAt: null,
  },
];

const TABS = [
  { key: "items", label: "Item View" },
  { key: "boxes", label: "Box View" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ─── Screen ───────────────────────────────────────────────────────────────────

function PackDetailPage() {
  const { packlistId } = Route.useParams();
  const [tab, setTab] = useState<TabKey>("items");

  return (
    <div>
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-5">
        <Link
          to="/view-pack"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to packlists
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {packlistId}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {SUMMARY.boxCount} boxes · Order {SUMMARY.orderNo}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-6">
        {/* Summary card */}
        <div className="rounded-md border border-border bg-card p-5">
          {/* Channel & courier — prominent */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-md bg-primary/10 px-3 py-1.5 text-base font-semibold text-primary">
              {SUMMARY.channel}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-base font-semibold">
              <Truck className="h-4 w-4 text-muted-foreground" />
              {SUMMARY.courier}
            </span>
          </div>

          {/* Detail grid */}
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
            <Info label="Order Number" value={SUMMARY.orderNo} mono />
            <Info label="Weight of Pack" value={SUMMARY.weight} />
            <Info label="Dimensions" value={SUMMARY.dimensions} />
            <Info label="AWB Number" value={SUMMARY.awb} mono />
            <Info label="Invoice Number" value={SUMMARY.invoiceNo} mono />
            <Info label="Total Box Count" value={String(SUMMARY.boxCount)} />
          </div>
        </div>

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

        {tab === "items" ? <ItemViewTable /> : <BoxViewTable />}
      </div>
    </div>
  );
}

// ─── Item View tab ────────────────────────────────────────────────────────────

function ItemViewTable() {
  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted [&>th]:sticky [&>th]:top-0 [&>th]:z-20 [&>th]:bg-muted [&>th]:shadow-[inset_0_-1px_0_hsl(var(--border))]">
            <TableHead>SKU</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Box ID</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Image</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ITEMS.map((it, i) => (
            <TableRow key={`${it.sku}-${it.boxId}-${i}`}>
              <TableCell className="font-mono text-xs">{it.sku}</TableCell>
              <TableCell>{it.description}</TableCell>
              <TableCell className="font-mono text-xs">{it.boxId}</TableCell>
              <TableCell className="text-right tabular-nums">
                {it.quantity}
              </TableCell>
              <TableCell>
                <img
                  src={it.image}
                  alt={it.description}
                  className="h-10 w-10 rounded-md border border-border object-cover"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Box View tab ─────────────────────────────────────────────────────────────

function BoxViewTable() {
  const [labelBox, setLabelBox] = useState<BoxRow | null>(null);

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted [&>th]:sticky [&>th]:top-0 [&>th]:z-20 [&>th]:bg-muted [&>th]:shadow-[inset_0_-1px_0_hsl(var(--border))]">
            <TableHead>Box ID</TableHead>
            <TableHead className="text-right">Box Weight</TableHead>
            <TableHead>Box Dimensions</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>AWB Number</TableHead>
            <TableHead>Box Created At</TableHead>
            <TableHead>Box Closed At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {BOXES.map((b) => (
            <TableRow key={b.boxId}>
              <TableCell className="font-mono text-xs font-medium">
                {b.boxId}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {b.weight}
              </TableCell>
              <TableCell>{b.dimensions}</TableCell>
              <TableCell className="text-right tabular-nums">
                {b.quantity}
              </TableCell>
              <TableCell className="font-mono text-xs">{b.awb}</TableCell>
              <TableCell className="whitespace-nowrap font-mono text-xs">
                {b.createdAt}
              </TableCell>
              <TableCell className="whitespace-nowrap font-mono text-xs">
                {b.closedAt ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={() => setLabelBox(b)}
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Reprint Label
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!labelBox} onOpenChange={(o) => !o && setLabelBox(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Box Label
            </DialogTitle>
          </DialogHeader>
          {labelBox && <BoxLabel box={labelBox} />}
          <DialogFooter>
            <Button className="w-full" onClick={() => setLabelBox(null)}>
              Printed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Box label sticker ────────────────────────────────────────────────────────

function BoxLabel({ box }: { box: BoxRow }) {
  const bars = useMemo(() => barcodePattern(box.lrNo), [box.lrNo]);
  const items = ITEMS.filter((it) => it.boxId === box.boxId);
  const totalQty = items.reduce((s, it) => s + it.quantity, 0);

  // Pair items into two columns so many rows fit in a small label.
  const pairs: [ItemRow, ItemRow | null][] = [];
  for (let i = 0; i < items.length; i += 2) {
    pairs.push([items[i], items[i + 1] ?? null]);
  }

  const cell = "border border-black px-1.5 py-0.5";

  return (
    <div className="border border-black bg-white p-3 text-[13px] leading-tight text-black">
      {/* Address + QR */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <div className="text-[15px] font-semibold">
            {LABEL_META.customerName}
          </div>
          <div>{LABEL_META.contactName}</div>
          <div>{LABEL_META.address}</div>
          <div>
            <span className="text-neutral-600">Phone: </span>
            {LABEL_META.phone}
          </div>
        </div>
        <QrCode value={box.boxId} />
      </div>

      {/* LR + barcode */}
      <div className="mt-3">
        <div>
          <span className="text-neutral-600">LR: </span>
          <span className="font-medium">{box.lrNo}</span>
        </div>
        <div className="mt-1 flex flex-col items-center">
          <div className="flex items-end gap-px">
            {bars.map((w, i) => (
              <div
                key={i}
                style={{ width: `${w * 2}px` }}
                className={cn("h-9", i % 2 === 0 ? "bg-black" : "bg-transparent")}
              />
            ))}
          </div>
          <div className="font-mono text-xs">{box.lrNo}</div>
        </div>
      </div>

      {/* Pkd On */}
      <div className="mt-2 text-center">
        <span className="text-neutral-600">Pkd On: </span>
        <span className="font-medium">{LABEL_META.pkdOn}</span>
        {" · "}
        {LABEL_META.warehouse}
        <div className="font-mono text-xs">{box.boxId}</div>
      </div>

      {/* Item table — two columns */}
      <table className="mt-2 w-full border-collapse text-[13px]">
        <thead>
          <tr className="bg-neutral-100 text-[11px] font-mono uppercase tracking-[0.06em] text-neutral-600">
            <th className={cn(cell, "w-8 font-medium")}>Sr</th>
            <th className={cn(cell, "text-left font-medium")}>Item Code</th>
            <th className={cn(cell, "w-10 font-medium")}>Qty</th>
            <th className={cn(cell, "w-8 font-medium")}>Sr</th>
            <th className={cn(cell, "text-left font-medium")}>Item Code</th>
            <th className={cn(cell, "w-10 font-medium")}>Qty</th>
          </tr>
        </thead>
        <tbody>
          {pairs.map(([a, b], i) => (
            <tr key={a.sku + i}>
              <td className={cn(cell, "text-center tabular-nums")}>
                {i * 2 + 1}
              </td>
              <td className={cn(cell, "font-mono text-xs")}>{a.sku}</td>
              <td className={cn(cell, "text-center tabular-nums")}>
                {a.quantity}
              </td>
              {b ? (
                <>
                  <td className={cn(cell, "text-center tabular-nums")}>
                    {i * 2 + 2}
                  </td>
                  <td className={cn(cell, "font-mono text-xs")}>{b.sku}</td>
                  <td className={cn(cell, "text-center tabular-nums")}>
                    {b.quantity}
                  </td>
                </>
              ) : (
                <>
                  <td className={cell} />
                  <td className={cell} />
                  <td className={cell} />
                </>
              )}
            </tr>
          ))}
          <tr className="font-semibold">
            <td className={cn(cell, "text-center")} colSpan={5}>
              Total
            </td>
            <td className={cn(cell, "text-center tabular-nums")}>{totalQty}</td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div className="mt-1.5 text-center text-[11px] text-neutral-500">
        Powered by Shiprocket WMS
      </div>
    </div>
  );
}

// A deterministic QR-style matrix — purely a demo placeholder, not a real code.
function QrCode({ value }: { value: string }) {
  const cells = useMemo(() => {
    const N = 21;
    let h = 0;
    for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
    const grid: boolean[] = [];
    let x = Math.abs(h) || 1;
    for (let i = 0; i < N * N; i++) {
      x = (x * 1664525 + 1013904223) | 0;
      grid.push((Math.abs(x) & 7) > 3);
    }
    // Stamp the three finder patterns so it reads as a QR.
    const finder = (r0: number, c0: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const on =
            r === 0 || r === 6 || c === 0 || c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          grid[(r0 + r) * N + (c0 + c)] = on;
        }
      }
    };
    finder(0, 0);
    finder(0, N - 7);
    finder(N - 7, 0);
    return { grid, N };
  }, [value]);

  return (
    <div
      className="grid h-20 w-20 shrink-0 gap-0 rounded-sm border border-border bg-white p-1"
      style={{ gridTemplateColumns: `repeat(${cells.N}, minmax(0, 1fr))` }}
    >
      {cells.grid.map((on, i) => (
        <div key={i} className={on ? "bg-foreground" : "bg-white"} />
      ))}
    </div>
  );
}

function Info({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      <div className={cn("mt-0.5 font-medium", mono && "font-mono text-sm")}>
        {value}
      </div>
    </div>
  );
}
