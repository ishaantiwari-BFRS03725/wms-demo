import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  Filter,
  Info,
  Search,
  Settings,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/wms/page-header";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_wms/replenishment")({
  head: () => ({
    meta: [{ title: "Replenishment — Inventory" }],
  }),
  component: Replenishment,
});

const ALL = "all";

// Operators a replenishment job can be assigned to.
const OPERATORS = [
  "Ravi Kumar",
  "Anita Desai",
  "Mohit Sharma",
  "Priya Nair",
  "Sandeep Roy",
];

// Illustrative trend series for the summary sparklines (last 7 days).
const PENDING_JOBS_SERIES = [6, 5, 7, 6, 8, 5, 4];
const PENDING_ORDERS_SERIES = [180, 210, 195, 230, 205, 240, 209];
const PENDING_QTY_SERIES = [320, 360, 340, 400, 380, 420, 360];

// ─── Columns (with hover explanations) ───────────────────────────────────────

const COLUMNS: {
  key: string;
  label: string;
  help?: string;
  align?: "right";
}[] = [
  {
    key: "orderNo",
    label: "RO No",
    help: "Replenishment Order number — unique reference for this job, generated when the trigger fires.",
  },
  {
    key: "status",
    label: "Status",
    help: "Where the job stands — Open (not yet assigned), Job Assigned, Completed, or Cancelled.",
  },
  {
    key: "sku",
    label: "SKU",
    help: "Stock-keeping unit code of the item that needs replenishing.",
  },
  {
    key: "description",
    label: "Description",
    // No tooltip on this column.
  },
  {
    key: "orderCount",
    label: "Order Count",
    help: "Number of open customer orders waiting on this item — drives how urgent the top-up is.",
    align: "right",
  },
  {
    key: "qtyAvailable",
    label: "Qty Available",
    help: "Units currently available in the pick-face location for this SKU.",
    align: "right",
  },
  {
    key: "packSize",
    label: "Pack Size",
    help: "Units per pack/case for this SKU — replenishment moves in whole packs.",
    align: "right",
  },
  {
    key: "suggestedQty",
    label: "Suggested Qty",
    help: "Quantity the system recommends moving, rounded to pack size to refill up to Max.",
    align: "right",
  },
  {
    key: "replenishmentBin",
    label: "Replenishment Bin",
    help: "Source location (reserve / bulk storage) the stock is pulled from.",
  },
  {
    key: "allocatedBin",
    label: "Allocated Bin",
    help: "Destination pick-face location the stock is moved into.",
  },
];

// ─── Mock data ───────────────────────────────────────────────────────────────

type RepStatus = "Open" | "Job Assigned" | "Completed" | "Cancelled";

interface RepRow {
  orderNo: string;
  status: RepStatus;
  assignee?: string;
  sku: string;
  description: string;
  orderCount: number;
  qtyAvailable: number;
  packSize: number;
  suggestedQty: number;
  replenishmentBin: string;
  allocatedBin: string;
}

const ROWS: RepRow[] = [
  {
    orderNo: "REP-20460",
    status: "Open",
    sku: "600179",
    description: "boAt Airdopes 141 TWS Earbuds",
    orderCount: 34,
    qtyAvailable: 12,
    packSize: 10,
    suggestedQty: 90,
    replenishmentBin: "RSV-A-04-02",
    allocatedBin: "PF-12-03",
  },
  {
    orderNo: "REP-20461",
    status: "Completed",
    assignee: "Anita Desai",
    sku: "600822",
    description: "boAt Rockerz 450 Bluetooth Headphones",
    orderCount: 18,
    qtyAvailable: 6,
    packSize: 5,
    suggestedQty: 45,
    replenishmentBin: "RSV-B-01-07",
    allocatedBin: "PF-08-01",
  },
  {
    orderNo: "REP-20462",
    status: "Open",
    sku: "600868",
    description: "boAt Bassheads 100 Wired Earphones",
    orderCount: 52,
    qtyAvailable: 9,
    packSize: 15,
    suggestedQty: 60,
    replenishmentBin: "RSV-A-02-05",
    allocatedBin: "PF-04-06",
  },
  {
    orderNo: "REP-20463",
    status: "Cancelled",
    sku: "600900",
    description: "boAt Stone 350 Bluetooth Speaker",
    orderCount: 7,
    qtyAvailable: 4,
    packSize: 8,
    suggestedQty: 32,
    replenishmentBin: "RSV-C-03-01",
    allocatedBin: "PF-15-02",
  },
  {
    orderNo: "REP-20464",
    status: "Completed",
    assignee: "Ravi Kumar",
    sku: "601000",
    description: "boAt Wave Call Smartwatch",
    orderCount: 23,
    qtyAvailable: 11,
    packSize: 12,
    suggestedQty: 48,
    replenishmentBin: "RSV-B-04-03",
    allocatedBin: "PF-09-04",
  },
  {
    orderNo: "REP-20465",
    status: "Open",
    sku: "601002",
    description: "boAt Type-C 500 Charging Cable",
    orderCount: 88,
    qtyAvailable: 22,
    packSize: 30,
    suggestedQty: 120,
    replenishmentBin: "RSV-A-06-09",
    allocatedBin: "PF-02-07",
  },
  {
    orderNo: "REP-20466",
    status: "Job Assigned",
    assignee: "Mohit Sharma",
    sku: "601005",
    description: "boAt Aavante Bar 1160 Soundbar",
    orderCount: 5,
    qtyAvailable: 3,
    packSize: 5,
    suggestedQty: 25,
    replenishmentBin: "RSV-C-01-02",
    allocatedBin: "PF-18-01",
  },
];

