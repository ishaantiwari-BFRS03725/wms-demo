import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Boxes,
  Download,
  Filter,
  Search,
} from "lucide-react";

export const Route = createFileRoute("/_wms/inventory-view")({
  head: () => ({
    meta: [{ title: "Inventory View — Inventory" }],
  }),
  component: InventoryView,
});

const COLUMNS = [
  "WH Name",
  "SKU",
  "Description",
  "Product Category",
  "Storage Type",
  "Inventory Type",
  "Total Quantity",
  "Available Quantity",
  "Blocked Quantity",
];

// Columns rendered right-aligned (numeric).
const NUMERIC_COLS = new Set([
  "Total Quantity",
  "Available Quantity",
  "Blocked Quantity",
]);

// Filterable dimension columns.
const FILTER_COLS = [
  "WH Name",
  "Product Category",
  "Storage Type",
  "Inventory Type",
];

const ROWS: string[][] = [
  ["boAt_Dasna", "600179", "boAt Airdopes 141 TWS Earbuds", "Electronics", "Sellable", "Good", "1250", "1250", "0"],
  ["boAt_Dasna", "600822", "boAt Rockerz 450 Bluetooth Headphones", "Electronics", "Sellable", "Good", "120", "110", "10"],
  ["boAt_Dasna", "600868", "boAt Bassheads 100 Wired Earphones", "Electronics", "Quarantine", "Bad", "1250", "0", "1250"],
  ["boAt_Dasna", "600900", "boAt Stone 350 Bluetooth Speaker", "Electronics", "Quarantine", "Bad", "6", "0", "6"],
  ["boAt_Dasna", "600868", "boAt Bassheads 100 Wired Earphones", "Electronics", "Virtual", "Missing", "4", "0", "4"],
  ["boAt_Dasna", "601005", "boAt Aavante Bar 1160 Soundbar", "Electronics", "Virtual", "Cancel", "6", "0", "6"],
  ["boAt_Bhiwandi", "601000", "boAt Wave Call Smartwatch", "Electronics", "Sellable", "Good", "48", "40", "8"],
  ["boAt_Bhiwandi", "601002", "boAt Type-C 500 Charging Cable", "Accessories", "Sellable", "Good", "300", "298", "2"],
  ["boAt_Bhiwandi", "601010", "boAt Nirvana Ion ANC Earbuds", "Electronics", "Sellable", "Good", "80", "75", "5"],
  ["boAt_Bhiwandi", "601005", "boAt Aavante Bar 1160 Soundbar", "Electronics", "Virtual", "Missing", "4", "0", "4"],
  ["boAt_Bhiwandi", "600179", "boAt Airdopes 141 TWS Earbuds", "Electronics", "Virtual", "Cancel", "10", "0", "10"],
  ["boAt_Bhiwandi", "601015", "boAt Lunar Connect Smartwatch Strap", "Accessories", "Quarantine", "Bad", "60", "0", "60"],
];

