import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  Info,
  Search,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/_wms/reports")({
  head: () => ({
    meta: [{ title: "Report Explorer — Reports" }],
  }),
  component: Reports,
});

const folders: { label: string; open?: boolean }[] = [
  { label: "Billing" },
  { label: "Audit" },
  { label: "Listing" },
  { label: "System" },
  { label: "Storage" },
];

function Reports() {
  return (
    <div className="bg-muted/40 p-4">
      <style>{css}</style>
      <div className="rx-screen">
        {/* Header */}
        <div className="rx-header">
          <div className="rx-header-title">Report Explorer</div>
          <span className="rx-header-div" />
          <button className="rx-btn rx-btn-ghost">
            <FileText className="rx-ico-sm" aria-hidden="true" />
            Request Status
          </button>
        </div>

        <div className="rx-body">
          {/* Left tree */}
          <div className="rx-tree">
            <div className="rx-search">
              <Search className="rx-ico-sm rx-search-ico" aria-hidden="true" />
              <input placeholder="Search Reports" disabled />
            </div>

            <div className="rx-tree-list">
              <div className="rx-node rx-node-root">
                <ChevronDown className="rx-ico-sm" aria-hidden="true" />
                <Folder className="rx-ico-sm" aria-hidden="true" />
                Standard Reports
              </div>

              <div className="rx-node rx-lvl1">
                <ChevronDown className="rx-ico-sm" aria-hidden="true" />
                <Folder className="rx-ico-sm" aria-hidden="true" />
                Inbound
              </div>

              <div className="rx-node rx-lvl2 active">
                <FileText className="rx-ico-sm" aria-hidden="true" />
                Purchase Order Report
              </div>
              <div className="rx-node rx-lvl2">
                <FileText className="rx-ico-sm" aria-hidden="true" />
                ASN Report
              </div>

              {folders.map((f) => (
                <div key={f.label} className="rx-node rx-lvl1">
                  <ChevronRight className="rx-ico-sm" aria-hidden="true" />
                  <Folder className="rx-ico-sm" aria-hidden="true" />
                  {f.label}
                </div>
              ))}

              <div className="rx-node rx-node-root">
                <ChevronRight className="rx-ico-sm" aria-hidden="true" />
                <Folder className="rx-ico-sm" aria-hidden="true" />
                Custom Reports
              </div>
            </div>
          </div>

          {/* Main */}
          <div className="rx-main">
            <div className="rx-card">
              <div className="rx-card-head">
                <div className="rx-card-icon">
                  <FileText className="rx-ico" aria-hidden="true" />
                </div>
                <div>
                  <div className="rx-card-title">Purchase Order Report</div>
                  <div className="rx-card-sub">
                    Analyze warehouse audit trails and box packing efficiency
                  </div>
                </div>
              </div>

              <div className="rx-form">
                <div className="rx-field">
                  <label>
                    Fulfillment Locations <span className="rx-req">*</span>
                  </label>
                  <div className="rx-select">
                    North-A1 Warehouse, South-B2 Depot
                    <ChevronDown className="rx-ico-sm" aria-hidden="true" />
                  </div>
                </div>
                <div className="rx-field">
                  <label>Status</label>
                  <div className="rx-select rx-placeholder">
                    Select Status
                    <ChevronDown className="rx-ico-sm" aria-hidden="true" />
                  </div>
                </div>
                <div className="rx-field">
                  <label>From Date</label>
                  <div className="rx-input rx-placeholder">
                    yyyy-mm-dd --:--:--
                    <Calendar className="rx-ico-sm" aria-hidden="true" />
                  </div>
                </div>
                <div className="rx-field">
                  <label>To Date</label>
                  <div className="rx-input rx-placeholder">
                    yyyy-mm-dd --:--:--
                    <Calendar className="rx-ico-sm" aria-hidden="true" />
                  </div>
                </div>
                <div className="rx-field rx-field-full">
                  <label>Object ID</label>
                  <div className="rx-input rx-placeholder">
                    Enter comma separated IDs (e.g. BIN-001, BOX-992)
                  </div>
                </div>
              </div>

              <div className="rx-info">
                <Info className="rx-ico-sm" aria-hidden="true" />
                <span>
                  Report generation might take up to 2 minutes for high-volume
                  data sets spanning more than 30 days. You will be notified via
                  the <span className="rx-link">Request Status</span> dashboard.
                </span>
              </div>

              <div className="rx-card-foot">
                <button className="rx-btn rx-btn-ghost">Reset Filters</button>
                <button className="rx-btn rx-btn-primary">
                  <BarChart3 className="rx-ico-sm" aria-hidden="true" />
                  Generate Report
                </button>
              </div>
            </div>

            <div className="rx-bottom">
              <div className="rx-quick">
                <div className="rx-quick-label">Quick Filters</div>
                <div className="rx-quick-chip">Last 24 Hours</div>
                <div className="rx-quick-chip">North Region Only</div>
                <div className="rx-quick-chip">Critical Audit Trail</div>
              </div>
              <div className="rx-analytics">
                <div className="rx-analytics-body">
                  <div className="rx-analytics-title">Analytics Preview</div>
                  <div className="rx-analytics-sub">
                    Check historical performance trends for this specific report
                    type before generating.
                  </div>
                  <div className="rx-link rx-analytics-link">
                    View Trends
                    <TrendingUp className="rx-ico-sm" aria-hidden="true" />
                  </div>
                </div>
                <div className="rx-analytics-badge">
                  <BarChart3 className="rx-ico" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Scoped styles — prefixed with `.rx-screen` so generic selectors never leak.
const css = `
.rx-screen{--c-bg:#ffffff;--c-bg2:#f5f7fb;--c-border:#e3e7ef;--c-border2:#d4dae6;--c-t1:#172554;--c-t2:#475569;--c-t3:#94a3b8;--c-info-t:#1e40af;--c-info-b:#bcd0f5;--c-info-bg:#eaf0fb;
  background:var(--c-bg);border:0.5px solid var(--c-border);border-radius:12px;overflow:hidden;font-family:inherit;max-width:1280px;margin:0 auto}
.rx-screen .rx-ico{width:18px;height:18px}
.rx-screen .rx-ico-sm{width:14px;height:14px;flex:none}
.rx-header{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:0.5px solid var(--c-border)}
.rx-header-title{font-size:15px;font-weight:700;color:var(--c-t1)}
.rx-header-div{width:1px;height:18px;background:var(--c-border2)}
.rx-screen .rx-btn{font-size:12px;padding:6px 12px;border:0.5px solid var(--c-border2);border-radius:8px;background:transparent;color:var(--c-t2);cursor:pointer;display:inline-flex;align-items:center;gap:6px;line-height:1}
.rx-screen .rx-btn-ghost{background:var(--c-bg2)}
.rx-screen .rx-btn-primary{background:#1e40af;border-color:#1e40af;color:#fff;padding:9px 18px;font-weight:600}
.rx-body{display:flex;align-items:stretch}
.rx-tree{width:240px;flex:none;border-right:0.5px solid var(--c-border);padding:14px 12px;background:var(--c-bg)}
.rx-search{position:relative;margin-bottom:14px}
.rx-search-ico{position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--c-t3)}
.rx-search input{width:100%;box-sizing:border-box;font-size:12px;padding:8px 10px 8px 28px;border:0.5px solid var(--c-border);border-radius:8px;background:var(--c-bg2);color:var(--c-t2)}
.rx-tree-list{display:flex;flex-direction:column;gap:2px}
.rx-node{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--c-t2);padding:6px 8px;border-radius:7px;cursor:pointer}
.rx-node-root{font-weight:700;color:var(--c-t1)}
.rx-lvl1{padding-left:18px}
.rx-lvl2{padding-left:40px}
.rx-node.active{background:var(--c-info-bg);color:var(--c-info-t);font-weight:600;box-shadow:inset 2px 0 0 #1e40af}
.rx-main{flex:1;padding:18px;background:var(--c-bg2);display:flex;flex-direction:column;gap:18px;min-width:0}
.rx-card{background:var(--c-bg);border:0.5px solid var(--c-border);border-radius:12px;padding:22px 26px}
.rx-card-head{display:flex;gap:12px;align-items:flex-start;margin-bottom:22px}
.rx-card-icon{width:40px;height:40px;flex:none;border-radius:10px;background:var(--c-info-bg);color:var(--c-info-t);display:flex;align-items:center;justify-content:center}
.rx-card-title{font-size:18px;font-weight:700;color:var(--c-t1)}
.rx-card-sub{font-size:12px;color:var(--c-t3);margin-top:2px}
.rx-form{display:grid;grid-template-columns:1fr 1fr;gap:16px 22px}
.rx-field{display:flex;flex-direction:column;gap:7px;min-width:0}
.rx-field-full{grid-column:1 / -1}
.rx-field label{font-size:12px;font-weight:600;color:var(--c-t2)}
.rx-req{color:#dc2626}
.rx-select,.rx-input{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:13px;color:var(--c-t1);padding:11px 13px;border:0.5px solid var(--c-border2);border-radius:9px;background:var(--c-bg)}
.rx-select .rx-ico-sm,.rx-input .rx-ico-sm{color:var(--c-t3)}
.rx-placeholder{color:var(--c-t3)}
.rx-info{display:flex;gap:9px;align-items:flex-start;margin-top:20px;padding:13px 15px;border:0.5px solid var(--c-info-b);border-radius:9px;background:var(--c-info-bg);font-size:12px;color:var(--c-t2);line-height:1.5}
.rx-info .rx-ico-sm{color:var(--c-info-t);margin-top:1px}
.rx-link{color:var(--c-info-t);font-weight:600;cursor:pointer}
.rx-card-foot{display:flex;align-items:center;justify-content:space-between;margin-top:22px;padding-top:18px;border-top:0.5px solid var(--c-border)}
.rx-bottom{display:grid;grid-template-columns:300px 1fr;gap:18px}
.rx-quick,.rx-analytics{background:var(--c-bg);border:0.5px solid var(--c-border);border-radius:12px;padding:16px 18px}
.rx-quick-label{font-size:11px;font-weight:600;color:var(--c-t3);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:12px}
.rx-quick-chip{font-size:12px;color:var(--c-t1);padding:9px 12px;border:0.5px solid var(--c-border);border-radius:8px;background:var(--c-bg2);margin-bottom:8px}
.rx-analytics{display:flex;align-items:center;justify-content:space-between;gap:16px}
.rx-analytics-title{font-size:16px;font-weight:700;color:var(--c-t1)}
.rx-analytics-sub{font-size:12px;color:var(--c-t2);margin-top:6px;max-width:340px;line-height:1.5}
.rx-analytics-link{display:inline-flex;align-items:center;gap:5px;margin-top:12px;font-size:13px}
.rx-analytics-badge{width:84px;height:84px;flex:none;border-radius:50%;background:var(--c-info-bg);color:#93a8d4;display:flex;align-items:center;justify-content:center}
.rx-analytics-badge .rx-ico{width:34px;height:34px}
`;
