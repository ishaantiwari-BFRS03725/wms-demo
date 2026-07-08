import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/wms/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { INITIAL_SUSPENSE, SKU_NAME_MAP, type SuspenseEntry } from "@/lib/cycle-count";

export const Route = createFileRoute("/_wms/cycle-count/ledger")({
  head: () => ({ meta: [{ title: "Suspense Ledger — Inventory" }] }),
  component: FullLedger,
});

const COLUMNS = [
  "SKU", "Description", "Lot", "MFG", "Expiry Date", "MRP",
  "Expected Quantity", "Found Quantity", "Status", "Ref. Bin",
  "Created By", "Timestamp", "Cycle Count ID", "Storage Type",
] as const;

interface LedgerRow {
  entry: SuspenseEntry;
  description: string;
  expected: number;
  found: number;
  status: "Excess" | "Suspense";
  createdBy: string;
  timestamp: string;
  cycleCountId: string;
  storageType: string;
}

function toRow(e: SuspenseEntry): LedgerRow {
  const isExcess = e.excessQty > 0;
  const expected = e.packSize * 5;
  const found = isExcess ? expected + e.excessQty : expected - e.suspenseQty;
  return {
    entry: e,
    description: SKU_NAME_MAP[e.sku] ?? "—",
    expected,
    found,
    status: isExcess ? "Excess" : "Suspense",
    createdBy: e.createdBy ?? "System",
    timestamp: e.createdAt ?? "—",
    cycleCountId: e.source,
    storageType: e.storageType ?? (e.binType === "Bulk Line" ? "Bulkline" : "Pickline"),
  };
}

function FullLedger() {
  const rows = INITIAL_SUSPENSE.map(toRow);

  function handleExport() {
    const header = COLUMNS.join(",");
    const body = rows
      .map((r) =>
        [r.entry.sku, r.description, r.entry.lot, r.entry.mfd, r.entry.expiry, r.entry.mrp, r.expected, r.found, r.status, r.entry.binId, r.createdBy, r.timestamp, r.cycleCountId, r.storageType]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "suspense-ledger.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Suspense ledger exported");
  }

  return (
    <div>
      <PageHeader
        title="Suspense Ledger"
        subtitle={`INVENTORY · ${rows.length} ENTRIES`}
        actions={
          <Button size="sm" className="h-8 gap-1.5 text-[12px]" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        }
      />

      <div className="p-7">
        <Link to="/cycle-count" className="mb-4 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Cycle Count
        </Link>

        <div className="rounded-md border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                {COLUMNS.map((h) => (
                  <TableHead key={h} className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.06em]">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLUMNS.length} className="py-10 text-center font-mono text-[11px] uppercase text-muted-foreground">
                    Ledger clear
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.entry.id} className={cn(r.entry.status === "reconciled" && "opacity-40")}>
                    <TableCell className="font-mono text-[11px] font-semibold">{r.entry.sku}</TableCell>
                    <TableCell className="text-[12px]">{r.description}</TableCell>
                    <TableCell className="font-mono text-[11px]">{r.entry.lot}</TableCell>
                    <TableCell className="font-mono text-[11px]">{r.entry.mfd}</TableCell>
                    <TableCell className="font-mono text-[11px]">{r.entry.expiry}</TableCell>
                    <TableCell className="text-right font-mono text-[12px]">₹{r.entry.mrp}</TableCell>
                    <TableCell className="text-right font-mono text-[12px]">{r.expected}</TableCell>
                    <TableCell className="text-right font-mono text-[12px]">{r.found}</TableCell>
                    <TableCell>
                      {r.status === "Excess" ? (
                        <span className="rounded-[3px] border border-ok/40 bg-ok-bg px-1.5 py-0.5 font-mono text-[10px] uppercase text-ok">Excess</span>
                      ) : (
                        <span className="rounded-[3px] border border-warn/40 bg-warn-bg px-1.5 py-0.5 font-mono text-[10px] uppercase text-warn">Suspense</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-[11px]">{r.entry.binId}</TableCell>
                    <TableCell className="text-[12px]">{r.createdBy}</TableCell>
                    <TableCell className="font-mono text-[11px] whitespace-nowrap">{r.timestamp}</TableCell>
                    <TableCell className="font-mono text-[11px]">{r.cycleCountId}</TableCell>
                    <TableCell className="font-mono text-[11px] whitespace-nowrap">{r.storageType}</TableCell>
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
