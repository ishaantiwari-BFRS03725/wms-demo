import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  LayoutGrid,
  TrendingDown,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_wms/slotting")({
  head: () => ({ meta: [{ title: "Bin Density Heatmap — Slotting" }] }),
  component: SlottingHeatmap,
});

// ─── Static config ────────────────────────────────────────────────────────────

const ZONES = [
  { id: "A" as const, label: "Zone A", note: "Primary pick · Near dock" },
  { id: "B" as const, label: "Zone B", note: "Secondary · Mid-warehouse" },
  { id: "C" as const, label: "Zone C", note: "Overflow · Far dock" },
];

type ZoneId = "A" | "B" | "C";
type DensityFilter = "all" | "hot" | "high" | "healthy" | "low";

const AISLES = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"];
const LEVELS_TOP_DOWN = [5, 4, 3, 2, 1];
const GOLDEN_LEVELS = new Set([2, 3]);

const MOCK_SKUS = [
  "SKU-4421", "SKU-0892", "SKU-1134", "SKU-7783", "SKU-2256",
  "SKU-9901", "SKU-3347", "SKU-6612", "SKU-0033", "SKU-8854",
  "SKU-5571", "SKU-2298",
];

const ACTIVITY_LABELS = [
  "Today", "2 hrs ago", "4 hrs ago", "Yesterday", "3 days ago", "5 days ago",
];

// ─── Data generation ──────────────────────────────────────────────────────────

function prand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

interface BinData {
  aisle: string;
  level: number;
  density: number;
  topSku: string;
  lastActivity: string;
}

function generateBin(zoneId: ZoneId, aisleIdx: number, level: number): BinData {
  const zi = ["A", "B", "C"].indexOf(zoneId);
  const seed = zi * 1000 + aisleIdx * 100 + level * 10;

  const zoneBase = [64, 49, 34][zi];
  const dockBoost = Math.max(0, (6 - aisleIdx) * 4);
  const levelBoost = GOLDEN_LEVELS.has(level) ? 13 : level === 5 ? -9 : level === 1 ? -4 : 0;
  const noise = (prand(seed) - 0.5) * 38;

  const density = Math.min(100, Math.max(0, Math.round(zoneBase + dockBoost + levelBoost + noise)));
  const topSku = MOCK_SKUS[Math.floor(prand(seed + 3) * MOCK_SKUS.length)];
  const lastActivity = ACTIVITY_LABELS[Math.floor(prand(seed + 7) * ACTIVITY_LABELS.length)];

  return { aisle: AISLES[aisleIdx], level, density, topSku, lastActivity };
}

function useZoneBins(zoneId: ZoneId): BinData[] {
  return useMemo(() => {
    const bins: BinData[] = [];
    for (let ai = 0; ai < AISLES.length; ai++) {
      for (const lvl of LEVELS_TOP_DOWN) {
        bins.push(generateBin(zoneId, ai, lvl));
      }
    }
    return bins;
  }, [zoneId]);
}

// ─── Styling helpers ──────────────────────────────────────────────────────────

function densityBand(pct: number): DensityFilter {
  if (pct > 85) return "hot";
  if (pct > 70) return "high";
  if (pct >= 45) return "healthy";
  return "low";
}

const BAND_STYLES: Record<DensityFilter | "all", { cell: string; label: string; dot: string }> = {
  all:     { cell: "",                                         label: "All",        dot: "" },
  low:     { cell: "bg-slate-100 border-slate-200",           label: "< 45%",      dot: "bg-slate-400" },
  healthy: { cell: "bg-emerald-100 border-emerald-200",       label: "45 – 70%",   dot: "bg-emerald-500" },
  high:    { cell: "bg-orange-200 border-orange-300",         label: "71 – 85%",   dot: "bg-orange-400" },
  hot:     { cell: "bg-red-500 border-red-600 text-white",    label: "> 85%",      dot: "bg-red-500" },
};

function cellStyle(density: number): string {
  const band = densityBand(density);
  return BAND_STYLES[band].cell;
}

