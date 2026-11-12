import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, Filter, Plus, Search, X } from "lucide-react";
import { PageHeader } from "@/components/wms/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { PRE_GRN_STATUSES, listPreGrnDocs, type PreGrnStatus } from "@/lib/wms/pre-grn-data";

export const Route = createFileRoute("/_wms/pre-grn/")({
  head: () => ({
    meta: [{ title: "Pre-GRN — Inbound" }],
  }),
  component: PreGrnListPage,
});

const STATUS_BADGE: Record<PreGrnStatus, string> = {
  Open: "bg-ai-bg text-ai border-ai/30",
  Closed: "bg-ok-bg text-ok border-ok/30",
};

const ALL = "all";

interface PreGrnFilters {
  search: string;
  status: string;
  seller: string;
  createdBy: string;
}

const emptyFilters: PreGrnFilters = {
  search: "",
  status: ALL,
  seller: ALL,
  createdBy: ALL,
};

function PreGrnListPage() {
  const rows = listPreGrnDocs();
  const [filters, setFilters] = useState<PreGrnFilters>(emptyFilters);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const setField = <K extends keyof PreGrnFilters>(key: K, value: PreGrnFilters[K]) =>
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
        const hay = `${r.id} ${r.seller} ${r.asnId} ${r.poNumber} ${r.createdBy}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.status !== ALL && r.status !== filters.status) return false;
      if (filters.seller !== ALL && r.seller !== filters.seller) return false;
      if (filters.createdBy !== ALL && r.createdBy !== filters.createdBy) return false;
      return true;
    });
  }, [rows, filters]);

  return (
    <div>
      <PageHeader
        title="Pre-GRN"
        subtitle="Case-pack lots captured at segregation, with one Box ID issued per box."
        actions={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(e) => setField("search", e.target.value)}
                placeholder="Search Pre-GRN, seller, ASN, PO…"
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
                  <div className="text-sm font-semibold">Filter Pre-GRNs</div>
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
                  <FilterField label="Status">
                    <Select value={filters.status} onValueChange={(v) => setField("status", v)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        {PRE_GRN_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FilterField>

                  <FilterField label="Seller">
                    <Select value={filters.seller} onValueChange={(v) => setField("seller", v)}>
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
                  <Button size="sm" className="w-full" onClick={() => setPopoverOpen(false)}>
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Button asChild size="sm" className="h-9 gap-1.5">
              <Link to="/pre-grn/new">
                <Plus className="h-3.5 w-3.5" />
                New Pre-GRN
              </Link>
            </Button>
          </>
        }
      />

      <div className="space-y-4 p-6">
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted [&>th]:sticky [&>th]:top-0 [&>th]:z-20 [&>th]:bg-muted [&>th]:shadow-[inset_0_-1px_0_hsl(var(--border))]">
                <TableHead>Pre-GRN No</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>ASN</TableHead>
                <TableHead>PO Number</TableHead>
                <TableHead className="text-right">Lots</TableHead>
                <TableHead className="text-right">Boxes</TableHead>
                <TableHead className="text-right">Total Qty</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No Pre-GRNs match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap font-medium">{r.id}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-[3px] border px-2 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em]",
                          STATUS_BADGE[r.status],
                        )}
                      >
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell>{r.seller}</TableCell>
                    <TableCell className="font-mono text-xs">{r.asnId}</TableCell>
                    <TableCell className="font-mono text-xs">{r.poNumber}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.lots.length}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.boxCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.totalQty}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.createdBy}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {r.createdAt}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end">
                        <Button asChild variant="outline" size="sm" className="h-8 gap-1.5">
                          <Link to="/pre-grn/$preGrnId" params={{ preGrnId: r.id }}>
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

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
