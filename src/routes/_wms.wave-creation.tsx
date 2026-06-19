import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Edit2,
  IndianRupee,
  Plus,
  Search,
  Trash2,
  Waves,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_wms/wave-creation")({
  head: () => ({ meta: [{ title: "Wave Creation — Outbound" }] }),
  component: WaveCreation,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderType   = "B2B" | "B2C" | "Kit Order" | "RTV" | "STO";
type PaymentMode = "COD" | "Prepaid";
type DayKey      = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
type ReleaseMode = "order-wise" | "batch" | "cluster";

const ORDER_TYPES: OrderType[]     = ["B2B", "B2C", "Kit Order", "RTV", "STO"];
const PAYMENT_MODES: PaymentMode[] = ["COD", "Prepaid"];
const DAYS: DayKey[]               = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SLA_OPTIONS = [
  { value: "1-2",  label: "1–2 hrs" },
  { value: "3-5",  label: "3–5 hrs" },
  { value: "5-8",  label: "5–8 hrs" },
  { value: "8+",   label: "8 hrs +" },
];

const COURIER_OPTIONS = [
  "Bluedart", "Delhivery", "Ekart", "Xpressbees",
  "DTDC", "Ecom Express", "Shadowfax",
];
const CHANNEL_OPTIONS = [
  "Amazon", "Flipkart", "Meesho", "Myntra",
  "D2C Website", "WhatsApp Commerce",
];
const SELLER_OPTIONS = [
  "Acme Traders", "Blue Star Retail", "CloudMart", "DealZone",
  "Express Goods", "FastTrack Sellers", "Global Bazaar", "HyperStore",
  "Indigo Commerce", "JetShip", "KwikSale", "LightSpeed Retail",
  "MegaVend", "NovaSellers", "OmniGoods", "PrimeMart",
];

const RELEASE_MODES: { value: ReleaseMode; label: string; desc: string }[] = [
  { value: "order-wise", label: "Order-wise", desc: "Each order gets its own picklist — best for low-volume, high-accuracy needs." },
  { value: "batch",      label: "Batch",      desc: "Multiple orders combined into one picklist — best for high-volume same-SKU orders." },
  { value: "cluster",    label: "Cluster",    desc: "Orders grouped by warehouse zone — best for minimising picker travel distance." },
];

const RELEASE_MODE_BADGE: Record<ReleaseMode, string> = {
  "order-wise": "bg-sys-bg text-sys border-sys/30",
  "batch":      "bg-ai-bg text-ai border-ai-ring",
  "cluster":    "bg-warn-bg text-warn border-warn/30",
};

// ─── Data model ───────────────────────────────────────────────────────────────

