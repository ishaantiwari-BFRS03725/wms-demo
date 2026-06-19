import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Ban,
  Boxes,
  Clock,
  Flame,
  Footprints,
  Gauge,
  Info,
  Layers,
  Minus,
  PackageMinus,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_wms/lane-congestion")({
  head: () => ({ meta: [{ title: "Zone Insights — Pick Analytics" }] }),
  component: ZoneInsights,
});

// ─── Static config ────────────────────────────────────────────────────────────

type ZoneId = "A" | "B" | "C";

const ZONES: { id: ZoneId; label: string; note: string; lanes: string[] }[] = [
  {
    id: "A",
    label: "Zone A",
    note: "Primary pick · Near dock",
    lanes: ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"],
  },
  {
    id: "B",
    label: "Zone B",
    note: "Secondary · Mid-warehouse",
    lanes: ["B1", "B2", "B3", "B4", "B5", "B6"],
  },
  {
    id: "C",
    label: "Zone C",
    note: "Overflow · Far dock",
    lanes: ["C1", "C2", "C3", "C4", "C5", "C6"],
  },
];

const PICKERS_POOL = [
  "R. Mehta", "S. Khan", "A. Verma", "P. Das", "N. Iyer", "V. Singh",
  "M. Roy", "K. Nair", "T. Bose", "J. Pillai", "D. Shah", "G. Rao",
];

const MIN_THRESHOLD = 25; // pick-face minimum stock % before replenishment is due

// ─── Data generation ──────────────────────────────────────────────────────────

function prand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

interface LaneData {
  zone: ZoneId;
  lane: string;
  laneIdx: number;
  pickers: number; // active operators in the lane right now
  queued: number; // picklists routed through this lane this hour
  picksPerHr: number; // throughput
  dwellMin: number; // avg minutes a picker dwells / waits in the lane
  congestion: number; // 0-100 composite traffic score
  pendingLines: number; // unpicked lines allocated to this lane's pick faces
  aMovers: number; // count of high-velocity A-class SKUs in the lane
  hitRate: number; // pick requests generated per hour
  stockPct: number; // stock at face vs capacity
  trend: "up" | "down" | "flat";
  chokepoint: boolean; // narrow cross-aisle near the dock
}

function generateLane(zoneId: ZoneId, laneIdx: number): LaneData {
  const zi = ["A", "B", "C"].indexOf(zoneId);
  const seed = zi * 1000 + laneIdx * 100;

  // Near-dock zones and near-dock lanes attract more footfall.
  const zoneBase = [60, 44, 30][zi];
  const dockBoost = Math.max(0, (3 - laneIdx) * 7);
  const noise = (prand(seed) - 0.5) * 34;

  const congestion = Math.min(100, Math.max(4, Math.round(zoneBase + dockBoost + noise)));

  const pickers = Math.max(0, Math.round(congestion / 22 + prand(seed + 2) * 1.4));
  const queued = Math.round(congestion / 8 + prand(seed + 4) * 4);
  const picksPerHr = Math.round(40 + congestion * 1.6 + prand(seed + 5) * 30);
  const dwellMin = Math.round(2 + (congestion / 100) * 11 + prand(seed + 6) * 2);

  // Backlog loosely tracks footfall but carries its own noise.
  const pendingLines = Math.max(0, Math.round(congestion * 0.45 + (prand(seed + 10) - 0.25) * 48));
  // A-movers cluster near the dock; they drive a disproportionate hit rate.
  const aMovers = Math.min(6, Math.round(prand(seed + 11) * 3 + dockBoost / 6));
  const hitRate = Math.round(18 + aMovers * 24 + prand(seed + 12) * 30);
  // Stock at face — some lanes near or below the replenishment threshold.
  const stockPct = Math.round(prand(seed + 13) * 100);

  const t = prand(seed + 8);
  const trend: LaneData["trend"] =
    congestion > 70 ? (t > 0.35 ? "up" : "flat") : t > 0.7 ? "up" : t > 0.4 ? "flat" : "down";

  const chokepoint = laneIdx < 2 && zi < 2; // entry cross-aisles in busy zones

  return {
    zone: zoneId,
    lane: `${zoneId}${laneIdx + 1}`,
    laneIdx,
    pickers,
    queued,
    picksPerHr,
    dwellMin,
    congestion,
    pendingLines,
    aMovers,
    hitRate,
    stockPct,
    trend,
    chokepoint,
  };
}

