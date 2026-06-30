import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, Filter, Search, X } from "lucide-react";
import { PageHeader } from "@/components/wms/page-header";
import { Button } from "@/components/ui/button";
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

export const Route = createFileRoute("/_wms/view-grn/")({
  head: () => ({
    meta: [{ title: "View GRNs — Inbound" }],
  }),
  component: ViewGrnPage,
});

// ─── Types & mock data ────────────────────────────────────────────────────────

type GrnStatus = "Created" | "Open" | "Closed";

interface GrnRow {
  id: string;
  status: GrnStatus;
  seller: string;
  gateEntryNo: string;
  poNumber: string;
  expectedQty: number;
  grnQty: number;
  createdBy: string;
  createdAt: string;
}

const INITIAL_GRNS: GrnRow[] = [
  {
    id: "GRN-90041",
    status: "Created",
    seller: "boAt Lifestyle",
    gateEntryNo: "GE-22107",
    poNumber: "PO-55821",
    expectedQty: 480,
    grnQty: 0,
    createdBy: "Ramesh Kumar",
    createdAt: "16/06/2026 09:12",
  },
  {
    id: "GRN-90042",
    status: "Open",
    seller: "Noise India",
    gateEntryNo: "GE-22108",
    poNumber: "PO-55822",
    expectedQty: 320,
    grnQty: 145,
    createdBy: "Pooja Sharma",
    createdAt: "16/06/2026 09:20",
  },
  {
    id: "GRN-90043",
    status: "Open",
    seller: "Mamaearth",
    gateEntryNo: "GE-22110",
    poNumber: "PO-55830",
    expectedQty: 600,
    grnQty: 588,
    createdBy: "Arjun Mehta",
    createdAt: "16/06/2026 08:40",
  },
  {
    id: "GRN-90044",
    status: "Closed",
    seller: "boAt Lifestyle",
    gateEntryNo: "GE-22101",
    poNumber: "PO-55810",
    expectedQty: 240,
    grnQty: 240,
    createdBy: "Sita Devi",
    createdAt: "15/06/2026 17:50",
  },
  {
    id: "GRN-90045",
    status: "Closed",
    seller: "Noise India",
    gateEntryNo: "GE-22099",
    poNumber: "PO-55805",
    expectedQty: 150,
    grnQty: 148,
    createdBy: "Vikas Chauhan",
    createdAt: "15/06/2026 16:22",
  },
  {
    id: "GRN-90046",
    status: "Created",
    seller: "Mamaearth",
    gateEntryNo: "GE-22112",
    poNumber: "PO-55834",
    expectedQty: 96,
    grnQty: 0,
    createdBy: "Ramesh Kumar",
    createdAt: "16/06/2026 07:05",
  },
];

const STATUS_BADGE: Record<GrnStatus, string> = {
  Created: "bg-status-created/15 text-status-created border-status-created/30",
  Open: "bg-ai-bg text-ai border-ai/30",
  Closed: "bg-ok-bg text-ok border-ok/30",
};

const STATUSES: GrnStatus[] = ["Created", "Open", "Closed"];

// ─── Screen ───────────────────────────────────────────────────────────────────

const ALL = "all";

interface GrnFilters {
  search: string;
  status: string;
  seller: string;
  createdBy: string;
}

const emptyFilters: GrnFilters = {
  search: "",
  status: ALL,
  seller: ALL,
  createdBy: ALL,
};

function ViewGrnPage() {
  const [rows] = useState<GrnRow[]>(INITIAL_GRNS);
  const [filters, setFilters] = useState<GrnFilters>(emptyFilters);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const setField = <K extends keyof GrnFilters>(key: K, value: GrnFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const resetFilters = () => setFilters(emptyFilters);

  const sellerOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.seller))).sort(),
    [rows],
  );
  const createdByOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.createdBy))).sort(),
    [rows],
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.status !== ALL) n++;
    if (filters.seller !== ALL) n++;
    if (filters.createdBy !== ALL) n++;
    return n;
  }, [filters]);

  const visible = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q) {
        const hay = `${r.id} ${r.seller} ${r.gateEntryNo} ${r.poNumber} ${r.createdBy}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.status !== ALL && r.status !== filters.status) return false;
      if (filters.seller !== ALL && r.seller !== filters.seller) return false;
      if (filters.createdBy !== ALL && r.createdBy !== filters.createdBy)
        return false;
      return true;
    });
  }, [rows, filters]);

  return (
    <div>
      <PageHeader
        title="View GRNs"
        subtitle="Review goods-receipt notes across sellers and purchase orders."
        actions={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(e) => setField("search", e.target.value)}
                placeholder="Search GRN, seller, PO, gate entry…"
                className="h-9 w-64 pl-8"
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
                  <div className="text-sm font-semibold">Filter GRNs</div>
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
                  <GrnFilterField label="Status">
                    <Select
                      value={filters.status}
                      onValueChange={(v) => setField("status", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </GrnFilterField>

                  <GrnFilterField label="Seller">
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
                  </GrnFilterField>

                  <GrnFilterField label="Created By">
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
                  </GrnFilterField>
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
                <TableHead>GRN Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Gate Entry No</TableHead>
                <TableHead>PO Number</TableHead>
                <TableHead className="text-right">Expected Qty</TableHead>
                <TableHead className="text-right">GRN Qty</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created At</TableHead>
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
                    No GRNs match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.id}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-[3px] border px-2 py-0.5 text-[9.5px] font-medium font-mono uppercase tracking-[0.06em]",
                          STATUS_BADGE[r.status],
                        )}
                      >
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell>{r.seller}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.gateEntryNo}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.poNumber}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.expectedQty}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.grnQty}
                    </TableCell>
                    <TableCell>{r.createdBy}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {r.createdAt}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5"
                        >
                          <Link
                            to="/view-grn/$grnId"
                            params={{ grnId: r.id }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Link>
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
    </div>
  );
}

function GrnFilterField({
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
