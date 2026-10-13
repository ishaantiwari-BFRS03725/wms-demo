import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Cloud,
  Filter,
  Gauge,
  ListOrdered,
  PackageCheck,
  PackageX,
  Repeat,
  Route as RouteIcon,
  ShieldAlert,
  Target,
  Timer,
  Truck,
  Undo2,
} from "lucide-react";

export const Route = createFileRoute("/_wms/last-mile-dashboard")({
  head: () => ({ meta: [{ title: "Last-Mile Dashboard — Command Center" }] }),
  component: LastMileDashboard,
});

// ─── Section A: core order-outcome metrics (DS + 3PL combined), cut by Payment ─

type Model = "Dark Store" | "3PL";
type Payment = "Overall" | "Prepaid" | "COD";

interface CoreMetrics {
  orders: number;
  openOrders: number;
  rtoPct: number;
  slaPct: number;
  courierSlaPct?: number; // 3PL only
  deliveryPct: number;
  deliveredWithinSlaPct: number;
  fasrPct: number;
  rasrPct?: number; // Dark Store only
  assignedWithinCutoffPct?: number; // Dark Store only
  pickedWithinEddPct?: number; // Dark Store only
  misroutePct?: number; // Dark Store only
  missedOrders?: number; // 3PL only — DS-eligible SKU lines that leaked to 3PL (channel-leakage count, not a 3PL failure metric)
}

// Grounded in the real "Dark Store Control Tower" sheet's Last-Full-Week (Wk 40)
// column — the most mature, internally-consistent snapshot available (Today/Thu
// values are still maturing; see CHANGELOG). Prepaid + COD sum exactly to Overall
// for orders/openOrders in both channels, confirmed against the live workbook.
const CORE: Record<Model, Record<Payment, CoreMetrics>> = {
  "Dark Store": {
    Overall: { orders: 10502, openOrders: 1637, rtoPct: 9.73, slaPct: 51.41, deliveryPct: 74.49, deliveredWithinSlaPct: 46.86, fasrPct: 70.03, rasrPct: 13.42, assignedWithinCutoffPct: 99.44, pickedWithinEddPct: 96.51, misroutePct: 0 },
    Prepaid: { orders: 8476, openOrders: 1409, rtoPct: 9.17, slaPct: 47.88, deliveryPct: 74.08, deliveredWithinSlaPct: 44.80, fasrPct: 70.85, rasrPct: 11.09, assignedWithinCutoffPct: 99.6, pickedWithinEddPct: 97.0, misroutePct: 0 },
    COD: { orders: 2026, openOrders: 228, rtoPct: 12.09, slaPct: 66.19, deliveryPct: 76.21, deliveredWithinSlaPct: 55.48, fasrPct: 66.63, rasrPct: 20.23, assignedWithinCutoffPct: 98.7, pickedWithinEddPct: 93.8, misroutePct: 0 },
  },
  "3PL": {
    Overall: { orders: 2562, openOrders: 169, rtoPct: 4.49, slaPct: 87.31, courierSlaPct: 88.80, deliveryPct: 88.76, deliveredWithinSlaPct: 82.67, fasrPct: 82.83, missedOrders: 424 },
    Prepaid: { orders: 1534, openOrders: 76, rtoPct: 0.33, slaPct: 89.50, courierSlaPct: 90.68, deliveryPct: 94.72, deliveredWithinSlaPct: 88.66, fasrPct: 90.48, missedOrders: 107 },
    COD: { orders: 1028, openOrders: 93, rtoPct: 10.70, slaPct: 84.05, courierSlaPct: 85.99, deliveryPct: 79.86, deliveredWithinSlaPct: 73.74, fasrPct: 71.40, missedOrders: 317 },
  },
};

function combine(payment: Payment): CoreMetrics {
  const ds = CORE["Dark Store"][payment];
  const tpl = CORE["3PL"][payment];
  const total = ds.orders + tpl.orders;
  // Weighted average by order count is mathematically identical to the real
  // sheet's "sum raw counts from both channels, divide once" SUMIFS pattern —
  // verified against the live workbook's combined RTO%/Delivery% rows.
  const w = (dsVal: number, tplVal: number) => (dsVal * ds.orders + tplVal * tpl.orders) / total;
  return {
    orders: total,
    openOrders: ds.openOrders + tpl.openOrders,
    rtoPct: w(ds.rtoPct, tpl.rtoPct),
    slaPct: w(ds.slaPct, tpl.slaPct),
    courierSlaPct: tpl.courierSlaPct,
    deliveryPct: w(ds.deliveryPct, tpl.deliveryPct),
    deliveredWithinSlaPct: w(ds.deliveredWithinSlaPct, tpl.deliveredWithinSlaPct),
    fasrPct: w(ds.fasrPct, tpl.fasrPct),
    rasrPct: ds.rasrPct,
    assignedWithinCutoffPct: ds.assignedWithinCutoffPct,
    pickedWithinEddPct: ds.pickedWithinEddPct,
    misroutePct: ds.misroutePct,
    missedOrders: tpl.missedOrders,
  };
}

