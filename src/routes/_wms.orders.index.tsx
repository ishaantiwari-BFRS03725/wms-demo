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
import {
  fmtSlaRemaining,
  fmtTimestamp,
  orders,
  slaDeadline,
} from "@/lib/wms/mock-data";
import type { Order } from "@/lib/wms/mock-data";

export const Route = createFileRoute("/_wms/orders/")({
  head: () => ({
    meta: [
      { title: "Orders — WMS Outbound" },
      {
        name: "description",
        content:
          "All outbound orders queued for pick, pack, manifest, and dispatch.",
      },
    ],
  }),
  component: OrdersPage,
});

interface Filters {
  search: string;
  orderType: string;
  city: string;
  state: string;
  channel: string;
  seller: string;
  courier: string;
  sla: string;
  paymentMode: string;
  status: string;
  qtyMin: string;
  qtyMax: string;
  createdFrom: string;
  createdTo: string;
}

const emptyFilters: Filters = {
  search: "",
  orderType: "all",
  city: "all",
  state: "all",
  channel: "all",
  seller: "all",
  courier: "all",
  sla: "all",
  paymentMode: "all",
  status: "all",
  qtyMin: "",
  qtyMax: "",
  createdFrom: "",
  createdTo: "",
};

const ALL = "all";

// Illustrative trend series for the dashboard sparklines (last 7 days).
const ORDERS_TODAY_SERIES = [6, 9, 7, 12, 10, 14, 18];
const WEEK_ORDERS_SERIES = [42, 55, 48, 61, 53, 67, 72];
const WEEK_ORDERS_TOTAL = WEEK_ORDERS_SERIES.reduce((a, b) => a + b, 0);
const UNITS_SERIES = [120, 98, 110, 132, 105, 96, 88];

// Destination city/state shown for B2B orders only (deterministic by order no).
const B2B_DESTINATIONS: { city: string; state: string }[] = [
  { city: "Mumbai", state: "Maharashtra" },
  { city: "Bengaluru", state: "Karnataka" },
  { city: "Delhi", state: "Delhi" },
  { city: "Hyderabad", state: "Telangana" },
  { city: "Chennai", state: "Tamil Nadu" },
  { city: "Pune", state: "Maharashtra" },
  { city: "Ahmedabad", state: "Gujarat" },
  { city: "Kolkata", state: "West Bengal" },
  { city: "Jaipur", state: "Rajasthan" },
  { city: "Lucknow", state: "Uttar Pradesh" },
];

function destinationFor(o: Order): { city: string; state: string } | null {
  if (o.orderType !== "B2B") return null;
  let h = 0;
  for (let i = 0; i < o.orderNo.length; i++) h = (h * 31 + o.orderNo.charCodeAt(i)) >>> 0;
  return B2B_DESTINATIONS[h % B2B_DESTINATIONS.length];
}

// Status tabs shown above the table. `status: null` means "no status filter".
const STATUS_TABS: { key: string; label: string; status: string | null }[] = [
  { key: "created", label: "Open", status: "created" },
  { key: "picked", label: "Picked", status: "picked" },
  { key: "packed", label: "Packed", status: "packed" },
  { key: "manifested", label: "Manifest", status: "manifested" },
  { key: ALL, label: "All", status: null },
];

function OrdersPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [statusTab, setStatusTab] = useState<string>(ALL);

  // Distinct sellers from the dataset, for the seller dropdown
  const sellerOptions = useMemo(
    () => Array.from(new Set(orders.map((o) => o.seller))).sort(),
    [],
  );

  // City / State options — only B2B orders carry a destination, so derive from
  // the destinations actually present in the dataset.
  const cityOptions = useMemo(
    () =>
      Array.from(
        new Set(
          orders.map((o) => destinationFor(o)?.city).filter(Boolean) as string[],
        ),
      ).sort(),
    [],
  );
  const stateOptions = useMemo(
    () =>
      Array.from(
        new Set(
          orders
            .map((o) => destinationFor(o)?.state)
            .filter(Boolean) as string[],
        ),
      ).sort(),
    [],
  );

  const setField = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  // Count of currently active non-search filters (the search field already
  // has its own visible chip, so excluded here)
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.orderType !== ALL) n++;
    if (filters.city !== ALL) n++;
    if (filters.state !== ALL) n++;
    if (filters.channel !== ALL) n++;
    if (filters.seller !== ALL) n++;
    if (filters.courier !== ALL) n++;
    if (filters.sla !== ALL) n++;
    if (filters.paymentMode !== ALL) n++;
    if (filters.status !== ALL) n++;
    if (filters.qtyMin !== "" || filters.qtyMax !== "") n++;
    if (filters.createdFrom !== "" || filters.createdTo !== "") n++;
    return n;
  }, [filters]);

  // Base set — everything except the status tab. Tab counts & cards derive
  // from this so each tab shows how many orders clicking it would reveal.
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
        const hay =
          `${o.orderNo} ${o.extOrderNo} ${o.items.map((i) => `${i.sku} ${i.name}`).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.orderType !== ALL && o.orderType !== filters.orderType)
        return false;
      if (filters.city !== ALL || filters.state !== ALL) {
        const dest = destinationFor(o);
        if (filters.city !== ALL && dest?.city !== filters.city) return false;
        if (filters.state !== ALL && dest?.state !== filters.state) return false;
      }
      if (filters.channel !== ALL && o.channel !== filters.channel) return false;
      if (filters.seller !== ALL && o.seller !== filters.seller) return false;
      if (filters.courier !== ALL && o.courier !== filters.courier) return false;
      if (filters.sla !== ALL && o.sla !== filters.sla) return false;
      if (filters.paymentMode !== ALL && o.paymentMode !== filters.paymentMode)
        return false;
      if (filters.status !== ALL && o.status !== filters.status) return false;
      if (qtyMin !== null && o.totalQuantity < qtyMin) return false;
      if (qtyMax !== null && o.totalQuantity > qtyMax) return false;
      const created = new Date(o.createdAt);
      if (from && created < from) return false;
      if (to && created > to) return false;
      return true;
    });
  }, [filters]);

  // Apply the active status tab on top of the base set.
  const filtered = useMemo(() => {
    if (statusTab === ALL) return baseFiltered;
    return baseFiltered.filter((o) => o.status === statusTab);
  }, [baseFiltered, statusTab]);

  // Summary metrics for the dashboard cards + tab badges.
  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    let units = 0;
    let overdue = 0;
    for (const o of baseFiltered) {
      byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
      units += o.totalQuantity;
      const rem = fmtSlaRemaining(slaDeadline(o.createdAt, o.sla));
      if (rem.overdue) overdue += 1;
    }
    return { total: baseFiltered.length, units, overdue, byStatus };
  }, [baseFiltered]);

  const resetFilters = () => setFilters(emptyFilters);
  const clearSearch = () => setField("search", "");

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={`${filtered.length} of ${orders.length} orders shown`}
        actions={
          <>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search order no, SKU…"
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
                    <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
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
                  <div className="text-sm font-semibold">Filter orders</div>
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
                  <FilterField label="Order Type">
                    <Select
                      value={filters.orderType}
                      onValueChange={(v) => setField("orderType", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        <SelectItem value="B2C">B2C</SelectItem>
                        <SelectItem value="B2B">B2B</SelectItem>
                      </SelectContent>
                    </Select>
                  </FilterField>

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
                        <SelectItem value="Amazon">Amazon</SelectItem>
                        <SelectItem value="Flipkart">Flipkart</SelectItem>
                        <SelectItem value="Shopify">Shopify</SelectItem>
                        <SelectItem value="Myntra">Myntra</SelectItem>
                      </SelectContent>
                    </Select>
                  </FilterField>

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
                        <SelectItem value="Delhivery">Delhivery</SelectItem>
                        <SelectItem value="BlueDart">BlueDart</SelectItem>
                        <SelectItem value="XpressBees">XpressBees</SelectItem>
                        <SelectItem value="Ecom Express">Ecom Express</SelectItem>
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
                        <SelectItem value="Same Day">Same Day</SelectItem>
                        <SelectItem value="Next Day">Next Day</SelectItem>
                        <SelectItem value="Standard">Standard</SelectItem>
                      </SelectContent>
                    </Select>
                  </FilterField>

                  <FilterField label="Payment Mode">
                    <Select
                      value={filters.paymentMode}
                      onValueChange={(v) => setField("paymentMode", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        <SelectItem value="Prepaid">Prepaid</SelectItem>
                        <SelectItem value="COD">COD</SelectItem>
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
                        <SelectItem value="created">Created</SelectItem>
                        <SelectItem value="picked">Picked</SelectItem>
                        <SelectItem value="packed">Packed</SelectItem>
                        <SelectItem value="manifested">Manifested</SelectItem>
                        <SelectItem value="dispatched">Dispatched</SelectItem>
                      </SelectContent>
                    </Select>
                  </FilterField>

                  <FilterField label="Total Quantity">
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

                  <FilterField label="City">
                    <Select
                      value={filters.city}
                      onValueChange={(v) => setField("city", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        {cityOptions.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FilterField>

                  <FilterField label="State">
                    <Select
                      value={filters.state}
                      onValueChange={(v) => setField("state", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All</SelectItem>
                        {stateOptions.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
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
        {/* Dashboard trend cards (Shopify-style) */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TrendCard
            label="Open orders today"
            value={stats.byStatus.created ?? 0}
            suffix="new"
            delta={12.5}
            series={ORDERS_TODAY_SERIES}
            tone="blue"
          />
          <TrendCard
            label="Orders received (7 days)"
            value={WEEK_ORDERS_TOTAL}
            delta={8.2}
            series={WEEK_ORDERS_SERIES}
            tone="violet"
          />
          <TrendCard
            label="Units to fulfil"
            value={stats.units}
            delta={-4.1}
            series={UNITS_SERIES}
            tone="amber"
          />
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-1 border-b border-border">
          {STATUS_TABS.map((t) => {
            const count =
              t.status === null ? stats.total : (stats.byStatus[t.status] ?? 0);
            const isActive = statusTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setStatusTab(t.key)}
                className={cn(
                  "-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-lg border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted [&>th]:sticky [&>th]:top-0 [&>th]:z-20 [&>th]:bg-muted [&>th]:shadow-[inset_0_-1px_0_hsl(var(--border))]">
                <TableHead>Order No</TableHead>
                <TableHead>Ext Order No</TableHead>
                <TableHead>Order Type</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Courier</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>City</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Payment Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Quantity</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={13}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No orders match the current filters.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((o) => {
                const deadline = slaDeadline(o.createdAt, o.sla);
                const rem = fmtSlaRemaining(deadline);
                const dest = destinationFor(o);
                return (
                  <TableRow
                    key={o.orderNo}
                    onClick={() =>
                      navigate({
                        to: "/orders/$orderNo",
                        params: { orderNo: o.orderNo },
                      })
                    }
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      <Link
                        to="/orders/$orderNo"
                        params={{ orderNo: o.orderNo }}
                        className="text-primary hover:underline"
                      >
                        {o.orderNo}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {o.extOrderNo}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-md border px-1.5 py-0.5 text-[10px] font-bold",
                          o.orderType === "B2B"
                            ? "border-purple-300 bg-purple-50 text-purple-700"
                            : "border-cyan-300 bg-cyan-50 text-cyan-700",
                        )}
                      >
                        {o.orderType}
                      </span>
                    </TableCell>
                    <TableCell>{o.channel}</TableCell>
                    <TableCell>{o.seller}</TableCell>
                    <TableCell>{o.courier}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="font-mono text-xs">
                        {fmtTimestamp(deadline)}
                      </div>
                      <div
                        className={cn(
                          "text-[10px] font-medium",
                          rem.overdue
                            ? "text-destructive"
                            : rem.close
                              ? "text-orange-600"
                              : "text-muted-foreground",
                        )}
                      >
                        {rem.text}
                      </div>
                    </TableCell>
                    <TableCell>
                      {dest ? (
                        dest.city
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {dest ? (
                        dest.state
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{o.paymentMode}</TableCell>
                    <TableCell>
                      <StatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {o.totalQuantity}
                    </TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {fmtTimestamp(new Date(o.createdAt))}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

const TONES: Record<string, { stroke: string; fill: string }> = {
  blue: { stroke: "#2563eb", fill: "#2563eb" },
  violet: { stroke: "#7c3aed", fill: "#7c3aed" },
  amber: { stroke: "#d97706", fill: "#d97706" },
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"];

function Sparkline({
  series,
  color,
}: {
  series: number[];
  color: string;
}) {
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
        {/* vertical guide line through the hovered point */}
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
        {/* dotted trend line */}
        <polyline
          points={line}
          fill="none"
          stroke={color}
          strokeWidth="1.75"
          strokeDasharray="1.5 3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* dotted markers at each point */}
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
        {/* full-height vertical hit bands — hovering anywhere in a point's
            column (including below the point) activates its guide line */}
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
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
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
            up ? "text-green-600" : "text-red-600",
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

function FilterField({
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
