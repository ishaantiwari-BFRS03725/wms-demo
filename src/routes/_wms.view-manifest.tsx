import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, Printer, Truck } from "lucide-react";
import { PageHeader } from "@/components/wms/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { courierStyles } from "@/lib/wms/manifest-data";

export const Route = createFileRoute("/_wms/view-manifest")({
  head: () => ({
    meta: [{ title: "View Manifests — Outbound" }],
  }),
  component: ViewManifestPage,
});

// ─── Types & mock data ────────────────────────────────────────────────────────

type ManifestState = "created" | "part_shipped" | "shipped";

interface ManifestRow {
  id: string;
  state: ManifestState;
  manifestDate: string;
  courier: keyof typeof courierStyles;
  shipments: number;
  createdBy: string;
  updatedAt: string;
}

const INITIAL_MANIFESTS: ManifestRow[] = [
  {
    id: "MNFST-7A3C9F12",
    state: "created",
    manifestDate: "16/06/2026",
    courier: "Delhivery",
    shipments: 42,
    createdBy: "Ramesh Kumar",
    updatedAt: "16/06/2026 09:05",
  },
  {
    id: "MNFST-5B81D0A4",
    state: "created",
    manifestDate: "16/06/2026",
    courier: "XpressBees",
    shipments: 28,
    createdBy: "Sita Devi",
    updatedAt: "16/06/2026 09:18",
  },
  {
    id: "MNFST-9E22F7C3",
    state: "part_shipped",
    manifestDate: "16/06/2026",
    courier: "BlueDart",
    shipments: 15,
    createdBy: "Arjun Mehta",
    updatedAt: "16/06/2026 10:02",
  },
  {
    id: "MNFST-2C44A9B1",
    state: "part_shipped",
    manifestDate: "15/06/2026",
    courier: "Delhivery",
    shipments: 33,
    createdBy: "Pooja Sharma",
    updatedAt: "16/06/2026 07:10",
  },
  {
    id: "MNFST-6F90E5D7",
    state: "shipped",
    manifestDate: "15/06/2026",
    courier: "XpressBees",
    shipments: 19,
    createdBy: "Vikas Chauhan",
    updatedAt: "15/06/2026 18:45",
  },
  {
    id: "MNFST-1D77B3E8",
    state: "shipped",
    manifestDate: "15/06/2026",
    courier: "BlueDart",
    shipments: 24,
    createdBy: "Ramesh Kumar",
    updatedAt: "15/06/2026 17:02",
  },
];

const TABS: Array<{ key: ManifestState; label: string }> = [
  { key: "created", label: "Created" },
  { key: "part_shipped", label: "Part Shipped" },
  { key: "shipped", label: "Shipped" },
];

const STATE_BADGE: Record<ManifestState, string> = {
  created: "bg-status-created/15 text-status-created ring-status-created/30",
  part_shipped: "bg-amber-500/15 text-amber-600 ring-amber-500/30",
  shipped: "bg-emerald-500/15 text-emerald-600 ring-emerald-500/30",
};

// ─── Screen ───────────────────────────────────────────────────────────────────

function ViewManifestPage() {
  const [rows] = useState<ManifestRow[]>(INITIAL_MANIFESTS);
  const [tab, setTab] = useState<ManifestState>("created");
  const [viewRow, setViewRow] = useState<ManifestRow | null>(null);

  const counts = useMemo(() => {
    const c: Record<ManifestState, number> = {
      created: 0,
      part_shipped: 0,
      shipped: 0,
    };
    rows.forEach((r) => c[r.state]++);
    return c;
  }, [rows]);

  const visible = rows.filter((r) => r.state === tab);

  return (
    <div>
      <PageHeader
        title="View Manifests"
        subtitle="Review created manifests and track their shipping status."
      />

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
                  "inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    active
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {counts[t.key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted [&>th]:sticky [&>th]:top-0 [&>th]:z-20 [&>th]:bg-muted [&>th]:shadow-[inset_0_-1px_0_hsl(var(--border))]">
                <TableHead>Manifest Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Manifest Date</TableHead>
                <TableHead>Courier</TableHead>
                <TableHead className="text-right">Shipments</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No manifests in this tab.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs font-medium">
                      {r.id}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset",
                          STATE_BADGE[r.state],
                        )}
                      >
                        {TABS.find((t) => t.key === r.state)?.label}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {r.manifestDate}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold",
                          courierStyles[r.courier],
                        )}
                      >
                        <Truck className="h-2.5 w-2.5" />
                        {r.courier}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.shipments}
                    </TableCell>
                    <TableCell>{r.createdBy}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {r.updatedAt}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5"
                          onClick={() => setViewRow(r)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* View dialog */}
      <Dialog open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono text-base">
              {viewRow?.id}
              {viewRow && (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset",
                    STATE_BADGE[viewRow.state],
                  )}
                >
                  {TABS.find((t) => t.key === viewRow.state)?.label}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>Manifest details</DialogDescription>
          </DialogHeader>
          {viewRow && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Info label="Manifest Date" value={viewRow.manifestDate} />
              <Info label="Courier" value={viewRow.courier} />
              <Info
                label="No of Shipments"
                value={`${viewRow.shipments} units`}
              />
              <Info label="Created By" value={viewRow.createdBy} />
              <Info label="Updated At" value={viewRow.updatedAt} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRow(null)}>
              Close
            </Button>
            <Button>
              <Printer className="mr-2 h-4 w-4" />
              Reprint Sticker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}