// ─── Additional cuts: City / Warehouse / Seller / Courier Partner / Date range ─
// Each carries a share-of-volume + performance-delta factor so the core KPI
// cards visibly move when a filter is applied, same mechanism as Payment.

interface Factor {
  share: number; // fraction of total order volume this slice represents
  perf: number; // percentage-point nudge applied to the good-outcome metrics
}

const CITIES = ["Delhi NCR", "Mumbai", "Bengaluru"] as const;
const CITY_FACTORS: Record<string, Factor> = {
  "Delhi NCR": { share: 0.4, perf: 1.4 },
  Mumbai: { share: 0.29, perf: -0.6 },
  Bengaluru: { share: 0.22, perf: -2.0 },
};

// Real Dark Store facilities, grounded in the "Courier Rules" sheet's rule
// names ("BLR(Rajajinagar)_Darkstore_Rule", "Thane_Elasticrun_Darkstore_Rule").
const WAREHOUSES = ["Bangalore - Rajajinagar", "Thane"] as const;
const WAREHOUSE_FACTORS: Record<string, Factor> = {
  "Bangalore - Rajajinagar": { share: 0.57, perf: 0.8 },
  Thane: { share: 0.43, perf: -0.5 },
};

// Real brand/seller names from the "Brand_company details mapping" sheet.
// Shares are illustrative (chosen to keep Mama Earth just above the 40%
// concentration-risk threshold used in Section F) — the real sheet's own
// seller mix is far less concentrated, but this keeps the demo narrative.
const SELLERS = ["Mama Earth", "Kapiva", "Teabox", "Clapstore", "Palmonas"] as const;
const SELLER_FACTORS: Record<string, Factor> = {
  "Mama Earth": { share: 0.41, perf: 1.1 },
  Kapiva: { share: 0.26, perf: 0.3 },
  Teabox: { share: 0.17, perf: -0.8 },
  Clapstore: { share: 0.1, perf: -2.3 },
  Palmonas: { share: 0.06, perf: 0.3 },
};

// Dark Store and 3PL run different courier rosters — confirmed via the real
// "❖ | DS_Summary" and "⍢ | 3PL _Summary" sheets. DS shares are exact real
// Wk40 shares (Pikndel 4,786 / Quicklee 5,480 / Elasticrun 236 of 10,502
// orders). 3PL shares are exact real Wk40 shares too (Blitz 1,293 / India
// Post 821 / Elasticrun 230 / Delhivery 95 / Bluedart 71 / Shadowfax 33 /
// Xpressbees 14 of 2,562 orders). Elasticrun serves both channels in real
// life; COURIER_FACTORS keys it once with a blended DS+3PL share since the
// Factor mechanism isn't model-aware.
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

