import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Layers,
  PackageCheck,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";
import {
  KIT_MAPPINGS,
  KIT_ORDERS,
  childBySku,
  kitBuildableQty,
  kitOnHand,
  type KitOrderRow,
  type KitOrderStatus,
  type KitOrderType,
} from "@/lib/wms/kit-data";

export const Route = createFileRoute("/_wms/kit-order")({
  head: () => ({
    meta: [{ title: "Kit Order — Inventory" }],
  }),
  component: KitOrderScreen,
});

const STATUS_STYLES: Record<KitOrderStatus, string> = {
  Open: "border-warn/30 bg-warn-bg text-warn",
  Picked: "border-sys/30 bg-sys-bg text-sys",
  "Kitting Done": "border-ai-ring bg-ai-bg text-ai",
  "Putaway Done": "border-ok/30 bg-ok-bg text-ok",
};

const ALL = "all";
const TYPE_OPTIONS: KitOrderType[] = ["Kit", "De-kit"];
const STATUS_OPTIONS: KitOrderStatus[] = [
  "Open",
  "Picked",
  "Kitting Done",
  "Putaway Done",
];

interface OrderFilters {
  type: string;
  sku: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

const emptyFilters: OrderFilters = {
  type: ALL,
  sku: ALL,
  status: ALL,
  dateFrom: "",
  dateTo: "",
};

/** Parse a "dd/mm/yyyy hh:mm" string to a date-only Date. */
const parseDmy = (s: string): Date => {
  const [d, m, y] = s.slice(0, 10).split("/").map(Number);
  return new Date(y, m - 1, d);
};
/** Parse a native "yyyy-mm-dd" input value to a date-only Date. */
const parseIso = (s: string): Date => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

function KitOrderScreen() {
  const [orders, setOrders] = useState<KitOrderRow[]>(KIT_ORDERS);
  const [orderType, setOrderType] = useState<KitOrderType>("Kit");
  const [kitSku, setKitSku] = useState("");
  const [qty, setQty] = useState("");
  const [kitCounter, setKitCounter] = useState(2043);
  const [dekitCounter, setDekitCounter] = useState(1008);

  // Create-order section is collapsed until the user opens it.
  const [createOpen, setCreateOpen] = useState(false);

  // Orders table search + filters.
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<OrderFilters>(emptyFilters);
  const [filterOpen, setFilterOpen] = useState(false);

  const setFilter = (patch: Partial<OrderFilters>) =>
    setFilters((f) => ({ ...f, ...patch }));

  const skuOptions = useMemo(
    () =>
      KIT_MAPPINGS.map((m) => ({
        value: m.kitSku,
        label: `${m.kitSku} — ${m.kitName}`,
      })),
    [],
  );

  const activeFilterCount =
    (filters.type !== ALL ? 1 : 0) +
    (filters.sku !== ALL ? 1 : 0) +
    (filters.status !== ALL ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  const visibleOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (
        q &&
        !`${o.id} ${o.kitSku} ${o.kitName} ${o.type} ${o.status}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      if (filters.type !== ALL && o.type !== filters.type) return false;
      if (filters.sku !== ALL && o.kitSku !== filters.sku) return false;
      if (filters.status !== ALL && o.status !== filters.status) return false;
      if (filters.dateFrom || filters.dateTo) {
        const d = parseDmy(o.createdAt);
        if (filters.dateFrom && d < parseIso(filters.dateFrom)) return false;
        if (filters.dateTo && d > parseIso(filters.dateTo)) return false;
      }
      return true;
    });
  }, [orders, search, filters]);

  const isKit = orderType === "Kit";

  const mapping = useMemo(
    () => KIT_MAPPINGS.find((m) => m.kitSku === kitSku) ?? null,
    [kitSku],
  );

  const requestedQty = Number(qty) || 0;

  // Per-component figures.
  //  · Kit:    `required` is consumed from child stock and must be available.
  //  · De-kit: `required` is the quantity returned to each child SKU (output).
  const requirements = useMemo(() => {
    if (!mapping) return [];
    return mapping.components.map((c) => {
      const moved = c.qty * requestedQty;
      const child = childBySku(c.sku);
      const available = child?.available ?? 0;
      return {
        sku: c.sku,
        name: c.name,
        packSize: child?.packSize ?? 0,
        perKit: c.qty,
        required: moved,
        available,
        shortfall: Math.max(0, moved - available),
        ok: isKit ? moved <= available : true,
      };
    });
  }, [mapping, requestedQty, isKit]);

  // Kit availability is derived from child stock; de-kit availability is the
  // finished kit SKU stock on hand.
  const maxQty = mapping
    ? isKit
      ? kitBuildableQty(mapping)
      : kitOnHand(mapping.kitSku)
    : 0;

  const available = isKit
    ? requirements.length > 0 && requirements.every((r) => r.ok)
    : !!mapping && requestedQty <= maxQty;

  const canCreate = !!mapping && requestedQty > 0 && available;

  const resetForm = () => {
    setKitSku("");
    setQty("");
  };

  const switchType = (t: KitOrderType) => {
    setOrderType(t);
    resetForm();
  };

  const createOrder = () => {
    if (!mapping) {
      toast.error("Select a Kit SKU");
      return;
    }
    if (requestedQty <= 0) {
      toast.error("Enter a kit quantity");
      return;
    }
    if (!available) {
      toast.error(
        isKit
          ? "Insufficient component stock — partial kits not allowed"
          : "Insufficient kit stock to de-kit the requested quantity",
      );
      return;
    }
    const id = isKit ? `KIT-${kitCounter}` : `DKT-${dekitCounter}`;
    const order: KitOrderRow = {
      id,
      type: orderType,
      kitSku: mapping.kitSku,
      kitName: mapping.kitName,
      kitQty: requestedQty,
      status: "Open",
      createdAt: new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setOrders((prev) => [order, ...prev]);
    if (isKit) setKitCounter((c) => c + 1);
    else setDekitCounter((c) => c + 1);
    toast.success(
      isKit
        ? `${id} created — component inventory blocked`
        : `${id} created — kit inventory blocked`,
    );
    resetForm();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Kit Order</h1>
          <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
            Create kit (assembly) or de-kit (disassembly) orders. For a kit
            order the WMS multiplies each mapped component by the requested
            quantity, validates full availability, then blocks the child-SKU
            inventory. A de-kit order blocks the finished kit-SKU stock and
            returns the components. Partial availability is not allowed.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen((o) => !o)}
          variant={createOpen ? "outline" : "default"}
          className="gap-2"
        >
          {createOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {createOpen ? "Close" : "Create Order"}
        </Button>
      </div>

      {/* Create order */}
      {createOpen && (
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <Layers className="h-4 w-4 text-primary" />
          <div className="text-sm font-semibold">Create Order</div>
        </div>
        <div className="space-y-5 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[10rem_1fr_10rem]">
            <Field label="Order Type">
              <Select
                value={orderType}
                onValueChange={(v) => switchType(v as KitOrderType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kit">Kit</SelectItem>
                  <SelectItem value="De-kit">De-kit</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Kit SKU">
              <Select value={kitSku} onValueChange={setKitSku}>
                <SelectTrigger className="font-mono">
                  <SelectValue placeholder="Select a kit…" />
                </SelectTrigger>
                <SelectContent>
                  {KIT_MAPPINGS.map((m) => (
                    <SelectItem key={m.kitSku} value={m.kitSku}>
                      <span className="font-mono">{m.kitSku}</span>
                      <span className="ml-2 text-muted-foreground">
                        {m.kitName}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={isKit ? "Kit Quantity" : "De-kit Quantity"}>
              <Input
                inputMode="numeric"
                value={qty}
                onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="e.g. 5"
                className="font-mono"
              />
            </Field>
          </div>

          {/* Requirement calculation */}
          {mapping && requestedQty > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  {isKit ? "Component Requirement" : "Components Returned"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isKit ? "Max buildable now: " : "Kit stock on hand: "}
                  <span className="font-mono font-semibold text-foreground">
                    {maxQty}
                  </span>{" "}
                  kits
                </div>
              </div>

              <div className="overflow-hidden rounded-md border border-border">
                <div className="grid grid-cols-[6rem_1fr_5rem_5rem_6rem_6rem_5rem] gap-3 border-b border-border bg-muted/30 px-4 py-2.5 text-[10px] font-semibold font-mono uppercase tracking-[0.08em] text-muted-foreground">
                  <span>SKU</span>
                  <span>Item</span>
                  <span className="text-right">Pack Size</span>
                  <span className="text-right">Per Kit</span>
                  <span className="text-right">
                    {isKit ? "Required" : "Returned"}
                  </span>
                  <span className="text-right">Available</span>
                  <span className="text-right">Status</span>
                </div>
                <div className="divide-y divide-border">
                  {requirements.map((r) => (
                    <div
                      key={r.sku}
                      className="grid grid-cols-[6rem_1fr_5rem_5rem_6rem_6rem_5rem] items-center gap-3 px-4 py-2.5 text-sm"
                    >
                      <span className="font-mono text-xs font-medium">
                        {r.sku}
                      </span>
                      <span className="truncate text-muted-foreground">
                        {r.name}
                      </span>
                      <span className="text-right font-mono tabular-nums">
                        {r.packSize}
                      </span>
                      <span className="text-right font-mono tabular-nums">
                        {r.perKit}
                      </span>
                      <span className="text-right font-mono font-semibold tabular-nums">
                        {isKit ? r.required : `+${r.required}`}
                      </span>
                      <span className="text-right font-mono tabular-nums">
                        {r.available}
                      </span>
                      <span className="flex justify-end">
                        {!isKit ? (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        ) : r.ok ? (
                          <CheckCircle2 className="h-4 w-4 text-ok" />
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-risk">
                            <AlertTriangle className="h-3.5 w-3.5" />-{r.shortfall}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Availability banner */}
              {available ? (
                <div className="flex items-start gap-3 rounded-md border border-ok/30 bg-ok-bg p-3 text-ok">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="text-sm">
                    {isKit
                      ? "All components available. Creating the order will block the required quantities until kitting completes or the order is cancelled."
                      : "Kit stock available. Creating the order will block the kit-SKU quantity until de-kitting completes or the order is cancelled."}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-md border border-risk/30 bg-risk-bg p-3 text-risk">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="text-sm">
                    {isKit ? (
                      <>
                        Insufficient stock for one or more components. Reduce the
                        kit quantity to{" "}
                        <span className="font-semibold">{maxQty}</span> or fewer —
                        partial kit orders are not allowed.
                      </>
                    ) : (
                      <>
                        Only <span className="font-semibold">{maxQty}</span> units
                        of this kit are on hand. Reduce the de-kit quantity to{" "}
                        <span className="font-semibold">{maxQty}</span> or fewer.
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 border-t border-border pt-4">
            <Button onClick={createOrder} disabled={!canCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              {isKit ? "Create Kit Order" : "Create De-kit Order"}
            </Button>
            {mapping && requestedQty > 0 && (
              <span className="text-xs text-muted-foreground">
                {isKit
                  ? `Blocks inventory for ${requirements.length} child SKUs`
                  : "Blocks the kit SKU inventory"}
              </span>
            )}
          </div>
        </div>
      </Card>
      )}

      {/* Existing orders */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div className="text-sm font-semibold">
            Orders{" "}
            <span className="ml-1.5 rounded-[3px] bg-primary/10 px-2 py-0.5 font-mono text-xs font-medium text-primary">
              {visibleOrders.length}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-56 pl-8 pr-8"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-[3px] bg-primary px-1 font-mono text-[10px] font-semibold text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <span className="text-sm font-semibold">Filters</span>
                  <button
                    type="button"
                    onClick={() => setFilters(emptyFilters)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Reset all
                  </button>
                </div>
                <div className="space-y-3.5 p-4">
                  <FilterField label="Type">
                    <Select
                      value={filters.type}
                      onValueChange={(v) => setFilter({ type: v })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All types</SelectItem>
                        {TYPE_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FilterField>

                  <FilterField label="Kit SKU">
                    <SkuFilterSelect
                      value={filters.sku}
                      options={skuOptions}
                      onChange={(v) => setFilter({ sku: v })}
                    />
                  </FilterField>

                  <FilterField label="Status">
                    <Select
                      value={filters.status}
                      onValueChange={(v) => setFilter({ status: v })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All statuses</SelectItem>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FilterField>

                  <FilterField label="Created At">
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={filters.dateFrom}
                        max={filters.dateTo || undefined}
                        onChange={(e) => setFilter({ dateFrom: e.target.value })}
                        className="h-9"
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input
                        type="date"
                        value={filters.dateTo}
                        min={filters.dateFrom || undefined}
                        onChange={(e) => setFilter({ dateTo: e.target.value })}
                        className="h-9"
                      />
                    </div>
                  </FilterField>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-[6rem_5rem_6rem_1fr_5rem_7rem_9rem] gap-3 border-b border-border bg-muted/30 px-5 py-2.5 text-[10px] font-semibold font-mono uppercase tracking-[0.08em] text-muted-foreground">
          <span>Order ID</span>
          <span>Type</span>
          <span>Kit SKU</span>
          <span>Kit Name</span>
          <span className="text-right">Qty</span>
          <span>Status</span>
          <span className="text-right">Created</span>
        </div>

        {visibleOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-muted-foreground">
            <PackageCheck className="h-8 w-8 opacity-30" />
            <p className="text-sm">
              {orders.length === 0
                ? "No kit orders yet."
                : "No orders match your search or filters."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {visibleOrders.map((o) => (
              <div
                key={o.id}
                className="grid grid-cols-[6rem_5rem_6rem_1fr_5rem_7rem_9rem] items-center gap-3 px-5 py-3 text-sm"
              >
                <span className="font-mono text-xs font-semibold">{o.id}</span>
                <span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium",
                      o.type === "Kit"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {o.type}
                  </span>
                </span>
                <span className="font-mono text-xs">{o.kitSku}</span>
                <span className="truncate text-muted-foreground">
                  {o.kitName}
                </span>
                <span className="text-right font-mono tabular-nums">
                  {o.kitQty}
                </span>
                <span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-[2px] border px-1.5 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em]",
                      STATUS_STYLES[o.status],
                    )}
                  >
                    {o.status}
                  </span>
                </span>
                <span className="text-right text-xs text-muted-foreground">
                  {o.createdAt}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      {children}
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
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SkuFilterSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel =
    value === ALL
      ? "All SKUs"
      : (options.find((o) => o.value === value)?.label ?? value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 w-full justify-between font-normal"
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search SKU or description…" />
          <CommandList>
            <CommandEmpty>No matching SKU.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="All SKUs"
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
                All SKUs
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
                      "mr-2 h-4 w-4",
                      value === o.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{o.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