function InventoryView() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ col: string; dir: "asc" | "desc" } | null>(
    null,
  );

  const optionsFor = (col: string) => {
    const idx = COLUMNS.indexOf(col);
    if (idx < 0) return [] as string[];
    return Array.from(new Set(ROWS.map((r) => r[idx]))).sort();
  };

  const activeFilters = Object.entries(filters).filter(
    ([, v]) => v && v !== "all",
  );

  const q = search.trim().toLowerCase();
  const filteredRows = ROWS.filter((row) => {
    const matchesSearch =
      q === "" || row.some((cell) => cell.toLowerCase().includes(q));
    const matchesFilters = activeFilters.every(([col, val]) => {
      const idx = COLUMNS.indexOf(col);
      return idx >= 0 && row[idx] === val;
    });
    return matchesSearch && matchesFilters;
  });

  const totalQtyIdx = COLUMNS.indexOf("Total Quantity");
  const availQtyIdx = COLUMNS.indexOf("Available Quantity");
  const totalQtySum = filteredRows.reduce(
    (sum, r) => sum + Number(r[totalQtyIdx]),
    0,
  );
  const availQtySum = filteredRows.reduce(
    (sum, r) => sum + Number(r[availQtyIdx]),
    0,
  );

  const sortedRows = sort
    ? [...filteredRows].sort((a, b) => {
        const idx = COLUMNS.indexOf(sort.col);
        const diff = Number(a[idx]) - Number(b[idx]);
        return sort.dir === "asc" ? diff : -diff;
      })
    : filteredRows;

  const toggleSort = (col: string) =>
    setSort((prev) => {
      if (!prev || prev.col !== col) return { col, dir: "asc" };
      if (prev.dir === "asc") return { col, dir: "desc" };
      return null;
    });

  const downloadCsv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [
      COLUMNS.map(esc).join(","),
      ...sortedRows.map((row) => row.map(esc).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory-view.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const setFilter = (col: string, val: string) =>
    setFilters((prev) => ({ ...prev, [col]: val }));

  const clearAll = () => {
    setSearch("");
    setFilters({});
  };

  return (
    <div className="bg-muted/40 p-4">
      <style>{css}</style>
      <div className="iv-screen">
        {/* Top bar */}
        <div className="iv-topbar">
          <div>
            <div className="iv-topbar-title">
              <Boxes className="iv-ico" aria-hidden="true" />
              Inventory View
            </div>
            <div className="iv-topbar-sub">
              Consolidated stock by storage type and inventory state
            </div>
          </div>
          <div className="iv-actions">
            <div className="iv-search">
              <Search className="iv-ico-sm iv-search-ico" aria-hidden="true" />
              <input
                placeholder="Search SKU / Description / WH"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {(search !== "" || activeFilters.length > 0) && (
              <button className="iv-btn" onClick={clearAll}>
                Clear
              </button>
            )}
            <button className="iv-btn iv-btn-primary" onClick={downloadCsv}>
              <Download className="iv-ico-sm" aria-hidden="true" />
              Download Inventory
            </button>
          </div>
        </div>

        {/* Totals */}
        <div className="iv-summary">
          <span className="iv-summary-item">
            Total Inventory: <strong>{totalQtySum.toLocaleString()}</strong>
          </span>
          <span className="iv-summary-sep" aria-hidden="true">
            ·
          </span>
          <span className="iv-summary-item">
            Available: <strong>{availQtySum.toLocaleString()}</strong>
          </span>
        </div>

        {/* Filters */}
        <div className="iv-filters">
          <span className="iv-filters-label">
            <Filter className="iv-ico-sm" aria-hidden="true" />
            Filters
          </span>
          {FILTER_COLS.map((col) => (
            <div key={col} className="iv-filter">
              <select
                value={filters[col] ?? "all"}
                onChange={(e) => setFilter(col, e.target.value)}
                className={filters[col] && filters[col] !== "all" ? "iv-on" : ""}
              >
                <option value="all">{col}: All</option>
                {optionsFor(col).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="iv-table-wrap">
          <table>
            <thead>
              <tr>
                {COLUMNS.map((c) => {
                  const numeric = NUMERIC_COLS.has(c);
                  const active = sort?.col === c;
                  return (
                    <th
                      key={c}
                      className={[
                        numeric ? "iv-num" : "",
                        numeric ? "iv-sortable" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={numeric ? () => toggleSort(c) : undefined}
                    >
                      {numeric ? (
                        <span className="iv-th-sort">
                          {c}
                          {active && sort ? (
                            sort.dir === "asc" ? (
                              <ArrowUp className="iv-sort-ico" aria-hidden="true" />
                            ) : (
                              <ArrowDown className="iv-sort-ico" aria-hidden="true" />
                            )
                          ) : (
                            <ArrowUpDown
                              className="iv-sort-ico iv-sort-idle"
                              aria-hidden="true"
                            />
                          )}
                        </span>
                      ) : (
                        c
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={[
                        NUMERIC_COLS.has(COLUMNS[ci]) ? "iv-num" : "",
                        COLUMNS[ci] === "Inventory Type" && cell === "Bad"
                          ? "iv-bad"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td className="iv-empty" colSpan={COLUMNS.length}>
                    No matching records
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="iv-foot">
          Showing {filteredRows.length} of {ROWS.length} records
        </div>
      </div>
    </div>
  );
}

// Scoped styles — prefixed with `.iv-screen` so generic selectors never leak.
const css = `
.iv-screen{--c-bg:#ffffff;--c-bg2:#f5f3ee;--c-border:#e2dfd5;--c-border2:#d8d4c8;--c-t1:#1f1d17;--c-t2:#6b6862;--c-t3:#8a8a85;--c-info-t:#b8751f;--c-info-b:#e8c389;--c-info-bg:#fbf0dc;
  background:var(--c-bg);border:0.5px solid var(--c-border);border-radius:12px;overflow:hidden;font-family:inherit;width:100%;max-width:100%;box-sizing:border-box}
.iv-screen .iv-ico{width:16px;height:16px;vertical-align:-3px;margin-right:7px;display:inline-block}
.iv-screen .iv-ico-sm{width:14px;height:14px;flex:none}
.iv-topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 18px;border-bottom:0.5px solid var(--c-border);flex-wrap:wrap}
.iv-topbar-title{font-size:15px;font-weight:700;color:var(--c-t1);display:flex;align-items:center}
.iv-topbar-sub{font-size:12px;color:var(--c-t3);margin-top:2px}
.iv-actions{display:flex;gap:8px;align-items:center}
.iv-search{position:relative}
.iv-search-ico{position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--c-t3)}
.iv-search input{width:240px;box-sizing:border-box;font-size:12px;padding:8px 10px 8px 28px;border:0.5px solid var(--c-border);border-radius:8px;background:var(--c-bg2);color:var(--c-t2)}
.iv-screen .iv-btn{font-size:12px;padding:7px 13px;border:0.5px solid var(--c-border2);border-radius:8px;background:var(--c-bg2);color:var(--c-t2);cursor:pointer;display:inline-flex;align-items:center;gap:6px;line-height:1}
.iv-screen .iv-btn-primary{background:#1f1d17;border-color:#1f1d17;color:#fff;font-weight:600}
.iv-filters{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:11px 18px;border-bottom:0.5px solid var(--c-border);background:var(--c-bg2)}
.iv-filters-label{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--c-t3);text-transform:uppercase;letter-spacing:0.06em}
.iv-filter{position:relative;display:inline-flex;align-items:center}
.iv-screen .iv-filter select{appearance:none;font-size:12px;padding:7px 26px 7px 11px;border:0.5px solid var(--c-border2);border-radius:8px;background:var(--c-bg);color:var(--c-t2);cursor:pointer;line-height:1;max-width:200px}
.iv-screen .iv-filter select.iv-on{border-color:var(--c-info-b);color:var(--c-info-t);background:var(--c-info-bg);font-weight:600}
.iv-summary{display:flex;align-items:center;gap:8px;padding:11px 18px;font-size:12px;color:var(--c-t2);border-bottom:0.5px solid var(--c-border)}
.iv-summary strong{color:var(--c-t1);font-weight:700;font-variant-numeric:tabular-nums}
.iv-summary-sep{color:var(--c-t3)}
.iv-table-wrap{margin:16px 18px 0;overflow:auto;max-height:calc(100vh - 280px);border:0.5px solid var(--c-border);border-radius:9px}
.iv-screen table{width:100%;border-collapse:collapse;font-size:12px;white-space:nowrap}
.iv-screen th{position:sticky;top:0;z-index:1;background:var(--c-bg2);text-align:left;font-weight:600;font-size:11px;color:var(--c-t3);padding:8px 11px;border-bottom:0.5px solid var(--c-border)}
.iv-screen td{padding:8px 11px;border-bottom:0.5px solid var(--c-border);color:var(--c-t1)}
.iv-screen th.iv-num,.iv-screen td.iv-num{text-align:right;font-variant-numeric:tabular-nums}
.iv-screen th.iv-sortable{cursor:pointer;user-select:none}
.iv-th-sort{display:inline-flex;align-items:center;gap:4px;justify-content:flex-end}
.iv-sort-ico{width:12px;height:12px;flex:none}
.iv-sort-idle{opacity:0.35}
.iv-screen tr:last-child td{border-bottom:none}
.iv-screen .iv-bad{color:#b91c1c;font-weight:600}
.iv-empty{text-align:center;color:var(--c-t3);padding:28px 11px}
.iv-foot{padding:12px 18px;font-size:11px;color:var(--c-t3)}
`;
