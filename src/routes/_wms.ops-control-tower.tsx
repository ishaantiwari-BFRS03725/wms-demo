import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Download,
  Gauge,
  PackageX,
  PauseCircle,
  RefreshCw,
  Timer,
  Truck,
  Undo2,
} from "lucide-react";

export const Route = createFileRoute("/_wms/ops-control-tower")({
  head: () => ({ meta: [{ title: "Control Tower — Command Center" }] }),
  component: OpsControlTower,
});

// ─── Inbound pipeline: ASN units → Unloading → GRN → Putaway (baseline @ no filters) ─

const INBOUND_TOTAL = 500;
const INBOUND_STAGES = [
  { label: "Unloading", count: 500 },
  { label: "GRN", count: 340 },
  { label: "Putaway", count: 210 },
];
// ─── Outbound pipeline: Orders → Pick → Pack → Manifest → Handover (baseline) ─

const OUTBOUND_TOTAL = 500;
const OUTBOUND_STAGES = [
  { label: "Pick", count: 380 },
  { label: "Pack", count: 300 },
  { label: "Manifest", count: 230 },
  { label: "Handover", count: 170 },
];

// ─── Inventory snapshot (baseline @ no filters) ───────────────────────────────

const INVENTORY_BASE = {
  available: { qty: 2850, money: 4280000 },
  good: { qty: 2540, money: 3920000 },
  bad: { qty: 310, money: 340000 },
  hold: { qty: 460, money: 510000 },
};

const formatInr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const formatInrLakh = (n: number) => `₹${(n / 100000).toLocaleString("en-IN", { maximumFractionDigits: 1 })}L`;

// ─── Delivery metrics — filterable, mirroring the Last-Mile Dashboard's ──────
// City/Warehouse/Seller/Courier/Date-range filter mechanism, using the same
// DS+3PL combined Wk40 Overall baseline so numbers stay consistent across both
// screens.

interface CoreMetrics {
  orders: number;
  openOrders: number;
  rtoPct: number;
  slaPct: number;
  deliveryPct: number;
  deliveredWithinSlaPct: number;
  fasrPct: number;
}

const CORE: Record<"Dark Store" | "3PL", CoreMetrics> = {
  "Dark Store": { orders: 10502, openOrders: 1637, rtoPct: 9.73, slaPct: 51.41, deliveryPct: 74.49, deliveredWithinSlaPct: 46.86, fasrPct: 70.03 },
  "3PL": { orders: 2562, openOrders: 169, rtoPct: 4.49, slaPct: 87.31, deliveryPct: 88.76, deliveredWithinSlaPct: 82.67, fasrPct: 82.83 },
};

// Share of combined open orders that have had zero delivery attempts — ties
// back to the full Last-Mile Dashboard's Open-Order Pipeline (621 of 1,806).
const ZERO_ATTEMPT_SHARE = 621 / 1806;

function combine(): CoreMetrics {
  const ds = CORE["Dark Store"];
  const tpl = CORE["3PL"];
  const total = ds.orders + tpl.orders;
  const w = (dsVal: number, tplVal: number) => (dsVal * ds.orders + tplVal * tpl.orders) / total;
  return {
    orders: total,
    openOrders: ds.openOrders + tpl.openOrders,
    rtoPct: w(ds.rtoPct, tpl.rtoPct),
    slaPct: w(ds.slaPct, tpl.slaPct),
    deliveryPct: w(ds.deliveryPct, tpl.deliveryPct),
    deliveredWithinSlaPct: w(ds.deliveredWithinSlaPct, tpl.deliveredWithinSlaPct),
    fasrPct: w(ds.fasrPct, tpl.fasrPct),
  };
}

interface Factor {
  share: number;
  perf: number;
}

const CITIES = ["Delhi NCR", "Mumbai", "Bengaluru"] as const;
const CITY_FACTORS: Record<string, Factor> = {
  "Delhi NCR": { share: 0.4, perf: 1.4 },
  Mumbai: { share: 0.29, perf: -0.6 },
  Bengaluru: { share: 0.22, perf: -2.0 },
};

