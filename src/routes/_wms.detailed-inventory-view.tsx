import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Boxes, Download, Filter, Search } from "lucide-react";

export const Route = createFileRoute("/_wms/detailed-inventory-view")({
  head: () => ({
    meta: [{ title: "Detailed Inventory View — Inventory" }],
  }),
  component: DetailedInventoryView,
});

interface InvTab {
  key: string;
  label: string;
  columns: string[];
  rows: string[][];
  filterCols: string[];
  downloadLabel: string;
}

const STORAGE_COLUMNS = [
  "Sku No",
  "Description",
  "Seller",
  "Category Code",
  "Bin No",
  "Box No",
  "Lot No",
  "Pack Size",
  "MRP",
  "Unit Price",
  "Expiry Date",
  "Mfg Date",
  "Shelf Life",
  "Priority",
  "Storage Type",
  "Inventory Type",
  "Storage Subtype",
  "Total Quantity",
  "Available Quantity",
  "Blocked Quantity",
  "Reserved Storage",
  "Address",
  "Ageing",
  "Velocity Class",
  "Remarks",
  "Created By",
  "Created At",
];

const STORAGE_ROWS: string[][] = [
  ["600179", "boAt Airdopes 141 TWS Earbuds", "boAt Lifestyle", "Electronics", "MD-LPN-1017", "—", "—", "10", "1299", "1299", "01/04/2026", "01/04/2021", "-3.6145", "3 (Bulk line)", "SELLABLE", "GOOD", "On-Hand Available", "1250", "1250", "0", "NO", "BULK16-02", "362 days", "A", "—", "Vikas Chauhan", "03/04/2023 00:59"],
  ["600822", "boAt Rockerz 450 Bluetooth Headphones", "Imagine Marketing", "Electronics", "MD-LPN-1017", "—", "—", "1", "1499", "1499", "03/01/2026", "03/01/2021", "-8.4337", "3 (Bulk line)", "SELLABLE", "GOOD", "On-Hand Available", "24", "24", "0", "NO", "BULK16-02", "362 days", "B", "—", "Umesh Yadav", "03/04/2023 00:59"],
  ["600868", "boAt Bassheads 100 Wired Earphones", "boAt Lifestyle", "Electronics", "MD-LPN-1017", "—", "—", "50", "399", "399", "04/01/2026", "04/01/2021", "-8.379", "3 (Bulk line)", "QUARANTINE", "BAD", "Damaged", "1250", "0", "1250", "NO", "BULK16-02", "362 days", "A", "—", "Rizwan", "03/04/2023 00:59"],
  ["600900", "boAt Stone 350 Bluetooth Speaker", "Cloudtail India", "Electronics", "MD-LPN-129", "—", "—", "30", "1999", "1999", "01/08/2023", "01/08/2018", "-56.9551", "1 (Pick line)", "QUARANTINE", "REJECTED", "Quality Hold", "6", "0", "6", "NO", "BULK10-14", "1162 days", "C", "—", "Priyanka Gupta", "03/04/2023 00:51"],
  ["601000", "boAt Wave Call Smartwatch", "Appario Retail", "Electronics", "MD-LPN-129", "—", "—", "1", "1799", "1799", "01/08/2025", "01/08/2020", "-16.9222", "1 (Pick line)", "QUARANTINE", "SUSPENSE", "Near Expiry", "12", "0", "12", "NO", "BULK10-14", "370 days", "B", "—", "Pradeep", "03/04/2023 00:51"],
  ["601002", "boAt Type-C 500 Charging Cable", "RetailEZ", "Electronics", "MD-LPN-129", "—", "—", "30", "499", "499", "01/06/2027", "01/06/2022", "19.7152", "1 (Pick line)", "SELLABLE", "GOOD", "On-Hand Available", "3", "2", "1", "NO", "BULK10-14", "370 days", "A", "—", "Yogesh", "03/04/2023 00:51"],
];

// Picked inventory — columns ordered to mirror the Storage table layout.
const PICKED_COLUMNS = [
  "Sku No",
  "Description",
  "Seller",
  "Category Code",
  "Reference No",
  "Reference Status",
  "Bin No",
  "Lot No",
  "Pack Size",
  "MRP",
  "Expiry Date",
  "Mfg Date",
  "Qc Status",
  "Picked Qty",
  "Address",
  "Remaining Shelf Life Percent",
  "Created By",
  "Created At",
];