function applyFactors(core: CoreMetrics, factors: Factor[], dateFrom: string, dateTo: string): CoreMetrics {
  const shareProduct = factors.reduce((p, f) => p * f.share, 1);
  const perfSum = factors.reduce((s, f) => s + f.perf, 0);
  const windowDays = Math.max(1, (new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 86400000 + 1);
  const dayFactor = Math.min(1.2, Math.max(0.05, windowDays / DEFAULT_WINDOW_DAYS));
  const volumeFactor = shareProduct * dayFactor;
  return {
    ...core,
    orders: Math.max(1, Math.round(core.orders * volumeFactor)),
    openOrders: Math.max(0, Math.round(core.openOrders * volumeFactor)),
    rtoPct: clampPct(core.rtoPct - perfSum),
    slaPct: clampPct(core.slaPct + perfSum),
    courierSlaPct: core.courierSlaPct !== undefined ? clampPct(core.courierSlaPct + perfSum) : undefined,
    deliveryPct: clampPct(core.deliveryPct + perfSum),
    deliveredWithinSlaPct: clampPct(core.deliveredWithinSlaPct + perfSum),
    fasrPct: clampPct(core.fasrPct + perfSum),
    rasrPct: core.rasrPct !== undefined ? clampPct(core.rasrPct + perfSum) : undefined,
    // Already near-ceiling in the real sheet (~96–99%), so damp the nudge.
    assignedWithinCutoffPct: core.assignedWithinCutoffPct !== undefined ? clampPct(core.assignedWithinCutoffPct + perfSum * 0.3) : undefined,
    pickedWithinEddPct: core.pickedWithinEddPct !== undefined ? clampPct(core.pickedWithinEddPct + perfSum * 0.3) : undefined,
    // Bad-outcome metric starting near zero — small damped nudge in the opposite direction.
    misroutePct: core.misroutePct !== undefined ? clampPct(core.misroutePct - perfSum * 0.05) : undefined,
    missedOrders: core.missedOrders !== undefined ? Math.max(0, Math.round(core.missedOrders * volumeFactor)) : undefined,
  };
}

// ─── Section B: open-order pipeline cuts ─────────────────────────────────────

const OPEN_PIPELINE = [
  { label: "Open — 0 Attempt", value: 621, tone: "neutral" as const },
  { label: "Open — >0 Attempt", value: 489, tone: "warn" as const },
  { label: "RTO", value: 742, tone: "risk" as const },
  { label: "Non-Compliant RTO", value: 96, tone: "risk" as const },
  { label: "Cancelled", value: 184, tone: "neutral" as const },
  { label: "Lost", value: 12, tone: "risk" as const },
];

// ─── Section C: open-order stage backlog ─────────────────────────────────────
// This is a point-in-time backlog snapshot, not a sequential funnel — stages
// don't monotonically decrease. Grounded exactly in the real "✔ | DS+3PL_Open
// Orders" sheet (08-Oct-2026 snapshot, Overall = 2,817 open orders), with the
// sheet's 19 raw sub-statuses clubbed into 6 meaningful stages (raw buckets
// folded into each, so totals still tie out exactly):
//   - In Transit        = In Transit + Reached Destination Hub + Handover to
//                          Courier + Shipped (319+269+134+23)
//   - Undelivered        = Undelivered (first-attempt-failed, unclubbed)
//   - Processing          = Ready to Pack + Picklist Generated + Packed +
//                          Label Generated + FC Allocated + FC Manifest
//                          Generated + Pickup Generated + Out for Pickup
//                          (37+9+4+8+151+208+252+27)
//   - Pickup Done        = Pickup Done (unclubbed)
//   - Out for Delivery   = Out for Delivery (unclubbed)
//   - Exceptions         = Pickup Exception + Misrouted + Destroyed +
//                          Reached Back at Seller City (22+9+1+1)
const OPEN_STAGE_BACKLOG = [
  { stage: "In Transit", count: 745, tone: "neutral" as const },
  { stage: "Undelivered", count: 742, tone: "risk" as const },
  { stage: "Processing", count: 696, tone: "neutral" as const },
  { stage: "Pickup Done", count: 368, tone: "neutral" as const },
  { stage: "Out for Delivery", count: 233, tone: "neutral" as const },
  { stage: "Exceptions", count: 33, tone: "warn" as const },
];

// ─── Section D: attempt-level delivery performance (Dark Store) ─────────────

// Rescaled to the corrected Section A baseline (DS Overall: orders=10,502,
// fasr=70.03%, delivery=74.49%, rto=9.73%) — the real sheet doesn't break
// this out by attempt number, so the per-attempt split stays illustrative,
// but totals now tie back exactly to the real FASR/Delivery%/RTO% figures.
const ATTEMPTS = [
  { attempt: "First Attempt (EDD)", delivered: 7355, undelivered: 3147, rto: 0, rtoInitiated: 0 },
  { attempt: "Second Attempt (T+2)", delivered: 392, undelivered: 1637, rto: 0, rtoInitiated: 1118 },
  { attempt: "Third Attempt (T+4)", delivered: 76, undelivered: 0, rto: 1022, rtoInitiated: 0 },
];

// ─── Section F support data: per-seller volume & SOW ─────────────────────────

// totalOrders split across the combined Wk40 network volume (13,064) using
// each seller's designed share; sowPct kept in a realistic 60–90% band.
// Backs sellerCityBreakdown() below for Section F's per-seller city view.
const MISSED_OPPORTUNITY = [
  { seller: "Mama Earth", totalOrders: 5356, sowPct: 88.5 },
  { seller: "Kapiva", totalOrders: 3397, sowPct: 82.0 },
  { seller: "Teabox", totalOrders: 2221, sowPct: 76.4 },
  { seller: "Clapstore", totalOrders: 1306, sowPct: 71.2 },
  { seller: "Palmonas", totalOrders: 784, sowPct: 64.8 },
];

const TOP_SELLER_SHARE = [
  { seller: "Mama Earth", pct: 41.0 },
  { seller: "Kapiva", pct: 26.0 },
  { seller: "Teabox", pct: 17.0 },
  { seller: "Clapstore", pct: 10.0 },
  { seller: "Palmonas", pct: 6.0 },
];

// Real sheet's per-seller "Seller Dependence" tab breaks one seller down by
// city (Orders / Delivery % / O2D minutes) rather than showing cross-seller
// share — reused here via the existing CITY_FACTORS mechanism instead of a
// hand-authored dataset, per this file's DRY filter-factor convention.
function sellerCityBreakdown(sellerName: string) {
  const seller = MISSED_OPPORTUNITY.find((m) => m.seller === sellerName);
  if (!seller) return [];
  return CITIES.map((c) => {
    const f = CITY_FACTORS[c];
    const orders = Math.max(1, Math.round(seller.totalOrders * f.share));
    const deliveryPct = clampPct(seller.sowPct + f.perf - 5);
    const o2dMinutes = Math.max(15, Math.round(45 - f.perf * 4));
    return { city: c, orders, deliveryPct, o2dMinutes };
  });
}

// ─── Section G: lane-level cut (3PL) ─────────────────────────────────────────

// Real lanes are lowercase city-pairs scoped to one seller in the sheet's
// "⍢ | 3PL_Lane" tab (delhi→agra, delhi→chandigarh, delhi→chennai,
// delhi→faridabad, ...) with only a daily Orders count — no performance %s
// are broken out at lane level in the real sheet, so those columns stay an
// illustrative but now-realistic extrapolation, rescaled to the corrected
// 3PL Overall baseline (delivery~88.8%, sla~87.3%, rto~4.5%, fasr~82.8%).
const LANES = [
  { lane: "Delhi NCR → Chandigarh", orders: 512, deliveryPct: 89.6, slaPct: 86.2, rtoPct: 4.0, fasrPct: 83.5 },
  { lane: "Delhi NCR → Agra", orders: 398, deliveryPct: 85.1, slaPct: 81.4, rtoPct: 6.8, fasrPct: 77.2 },
  { lane: "Delhi NCR → Faridabad", orders: 287, deliveryPct: 93.4, slaPct: 90.8, rtoPct: 2.1, fasrPct: 88.9 },
  { lane: "Mumbai → Pune", orders: 340, deliveryPct: 90.8, slaPct: 87.9, rtoPct: 3.4, fasrPct: 85.0 },
  { lane: "Bengaluru → Mysuru", orders: 265, deliveryPct: 84.3, slaPct: 79.6, rtoPct: 7.5, fasrPct: 75.8 },
];

// ─── Section H: returns / reverse logistics ──────────────────────────────────

const RETURNS_FUNNEL = [
  { stage: "RTO Initiated", count: 742 },
  { stage: "RTO Delivered", count: 701 },
  { stage: "Gatepass Created", count: 689 },
  { stage: "Warehouse Acknowledged", count: 672 },
  { stage: "QC Done", count: 648 },
  { stage: "GRN Generated", count: 631 },
  { stage: "Partial GRN", count: 44 },
  { stage: "Putaway", count: 609 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pct = (n: number) => `${n.toFixed(1)}%`;

function LastMileDashboard() {
  const [payment, setPayment] = useState<Payment>("Overall");
  const [city, setCity] = useState("All");
  const [warehouse, setWarehouse] = useState("All");
  const [seller, setSeller] = useState("All");
  const [courier, setCourier] = useState("All");
  const [dateFrom, setDateFrom] = useState(DEFAULT_DATE_FROM);
  const [dateTo, setDateTo] = useState(DEFAULT_DATE_TO);

  const core = useMemo<CoreMetrics>(() => {
    const base = combine(payment);
    const factors: Factor[] = [];
    if (city !== "All") factors.push(CITY_FACTORS[city]);
    if (warehouse !== "All") factors.push(WAREHOUSE_FACTORS[warehouse]);
    if (seller !== "All") factors.push(SELLER_FACTORS[seller]);
    if (courier !== "All") factors.push(COURIER_FACTORS[courier]);
    return applyFactors(base, factors, dateFrom, dateTo);
  }, [payment, city, warehouse, seller, courier, dateFrom, dateTo]);

  const filtersActive =
    payment !== "Overall" ||
    city !== "All" ||
    warehouse !== "All" ||
    seller !== "All" ||
    courier !== "All" ||
    dateFrom !== DEFAULT_DATE_FROM ||
    dateTo !== DEFAULT_DATE_TO;

  const clearFilters = () => {
    setPayment("Overall");
    setCity("All");
    setWarehouse("All");
    setSeller("All");
    setCourier("All");
    setDateFrom(DEFAULT_DATE_FROM);
    setDateTo(DEFAULT_DATE_TO);
  };

  const visibleLanes = city === "All" ? LANES : LANES.filter((l) => l.lane.startsWith(`${city} →`));

  const coreCards: { label: string; value: string; icon: typeof Truck; accent: string }[] = [
    { label: "Orders", value: core.orders.toLocaleString(), icon: Truck, accent: "#2563eb" },
    { label: "Open Orders", value: core.openOrders.toLocaleString(), icon: Timer, accent: "#d97706" },
    { label: "Delivery %", value: pct(core.deliveryPct), icon: CheckCircle2, accent: "#16a34a" },
    { label: "SLA %", value: pct(core.slaPct), icon: Gauge, accent: "#0891b2" },
    { label: "Courier SLA %", value: core.courierSlaPct !== undefined ? pct(core.courierSlaPct) : "—", icon: Gauge, accent: "#0891b2" },
    { label: "Delivered within SLA", value: pct(core.deliveredWithinSlaPct), icon: CheckCircle2, accent: "#16a34a" },
    { label: "Assigned within Cutoff", value: core.assignedWithinCutoffPct !== undefined ? pct(core.assignedWithinCutoffPct) : "—", icon: ClipboardCheck, accent: "#0ea5e9" },
    { label: "Picked within EDD", value: core.pickedWithinEddPct !== undefined ? pct(core.pickedWithinEddPct) : "—", icon: PackageCheck, accent: "#0ea5e9" },
    { label: "RTO %", value: pct(core.rtoPct), icon: Undo2, accent: "#dc2626" },
    { label: "Misroute %", value: core.misroutePct !== undefined ? pct(core.misroutePct) : "—", icon: AlertTriangle, accent: "#dc2626" },
    { label: "Missed Orders", value: core.missedOrders !== undefined ? core.missedOrders.toLocaleString() : "—", icon: PackageX, accent: "#d97706" },
    { label: "FASR (First Attempt Success Rate)", value: pct(core.fasrPct), icon: Target, accent: "#7c3aed" },
    { label: "RASR (Repeat Attempt Success Rate)", value: core.rasrPct !== undefined ? pct(core.rasrPct) : "—", icon: Repeat, accent: "#7c3aed" },
  ];

  const maxOpenPipeline = Math.max(...OPEN_PIPELINE.map((o) => o.value));
  const maxStageBacklog = Math.max(...OPEN_STAGE_BACKLOG.map((s) => s.count));
  const maxReturns = RETURNS_FUNNEL[0].count;

  return (
    <div className="bg-muted/40 p-4">
      <style>{css}</style>
      <div className="lmd-screen">
        {/* Top bar */}
        <div className="lmd-topbar">
          <div>
            <div className="lmd-topbar-title">
              <RouteIcon className="lmd-ico" aria-hidden="true" />
              Last-Mile Dashboard
            </div>
            <div className="lmd-topbar-sub">
              Order outcomes, SLA performance &amp; reverse logistics — Dark Store + 3PL
            </div>
          </div>
          <span className="lmd-asof">As of 08-Oct-2026, 1:54 PM</span>
        </div>

        {/* Filters */}
        <div className="lmd-filters">
          <span className="lmd-filters-label">
            <Filter className="lmd-ico-sm" aria-hidden="true" />
            Filters
          </span>
          <div className="lmd-filter">
            <select value={payment} onChange={(e) => setPayment(e.target.value as Payment)} className={payment !== "Overall" ? "lmd-on" : ""}>
              <option value="Overall">Payment: Overall</option>
              <option value="Prepaid">Payment: Prepaid</option>
              <option value="COD">Payment: COD</option>
            </select>
          </div>
          <div className="lmd-filter">
            <select value={city} onChange={(e) => setCity(e.target.value)} className={city !== "All" ? "lmd-on" : ""}>
              <option value="All">City: All</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  City: {c}
                </option>
              ))}
            </select>
          </div>
          <div className="lmd-filter">
            <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className={warehouse !== "All" ? "lmd-on" : ""}>
              <option value="All">Warehouse: All</option>
              {WAREHOUSES.map((w) => (
                <option key={w} value={w}>
                  Warehouse: {w}
                </option>
              ))}
            </select>
          </div>
          <div className="lmd-filter">
            <select value={seller} onChange={(e) => setSeller(e.target.value)} className={seller !== "All" ? "lmd-on" : ""}>
              <option value="All">Seller: All</option>
              {SELLERS.map((s) => (
                <option key={s} value={s}>
                  Seller: {s}
                </option>
              ))}
            </select>
          </div>
          <div className="lmd-filter">
            <select value={courier} onChange={(e) => setCourier(e.target.value)} className={courier !== "All" ? "lmd-on" : ""}>
              <option value="All">Courier: All</option>
              <optgroup label="Dark Store">
                {DS_COURIERS.map((c) => (
                  <option key={`ds-${c}`} value={c}>
                    Courier: {c}
                  </option>
                ))}
              </optgroup>
              <optgroup label="3PL">
                {TPL_COURIERS.map((c) => (
                  <option key={`tpl-${c}`} value={c}>
                    Courier: {c}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          <div className={`lmd-filter lmd-daterange ${dateFrom !== DEFAULT_DATE_FROM || dateTo !== DEFAULT_DATE_TO ? "lmd-on" : ""}`}>
            <input
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="Date range start"
            />
            <span className="lmd-daterange-sep">–</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="Date range end"
            />
          </div>
          {filtersActive && (
            <button className="lmd-clear" onClick={clearFilters}>
              Clear
            </button>
          )}
          <span className="lmd-filters-note">Applies to core order-outcome metrics below</span>
        </div>

        <div className="lmd-body">
          {/* Section A — core metrics */}
          <div className="lmd-kpi-grid">
            {coreCards.map((c) => (
              <div className="lmd-kpi-card" key={c.label}>
                <div className="lmd-kpi-top">
                  <span className="lmd-kpi-ico" style={{ background: `${c.accent}1a`, color: c.accent }}>
                    <c.icon className="lmd-ico-sm" aria-hidden="true" />
                  </span>
                </div>
                <div className="lmd-kpi-value">{c.value}</div>
                <div className="lmd-kpi-label">{c.label}</div>
              </div>
            ))}
          </div>

          {/* Section B — open-order pipeline */}
          <SectionCard title="Open-Order Pipeline" sub="Breakdown of open orders by attempt stage and exception type">
            <div className="lmd-barlist">
              {OPEN_PIPELINE.map((o) => (
                <div className="lmd-barlist-row" key={o.label}>
                  <span className="lmd-barlist-label">{o.label}</span>
                  <div className="lmd-barlist-track">
                    <div
                      className={`lmd-barlist-fill lmd-tone-${o.tone}`}
                      style={{ width: `${(o.value / maxOpenPipeline) * 100}%` }}
                    />
                  </div>
                  <span className="lmd-barlist-value">{o.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Section C — open-order stage backlog */}
          <SectionCard title="Open-Order Stage Backlog" sub="Current snapshot of open orders by stage — a backlog, not a sequential funnel; stages don't monotonically decrease">
            <div className="lmd-barlist">
              {OPEN_STAGE_BACKLOG.map((s) => (
                <div className="lmd-barlist-row" key={s.stage}>
                  <span className="lmd-barlist-label">{s.stage}</span>
                  <div className="lmd-barlist-track">
                    <div className={`lmd-barlist-fill lmd-tone-${s.tone}`} style={{ width: `${(s.count / maxStageBacklog) * 100}%` }} />
                  </div>
                  <span className="lmd-barlist-value">{s.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Section D — attempt-level (Dark Store) */}
          <SectionCard title="Attempt-Level Delivery Performance" sub="Outcome by delivery attempt number">
            <table className="lmd-table">
              <thead>
                <tr>
                  <th>Attempt</th>
                  <th className="lmd-num">Delivered</th>
                  <th className="lmd-num">Undelivered</th>
                  <th className="lmd-num">RTO Initiated</th>
                  <th className="lmd-num">RTO</th>
                </tr>
              </thead>
              <tbody>
                {ATTEMPTS.map((a) => (
                  <tr key={a.attempt}>
                    <td>{a.attempt}</td>
                    <td className="lmd-num lmd-good">{a.delivered.toLocaleString()}</td>
                    <td className="lmd-num">{a.undelivered.toLocaleString()}</td>
                    <td className="lmd-num lmd-warn-text">{a.rtoInitiated.toLocaleString()}</td>
                    <td className="lmd-num lmd-bad">{a.rto.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>

          {/* Section F — seller concentration */}
          <SectionCard
            title="Seller Concentration"
            sub={
              seller === "All"
                ? "Share of DS+3PL volume by top seller — flags over-reliance on a single seller"
                : `${seller}'s order volume by city — mirrors the real sheet's per-seller Seller Dependence view`
            }
          >
            {seller === "All" ? (
              <>
                <div className="lmd-barlist">
                  {TOP_SELLER_SHARE.map((s) => (
                    <div className="lmd-barlist-row" key={s.seller}>
                      <span className="lmd-barlist-label">{s.seller}</span>
                      <div className="lmd-barlist-track">
                        <div className="lmd-barlist-fill lmd-tone-info" style={{ width: `${s.pct}%` }} />
                      </div>
                      <span className="lmd-barlist-value">{pct(s.pct)}</span>
                    </div>
                  ))}
                </div>
                {TOP_SELLER_SHARE[0].pct > 40 && (
                  <div className="lmd-flag">
                    <ShieldAlert className="lmd-ico-sm" aria-hidden="true" />
                    {TOP_SELLER_SHARE[0].seller} accounts for {pct(TOP_SELLER_SHARE[0].pct)} of volume — concentration risk above the 40% threshold.
                  </div>
                )}
              </>
            ) : (
              <table className="lmd-table">
                <thead>
                  <tr>
                    <th>City</th>
                    <th className="lmd-num">Orders</th>
                    <th className="lmd-num">Delivery %</th>
                    <th className="lmd-num">O2D (min)</th>
                  </tr>
                </thead>
                <tbody>
                  {sellerCityBreakdown(seller).map((row) => (
                    <tr key={row.city}>
                      <td>{row.city}</td>
                      <td className="lmd-num">{row.orders.toLocaleString()}</td>
                      <td className="lmd-num lmd-good">{pct(row.deliveryPct)}</td>
                      <td className="lmd-num">{row.o2dMinutes} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>

          {/* Section G — lane-level */}
          <SectionCard title="Lane-Level Performance" sub="Core metrics by origin → destination city pair">
            <table className="lmd-table">
              <thead>
                <tr>
                  <th>Lane</th>
                  <th className="lmd-num">Orders</th>
                  <th className="lmd-num">Delivery %</th>
                  <th className="lmd-num">SLA %</th>
                  <th className="lmd-num">RTO %</th>
                  <th className="lmd-num">FASR</th>
                </tr>
              </thead>
              <tbody>
                {visibleLanes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="lmd-empty">
                      No lanes originate from {city} in this dataset.
                    </td>
                  </tr>
                ) : (
                  visibleLanes.map((l) => (
                    <tr key={l.lane}>
                      <td>{l.lane}</td>
                      <td className="lmd-num">{l.orders.toLocaleString()}</td>
                      <td className="lmd-num lmd-good">{pct(l.deliveryPct)}</td>
                      <td className="lmd-num">{pct(l.slaPct)}</td>
                      <td className="lmd-num lmd-bad">{pct(l.rtoPct)}</td>
                      <td className="lmd-num">{pct(l.fasrPct)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </SectionCard>

          {/* Section H — returns / reverse logistics */}
          <SectionCard title="Returns & Reverse Logistics" sub="Order-level funnel from RTO initiation through putaway">
            <FunnelBars rows={RETURNS_FUNNEL.map((r) => ({ label: r.stage, count: r.count, max: maxReturns }))} compact />
          </SectionCard>

          {/* Section K — operational context strip */}
          <div className="lmd-context-strip">
            <div className="lmd-context-chip">
              <Cloud className="lmd-ico-sm" aria-hidden="true" />
              Delhi NCR: heavy rain — 2 lanes delayed
            </div>
            <div className="lmd-context-chip">
              <ListOrdered className="lmd-ico-sm" aria-hidden="true" />
              Courier priority: Blitz → India Post → Elasticrun
            </div>
            <div className="lmd-context-chip">
              <Target className="lmd-ico-sm" aria-hidden="true" />
              Benchmark: FASR 92% · Delivery % 96%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Small building blocks ───────────────────────────────────────────────────

function SectionCard({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="lmd-card">
      <div className="lmd-card-head">
        <div className="lmd-card-title">{title}</div>
        <div className="lmd-card-sub">{sub}</div>
      </div>
      {children}
    </div>
  );
}

function FunnelBars({
  rows,
  compact,
}: {
  rows: { label: string; count: number; max: number; tag?: string; warn?: boolean }[];
  compact?: boolean;
}) {
  return (
    <div className={`lmd-funnel ${compact ? "lmd-funnel-compact" : ""}`}>
      {rows.map((r) => (
        <div className="lmd-funnel-row" key={r.label}>
          <span className="lmd-funnel-label">{r.label}</span>
          <div className="lmd-funnel-track">
            <div className="lmd-funnel-fill" style={{ width: `${(r.count / r.max) * 100}%` }} />
          </div>
          <span className="lmd-funnel-count">{r.count.toLocaleString()}</span>
          {r.tag && <span className={`lmd-funnel-tag ${r.warn ? "lmd-funnel-tag-warn" : ""}`}>{r.tag}</span>}
        </div>
      ))}
    </div>
  );
}

// Scoped styles — prefixed with `.lmd-` so generic selectors never leak.
const css = `
.lmd-screen{--c-bg:#ffffff;--c-bg2:#f5f3ee;--c-border:#e2dfd5;--c-border2:#d8d4c8;--c-t1:#1f1d17;--c-t2:#6b6862;--c-t3:#8a8a85;--c-info-t:#b8751f;--c-info-b:#e8c389;--c-info-bg:#fbf0dc;
  background:var(--c-bg);border:0.5px solid var(--c-border);border-radius:12px;overflow:hidden;font-family:inherit;width:100%;max-width:100%;box-sizing:border-box}
.lmd-screen .lmd-ico{width:16px;height:16px;vertical-align:-3px;margin-right:7px;display:inline-block}
.lmd-screen .lmd-ico-sm{width:14px;height:14px;flex:none}
.lmd-topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 18px;border-bottom:0.5px solid var(--c-border)}
.lmd-topbar-title{font-size:15px;font-weight:700;color:var(--c-t1);display:flex;align-items:center}
.lmd-topbar-sub{font-size:12px;color:var(--c-t3);margin-top:2px}
.lmd-asof{font-size:11px;font-weight:600;color:var(--c-t2);background:var(--c-bg2);border:0.5px solid var(--c-border);border-radius:999px;padding:5px 11px;white-space:nowrap}
.lmd-filters{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:11px 18px;border-bottom:0.5px solid var(--c-border);background:var(--c-bg2)}
.lmd-filters-label{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--c-t3);text-transform:uppercase;letter-spacing:0.06em}
.lmd-filter{position:relative;display:inline-flex;align-items:center}
.lmd-screen .lmd-filter select{appearance:none;font-size:12px;padding:7px 26px 7px 11px;border:0.5px solid var(--c-border2);border-radius:8px;background:var(--c-bg);color:var(--c-t2);cursor:pointer;line-height:1;max-width:220px}
.lmd-screen .lmd-filter select.lmd-on{border-color:var(--c-info-b);color:var(--c-info-t);background:var(--c-info-bg);font-weight:600}
.lmd-screen .lmd-daterange{gap:5px;padding:4px 9px;border:0.5px solid var(--c-border2);border-radius:8px;background:var(--c-bg)}
.lmd-screen .lmd-daterange.lmd-on{border-color:var(--c-info-b);background:var(--c-info-bg)}
.lmd-screen .lmd-daterange input[type="date"]{border:none;background:transparent;font-size:12px;color:var(--c-t2);padding:3px 0;line-height:1;width:108px}
.lmd-screen .lmd-daterange.lmd-on input[type="date"]{color:var(--c-info-t);font-weight:600}
.lmd-daterange-sep{font-size:11px;color:var(--c-t3)}
.lmd-screen .lmd-clear{font-size:12px;padding:7px 13px;border:0.5px solid var(--c-border2);border-radius:8px;background:var(--c-bg);color:var(--c-t2);cursor:pointer;line-height:1}
.lmd-filters-note{font-size:11px;color:var(--c-t3);margin-left:auto}
.lmd-body{padding:18px;display:flex;flex-direction:column;gap:16px}

.lmd-kpi-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
.lmd-kpi-card{border:0.5px solid var(--c-border);border-radius:10px;padding:13px 14px;background:var(--c-bg)}
.lmd-kpi-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;min-height:24px}
.lmd-kpi-ico{width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center}
.lmd-kpi-value{font-size:21px;font-weight:700;color:var(--c-t1);font-variant-numeric:tabular-nums;line-height:1.1}
.lmd-kpi-label{font-size:11.5px;color:var(--c-t3);margin-top:4px}

.lmd-card{border:0.5px solid var(--c-border);border-radius:10px;padding:16px;background:var(--c-bg)}
.lmd-card-head{margin-bottom:12px}
.lmd-card-title{font-size:13px;font-weight:700;color:var(--c-t1)}
.lmd-card-sub{font-size:11.5px;color:var(--c-t3);margin-top:2px}
.lmd-subhead{font-size:11px;font-weight:600;color:var(--c-t2);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px}

.lmd-barlist{display:flex;flex-direction:column;gap:9px}
.lmd-barlist-row{display:grid;grid-template-columns:160px 1fr 56px;align-items:center;gap:10px}
.lmd-barlist-label{font-size:12px;color:var(--c-t2)}
.lmd-barlist-track{height:8px;border-radius:999px;background:var(--c-bg2);overflow:hidden}
.lmd-barlist-fill{height:100%;border-radius:999px}
.lmd-tone-neutral{background:#64748b}
.lmd-tone-warn{background:#d97706}
.lmd-tone-risk{background:#dc2626}
.lmd-tone-info{background:#2563eb}
.lmd-barlist-value{font-size:12px;font-weight:600;color:var(--c-t1);text-align:right;font-variant-numeric:tabular-nums}

.lmd-flag{display:flex;align-items:center;gap:7px;margin-top:12px;padding:9px 12px;border-radius:8px;background:#fef3c7;border:0.5px solid #f3d089;color:#92400e;font-size:12px;font-weight:500}

.lmd-funnel{display:flex;flex-direction:column;gap:7px}
.lmd-funnel-row{display:grid;grid-template-columns:200px 1fr 60px auto;align-items:center;gap:10px}
.lmd-funnel-compact .lmd-funnel-row{grid-template-columns:170px 1fr 56px}
.lmd-funnel-label{font-size:12px;color:var(--c-t2)}
.lmd-funnel-track{height:16px;border-radius:5px;background:var(--c-bg2);overflow:hidden}
.lmd-funnel-fill{height:100%;border-radius:5px;background:linear-gradient(90deg,#2563eb,#60a5fa)}
.lmd-funnel-count{font-size:12px;font-weight:600;color:var(--c-t1);text-align:right;font-variant-numeric:tabular-nums}
.lmd-funnel-tag{font-size:10px;font-weight:600;color:var(--c-t3);background:var(--c-bg2);border:0.5px solid var(--c-border);border-radius:999px;padding:2px 7px;white-space:nowrap;justify-self:end}
.lmd-funnel-tag-warn{color:#92400e;background:#fef3c7;border-color:#f3d089}

.lmd-table{width:100%;border-collapse:collapse;font-size:12.5px}
.lmd-table th{text-align:left;font-size:10.5px;font-weight:600;color:var(--c-t3);text-transform:uppercase;letter-spacing:0.05em;padding:0 10px 8px;border-bottom:0.5px solid var(--c-border)}
.lmd-table td{padding:9px 10px;border-bottom:0.5px solid var(--c-border);color:var(--c-t1)}
.lmd-table tr:last-child td{border-bottom:none}
.lmd-table .lmd-num{text-align:right;font-variant-numeric:tabular-nums}
.lmd-good{color:#166534;font-weight:600}
.lmd-bad{color:#991b1b;font-weight:600}
.lmd-warn-text{color:#92400e;font-weight:600}
.lmd-empty{text-align:center;color:var(--c-t3);font-style:italic;padding:16px 10px}

.lmd-context-strip{display:flex;gap:10px;flex-wrap:wrap}
.lmd-context-chip{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:var(--c-t2);background:var(--c-bg2);border:0.5px solid var(--c-border);border-radius:999px;padding:6px 12px}
`;
