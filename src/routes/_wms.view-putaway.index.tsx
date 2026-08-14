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

export const Route = createFileRoute("/_wms/view-putaway/")({
  head: () => ({
    meta: [{ title: "View Putaway — Inbound" }],
  }),
  component: ViewPutawayPage,
});

// ─── Types & mock data ────────────────────────────────────────────────────────

type PutawayStatus = "Open" | "Closed";

type DocType = "GRN" | "Sales Return";

interface PutawayRow {
  id: string;
  status: PutawayStatus;
  docType: DocType;
  putawayQty: number;
  createdBy: string;
  createdAt: string;
  closedAt: string;
}

const INITIAL_PUTAWAYS: PutawayRow[] = [
  {
    id: "PA-40118",
    status: "Open",
    docType: "GRN",
    putawayQty: 120,
    createdBy: "Ramesh Kumar",
    createdAt: "16/06/2026 09:40",
    closedAt: "—",
  },
  {
    id: "PA-40119",
    status: "Open",
    docType: "Sales Return",
    putawayQty: 48,
    createdBy: "Pooja Sharma",
    createdAt: "16/06/2026 10:05",
    closedAt: "—",
  },
  {
    id: "PA-40120",
    status: "Closed",
    docType: "GRN",
    putawayQty: 240,
    createdBy: "Sita Devi",
    createdAt: "15/06/2026 18:20",
    closedAt: "15/06/2026 20:10",
  },
  {
    id: "PA-40121",
    status: "Closed",
    docType: "Sales Return",
    putawayQty: 16,
    createdBy: "Arjun Mehta",
    createdAt: "15/06/2026 16:40",
    closedAt: "15/06/2026 17:25",
  },
  {
    id: "PA-40122",
    status: "Open",
    docType: "GRN",
    putawayQty: 96,
    createdBy: "Ramesh Kumar",
    createdAt: "16/06/2026 07:30",
    closedAt: "—",
  },
  {
    id: "PA-40123",
    status: "Closed",
    docType: "GRN",
    putawayQty: 150,
    createdBy: "Vikas Chauhan",
    createdAt: "14/06/2026 14:12",
    closedAt: "14/06/2026 16:00",
  },
];

const STATUS_BADGE: Record<PutawayStatus, string> = {
  Open: "bg-ai-bg text-ai border-ai/30",
  Closed: "bg-ok-bg text-ok border-ok/30",
};

const STATUSES: PutawayStatus[] = ["Open", "Closed"];
const DOC_TYPES: DocType[] = ["GRN", "Sales Return"];

// ─── Screen ───────────────────────────────────────────────────────────────────

const ALL = "all";

interface PutawayFilters {
  search: string;
  status: string;
  docType: string;
  createdBy: string;
}

const emptyFilters: PutawayFilters = {
  search: "",
  status: ALL,
  docType: ALL,
  createdBy: ALL,
};

function ViewPutawayPage() {
  const [rows] = useState<PutawayRow[]>(INITIAL_PUTAWAYS);
  const [filters, setFilters] = useState<PutawayFilters>(emptyFilters);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const setField = <K extends keyof PutawayFilters>(
    key: K,
    value: PutawayFilters[K],
  ) => setFilters((f) => ({ ...f, [key]: value }));

  const resetFilters = () => setFilters(emptyFilters);

  const createdByOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.createdBy))).sort(),
    [rows],
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.status !== ALL) n++;
    if (filters.docType !== ALL) n++;
    if (filters.createdBy !== ALL) n++;
    return n;
  }, [filters]);

  const visible = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q) {
        const hay = `${r.id} ${r.docType} ${r.createdBy}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.status !== ALL && r.status !== filters.status) return false;
      if (filters.docType !== ALL && r.docType !== filters.docType) return false;
      if (filters.createdBy !== ALL && r.createdBy !== filters.createdBy)
        return false;
      return true;
    });
  }, [rows, filters]);

  return (
    <div>
      <PageHeader
        title="View Putaway"
        subtitle="Review putaway tasks raised from GRNs and sales returns."
        actions={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(e) => setField("search", e.target.value)}
                placeholder="Search putaway, doc type, creator…"
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
                  <div className="text-sm font-semibold">Filter putaway</div>
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
                  <PutawayFilterField label="Status">
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
                  </PutawayFilterField>

                  <PutawayFilterField label="Document Type">
                    <Select
                      value={filters.docType}
                      onValueChange={(v) => setField("docType", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        {DOC_TYPES.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </PutawayFilterField>

                  <PutawayFilterField label="Created By">
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
                  </PutawayFilterField>
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
                <TableHead>Putaway Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead className="text-right">Putaway Qty</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Closed At</TableHead>
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
                    No putaway tasks match the current filters.
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
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                        {r.docType}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.putawayQty}
                    </TableCell>
                    <TableCell>{r.createdBy}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {r.createdAt}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {r.closedAt === "—" ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        r.closedAt
                      )}
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
                            to="/view-putaway/$putawayId"
                            params={{ putawayId: r.id }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Details
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

function PutawayFilterField({
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