const STATUS_STYLES: Record<RepStatus, string> = {
  Open: "bg-warn-bg text-warn border-warn/30",
  "Job Assigned": "bg-sys-bg text-sys border-sys/30",
  Completed: "bg-ok-bg text-ok border-ok/30",
  Cancelled: "bg-risk-bg text-risk border-risk/30",
};

// ─── Filters ─────────────────────────────────────────────────────────────────

interface Filters {
  search: string;
  status: string;
  sku: string;
  replenishmentBin: string;
  allocatedBin: string;
  orderCountMin: string;
  orderCountMax: string;
  qtyAvailableMin: string;
  qtyAvailableMax: string;
  packSizeMin: string;
  packSizeMax: string;
  suggestedQtyMin: string;
  suggestedQtyMax: string;
}

const emptyFilters: Filters = {
  search: "",
  status: ALL,
  sku: ALL,
  replenishmentBin: ALL,
  allocatedBin: ALL,
  orderCountMin: "",
  orderCountMax: "",
  qtyAvailableMin: "",
  qtyAvailableMax: "",
  packSizeMin: "",
  packSizeMax: "",
  suggestedQtyMin: "",
  suggestedQtyMax: "",
};

function Replenishment() {
  const [rows, setRows] = useState<RepRow[]>(ROWS);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assignee, setAssignee] = useState("");

  const setField = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  // Dropdown options derived from the data. SKU options carry the item
  // description so the dropdown is searchable by both code and name.
  const skuOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of ROWS) if (!seen.has(r.sku)) seen.set(r.sku, r.description);
    return Array.from(seen, ([value, name]) => ({
      value,
      label: `${value} — ${name}`,
    })).sort((a, b) => a.value.localeCompare(b.value));
  }, []);
  const replenishmentBinOptions = useMemo(
    () => Array.from(new Set(ROWS.map((r) => r.replenishmentBin))).sort(),
    [],
  );
  const allocatedBinOptions = useMemo(
    () => Array.from(new Set(ROWS.map((r) => r.allocatedBin))).sort(),
    [],
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.status !== ALL) n++;
    if (filters.sku !== ALL) n++;
    if (filters.replenishmentBin !== ALL) n++;
    if (filters.allocatedBin !== ALL) n++;
    if (filters.orderCountMin !== "" || filters.orderCountMax !== "") n++;
    if (filters.qtyAvailableMin !== "" || filters.qtyAvailableMax !== "") n++;
    if (filters.packSizeMin !== "" || filters.packSizeMax !== "") n++;
    if (filters.suggestedQtyMin !== "" || filters.suggestedQtyMax !== "") n++;
    return n;
  }, [filters]);

  const inRange = (v: number, min: string, max: string) => {
    if (min !== "" && v < Number(min)) return false;
    if (max !== "" && v > Number(max)) return false;
    return true;
  };

  const visible = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q) {
        const hay =
          `${r.orderNo} ${r.sku} ${r.description} ${r.replenishmentBin} ${r.allocatedBin}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.status !== ALL && r.status !== filters.status) return false;
      if (filters.sku !== ALL && r.sku !== filters.sku) return false;
      if (
        filters.replenishmentBin !== ALL &&
        r.replenishmentBin !== filters.replenishmentBin
      )
        return false;
      if (
        filters.allocatedBin !== ALL &&
        r.allocatedBin !== filters.allocatedBin
      )
        return false;
      if (!inRange(r.orderCount, filters.orderCountMin, filters.orderCountMax))
        return false;
      if (
        !inRange(
          r.qtyAvailable,
          filters.qtyAvailableMin,
          filters.qtyAvailableMax,
        )
      )
        return false;
      if (!inRange(r.packSize, filters.packSizeMin, filters.packSizeMax))
        return false;
      if (
        !inRange(
          r.suggestedQty,
          filters.suggestedQtyMin,
          filters.suggestedQtyMax,
        )
      )
        return false;
      return true;
    });
  }, [rows, filters]);

  // Pending = work still to be done (open or assigned, not completed/cancelled).
  const pendingJobs = rows.filter(
    (r) => r.status === "Open" || r.status === "Job Assigned",
  );
  const pendingOrders = pendingJobs.reduce((s, r) => s + r.orderCount, 0);
  const pendingQty = pendingJobs.reduce((s, r) => s + r.suggestedQty, 0);

  // Selection only applies to Open (assignable) jobs that are currently visible.
  const openVisible = visible.filter((r) => r.status === "Open");
  const selectedCount = selectedIds.size;
  const allOpenSelected =
    openVisible.length > 0 &&
    openVisible.every((r) => selectedIds.has(r.orderNo));
  const headerChecked: boolean | "indeterminate" = allOpenSelected
    ? true
    : selectedCount > 0
      ? "indeterminate"
      : false;

  const toggleRow = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelectedIds((prev) => {
      if (openVisible.every((r) => prev.has(r.orderNo))) return new Set();
      return new Set(openVisible.map((r) => r.orderNo));
    });

  const assignSelected = () => {
    if (!assignee) {
      toast.error("Pick an operator to assign to");
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        selectedIds.has(r.orderNo)
          ? { ...r, status: "Job Assigned", assignee }
          : r,
      ),
    );
    toast.success(
      `${selectedCount} job${selectedCount > 1 ? "s" : ""} assigned to ${assignee}`,
    );
    setSelectedIds(new Set());
    setAssignee("");
  };

  const resetFilters = () => setFilters(emptyFilters);
  const clearSearch = () => setField("search", "");

  return (
    <div>
      <PageHeader
        title="Replenishment"
        subtitle={`${visible.length} of ${rows.length} replenishment jobs shown`}
        actions={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search RO no, SKU, bin…"
                value={filters.search}
                onChange={(e) => setField("search", e.target.value)}
                className="h-9 w-64 pl-8 pr-8"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
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
            <PopoverContent className="w-[360px] p-0" align="end" sideOffset={8}>
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <div className="text-sm font-semibold">
                  Filter replenishment jobs
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
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Job Assigned">Job Assigned</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </FilterField>

                <FilterField label="SKU">
                  <SearchableSelect
                    value={filters.sku}
                    options={skuOptions}
                    placeholder="All"
                    searchPlaceholder="Search SKU…"
                    emptyText="No SKU found."
                    onChange={(v) => setField("sku", v)}
                  />
                </FilterField>

                <FilterField label="Order Count">
                  <RangeInputs
                    minValue={filters.orderCountMin}
                    maxValue={filters.orderCountMax}
                    onMin={(v) => setField("orderCountMin", v)}
                    onMax={(v) => setField("orderCountMax", v)}
                  />
                </FilterField>

                <FilterField label="Qty Available">
                  <RangeInputs
                    minValue={filters.qtyAvailableMin}
                    maxValue={filters.qtyAvailableMax}
                    onMin={(v) => setField("qtyAvailableMin", v)}
                    onMax={(v) => setField("qtyAvailableMax", v)}
                  />
                </FilterField>

                <FilterField label="Pack Size">
                  <RangeInputs
                    minValue={filters.packSizeMin}
                    maxValue={filters.packSizeMax}
                    onMin={(v) => setField("packSizeMin", v)}
                    onMax={(v) => setField("packSizeMax", v)}
                  />
                </FilterField>

                <FilterField label="Suggested Qty">
                  <RangeInputs
                    minValue={filters.suggestedQtyMin}
                    maxValue={filters.suggestedQtyMax}
                    onMin={(v) => setField("suggestedQtyMin", v)}
                    onMax={(v) => setField("suggestedQtyMax", v)}
                  />
                </FilterField>

                <FilterField label="Replenishment Bin">
                  <Select
                    value={filters.replenishmentBin}
                    onValueChange={(v) => setField("replenishmentBin", v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>All</SelectItem>
                      {replenishmentBinOptions.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterField>

                <FilterField label="Allocated Bin">
                  <Select
                    value={filters.allocatedBin}
                    onValueChange={(v) => setField("allocatedBin", v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>All</SelectItem>
                      {allocatedBinOptions.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
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
            <Button variant="outline" size="sm" className="h-9" asChild>
              <Link to="/replenishment-setup">
                <Settings className="mr-1.5 h-4 w-4" />
                Setup
              </Link>
            </Button>
          </>
        }
      />

      <div className="p-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TrendCard
          label="Pending Jobs"
          value={pendingJobs.length}
          delta={-7.4}
          series={PENDING_JOBS_SERIES}
          tone="warn"
        />
        <TrendCard
          label="Pending Orders"
          value={pendingOrders}
          delta={6.2}
          series={PENDING_ORDERS_SERIES}
          tone="sys"
        />
        <TrendCard
          label="Pending Quantity"
          value={pendingQty}
          suffix="units"
          delta={5.1}
          series={PENDING_QTY_SERIES}
          tone="ok"
        />
      </div>

      {/* Assignment toolbar — appears when one or more open jobs are selected */}
      {selectedCount > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-primary/30 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-medium">
            {selectedCount} job{selectedCount > 1 ? "s" : ""} selected
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue placeholder="Assign to…" />
              </SelectTrigger>
              <SelectContent>
                {OPERATORS.map((op) => (
                  <SelectItem key={op} value={op}>
                    {op}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={assignSelected}>
              <UserPlus className="mr-1.5 h-4 w-4" />
              Assign
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <TooltipProvider delayDuration={150}>
        <div className="mt-5 overflow-hidden rounded-md border border-border bg-card [&>div]:max-h-[calc(100vh-12rem)] [&>div]:overflow-auto">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="bg-muted [&>th]:sticky [&>th]:top-0 [&>th]:z-20 [&>th]:bg-muted [&>th]:align-middle [&>th]:shadow-[inset_0_-1px_0_hsl(var(--border))]">
                <TableHead className="w-10">
                  <Checkbox
                    checked={headerChecked}
                    onCheckedChange={toggleAll}
                    disabled={openVisible.length === 0}
                    aria-label="Select all open jobs"
                  />
                </TableHead>
                {COLUMNS.map((c) => (
                  <TableHead key={c.key}>
                    {c.help ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className={cn(
                              "flex w-full cursor-help items-center gap-1 leading-tight",
                              c.align === "right" && "justify-end",
                            )}
                          >
                            {c.label}
                            <Info className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          align="center"
                          className="max-w-[240px] text-left"
                        >
                          {c.help}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span
                        className={cn(
                          "flex w-full items-center leading-tight",
                          c.align === "right" && "justify-end",
                        )}
                      >
                        {c.label}
                      </span>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={COLUMNS.length + 1}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No replenishment jobs match the current filters.
                  </TableCell>
                </TableRow>
              )}
              {visible.map((r) => {
                const selectable = r.status === "Open";
                return (
                  <TableRow
                    key={r.orderNo}
                    data-state={
                      selectedIds.has(r.orderNo) ? "selected" : undefined
                    }
                    className="align-top hover:bg-muted/50 data-[state=selected]:bg-primary/5"
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(r.orderNo)}
                        onCheckedChange={() => toggleRow(r.orderNo)}
                        disabled={!selectable}
                        aria-label={`Select ${r.orderNo}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      {r.orderNo}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center whitespace-nowrap rounded-[2px] border px-1.5 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em]",
                          STATUS_STYLES[r.status],
                        )}
                      >
                        {r.status}
                      </span>
                      {r.assignee && (
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {r.assignee}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">{r.sku}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.description}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.orderCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.qtyAvailable}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.packSize}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {r.suggestedQty}
                    </TableCell>
                    <TableCell className="break-words font-mono text-xs">
                      {r.replenishmentBin}
                    </TableCell>
                    <TableCell className="break-words font-mono text-xs">
                      {r.allocatedBin}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </TooltipProvider>
      </div>
    </div>
  );
}

