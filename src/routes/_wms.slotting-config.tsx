import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Link2,
  Package,
  Plus,
  Settings2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_wms/slotting-config")({
  head: () => ({
    meta: [{ title: "Slotting Configuration — Inventory" }],
  }),
  component: SlottingConfig,
});

// ─── Global params types & defaults ──────────────────────────────────────────

type LookbackDays = "30" | "60" | "90" | "180" | "365";

interface GlobalParams {
  abcLookback: LookbackDays;
  affinityLookback: LookbackDays;
  goldenZoneLevels: number[];
  targetDensityPct: string;
  lowDensityThresholdPct: string;
}

const DEFAULTS: GlobalParams = {
  abcLookback: "90",
  affinityLookback: "90",
  goldenZoneLevels: [2, 3],
  targetDensityPct: "60",
  lowDensityThresholdPct: "50",
};

const LOOKBACK_OPTIONS: { value: LookbackDays; label: string }[] = [
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
  { value: "180", label: "180 days" },
  { value: "365", label: "365 days" },
];

const LEVELS = [1, 2, 3, 4, 5];

// ─── Strategy Builder types & defaults ───────────────────────────────────────

type RuleId = "abc" | "affinity" | "weight";
type FinalAction = "flag-review" | "assign-any" | "hold-alert" | "auto-demote";

interface CascadeStep {
  id: string;
  value: string;
}

interface StrategyRule {
  id: RuleId;
  label: string;
  shortLabel: string;
  description: string;
  Icon: React.ElementType;
  enabled: boolean;
  cascade: CascadeStep[];
  finalAction: FinalAction;
}

const ZONE_OPTIONS: Record<RuleId, { value: string; label: string }[]> = {
  abc: [
    { value: "golden", label: "Golden Zone" },
    { value: "silver", label: "Silver Zone" },
    { value: "bulk", label: "Bulk Storage" },
    { value: "any", label: "Any Available" },
  ],
  affinity: [
    { value: "same-aisle", label: "Same Aisle" },
    { value: "same-zone", label: "Same Zone" },
    { value: "adjacent-zone", label: "Adjacent Zone" },
    { value: "nearest", label: "Nearest Available" },
  ],
  weight: [
    { value: "level-1-2", label: "Level 1–2 (Ground)" },
    { value: "level-3-4", label: "Level 3–4 (Mid)" },
    { value: "level-5", label: "Level 5 (Top)" },
    { value: "oversize", label: "Oversize Aisle" },
  ],
};

const FINAL_ACTION_OPTIONS: { value: FinalAction; label: string }[] = [
  { value: "flag-review", label: "Flag for manual review" },
  { value: "assign-any", label: "Assign to any available slot" },
  { value: "hold-alert", label: "Hold & alert operator" },
  { value: "auto-demote", label: "Auto-demote to lower class" },
];

const FINAL_ACTION_COLORS: Record<FinalAction, string> = {
  "flag-review": "border-warn/40 bg-warn-bg text-warn",
  "assign-any": "border-border bg-muted/40 text-muted-foreground",
  "hold-alert": "border-risk/40 bg-risk-bg text-risk",
  "auto-demote": "border-sys/40 bg-sys-bg text-sys",
};

const DEFAULT_STRATEGY_RULES: StrategyRule[] = [
  {
    id: "abc",
    label: "ABC Velocity Class",
    shortLabel: "ABC Class",
    description: "A-items slot near dock / pick lanes, B-items mid-zone, C-items in deep storage.",
    Icon: BarChart3,
    enabled: true,
    cascade: [
      { id: "abc-1", value: "golden" },
      { id: "abc-2", value: "silver" },
      { id: "abc-3", value: "bulk" },
    ],
    finalAction: "flag-review",
  },
  {
    id: "affinity",
    label: "Affinity / Co-pick Clustering",
    shortLabel: "Affinity",
    description: "Items frequently ordered together are placed in adjacent locations to minimise travel time.",
    Icon: Link2,
    enabled: true,
    cascade: [
      { id: "aff-1", value: "same-aisle" },
      { id: "aff-2", value: "same-zone" },
      { id: "aff-3", value: "adjacent-zone" },
    ],
    finalAction: "assign-any",
  },
  {
    id: "weight",
    label: "Item Weight & Size",
    shortLabel: "Weight",
    description: "Heavy or bulky items assigned to lower levels; light or small items placed higher.",
    Icon: Package,
    enabled: true,
    cascade: [
      { id: "wt-1", value: "level-1-2" },
      { id: "wt-2", value: "level-3-4" },
      { id: "wt-3", value: "level-5" },
    ],
    finalAction: "flag-review",
  },
];

