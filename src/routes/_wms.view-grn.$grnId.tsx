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

export const Route = createFileRoute("/_wms/view-grn/$grnId")({
  head: () => ({
    meta: [{ title: "GRN Detail — Inbound" }],
  }),
  component: GrnDetailPage,
});

// ─── Types & mock data ────────────────────────────────────────────────────────

type QcGrade = "OK" | "Reject";

interface GrnLine {
  srNo: number;
  binNumber: string;
  sku: string;
  description: string;
  quantity: number;
  remainingQty: number;
  qcGrade: QcGrade;
  mrp: string;
  mfgDate: string;
  expiryDate: string;
  lotNo: string;
  boxId: string;
  rejectReason: string;
  usn: string;
  createdBy: string;
}

const LINES: GrnLine[] = [
  {
    srNo: 1,
    binNumber: "RCV-01-A2",
    sku: "600179",
    description: "boAt Airdopes 141 TWS Earbuds",
    quantity: 120,
    remainingQty: 0,
    qcGrade: "OK",
    mrp: "₹4,490",
    mfgDate: "Apr 2024",
    expiryDate: "—",
    lotNo: "BTH-AD141-0423",
    boxId: "BOX-77810",
    rejectReason: "—",
    usn: "—",
    createdBy: "Ramesh Kumar",
  },
  {
    srNo: 2,
    binNumber: "RCV-01-A3",
    sku: "600822",
    description: "boAt Rockerz 450 Bluetooth Headphones",
    quantity: 90,
    remainingQty: 12,
    qcGrade: "OK",
    mrp: "₹3,990",
    mfgDate: "Jan 2024",
    expiryDate: "—",
    lotNo: "BTH-RK450-0123",
    boxId: "BOX-77811",
    rejectReason: "—",
    usn: "—",
    createdBy: "Ramesh Kumar",
  },
  {
    srNo: 3,
    binNumber: "RCV-02-B1",
    sku: "601002",
    description: "boAt Type-C 500 Charging Cable",
    quantity: 60,
    remainingQty: 60,
    qcGrade: "Reject",
    mrp: "₹699",
    mfgDate: "Mar 2024",
    expiryDate: "—",
    lotNo: "—",
    boxId: "BOX-77812",
    rejectReason: "Damaged",
    usn: "USN-0003",
    createdBy: "Pooja Sharma",
  },
  {
    srNo: 4,
    binNumber: "RCV-02-B2",
    sku: "600900",
    description: "boAt Stone 350 Bluetooth Speaker",
    quantity: 48,
    remainingQty: 0,
    qcGrade: "OK",
    mrp: "₹2,999",
    mfgDate: "Feb 2024",
    expiryDate: "—",
    lotNo: "—",
    boxId: "BOX-77813",
    rejectReason: "—",
    usn: "—",
    createdBy: "Pooja Sharma",
  },
  {
    srNo: 5,
    binNumber: "RCV-03-C1",
    sku: "601000",
    description: "boAt Wave Call Smartwatch",
    quantity: 36,
    remainingQty: 8,
    qcGrade: "Reject",
    mrp: "₹1,799",
    mfgDate: "Feb 2024",
    expiryDate: "—",
    lotNo: "BTH-WV-0224",
    boxId: "BOX-77814",
    rejectReason: "Faded",
    usn: "USN-0005",
    createdBy: "Arjun Mehta",
  },
];

const GRADE_BADGE: Record<QcGrade, string> = {
  OK: "bg-ok-bg text-ok border-ok/30",
  Reject: "bg-risk-bg text-risk border-risk/30",
};

// ─── Screen ───────────────────────────────────────────────────────────────────

function GrnDetailPage() {
  const { grnId } = Route.useParams();
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LINES;
    return LINES.filter((l) =>
      `${l.binNumber} ${l.sku} ${l.description} ${l.qcGrade} ${l.lotNo} ${l.boxId} ${l.rejectReason} ${l.usn} ${l.createdBy}`
        .toLowerCase()
        .includes(q),
    );
  }, [query]);

  const totalQty = LINES.reduce((s, l) => s + l.quantity, 0);
  const totalRemaining = LINES.reduce((s, l) => s + l.remainingQty, 0);

  return (
    <div>
      <div className="border-b border-border bg-background px-6 py-5">
        <Link
          to="/view-grn"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to GRNs
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{grnId}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {LINES.length} lines · {totalQty - totalRemaining} of {totalQty}{" "}
              units putaway
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
            placeholder="Search SKU, bin, lot, box, USN…"
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
                <TableHead className="text-right">Sr No</TableHead>
                <TableHead>Bin Number</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Remaining Qty</TableHead>
                <TableHead>QC Grade</TableHead>
                <TableHead className="text-right">MRP</TableHead>
                <TableHead>MFG Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Lot No</TableHead>
                <TableHead>Box ID</TableHead>
                <TableHead>Reject Reason</TableHead>
                <TableHead>USN</TableHead>
                <TableHead>Created By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={15}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No lines match your search.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((l) => (
                  <TableRow key={l.srNo}>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {l.srNo}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {l.binNumber}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium">
                      {l.sku}
                    </TableCell>
                    <TableCell>{l.description}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {l.quantity}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {l.remainingQty}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-[3px] border px-2 py-0.5 text-[9.5px] font-medium font-mono uppercase tracking-[0.06em]",
                          GRADE_BADGE[l.qcGrade],
                        )}
                      >
                        {l.qcGrade}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {l.mrp}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {l.mfgDate}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {l.expiryDate}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{l.lotNo}</TableCell>
                    <TableCell className="font-mono text-xs">{l.boxId}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {l.rejectReason}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{l.usn}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {l.createdBy}
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