function pickerNames(lane: LaneData): string[] {
  const out: string[] = [];
  const start = (["A", "B", "C"].indexOf(lane.zone) * 4 + lane.laneIdx) % PICKERS_POOL.length;
  for (let i = 0; i < lane.pickers; i++) {
    out.push(PICKERS_POOL[(start + i) % PICKERS_POOL.length]);
  }
  return out;
}

// ─── Colour ramps ─────────────────────────────────────────────────────────────
// One consistent grammar: tier 0 = nothing to do, tier 3 = needs the supervisor.

interface TierStyle { cell: string; chip: string; dot: string; text: string }

const RAMPS: Record<"attention" | "neutral", [TierStyle, TierStyle, TierStyle, TierStyle]> = {
  attention: [
    { cell: "bg-emerald-100 border-emerald-200 text-emerald-800", chip: "bg-emerald-100 border-emerald-200", dot: "bg-emerald-500", text: "text-emerald-600" },
    { cell: "bg-amber-200 border-amber-300 text-amber-900", chip: "bg-amber-200 border-amber-300", dot: "bg-amber-400", text: "text-amber-600" },
    { cell: "bg-orange-400 border-orange-500 text-white", chip: "bg-orange-400 border-orange-500", dot: "bg-orange-500", text: "text-orange-600" },
    { cell: "bg-red-600 border-red-700 text-white", chip: "bg-red-600 border-red-700", dot: "bg-red-600", text: "text-red-600" },
  ],
  neutral: [
    { cell: "bg-slate-100 border-slate-200 text-slate-700", chip: "bg-slate-100 border-slate-200", dot: "bg-slate-400", text: "text-slate-600" },
    { cell: "bg-sky-100 border-sky-200 text-sky-800", chip: "bg-sky-100 border-sky-200", dot: "bg-sky-400", text: "text-sky-600" },
    { cell: "bg-sky-300 border-sky-400 text-sky-900", chip: "bg-sky-300 border-sky-400", dot: "bg-sky-500", text: "text-sky-700" },
    { cell: "bg-sky-600 border-sky-700 text-white", chip: "bg-sky-600 border-sky-700", dot: "bg-sky-600", text: "text-sky-700" },
  ],
};

const TIER_ORDER = [3, 2, 1, 0] as const;

/** score < t[0] → 0, < t[1] → 1, < t[2] → 2, else 3 */
function tierFrom(value: number, t: [number, number, number]): number {
  if (value < t[0]) return 0;
  if (value < t[1]) return 1;
  if (value < t[2]) return 2;
  return 3;
}

// ─── Metric views ─────────────────────────────────────────────────────────────

interface KpiSpec {
  icon: LucideIcon;
  iconClass?: string;
  label: string;
  value: string;
  sub: string;
  accent?: string;
}

type ViewId = "congestion" | "pending" | "hits" | "replen" | "pickers";

interface ViewDef {
  id: ViewId;
  label: string;
  icon: LucideIcon;
  caption: string;
  ramp: "attention" | "neutral";
  tierLabels: [string, string, string, string];
  tierOf: (l: LaneData) => number;
  score: (l: LaneData) => number; // 0-100, drives the detail gauge bar & peak ranking
  cellValue: (l: LaneData) => string;
  cellSub: string;
  primaryLabel: string;
  primaryValue: (l: LaneData) => string;
  zoneValue: (lanes: LaneData[]) => string;
  rows: (l: LaneData) => { label: string; value: string; valueClass?: string }[];
  reco: (l: LaneData) => string;
  kpis: (lanes: LaneData[]) => KpiSpec[];
}

const sum = (lanes: LaneData[], f: (l: LaneData) => number) => lanes.reduce((s, l) => s + f(l), 0);
const peakBy = (lanes: LaneData[], f: (l: LaneData) => number) =>
  lanes.reduce((a, b) => (f(b) > f(a) ? b : a));
const aisleRow = (l: LaneData) => ({
  label: "Aisle type",
  value: l.chokepoint ? "Cross-aisle chokepoint" : "Standard lane",
  valueClass: l.chokepoint ? "text-orange-600" : "",
});