// Warehouses are scoped to a city — picking a city filters the Warehouse
// dropdown down to just that city's sites (e.g. Delhi NCR → Okhla WH, not
// any Mumbai/Bengaluru warehouse).
const CITY_WAREHOUSES: Record<(typeof CITIES)[number], string[]> = {
  "Delhi NCR": ["Okhla WH", "Manesar WH", "Bawana WH"],
  Mumbai: ["Thane", "Bhiwandi WH", "Taloja WH"],
  Bengaluru: ["Bangalore - Rajajinagar", "Hosur Road WH"],
};
const ALL_WAREHOUSES = Object.values(CITY_WAREHOUSES).flat();
const WAREHOUSE_FACTORS: Record<string, Factor> = {
  "Okhla WH": { share: 0.52, perf: 1.0 },
  "Manesar WH": { share: 0.31, perf: -0.3 },
  "Bawana WH": { share: 0.17, perf: -1.2 },
  Thane: { share: 0.43, perf: -0.5 },
  "Bhiwandi WH": { share: 0.35, perf: 0.6 },
  "Taloja WH": { share: 0.22, perf: -1.8 },
  "Bangalore - Rajajinagar": { share: 0.57, perf: 0.8 },
  "Hosur Road WH": { share: 0.43, perf: -1.1 },
};

const SELLERS = ["Mama Earth", "Kapiva", "Teabox", "Clapstore", "Palmonas"] as const;
const SELLER_FACTORS: Record<string, Factor> = {
  "Mama Earth": { share: 0.41, perf: 1.1 },
  Kapiva: { share: 0.26, perf: 0.3 },
  Teabox: { share: 0.17, perf: -0.8 },
  Clapstore: { share: 0.1, perf: -2.3 },
  Palmonas: { share: 0.06, perf: 0.3 },
};

const DS_COURIERS = ["Pikndel", "Quicklee", "Elasticrun"] as const;
const TPL_COURIERS = ["Blitz", "India Post", "Elasticrun", "Delhivery", "Bluedart", "Shadowfax", "Xpressbees"] as const;
const COURIER_FACTORS: Record<string, Factor> = {
  Pikndel: { share: 0.456, perf: 0.8 },
  Quicklee: { share: 0.522, perf: -0.4 },
  Blitz: { share: 0.505, perf: 1.0 },
  "India Post": { share: 0.32, perf: -2.5 },
  Delhivery: { share: 0.037, perf: 1.8 },
  Bluedart: { share: 0.028, perf: 2.5 },
  Shadowfax: { share: 0.013, perf: -1.0 },
  Xpressbees: { share: 0.005, perf: -1.5 },
  Elasticrun: { share: 0.036, perf: -3.5 },
};

const DEFAULT_DATE_FROM = "2026-10-01";
const DEFAULT_DATE_TO = "2026-10-08";
const DEFAULT_WINDOW_DAYS =
  (new Date(DEFAULT_DATE_TO).getTime() - new Date(DEFAULT_DATE_FROM).getTime()) / 86400000 + 1;

const clampPct = (v: number) => Math.min(99.9, Math.max(0, v));

