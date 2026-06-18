import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { createPortal } from "react-dom";
import {
  Anchor,
  ChevronDown,
  Filter,
  Plus,
  Warehouse,
  X,
} from "lucide-react";

export const Route = createFileRoute("/_wms/dock-management")({
  head: () => ({
    meta: [{ title: "Dock Management — Masters" }],
  }),
  component: DockManagement,
});

type DockStatus = "empty" | "occupied" | "blocked" | "reserved";

interface DockRow {
  bay: string;
  type: "Inbound" | "Outbound" | "Cross-dock" | "Shared";
  location: string;
  capacity: string;
  carrier: string;
  scheduled: string;
  reference: string;
  status: DockStatus;
  startTime: string;
  seal: string;
  expected: string;
  actual: string;
  operator: string;
}

const statusLabel: Record<DockStatus, string> = {
  empty: "Empty",
  occupied: "Occupied",
  blocked: "Blocked — Maint.",
  reserved: "Reserved",
};

const rows: DockRow[] = [
  {
    bay: "DOCK-IN-01",
    type: "Inbound",
    location: "Zone A · Aisle 1",
    capacity: "FCL · Tailgate",
    carrier: "BlueDart Surface",
    scheduled: "06 Jun · 09:30",
    reference: "ASN-7741",
    status: "occupied",
    startTime: "09:34 AM",
    seal: "SL-882190",
    expected: "240",
    actual: "182",
    operator: "TEAM-A · OP-114",
  },
  {
    bay: "DOCK-IN-02",
    type: "Inbound",
    location: "Zone A · Aisle 2",
    capacity: "LTL · Side-load",
    carrier: "Delhivery",
    scheduled: "06 Jun · 10:15",
    reference: "PO-55218",
    status: "reserved",
    startTime: "—",
    seal: "—",
    expected: "96",
    actual: "—",
    operator: "TEAM-B",
  },
  {
    bay: "DOCK-OUT-05",
    type: "Outbound",
    location: "Zone C · Aisle 9",
    capacity: "FCL · Tailgate",
    carrier: "Ecom Express",
    scheduled: "06 Jun · 11:00",
    reference: "MAN-3098",
    status: "occupied",
    startTime: "11:02 AM",
    seal: "SL-882204",
    expected: "310",
    actual: "295",
    operator: "TEAM-C · OP-207",
  },
  {
    bay: "DOCK-XD-03",
    type: "Cross-dock",
    location: "Zone B · Aisle 5",
    capacity: "LTL · Side-load",
    carrier: "Amazon Logistics",
    scheduled: "06 Jun · 12:30",
    reference: "ASN-7755",
    status: "empty",
    startTime: "—",
    seal: "—",
    expected: "—",
    actual: "—",
    operator: "—",
  },
  {
    bay: "DOCK-SH-08",
    type: "Shared",
    location: "Zone D · Aisle 12",
    capacity: "FCL · LTL",
    carrier: "—",
    scheduled: "—",
    reference: "—",
    status: "blocked",
    startTime: "—",
    seal: "—",
    expected: "—",
    actual: "—",
    operator: "Maintenance",
  },
];

