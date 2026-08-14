import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Plus, Table2, X } from "lucide-react";

export const Route = createFileRoute("/_wms/table-id-master")({
  head: () => ({
    meta: [{ title: "Table ID Master — Masters" }],
  }),
  component: TableIdMaster,
});

// ─── Types & seed data ──────────────────────────────────────────────────────

type TableType = "QC" | "Packing";
type TableStatus = "active" | "inactive";

interface TableRow {
  id: string;
  type: TableType;
  zoneId: string;
  status: TableStatus;
  mappedUser: string;
  lastActive: string;
}

// Names assigned to freshly created active tables (demo only).
const NAME_POOL = ["Ravi Sharma", "Neha Gupta", "Amit Singh", "Kiran Rao"];

const INITIAL_TABLES: TableRow[] = [
  {
    id: "TBL-QC-01",
    type: "QC",
    zoneId: "Staging Area · A1",
    status: "active",
    mappedUser: "Sita Devi",
    lastActive: "01/07/2026 09:12",
  },
  {
    id: "TBL-QC-02",
    type: "QC",
    zoneId: "Staging Area · A2",
    status: "active",
    mappedUser: "Pooja Sharma",
    lastActive: "30/06/2026 18:40",
  },
  {
    id: "TBL-PK-01",
    type: "Packing",
    zoneId: "Merge Area · M1",
    status: "active",
    mappedUser: "Ramesh Kumar",
    lastActive: "01/07/2026 09:05",
  },
  {
    id: "TBL-PK-02",
    type: "Packing",
    zoneId: "Merge Area · M2",
    status: "active",
    mappedUser: "Arjun Mehta",
    lastActive: "30/06/2026 17:22",
  },
  {
    id: "TBL-PK-03",
    type: "Packing",
    zoneId: "Merge Area · M3",
    status: "inactive",
    mappedUser: "",
    lastActive: "28/06/2026 14:10",
  },
];

const TYPE_FILTERS: Array<"All" | TableType> = ["All", "QC", "Packing"];
const STATUS_FILTERS: Array<"All" | TableStatus> = ["All", "active", "inactive"];

// ─── Screen ───────────────────────────────────────────────────────────────

