import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, Truck } from "lucide-react";
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

export const Route = createFileRoute("/_wms/view-dispatch")({
  head: () => ({
    meta: [{ title: "View Shiplists — Outbound" }],
  }),
  component: ViewDispatchPage,
});

// ─── Types & mock data ────────────────────────────────────────────────────────

interface ShiplistRow {
  id: string;
  gatePass: string;
  seller: string;
  courier: keyof typeof courierStyles;
  manifests: number;
  shipments: number;
  exceptions: number;
  closedAt: string;
  closedBy: string;
}

const SHIPLISTS: ShiplistRow[] = [
  {
    id: "SHIP-4421B0",
    gatePass: "GP-A1B2",
    seller: "boAt Lifestyle",
    courier: "Delhivery",
    manifests: 2,
    shipments: 66,
    exceptions: 3,
    closedAt: "16/06/2026 07:25",
    closedBy: "Ramesh Kumar",
  },
  {
    id: "SHIP-4420A8",
    gatePass: "GP-C7D9",
    seller: "Noise Labs",
    courier: "XpressBees",
    manifests: 1,
    shipments: 28,
    exceptions: 0,
    closedAt: "16/06/2026 06:50",
    closedBy: "Sita Devi",
  },
  {
    id: "SHIP-4419F3",
    gatePass: "GP-E2F4",
    seller: "Mivi India",
    courier: "BlueDart",
    manifests: 3,
    shipments: 51,
    exceptions: 5,
    closedAt: "15/06/2026 18:45",
    closedBy: "Arjun Mehta",
  },
  {
    id: "SHIP-4418C1",
    gatePass: "GP-G8H0",
    seller: "boAt Lifestyle",
    courier: "Delhivery",
    manifests: 1,
    shipments: 19,
    exceptions: 1,
    closedAt: "15/06/2026 17:10",
    closedBy: "Pooja Sharma",
  },
  {
    id: "SHIP-4417B9",
    gatePass: "GP-J3K5",
    seller: "Noise Labs",
    courier: "XpressBees",
    manifests: 2,
    shipments: 37,
    exceptions: 2,
    closedAt: "15/06/2026 15:30",
    closedBy: "Vikas Chauhan",
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

function ViewDispatchPage() {
  const [viewRow, setViewRow] = useState<ShiplistRow | null>(null);

  return (
    <div>
      <PageHeader
        title="View Shiplists"
        subtitle="Review closed handovers with their proof-of-handover summary."
      />

      <div className="space-y-4 p-6">
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted [&>th]:sticky [&>th]:top-0 [&>th]:z-20 [&>th]:bg-muted [&>th]:shadow-[inset_0_-1px_0_hsl(var(--border))]">
                <TableHead>Shiplist No</TableHead>
                <TableHead>Gate Pass</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Courier</TableHead>
                <TableHead className="text-right">Manifests</TableHead>
                <TableHead className="text-right">Shipments</TableHead>
                <TableHead className="text-right">Exceptions</TableHead>
                <TableHead>Closed At</TableHead>
                <TableHead>Closed By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SHIPLISTS.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs font-medium">
                    {r.id}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {r.gatePass}
                  </TableCell>
                  <TableCell>{r.seller}</TableCell>
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
                    {r.manifests}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.shipments}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.exceptions > 0 ? (
                      <span className="text-amber-600">{r.exceptions}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {r.closedAt}
                  </TableCell>
                  <TableCell>{r.closedBy}</TableCell>
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
              ))}
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
              <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-600 ring-1 ring-inset ring-emerald-500/30">
                Closed
              </span>
            </DialogTitle>
            <DialogDescription>Proof of handover summary</DialogDescription>
          </DialogHeader>
          {viewRow && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Info label="Gate Pass" value={viewRow.gatePass} />
              <Info label="Seller" value={viewRow.seller} />
              <Info label="Courier" value={viewRow.courier} />
              <Info label="Manifests" value={String(viewRow.manifests)} />
              <Info label="Shipments" value={`${viewRow.shipments} units`} />
              <Info label="Exceptions" value={String(viewRow.exceptions)} />
              <Info label="Closed At" value={viewRow.closedAt} />
              <Info label="Closed By" value={viewRow.closedBy} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRow(null)}>
              Close
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
