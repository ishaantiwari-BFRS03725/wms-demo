import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, Filter, Search, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
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

export const Route = createFileRoute("/_wms/view-picklist/")({
  head: () => ({
    meta: [{ title: "View Picklists — Outbound" }],
  }),
  component: ViewPicklistPage,
});

// ─── Types & mock data ────────────────────────────────────────────────────────

type PicklistState = "open" | "in_progress" | "complete" | "hold";

type OrderType = "B2C" | "B2B" | "RTV" | "Kit Order";

type PickMethod = "Discrete" | "Batch" | "Cluster";

type PickStatus =
  | "Open"
  | "Assigned"
  | "In Progress"
  | "Part Picked"
  | "Picked"
  | "Cancelled";

interface PicklistRow {
  id: string;
  status: PickStatus;
  seller: string;
  channel: string;
  orderType: OrderType;
  totalQty: number;
  remainingQty: number;
  method: PickMethod;
  createdAt: string;
  assignedTo: string | null;
  updatedAt: string;
  state: PicklistState;
}

const OPERATORS = [
  "Ramesh Kumar",
  "Sita Devi",
  "Arjun Mehta",
  "Pooja Sharma",
  "Vikas Chauhan",
];

const INITIAL_PICKLISTS: PicklistRow[] = [
  {
    id: "PL-48201",
    status: "Open",
    seller: "boAt Lifestyle",
    channel: "Amazon",
    orderType: "B2C",
    totalQty: 120,
    remainingQty: 120,
    method: "Cluster",
    createdAt: "16/06/2026 09:12",
    assignedTo: null,
    updatedAt: "16/06/2026 09:12",
    state: "open",
  },
  {
    id: "PL-48202",
    status: "Assigned",
    seller: "Noise India",
    channel: "—",
    orderType: "B2B",
    totalQty: 64,
    remainingQty: 64,
    method: "Batch",
    createdAt: "16/06/2026 09:20",
    assignedTo: "Pooja Sharma",
    updatedAt: "16/06/2026 09:35",
    state: "open",
  },
  {
    id: "PL-48203",
    status: "In Progress",
    seller: "—",
    channel: "Shopify",
    orderType: "Kit Order",
    totalQty: 48,
    remainingQty: 22,
    method: "Discrete",
    createdAt: "16/06/2026 08:40",
    assignedTo: "Ramesh Kumar",
    updatedAt: "16/06/2026 10:05",
    state: "in_progress",
  },
  {
    id: "PL-48204",
    status: "Part Picked",
    seller: "—",
    channel: "—",
    orderType: "RTV",
    totalQty: 90,
    remainingQty: 37,
    method: "Cluster",
    createdAt: "16/06/2026 08:15",
    assignedTo: "Sita Devi",
    updatedAt: "16/06/2026 10:18",
    state: "in_progress",
  },
  {
    id: "PL-48205",
    status: "Picked",
    seller: "boAt Lifestyle",
    channel: "Amazon",
    orderType: "B2C",
    totalQty: 56,
    remainingQty: 0,
    method: "Batch",
    createdAt: "15/06/2026 17:50",
    assignedTo: "Arjun Mehta",
    updatedAt: "16/06/2026 07:30",
    state: "complete",
  },
  {
    id: "PL-48206",
    status: "Picked",
    seller: "—",
    channel: "Flipkart",
    orderType: "B2B",
    totalQty: 32,
    remainingQty: 0,
    method: "Discrete",
    createdAt: "15/06/2026 16:22",
    assignedTo: "Pooja Sharma",
    updatedAt: "15/06/2026 18:40",
    state: "complete",
  },
  {
    id: "PL-48207",
    status: "Cancelled",
    seller: "Mamaearth",
    channel: "—",
    orderType: "Kit Order",
    totalQty: 74,
    remainingQty: 74,
    method: "Cluster",
    createdAt: "16/06/2026 07:05",
    assignedTo: null,
    updatedAt: "16/06/2026 09:48",
    state: "hold",
  },
];