function matchesFilter(density: number, filter: DensityFilter): boolean {
  if (filter === "all") return true;
  return densityBand(density) === filter;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SlottingHeatmap() {
  const [zone, setZone] = useState<ZoneId>("A");
  const [filter, setFilter] = useState<DensityFilter>("all");
  const [selected, setSelected] = useState<BinData | null>(null);

  const bins = useZoneBins(zone);

  const avgDensity = Math.round(bins.reduce((s, b) => s + b.density, 0) / bins.length);
  const hotCount = bins.filter((b) => b.density > 85).length;
  const lowCount = bins.filter((b) => b.density < 30).length;
  const fullCount = bins.filter((b) => b.density === 100).length;

  // build lookup: aisle → level → bin
  const binMap = useMemo(() => {
    const m = new Map<string, BinData>();
    for (const b of bins) m.set(`${b.aisle}-${b.level}`, b);
    return m;
  }, [bins]);

  const handleCell = (bin: BinData) =>
    setSelected((prev) => (prev?.aisle === bin.aisle && prev?.level === bin.level ? null : bin));

  return (
    <div className="flex h-full flex-col gap-4 px-7 py-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.01em]">Bin Density Heatmap</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live utilisation view across warehouse zones. Hot bins may need consolidation or replenishment.
          </p>
        </div>
        <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
          Refreshed at 09:42 today
        </span>
      </div>

      {/* ── Zone tabs ── */}
      <div className="flex items-center gap-1.5">
        {ZONES.map((z) => (
          <button
            key={z.id}
            type="button"
            onClick={() => { setZone(z.id); setSelected(null); }}
            className={cn(
              "rounded-[4px] border px-4 py-2 text-left transition-colors",
              zone === z.id
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:bg-muted/40",
            )}
          >
            <div className={cn("font-mono text-xs font-medium uppercase tracking-[0.06em]", zone === z.id ? "text-primary" : "")}>
              {z.label}
            </div>
            <div className="text-[10px] text-muted-foreground">{z.note}</div>
          </button>
        ))}
      </div>

      {/* ── KPI bar ── */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          icon={<LayoutGrid className="h-4 w-4 text-muted-foreground" />}
          label="Avg density"
          value={`${avgDensity}%`}
          sub={`${AISLES.length * LEVELS_TOP_DOWN.length} bins`}
        />
        <KpiCard
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          label="Hot spots"
          value={String(hotCount)}
          sub="> 85% full"
          accent="text-red-600"
        />
        <KpiCard
          icon={<TrendingDown className="h-4 w-4 text-slate-400" />}
          label="Under-utilised"
          value={String(lowCount)}
          sub="< 30% full"
          accent="text-slate-500"
        />
        <KpiCard
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          label="At capacity"
          value={String(fullCount)}
          sub="100% full"
          accent="text-emerald-600"
        />
      </div>

      {/* ── Controls row: density filter ── */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">Show:</span>
        {(["all", "hot", "high", "healthy", "low"] as const).map((f) => {
          const s = BAND_STYLES[f];
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "flex items-center gap-1.5 rounded-[4px] border px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/40",
              )}
            >
              {f !== "all" && (
                <span className={cn("h-2 w-2 rounded-full flex-shrink-0", active ? "bg-white/80" : s.dot)} />
              )}
              {f === "all" ? "All bins" : s.label}
            </button>
          );
        })}
      </div>

      {/* ── Main area: heatmap + detail panel ── */}
      <div className="flex min-h-0 flex-1 gap-4">
        {/* Heatmap card */}
        <Card className="flex flex-1 flex-col overflow-hidden p-5">
          <div className="flex min-h-0 flex-1 gap-3">
            {/* Level labels */}
            <div className="flex flex-col justify-around pb-6">
              {LEVELS_TOP_DOWN.map((lvl) => (
                <div key={lvl} className="flex items-center gap-1">
                  <span className="w-12 text-right text-[11px] text-muted-foreground">
                    Lv {lvl}
                  </span>
                  {GOLDEN_LEVELS.has(lvl) && (
                    <span className="text-[9px] text-amber-500" title="Golden zone">★</span>
                  )}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex flex-1 flex-col gap-0">
              {/* Rows = levels (top → bottom) */}
              {LEVELS_TOP_DOWN.map((lvl) => (
                <div key={lvl} className="flex flex-1 gap-1">
                  {AISLES.map((aisle) => {
                    const bin = binMap.get(`${aisle}-${lvl}`)!;
                    const dimmed = !matchesFilter(bin.density, filter);
                    const isSelected =
                      selected?.aisle === aisle && selected?.level === lvl;
                    const isGolden = GOLDEN_LEVELS.has(lvl);

                    return (
                      <button
                        key={aisle}
                        type="button"
                        title={`${aisle} · Level ${lvl} · ${bin.density}%`}
                        onClick={() => handleCell(bin)}
                        className={cn(
                          "relative flex flex-1 items-center justify-center rounded-[2px] border font-mono text-[10px] font-semibold transition-all",
                          cellStyle(bin.density),
                          dimmed && "opacity-15",
                          isGolden && !dimmed && "ring-1 ring-amber-400/40 ring-inset",
                          isSelected && "ring-2 ring-primary ring-offset-1",
                        )}
                      >
                        {bin.density}%
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* Aisle labels */}
              <div className="mt-1.5 flex gap-1">
                {AISLES.map((a) => (
                  <div
                    key={a}
                    className="flex-1 text-center text-[10px] text-muted-foreground"
                  >
                    {a}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 border-t border-border pt-3">
            <span className="text-[11px] text-muted-foreground">Density:</span>
            {(["low", "healthy", "high", "hot"] as const).map((band) => (
              <div key={band} className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "h-3.5 w-5 rounded-sm border",
                    BAND_STYLES[band].cell.replace("text-white", ""),
                  )}
                />
                <span className="text-[10px] text-muted-foreground">
                  {BAND_STYLES[band].label}
                </span>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-[9px] text-amber-500">★</span>
              <span className="text-[10px] text-muted-foreground">Golden zone levels</span>
            </div>
          </div>
        </Card>

        {/* ── Detail panel ── */}
        {selected ? (
          <Card className="w-56 flex-shrink-0 overflow-hidden">
            <div className="flex items-start justify-between border-b border-border px-4 py-3">
              <div>
                <div className="font-mono text-[11px] font-medium uppercase tracking-[0.08em]">Bin Detail</div>
                <div className="text-[11px] text-muted-foreground">
                  Zone {zone} · {selected.aisle} · Level {selected.level}
                  {GOLDEN_LEVELS.has(selected.level) && (
                    <span className="ml-1 text-amber-500">★</span>
                  )}
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

            <div className="px-4 py-4 space-y-4">
              {/* Density gauge */}
              <div>
                <div className="mb-1 flex items-end justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Density</span>
                  <span className={cn(
                    "text-xl font-bold",
                    selected.density > 85 ? "text-red-600"
                    : selected.density > 70 ? "text-orange-500"
                    : selected.density >= 45 ? "text-emerald-600"
                    : "text-slate-500"
                  )}>
                    {selected.density}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-[2px] bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-[2px] transition-all",
                      selected.density > 85 ? "bg-red-500"
                      : selected.density > 70 ? "bg-orange-400"
                      : selected.density >= 45 ? "bg-emerald-500"
                      : "bg-slate-300"
                    )}
                    style={{ width: `${selected.density}%` }}
                  />
                </div>
              </div>

              <DetailRow label="Top SKU" value={selected.topSku} />
              <DetailRow label="Last activity" value={selected.lastActivity} />
              <DetailRow
                label="Zone type"
                value={GOLDEN_LEVELS.has(selected.level) ? "Golden zone" : "Standard"}
                valueClass={GOLDEN_LEVELS.has(selected.level) ? "text-amber-600" : ""}
              />
              <DetailRow
                label="Status"
                value={
                  selected.density > 85 ? "Hot — consider split"
                  : selected.density < 30 ? "Under-utilised"
                  : "Healthy"
                }
                valueClass={
                  selected.density > 85 ? "text-red-600"
                  : selected.density < 30 ? "text-slate-500"
                  : "text-emerald-600"
                }
              />
            </div>
          </Card>
        ) : (
          <div className="flex w-56 flex-shrink-0 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border text-center text-muted-foreground">
            <Info className="h-5 w-5 opacity-30" />
            <p className="text-xs">Click any bin<br />to see details</p>
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
      <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground flex-shrink-0">{label}</span>
      <span className={cn("text-[11px] font-medium text-right", valueClass)}>{value}</span>
    </div>
  );
}
