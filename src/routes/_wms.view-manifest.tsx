import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, Filter, Printer, Search, Truck, X } from "lucide-react";
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
  created: "bg-status-created/15 text-status-created border-status-created/30",
  part_shipped: "bg-warn-bg text-warn border-warn/30",
  shipped: "bg-ok-bg text-ok border-ok/30",
};

// ─── Filters ──────────────────────────────────────────────────────────────────

const ALL = "all";

interface ManifestFilters {
  search: string;
  courier: string;
  createdBy: string;
}

const emptyFilters: ManifestFilters = {
  search: "",
  courier: ALL,
  createdBy: ALL,
};

// ─── Screen ───────────────────────────────────────────────────────────────────

function ViewManifestPage() {
  const [rows] = useState<ManifestRow[]>(INITIAL_MANIFESTS);
  const [tab, setTab] = useState<ManifestState>("created");
  const [viewRow, setViewRow] = useState<ManifestRow | null>(null);
  const [filters, setFilters] = useState<ManifestFilters>(emptyFilters);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const setField = <K extends keyof ManifestFilters>(
    key: K,
    value: ManifestFilters[K],
  ) => setFilters((f) => ({ ...f, [key]: value }));

  const resetFilters = () => setFilters(emptyFilters);

  const courierOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.courier))).sort(),
    [rows],
  );
  const createdByOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.createdBy))).sort(),
    [rows],
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.courier !== ALL) n++;
    if (filters.createdBy !== ALL) n++;
    return n;
  }, [filters]);

  const baseFiltered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q) {
        const hay = `${r.id} ${r.courier} ${r.createdBy}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.courier !== ALL && r.courier !== filters.courier) return false;
      if (filters.createdBy !== ALL && r.createdBy !== filters.createdBy)
        return false;
      return true;
    });
  }, [rows, filters]);

  const counts = useMemo(() => {
    const c: Record<ManifestState, number> = {
      created: 0,
      part_shipped: 0,
      shipped: 0,
    };
    baseFiltered.forEach((r) => c[r.state]++);
    return c;
  }, [baseFiltered]);

  const visible = baseFiltered.filter((r) => r.state === tab);

  return (
    <div>
      <PageHeader
        title="View Manifests"
        subtitle="Review created manifests and track their shipping status."
        actions={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(e) => setField("search", e.target.value)}
                placeholder="Search manifest, courier, creator…"
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
                  <div className="text-sm font-semibold">Filter manifests</div>
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

                  <FilterField label="Created By">
                    <Select
                      value={filters.createdBy}
                      onValueChange={(v) => setField("createdBy", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        {createdByOptions.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
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
                    "rounded-[3px] px-2 py-0.5 font-mono text-[11px] font-medium",
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
        <div className="rounded-md border border-border bg-card">
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
                          "inline-flex items-center rounded-[2px] border px-1.5 py-0.5 text-[9.5px] font-medium font-mono uppercase tracking-[0.06em]",
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
                    "inline-flex items-center rounded-[2px] border px-1.5 py-0.5 text-[9.5px] font-medium font-mono uppercase tracking-[0.06em]",
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
