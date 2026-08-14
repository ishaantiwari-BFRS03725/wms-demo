import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  Boxes,
  CheckCircle2,
  Clock,
  History,
  IndianRupee,
  PackageCheck,
  RotateCcw,
  Save,
  ScanSearch,
  Settings2,
  Siren,
  Trash2,
  TriangleAlert,
  Undo2,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_wms/cycle-count-config")({
  head: () => ({ meta: [{ title: "Cycle Count Configuration — Inventory" }] }),
  component: CycleCountConfig,
});

// ─── Config model & defaults ──────────────────────────────────────────────────

interface PrioritySignal {
  id: string;
  label: string;
  description: string;
  Icon: React.ElementType;
  flaggedBins: number;
  triggerCount: number;
}

interface Config {
  // SKU-wise coverage target
  totalUnits: string;
  reviewCycleDays: string;
  activeOperators: string;
  // Coverage window
  coverageWindowDays: string;
  // SLA & assignment
  slaMinutes: string;
  binsPerOperator: string;
  previewOperators: number;
  // Thresholds & approval
  autoAdjustEnabled: boolean;
  valueThreshold: string;
  belowThresholdReconcile: boolean;
  ageingDays: string;
  // Commingling
  commingleWeight: number;
  // Priority signals
  signals: PrioritySignal[];
}

const DEFAULT_SIGNALS: PrioritySignal[] = [
  { id: "high-movement", label: "High-movement bins", description: "High transaction frequency — receiving, picking, replenishment, transfers.", Icon: Activity, flaggedBins: 34, triggerCount: 0 },
  { id: "recently-adjusted", label: "Recently adjusted bins", description: "Recent inventory adjustment — re-count to validate the adjustment held.", Icon: History, flaggedBins: 12, triggerCount: 0 },
  { id: "pnf", label: "Recent / most PNF", description: "Bins linked to recent or frequent Product-Not-Found events during picking.", Icon: ScanSearch, flaggedBins: 8, triggerCount: 0 },
  { id: "ageing", label: "Old counted bins (ageing)", description: "Bins not counted within the ageing window below.", Icon: Clock, flaggedBins: 51, triggerCount: 0 },
  { id: "returns", label: "Most returns stock", description: "Bins receiving high volumes of returned stock.", Icon: Undo2, flaggedBins: 19, triggerCount: 0 },
  { id: "high-value", label: "High-value stock", description: "Bins holding SKUs above the configured value threshold.", Icon: IndianRupee, flaggedBins: 6, triggerCount: 0 },
  { id: "nte", label: "Near-to-Expiry (NTE)", description: "Batches nearing expiry — validates lot/MFD/expiry, catches ghost & surprise batches.", Icon: TriangleAlert, flaggedBins: 4, triggerCount: 0 },
  { id: "empty-tote", label: "Empty tote audit", description: "Audit of totes marked empty, to confirm no stock is being missed.", Icon: PackageCheck, flaggedBins: 22, triggerCount: 0 },
];

const DEFAULTS: Config = {
  totalUnits: "5000000",
  reviewCycleDays: "20",
  activeOperators: "8",
  coverageWindowDays: "7",
  slaMinutes: "20",
  binsPerOperator: "5",
  previewOperators: 4,
  autoAdjustEnabled: false,
  valueThreshold: "500",
  belowThresholdReconcile: true,
  ageingDays: "15",
  commingleWeight: 55,
  signals: DEFAULT_SIGNALS,
};

const nf = new Intl.NumberFormat("en-IN");

// ─── Screen ───────────────────────────────────────────────────────────────────