const VIEWS: ViewDef[] = [
  {
    id: "congestion",
    label: "Congestion",
    icon: Footprints,
    caption: "Live picker footfall per lane — hot lanes signal traffic build-up where carts and pickers block each other.",
    ramp: "attention",
    tierLabels: ["Clear", "Busy", "Congested", "Blocked"],
    tierOf: (l) => tierFrom(l.congestion, [40, 66, 86]),
    score: (l) => l.congestion,
    cellValue: (l) => `${l.congestion}%`,
    cellSub: "load",
    primaryLabel: "Lane load",
    primaryValue: (l) => `${l.congestion}%`,
    zoneValue: (lanes) => `${Math.round(sum(lanes, (l) => l.congestion) / lanes.length)}% avg`,
    rows: (l) => [
      { label: "Active pickers", value: String(l.pickers) },
      { label: "Picklists routed", value: `${l.queued} / hr` },
      { label: "Throughput", value: `${l.picksPerHr} picks/hr` },
      { label: "Avg dwell", value: `${l.dwellMin} min`, valueClass: l.dwellMin > 9 ? "text-red-600" : "" },
      aisleRow(l),
    ],
    reco: (l) =>
      l.congestion > 85
        ? "Throttle new picklist release into this lane and stagger pickers to clear the jam."
        : l.congestion > 65
          ? "Re-route the next wave's picks through a parallel lane to avoid a block."
          : l.congestion >= 40
            ? "Healthy footfall — keep monitoring as the wave progresses."
            : "Spare capacity — safe to route additional picklists here.",
    kpis: (lanes) => [
      { icon: Users, label: "Active pickers", value: String(sum(lanes, (l) => l.pickers)), sub: `across ${lanes.length} lanes` },
      { icon: Ban, iconClass: "text-red-500", label: "Likely blocked", value: String(lanes.filter((l) => l.congestion > 85).length), sub: "load > 85%", accent: "text-red-600" },
      { icon: AlertTriangle, iconClass: "text-orange-500", label: "Congested", value: String(lanes.filter((l) => l.congestion > 65 && l.congestion <= 85).length), sub: "66 – 85% load", accent: "text-orange-600" },
      { icon: Clock, iconClass: "text-amber-500", label: "Peak lane dwell", value: `${Math.max(...lanes.map((l) => l.dwellMin))}m`, sub: "slowest lane", accent: "text-amber-600" },
    ],
  },
  {
    id: "pending",
    label: "Pending Lines",
    icon: Layers,
    caption: "Unpicked order lines allocated to each lane's pick faces — deep-red lanes are the biggest pick backlogs.",
    ramp: "attention",
    tierLabels: ["Light", "Moderate", "Heavy", "Critical"],
    tierOf: (l) => tierFrom(l.pendingLines, [12, 28, 45]),
    score: (l) => Math.min(100, (l.pendingLines / 60) * 100),
    cellValue: (l) => String(l.pendingLines),
    cellSub: "lines",
    primaryLabel: "Pending lines",
    primaryValue: (l) => `${l.pendingLines} lines`,
    zoneValue: (lanes) => `${sum(lanes, (l) => l.pendingLines)} lines`,
    rows: (l) => [
      { label: "Pending lines", value: String(l.pendingLines) },
      { label: "Picklists routed", value: `${l.queued} / hr` },
      { label: "Throughput", value: `${l.picksPerHr} picks/hr` },
      { label: "Active pickers", value: String(l.pickers) },
      aisleRow(l),
    ],
    reco: (l) =>
      l.pendingLines > 45
        ? "Heavy unpicked backlog — pull extra pickers onto this zone's faces before SLA slips."
        : l.pendingLines > 28
          ? "Backlog building — prioritise this lane in the next wave release."
          : l.pendingLines >= 12
            ? "Manageable queue — on track."
            : "Faces nearly clear — no action needed.",
    kpis: (lanes) => {
      const total = sum(lanes, (l) => l.pendingLines);
      const peak = peakBy(lanes, (l) => l.pendingLines);
      return [
        { icon: Layers, label: "Pending lines", value: String(total), sub: "unpicked · allocated" },
        { icon: AlertTriangle, iconClass: "text-red-500", label: "Critical lanes", value: String(lanes.filter((l) => l.pendingLines > 45).length), sub: "> 45 lines", accent: "text-red-600" },
        { icon: Gauge, label: "Avg per lane", value: String(Math.round(total / lanes.length)), sub: "lines / lane" },
        { icon: ArrowUpRight, iconClass: "text-orange-500", label: "Deepest lane", value: peak.lane, sub: `${peak.pendingLines} lines`, accent: "text-orange-600" },
      ];
    },
  },
  {
    id: "hits",
    label: "SKU Hits",
    icon: Flame,
    caption: "Pick requests per hour driven by high-velocity A-movers — hot lanes warrant temporary picker reallocation.",
    ramp: "attention",
    tierLabels: ["Low", "Normal", "Elevated", "Hot"],
    tierOf: (l) => tierFrom(l.hitRate, [55, 90, 120]),
    score: (l) => Math.min(100, (l.hitRate / 150) * 100),
    cellValue: (l) => String(l.hitRate),
    cellSub: "hits/hr",
    primaryLabel: "Pick requests",
    primaryValue: (l) => `${l.hitRate} / hr`,
    zoneValue: (lanes) => `${sum(lanes, (l) => l.hitRate)}/hr`,
    rows: (l) => [
      { label: "Pick requests", value: `${l.hitRate} / hr` },
      { label: "A-class SKUs", value: String(l.aMovers), valueClass: l.aMovers >= 4 ? "text-orange-600" : "" },
      { label: "Active pickers", value: String(l.pickers) },
      { label: "Throughput", value: `${l.picksPerHr} picks/hr` },
      aisleRow(l),
    ],
    reco: (l) =>
      l.hitRate > 120
        ? "High-velocity A-movers concentrated here — temporarily reassign pickers or split into a forward-pick face."
        : l.hitRate > 90
          ? "Elevated demand — watch for queueing and pre-stage replenishment."
          : l.hitRate >= 55
            ? "Normal demand."
            : "Low demand — capacity available.",
    kpis: (lanes) => {
      const peak = peakBy(lanes, (l) => l.hitRate);
      return [
        { icon: Flame, iconClass: "text-orange-500", label: "Pick requests", value: String(sum(lanes, (l) => l.hitRate)), sub: "per hour" },
        { icon: AlertTriangle, iconClass: "text-red-500", label: "Hot lanes", value: String(lanes.filter((l) => l.hitRate > 120).length), sub: "reallocate staff", accent: "text-red-600" },
        { icon: Boxes, label: "A-class SKUs", value: String(sum(lanes, (l) => l.aMovers)), sub: "high-velocity" },
        { icon: ArrowUpRight, iconClass: "text-orange-500", label: "Hottest lane", value: peak.lane, sub: `${peak.hitRate}/hr`, accent: "text-orange-600" },
      ];
    },
  },
  {
    id: "replen",
    label: "Replen Risk",
    icon: PackageMinus,
    caption: "Pick faces near zero-scan or below minimum — replenishment carts here clash with pickers in narrow aisles.",
    ramp: "attention",
    tierLabels: ["Stocked", "Watch", "Below min", "Zero-scan"],
    tierOf: (l) => (l.stockPct < 8 ? 3 : l.stockPct < MIN_THRESHOLD ? 2 : l.stockPct < 45 ? 1 : 0),
    score: (l) => 100 - l.stockPct, // risk: emptier face = bigger bar
    cellValue: (l) => `${l.stockPct}%`,
    cellSub: "in stock",
    primaryLabel: "Replenishment risk",
    primaryValue: (l) => `${l.stockPct}% stock`,
    zoneValue: (lanes) => `${lanes.filter((l) => l.stockPct < MIN_THRESHOLD).length} below min`,
    rows: (l) => [
      { label: "Stock at face", value: `${l.stockPct}%`, valueClass: l.stockPct < MIN_THRESHOLD ? "text-red-600" : "" },
      { label: "Min threshold", value: `${MIN_THRESHOLD}%` },
      { label: "Zero-scan", value: l.stockPct < 8 ? "Yes" : "No", valueClass: l.stockPct < 8 ? "text-red-600" : "" },
      { label: "Active pickers", value: String(l.pickers) },
      aisleRow(l),
    ],
    reco: (l) =>
      l.stockPct < 8
        ? "Pick face at/near zero-scan — schedule replenishment now and coordinate the cart with pickers in this narrow aisle."
        : l.stockPct < MIN_THRESHOLD
          ? "Below minimum — queue a replenishment move before it stalls active picks."
          : l.stockPct < 45
            ? "Approaching minimum — monitor and pre-plan the next replen."
            : "Well stocked — no replenishment due.",
    kpis: (lanes) => [
      { icon: PackageMinus, iconClass: "text-red-500", label: "Below minimum", value: String(lanes.filter((l) => l.stockPct < MIN_THRESHOLD).length), sub: "need replen", accent: "text-red-600" },
      { icon: Ban, iconClass: "text-red-500", label: "Zero-scan faces", value: String(lanes.filter((l) => l.stockPct < 8).length), sub: "empty faces", accent: "text-red-600" },
      { icon: Gauge, label: "Avg stock", value: `${Math.round(sum(lanes, (l) => l.stockPct) / lanes.length)}%`, sub: "at pick faces" },
      { icon: Users, iconClass: "text-orange-500", label: "Pickers at risk", value: String(sum(lanes, (l) => (l.stockPct < MIN_THRESHOLD ? l.pickers : 0))), sub: "in low-stock aisles", accent: "text-orange-600" },
    ],
  },
  {
    id: "pickers",
    label: "Pickers",
    icon: Users,
    caption: "Operators currently logged in and on task per zone — read the zone summaries on the left for headcount balance.",
    ramp: "neutral",
    tierLabels: ["Empty", "Light", "Staffed", "Crowded"],
    tierOf: (l) => (l.pickers >= 4 ? 3 : l.pickers === 3 ? 2 : l.pickers >= 1 ? 1 : 0),
    score: (l) => Math.min(100, l.pickers * 20),
    cellValue: (l) => String(l.pickers),
    cellSub: "pickers",
    primaryLabel: "Operators in lane",
    primaryValue: (l) => `${l.pickers} on task`,
    zoneValue: (lanes) => `${lanes.filter((l) => l.pickers > 0).length}/${lanes.length} lanes`,
    rows: (l) => [
      { label: "Active pickers", value: String(l.pickers) },
      { label: "Picklists routed", value: `${l.queued} / hr` },
      { label: "Throughput", value: `${l.picksPerHr} picks/hr` },
      { label: "Pending lines", value: String(l.pendingLines) },
      aisleRow(l),
    ],
    reco: (l) =>
      l.pickers >= 4
        ? "Heavily staffed — confirm the workload justifies the headcount or redeploy to a starved zone."
        : l.pickers === 3
          ? "Well staffed for current load."
          : l.pickers >= 1
            ? "Lightly staffed — fine unless backlog grows."
            : "No operators assigned — spare capacity to absorb reallocations.",
    kpis: (lanes) => {
      const totals: Record<ZoneId, number> = { A: 0, B: 0, C: 0 };
      for (const l of lanes) totals[l.zone] += l.pickers;
      const busiest = (Object.keys(totals) as ZoneId[]).reduce((a, b) => (totals[b] > totals[a] ? b : a));
      return [
        { icon: Users, label: "Active operators", value: String(sum(lanes, (l) => l.pickers)), sub: `across ${lanes.length} lanes` },
        { icon: Footprints, iconClass: "text-sky-500", label: "Busiest zone", value: `Zone ${busiest}`, sub: `${totals[busiest]} on task`, accent: "text-sky-600" },
        { icon: Boxes, label: "Lanes active", value: String(lanes.filter((l) => l.pickers > 0).length), sub: "with operators" },
        { icon: Minus, iconClass: "text-slate-400", label: "Idle lanes", value: String(lanes.filter((l) => l.pickers === 0).length), sub: "no operators", accent: "text-slate-500" },
      ];
    },
  },
];

