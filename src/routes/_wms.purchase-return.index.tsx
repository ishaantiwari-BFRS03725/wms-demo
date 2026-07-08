import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Filter, Search, X } from "lucide-react";
import { PageHeader } from "@/components/wms/page-header";
import { StatusBadge } from "@/components/wms/status-badge";
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
import { fmtTimestamp, orders } from "@/lib/wms/mock-data";

export const Route = createFileRoute("/_wms/purchase-return/")({
  head: () => ({
    meta: [
      { title: "Purchase Return — WMS" },
      {
        name: "description",
        content: "Return-to-vendor (RTV) purchase returns awaiting processing.",
      },
    ],
  }),
  component: PurchaseReturnPage,
});

// The RTV reference is derived deterministically from the source order number
// so the demo list stays stable across reloads.
const rtvNo = (orderNo: string) => orderNo.replace(/^WMS-/, "RTV-");

interface Filters {
  search: string;
  seller: string;
  status: string;
  qtyMin: string;
  qtyMax: string;
  createdFrom: string;
  createdTo: string;
}

const emptyFilters: Filters = {
  search: "",
  seller: "all",
  status: "all",
  qtyMin: "",
  qtyMax: "",
  createdFrom: "",
  createdTo: "",
};

const ALL = "all";

const STATUS_TABS: { key: string; label: string; status: string | null }[] = [
  { key: "created", label: "Pending", status: "created" },
  { key: "picked", label: "Picked", status: "picked" },
  { key: "packed", label: "Packed", status: "packed" },
  { key: "manifested", label: "Manifest", status: "manifested" },
  { key: ALL, label: "All", status: null },
];

function PurchaseReturnPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [statusTab, setStatusTab] = useState<string>(ALL);

  const sellerOptions = useMemo(
    () => Array.from(new Set(orders.map((o) => o.seller))).sort(),
    [],
  );

  const setField = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.seller !== ALL) n++;
    if (filters.status !== ALL) n++;
    if (filters.qtyMin !== "" || filters.qtyMax !== "") n++;
    if (filters.createdFrom !== "" || filters.createdTo !== "") n++;
    return n;
  }, [filters]);

  const baseFiltered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const qtyMin = filters.qtyMin === "" ? null : Number(filters.qtyMin);
    const qtyMax = filters.qtyMax === "" ? null : Number(filters.qtyMax);
    const from = filters.createdFrom ? new Date(filters.createdFrom) : null;
    const to = filters.createdTo
      ? new Date(`${filters.createdTo}T23:59:59`)
      : null;

    return orders.filter((o) => {
      if (q) {
        const hay = `${rtvNo(o.orderNo)} ${o.seller}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.seller !== ALL && o.seller !== filters.seller) return false;
      if (filters.status !== ALL && o.status !== filters.status) return false;
      if (qtyMin !== null && o.totalQuantity < qtyMin) return false;
      if (qtyMax !== null && o.totalQuantity > qtyMax) return false;
      const created = new Date(o.createdAt);
      if (from && created < from) return false;
      if (to && created > to) return false;
      return true;
    });
  }, [filters]);

  const filtered = useMemo(() => {
    if (statusTab === ALL) return baseFiltered;
    return baseFiltered.filter((o) => o.status === statusTab);
  }, [baseFiltered, statusTab]);

  const byStatus = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const o of baseFiltered) acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, [baseFiltered]);

  const resetFilters = () => setFilters(emptyFilters);
  const clearSearch = () => setField("search", "");

  return (
    <div>
      <PageHeader
        title="Purchase Return"
        subtitle={`${filtered.length} of ${orders.length} RTVs shown`}
        actions={
          <>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search RTV no, seller…"
                value={filters.search}
                onChange={(e) => setField("search", e.target.value)}
                className="h-9 w-64 pl-8 pr-8"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    activeFilterCount > 0 &&
                      "border-primary/40 bg-primary/5 text-primary",
                  )}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-[3px] bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[360px] p-0"
                align="end"
                sideOffset={8}
              >
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <div className="text-sm font-semibold">
                    Filter purchase returns
                  </div>
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

                  <FilterField label="Status">
                    <Select
                      value={filters.status}
                      onValueChange={(v) => setField("status", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        <SelectItem value="created">Pending</SelectItem>
                        <SelectItem value="picked">Picked</SelectItem>
                        <SelectItem value="packed">Packed</SelectItem>
                        <SelectItem value="manifested">Manifested</SelectItem>
                        <SelectItem value="dispatched">Dispatched</SelectItem>
                      </SelectContent>
                    </Select>
                  </FilterField>

                  <FilterField label="Quantity">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        placeholder="Min"
                        value={filters.qtyMin}
                        onChange={(e) => setField("qtyMin", e.target.value)}
                        className="h-9 flex-1"
                      />
                      <span className="text-xs text-muted-foreground">–</span>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Max"
                        value={filters.qtyMax}
                        onChange={(e) => setField("qtyMax", e.target.value)}
                        className="h-9 flex-1"
                      />
                    </div>
                  </FilterField>

                  <FilterField label="Created At">
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={filters.createdFrom}
                        onChange={(e) =>
                          setField("createdFrom", e.target.value)
                        }
                        className="h-9 flex-1"
                      />
                      <span className="text-xs text-muted-foreground">→</span>
                      <Input
                        type="date"
                        value={filters.createdTo}
                        onChange={(e) => setField("createdTo", e.target.value)}
                        className="h-9 flex-1"
                      />
                    </div>
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
      <div className="space-y-4 px-7 pb-14 pt-5">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-1 border-b border-border">
          {STATUS_TABS.map((t) => {
            const count =
              t.status === null
                ? baseFiltered.length
                : (byStatus[t.status] ?? 0);
            const isActive = statusTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setStatusTab(t.key)}
                className={cn(
                  "-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 font-mono text-xs uppercase tracking-[0.06em] transition-colors",
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "inline-flex h-5 min-w-[20px] items-center justify-center rounded-[3px] px-1.5 text-[11px] font-semibold tabular-nums",
                    isActive
                      ? "bg-primary/10 text-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative overflow-hidden rounded-md border border-border bg-card [&>div]:max-h-[calc(100vh-16rem)] [&>div]:overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted [&>th]:sticky [&>th]:top-0 [&>th]:z-20 [&>th]:bg-muted [&>th]:shadow-[inset_0_-1px_0_hsl(var(--border))]">
                <TableHead>RTV No.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No purchase returns match the current filters.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((o) => (
                <TableRow
                  key={o.orderNo}
                  onClick={() =>
                    navigate({
                      to: "/purchase-return/$rtvNo",
                      params: { rtvNo: rtvNo(o.orderNo) },
                    })
                  }
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                >
                  <TableCell className="font-medium">
                    <Link
                      to="/purchase-return/$rtvNo"
                      params={{ rtvNo: rtvNo(o.orderNo) }}
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {rtvNo(o.orderNo)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={o.status} />
                  </TableCell>
                  <TableCell>{o.seller}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {o.totalQuantity}
                  </TableCell>
                  <TableCell className="font-mono text-xs whitespace-nowrap">
                    {fmtTimestamp(new Date(o.createdAt))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
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
      <label className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