// ─── Small building blocks ───────────────────────────────────────────────────

const TONES: Record<string, { stroke: string; fill: string }> = {
  sys: { stroke: "#2d5aa8", fill: "#2d5aa8" },
  ok: { stroke: "#2e7a4e", fill: "#2e7a4e" },
  warn: { stroke: "#a86b1a", fill: "#a86b1a" },
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"];

function Sparkline({ series, color }: { series: number[]; color: string }) {
  const w = 96;
  const h = 36;
  const max = Math.max(...series);
  const min = Math.min(...series);
  const span = max - min || 1;
  const step = w / (series.length - 1);
  const pts = series.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const gid = `spark-${color.replace("#", "")}`;
  const offset = series.length - DAY_LABELS.length;
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="relative shrink-0" style={{ width: w, height: h }}>
      <svg width={w} height={h} className="overflow-visible">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#${gid})`} />
        {hover !== null && (
          <line
            x1={pts[hover][0]}
            x2={pts[hover][0]}
            y1="0"
            y2={h}
            stroke={color}
            strokeWidth="0.75"
            strokeDasharray="2 2"
            opacity="0.5"
          />
        )}
        <polyline
          points={line}
          fill="none"
          stroke={color}
          strokeWidth="1.75"
          strokeDasharray="1.5 3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {pts.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={hover === i ? 3 : 1.6}
            fill={hover === i ? color : "#fff"}
            stroke={color}
            strokeWidth="1.25"
          />
        ))}
        {pts.map(([x], i) => {
          const prevX = i === 0 ? 0 : pts[i - 1][0];
          const nextX = i === pts.length - 1 ? w : pts[i + 1][0];
          const left = i === 0 ? 0 : (prevX + x) / 2;
          const right = i === pts.length - 1 ? w : (x + nextX) / 2;
          return (
            <rect
              key={`hit-${i}`}
              x={left}
              y={0}
              width={right - left}
              height={h}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[10px] font-medium leading-tight text-background shadow-md"
          style={{ left: pts[hover][0], top: pts[hover][1] - 6 }}
        >
          <span className="opacity-70">
            {DAY_LABELS[hover - offset] ?? `Day ${hover + 1}`}:{" "}
          </span>
          {series[hover]}
        </div>
      )}
    </div>
  );
}