function DockManagement() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="bg-muted/40 p-4">
      <style>{css}</style>
      <div className="dk-screen">
        {/* Top bar */}
        <div className="dk-topbar">
          <div>
            <div className="dk-topbar-title">
              <Anchor className="dk-ico" aria-hidden="true" />
              Dock Management
            </div>
            <div className="dk-topbar-sub">
              Receiving &amp; shipping docks · Yard · North-A1 Warehouse
            </div>
          </div>
          <div className="dk-actions">
            <button className="dk-btn">
              <Filter className="dk-ico-sm" aria-hidden="true" />
              Filter
            </button>
            <button
              className="dk-btn dk-btn-primary"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="dk-ico-sm" aria-hidden="true" />
              Create New
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="dk-filters">
          <span className="dk-filter-label">Status</span>
          <span className="dk-chip active">All</span>
          <span className="dk-chip">Empty</span>
          <span className="dk-chip">Occupied</span>
          <span className="dk-chip">Reserved</span>
          <span className="dk-chip">Blocked</span>
          <span className="dk-filters-right">
            <span className="dk-filter-label">Type</span>
            <span className="dk-chip active">All</span>
            <span className="dk-chip">Inbound</span>
            <span className="dk-chip">Outbound</span>
            <span className="dk-chip">Cross-dock</span>
          </span>
        </div>

        {/* Metrics */}
        <div className="dk-metrics">
          <div className="dk-metric">
            <div className="dk-metric-label">Total docks</div>
            <div className="dk-metric-val">18</div>
          </div>
          <div className="dk-metric">
            <div className="dk-metric-label">Occupied</div>
            <div className="dk-metric-val amber">7</div>
          </div>
          <div className="dk-metric">
            <div className="dk-metric-label">Reserved</div>
            <div className="dk-metric-val info">4</div>
          </div>
          <div className="dk-metric">
            <div className="dk-metric-label">Empty / available</div>
            <div className="dk-metric-val green">6</div>
          </div>
          <div className="dk-metric">
            <div className="dk-metric-label">Blocked — maint.</div>
            <div className="dk-metric-val red">1</div>
          </div>
        </div>

        {/* Table */}
        <div className="dk-section-label">Dock register</div>
        <div className="dk-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Dock / Bay</th>
                <th>Status</th>
                <th>Type</th>
                <th>Location (Aisle / Zone)</th>
                <th>Carrier / Supplier</th>
                <th>Scheduled Arrival</th>
                <th>Start Time</th>
                <th className="dk-num">Expected</th>
                <th className="dk-num">Actual</th>
                <th>Assigned Team / Operator</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.bay}>
                  <td className="dk-td-strong">{r.bay}</td>
                  <td>
                    <span className={`dk-badge badge-${r.status}`}>
                      {statusLabel[r.status]}
                    </span>
                  </td>
                  <td>
                    <span className="dk-type">{r.type}</span>
                  </td>
                  <td>{r.location}</td>
                  <td>{r.carrier}</td>
                  <td>{r.scheduled}</td>
                  <td>{r.startTime}</td>
                  <td className="dk-num">{r.expected}</td>
                  <td className="dk-num">{r.actual}</td>
                  <td>{r.operator}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="dk-legend">
          <span><span className="dk-dot dot-empty" />Empty</span>
          <span><span className="dk-dot dot-occupied" />Occupied</span>
          <span><span className="dk-dot dot-reserved" />Reserved</span>
          <span><span className="dk-dot dot-blocked" />Blocked — maintenance</span>
        </div>
      </div>

      {/* Dock creation modal */}
      {createOpen &&
        createPortal(
        <div className="dk-overlay" onClick={() => setCreateOpen(false)}>
          <style>{css}</style>
          <div className="dk-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dk-topbar">
              <div>
                <div className="dk-topbar-title">
                  <Warehouse className="dk-ico" aria-hidden="true" />
                  Create Dock
                </div>
                <div className="dk-topbar-sub">
                  Register a new dock door or loading bay
                </div>
              </div>
              <button
                className="dk-close"
                onClick={() => setCreateOpen(false)}
                aria-label="Close"
              >
                <X className="dk-ico-sm" aria-hidden="true" />
              </button>
            </div>

            <div className="dk-form">
          {/* Infrastructure & Role */}
          <div className="dk-fieldset-label">Infrastructure &amp; Role</div>
          <div className="dk-grid">
            <Field label="Dock / Bay Number" required placeholder="e.g. DOCK-IN-09" />
            <SelectField label="Dock Type" required placeholder="Select type" />
            <Field
              label="Location Coordinates"
              placeholder="e.g. Zone A · Aisle 1"
            />
            <SelectField
              label="Handling Capacity"
              placeholder="e.g. FCL, LTL, Side-load, Tailgate"
            />
          </div>
        </div>

            <div className="dk-form-foot">
              <button
                className="dk-btn dk-btn-ghost"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </button>
              <button
                className="dk-btn dk-btn-primary"
                onClick={() => setCreateOpen(false)}
              >
                <Plus className="dk-ico-sm" aria-hidden="true" />
                Create Dock
              </button>
            </div>
          </div>
        </div>,
          document.body,
        )}
    </div>
  );
}