function TrendIcon({ t }: { t: LaneData["trend"] }) {
  if (t === "up") return <ArrowUpRight className="h-3 w-3 text-red-500" />;
  if (t === "down") return <ArrowDownRight className="h-3 w-3 text-emerald-500" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ZoneInsights() {
  const [viewId, setViewId] = useState<ViewId>("congestion");
  const [filter, setFilter] = useState<number | "all">("all");
  const [selected, setSelected] = useState<LaneData | null>(null);

  const view = VIEWS.find((v) => v.id === viewId)!;
  const ramp = RAMPS[view.ramp];

  const lanes = useMemo(() => {
    const all: LaneData[] = [];
    for (const z of ZONES) z.lanes.forEach((_, i) => all.push(generateLane(z.id, i)));
    return all;
  }, []);

  const byZone = useMemo(() => {
    const m = new Map<ZoneId, LaneData[]>();
    for (const z of ZONES) m.set(z.id, lanes.filter((l) => l.zone === z.id));
    return m;
  }, [lanes]);

  const kpis = view.kpis(lanes);
  const handleCell = (lane: LaneData) =>
    setSelected((prev) => (prev?.lane === lane.lane ? null : lane));

  const selTier = selected ? view.tierOf(selected) : 0;

  return (
    <div className="flex h-full flex-col gap-4 px-7 py-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.01em]">Zone Insights</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{view.caption}</p>
        </div>
        <span className="mt-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Live · updated 09:42
        </span>
      </div>

      {/* ── View switcher (primary control) ── */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">View:</span>
        <div className="flex flex-wrap gap-1 rounded-[6px] border border-border bg-muted/40 p-1">
          {VIEWS.map((v) => {
            const active = v.id === viewId;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => { setViewId(v.id); setFilter("all"); setSelected(null); }}
                className={cn(
                  "flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <v.icon className="h-3.5 w-3.5" />
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── KPI bar (per view) ── */}
      <div className="grid grid-cols-4 gap-3">
        {kpis.map((k) => (
          <KpiCard
            key={k.label}
            icon={<k.icon className={cn("h-4 w-4 text-muted-foreground", k.iconClass)} />}
            label={k.label}
            value={k.value}
            sub={k.sub}
            accent={k.accent}
          />
        ))}
      </div>

      {/* ── Tier filter chips (relabel per view) ── */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">Show:</span>
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-[4px] border px-3 py-1 text-xs font-medium transition-colors",
            filter === "all"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:bg-muted/40",
          )}
        >
          All lanes
        </button>
        {TIER_ORDER.map((tier) => {
          const active = filter === tier;
          return (
            <button
              key={tier}
              type="button"
              onClick={() => setFilter(tier)}
              className={cn(
                "flex items-center gap-1.5 rounded-[4px] border px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/40",
              )}
            >
              <span className={cn("h-2 w-2 flex-shrink-0 rounded-full", active ? "bg-white/80" : ramp[tier].dot)} />
              {view.tierLabels[tier]}
            </button>
          );
        })}
      </div>

      {/* ── Main area: floor map + detail panel ── */}
      <div className="flex min-h-0 flex-1 gap-4">
        {/* Floor map */}
        <Card className="flex flex-1 flex-col overflow-auto p-5">
          <div className="flex flex-col gap-4">
            {ZONES.map((z) => {
              const zoneLanes = byZone.get(z.id)!;
              const zonePickers = sum(zoneLanes, (l) => l.pickers);
              const zoneTier = Math.max(...zoneLanes.map(view.tierOf));
              const peak = peakBy(zoneLanes, view.score);
              return (
                <div key={z.id} className="flex items-stretch gap-3">
                  {/* Zone summary */}
                  <div className="flex w-40 flex-shrink-0 flex-col justify-center rounded-[4px] border border-border bg-muted/30 px-3 py-2.5">
                    <div className="font-mono text-xs font-medium uppercase tracking-[0.06em]">{z.label}</div>
                    <div className="text-[10px] text-muted-foreground">{z.note}</div>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span className="font-semibold text-foreground tabular-nums">{zonePickers}</span>
                      </span>
                      <span className={cn("text-[11px] font-semibold tabular-nums", ramp[zoneTier].text)}>
                        {view.zoneValue(zoneLanes)}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      Peak: <span className="font-medium text-foreground">{peak.lane}</span>
                    </div>
                  </div>

                  {/* Lanes */}
                  <div className="flex flex-1 gap-1.5">
                    {zoneLanes.map((lane) => {
                      const tier = view.tierOf(lane);
                      const dimmed = filter !== "all" && tier !== filter;
                      const isSel = selected?.lane === lane.lane;
                      return (
                        <button
                          key={lane.lane}
                          type="button"
                          title={`${lane.lane} · ${view.primaryValue(lane)}`}
                          onClick={() => handleCell(lane)}
                          className={cn(
                            "relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[3px] border py-3 transition-all",
                            ramp[tier].cell,
                            dimmed && "opacity-15",
                            isSel && "ring-2 ring-primary ring-offset-1",
                          )}
                        >
                          <span className="font-mono text-[10px] font-medium opacity-80">{lane.lane}</span>
                          <span className="font-mono text-sm font-bold tabular-nums">{view.cellValue(lane)}</span>
                          <span className="text-[9px] opacity-90">{view.cellSub}</span>
                          {lane.chokepoint && (
                            <span className="absolute right-1 top-1 text-[9px]" title="Narrow cross-aisle — chokepoint">
                              ⚠
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-5 flex items-center gap-4 border-t border-border pt-3">
            <span className="text-[11px] text-muted-foreground">{view.label}:</span>
            {[0, 1, 2, 3].map((tier) => (
              <div key={tier} className="flex items-center gap-1.5">
                <div className={cn("h-3.5 w-5 rounded-sm border", ramp[tier].chip)} />
                <span className="text-[10px] text-muted-foreground">{view.tierLabels[tier]}</span>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-[9px]">⚠</span>
              <span className="text-[10px] text-muted-foreground">Cross-aisle chokepoint</span>
            </div>
          </div>
        </Card>

        {/* ── Detail panel ── */}
        {selected ? (
          <Card className="w-60 flex-shrink-0 overflow-auto">
            <div className="flex items-start justify-between border-b border-border px-4 py-3">
              <div>
                <div className="font-mono text-[11px] font-medium uppercase tracking-[0.08em]">Lane Detail</div>
                <div className="text-[11px] text-muted-foreground">
                  Zone {selected.zone} · Lane {selected.lane}
                  {selected.chokepoint && <span className="ml-1" title="Chokepoint">⚠</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-4 px-4 py-4">
              {/* Primary gauge */}
              <div>
                <div className="mb-1 flex items-end justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                    {view.primaryLabel}
                  </span>
                  <span className={cn("flex items-center gap-1 text-xl font-bold", ramp[selTier].text)}>
                    {view.primaryValue(selected)}
                    <TrendIcon t={selected.trend} />
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-[2px] bg-muted">
                  <div
                    className={cn("h-full rounded-[2px] transition-all", ramp[selTier].dot)}
                    style={{ width: `${view.score(selected)}%` }}
                  />
                </div>
                <div className={cn("mt-1 text-[11px] font-medium", ramp[selTier].text)}>
                  {view.tierLabels[selTier]}
                </div>
              </div>

              {view.rows(selected).map((r) => (
                <DetailRow key={r.label} label={r.label} value={r.value} valueClass={r.valueClass} />
              ))}

              {/* Pickers in lane */}
              {selected.pickers > 0 && (
                <div>
                  <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                    In lane now
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pickerNames(selected).map((n) => (
                      <span
                        key={n}
                        className="rounded-[3px] border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] text-foreground"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendation */}
              <div className="rounded-[4px] border border-border bg-muted/30 px-3 py-2">
                <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                  Recommendation
                </div>
                <div className="mt-0.5 text-[11px] leading-snug text-foreground">{view.reco(selected)}</div>
              </div>
            </div>
          </Card>
        ) : (
          <div className="flex w-60 flex-shrink-0 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border text-center text-muted-foreground">
            <Info className="h-5 w-5 opacity-30" />
            <p className="text-xs">
              Click any lane
              <br />
              to see {view.label.toLowerCase()} detail
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  sub,
  accent = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <Card className="flex items-center gap-3 px-4 py-3">
      {icon}
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
        <div className={cn("text-2xl font-semibold leading-tight tabular-nums", accent)}>{value}</div>
        <div className="font-mono text-[10px] text-muted-foreground">{sub}</div>
      </div>
    </Card>
  );
}

function DetailRow({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="flex-shrink-0 font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </span>
      <span className={cn("text-right text-[11px] font-medium", valueClass)}>{value}</span>
    </div>
  );
}
