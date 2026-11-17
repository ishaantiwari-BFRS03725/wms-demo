import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, Plus, Search, X } from "lucide-react";
import { PageHeader } from "@/components/wms/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Meta, QcBadge } from "@/components/wms/b2b-grn-boxes";
import { listB2bGrnDocs, type B2bGrnDoc } from "@/lib/wms/b2b-grn-data";

export const Route = createFileRoute("/_wms/b2b-grn/")({
  head: () => ({
    meta: [{ title: "B2B GRN — Inbound" }],
  }),
  component: B2bGrnListPage,
});

function B2bGrnListPage() {
  const rows = listB2bGrnDocs();
  const [search, setSearch] = useState("");
  const [viewDoc, setViewDoc] = useState<B2bGrnDoc | null>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((d) =>
      `${d.id} ${d.gatePass} ${d.seller} ${d.asn}`.toLowerCase().includes(q),
    );
  }, [rows, search]);

  return (
    <div>
      <PageHeader
        title="B2B GRN"
        subtitle="Gate-pass-driven case-pack receiving — one box ID per box, placed against an LPN and QC'd."
        actions={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search GRN, gate pass or seller…"
                className="h-9 w-64 pl-8"
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
            <Button asChild size="sm" className="h-9 gap-1.5">
              <Link to="/b2b-grn/new">
                <Plus className="h-3.5 w-3.5" />
                New B2B GRN
              </Link>
            </Button>
          </>
        }
      />

      <div className="space-y-4 p-6">
        <Card className="overflow-hidden">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">Previous B2B GRNs</h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
              {rows.length} completed
            </p>
          </div>
          {visible.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {rows.length === 0
                ? "No B2B GRNs completed yet. Scan a gate pass to start one."
                : `No B2B GRNs match "${search}".`}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>GRN No</TableHead>
                    <TableHead>Gate Pass</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>ASN</TableHead>
                    <TableHead className="text-right">Lots</TableHead>
                    <TableHead className="text-right">Boxes</TableHead>
                    <TableHead className="text-right">Good</TableHead>
                    <TableHead className="text-right">Bad</TableHead>
                    <TableHead className="text-right">Total Qty</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="whitespace-nowrap font-mono text-xs font-medium">
                        {d.id}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{d.gatePass}</TableCell>
                      <TableCell>{d.seller}</TableCell>
                      <TableCell className="font-mono text-xs">{d.asn}</TableCell>
                      <TableCell className="text-right tabular-nums">{d.lots.length}</TableCell>
                      <TableCell className="text-right tabular-nums">{d.boxes.length}</TableCell>
                      <TableCell className="text-right tabular-nums text-status-picked">
                        {d.boxes.filter((b) => b.qc === "good").length}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-destructive">
                        {d.boxes.filter((b) => b.qc === "bad").length}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {d.lots.reduce((s, l) => s + l.qty, 0)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{d.createdBy}</TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {d.createdAt}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5"
                            onClick={() => setViewDoc(d)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={!!viewDoc} onOpenChange={(o) => !o && setViewDoc(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[760px]">
          <DialogHeader>
            <DialogTitle>{viewDoc?.id}</DialogTitle>
          </DialogHeader>
          {viewDoc && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-x-8 gap-y-2 rounded-md border border-border bg-muted/30 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.06em]">
                <Meta label="Gate Pass" value={viewDoc.gatePass} />
                <Meta label="Seller" value={viewDoc.seller} />
                <Meta label="ASN" value={viewDoc.asn} />
                <Meta label="Warehouse" value={viewDoc.warehouseId} />
              </div>
              <div>
                <div className="mb-1.5 text-xs font-semibold">Lots</div>
                <div className="overflow-hidden rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Lot</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Pack size</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead className="text-right">Boxes</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewDoc.lots.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="font-mono text-xs">{l.id}</TableCell>
                          <TableCell className="font-mono text-xs">{l.sku}</TableCell>
                          <TableCell className="text-right tabular-nums">{l.packSize}</TableCell>
                          <TableCell className="font-mono text-xs">{l.batch}</TableCell>
                          <TableCell className="text-right tabular-nums">{l.boxCount}</TableCell>
                          <TableCell className="text-right tabular-nums">{l.qty}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-xs font-semibold">Boxes</div>
                <div className="max-h-64 overflow-y-auto rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Box ID</TableHead>
                        <TableHead>LPN</TableHead>
                        <TableHead>QC</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewDoc.boxes.map((b) => (
                        <TableRow key={b.boxId}>
                          <TableCell className="font-mono text-xs">{b.boxId}</TableCell>
                          <TableCell className="font-mono text-xs">{b.lpn || "—"}</TableCell>
                          <TableCell>
                            <QcBadge qc={b.qc} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewDoc(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
