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

export const Route = createFileRoute("/_wms/view-putaway/$putawayId")({
  head: () => ({
    meta: [{ title: "Putaway Detail — Inbound" }],
  }),
  component: PutawayDetailPage,
});

// ─── Types & mock data ────────────────────────────────────────────────────────

interface PutawayLine {
  sku: string;
  description: string;
  category: string;
  fromBin: string;
  toBin: string;
  storageAddress: string;
  quantity: number;
  packSize: number;
  documentNo: string;
  boxNumber: string;
}

const LINES: PutawayLine[] = [
  {
    sku: "600179",
    description: "boAt Airdopes 141 TWS Earbuds",
    category: "Audio",
    fromBin: "RCV-01-A2",
    toBin: "A-12-03-B2",
    storageAddress: "Z1-A12-R03-B2",
    quantity: 120,
    packSize: 12,
    documentNo: "GRN-90041",
    boxNumber: "BOX-77810",
  },
  {
    sku: "600822",
    description: "boAt Rockerz 450 Bluetooth Headphones",
    category: "Audio",
    fromBin: "RCV-01-A3",
    toBin: "A-12-04-A1",
    storageAddress: "Z1-A12-R04-A1",
    quantity: 78,
    packSize: 6,
    documentNo: "GRN-90041",
    boxNumber: "BOX-77811",
  },
  {
    sku: "600900",
    description: "boAt Stone 350 Bluetooth Speaker",
    category: "Speakers",
    fromBin: "RCV-02-B2",
    toBin: "A-14-02-C1",
    storageAddress: "Z1-A14-R02-C1",
    quantity: 48,
    packSize: 4,
    documentNo: "GRN-90041",
    boxNumber: "BOX-77813",
  },
  {
    sku: "601000",
    description: "boAt Wave Call Smartwatch",
    category: "Wearables",
    fromBin: "RCV-03-C1",
    toBin: "A-15-01-B3",
    storageAddress: "Z1-A15-R01-B3",
    quantity: 28,
    packSize: 1,
    documentNo: "GRN-90041",
    boxNumber: "BOX-77814",
  },
  {
    sku: "601002",
    description: "boAt Type-C 500 Charging Cable",
    category: "Accessories",
    fromBin: "RCV-02-B1",
    toBin: "B-03-05-A2",
    storageAddress: "Z2-A03-R05-A2",
    quantity: 60,
    packSize: 10,
    documentNo: "GRN-90041",
    boxNumber: "BOX-77812",
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

function PutawayDetailPage() {
  const { putawayId } = Route.useParams();
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LINES;
    return LINES.filter((l) =>
      `${l.sku} ${l.description} ${l.category} ${l.fromBin} ${l.toBin} ${l.storageAddress} ${l.documentNo} ${l.boxNumber}`
        .toLowerCase()
        .includes(q),
    );
  }, [query]);

  const totalQty = LINES.reduce((s, l) => s + l.quantity, 0);

  return (
    <div>
      <div className="border-b border-border bg-background px-6 py-5">
        <Link
          to="/view-putaway"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to putaway
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {putawayId}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {LINES.length} items · {totalQty} units
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-6">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search SKU, bin, address, document, box…"
            className="h-9 pl-8"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted [&>th]:sticky [&>th]:top-0 [&>th]:z-20 [&>th]:bg-muted [&>th]:shadow-[inset_0_-1px_0_hsl(var(--border))]">
                <TableHead>SKU Number</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>From Bin</TableHead>
                <TableHead>To Bin</TableHead>
                <TableHead>Storage Address</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Pack Size</TableHead>
                <TableHead>Document Number</TableHead>
                <TableHead>Box Number</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No items match your search.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((l) => (
                  <TableRow key={l.sku}>
                    <TableCell className="font-mono text-xs font-medium">
                      {l.sku}
                    </TableCell>
                    <TableCell>{l.description}</TableCell>
                    <TableCell>{l.category}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {l.fromBin}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{l.toBin}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {l.storageAddress}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {l.quantity}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {l.packSize}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {l.documentNo}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {l.boxNumber}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