function TrendCard({
  label,
  value,
  suffix,
  delta,
  series,
  tone,
}: {
  label: string;
  value: number;
  suffix?: string;
  delta: number;
  series: number[];
  tone: keyof typeof TONES;
}) {
  const up = delta >= 0;
  const color = TONES[tone].stroke;
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-4">
      <div className="min-w-0">
        <div className="text-[11px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tabular-nums">{value}</span>
          {suffix && (
            <span className="text-xs text-muted-foreground">{suffix}</span>
          )}
        </div>
        <div
          className={cn(
            "mt-1 inline-flex items-center gap-0.5 text-xs font-medium",
            up ? "text-ok" : "text-risk",
          )}
        >
          {up ? "▲" : "▼"} {Math.abs(delta)}%
          <span className="ml-1 font-normal text-muted-foreground">
            vs last week
          </span>
        </div>
      </div>
      <Sparkline series={series} color={color} />
    </div>
  );
}

function SearchableSelect({
  value,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel =
    value === ALL
      ? placeholder
      : (options.find((o) => o.value === value)?.label ?? value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 w-full justify-between gap-2 font-normal"
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => {
                  onChange(ALL);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === ALL ? "opacity-100" : "opacity-0",
                  )}
                />
                {placeholder}
              </CommandItem>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.label}
                  onSelect={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === o.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {o.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function RangeInputs({
  minValue,
  maxValue,
  onMin,
  onMax,
}: {
  minValue: string;
  maxValue: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={0}
        placeholder="Min"
        value={minValue}
        onChange={(e) => onMin(e.target.value)}
        className="h-9 flex-1"
      />
      <span className="text-xs text-muted-foreground">–</span>
      <Input
        type="number"
        min={0}
        placeholder="Max"
        value={maxValue}
        onChange={(e) => onMax(e.target.value)}
        className="h-9 flex-1"
      />
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
