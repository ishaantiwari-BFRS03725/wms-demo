import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDown,
  ArrowUp,
  Boxes,
  CalendarClock,
  Filter,
  LayoutDashboard,
  PackageCheck,
  PackageX,
  PauseCircle,
} from "lucide-react";

export const Route = createFileRoute("/_wms/inventory-dashboard")({
  head: () => ({
    meta: [{ title: "Inventory Dashboard — Inventory" }],
  }),
  component: InventoryDashboard,
});

// wh, seller, sku, description, category, grade (A/B/C), quantity, condition (Good | Bad), status (Available | On Hold), age in days, unit price (INR)
const ROWS: [
  string,
  string,
  string,
  string,
  string,
  "A" | "B" | "C",
  number,
  "Good" | "Bad",
  "Available" | "On Hold",
  number,
  number,
][] = [
  ["Dasna", "Imagine Marketing", "600179", "boAt Airdopes 141 TWS Earbuds", "Audio", "A", 1250, "Good", "Available", 12, 1299],
  ["Dasna", "Imagine Marketing", "600822", "boAt Rockerz 450 Bluetooth Headphones", "Audio", "B", 120, "Good", "Available", 28, 1499],
  ["Dasna", "Imagine Marketing", "600868", "boAt Bassheads 100 Wired Earphones", "Audio", "C", 1250, "Bad", "On Hold", 95, 399],
  ["Dasna", "Prime Distributors", "600900", "boAt Stone 350 Bluetooth Speaker", "Speakers", "C", 6, "Bad", "On Hold", 130, 1999],
  ["Dasna", "Prime Distributors", "601005", "boAt Aavante Bar 1160 Soundbar", "Speakers", "B", 40, "Good", "Available", 45, 6999],
  ["Dasna", "Imagine Marketing", "601010", "boAt Nirvana Ion ANC Earbuds", "Audio", "A", 75, "Good", "Available", 20, 2499],
  ["Dasna", "Prime Distributors", "601015", "boAt Lunar Connect Smartwatch Strap", "Accessories", "C", 60, "Bad", "On Hold", 70, 499],
  ["Dasna", "Imagine Marketing", "601020", "boAt Immortal 1300 Gaming Headset", "Audio", "B", 90, "Good", "On Hold", 55, 2999],
  ["Bhiwandi", "Imagine Marketing", "601000", "boAt Wave Call Smartwatch", "Wearables", "A", 48, "Good", "Available", 8, 1799],
  ["Bhiwandi", "Prime Distributors", "601002", "boAt Type-C 500 Charging Cable", "Accessories", "A", 300, "Good", "Available", 15, 299],
  ["Bhiwandi", "Imagine Marketing", "601010", "boAt Nirvana Ion ANC Earbuds", "Audio", "B", 80, "Good", "Available", 33, 2499],
  ["Bhiwandi", "Prime Distributors", "601005", "boAt Aavante Bar 1160 Soundbar", "Speakers", "C", 4, "Bad", "On Hold", 110, 6999],
  ["Bhiwandi", "Imagine Marketing", "600179", "boAt Airdopes 141 TWS Earbuds", "Audio", "C", 10, "Bad", "On Hold", 150, 1299],
  ["Bhiwandi", "Prime Distributors", "601030", "boAt Storm Call Smartwatch", "Wearables", "A", 55, "Good", "Available", 5, 1999],
  ["Bhiwandi", "Imagine Marketing", "601035", "boAt Deuce USB Cable 300", "Accessories", "B", 220, "Good", "Available", 60, 349],
  ["Bhiwandi", "Prime Distributors", "601040", "boAt Rockerz 255 Pro+", "Audio", "C", 35, "Bad", "On Hold", 40, 1299],
];

const WAREHOUSES = Array.from(new Set(ROWS.map((r) => r[0]))).sort();
const SELLERS = Array.from(new Set(ROWS.map((r) => r[1]))).sort();
const CATEGORIES = Array.from(new Set(ROWS.map((r) => r[4]))).sort();

const AVG_DAILY_OUTBOUND = 96; // mock — units shipped per day, used to derive days of inventory