const PICKED_ROWS: string[][] = [
  ["8904040000018", "boAt Airdopes 161 TWS Earbuds", "boAt Lifestyle", "Electronics", "ORD-902145", "part-picked", "SLR01-L2", "—", "1", "1499", "01/08/2033", "01/08/2023", "ok", "5", "SLR01-L2", "71.5029", "Rohit Sharma", "04/04/2023 09:12"],
  ["LC1018", "boAt Rockerz 255 Neckband Earphones", "Imagine Marketing", "Electronics", "ORD-902150", "part-picked", "MD-LPN-13", "—", "12", "1199", "01/09/2033", "01/09/2023", "ok", "1", "BULK09-13", "72.3515", "Anjali Verma", "04/04/2023 09:30"],
  ["LC1018", "boAt Rockerz 255 Neckband Earphones", "Imagine Marketing", "Electronics", "ORD-902151", "part-picked", "MD-LPN-13", "—", "12", "1199", "01/09/2033", "01/09/2023", "ok", "2", "BULK09-13", "72.3515", "Anjali Verma", "04/04/2023 09:34"],
  ["OT1771", "boAt Bassheads 152 Wired Earphones", "Cloudtail India", "Electronics", "ORD-902160", "picked", "MD-LPN-86", "—", "40", "499", "05/01/2028", "05/01/2023", "ok", "776", "BULK13-01", "31.5991", "Manoj Kumar", "04/04/2023 10:05"],
  ["OT1771", "boAt Bassheads 152 Wired Earphones", "Cloudtail India", "Electronics", "ORD-902160", "picked", "MD-LPN-1620", "—", "40", "499", "01/11/2027", "01/11/2022", "ok", "776", "SLR38-L3", "28.0394", "Manoj Kumar", "04/04/2023 10:05"],
  ["8904040000025", "boAt Stone 650 Bluetooth Speaker", "Appario Retail", "Electronics", "ORD-902175", "picked", "MD-LPN-269", "—", "90", "2499", "01/03/2028", "01/03/2023", "ok", "1800", "BULK10-02", "34.6470", "Sunita Rao", "04/04/2023 11:20"],
  ["LC2050", "boAt Storm Smartwatch", "boAt Lifestyle", "Electronics", "ORD-902188", "part-packed", "MD-LPN-44", "—", "12", "1999", "01/06/2026", "01/06/2023", "ok", "24", "SLR12-L1", "58.2010", "Rohit Sharma", "04/04/2023 12:02"],
  ["LC3099", "boAt Aavante Bar 1160 Soundbar", "RetailEZ", "Electronics", "ORD-902194", "packed", "MD-LPN-77", "—", "6", "5499", "01/03/2027", "01/03/2024", "ok", "10", "SLR05-L2", "88.4012", "Sunita Rao", "04/04/2023 12:40"],
];

// Receiving inventory — "Item No" standardised to "Sku No", "Mfd Date" to "Mfg Date".
const RECEIVING_COLUMNS = [
  "Sku No",
  "Description",
  "Seller",
  "Category Code",
  "Reference No",
  "GRN No",
  "ASN No",
  "Bin No",
  "Box No",
  "Lot No",
  "Pack Size",
  "MRP",
  "Expiry Date",
  "Mfg Date",
  "Shelf Life",
  "Qc Status",
  "Total Quantity",
  "Created By",
  "Created At",
];