function Field({
  label,
  required,
  placeholder,
}: {
  label: string;
  required?: boolean;
  placeholder: string;
}) {
  return (
    <div className="dk-field">
      <label>
        {label}
        {required && <span className="dk-req">*</span>}
      </label>
      <div className="dk-input dk-placeholder">{placeholder}</div>
    </div>
  );
}

function SelectField({
  label,
  required,
  placeholder,
}: {
  label: string;
  required?: boolean;
  placeholder: string;
}) {
  return (
    <div className="dk-field">
      <label>
        {label}
        {required && <span className="dk-req">*</span>}
      </label>
      <div className="dk-input dk-placeholder">
        {placeholder}
        <ChevronDown className="dk-ico-sm" aria-hidden="true" />
      </div>
    </div>
  );
}

// Scoped styles — prefixed with `.dk-screen` so generic selectors never leak.
const css = `
.dk-screen{--c-bg:#ffffff;--c-bg2:#f5f3ee;--c-border:#e2dfd5;--c-border2:#d0ccbf;--c-t1:#1a1a1a;--c-t2:#555555;--c-t3:#8a8a85;--c-info-t:#2d5aa8;--c-info-b:#bcd0f5;--c-info-bg:#e6eef9;--c-green:#2e7a4e;--c-amber:#a86b1a;--c-red:#b5321f;--c-mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
  background:var(--c-bg);border:1px solid var(--c-border);border-radius:4px;overflow:hidden;font-family:inherit;width:100%}
.dk-overlay{--c-bg:#ffffff;--c-bg2:#f5f3ee;--c-border:#e2dfd5;--c-border2:#d0ccbf;--c-t1:#1a1a1a;--c-t2:#555555;--c-t3:#8a8a85;--c-info-t:#2d5aa8;--c-mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
  position:fixed;inset:0;background:rgba(31,29,23,0.45);display:flex;align-items:flex-start;justify-content:center;padding:32px 16px;z-index:100;overflow-y:auto}
.dk-modal{background:var(--c-bg);border:1px solid var(--c-border);border-radius:4px;width:100%;max-width:820px;box-shadow:0 20px 50px rgba(31,29,23,0.25);overflow:hidden}
.dk-close{background:transparent;border:0;color:var(--c-t3);cursor:pointer;padding:4px;border-radius:3px;display:inline-flex;align-items:center}
.dk-close:hover{background:var(--c-bg2);color:var(--c-t1)}
.dk-screen .dk-ico,.dk-modal .dk-ico{width:16px;height:16px;vertical-align:-3px;margin-right:7px;display:inline-block}
.dk-screen .dk-ico-sm,.dk-modal .dk-ico-sm{width:14px;height:14px;flex:none}
.dk-hidden{visibility:hidden}
.dk-topbar{display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid var(--c-border)}
.dk-topbar-title{font-size:15px;font-weight:600;color:var(--c-t1);display:flex;align-items:center}
.dk-topbar-sub{font-size:12px;color:var(--c-t3);margin-top:2px}
.dk-actions{display:flex;gap:8px}
.dk-screen .dk-btn,.dk-modal .dk-btn{font-size:12px;padding:7px 13px;border:1px solid var(--c-border2);border-radius:4px;background:transparent;color:var(--c-t2);cursor:pointer;display:inline-flex;align-items:center;gap:6px;line-height:1}
.dk-screen .dk-btn-ghost,.dk-modal .dk-btn-ghost{background:var(--c-bg2)}
.dk-screen .dk-btn-primary,.dk-modal .dk-btn-primary{background:#1f1d17;border-color:#1f1d17;color:#fff;font-weight:600}
.dk-filters{display:flex;gap:8px;padding:10px 18px;border-bottom:1px solid var(--c-border);flex-wrap:wrap;align-items:center}
.dk-filter-label{font-family:var(--c-mono);font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:var(--c-t3);margin-right:4px}
.dk-filters-right{margin-left:auto;display:flex;gap:8px;align-items:center}
.dk-chip{font-size:11px;padding:4px 11px;border:1px solid var(--c-border);border-radius:4px;color:var(--c-t2);background:var(--c-bg2)}
.dk-chip.active{border-color:var(--c-info-b);color:var(--c-info-t);background:var(--c-info-bg)}
.dk-metrics{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;border-bottom:1px solid var(--c-border);background:var(--c-border)}
.dk-metric{padding:12px 18px;background:var(--c-bg2)}
.dk-metric-label{font-family:var(--c-mono);font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:var(--c-t3);margin-bottom:4px}
.dk-metric-val{font-size:20px;font-weight:700;color:var(--c-t1)}
.dk-metric-val.green{color:var(--c-green)}
.dk-metric-val.amber{color:var(--c-amber)}
.dk-metric-val.red{color:var(--c-red)}
.dk-metric-val.info{color:var(--c-info-t)}
.dk-section-label{font-family:var(--c-mono);font-size:10.5px;font-weight:500;color:var(--c-t3);padding:12px 18px 8px;letter-spacing:0.08em;text-transform:uppercase}
.dk-table-wrap{margin:0 18px 16px;overflow:auto;max-height:calc(100vh - 320px);border:1px solid var(--c-border);border-radius:4px}
.dk-screen table{width:100%;border-collapse:collapse;font-size:12px;white-space:nowrap}
.dk-screen th{position:sticky;top:0;z-index:1;background:var(--c-bg2);text-align:left;font-family:var(--c-mono);font-weight:500;font-size:10.5px;text-transform:uppercase;letter-spacing:0.06em;color:var(--c-t3);padding:7px 10px;border-bottom:1px solid var(--c-border)}
.dk-screen td{padding:9px 10px;border-bottom:1px solid var(--c-border);color:var(--c-t1);vertical-align:middle}
.dk-screen tr:last-child td{border-bottom:none}
.dk-screen th.dk-num,.dk-screen td.dk-num{text-align:right}
.dk-td-strong{font-weight:700}
.dk-mono{font-family:var(--c-mono);font-size:11px;color:var(--c-t2)}
.dk-type{display:inline-block;font-family:var(--c-mono);font-size:9.5px;font-weight:500;text-transform:uppercase;letter-spacing:0.06em;padding:2px 8px;border-radius:2px;background:var(--c-info-bg);color:var(--c-info-t);border:1px solid var(--c-info-b)}
.dk-badge{display:inline-block;font-family:var(--c-mono);font-size:9.5px;padding:2px 8px;border-radius:2px;font-weight:500;text-transform:uppercase;letter-spacing:0.06em;border:1px solid transparent}
.badge-empty{background:#dff0e4;color:#2e7a4e;border-color:rgba(46,122,78,0.3)}
.badge-occupied{background:#fbeeda;color:#a86b1a;border-color:rgba(168,107,26,0.3)}
.badge-reserved{background:var(--c-info-bg);color:var(--c-info-t);border-color:var(--c-info-b)}
.badge-blocked{background:#fae5e0;color:#b5321f;border-color:rgba(181,50,31,0.3)}
.dk-dot{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:5px}
.dot-empty{background:#2e7a4e}
.dot-occupied{background:#a86b1a}
.dot-reserved{background:#2d5aa8}
.dot-blocked{background:#b5321f}
.dk-legend{padding:8px 18px 14px;display:flex;gap:18px;font-size:11px;color:var(--c-t3);flex-wrap:wrap}
.dk-legend span{display:inline-flex;align-items:center}
.dk-form{padding:18px 22px}
.dk-fieldset-label{font-family:var(--c-mono);font-size:10.5px;font-weight:500;color:var(--c-info-t);letter-spacing:0.08em;text-transform:uppercase;margin:18px 0 12px}
.dk-fieldset-label:first-child{margin-top:0}
.dk-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px 20px}
.dk-field{display:flex;flex-direction:column;gap:7px;min-width:0}
.dk-field label{font-family:var(--c-mono);font-size:10.5px;font-weight:500;text-transform:uppercase;letter-spacing:0.06em;color:var(--c-t3)}
.dk-req{color:#b5321f;margin-left:3px}
.dk-input{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:13px;color:var(--c-t1);padding:10px 13px;border:1px solid var(--c-border2);border-radius:4px;background:var(--c-bg);min-height:20px}
.dk-input .dk-ico-sm{color:var(--c-t3)}
.dk-placeholder{color:var(--c-t3)}
.dk-form-foot{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:16px 22px;border-top:0.5px solid var(--c-border)}
`;
