import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, Filter, Search, Truck, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// ─── Filters ──────────────────────────────────────────────────────────────────

const ALL = "all";

interface ShiplistFilters {
  search: string;
  seller: string;
  courier: string;
  closedBy: string;
  exceptions: string;
}

const emptyFilters: ShiplistFilters = {
  search: "",
  seller: ALL,
  courier: ALL,
  closedBy: ALL,
  exceptions: ALL,
};

// ─── Screen ───────────────────────────────────────────────────────────────────

function ViewDispatchPage() {
  const [viewRow, setViewRow] = useState<ShiplistRow | null>(null);
  const [filters, setFilters] = useState<ShiplistFilters>(emptyFilters);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const setField = <K extends keyof ShiplistFilters>(
    key: K,
    value: ShiplistFilters[K],
  ) => setFilters((f) => ({ ...f, [key]: value }));

  const resetFilters = () => setFilters(emptyFilters);

  const sellerOptions = useMemo(
    () => Array.from(new Set(SHIPLISTS.map((r) => r.seller))).sort(),
    [],
  );
  const courierOptions = useMemo(
    () => Array.from(new Set(SHIPLISTS.map((r) => r.courier))).sort(),
    [],
  );
  const closedByOptions = useMemo(
    () => Array.from(new Set(SHIPLISTS.map((r) => r.closedBy))).sort(),
    [],
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.seller !== ALL) n++;
    if (filters.courier !== ALL) n++;
    if (filters.closedBy !== ALL) n++;
    if (filters.exceptions !== ALL) n++;
    return n;
  }, [filters]);

  const visible = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return SHIPLISTS.filter((r) => {
      if (q) {
        const hay = `${r.id} ${r.gatePass} ${r.seller} ${r.courier} ${r.closedBy}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.seller !== ALL && r.seller !== filters.seller) return false;
      if (filters.courier !== ALL && r.courier !== filters.courier) return false;
      if (filters.closedBy !== ALL && r.closedBy !== filters.closedBy)
        return false;
      if (filters.exceptions === "with" && r.exceptions === 0) return false;
      if (filters.exceptions === "none" && r.exceptions > 0) return false;
      return true;
    });
  }, [filters]);

  return (
    <div>
      <PageHeader
        title="View Shiplists"
        subtitle="Review closed handovers with their proof-of-handover summary."
        actions={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(e) => setField("search", e.target.value)}
                placeholder="Search shiplist, gate pass, seller…"
                className="h-9 w-60 pl-8"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => setField("search", "")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <Filter className="h-3.5 w-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="rounded-[3px] bg-primary px-1.5 py-0.5 font-mono text-[10px] font-medium leading-none text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0" align="end" sideOffset={8}>
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <div className="text-sm font-semibold">Filter shiplists</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={resetFilters}
                    disabled={activeFilterCount === 0}
                  >
                    Reset
                  </Button>
                </div>
                <div className="max-h-[60vh] space-y-3 overflow-y-auto p-4">
                  <FilterField label="Seller">
                    <Select
                      value={filters.seller}
                      onValueChange={(v) => setField("seller", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        {sellerOptions.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FilterField>

                  <FilterField label="Courier">
                    <Select
                      value={filters.courier}
                      onValueChange={(v) => setField("courier", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        {courierOptions.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FilterField>

                  <FilterField label="Closed By">
                    <Select
                      value={filters.closedBy}
                      onValueChange={(v) => setField("closedBy", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        {closedByOptions.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FilterField>

                  <FilterField label="Exceptions">
                    <Select
                      value={filters.exceptions}
                      onValueChange={(v) => setField("exceptions", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        <SelectItem value="with">With exceptions</SelectItem>
                        <SelectItem value="none">No exceptions</SelectItem>
                      </SelectContent>
                    </Select>
                  </FilterField>
                </div>
                <div className="border-t border-border px-4 py-2.5">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => setPopoverOpen(false)}
                  >
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </>
        }
      />

      <div className="space-y-4 p-6">
        <div className="rounded-md border border-border bg-card">
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
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No shiplists match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((r) => (
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
              <span className="inline-flex items-center rounded-[2px] border border-ok/30 bg-ok-bg px-1.5 py-0.5 text-[9.5px] font-medium font-mono uppercase tracking-[0.06em] text-ok">
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
      <div className="text-[11px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