const RECEIVING_ROWS: string[][] = [
  ["600179", "boAt Airdopes 141 TWS Earbuds", "boAt Lifestyle", "Electronics", "GRN184459", "GRN184459", "ASN-552101", "RX-LPN-204", "MOD-26091444", "—", "10", "1299", "01/04/2026", "01/04/2021", "-3.6145", "ok", "1250", "Vikas Chauhan", "03/04/2023 00:59"],
  ["600822", "boAt Rockerz 450 Bluetooth Headphones", "Imagine Marketing", "Electronics", "GRN184460", "GRN184460", "ASN-552101", "RX-LPN-204", "MOD-26091445", "—", "1", "1499", "03/01/2026", "03/01/2021", "-8.4337", "ok", "24", "Umesh Yadav", "03/04/2023 01:10"],
  ["600868", "boAt Bassheads 100 Wired Earphones", "boAt Lifestyle", "Electronics", "GRN184461", "GRN184461", "ASN-552102", "RX-LPN-205", "MOD-26091446", "—", "50", "399", "04/01/2026", "04/01/2021", "-8.379", "reject", "120", "Rizwan", "03/04/2023 01:22"],
  ["600900", "boAt Stone 350 Bluetooth Speaker", "Cloudtail India", "Electronics", "GRN184462", "GRN184462", "ASN-552103", "RX-LPN-206", "MOD-26091447", "—", "30", "1999", "01/08/2025", "01/08/2020", "21.4521", "ok", "60", "Priyanka Gupta", "03/04/2023 02:01"],
  ["601000", "boAt Wave Call Smartwatch", "Appario Retail", "Electronics", "GRN184463", "GRN184463", "ASN-552103", "RX-LPN-206", "MOD-26091448", "LOT1", "1", "1799", "01/08/2027", "01/08/2022", "44.8901", "ok", "48", "HHT3", "03/04/2023 02:15"],
  ["601002", "boAt Type-C 500 Charging Cable", "RetailEZ", "Electronics", "GRN184464", "GRN184464", "ASN-552104", "RX-LPN-207", "MOD-26091449", "—", "30", "499", "01/06/2027", "01/06/2022", "19.7152", "reject", "300", "Pradeep", "03/04/2023 02:40"],
  ["601005", "boAt Aavante Bar 1160 Soundbar", "RetailEZ", "Electronics", "GRN184465", "GRN184465", "ASN-552105", "RX-LPN-208", "MOD-26091450", "—", "6", "5499", "01/03/2027", "01/03/2024", "88.4012", "ok", "36", "Yogesh", "03/04/2023 03:05"],
];

// Cancel inventory — "Mfd Date" standardised to "Mfg Date".
const CANCEL_COLUMNS = [
  "Sku No",
  "Description",
  "Seller",
  "Category Code",
  "Reference No",
  "Bin No",
  "Box No",
  "Lot No",
  "Serial No",
  "Pack Size",
  "MRP",
  "Unit Price",
  "Expiry Date",
  "Mfg Date",
  "Shelf Life",
  "Pack Table",
  "Location Code",
  "Storage Type",
  "Inventory Type",
  "Created By",
  "Created At",
];

const CANCEL_ROWS: string[][] = [
  ["600179", "boAt Airdopes 141 TWS Earbuds", "boAt Lifestyle", "Electronics", "ORD-784512", "CANCEL-LPN", "—", "—", "—", "10", "1299", "1299", "01/04/2026", "01/04/2021", "-3.6145", "Table01", "boAt_Dasna", "CANCEL", "CANCEL", "Vikas Chauhan", "05/05/2023 14:10"],
  ["600822", "boAt Rockerz 450 Bluetooth Headphones", "Imagine Marketing", "Electronics", "ORD-784518", "CANCEL-LPN", "—", "—", "—", "1", "1499", "1499", "03/01/2026", "03/01/2021", "-8.4337", "Table01", "boAt_Dasna", "CANCEL", "CANCEL", "Umesh Yadav", "05/05/2023 14:10"],
  ["600868", "boAt Bassheads 100 Wired Earphones", "boAt Lifestyle", "Electronics", "ORD-790233", "CANCEL-LPN", "—", "—", "—", "50", "399", "399", "04/01/2026", "04/01/2021", "-8.379", "Table08", "boAt_Dasna", "CANCEL", "CANCEL", "Rizwan", "25/09/2023 21:22"],
  ["600900", "boAt Stone 350 Bluetooth Speaker", "Cloudtail India", "Electronics", "ORD-790241", "CANCEL-LPN", "—", "—", "—", "30", "1999", "1999", "01/08/2025", "01/08/2020", "21.4521", "Table08", "boAt_Dasna", "CANCEL", "CANCEL", "Priyanka Gupta", "25/09/2023 21:23"],
  ["601002", "boAt Type-C 500 Charging Cable", "RetailEZ", "Electronics", "ORD-801556", "CANCEL-LPN", "MOD-26091449", "LOT1", "—", "30", "499", "499", "01/06/2027", "01/06/2022", "19.7152", "Table08", "boAt_Dasna", "CANCEL", "CANCEL", "Pradeep", "08/04/2026 11:59"],
  ["601005", "boAt Aavante Bar 1160 Soundbar", "RetailEZ", "Electronics", "ORD-801572", "CANCEL-LPN", "—", "—", "—", "6", "5499", "5499", "01/03/2027", "01/03/2024", "88.4012", "Table08", "boAt_Dasna", "CANCEL", "CANCEL", "Yogesh", "10/04/2026 14:26"],
];