// Shared volume/performance nudge derived from the active filter set — applied
// uniformly to every card on the screen (pipelines, inventory, delivery KPIs)
// so the whole page moves together when a filter changes.
function factorSummary(factors: Factor[], dateFrom: string, dateTo: string) {
  const shareProduct = factors.reduce((p, f) => p * f.share, 1);
  const perfSum = factors.reduce((s, f) => s + f.perf, 0);
  const windowDays = Math.max(1, (new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 86400000 + 1);
  const dayFactor = Math.min(1.2, Math.max(0.05, windowDays / DEFAULT_WINDOW_DAYS));
  return { volumeFactor: shareProduct * dayFactor, perfSum };
}

function scaleCount(n: number, volumeFactor: number) {
  return Math.max(0, Math.round(n * volumeFactor));
}

function applyCoreFactors(core: CoreMetrics, volumeFactor: number, perfSum: number): CoreMetrics {
  return {
    orders: Math.max(1, scaleCount(core.orders, volumeFactor)),
    openOrders: scaleCount(core.openOrders, volumeFactor),
    rtoPct: clampPct(core.rtoPct - perfSum),
    slaPct: clampPct(core.slaPct + perfSum),
    deliveryPct: clampPct(core.deliveryPct + perfSum),
    deliveredWithinSlaPct: clampPct(core.deliveredWithinSlaPct + perfSum),
    fasrPct: clampPct(core.fasrPct + perfSum),
  };
}

const pct = (n: number) => `${n.toFixed(1)}%`;

function OpsControlTower() {
  const [city, setCity] = useState("All");
  const [warehouse, setWarehouse] = useState("All");
  const [seller, setSeller] = useState("All");
  const [courier, setCourier] = useState("All");
  const [dateFrom, setDateFrom] = useState(DEFAULT_DATE_FROM);
  const [dateTo, setDateTo] = useState(DEFAULT_DATE_TO);

  const { volumeFactor, perfSum } = useMemo(() => {
    const factors: Factor[] = [];
    if (city !== "All") factors.push(CITY_FACTORS[city]);
    if (warehouse !== "All") factors.push(WAREHOUSE_FACTORS[warehouse]);
    if (seller !== "All") factors.push(SELLER_FACTORS[seller]);
    if (courier !== "All") factors.push(COURIER_FACTORS[courier]);
    return factorSummary(factors, dateFrom, dateTo);
  }, [city, warehouse, seller, courier, dateFrom, dateTo]);

  const core = useMemo(() => applyCoreFactors(combine(), volumeFactor, perfSum), [volumeFactor, perfSum]);

  const availableWarehouses = city === "All" ? ALL_WAREHOUSES : CITY_WAREHOUSES[city as (typeof CITIES)[number]];

  const handleCityChange = (value: string) => {
    setCity(value);
    const nextWarehouses = value === "All" ? ALL_WAREHOUSES : CITY_WAREHOUSES[value as (typeof CITIES)[number]];
    if (warehouse !== "All" && !nextWarehouses.includes(warehouse)) setWarehouse("All");
  };

  const clearFilters = () => {
    setCity("All");
    setWarehouse("All");
    setSeller("All");
    setCourier("All");
    setDateFrom(DEFAULT_DATE_FROM);
    setDateTo(DEFAULT_DATE_TO);
  };

  const inboundTotal = scaleCount(INBOUND_TOTAL, volumeFactor);
  const inboundStages = INBOUND_STAGES.map((s) => ({ ...s, count: scaleCount(s.count, volumeFactor) }));
  const outboundTotal = scaleCount(OUTBOUND_TOTAL, volumeFactor);
  const outboundStages = OUTBOUND_STAGES.map((s) => ({ ...s, count: scaleCount(s.count, volumeFactor) }));

  const available = { qty: scaleCount(INVENTORY_BASE.available.qty, volumeFactor), money: scaleCount(INVENTORY_BASE.available.money, volumeFactor) };
  const good = { qty: scaleCount(INVENTORY_BASE.good.qty, volumeFactor), money: scaleCount(INVENTORY_BASE.good.money, volumeFactor) };
  const bad = { qty: scaleCount(INVENTORY_BASE.bad.qty, volumeFactor), money: scaleCount(INVENTORY_BASE.bad.money, volumeFactor) };
  const hold = { qty: scaleCount(INVENTORY_BASE.hold.qty, volumeFactor), money: scaleCount(INVENTORY_BASE.hold.money, volumeFactor) };
  const stockTotal = Math.max(1, good.qty + bad.qty + hold.qty);
  const goodSharePct = Math.round((good.qty / stockTotal) * 100);

  const outcomeRings = [
    { label: "SLA", value: core.slaPct },
    { label: "Delivered", value: core.deliveryPct },
    { label: "Within SLA", value: core.deliveredWithinSlaPct },
    { label: "FASR", value: core.fasrPct },
  ];

  const riskMetrics = [
    { label: "Open Orders", value: core.openOrders.toLocaleString(), icon: Timer, accent: "#64748b" },
    { label: "Open Orders — 0 Attempts", value: Math.round(core.openOrders * ZERO_ATTEMPT_SHARE).toLocaleString(), icon: AlertTriangle, accent: "#d97706" },
    { label: "RTO %", value: pct(core.rtoPct), icon: Undo2, accent: "#dc2626" },
  ];

  // ─── Needs attention — derived straight from the pipeline/inventory/SLA data above ─
  const putawayRemaining = inboundTotal - (inboundStages[inboundStages.length - 1]?.count ?? 0);
  const putawayRemainingPct = inboundTotal > 0 ? Math.round((putawayRemaining / inboundTotal) * 100) : 0;
  const handoverCount = outboundStages[outboundStages.length - 1]?.count ?? 0;
  const handoverRemaining = outboundTotal - handoverCount;
  const handoverPct = outboundTotal > 0 ? Math.round((handoverCount / outboundTotal) * 100) : 0;
  const slaOutsidePct = clampPct(100 - core.slaPct);
  const notSellableMoney = bad.money + hold.money;

  const attentionCards = [
    {
      icon: PackageX,
      tone: "warn" as const,
      title: `${putawayRemaining.toLocaleString()} units awaiting putaway`,
      sub: `${putawayRemainingPct}% of today's received ASN units are not yet in a bin.`,
    },
    {
      icon: Truck,
      tone: "warn" as const,
      title: `${handoverRemaining.toLocaleString()} orders not handed over`,
      sub: `Only ${handoverPct}% of today's orders have reached the courier.`,
    },
    {
      icon: Timer,
      tone: "neutral" as const,
      title: `SLA at ${pct(core.slaPct)}`,
      sub: `${pct(slaOutsidePct)} of deliveries landed outside SLA in this range.`,
    },
    {
      icon: PackageX,
      tone: "neutral" as const,
      title: `${formatInrLakh(notSellableMoney)} stock not sellable`,
      sub: `${bad.qty.toLocaleString()} bad and ${hold.qty.toLocaleString()} on-hold units across warehouses.`,
    },
  ];

  return (
    <div className="bg-muted/40 p-4">
      <style>{css}</style>
      <div className="ct-screen">
        <div className="ct-topbar">
          <div>
            <div className="ct-live">
              <span className="ct-live-dot" aria-hidden="true" />
              Live · Network Operations
            </div>
            <div className="ct-topbar-title">Control Tower</div>
          </div>
          <div className="ct-topbar-actions">
            <span className="ct-asof">Updated 08 Oct 2026 · 13:54</span>
            <button className="ct-btn-outline">
              <RefreshCw className="ct-ico-sm" aria-hidden="true" />
              Refresh
            </button>
            <button className="ct-btn-dark">
              <Download className="ct-ico-sm" aria-hidden="true" />
              Export
            </button>
          </div>
        </div>

        <div className="ct-filters">
          <LabeledField label="City">
            <select value={city} onChange={(e) => handleCityChange(e.target.value)}>
              <option value="All">All cities</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </LabeledField>
          <LabeledField label="Warehouse">
            <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
              <option value="All">{city === "All" ? "All warehouses" : `All ${city} warehouses`}</option>
              {availableWarehouses.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </LabeledField>
          <LabeledField label="Seller">
            <select value={seller} onChange={(e) => setSeller(e.target.value)}>
              <option value="All">All sellers</option>
              {SELLERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </LabeledField>
          <LabeledField label="Courier">
            <select value={courier} onChange={(e) => setCourier(e.target.value)}>
              <option value="All">All couriers</option>
              <optgroup label="Dark Store">
                {DS_COURIERS.map((c) => (
                  <option key={`ds-${c}`} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
              <optgroup label="3PL">
                {TPL_COURIERS.map((c) => (
                  <option key={`tpl-${c}`} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
            </select>
          </LabeledField>
          <LabeledField label="From">
            <input type="date" value={dateFrom} max={dateTo} onChange={(e) => setDateFrom(e.target.value)} aria-label="Date range start" />
          </LabeledField>
          <LabeledField label="To">
            <input type="date" value={dateTo} min={dateFrom} onChange={(e) => setDateTo(e.target.value)} aria-label="Date range end" />
          </LabeledField>
          <button className="ct-clear" onClick={clearFilters}>
            Clear
          </button>
        </div>

        <div className="ct-body">
          <div>
            <div className="ct-section-label">Needs Attention</div>
            <div className="ct-attention-grid">
              {attentionCards.map((c) => (
                <div className={`ct-attention-card ${c.tone === "warn" ? "ct-attention-warn" : ""}`} key={c.title}>
                  <span className={`ct-attention-ico ${c.tone === "warn" ? "ct-attention-ico-warn" : ""}`}>
                    <c.icon className="ct-ico-sm" aria-hidden="true" />
                  </span>
                  <div className="ct-attention-title">{c.title}</div>
                  <div className="ct-attention-sub">{c.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="ct-pipeline-row">
            <PipelineCard title="Inbound pipeline" sub="ASN units received today, by stage" pill={`Received ${inboundTotal.toLocaleString()} units`} total={inboundTotal} stages={inboundStages} />
            <PipelineCard title="Outbound pipeline" sub="Orders in the warehouse today, by stage" pill={`Orders ${outboundTotal.toLocaleString()}`} total={outboundTotal} stages={outboundStages} />
          </div>

          <SectionCard title="Inventory snapshot" sub="Stock health and hold exposure across filtered warehouses">
            <div className="ct-inv-head">
              <div className="ct-inv-headline">
                <div className="ct-inv-label">Available</div>
                <div className="ct-inv-value">
                  {available.qty.toLocaleString()} <span className="ct-inv-unit">units</span>
                </div>
              </div>
              <div className="ct-inv-money">{formatInr(available.money)}</div>
            </div>
            <div className="ct-inv-bar">
              <div className="ct-inv-bar-good" style={{ width: `${goodSharePct}%` }} />
              <div className="ct-inv-bar-bad" style={{ width: `${100 - goodSharePct}%` }} />
            </div>
            <div className="ct-kpi-grid ct-kpi-grid-3">
              <div className="ct-inv-card">
                <div className="ct-inv-card-head">
                  <span className="ct-dot" style={{ background: "#16a34a" }} />
                  Good
                </div>
                <div className="ct-kpi-value">{good.qty.toLocaleString()}</div>
                <div className="ct-kpi-money">{formatInr(good.money)}</div>
              </div>
              <div className="ct-inv-card">
                <div className="ct-inv-card-head">
                  <span className="ct-dot" style={{ background: "#d97706" }} />
                  Bad
                </div>
                <div className="ct-kpi-value">{bad.qty.toLocaleString()}</div>
                <div className="ct-kpi-money">{formatInr(bad.money)}</div>
              </div>
              <div className="ct-inv-card">
                <div className="ct-inv-card-head">
                  <PauseCircle className="ct-ico-xs" aria-hidden="true" />
                  On hold
                </div>
                <div className="ct-kpi-value">{hold.qty.toLocaleString()}</div>
                <div className="ct-kpi-money">{formatInr(hold.money)}</div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Delivery performance" sub="Network-wide last mile — dark store and 3PL combined">
            <div className="ct-ring-grid">
              {outcomeRings.map((r) => (
                <DonutRing key={r.label} label={r.label} value={r.value} />
              ))}
            </div>
            <div className="ct-ring-legend">
              <span>
                <span className="ct-dot" style={{ background: "#d97706" }} /> Below 60%
              </span>
              <span>
                <span className="ct-dot" style={{ background: "#2563eb" }} /> 60% and above
              </span>
              <span className="ct-ring-legend-target">Targets: [SET TARGETS]</span>
            </div>

            <div className="ct-kpi-grid ct-kpi-grid-3 ct-kpi-grid-spaced">
              {riskMetrics.map((m) => (
                <div className="ct-kpi-card" key={m.label}>
                  <span className="ct-kpi-ico" style={{ background: `${m.accent}1a`, color: m.accent }}>
                    <m.icon className="ct-ico-sm" aria-hidden="true" />
                  </span>
                  <div className="ct-kpi-value">{m.value}</div>
                  <div className="ct-kpi-label">{m.label}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// ─── Building blocks ──────────────────────────────────────────────────────────

function LabeledField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="ct-field">
      <span className="ct-field-label">{label}</span>
      {children}
    </label>
  );
}

function SectionCard({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="ct-card">
      <div className="ct-card-head">
        <div className="ct-card-title">{title}</div>
        <div className="ct-card-sub">{sub}</div>
      </div>
      {children}
    </div>
  );
}

function PipelineCard({
  title,
  sub,
  pill,
  total,
  stages,
}: {
  title: string;
  sub: string;
  pill: string;
  total: number;
  stages: { label: string; count: number }[];
}) {
  return (
    <div className="ct-card ct-pipeline-card">
      <div className="ct-card-head ct-pipeline-head">
        <div>
          <div className="ct-card-title">{title}</div>
          <div className="ct-card-sub">{sub}</div>
        </div>
        <span className="ct-pipeline-total">{pill}</span>
      </div>

      <div className="ct-pipeline-stages" style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)` }}>
        {stages.map((s) => {
          const stagePct = total > 0 ? Math.round((s.count / total) * 100) : 0;
          return (
            <div className="ct-pipeline-stage" key={s.label}>
              <div className="ct-pipeline-stage-head">
                <span className="ct-pipeline-stage-label">{s.label}</span>
                <span className="ct-pipeline-stage-pct">{stagePct}%</span>
              </div>
              <div className="ct-pipeline-stage-value">
                {s.count.toLocaleString()}
                <span className="ct-pipeline-stage-total">/{total.toLocaleString()}</span>
              </div>
              <div className="ct-pipeline-stage-track">
                <div className="ct-pipeline-stage-fill" style={{ width: `${stagePct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DonutRing({ label, value }: { label: string; value: number }) {
  const size = 92;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (clampPct(value) / 100) * circumference;
  const color = value >= 60 ? "#2563eb" : "#d97706";

  return (
    <div className="ct-ring-card">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ct-ring-svg">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2dfd5" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ct-ring-value">{pct(value)}</div>
      <div className="ct-ring-label">{label}</div>
    </div>
  );
}

// Scoped styles — prefixed with `.ct-` so generic selectors never leak.
const css = `
.ct-screen{--c-bg:#ffffff;--c-bg2:#f5f3ee;--c-border:#e2dfd5;--c-border2:#d8d4c8;--c-t1:#1f1d17;--c-t2:#6b6862;--c-t3:#8a8a85;--c-warn-t:#b8751f;--c-warn-b:#e8c389;--c-warn-bg:#fbf0dc;--c-accent:#2563eb;
  background:var(--c-bg);border:0.5px solid var(--c-border);border-radius:12px;overflow:hidden;font-family:inherit;width:100%;max-width:100%;box-sizing:border-box}
.ct-screen .ct-ico-sm{width:14px;height:14px;flex:none}
.ct-screen .ct-ico-xs{width:12px;height:12px;flex:none}

.ct-topbar{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:16px 18px;border-bottom:0.5px solid var(--c-border)}
.ct-live{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:var(--c-t2);text-transform:uppercase;letter-spacing:0.06em}
.ct-live-dot{width:7px;height:7px;border-radius:999px;background:#16a34a;flex:none}
.ct-topbar-title{font-size:24px;font-weight:700;color:var(--c-t1);margin-top:4px;letter-spacing:-0.01em}
.ct-topbar-actions{display:flex;align-items:center;gap:8px}
.ct-asof{font-size:11.5px;font-weight:600;color:var(--c-t2);background:var(--c-bg2);border:0.5px solid var(--c-border);border-radius:8px;padding:9px 13px;white-space:nowrap;font-variant-numeric:tabular-nums}
.ct-screen .ct-btn-outline{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;padding:9px 14px;border-radius:8px;border:0.5px solid var(--c-border2);background:var(--c-bg);color:var(--c-t1);cursor:pointer;line-height:1}
.ct-screen .ct-btn-dark{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;padding:9px 14px;border-radius:8px;border:none;background:#14130f;color:#fff;cursor:pointer;line-height:1}

.ct-filters{display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;padding:14px 18px;border-bottom:0.5px solid var(--c-border);background:var(--c-bg2)}
.ct-field{display:flex;flex-direction:column;gap:5px}
.ct-field-label{font-size:11px;font-weight:600;color:var(--c-t3)}
.ct-screen .ct-field select,.ct-screen .ct-field input[type="date"]{appearance:none;font-size:12.5px;padding:8px 11px;border:0.5px solid var(--c-border2);border-radius:8px;background:var(--c-bg);color:var(--c-t1);cursor:pointer;line-height:1;min-width:140px}
.ct-screen .ct-field input[type="date"]{cursor:text;min-width:120px}
.ct-screen .ct-clear{align-self:flex-end;font-size:12px;padding:8px 13px;border:0.5px solid var(--c-border2);border-radius:8px;background:var(--c-bg);color:var(--c-t2);cursor:pointer;line-height:1}

.ct-body{padding:18px;display:flex;flex-direction:column;gap:16px}

.ct-section-label{font-size:11px;font-weight:700;color:var(--c-t3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:9px}
.ct-attention-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.ct-attention-card{border:0.5px solid var(--c-border);border-radius:10px;padding:13px 14px;background:var(--c-bg)}
.ct-attention-warn{border-color:var(--c-warn-b);background:var(--c-warn-bg)}
.ct-attention-ico{width:26px;height:26px;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:9px;background:var(--c-bg2);color:var(--c-t2)}
.ct-attention-ico-warn{background:#f3d9a4;color:var(--c-warn-t)}
.ct-attention-title{font-size:13px;font-weight:700;color:var(--c-t1);line-height:1.3}
.ct-attention-sub{font-size:11.5px;color:var(--c-t3);margin-top:4px;line-height:1.4}

.ct-card{border:0.5px solid var(--c-border);border-radius:10px;padding:16px;background:var(--c-bg)}
.ct-card-head{margin-bottom:12px}
.ct-card-title{font-size:14px;font-weight:700;color:var(--c-t1)}
.ct-card-sub{font-size:11.5px;color:var(--c-t3);margin-top:2px}

.ct-pipeline-row{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.ct-pipeline-head{display:flex;align-items:flex-start;justify-content:space-between}
.ct-pipeline-total{font-size:11px;font-weight:700;color:var(--c-t2);background:var(--c-bg2);border:0.5px solid var(--c-border);border-radius:999px;padding:5px 11px;white-space:nowrap}

.ct-pipeline-stages{display:grid;gap:10px}
.ct-pipeline-stage{border:0.5px solid var(--c-border);border-radius:9px;padding:12px;background:var(--c-bg2)}
.ct-pipeline-stage-head{display:flex;align-items:center;justify-content:space-between}
.ct-pipeline-stage-label{font-size:10.5px;font-weight:700;color:var(--c-t2);text-transform:uppercase;letter-spacing:0.04em}
.ct-pipeline-stage-pct{font-size:11px;font-weight:600;color:var(--c-t3)}
.ct-pipeline-stage-value{font-size:22px;font-weight:700;color:var(--c-t1);font-variant-numeric:tabular-nums;margin-top:6px}
.ct-pipeline-stage-total{font-size:13px;font-weight:600;color:var(--c-t3)}
.ct-pipeline-stage-track{height:6px;border-radius:999px;background:var(--c-border);overflow:hidden;margin-top:9px}
.ct-pipeline-stage-fill{height:100%;border-radius:999px;background:var(--c-accent)}

.ct-kpi-grid{display:grid;gap:12px}
.ct-kpi-grid-3{grid-template-columns:repeat(3,1fr)}
.ct-kpi-grid-spaced{margin-top:16px;padding-top:16px;border-top:0.5px solid var(--c-border)}
.ct-kpi-card{border:0.5px solid var(--c-border);border-radius:10px;padding:13px 14px;background:var(--c-bg)}
.ct-kpi-ico{width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:9px}
.ct-kpi-value{font-size:19px;font-weight:700;color:var(--c-t1);font-variant-numeric:tabular-nums;line-height:1.1}
.ct-kpi-label{font-size:11px;color:var(--c-t3);margin-top:4px}
.ct-kpi-money{font-size:11px;font-weight:600;color:var(--c-t2);margin-top:8px;padding-top:8px;border-top:0.5px solid var(--c-border);font-variant-numeric:tabular-nums}

.ct-dot{width:8px;height:8px;border-radius:999px;display:inline-block;flex:none}

.ct-inv-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px}
.ct-inv-label{font-size:11px;font-weight:700;color:var(--c-t3);text-transform:uppercase;letter-spacing:0.06em}
.ct-inv-value{font-size:32px;font-weight:700;color:var(--c-t1);font-variant-numeric:tabular-nums;margin-top:4px}
.ct-inv-unit{font-size:14px;font-weight:600;color:var(--c-t3)}
.ct-inv-money{font-size:16px;font-weight:700;color:var(--c-t2);font-variant-numeric:tabular-nums;padding-bottom:6px}
.ct-inv-bar{display:flex;height:9px;border-radius:999px;overflow:hidden;background:var(--c-bg2);margin:14px 0 16px}
.ct-inv-bar-good{background:#16a34a;height:100%}
.ct-inv-bar-bad{background:#d97706;height:100%}
.ct-inv-card{border:0.5px solid var(--c-border);border-radius:10px;padding:13px 14px;background:var(--c-bg)}
.ct-inv-card-head{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;color:var(--c-t2);margin-bottom:9px}

.ct-ring-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.ct-ring-card{display:flex;flex-direction:column;align-items:center;gap:8px;padding:10px 0}
.ct-ring-svg{display:block}
.ct-ring-value{font-size:16px;font-weight:700;color:var(--c-t1);font-variant-numeric:tabular-nums}
.ct-ring-label{font-size:11.5px;color:var(--c-t3)}
.ct-ring-legend{display:flex;align-items:center;justify-content:center;gap:18px;margin-top:10px;font-size:11.5px;color:var(--c-t3)}
.ct-ring-legend span{display:inline-flex;align-items:center;gap:6px}
.ct-ring-legend-target{color:var(--c-t3)}
`;