function CycleCountConfig() {
  const [cfg, setCfg] = useState<Config>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof Config>(key: K, value: Config[K]) => {
    setCfg((c) => ({ ...c, [key]: value }));
    setSaved(false);
  };

  const setSignal = (id: string, patch: Partial<PrioritySignal>) => {
    setCfg((c) => ({ ...c, signals: c.signals.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
    setSaved(false);
  };

  const handleSave = () => { setSaved(true); toast.success("Cycle count configuration saved"); };
  const handleReset = () => { setCfg(DEFAULTS); setSaved(false); toast("Configuration reset to defaults"); };

  // Derived — SKU-wise coverage target
  const totalUnits = parseInt(cfg.totalUnits, 10) || 0;
  const days = parseInt(cfg.reviewCycleDays, 10) || 0;
  const ops = parseInt(cfg.activeOperators, 10) || 0;
  const dailyTarget = days > 0 ? Math.round(totalUnits / days) : 0;
  const perOperator = ops > 0 ? Math.round(dailyTarget / ops) : 0;

  // Derived — assignment
  const bpo = parseInt(cfg.binsPerOperator, 10) || 0;
  const assignableBins = bpo * cfg.previewOperators;

  const handleTriggerSignal = (s: PrioritySignal) => {
    setSignal(s.id, { triggerCount: s.triggerCount + 1 });
    toast.success(`SOS task created — ${s.flaggedBins} bins queued for "${s.label}"`);
  };

  const totalTriggered = cfg.signals.reduce((sum, s) => sum + s.triggerCount, 0);

  return (
    <div className="space-y-6 px-7 pb-14 pt-5">
      <div>
        <h1 className="text-[22px] font-medium tracking-[-0.01em] text-foreground">Cycle Count Configuration</h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
          Warehouse-level rules the engine uses to generate, schedule &amp; prioritise cycle count tasks
        </p>
      </div>

      <Tabs defaultValue="generation">
        <TabsList className="mb-2 h-auto w-full justify-start gap-1 rounded-none border-b border-border bg-transparent p-0">
          {([
            ["generation", "Task Generation"],
            ["sla", "SLA & Assignment"],
            ["thresholds", "Thresholds & Approval"],
            ["priority", "Priority Signals"],
          ] as const).map(([value, label]) => (
            <TabsTrigger
              key={value}
              value={value}
              className="rounded-none border-b-2 border-transparent px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Tab 1: Task Generation ──────────────────────────────────────────── */}
        <TabsContent value="generation" className="mt-2 space-y-4">
          <Card className="overflow-hidden">
            <SectionHeader title="SKU-wise Coverage Target" description="How the daily unit target is spread across the review cycle and the active operators." />
            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
              <Field label="Total Inventory Volume" hint="Total units to be counted across the review cycle — pulled from current inventory, not editable.">
                <div className="flex h-9 items-center justify-between rounded-md border border-border bg-muted/40 px-3">
                  <span className="text-sm font-medium text-muted-foreground">{nf.format(totalUnits)}</span>
                  <span className="text-sm text-muted-foreground">units</span>
                </div>
              </Field>
              <Field label="Review Cycle" hint="Number of days to fully cover the inventory volume once.">
                <div className="relative">
                  <Input type="number" min={1} value={cfg.reviewCycleDays} onChange={(e) => set("reviewCycleDays", e.target.value)} className="h-9 pr-12" />
                  <span className="absolute right-3 top-2 text-sm text-muted-foreground">days</span>
                </div>
              </Field>
            </div>
            {/* Live calculator */}
            <div className="grid grid-cols-3 divide-x divide-border border-t border-border bg-muted/20">
              <CalcCell label="Daily unit target" value={`${nf.format(dailyTarget)}`} sub={`${nf.format(totalUnits)} ÷ ${days || "—"} days`} />
              <CalcCell label="Per operator / day" value={`${nf.format(perOperator)}`} sub={`÷ ${ops || "—"} operators`} highlight />
              <CalcCell label="Review cycle" value={`${days || "—"} days`} sub="one full pass" />
            </div>
          </Card>

          <Card className="overflow-hidden">
            <SectionHeader title="Coverage Window & Wall-to-Wall" description="Every location must be touched at least once within the rolling window." />
            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
              <Field label="Coverage Window (7/n)" hint="Every location is counted at least once within this many days.">
                <div className="relative">
                  <Input type="number" min={1} value={cfg.coverageWindowDays} onChange={(e) => set("coverageWindowDays", e.target.value)} className="h-9 pr-12" />
                  <span className="absolute right-3 top-2 text-sm text-muted-foreground">days</span>
                </div>
              </Field>
              <div className="rounded-md border border-sys/20 bg-sys-bg/50 px-4 py-3 text-[12px] text-sys">
                <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.06em] text-sys/70">Wall-to-Wall Audit</div>
                A full-facility count of all locations, intended to run when operations are shut (no concurrent picking/putaway/replenishment) — raised from the generation console, not the rolling schedule.
              </div>
            </div>
            <div className="border-t border-border bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
              Rolling schedule divides total locations across <span className="font-semibold text-foreground">{cfg.coverageWindowDays || "n"}</span> days so every location is touched at least once per window.
            </div>
          </Card>
        </TabsContent>

        {/* ── Tab 2: SLA & Assignment ─────────────────────────────────────────── */}
        <TabsContent value="sla" className="mt-2 space-y-4">
          <Card className="overflow-hidden">
            <SectionHeader title="Task SLA" description="Each task is sized to complete within this window; the work assigned is capped to fit." />
            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-3">
              <Field label="Target Task Duration" hint="Each task should take 15–20 minutes; bins are blocked for this duration.">
                <div className="relative">
                  <Input type="number" min={5} max={60} value={cfg.slaMinutes} onChange={(e) => set("slaMinutes", e.target.value)} className="h-9 pr-16" />
                  <span className="absolute right-3 top-2 text-sm text-muted-foreground">minutes</span>
                </div>
              </Field>
              <Field label="Bins per Operator" hint="Bins one operator can complete within the SLA window.">
                <div className="relative">
                  <Input type="number" min={1} value={cfg.binsPerOperator} onChange={(e) => set("binsPerOperator", e.target.value)} className="h-9 pr-12" />
                  <span className="absolute right-3 top-2 text-sm text-muted-foreground">bins</span>
                </div>
              </Field>
              <Field label="Active Operators" hint="Operators available on a typical day to share the daily target.">
                <div className="relative">
                  <Input type="number" min={1} value={cfg.activeOperators} onChange={(e) => set("activeOperators", e.target.value)} className="h-9 pr-14" />
                  <span className="absolute right-3 top-2 text-sm text-muted-foreground">ops</span>
                </div>
              </Field>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <SectionHeader title="Assignment Calculator" description="When a task is created the supervisor picks operators; the system computes and blocks the assignable bins." />
            <div className="flex items-center gap-4 p-5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Operators</span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => set("previewOperators", Math.max(1, cfg.previewOperators - 1))}>–</Button>
                  <span className="w-8 text-center font-mono text-[15px] font-semibold">{cfg.previewOperators}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => set("previewOperators", cfg.previewOperators + 1)}>+</Button>
                </div>
              </div>
              <span className="font-mono text-muted-foreground">×</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Bins / op</span>
                <span className="font-mono text-[15px] font-semibold">{bpo}</span>
              </div>
              <span className="font-mono text-muted-foreground">=</span>
              <div className="flex items-center gap-2 rounded-md border border-ok/30 bg-ok-bg px-3 py-1.5">
                <Boxes className="h-4 w-4 text-ok" />
                <span className="font-mono text-[15px] font-semibold text-ok">{assignableBins} bins</span>
                <span className="font-mono text-[10px] uppercase text-ok/70">blocked for ~{cfg.slaMinutes} min</span>
              </div>
            </div>
            <div className="border-t border-border bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
              Bins are blocked from other inventory transactions the moment they are pulled into a task. A task starts on the first bin scan and auto-closes when variance is zero or all variances are reconciled.
            </div>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Thresholds & Approval ────────────────────────────────────── */}
        <TabsContent value="thresholds" className="mt-2 space-y-4">
          <Card className="overflow-hidden">
            <SectionHeader title="Value Threshold & Approval" description="Discrepancies are evaluated at the bin level — the combined value of all SKU-level discrepancies in the bin." />
            <ToggleRow
              Icon={Zap}
              title="Threshold-based auto-adjustment"
              description="Auto-adjust bin discrepancies below the value threshold; only higher-value ones need supervisor approval. Turn off to route every discrepancy through supervisor approval regardless of value."
              checked={cfg.autoAdjustEnabled}
              onChange={(v) => set("autoAdjustEnabled", v)}
            />
            <div className={cn("grid grid-cols-1 gap-5 border-t border-border p-5 sm:grid-cols-2", !cfg.autoAdjustEnabled && "opacity-50")}>
              <Field label="Bin-level Value Threshold" hint="Combined discrepancy value in a bin, evaluated as a whole.">
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-muted-foreground">₹</span>
                  <Input type="number" min={0} value={cfg.valueThreshold} disabled={!cfg.autoAdjustEnabled} onChange={(e) => set("valueThreshold", e.target.value)} className="h-9 pl-7" />
                </div>
              </Field>
              <Field label="Ageing Window" hint="Bins not counted within this many days are flagged as aged.">
                <div className="relative">
                  <Input type="number" min={1} value={cfg.ageingDays} onChange={(e) => set("ageingDays", e.target.value)} className="h-9 pr-12" />
                  <span className="absolute right-3 top-2 text-sm text-muted-foreground">days</span>
                </div>
              </Field>
            </div>
            {cfg.autoAdjustEnabled ? (
              <div className="grid grid-cols-2 divide-x divide-border border-t border-border">
                <div className="px-5 py-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-ok">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Below ₹{cfg.valueThreshold || "0"}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">Auto-adjusted immediately, no supervisor approval required.</p>
                </div>
                <div className="px-5 py-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-warn">
                    <TriangleAlert className="h-3.5 w-3.5" /> At / above ₹{cfg.valueThreshold || "0"}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">Adjustment requires explicit supervisor approval before posting.</p>
                </div>
              </div>
            ) : (
              <div className="border-t border-border px-5 py-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-warn">
                  <TriangleAlert className="h-3.5 w-3.5" /> Auto-adjustment off
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Every bin discrepancy requires explicit supervisor approval before posting, regardless of value.</p>
              </div>
            )}
          </Card>

          <Card className="overflow-hidden">
            <SectionHeader title="Reconciliation Path" description="Both paths still run the excess/suspense reconciliation (Cases 1–3) before any gain or loss is posted." />
            <ToggleRow
              Icon={RotateCcw}
              title="Auto-adjusted path still runs reconciliation"
              description="Below-threshold, auto-adjusted discrepancies pass through excess/suspense reconciliation before posting."
              checked={cfg.belowThresholdReconcile}
              onChange={(v) => set("belowThresholdReconcile", v)}
            />
          </Card>
        </TabsContent>

        {/* ── Tab 4: Priority Signals ─────────────────────────────────────────── */}
        <TabsContent value="priority" className="mt-2 space-y-4">
          <Card className="overflow-hidden">
            <SectionHeader
              title="SOS Task Triggers"
              description={`Fire an emergency cycle count task on demand for bins matching a signal, outside the rolling schedule.${totalTriggered > 0 ? ` ${totalTriggered} SOS task(s) created this session.` : ""}`}
            />
            <div className="divide-y divide-border">
              {cfg.signals.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-4">
                  <s.Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{s.label}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{s.description}</div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                        {s.flaggedBins} bins flagged
                      </span>
                      {s.triggerCount > 0 && (
                        <span className="rounded-full bg-ok-bg px-2 py-0.5 font-mono text-[10px] text-ok">
                          Triggered {s.triggerCount}×
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0 gap-1.5"
                    onClick={() => handleTriggerSignal(s)}
                  >
                    <Siren className="h-3.5 w-3.5" /> Create SOS Task
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <SectionHeader title="Commingling / Bin Density Factor" description="Higher bin density (more distinct SKUs/batches per bin) raises count frequency & urgency." />
            <div className="flex items-center gap-4 p-5">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Slider value={[cfg.commingleWeight]} min={0} max={100} step={5} onValueChange={([v]) => set("commingleWeight", v)} className="max-w-[320px]" />
              <span className="font-mono text-[12px] text-muted-foreground">{cfg.commingleWeight}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                {cfg.commingleWeight >= 70 ? "aggressive" : cfg.commingleWeight >= 40 ? "balanced" : "light"}
              </span>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer actions */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button variant="outline" onClick={handleReset} className="gap-2">
          <Trash2 className="h-4 w-4" /> Reset to defaults
        </Button>
        <div className="flex items-center gap-3">
          {saved && <span className="flex items-center gap-1.5 text-sm text-ok"><CheckCircle2 className="h-4 w-4" />Saved</span>}
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" /> Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Building blocks ──────────────────────────────────────────────────────────

function ToggleRow({
  Icon, title, description, checked, onChange,
}: {
  Icon: React.ElementType;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function CalcCell({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className="px-5 py-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-[20px] font-semibold leading-none tracking-[-0.02em]", highlight && "text-ok")}>{value}</div>
      <div className="mt-1 font-mono text-[10px] text-muted-foreground/70">{sub}</div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-border bg-muted/30 px-5 py-3">
      <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{description}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
