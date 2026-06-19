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

export const Route = createFileRoute("/_wms/view-pack/")({
  head: () => ({
    meta: [{ title: "View Packlists — Outbound" }],
  }),
  component: ViewPackPage,
});

// ─── Types & mock data ────────────────────────────────────────────────────────

type PackState = "open" | "part_packed" | "packed";

interface PackRow {
  id: string;
  channel: string;
  orderNo: string;
  courier: string;
  sla: "Same Day" | "Next Day" | "Standard";
  totalQty: number;
  remainingQty: number;
  assignedTo: string | null;
  createdAt: string;
  closedAt: string | null;
  state: PackState;
}

const OPERATORS = [
  "Ramesh Kumar",
  "Sita Devi",
  "Arjun Mehta",
  "Pooja Sharma",
  "Vikas Chauhan",
];

const INITIAL_PACKS: PackRow[] = [
  {
    id: "PK-90431",
    channel: "Amazon",
    orderNo: "AMZ-100231",
    courier: "Delhivery",
    sla: "Same Day",
    totalQty: 12,
    remainingQty: 12,
    assignedTo: null,
    createdAt: "16/06/2026 09:14",
    closedAt: null,
    state: "open",
  },
  {
    id: "PK-90432",
    channel: "Flipkart",
    orderNo: "FK-558120",
    courier: "Ekart",
    sla: "Next Day",
    totalQty: 8,
    remainingQty: 8,
    assignedTo: null,
    createdAt: "16/06/2026 09:22",
    closedAt: null,
    state: "open",
  },
  {
    id: "PK-90433",
    channel: "Shopify",
    orderNo: "SHP-204417",
    courier: "Blue Dart",
    sla: "Standard",
    totalQty: 20,
    remainingQty: 9,
    assignedTo: "Ramesh Kumar",
    createdAt: "16/06/2026 08:48",
    closedAt: null,
    state: "part_packed",
  },
  {
    id: "PK-90434",
    channel: "Myntra",
    orderNo: "MYN-330295",
    courier: "Delhivery",
    sla: "Next Day",
    totalQty: 15,
    remainingQty: 6,
    assignedTo: "Sita Devi",
    createdAt: "16/06/2026 08:20",
    closedAt: null,
    state: "part_packed",
  },
  {
    id: "PK-90435",
    channel: "Amazon",
    orderNo: "AMZ-100118",
    courier: "Ekart",
    sla: "Same Day",
    totalQty: 10,
    remainingQty: 0,
    assignedTo: "Arjun Mehta",
    createdAt: "15/06/2026 17:40",
    closedAt: "16/06/2026 07:25",
    state: "packed",
  },
  {
    id: "PK-90436",
    channel: "Flipkart",
    orderNo: "FK-557904",
    courier: "Blue Dart",
    sla: "Standard",
    totalQty: 6,
    remainingQty: 0,
    assignedTo: "Pooja Sharma",
    createdAt: "15/06/2026 16:10",
    closedAt: "15/06/2026 18:32",
    state: "packed",
  },
];

const TABS: Array<{ key: PackState; label: string }> = [
  { key: "open", label: "Open" },
  { key: "part_packed", label: "Part Packed" },
  { key: "packed", label: "Packed" },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

const ALL = "all";

interface PackFilters {
  search: string;
  channel: string;
  courier: string;
  sla: string;
  assignedTo: string;
}

const emptyFilters: PackFilters = {
  search: "",
  channel: ALL,
  courier: ALL,
  sla: ALL,
  assignedTo: ALL,
};

function ViewPackPage() {
  const [rows, setRows] = useState<PackRow[]>(INITIAL_PACKS);
  const [tab, setTab] = useState<PackState>("open");
  const [assignRow, setAssignRow] = useState<PackRow | null>(null);
  const [assignTo, setAssignTo] = useState<string>("");
  const [filters, setFilters] = useState<PackFilters>(emptyFilters);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const setField = <K extends keyof PackFilters>(
    key: K,
    value: PackFilters[K],
  ) => setFilters((f) => ({ ...f, [key]: value }));

  const resetFilters = () => setFilters(emptyFilters);

  const channelOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.channel))).sort(),
    [rows],
  );
  const courierOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.courier))).sort(),
    [rows],
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.channel !== ALL) n++;
    if (filters.courier !== ALL) n++;
    if (filters.sla !== ALL) n++;
    if (filters.assignedTo !== ALL) n++;
    return n;
  }, [filters]);

  const baseFiltered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q) {
        const hay = `${r.id} ${r.channel} ${r.orderNo} ${r.courier} ${r.assignedTo ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.channel !== ALL && r.channel !== filters.channel) return false;
      if (filters.courier !== ALL && r.courier !== filters.courier) return false;
      if (filters.sla !== ALL && r.sla !== filters.sla) return false;
      if (filters.assignedTo !== ALL) {
        if (filters.assignedTo === "Unassigned") {
          if (r.assignedTo) return false;
        } else if (r.assignedTo !== filters.assignedTo) return false;
      }
      return true;
    });
  }, [rows, filters]);

  const counts = useMemo(() => {
    const c: Record<PackState, number> = {
      open: 0,
      part_packed: 0,
      packed: 0,
    };
    baseFiltered.forEach((r) => c[r.state]++);
    return c;
  }, [baseFiltered]);

  const visible = baseFiltered.filter((r) => r.state === tab);

  const openAssign = (row: PackRow) => {
    setAssignRow(row);
    setAssignTo(row.assignedTo ?? "");
  };

  const confirmAssign = () => {
    if (!assignRow || !assignTo) return;
    setRows((prev) =>
      prev.map((r) =>
        r.id === assignRow.id ? { ...r, assignedTo: assignTo } : r,
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
        title="View Packlists"
        subtitle="Review packlists, and assign or re-assign them to operators."
        actions={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(e) => setField("search", e.target.value)}
                placeholder="Search packlist, order, operator…"
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
                  <div className="text-sm font-semibold">Filter packlists</div>
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
                  <FilterField label="Channel">
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
                            {c}
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

                  <FilterField label="SLA">
                    <Select
                      value={filters.sla}
                      onValueChange={(v) => setField("sla", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        {(["Same Day", "Next Day", "Standard"] as const).map(
                          (s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </FilterField>

                  <FilterField label="Assigned To">
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
                    "rounded-[3px] px-1.5 py-0.5 font-mono text-[10px] font-medium",
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
                <TableHead>Packlist No</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Order No</TableHead>
                <TableHead>Courier</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead className="text-right">Total Qty</TableHead>
                <TableHead className="text-right">Remaining Qty</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Closed At</TableHead>
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
                    No packlists in this tab.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.id}</TableCell>
                    <TableCell>{r.channel}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.orderNo}
                    </TableCell>
                    <TableCell>{r.courier}</TableCell>
                    <TableCell>{r.sla}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.totalQty}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.remainingQty}
                    </TableCell>
                    <TableCell>
                      {r.assignedTo ?? (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {r.createdAt}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {r.closedAt ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
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
                            to="/view-pack/$packlistId"
                            params={{ packlistId: r.id }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5"
                          disabled={r.state === "packed"}
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
              {assignRow?.assignedTo ? "Re-assign packlist" : "Assign packlist"}
            </DialogTitle>
            <DialogDescription>
              {assignRow?.id} ·{" "}
              {assignRow?.assignedTo
                ? `Currently with ${assignRow.assignedTo}`
                : "Currently unassigned"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
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