const TABS: Array<{ key: PicklistState; label: string }> = [
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "complete", label: "Complete" },
  { key: "hold", label: "Hold" },
];

const STATUS_BADGE: Record<PickStatus, string> = {
  Open: "bg-status-created/15 text-status-created ring-status-created/30",
  Assigned: "bg-sky-500/15 text-sky-600 ring-sky-500/30",
  "In Progress": "bg-status-picked/15 text-status-picked ring-status-picked/30",
  "Part Picked": "bg-violet-500/15 text-violet-600 ring-violet-500/30",
  Picked: "bg-emerald-500/15 text-emerald-600 ring-emerald-500/30",
  Cancelled: "bg-destructive/15 text-destructive ring-destructive/30",
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const ALL = "all";

interface PickFilters {
  search: string;
  status: string;
  seller: string;
  channel: string;
  orderType: string;
  method: string;
  assignedTo: string;
}

const emptyFilters: PickFilters = {
  search: "",
  status: ALL,
  seller: ALL,
  channel: ALL,
  orderType: ALL,
  method: ALL,
  assignedTo: ALL,
};

function ViewPicklistPage() {
  const [rows, setRows] = useState<PicklistRow[]>(INITIAL_PICKLISTS);
  const [tab, setTab] = useState<PicklistState>("open");
  const [filters, setFilters] = useState<PickFilters>(emptyFilters);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [assignRow, setAssignRow] = useState<PicklistRow | null>(null);
  const [assignTo, setAssignTo] = useState<string>("");

  const setField = <K extends keyof PickFilters>(
    key: K,
    value: PickFilters[K],
  ) => setFilters((f) => ({ ...f, [key]: value }));

  const resetFilters = () => setFilters(emptyFilters);

  // Distinct dropdown options derived from the data (dash = clubbed)
  const sellerOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.seller))).sort(),
    [rows],
  );
  const channelOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.channel))).sort(),
    [rows],
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.status !== ALL) n++;
    if (filters.seller !== ALL) n++;
    if (filters.channel !== ALL) n++;
    if (filters.orderType !== ALL) n++;
    if (filters.method !== ALL) n++;
    if (filters.assignedTo !== ALL) n++;
    return n;
  }, [filters]);

  // Everything except the tab — tab counts derive from this so each tab shows
  // how many filtered picklists it holds.
  const baseFiltered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q) {
        const hay = `${r.id} ${r.seller} ${r.channel} ${r.assignedTo ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.status !== ALL && r.status !== filters.status) return false;
      if (filters.seller !== ALL && r.seller !== filters.seller) return false;
      if (filters.channel !== ALL && r.channel !== filters.channel) return false;
      if (filters.orderType !== ALL && r.orderType !== filters.orderType)
        return false;
      if (filters.method !== ALL && r.method !== filters.method) return false;
      if (filters.assignedTo !== ALL) {
        if (filters.assignedTo === "Unassigned") {
          if (r.assignedTo) return false;
        } else if (r.assignedTo !== filters.assignedTo) return false;
      }
      return true;
    });
  }, [rows, filters]);

  const counts = useMemo(() => {
    const c: Record<PicklistState, number> = {
      open: 0,
      in_progress: 0,
      complete: 0,
      hold: 0,
    };
    baseFiltered.forEach((r) => c[r.state]++);
    return c;
  }, [baseFiltered]);

  const visible = baseFiltered.filter((r) => r.state === tab);

  const openAssign = (row: PicklistRow) => {
    setAssignRow(row);
    setAssignTo(row.assignedTo ?? "");
  };

  const confirmAssign = () => {
    if (!assignRow || !assignTo) return;
    const now = nowStamp();
    setRows((prev) =>
      prev.map((r) =>
        r.id === assignRow.id
          ? {
              ...r,
              assignedTo: assignTo,
              updatedAt: now,
              // Assigning an open picklist moves it into progress
              state: r.state === "open" ? "in_progress" : r.state,
            }
          : r,
      ),
    );
    toast.success(
      `${assignRow.id} ${assignRow.assignedTo ? "re-assigned" : "assigned"} to ${assignTo}`,
    );
    setAssignRow(null);
  };

  return (
    <div>
      <PageHeader
        title="View Picklists"
        subtitle="Review created picklists, and assign or re-assign them to operators."
        actions={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(e) => setField("search", e.target.value)}
                placeholder="Search ID, seller, operator…"
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
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0" align="end" sideOffset={8}>
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <div className="text-sm font-semibold">Filter picklists</div>
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
                  <PickFilterField label="Status">
                    <Select
                      value={filters.status}
                      onValueChange={(v) => setField("status", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        {(
                          [
                            "Open",
                            "Assigned",
                            "In Progress",
                            "Part Picked",
                            "Picked",
                            "Cancelled",
                          ] as PickStatus[]
                        ).map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </PickFilterField>

                  <PickFilterField label="Order Type">
                    <Select
                      value={filters.orderType}
                      onValueChange={(v) => setField("orderType", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        {(
                          ["B2C", "B2B", "RTV", "Kit Order"] as OrderType[]
                        ).map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </PickFilterField>

                  <PickFilterField label="Method">
                    <Select
                      value={filters.method}
                      onValueChange={(v) => setField("method", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        {(["Discrete", "Batch", "Cluster"] as PickMethod[]).map(
                          (m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </PickFilterField>

                  <PickFilterField label="Seller">
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
                            {s === "—" ? "— (Clubbed)" : s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </PickFilterField>

                  <PickFilterField label="Channel">
                    <Select
                      value={filters.channel}
                      onValueChange={(v) => setField("channel", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        {channelOptions.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c === "—" ? "— (Clubbed)" : c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </PickFilterField>

                  <PickFilterField label="Assigned To">
                    <Select
                      value={filters.assignedTo}
                      onValueChange={(v) => setField("assignedTo", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        <SelectItem value="Unassigned">Unassigned</SelectItem>
                        {OPERATORS.map((op) => (
                          <SelectItem key={op} value={op}>
                            {op}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </PickFilterField>
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
                <TableHead>Picklist ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Order Type</TableHead>
                <TableHead className="text-right">Total Qty</TableHead>
                <TableHead className="text-right">Remaining Qty</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No picklists in this tab.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.id}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset",
                          STATUS_BADGE[r.status],
                        )}
                      >
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {r.seller === "—" ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        r.seller
                      )}
                    </TableCell>
                    <TableCell>
                      {r.channel === "—" ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        r.channel
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                        {r.orderType}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.totalQty}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.remainingQty}
                    </TableCell>
                    <TableCell>{r.method}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {r.createdAt}
                    </TableCell>
                    <TableCell>
                      {r.assignedTo ?? (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {r.updatedAt}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5"
                        >
                          <Link
                            to="/view-picklist/$picklistId"
                            params={{ picklistId: r.id }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5"
                          disabled={r.state === "complete"}
                          onClick={() => openAssign(r)}
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          {r.assignedTo ? "Re-assign" : "Assign"}
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

      {/* Assign dialog */}
      <Dialog open={!!assignRow} onOpenChange={(o) => !o && setAssignRow(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {assignRow?.assignedTo ? "Re-assign picklist" : "Assign picklist"}
            </DialogTitle>
            <DialogDescription>
              {assignRow?.id} ·{" "}
              {assignRow?.assignedTo
                ? `Currently with ${assignRow.assignedTo}`
                : "Currently unassigned"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Operator
            </label>
            <Select value={assignTo} onValueChange={setAssignTo}>
              <SelectTrigger>
                <SelectValue placeholder="Select operator…" />
              </SelectTrigger>
              <SelectContent>
                {OPERATORS.map((op) => (
                  <SelectItem key={op} value={op}>
                    {op}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignRow(null)}>
              Cancel
            </Button>
            <Button
              disabled={!assignTo || assignTo === assignRow?.assignedTo}
              onClick={confirmAssign}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PickFilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function nowStamp() {
  return new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