// Missing inventory — "Mfd Date" standardised to "Mfg Date".
const MISSING_COLUMNS = [
  "Sku No",
  "Description",
  "Seller",
  "Category Code",
  "Reference No",
  "Bin No",
  "Box No",
  "Lot No",
  "Serial No",
  "Pack Size",
  "MRP",
  "Expiry Date",
  "Mfg Date",
  "Shelf Life",
  "Priority",
  "Total Quantity",
  "Reserved",
  "Address",
  "Storage Type",
  "Inventory Type",
  "Created By",
  "Created At",
];

const MISSING_ROWS: string[][] = [
  ["600868", "boAt Bassheads 100 Wired Earphones", "boAt Lifestyle", "Electronics", "PL-184459", "MD-LPN-1017", "—", "—", "—", "50", "399", "04/01/2026", "04/01/2021", "-8.379", "3 (Bulk line)", "4", "NO", "BULK16-02", "VIRTUAL", "MISSING", "Sunita Rao", "12/02/2026 10:14"],
  ["600900", "boAt Stone 350 Bluetooth Speaker", "Cloudtail India", "Electronics", "ORD-790241", "MD-LPN-129", "—", "—", "—", "30", "1999", "01/08/2025", "01/08/2020", "21.4521", "1 (Pick line)", "2", "NO", "BULK10-14", "VIRTUAL", "MISSING", "Manoj Kumar", "18/02/2026 09:30"],
  ["601002", "boAt Type-C 500 Charging Cable", "RetailEZ", "Electronics", "PL-184463", "MD-LPN-129", "—", "LOT1", "—", "30", "499", "01/06/2027", "01/06/2022", "19.7152", "1 (Pick line)", "5", "NO", "BULK10-14", "VIRTUAL", "MISSING", "Rohit Sharma", "22/02/2026 16:48"],
  ["601005", "boAt Aavante Bar 1160 Soundbar", "Appario Retail", "Electronics", "ORD-801572", "MD-LPN-77", "—", "—", "—", "6", "5499", "01/03/2027", "01/03/2024", "88.4012", "1 (Pick line)", "1", "NO", "SLR05-L2", "VIRTUAL", "MISSING", "Anjali Verma", "01/03/2026 11:05"],
];

const invTabs: InvTab[] = [
  {
    key: "receiving",
    label: "Receiving",
    downloadLabel: "Download Receiving Inventory",
    filterCols: ["Qc Status", "Shelf Life %", "Created By", "Category Code"],
    columns: RECEIVING_COLUMNS,
    rows: RECEIVING_ROWS,
  },
  {
    key: "storage",
    label: "Storage",
    downloadLabel: "Download Inventory",
    filterCols: [
      "Priority",
      "Shelf Life %",
      "Storage Type",
      "Inventory Type",
      "Storage Subtype",
      "Reserved Storage",
      "Category Code",
    ],
    columns: STORAGE_COLUMNS,
    rows: STORAGE_ROWS,
  },
  {
    key: "outward",
    label: "Outward Processing",
    downloadLabel: "Download Picked Inventory",
    filterCols: ["Qc Status", "Reference Status", "Shelf Life %", "Category Code"],
    columns: PICKED_COLUMNS,
    rows: PICKED_ROWS,
  },
  {
    key: "cancel",
    label: "Cancel",
    downloadLabel: "Download Cancel Inventory",
    filterCols: ["Category Code", "Pack Table", "Shelf Life %", "Location Code"],
    columns: CANCEL_COLUMNS,
    rows: CANCEL_ROWS,
  },
  {
    key: "missing",
    label: "Missing",
    downloadLabel: "Download Missing Inventory",
    filterCols: ["Priority", "Shelf Life %", "Reserved", "Category Code"],
    columns: MISSING_COLUMNS,
    rows: MISSING_ROWS,
  },
];