function buildStrategySummary(rules: StrategyRule[]): string {
  const active = rules.filter((r) => r.enabled);
  if (active.length === 0) {
    return "No strategy rules are active — the engine will assign locations arbitrarily.";
  }

  const parts = active.map((r) => {
    const n = r.cascade.length;
    const finalLabel =
      FINAL_ACTION_OPTIONS.find((a) => a.value === r.finalAction)?.label.toLowerCase() ?? "flag";
    return `${r.label} (${n} fallback${n !== 1 ? "s" : ""} → ${finalLabel})`;
  });

  const inactive = rules.filter((r) => !r.enabled);
  const inactiveNote =
    inactive.length > 0
      ? ` ${inactive.map((r) => r.label).join(" and ")} ${inactive.length > 1 ? "are" : "is"} inactive.`
      : "";

  if (parts.length === 1) return `The engine applies ${parts[0]}.${inactiveNote}`;
  return `The engine resolves ${parts.length} dimensions in order: ${parts.join("; ")}.${inactiveNote}`;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

function SlottingConfig() {
  const [params, setParams] = useState<GlobalParams>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  const [strategyRules, setStrategyRules] = useState<StrategyRule[]>(DEFAULT_STRATEGY_RULES);
  const [strategySaved, setStrategySaved] = useState(false);

  // ── Global params handlers ─────────────────────────────────────────────────

  const toggle = (level: number) => {
    setParams((p) => ({
      ...p,
      goldenZoneLevels: p.goldenZoneLevels.includes(level)
        ? p.goldenZoneLevels.filter((l) => l !== level)
        : [...p.goldenZoneLevels, level].sort(),
    }));
    setSaved(false);
  };

  const handleSave = () => { setSaved(true); toast.success("Slotting parameters saved"); };
  const handleReset = () => { setParams(DEFAULTS); setSaved(false); toast("Parameters reset to defaults"); };

  // ── Strategy: rule-level handlers ─────────────────────────────────────────

  const dirty = () => setStrategySaved(false);

  const moveRule = (index: number, dir: "up" | "down") => {
    setStrategyRules((prev) => {
      const next = [...prev];
      const swap = dir === "up" ? index - 1 : index + 1;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
    dirty();
  };

  const toggleRule = (id: RuleId) => {
    setStrategyRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
    dirty();
  };

  // ── Strategy: cascade-level handlers ──────────────────────────────────────

  const updateCascadeStep = (ruleId: RuleId, stepId: string, value: string) => {
    setStrategyRules((prev) =>
      prev.map((r) =>
        r.id !== ruleId
          ? r
          : { ...r, cascade: r.cascade.map((s) => (s.id === stepId ? { ...s, value } : s)) }
      )
    );
    dirty();
  };

  const moveCascadeStep = (ruleId: RuleId, index: number, dir: "up" | "down") => {
    setStrategyRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId) return r;
        const cascade = [...r.cascade];
        const swap = dir === "up" ? index - 1 : index + 1;
        [cascade[index], cascade[swap]] = [cascade[swap], cascade[index]];
        return { ...r, cascade };
      })
    );
    dirty();
  };

  const removeCascadeStep = (ruleId: RuleId, stepId: string) => {
    setStrategyRules((prev) =>
      prev.map((r) =>
        r.id !== ruleId ? r : { ...r, cascade: r.cascade.filter((s) => s.id !== stepId) }
      )
    );
    dirty();
  };

  const addCascadeStep = (ruleId: RuleId) => {
    setStrategyRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId) return r;
        const used = new Set(r.cascade.map((s) => s.value));
        const next = ZONE_OPTIONS[ruleId].find((o) => !used.has(o.value));
        if (!next) return r;
        return { ...r, cascade: [...r.cascade, { id: `${ruleId}-${Date.now()}`, value: next.value }] };
      })
    );
    dirty();
  };

  const updateFinalAction = (ruleId: RuleId, action: FinalAction) => {
    setStrategyRules((prev) =>
      prev.map((r) => (r.id !== ruleId ? r : { ...r, finalAction: action }))
    );
    dirty();
  };

  const handleStrategySave = () => { setStrategySaved(true); toast.success("Slotting strategy saved"); };
  const handleStrategyReset = () => { setStrategyRules(DEFAULT_STRATEGY_RULES); setStrategySaved(false); toast("Strategy reset to defaults"); };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 px-7 pb-14 pt-5">
      <div>
        <h1 className="text-[22px] font-medium tracking-[-0.01em] text-foreground">Slotting Configuration</h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
          Rules &amp; thresholds the slotting engine uses to assign optimal storage locations
        </p>
      </div>

      <Tabs defaultValue="global">
        <TabsList className="mb-2 h-auto w-full justify-start gap-1 rounded-none border-b border-border bg-transparent p-0">
          {([
            ["global", "Global Parameters", false],
            ["expiry", "Expiry & NTE Rules", true],
            ["strategy", "Strategy Builder", false],
            ["density", "Density Management", true],
          ] as const).map(([value, label, disabled]) => (
            <TabsTrigger
              key={value}
              value={value}
              disabled={disabled}
              className="rounded-none border-b-2 border-transparent px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Tab 1: Global Parameters ──────────────────────────────────────── */}
        <TabsContent value="global" className="space-y-4 mt-2">
          <Card className="overflow-hidden">
            <SectionHeader title="Demand Classification" description="Controls how the system segments SKUs by velocity for slotting priority." />
            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
              <Field label="ABC Lookback Period" hint="Sales orders within this window determine A / B / C classification.">
                <Select value={params.abcLookback} onValueChange={(v) => { setParams((p) => ({ ...p, abcLookback: v as LookbackDays })); setSaved(false); }}>
                  <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{LOOKBACK_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Affinity Lookback Period" hint="Order co-occurrence within this window determines item affinity groups.">
                <Select value={params.affinityLookback} onValueChange={(v) => { setParams((p) => ({ ...p, affinityLookback: v as LookbackDays })); setSaved(false); }}>
                  <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{LOOKBACK_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <SectionHeader title="Location Zones" description="Define which bin levels are treated as golden zone (highest-velocity pick area)." />
            <div className="p-5">
              <Field label="Golden Zone Levels" hint="Selected levels are automatically classified as golden zone. Typically mid-height levels for ergonomic picking.">
                <div className="mt-1 flex gap-2">
                  {LEVELS.map((lvl) => {
                    const active = params.goldenZoneLevels.includes(lvl);
                    return (
                      <button key={lvl} type="button" onClick={() => toggle(lvl)}
                        className={cn("flex h-10 w-10 items-center justify-center rounded-[4px] border font-mono text-sm font-semibold transition-colors",
                          active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50 hover:bg-muted")}
                        aria-pressed={active} title={`Level ${lvl}`}>
                        {lvl}
                      </button>
                    );
                  })}
                </div>
                {params.goldenZoneLevels.length === 0 && <p className="mt-2 text-xs text-warn">Select at least one level as golden zone.</p>}
              </Field>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <SectionHeader title="Density Thresholds" description="Thresholds used by the consolidation engine to identify and fill under-utilised bins." />
            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
              <Field label="Target Bin Density" hint="The ideal utilisation % the engine aims to reach after consolidation.">
                <div className="relative">
                  <Input type="number" min={1} max={100} value={params.targetDensityPct} onChange={(e) => { setParams((p) => ({ ...p, targetDensityPct: e.target.value })); setSaved(false); }} className="h-9 pr-8" placeholder="60" />
                  <span className="absolute right-3 top-2 text-sm text-muted-foreground">%</span>
                </div>
              </Field>
              <Field label="Low Density Threshold" hint="Bins below this utilisation % are flagged for consolidation.">
                <div className="relative">
                  <Input type="number" min={1} max={100} value={params.lowDensityThresholdPct} onChange={(e) => { setParams((p) => ({ ...p, lowDensityThresholdPct: e.target.value })); setSaved(false); }} className="h-9 pr-8" placeholder="50" />
                  <span className="absolute right-3 top-2 text-sm text-muted-foreground">%</span>
                </div>
              </Field>
            </div>
            {params.lowDensityThresholdPct && params.targetDensityPct && (
              <div className="border-t border-border bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
                Bins below <span className="font-semibold text-foreground">{params.lowDensityThresholdPct}%</span> utilisation will be consolidated into bins targeting <span className="font-semibold text-foreground">{params.targetDensityPct}%</span> density.
              </div>
            )}
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleReset}>Reset to defaults</Button>
            <div className="flex items-center gap-3">
              {saved && <span className="flex items-center gap-1.5 text-sm text-ok"><CheckCircle2 className="h-4 w-4" />Saved</span>}
              <Button onClick={handleSave} disabled={params.goldenZoneLevels.length === 0}>
                <Settings2 className="mr-2 h-4 w-4" />Save Parameters
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 2: Expiry & NTE (placeholder) ────────────────────────────── */}
        <TabsContent value="expiry">
          <Card className="flex flex-col items-center justify-center gap-2 p-16 text-center text-muted-foreground">
            <Settings2 className="h-8 w-8 opacity-40" />
            <p className="text-sm font-medium">Coming soon</p>
            <p className="text-xs">This tab is not yet configured.</p>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Strategy Builder ────────────────────────────────────────── */}
        <TabsContent value="strategy" className="space-y-4 mt-2">

          {/* Rule priority stack */}
          <Card className="overflow-hidden">
            <SectionHeader
              title="Strategy Rules"
              description="Each rule resolves one slotting dimension. Reorder to set priority. The engine works through the fallback chain within each rule before moving on."
            />
            <div className="divide-y divide-border">
              {strategyRules.map((rule, ruleIndex) => {
                const enabledBefore = strategyRules.slice(0, ruleIndex).filter((r) => r.enabled).length;
                const stepNumber = rule.enabled ? enabledBefore + 1 : null;
                const canAddMore = rule.cascade.length < ZONE_OPTIONS[rule.id].length;
                return (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    stepNumber={stepNumber}
                    canMoveUp={ruleIndex > 0}
                    canMoveDown={ruleIndex < strategyRules.length - 1}
                    canAddMore={canAddMore}
                    onMoveUp={() => moveRule(ruleIndex, "up")}
                    onMoveDown={() => moveRule(ruleIndex, "down")}
                    onToggle={() => toggleRule(rule.id)}
                    onUpdateCascadeStep={(stepId, v) => updateCascadeStep(rule.id, stepId, v)}
                    onMoveCascadeStep={(i, dir) => moveCascadeStep(rule.id, i, dir)}
                    onRemoveCascadeStep={(stepId) => removeCascadeStep(rule.id, stepId)}
                    onAddCascadeStep={() => addCascadeStep(rule.id)}
                    onUpdateFinalAction={(a) => updateFinalAction(rule.id, a)}
                  />
                );
              })}
            </div>
          </Card>

          {/* Decision flow */}
          <Card className="overflow-hidden">
            <SectionHeader
              title="Decision Flow"
              description="Live preview of each rule's fallback cascade. The engine tries each option top-down until a slot is found."
            />
            <div className="p-5">
              <DecisionFlow rules={strategyRules} />
            </div>
          </Card>

          {/* Summary */}
          <div className="rounded-md border-l-2 border-ai border-y border-r border-y-border border-r-border bg-ai-bg/40 px-5 py-3 text-xs text-muted-foreground">
            {buildStrategySummary(strategyRules)}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleStrategyReset}>Reset to defaults</Button>
            <div className="flex items-center gap-3">
              {strategySaved && (
                <span className="flex items-center gap-1.5 text-sm text-ok">
                  <CheckCircle2 className="h-4 w-4" />Saved
                </span>
              )}
              <Button onClick={handleStrategySave} disabled={strategyRules.filter((r) => r.enabled).length === 0}>
                <Settings2 className="mr-2 h-4 w-4" />Save Strategy
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 4: Density Management (placeholder) ───────────────────────── */}
        <TabsContent value="density">
          <Card className="flex flex-col items-center justify-center gap-2 p-16 text-center text-muted-foreground">
            <Settings2 className="h-8 w-8 opacity-40" />
            <p className="text-sm font-medium">Coming soon</p>
            <p className="text-xs">This tab is not yet configured.</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── RuleRow ──────────────────────────────────────────────────────────────────

function RuleRow({
  rule,
  stepNumber,
  canMoveUp,
  canMoveDown,
  canAddMore,
  onMoveUp,
  onMoveDown,
  onToggle,
  onUpdateCascadeStep,
  onMoveCascadeStep,
  onRemoveCascadeStep,
  onAddCascadeStep,
  onUpdateFinalAction,
}: {
  rule: StrategyRule;
  stepNumber: number | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canAddMore: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggle: () => void;
  onUpdateCascadeStep: (stepId: string, value: string) => void;
  onMoveCascadeStep: (index: number, dir: "up" | "down") => void;
  onRemoveCascadeStep: (stepId: string) => void;
  onAddCascadeStep: () => void;
  onUpdateFinalAction: (action: FinalAction) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const options = ZONE_OPTIONS[rule.id];

  const collapsedSummary = [
    ...rule.cascade.map((s) => options.find((o) => o.value === s.value)?.label ?? s.value),
    FINAL_ACTION_OPTIONS.find((a) => a.value === rule.finalAction)?.label ?? "",
  ].join(" → ");

  return (
    <div className={cn("transition-colors", !rule.enabled && "bg-muted/20 opacity-60")}>
      {/* ── Rule header ── */}
      <div
        className="flex cursor-pointer items-start gap-3 px-5 py-4 select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Expand chevron */}
        <div className="mt-0.5 flex-shrink-0 text-muted-foreground/50">
          {expanded
            ? <ChevronDown className="h-4 w-4" />
            : <ChevronRight className="h-4 w-4" />}
        </div>
        <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[4px] border font-mono text-[11px] font-semibold">
          {stepNumber !== null
            ? <span className="text-primary">{stepNumber}</span>
            : <span className="text-muted-foreground/40">—</span>}
        </div>
        <rule.Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{rule.label}</div>
          {expanded
            ? <div className="mt-0.5 text-[11px] text-muted-foreground">{rule.description}</div>
            : <div className="mt-0.5 truncate text-[11px] text-muted-foreground/60">{collapsedSummary}</div>
          }
        </div>
        <div className="flex flex-shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <IconBtn onClick={onMoveUp} disabled={!canMoveUp} title="Move up"><ChevronUp className="h-3.5 w-3.5" /></IconBtn>
          <IconBtn onClick={onMoveDown} disabled={!canMoveDown} title="Move down"><ChevronDown className="h-3.5 w-3.5" /></IconBtn>
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "ml-1 rounded-[2px] border px-2 py-1 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em] transition-colors",
              rule.enabled
                ? "border-ok/30 bg-ok-bg text-ok hover:bg-ok-bg/70"
                : "border-border bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {rule.enabled ? "Active" : "Inactive"}
          </button>
        </div>
      </div>

      {/* ── Fallback chain (only when expanded) ── */}
      {expanded && <div className="ml-14 mb-4 space-y-0">
        {rule.cascade.map((step, i) => (
          <div key={step.id}>
            {/* Connector */}
            <div className="flex items-center gap-2 py-1">
              <div className="ml-2.5 w-px self-stretch bg-border" style={{ minHeight: 16 }} />
              <span className="text-[10px] text-muted-foreground">
                {i === 0 ? "try first" : "if full →"}
              </span>
            </div>

            {/* Step row */}
            <div className="flex items-center gap-1.5">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[2px] border bg-muted/40 font-mono text-[10px] font-medium text-muted-foreground">
                {i + 1}
              </div>
              <Select value={step.value} onValueChange={(v) => onUpdateCascadeStep(step.id, v)}>
                <SelectTrigger className="h-8 flex-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <IconBtn onClick={() => onMoveCascadeStep(i, "up")} disabled={i === 0} title="Move up"><ChevronUp className="h-3 w-3" /></IconBtn>
              <IconBtn onClick={() => onMoveCascadeStep(i, "down")} disabled={i === rule.cascade.length - 1} title="Move down"><ChevronDown className="h-3 w-3" /></IconBtn>
              <IconBtn onClick={() => onRemoveCascadeStep(step.id)} disabled={rule.cascade.length <= 1} title="Remove" className="hover:border-destructive/40 hover:text-destructive">
                <X className="h-3 w-3" />
              </IconBtn>
            </div>
          </div>
        ))}

        {/* Else / final action */}
        <div>
          <div className="flex items-center gap-2 py-1">
            <div className="ml-2.5 w-px self-stretch bg-border" style={{ minHeight: 16 }} />
            <span className="text-[10px] text-muted-foreground">else →</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border border-dashed bg-muted/20 text-[10px] font-bold text-muted-foreground">
              !
            </div>
            <Select value={rule.finalAction} onValueChange={(v) => onUpdateFinalAction(v as FinalAction)}>
              <SelectTrigger className={cn("h-8 flex-1 border-dashed text-xs", FINAL_ACTION_COLORS[rule.finalAction])}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FINAL_ACTION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Add fallback button */}
        {canAddMore && (
          <button
            type="button"
            onClick={onAddCascadeStep}
            className="mt-2 flex items-center gap-1 text-[11px] text-primary/80 hover:text-primary transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add fallback step
          </button>
        )}
      </div>}
    </div>
  );
}

// ─── DecisionFlow ─────────────────────────────────────────────────────────────

function DecisionFlow({ rules }: { rules: StrategyRule[] }) {
  const active = rules.filter((r) => r.enabled);

  if (active.length === 0) {
    return (
      <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
        Enable at least one rule to see the decision flow.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-fit items-start gap-3 pb-1">
        {active.map((rule, ruleIndex) => {
          const options = ZONE_OPTIONS[rule.id];
          const finalLabel =
            FINAL_ACTION_OPTIONS.find((a) => a.value === rule.finalAction)?.label ?? "";

          return (
            <div key={rule.id} className="flex items-start gap-3">
              {/* ── Column ── */}
              <div className="flex min-w-[148px] flex-col items-center">
                {/* Rule chip */}
                <div className="flex items-center gap-1.5 rounded-[4px] border border-primary/25 bg-primary/5 px-3 py-1.5">
                  <rule.Icon className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.04em]">{rule.shortLabel}</span>
                  <span className="rounded-[2px] bg-primary/10 px-1.5 font-mono text-[9px] font-bold text-primary">
                    {ruleIndex + 1}
                  </span>
                </div>

                {/* Cascade steps */}
                {rule.cascade.map((step, i) => {
                  const label = options.find((o) => o.value === step.value)?.label ?? step.value;
                  return (
                    <div key={step.id} className="flex flex-col items-center w-full">
                      <Connector label={i === 0 ? "try" : "if full"} />
                      <div className="w-full rounded border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-center text-[11px] font-medium">
                        {label}
                      </div>
                    </div>
                  );
                })}

                {/* Final action */}
                <div className="flex flex-col items-center w-full">
                  <Connector label="else" dashed />
                  <div className={cn("w-full rounded border px-2.5 py-1.5 text-center text-[11px] font-medium", FINAL_ACTION_COLORS[rule.finalAction])}>
                    {finalLabel}
                  </div>
                </div>
              </div>

              {/* ── Gap between columns ── */}
              {ruleIndex < active.length - 1 && (
                <div className="flex-shrink-0 pt-2 text-muted-foreground/30 text-lg select-none">·</div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Each column is an independent slotting dimension resolved in priority order (left → right).
      </p>
    </div>
  );
}

function Connector({ label, dashed }: { label: string; dashed?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0 py-0.5">
      <div className={cn("h-3 w-px", dashed ? "border-l border-dashed border-border" : "bg-border")} />
      <span className="font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
    </div>
  );
}

// ─── Building blocks ──────────────────────────────────────────────────────────

function IconBtn({
  onClick,
  disabled,
  title,
  className,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30",
        className,
      )}
    >
      {children}
    </button>
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