function TableIdMaster() {
  const [tables, setTables] = useState<TableRow[]>(INITIAL_TABLES);
  const [typeFilter, setTypeFilter] = useState<"All" | TableType>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | TableStatus>("All");
  const [createOpen, setCreateOpen] = useState(false);

  const visible = useMemo(
    () =>
      tables.filter(
        (t) =>
          (typeFilter === "All" || t.type === typeFilter) &&
          (statusFilter === "All" || t.status === statusFilter),
      ),
    [tables, typeFilter, statusFilter],
  );

  const metrics = useMemo(() => {
    const active = tables.filter((t) => t.status === "active").length;
    return {
      total: tables.length,
      active,
      inactive: tables.length - active,
    };
  }, [tables]);

  const addTable = (row: TableRow) => {
    setTables((prev) => [row, ...prev]);
    setCreateOpen(false);
  };

  return (
    <div className="bg-muted/40 p-4">
      <style>{css}</style>
      <div className="tm-screen">
        {/* Top bar */}
        <div className="tm-topbar">
          <div>
            <div className="tm-topbar-title">
              <Table2 className="tm-ico" aria-hidden="true" />
              Table ID Master
            </div>
            <div className="tm-topbar-sub">
              QC &amp; Packing workstations · North-A1 Warehouse
            </div>
          </div>
          <div className="tm-actions">
            <button
              className="tm-btn tm-btn-primary"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="tm-ico-sm" aria-hidden="true" />
              Create New
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="tm-metrics">
          <div className="tm-metric">
            <div className="tm-metric-label">Total tables</div>
            <div className="tm-metric-val">{metrics.total}</div>
          </div>
          <div className="tm-metric">
            <div className="tm-metric-label">Active</div>
            <div className="tm-metric-val green">{metrics.active}</div>
          </div>
          <div className="tm-metric">
            <div className="tm-metric-label">Inactive</div>
            <div className="tm-metric-val amber">{metrics.inactive}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="tm-filters">
          <span className="tm-filter-label">Type</span>
          {TYPE_FILTERS.map((t) => (
            <span
              key={t}
              className={`tm-chip${typeFilter === t ? " active" : ""}`}
              onClick={() => setTypeFilter(t)}
            >
              {t}
            </span>
          ))}
          <span className="tm-filters-right">
            <span className="tm-filter-label">Status</span>
            {STATUS_FILTERS.map((s) => (
              <span
                key={s}
                className={`tm-chip${statusFilter === s ? " active" : ""}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === "All" ? "All" : s === "active" ? "Active" : "Inactive"}
              </span>
            ))}
          </span>
        </div>

        {/* Table */}
        <div className="tm-section-label">Table register</div>
        <div className="tm-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Table ID</th>
                <th>Type</th>
                <th>Zone ID</th>
                <th>Status</th>
                <th>Mapped User</th>
                <th>Last Active</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td className="tm-empty" colSpan={6}>
                    No tables match these filters.
                  </td>
                </tr>
              ) : (
                visible.map((t) => (
                  <tr key={t.id}>
                    <td className="tm-td-strong tm-mono">{t.id}</td>
                    <td>
                      <span className="tm-type">{t.type}</span>
                    </td>
                    <td>{t.zoneId}</td>
                    <td>
                      <span className={`tm-badge badge-${t.status}`}>
                        {t.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      {t.status === "active" && t.mappedUser ? (
                        t.mappedUser
                      ) : (
                        <span className="tm-muted">—</span>
                      )}
                    </td>
                    <td className="tm-mono tm-muted">{t.lastActive}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {createOpen &&
        createPortal(
          <CreateTableModal
            existingIds={tables.map((t) => t.id)}
            onClose={() => setCreateOpen(false)}
            onCreate={addTable}
          />,
          document.body,
        )}
    </div>
  );
}

// ─── Create modal ─────────────────────────────────────────────────────────

function CreateTableModal({
  existingIds,
  onClose,
  onCreate,
}: {
  existingIds: string[];
  onClose: () => void;
  onCreate: (row: TableRow) => void;
}) {
  const [id, setId] = useState("");
  const [type, setType] = useState<TableType>("QC");
  const [zoneId, setZoneId] = useState("");
  const [status, setStatus] = useState<TableStatus>("active");
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    const tid = id.trim().toUpperCase();
    if (!tid) return setErr("Table ID is required.");
    if (!zoneId.trim()) return setErr("Zone ID is required for serpentine routing.");
    if (existingIds.includes(tid)) return setErr(`${tid} already exists.`);
    onCreate({
      id: tid,
      type,
      zoneId: zoneId.trim(),
      status,
      mappedUser:
        status === "active"
          ? NAME_POOL[existingIds.length % NAME_POOL.length]
          : "",
      lastActive: "—",
    });
  };

  return (
    <div className="tm-overlay" onClick={onClose}>
      <style>{css}</style>
      <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tm-topbar">
          <div>
            <div className="tm-topbar-title">
              <Table2 className="tm-ico" aria-hidden="true" />
              Create Table ID
            </div>
            <div className="tm-topbar-sub">
              Register a new QC or Packing workstation
            </div>
          </div>
          <button className="tm-close" onClick={onClose} aria-label="Close">
            <X className="tm-ico-sm" aria-hidden="true" />
          </button>
        </div>

        <div className="tm-form">
          <div className="tm-grid">
            <div className="tm-field">
              <label>
                Table ID<span className="tm-req">*</span>
              </label>
              <input
                className="tm-input-el"
                placeholder="e.g. TBL-PK-04"
                value={id}
                onChange={(e) => {
                  setId(e.target.value);
                  setErr(null);
                }}
              />
            </div>
            <div className="tm-field">
              <label>
                Type<span className="tm-req">*</span>
              </label>
              <div className="tm-select-wrap">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TableType)}
                >
                  <option value="QC">QC</option>
                  <option value="Packing">Packing</option>
                </select>
                <ChevronDown className="tm-ico-sm tm-select-ico" aria-hidden="true" />
              </div>
            </div>
            <div className="tm-field">
              <label>
                Zone ID<span className="tm-req">*</span>
              </label>
              <input
                className="tm-input-el"
                placeholder="e.g. Merge Area · M4"
                value={zoneId}
                onChange={(e) => {
                  setZoneId(e.target.value);
                  setErr(null);
                }}
              />
            </div>
            <div className="tm-field">
              <label>Status</label>
              <div className="tm-select-wrap">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TableStatus)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <ChevronDown className="tm-ico-sm tm-select-ico" aria-hidden="true" />
              </div>
            </div>
          </div>

          {err && <div className="tm-alert tm-alert-err">{err}</div>}
        </div>

        <div className="tm-form-foot">
          <button className="tm-btn tm-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="tm-btn tm-btn-primary" onClick={submit}>
            <Plus className="tm-ico-sm" aria-hidden="true" />
            Create Table
          </button>
        </div>
      </div>
    </div>
  );
}

// Scoped styles — prefixed with `.tm-screen` / `.tm-overlay` so selectors never leak.
const css = `
.tm-screen{--c-bg:#ffffff;--c-bg2:#f5f3ee;--c-border:#e2dfd5;--c-border2:#d0ccbf;--c-t1:#1a1a1a;--c-t2:#555555;--c-t3:#8a8a85;--c-info-t:#b8751f;--c-info-b:#e8c389;--c-info-bg:#fbf0dc;--c-green:#2e7a4e;--c-amber:#a86b1a;--c-red:#b5321f;--c-mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
  background:var(--c-bg);border:1px solid var(--c-border);border-radius:4px;overflow:hidden;font-family:inherit;width:100%}
.tm-overlay{--c-bg:#ffffff;--c-bg2:#f5f3ee;--c-border:#e2dfd5;--c-border2:#d0ccbf;--c-t1:#1a1a1a;--c-t2:#555555;--c-t3:#8a8a85;--c-info-t:#b8751f;--c-info-b:#e8c389;--c-info-bg:#fbf0dc;--c-red:#b5321f;--c-mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
  position:fixed;inset:0;background:rgba(31,29,23,0.45);display:flex;align-items:flex-start;justify-content:center;padding:32px 16px;z-index:100;overflow-y:auto}
.tm-modal{background:var(--c-bg);border:1px solid var(--c-border);border-radius:4px;width:100%;max-width:720px;box-shadow:0 20px 50px rgba(31,29,23,0.25);overflow:hidden}
.tm-close{background:transparent;border:0;color:var(--c-t3);cursor:pointer;padding:4px;border-radius:3px;display:inline-flex;align-items:center}
.tm-close:hover{background:var(--c-bg2);color:var(--c-t1)}
.tm-screen .tm-ico,.tm-modal .tm-ico{width:16px;height:16px;vertical-align:-3px;margin-right:7px;display:inline-block}
.tm-screen .tm-ico-sm,.tm-modal .tm-ico-sm{width:14px;height:14px;flex:none}
.tm-topbar{display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid var(--c-border)}
.tm-topbar-title{font-size:15px;font-weight:600;color:var(--c-t1);display:flex;align-items:center}
.tm-topbar-sub{font-size:12px;color:var(--c-t3);margin-top:2px}
.tm-actions{display:flex;gap:8px}
.tm-screen .tm-btn,.tm-modal .tm-btn{font-size:12px;padding:7px 13px;border:1px solid var(--c-border2);border-radius:4px;background:transparent;color:var(--c-t2);cursor:pointer;display:inline-flex;align-items:center;gap:6px;line-height:1}
.tm-screen .tm-btn-ghost,.tm-modal .tm-btn-ghost{background:var(--c-bg2)}
.tm-screen .tm-btn-primary,.tm-modal .tm-btn-primary{background:#1f1d17;border-color:#1f1d17;color:#fff;font-weight:600}
.tm-screen .tm-btn-primary:hover,.tm-modal .tm-btn-primary:hover{background:#2b281f}
.tm-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;border-bottom:1px solid var(--c-border);background:var(--c-border)}
.tm-metric{padding:12px 18px;background:var(--c-bg2)}
.tm-metric-label{font-family:var(--c-mono);font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:var(--c-t3);margin-bottom:4px}
.tm-metric-val{font-size:20px;font-weight:700;color:var(--c-t1)}
.tm-metric-val.green{color:var(--c-green)}
.tm-metric-val.amber{color:var(--c-amber)}
.tm-metric-val.info{color:var(--c-info-t)}
.tm-field{display:flex;flex-direction:column;gap:7px;min-width:0}
.tm-field-full{grid-column:1 / -1}
.tm-field label{font-family:var(--c-mono);font-size:10.5px;font-weight:500;text-transform:uppercase;letter-spacing:0.06em;color:var(--c-t3)}
.tm-req{color:var(--c-red);margin-left:3px}
.tm-screen .tm-input-el,.tm-modal .tm-input-el{width:100%;box-sizing:border-box;font-size:13px;color:var(--c-t1);padding:10px 13px;border:1px solid var(--c-border2);border-radius:4px;background:var(--c-bg)}
.tm-screen .tm-input-el::placeholder,.tm-modal .tm-input-el::placeholder{color:var(--c-t3)}
.tm-select-wrap{position:relative}
.tm-screen .tm-select-wrap select,.tm-modal .tm-select-wrap select{appearance:none;width:100%;box-sizing:border-box;font-size:13px;color:var(--c-t1);padding:10px 34px 10px 13px;border:1px solid var(--c-border2);border-radius:4px;background:var(--c-bg);cursor:pointer}
.tm-select-ico{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--c-t3);pointer-events:none}
.tm-modal input:focus,.tm-modal select:focus{outline:none;border-color:var(--c-info-t);box-shadow:0 0 0 2px var(--c-info-bg)}
.tm-alert{margin-top:12px;padding:10px 13px;border-radius:4px;font-size:12px;line-height:1.4;border:1px solid transparent}
.tm-alert-err{background:#fae5e0;color:#b5321f;border-color:rgba(181,50,31,0.3)}
.tm-filters{display:flex;gap:8px;padding:10px 18px;border-bottom:1px solid var(--c-border);flex-wrap:wrap;align-items:center}
.tm-filter-label{font-family:var(--c-mono);font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:var(--c-t3);margin-right:4px}
.tm-filters-right{margin-left:auto;display:flex;gap:8px;align-items:center}
.tm-chip{font-size:11px;padding:4px 11px;border:1px solid var(--c-border);border-radius:4px;color:var(--c-t2);background:var(--c-bg2);cursor:pointer;user-select:none}
.tm-chip:hover{border-color:var(--c-border2)}
.tm-chip.active{border-color:var(--c-info-b);color:var(--c-info-t);background:var(--c-info-bg);font-weight:600}
.tm-section-label{font-family:var(--c-mono);font-size:10.5px;font-weight:500;color:var(--c-t3);padding:12px 18px 8px;letter-spacing:0.08em;text-transform:uppercase}
.tm-table-wrap{margin:0 18px 16px;overflow:auto;border:1px solid var(--c-border);border-radius:4px}
.tm-screen table{width:100%;border-collapse:collapse;font-size:12px;white-space:nowrap}
.tm-screen th{position:sticky;top:0;z-index:1;background:var(--c-bg2);text-align:left;font-family:var(--c-mono);font-weight:500;font-size:10.5px;text-transform:uppercase;letter-spacing:0.06em;color:var(--c-t3);padding:7px 10px;border-bottom:1px solid var(--c-border)}
.tm-screen td{padding:9px 10px;border-bottom:1px solid var(--c-border);color:var(--c-t1);vertical-align:middle}
.tm-screen tr:last-child td{border-bottom:none}
.tm-td-strong{font-weight:700}
.tm-mono{font-family:var(--c-mono);font-size:11px}
.tm-muted{color:var(--c-t3)}
.tm-empty{text-align:center;color:var(--c-t3);padding:26px 12px}
.tm-type{display:inline-block;font-family:var(--c-mono);font-size:9.5px;font-weight:500;text-transform:uppercase;letter-spacing:0.06em;padding:2px 8px;border-radius:2px;background:var(--c-info-bg);color:var(--c-info-t);border:1px solid var(--c-info-b)}
.tm-badge{display:inline-block;font-family:var(--c-mono);font-size:9.5px;padding:2px 8px;border-radius:2px;font-weight:500;text-transform:uppercase;letter-spacing:0.06em;border:1px solid transparent}
.badge-active{background:#dff0e4;color:#2e7a4e;border-color:rgba(46,122,78,0.3)}
.badge-inactive{background:#eeebe3;color:#6b6862;border-color:rgba(107,104,98,0.3)}
.tm-form{padding:18px 22px}
.tm-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px 20px}
.tm-form-foot{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:16px 22px;border-top:1px solid var(--c-border)}
`;