const SHELF_LIFE_BUCKETS = [
  "Above 75%",
  "50% – 75%",
  "25% – 50%",
  "1% – 25%",
  "Expired (0% or less)",
];

function shelfLifeBucket(raw: string): string {
  const v = parseFloat(raw);
  if (Number.isNaN(v)) return "";
  if (v <= 0) return "Expired (0% or less)";
  if (v <= 25) return "1% – 25%";
  if (v <= 50) return "25% – 50%";
  if (v <= 75) return "50% – 75%";
  return "Above 75%";
}

function DetailedInventoryView() {
  const [activeTab, setActiveTab] = useState("storage");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});

  const tab = invTabs.find((t) => t.key === activeTab) ?? invTabs[0];
  const building = tab.columns.length === 0;

  const optionsFor = (col: string) => {
    const idx = tab.columns.indexOf(col);
    if (idx < 0) return [] as string[];
    return Array.from(new Set(tab.rows.map((r) => r[idx]))).sort();
  };

  const activeFilters = Object.entries(filters).filter(
    ([, v]) => v && v !== "all",
  );

  const q = search.trim().toLowerCase();
  const filteredRows = tab.rows.filter((row) => {
    const matchesSearch =
      q === "" || row.some((cell) => cell.toLowerCase().includes(q));
    const matchesFilters = activeFilters.every(([col, val]) => {
      if (col === "Shelf Life %") {
        const idx = tab.columns.findIndex((c) => c.includes("Shelf Life"));
        return idx >= 0 && shelfLifeBucket(row[idx]) === val;
      }
      const idx = tab.columns.indexOf(col);
      return idx >= 0 && row[idx] === val;
    });
    return matchesSearch && matchesFilters;
  });

  const downloadCsv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [
      tab.columns.map(esc).join(","),
      ...filteredRows.map((row) => row.map(esc).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-${tab.key}.csv`;
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

  const changeTab = (key: string) => {
    setActiveTab(key);
    clearAll();
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
              Detailed Inventory View
            </div>
            <div className="iv-topbar-sub">
              Stage-wise inventory across the warehouse
            </div>
          </div>
          <div className="iv-actions">
            <div className="iv-search">
              <Search className="iv-ico-sm iv-search-ico" aria-hidden="true" />
              <input
                placeholder="Search SKU / Bin / Order"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {!building && (search !== "" || activeFilters.length > 0) && (
              <button className="iv-btn" onClick={clearAll}>
                Clear
              </button>
            )}
            {!building && (
              <button className="iv-btn iv-btn-primary" onClick={downloadCsv}>
                <Download className="iv-ico-sm" aria-hidden="true" />
                {tab.downloadLabel}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="iv-tabs">
          {invTabs.map((t) => (
            <button
              key={t.key}
              className={`iv-tab${t.key === activeTab ? " active" : ""}`}
              onClick={() => changeTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        {!building && tab.filterCols.length > 0 && (
        <div className="iv-filters">
          <span className="iv-filters-label">
            <Filter className="iv-ico-sm" aria-hidden="true" />
            Filters
          </span>
          {tab.filterCols.map((col) => {
            const opts =
              col === "Shelf Life %" ? SHELF_LIFE_BUCKETS : optionsFor(col);
            return (
              <div key={col} className="iv-filter">
                <select
                  value={filters[col] ?? "all"}
                  onChange={(e) => setFilter(col, e.target.value)}
                  className={
                    filters[col] && filters[col] !== "all" ? "iv-on" : ""
                  }
                >
                  <option value="all">{col}: All</option>
                  {opts.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
        )}

        {building ? (
          /* Being-built placeholder */
          <div className="iv-building">
            <Boxes className="iv-building-ico" aria-hidden="true" />
            <div className="iv-building-title">{tab.label} view is being built</div>
            <div className="iv-building-sub">
              This inventory stage will be available here soon.
            </div>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="iv-table-wrap">
              <table>
                <thead>
                  <tr>
                    {tab.columns.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} className={ci === 0 ? "iv-td-strong" : ""}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td className="iv-empty" colSpan={tab.columns.length}>
                        No matching records
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="iv-foot">
              Showing {filteredRows.length} of {tab.rows.length} records ·{" "}
              {tab.label}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Scoped styles — prefixed with `.iv-screen` so generic selectors never leak.
const css = `
.iv-screen{--c-bg:#ffffff;--c-bg2:#f5f7fb;--c-border:#e3e7ef;--c-border2:#d4dae6;--c-t1:#172554;--c-t2:#475569;--c-t3:#94a3b8;--c-info-t:#1e40af;--c-info-b:#bcd0f5;--c-info-bg:#eaf0fb;
  background:var(--c-bg);border:0.5px solid var(--c-border);border-radius:12px;overflow:hidden;font-family:inherit;width:100%;max-width:100%;box-sizing:border-box}
.iv-screen .iv-ico{width:16px;height:16px;vertical-align:-3px;margin-right:7px;display:inline-block}
.iv-screen .iv-ico-sm{width:14px;height:14px;flex:none}
.iv-topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 18px;border-bottom:0.5px solid var(--c-border);flex-wrap:wrap}
.iv-topbar-title{font-size:15px;font-weight:700;color:var(--c-t1);display:flex;align-items:center}
.iv-topbar-sub{font-size:12px;color:var(--c-t3);margin-top:2px}
.iv-actions{display:flex;gap:8px;align-items:center}
.iv-search{position:relative}
.iv-search-ico{position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--c-t3)}
.iv-search input{width:220px;box-sizing:border-box;font-size:12px;padding:8px 10px 8px 28px;border:0.5px solid var(--c-border);border-radius:8px;background:var(--c-bg2);color:var(--c-t2)}
.iv-screen .iv-btn{font-size:12px;padding:7px 13px;border:0.5px solid var(--c-border2);border-radius:8px;background:var(--c-bg2);color:var(--c-t2);cursor:pointer;display:inline-flex;align-items:center;gap:6px;line-height:1}
.iv-screen .iv-btn-primary{background:#1e40af;border-color:#1e40af;color:#fff;font-weight:600}
.iv-filters{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:11px 18px;border-bottom:0.5px solid var(--c-border);background:var(--c-bg2)}
.iv-filters-label{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--c-t3);text-transform:uppercase;letter-spacing:0.06em}
.iv-filter{position:relative;display:inline-flex;align-items:center}
.iv-screen .iv-filter select{appearance:none;font-size:12px;padding:7px 26px 7px 11px;border:0.5px solid var(--c-border2);border-radius:8px;background:var(--c-bg);color:var(--c-t2);cursor:pointer;line-height:1;max-width:180px}
.iv-screen .iv-filter select.iv-on{border-color:var(--c-info-b);color:var(--c-info-t);background:var(--c-info-bg);font-weight:600}
.iv-tabs{display:flex;gap:4px;flex-wrap:wrap;padding:0 18px;border-bottom:0.5px solid var(--c-border)}
.iv-screen .iv-tab{font-size:13px;font-weight:600;padding:11px 14px;border:0;background:transparent;color:var(--c-t2);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}
.iv-screen .iv-tab.active{color:var(--c-info-t);border-bottom-color:#1e40af}
.iv-table-wrap{margin:16px 18px 0;overflow:auto;max-height:calc(100vh - 280px);border:0.5px solid var(--c-border);border-radius:9px}
.iv-screen table{width:100%;border-collapse:collapse;font-size:12px;white-space:nowrap}
.iv-screen th{position:sticky;top:0;z-index:1;background:var(--c-bg2);text-align:left;font-weight:600;font-size:11px;color:var(--c-t3);padding:8px 11px;border-bottom:0.5px solid var(--c-border)}
.iv-screen td{padding:8px 11px;border-bottom:0.5px solid var(--c-border);color:var(--c-t1)}
.iv-screen tr:last-child td{border-bottom:none}
.iv-td-strong{font-weight:700}
.iv-empty{text-align:center;color:var(--c-t3);padding:28px 11px}
.iv-foot{padding:12px 18px;font-size:11px;color:var(--c-t3)}
.iv-building{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6px;padding:64px 18px}
.iv-building-ico{width:34px;height:34px;color:var(--c-t3);margin-bottom:4px}
.iv-building-title{font-size:15px;font-weight:700;color:var(--c-t1)}
.iv-building-sub{font-size:12px;color:var(--c-t3)}
`;