const AGE_BUCKETS = [
  { key: "0-30", label: "0–30 days", max: 30, color: "#16a34a" },
  { key: "31-60", label: "31–60 days", max: 60, color: "#d97706" },
  { key: "61-90", label: "61–90 days", max: 90, color: "#ea580c" },
  { key: "90+", label: "90+ days", max: Infinity, color: "#dc2626" },
];

function bucketFor(ageDays: number) {
  return AGE_BUCKETS.find((b) => ageDays <= b.max) ?? AGE_BUCKETS[AGE_BUCKETS.length - 1];
}

const formatInr = (n: number) =>
  `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function InventoryDashboard() {
  const [seller, setSeller] = useState("all");
  const [warehouse, setWarehouse] = useState("all");
  const [category, setCategory] = useState("all");

  const rows = ROWS.filter(
    (r) =>
      (seller === "all" || r[1] === seller) &&
      (warehouse === "all" || r[0] === warehouse) &&
      (category === "all" || r[4] === category),
  );

  const sumQty = (pred: (r: (typeof ROWS)[number]) => boolean) =>
    rows.filter(pred).reduce((s, r) => s + r[6], 0);
  const sumValue = (pred: (r: (typeof ROWS)[number]) => boolean) =>
    rows.filter(pred).reduce((s, r) => s + r[6] * r[10], 0);

  const availableQty = sumQty((r) => r[8] === "Available");
  const goodQty = sumQty((r) => r[7] === "Good");
  const badQty = sumQty((r) => r[7] === "Bad");
  const onHoldQty = sumQty((r) => r[8] === "On Hold");

  const availableValue = sumValue((r) => r[8] === "Available");
  const goodValue = sumValue((r) => r[7] === "Good");
  const badValue = sumValue((r) => r[7] === "Bad");
  const onHoldValue = sumValue((r) => r[8] === "On Hold");

  const totalQty = goodQty + badQty;
  const daysOfInventory = totalQty > 0 ? Math.round(totalQty / AVG_DAILY_OUTBOUND) : 0;

  const ageingData = AGE_BUCKETS.map((b) => ({
    bucket: b.label,
    qty: rows.filter((r) => bucketFor(r[9]).key === b.key).reduce((s, r) => s + r[6], 0),
    color: b.color,
  }));

  const cards = [
    {
      label: "Available Inventory",
      value: availableQty,
      moneyValue: availableValue,
      icon: Boxes,
      accent: "#2563eb",
      delta: "+4.2%",
      up: true,
      good: true,
    },
    {
      label: "Good Inventory",
      value: goodQty,
      moneyValue: goodValue,
      icon: PackageCheck,
      accent: "#16a34a",
      delta: "+2.8%",
      up: true,
      good: true,
    },
    {
      label: "Bad Inventory",
      value: badQty,
      moneyValue: badValue,
      icon: PackageX,
      accent: "#dc2626",
      delta: "-6.5%",
      up: false,
      good: true,
    },
    {
      label: "On Hold Inventory",
      value: onHoldQty,
      moneyValue: onHoldValue,
      icon: PauseCircle,
      accent: "#d97706",
      delta: "+9.1%",
      up: true,
      good: false,
    },
  ];

  const filtersActive = seller !== "all" || warehouse !== "all" || category !== "all";

  return (
    <div className="bg-muted/40 p-4">
      <style>{css}</style>
      <div className="ivd-screen">
        {/* Top bar */}
        <div className="ivd-topbar">
          <div>
            <div className="ivd-topbar-title">
              <LayoutDashboard className="ivd-ico" aria-hidden="true" />
              Inventory Dashboard
            </div>
            <div className="ivd-topbar-sub">
              Stock health, hold exposure, and ageing across all warehouses
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="ivd-filters">
          <span className="ivd-filters-label">
            <Filter className="ivd-ico-sm" aria-hidden="true" />
            Filters
          </span>
          <div className="ivd-filter">
            <select
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              className={seller !== "all" ? "ivd-on" : ""}
            >
              <option value="all">Seller: All</option>
              {SELLERS.map((s) => (
                <option key={s} value={s}>
                  Seller: {s}
                </option>
              ))}
            </select>
          </div>
          <div className="ivd-filter">
            <select
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              className={warehouse !== "all" ? "ivd-on" : ""}
            >
              <option value="all">Warehouse: All</option>
              {WAREHOUSES.map((w) => (
                <option key={w} value={w}>
                  Warehouse: {w}
                </option>
              ))}
            </select>
          </div>
          <div className="ivd-filter">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={category !== "all" ? "ivd-on" : ""}
            >
              <option value="all">Category: All</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>
          </div>
          {filtersActive && (
            <button
              className="ivd-clear"
              onClick={() => {
                setSeller("all");
                setWarehouse("all");
                setCategory("all");
              }}
            >
              Clear
            </button>
          )}
        </div>

        <div className="ivd-body">
          {/* KPI cards */}
          <div className="ivd-kpi-grid">
            {cards.map((c) => (
              <div className="ivd-kpi-card" key={c.label}>
                <div className="ivd-kpi-top">
                  <span className="ivd-kpi-ico" style={{ background: `${c.accent}1a`, color: c.accent }}>
                    <c.icon className="ivd-ico-sm" aria-hidden="true" />
                  </span>
                  <span className={`ivd-delta ${c.good ? (c.up ? "ivd-delta-pos" : "ivd-delta-neg") : c.up ? "ivd-delta-warn" : "ivd-delta-pos"}`}>
                    {c.up ? (
                      <ArrowUp className="ivd-delta-ico" aria-hidden="true" />
                    ) : (
                      <ArrowDown className="ivd-delta-ico" aria-hidden="true" />
                    )}
                    {c.delta}
                  </span>
                </div>
                <div className="ivd-kpi-value">{c.value.toLocaleString()}</div>
                <div className="ivd-kpi-label">{c.label}</div>
                <div className="ivd-kpi-money">{formatInr(c.moneyValue)}</div>
              </div>
            ))}
          </div>

          {/* Days of Inventory + Ageing */}
          <div className="ivd-row">
            <div className="ivd-card ivd-doi">
              <div className="ivd-card-head">
                <span className="ivd-kpi-ico ivd-doi-ico">
                  <CalendarClock className="ivd-ico-sm" aria-hidden="true" />
                </span>
                <div>
                  <div className="ivd-card-title">Days of Inventory</div>
                  <div className="ivd-card-sub">Stock cover at current outbound pace</div>
                </div>
              </div>
              <div className="ivd-doi-value">
                {daysOfInventory}
                <span className="ivd-doi-unit">days</span>
              </div>
              <div className="ivd-delta ivd-delta-pos ivd-doi-delta">
                <ArrowDown className="ivd-delta-ico" aria-hidden="true" />
                3.1% vs last week
              </div>
              <div className="ivd-doi-foot">
                {totalQty.toLocaleString()} units ÷ ~{AVG_DAILY_OUTBOUND}/day avg outbound
              </div>
            </div>

            <div className="ivd-card ivd-ageing">
              <div className="ivd-card-head">
                <div>
                  <div className="ivd-card-title">Inventory Ageing</div>
                  <div className="ivd-card-sub">Units on hand by time since receipt</div>
                </div>
              </div>
              <div className="ivd-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageingData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#e2dfd5" />
                    <XAxis
                      dataKey="bucket"
                      tick={{ fontSize: 11, fill: "#8a8a85" }}
                      axisLine={{ stroke: "#e2dfd5" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#8a8a85" }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip
                      cursor={{ fill: "#f5f3ee" }}
                      contentStyle={{
                        fontSize: 12,
                        border: "0.5px solid #e2dfd5",
                        borderRadius: 8,
                      }}
                      formatter={(v: number) => [v.toLocaleString(), "Units"]}
                    />
                    <Bar dataKey="qty" radius={[6, 6, 0, 0]}>
                      {ageingData.map((d) => (
                        <Cell key={d.bucket} fill={d.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Scoped styles — prefixed with `.ivd-screen` so generic selectors never leak.
const css = `
.ivd-screen{--c-bg:#ffffff;--c-bg2:#f5f3ee;--c-border:#e2dfd5;--c-border2:#d8d4c8;--c-t1:#1f1d17;--c-t2:#6b6862;--c-t3:#8a8a85;--c-info-t:#b8751f;--c-info-b:#e8c389;--c-info-bg:#fbf0dc;
  background:var(--c-bg);border:0.5px solid var(--c-border);border-radius:12px;overflow:hidden;font-family:inherit;width:100%;max-width:100%;box-sizing:border-box}