interface WaveSchedule {
  id: string;
  name: string;
  // order filters
  orderType: OrderType | "";
  paymentMode: PaymentMode | "";
  sellers: string[];
  slaWindow: string;          // SLA option value e.g. "1-2", or ""
  // quantity / amount filters
  orderQtyType: "" | "single" | "multi";  // single- vs multi-quantity orders
  saleAmountMin: string;
  skuCountMin: string;
  skuCountMax: string;
  // fulfillment filters
  couriers: string[];
  channels: string[];
  // schedule
  time: string;
  days: DayKey[];
  // release
  releaseMode: ReleaseMode;
  // meta
  active: boolean;
  createdAt: string;
  lastRun?: string;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED: WaveSchedule[] = [
  {
    id: "w1",
    name: "Morning B2C",
    orderType: "B2C",
    paymentMode: "Prepaid",
    sellers: ["Acme Traders", "Blue Star Retail"],
    slaWindow: "1-2",
    orderQtyType: "",
    saleAmountMin: "",
    skuCountMin: "",
    skuCountMax: "5",
    couriers: ["Bluedart", "Delhivery"],
    channels: ["Amazon", "Flipkart"],
    time: "09:00",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    releaseMode: "cluster",
    active: true,
    createdAt: "15 Jun 2026",
    lastRun: "Today at 09:00",
  },
  {
    id: "w2",
    name: "COD Afternoon Run",
    orderType: "B2B",
    paymentMode: "COD",
    sellers: [],
    slaWindow: "3-5",
    orderQtyType: "multi",
    saleAmountMin: "500",
    skuCountMin: "",
    skuCountMax: "",
    couriers: [],
    channels: [],
    time: "14:30",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    releaseMode: "batch",
    active: false,
    createdAt: "10 Jun 2026",
  },
];

// ─── Empty form ───────────────────────────────────────────────────────────────

type WaveForm = Omit<WaveSchedule, "id" | "active" | "createdAt" | "lastRun" | "releaseMode"> & {
  releaseMode: ReleaseMode | "";
};

const EMPTY_FORM: WaveForm = {
  name: "",
  orderType: "",
  paymentMode: "",
  sellers: [],
  slaWindow: "",
  orderQtyType: "",
  saleAmountMin: "",
  skuCountMin: "",
  skuCountMax: "",
  couriers: [],
  channels: [],
  time: "09:00",
  days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  releaseMode: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toggleItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

function formatDays(days: DayKey[]): string {
  if (days.length === 7) return "Every day";
  if (days.length === 0) return "No days";
  const weekdays: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  if (days.length === 5 && weekdays.every((d) => days.includes(d))) return "Weekdays";
  return days.join(", ");
}

function validateForm(f: WaveForm): string | null {
  if (!f.name.trim())    return "Wave name is required.";
  if (!f.orderType)      return "Select an order type.";
  if (f.days.length === 0) return "Select at least one day.";
  if (!f.time)           return "Schedule time is required.";
  if (!f.releaseMode)    return "Select a picklist type before saving.";
  return null;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

function WaveCreation() {
  const [waves, setWaves] = useState<WaveSchedule[]>(SEED);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WaveForm>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setSheetOpen(true); };

  const openEdit = (w: WaveSchedule) => {
    setForm({
      name: w.name,
      orderType: w.orderType,
      paymentMode: w.paymentMode,
      sellers: w.sellers,
      slaWindow: w.slaWindow,
      orderQtyType: w.orderQtyType,
      saleAmountMin: w.saleAmountMin,
      skuCountMin: w.skuCountMin,
      skuCountMax: w.skuCountMax,
      couriers: w.couriers,
      channels: w.channels,
      time: w.time,
      days: w.days,
      releaseMode: w.releaseMode,
    });
    setEditingId(w.id);
    setSheetOpen(true);
  };

  const handleSave = () => {
    const err = validateForm(form);
    if (err) { toast.error(err); return; }

    const payload = form as WaveForm & { releaseMode: ReleaseMode };

    if (editingId) {
      setWaves((prev) => prev.map((w) => w.id === editingId ? { ...w, ...payload } : w));
      toast.success("Wave schedule updated");
    } else {
      setWaves((prev) => [{
        ...payload,
        id: `w${Date.now()}`,
        active: true,
        createdAt: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      }, ...prev]);
      toast.success("Wave schedule created");
    }
    setSheetOpen(false);
  };

  const set = (patch: Partial<WaveForm>) => setForm((prev) => ({ ...prev, ...patch }));
  const f = form;

  return (
    <>
      <div className="space-y-6 px-7 pb-14 pt-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-medium tracking-[-0.01em]">Wave Creation</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Schedule automatic picklist batching based on order filters. Active waves run at the
              specified time and create picklists for matching orders.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Wave
          </Button>
        </div>

        {waves.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
            <Waves className="h-10 w-10 opacity-30" />
            <p className="text-sm font-medium">No wave schedules yet</p>
            <p className="text-xs">Create a wave to automatically batch orders into picklists.</p>
            <Button variant="outline" size="sm" onClick={openCreate} className="mt-1">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create your first wave
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {waves.map((wave) => (
              <WaveCard
                key={wave.id}
                wave={wave}
                confirmingDelete={deleteConfirm === wave.id}
                onEdit={() => openEdit(wave)}
                onToggleActive={() =>
                  setWaves((prev) => prev.map((w) => w.id === wave.id ? { ...w, active: !w.active } : w))
                }
                onDeleteRequest={() => setDeleteConfirm(wave.id)}
                onDeleteConfirm={() => {
                  setWaves((prev) => prev.filter((w) => w.id !== wave.id));
                  setDeleteConfirm(null);
                  toast("Wave schedule deleted");
                }}
                onDeleteCancel={() => setDeleteConfirm(null)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Sheet ── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
          <SheetHeader className="flex-shrink-0 border-b border-border px-6 py-4">
            <SheetTitle>{editingId ? "Edit Wave" : "Create Wave"}</SheetTitle>
            <p className="text-xs text-muted-foreground">
              {editingId
                ? "Update filters or schedule for this wave."
                : "Define filters and schedule for automatic picklist creation."}
            </p>
          </SheetHeader>

          <div className="flex-1 divide-y divide-border/60 overflow-y-auto">

            {/* Wave name */}
            <div className="px-6 py-5">
              <Section label="Wave Name">
                <Input
                  placeholder="e.g. Morning B2C, COD Rush"
                  value={f.name}
                  onChange={(e) => set({ name: e.target.value })}
                  className="h-9"
                />
              </Section>
            </div>

            {/* ── ORDER FILTERS ── */}
            <div className="px-6 py-5 space-y-5">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">
                Order Filters
              </p>

              {/* Order Type — single select */}
              <Section label="Order Type" hint="Select one order type.">
                <div className="flex flex-wrap gap-2">
                  {ORDER_TYPES.map((ot) => (
                    <RadioChip
                      key={ot}
                      label={ot}
                      active={f.orderType === ot}
                      onClick={() => set({ orderType: f.orderType === ot ? "" : ot })}
                    />
                  ))}
                </div>
              </Section>

              {/* Payment Mode — single select */}
              <Section label="Payment Mode" hint="Select one payment mode, or leave empty for all.">
                <div className="flex gap-2">
                  {PAYMENT_MODES.map((pm) => (
                    <RadioChip
                      key={pm}
                      label={pm}
                      active={f.paymentMode === pm}
                      onClick={() => set({ paymentMode: f.paymentMode === pm ? "" : pm })}
                    />
                  ))}
                </div>
              </Section>

              {/* Seller — searchable multi-select */}
              <Section label="Seller" hint="Leave empty to include all sellers.">
                <SellerMultiSelect
                  options={SELLER_OPTIONS}
                  selected={f.sellers}
                  onToggle={(v) => set({ sellers: toggleItem(f.sellers, v) })}
                  onClear={() => set({ sellers: [] })}
                />
              </Section>

              {/* SLA Urgency — dropdown */}
              <Section label="SLA Urgency" hint="Include orders with SLA due within this window.">
                <Select value={f.slaWindow} onValueChange={(v) => set({ slaWindow: v })}>
                  <SelectTrigger className="h-9 w-44">
                    <SelectValue placeholder="Any SLA" />
                  </SelectTrigger>
                  <SelectContent>
                    {SLA_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {f.slaWindow && (
                  <button
                    type="button"
                    onClick={() => set({ slaWindow: "" })}
                    className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" /> Clear SLA filter
                  </button>
                )}
              </Section>

              {/* Order Quantity */}
              <Section label="Order Quantity" hint="Filter by total units in the order.">
                <div className="flex flex-wrap items-center gap-2">
                  {([
                    { value: "single", label: "Single quantity order" },
                    { value: "multi",  label: "Multi quantity order" },
                  ] as const).map((opt) => {
                    const selected = f.orderQtyType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => set({ orderQtyType: selected ? "" : opt.value })}
                        className={cn(
                          "flex items-center gap-2 rounded-[3px] border px-3 py-2 text-[13px] transition-colors",
                          selected
                            ? "border-sys/40 bg-sys-bg text-sys"
                            : "border-border bg-background text-foreground hover:bg-muted",
                        )}
                      >
                        <span className={cn(
                          "flex h-3.5 w-3.5 items-center justify-center rounded-full border",
                          selected ? "border-sys" : "border-muted-foreground/40",
                        )}>
                          {selected && <span className="h-1.5 w-1.5 rounded-full bg-sys" />}
                        </span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </Section>

              {/* Sale Amount */}
              <Section label="Sale Amount" hint="Include orders with total value above this amount.">
                <div className="relative w-44">
                  <IndianRupee className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min={0}
                    placeholder="e.g. 500"
                    value={f.saleAmountMin}
                    onChange={(e) => set({ saleAmountMin: e.target.value })}
                    className="h-9 pl-8"
                  />
                </div>
              </Section>

              {/* Number of SKUs */}
              <Section label="Number of SKUs" hint="Filter by distinct SKU count per order.">
                <div className="grid grid-cols-2 gap-3">
                  <NumberInput prefix="At least" placeholder="—" value={f.skuCountMin} onChange={(v) => set({ skuCountMin: v })} />
                  <NumberInput prefix="At most"  placeholder="—" value={f.skuCountMax} onChange={(v) => set({ skuCountMax: v })} />
                </div>
              </Section>
            </div>

            {/* ── FULFILLMENT FILTERS ── */}
            <div className="px-6 py-5 space-y-5">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">
                Fulfillment Filters
              </p>

              <Section label="Courier" hint="Leave empty to include all couriers.">
                <div className="flex flex-wrap gap-2">
                  {COURIER_OPTIONS.map((c) => (
                    <FilterChip key={c} label={c} active={f.couriers.includes(c)} onClick={() => set({ couriers: toggleItem(f.couriers, c) })} />
                  ))}
                </div>
              </Section>

              <Section label="Channel" hint="Leave empty to include all channels.">
                <div className="flex flex-wrap gap-2">
                  {CHANNEL_OPTIONS.map((ch) => (
                    <FilterChip key={ch} label={ch} active={f.channels.includes(ch)} onClick={() => set({ channels: toggleItem(f.channels, ch) })} />
                  ))}
                </div>
              </Section>
            </div>

            {/* ── SCHEDULE ── */}
            <div className="px-6 py-5 space-y-5">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">
                Schedule
              </p>

              <Section label="Run Time" hint="Wave triggers automatically at this time each selected day.">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <Input type="time" value={f.time} onChange={(e) => set({ time: e.target.value })} className="h-9 w-32" />
                </div>
              </Section>

              <Section label="Repeat On" hint="Days this wave will run.">
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <FilterChip key={day} label={day} active={f.days.includes(day)} onClick={() => set({ days: toggleItem(f.days, day) })} compact />
                  ))}
                </div>
                {f.days.length === 0 && (
                  <p className="mt-1 text-[11px] text-amber-600">Select at least one day.</p>
                )}
              </Section>
            </div>

            {/* ── PICKLIST TYPE — required ── */}
            <div className="px-6 py-5">
              <div className="mb-3 flex items-center gap-2">
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-foreground">
                  Picklist Type
                </p>
                <span className="rounded-[2px] border border-risk/30 bg-risk-bg px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.06em] text-risk">
                  Required
                </span>
              </div>
              <div className="space-y-2">
                {RELEASE_MODES.map((mode) => {
                  const active = f.releaseMode === mode.value;
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => set({ releaseMode: mode.value })}
                      className={cn(
                        "w-full rounded-[4px] border px-4 py-3 text-left transition-colors",
                        active ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted/30",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "mt-0.5 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                          active ? "border-primary" : "border-muted-foreground/40",
                        )}>
                          {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                        </span>
                        <span className={cn("text-sm font-medium", active ? "text-primary" : "")}>{mode.label}</span>
                      </div>
                      <p className="mt-1 pl-5 text-[11px] text-muted-foreground">{mode.desc}</p>
                    </button>
                  );
                })}
              </div>
              {!f.releaseMode && (
                <p className="mt-2 flex items-center gap-1 text-[11px] text-amber-600">
                  <AlertCircle className="h-3 w-3" />
                  Choose how orders will be grouped into picklists.
                </p>
              )}
            </div>
          </div>

          <SheetFooter className="flex-shrink-0 border-t border-border px-6 py-4">
            <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!f.releaseMode}>
              {editingId ? "Save Changes" : "Create Wave"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ─── WaveCard ─────────────────────────────────────────────────────────────────

function WaveCard({
  wave, confirmingDelete,
  onEdit, onToggleActive, onDeleteRequest, onDeleteConfirm, onDeleteCancel,
}: {
  wave: WaveSchedule;
  confirmingDelete: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}) {
  const tags: { label: string; cls: string }[] = [];

  if (wave.orderType)   tags.push({ label: wave.orderType,   cls: "bg-blue-50 text-blue-700 border-blue-200" });
  if (wave.paymentMode) tags.push({ label: wave.paymentMode, cls: "bg-purple-50 text-purple-700 border-purple-200" });

  if (wave.sellers.length === 1) {
    tags.push({ label: wave.sellers[0], cls: "bg-cyan-50 text-cyan-700 border-cyan-200" });
  } else if (wave.sellers.length > 1) {
    tags.push({ label: `${wave.sellers.length} sellers`, cls: "bg-cyan-50 text-cyan-700 border-cyan-200" });
  }

  if (wave.slaWindow) {
    const label = SLA_OPTIONS.find((o) => o.value === wave.slaWindow)?.label ?? wave.slaWindow;
    tags.push({ label: `SLA ≤ ${label}`, cls: "bg-rose-50 text-rose-700 border-rose-200" });
  }

  if (wave.orderQtyType) {
    tags.push({ label: wave.orderQtyType === "single" ? "Single qty" : "Multi qty", cls: "bg-orange-50 text-orange-700 border-orange-200" });
  }
  if (wave.saleAmountMin) tags.push({ label: `Sale ≥ ₹${wave.saleAmountMin}`, cls: "bg-teal-50 text-teal-700 border-teal-200" });
  if (wave.skuCountMin || wave.skuCountMax) {
    const parts = [wave.skuCountMin ? `≥ ${wave.skuCountMin}` : "", wave.skuCountMax ? `≤ ${wave.skuCountMax}` : ""].filter(Boolean);
    tags.push({ label: `SKUs ${parts.join(", ")}`, cls: "bg-indigo-50 text-indigo-700 border-indigo-200" });
  }

  wave.couriers.forEach((c)  => tags.push({ label: c,  cls: "bg-slate-100 text-slate-700 border-slate-200" }));
  wave.channels.forEach((ch) => tags.push({ label: ch, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" }));

  return (
    <Card className={cn("overflow-hidden transition-opacity", !wave.active && "opacity-70")}>
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{wave.name}</span>
              <span className={cn(
                "flex items-center gap-1 rounded-[2px] border px-1.5 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em]",
                wave.active ? "border-ok/30 bg-ok-bg text-ok" : "border-border bg-muted text-muted-foreground",
              )}>
                {wave.active ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                {wave.active ? "Active" : "Inactive"}
              </span>
              <span className={cn("rounded-[2px] border px-1.5 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em]", RELEASE_MODE_BADGE[wave.releaseMode])}>
                {wave.releaseMode}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{wave.time}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDays(wave.days)}</span>
              {wave.lastRun && <span>Last run: {wave.lastRun}</span>}
              <span>Created {wave.createdAt}</span>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onToggleActive}
              className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full border-2 transition-colors",
                wave.active ? "border-emerald-500 bg-emerald-500" : "border-border bg-muted",
              )}
            >
              <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform", wave.active ? "translate-x-3.5" : "translate-x-0.5")} />
            </button>

            <Button variant="outline" size="sm" onClick={onEdit} className="h-7 px-2.5">
              <Edit2 className="h-3 w-3 mr-1" />Edit
            </Button>

            {confirmingDelete ? (
              <div className="flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs">
                <span className="text-red-700">Delete?</span>
                <button type="button" onClick={onDeleteConfirm} className="font-semibold text-red-700 hover:text-red-900">Yes</button>
                <span className="text-red-300">·</span>
                <button type="button" onClick={onDeleteCancel} className="text-red-500 hover:text-red-700">No</button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={onDeleteRequest} className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-3">
          {tags.length === 0 ? (
            <span className="text-[11px] italic text-muted-foreground">All orders · All couriers · All channels</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag, i) => (
                <span key={i} className={cn("rounded-[2px] border px-1.5 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em]", tag.cls)}>
                  {tag.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── SellerMultiSelect ────────────────────────────────────────────────────────

function SellerMultiSelect({
  options, selected, onToggle, onClear,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(""); }}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-9 w-full items-center justify-between rounded-[4px] border border-input bg-card px-3 text-sm transition-colors hover:bg-muted/40 focus:outline-none"
          >
            <span className={selected.length === 0 ? "text-muted-foreground" : ""}>
              {selected.length === 0
                ? "All sellers"
                : selected.length === 1
                ? selected[0]
                : `${selected.length} sellers selected`}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-72 p-0" align="start">
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            <input
              autoFocus
              placeholder="Search sellers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Options list */}
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">No sellers found</p>
            ) : (
              filtered.map((o) => {
                const checked = selected.includes(o);
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => onToggle(o)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/40"
                  >
                    <span className={cn(
                      "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors",
                      checked ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    )}>
                      {checked && <Check className="h-2.5 w-2.5" />}
                    </span>
                    <span className={checked ? "font-medium" : ""}>{o}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {selected.length > 0 && (
            <div className="border-t border-border px-3 py-2">
              <button
                type="button"
                onClick={onClear}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Clear selection ({selected.length})
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Selected pills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((s) => (
            <span
              key={s}
              className="flex items-center gap-1 rounded-[4px] border border-ai-ring bg-ai-bg px-2 py-0.5 text-[11px] text-ai"
            >
              {s}
              <button type="button" onClick={() => onToggle(s)}>
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Building blocks ──────────────────────────────────────────────────────────

function Section({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Single-select chip — shows a filled radio dot when active */
function RadioChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-[4px] border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/40",
      )}
    >
      <span className={cn(
        "flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-full border",
        active ? "border-white/70" : "border-muted-foreground/40",
      )}>
        {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </span>
      {label}
    </button>
  );
}

/** Multi-select chip */
function FilterChip({ label, active, onClick, compact = false }: { label: string; active: boolean; onClick: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[4px] border text-xs font-medium transition-colors",
        compact ? "px-2.5 py-1" : "px-3 py-1.5",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/40",
      )}
    >
      {label}
    </button>
  );
}

function NumberInput({ prefix, placeholder, value, onChange }: { prefix: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground">{prefix}</label>
      <Input type="number" min={0} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="h-9" />
    </div>
  );
}
