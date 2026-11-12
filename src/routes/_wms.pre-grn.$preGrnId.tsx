import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Search, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BoxIdTable } from "@/components/wms/pre-grn-boxes";
import { cn } from "@/lib/utils";
import { boxesForPreGrn, getPreGrnDoc, type PreGrnStatus } from "@/lib/wms/pre-grn-data";

export const Route = createFileRoute("/_wms/pre-grn/$preGrnId")({
  head: () => ({
    meta: [{ title: "Pre-GRN Detail — Inbound" }],
  }),
  component: PreGrnDetailPage,
});

const STATUS_BADGE: Record<PreGrnStatus, string> = {
  Open: "bg-ai-bg text-ai border-ai/30",
  Closed: "bg-ok-bg text-ok border-ok/30",
};

function PreGrnDetailPage() {
  const { preGrnId } = Route.useParams();
  const doc = getPreGrnDoc(preGrnId);
  const [search, setSearch] = useState("");
  const [tick, setTick] = useState(0);

  const boxes = useMemo(() => {
    const all = boxesForPreGrn(preGrnId);
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter((b) =>
      `${b.boxId} ${b.sku} ${b.skuName} ${b.batch}`.toLowerCase().includes(q),
    );
    // `tick` forces a re-read after a reprint mutates the register.
  }, [preGrnId, search, tick]);

  if (!doc) {
    return (
      <div className="p-6">
        <Link
          to="/pre-grn"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pre-GRNs
        </Link>
        <div className="rounded-md border border-dashed border-border bg-card py-16 text-center text-sm text-muted-foreground">
          Pre-GRN {preGrnId} not found.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-border bg-background px-6 py-5">
        <Link
          to="/pre-grn"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pre-GRNs
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{doc.id}</h1>
              <span
                className={cn(
                  "inline-flex items-center rounded-[3px] border px-2 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em]",
                  STATUS_BADGE[doc.status],
                )}
              >
                {doc.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {doc.seller} · {doc.asnId} · {doc.poNumber} · {doc.warehouseId}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 font-mono text-[10px] uppercase tracking-[0.06em]">
            <Meta label="Lots" value={String(doc.lots.length)} />
            <Meta label="Boxes" value={String(doc.boxCount)} />
            <Meta label="Total qty" value={String(doc.totalQty)} />
            <Meta label="Created" value={`${doc.createdAt} · ${doc.createdBy}`} />
          </div>
        </div>
      </div>

      <div className="space-y-4 p-6">
        <Card className="overflow-hidden">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">Lots</h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
              Attributes captured once per lot and reused on every box
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Lot</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Case</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>MRP</TableHead>
                <TableHead>Mfg</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="text-right">Boxes</TableHead>
                <TableHead className="text-right">Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doc.lots.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-xs">{l.id}</TableCell>
                  <TableCell>
                    <div className="font-mono text-xs">{l.sku}</div>
                    <div className="text-[11px] text-muted-foreground">{l.skuName}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{l.caseSize}</TableCell>
                  <TableCell className="font-mono text-xs">{l.batch || "—"}</TableCell>
                  <TableCell className="tabular-nums">{l.mrp || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {l.mfg || "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {l.expiry || "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{l.boxCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{l.qty}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Box ID, SKU, batch…"
            className="h-9 pl-8"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <BoxIdTable boxes={boxes} showStatus={false} onChanged={() => setTick((t) => t + 1)} />
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-foreground">{value}</div>
    </div>
  );
}