.ivd-screen .ivd-ico{width:16px;height:16px;vertical-align:-3px;margin-right:7px;display:inline-block}
.ivd-screen .ivd-ico-sm{width:15px;height:15px;flex:none}
.ivd-topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 18px;border-bottom:0.5px solid var(--c-border)}
.ivd-topbar-title{font-size:15px;font-weight:700;color:var(--c-t1);display:flex;align-items:center}
.ivd-topbar-sub{font-size:12px;color:var(--c-t3);margin-top:2px}
.ivd-filters{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:11px 18px;border-bottom:0.5px solid var(--c-border);background:var(--c-bg2)}
.ivd-filters-label{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--c-t3);text-transform:uppercase;letter-spacing:0.06em}
.ivd-filter{position:relative;display:inline-flex;align-items:center}
.ivd-screen .ivd-filter select{appearance:none;font-size:12px;padding:7px 26px 7px 11px;border:0.5px solid var(--c-border2);border-radius:8px;background:var(--c-bg);color:var(--c-t2);cursor:pointer;line-height:1;max-width:220px}
.ivd-screen .ivd-filter select.ivd-on{border-color:var(--c-info-b);color:var(--c-info-t);background:var(--c-info-bg);font-weight:600}
.ivd-screen .ivd-clear{font-size:12px;padding:7px 13px;border:0.5px solid var(--c-border2);border-radius:8px;background:var(--c-bg);color:var(--c-t2);cursor:pointer;line-height:1}
.ivd-body{padding:18px}
.ivd-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.ivd-kpi-card{border:0.5px solid var(--c-border);border-radius:10px;padding:14px 16px;background:var(--c-bg)}
.ivd-kpi-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.ivd-kpi-ico{width:30px;height:30px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center}
.ivd-kpi-value{font-size:24px;font-weight:700;color:var(--c-t1);font-variant-numeric:tabular-nums;line-height:1.1}
.ivd-kpi-label{font-size:12px;color:var(--c-t3);margin-top:4px}
.ivd-kpi-money{font-size:12px;font-weight:600;color:var(--c-t2);margin-top:8px;padding-top:8px;border-top:0.5px solid var(--c-border);font-variant-numeric:tabular-nums}
.ivd-delta{display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:600;padding:3px 7px;border-radius:999px}
.ivd-delta-ico{width:11px;height:11px}
.ivd-delta-pos{color:#166534;background:#dcfce7}
.ivd-delta-neg{color:#991b1b;background:#fee2e2}
.ivd-delta-warn{color:#92400e;background:#fef3c7}
.ivd-row{display:grid;grid-template-columns:280px 1fr;gap:14px;margin-top:14px}
.ivd-card{border:0.5px solid var(--c-border);border-radius:10px;padding:16px;background:var(--c-bg)}
.ivd-card-head{display:flex;align-items:flex-start;gap:10px;margin-bottom:8px}
.ivd-card-title{font-size:13px;font-weight:700;color:var(--c-t1)}
.ivd-card-sub{font-size:11.5px;color:var(--c-t3);margin-top:2px}
.ivd-doi{display:flex;flex-direction:column}
.ivd-doi-ico{background:#1f1d171a;color:#1f1d17}
.ivd-doi-value{font-size:38px;font-weight:700;color:var(--c-t1);line-height:1;margin:10px 0 8px}
.ivd-doi-unit{font-size:14px;font-weight:600;color:var(--c-t3);margin-left:6px}
.ivd-doi-delta{margin-bottom:10px}
.ivd-doi-foot{font-size:11px;color:var(--c-t3);margin-top:auto;padding-top:8px;border-top:0.5px solid var(--c-border)}
.ivd-chart{height:220px;margin-top:8px}
`;
