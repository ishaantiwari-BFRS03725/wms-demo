import { createFileRoute } from "@tanstack/react-router";
import { Filter, LayoutGrid, Plus, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_wms/putwall")({
  head: () => ({
    meta: [{ title: "Putwall Management — Sorting" }],
  }),
  component: PutwallManagement,
});

type CellStatus = "free" | "in-progress" | "done" | "blocked";

const grid: { id: string; status: CellStatus; order?: string; count?: string }[] =
  [
    { id: "PI-01", status: "free" },
    { id: "PI-02", status: "in-progress", order: "ORD-4821", count: "3 of 5 items" },
    { id: "PI-03", status: "done", order: "ORD-4756", count: "4 of 4 · done" },
    { id: "PI-04", status: "in-progress", order: "ORD-4890", count: "1 of 3 items" },
    { id: "PI-05", status: "free" },
    { id: "PI-06", status: "done", order: "ORD-4712", count: "2 of 2 · done" },
    { id: "PI-07", status: "in-progress", order: "ORD-4933", count: "2 of 6 items" },
    { id: "PI-08", status: "blocked", order: "ORD-4801", count: "Blocked" },
    { id: "PI-09", status: "free" },
    { id: "PI-10", status: "done", order: "ORD-4688", count: "3 of 3 · done" },
    { id: "PI-11", status: "free" },
    { id: "PI-12", status: "in-progress", order: "ORD-4966", count: "4 of 7 items" },
  ];

const badgeLabel: Record<Exclude<CellStatus, "free">, string> = {
  "in-progress": "In progress",
  done: "Done",
  blocked: "Blocked",
};

const rows: {
  id: string;
  status: Exclude<CellStatus, "free">;
  order: string;
  channel: string;
  seller: string;
  placed: string;
  tote: string;
  assigned: string;
  lastScan: string;
  action: "View" | "Transfer" | "Resolve";
}[] = [
  { id: "PI-02", status: "in-progress", order: "ORD-4821", channel: "Amazon / BlueDart", seller: "Brand X", placed: "3 / 5", tote: "TOTE-0092", assigned: "10:14 AM", lastScan: "10:31 AM", action: "View" },
  { id: "PI-03", status: "done", order: "ORD-4756", channel: "Flipkart / Delhivery", seller: "Brand Y", placed: "4 / 4", tote: "TOTE-0088", assigned: "09:52 AM", lastScan: "10:18 AM", action: "Transfer" },
  { id: "PI-07", status: "in-progress", order: "ORD-4933", channel: "Meesho / Delhivery", seller: "Brand X", placed: "2 / 6", tote: "TOTE-0097", assigned: "10:28 AM", lastScan: "10:34 AM", action: "View" },
  { id: "PI-08", status: "blocked", order: "ORD-4801", channel: "Amazon / BlueDart", seller: "Brand Z", placed: "5 / 5", tote: "TOTE-0090", assigned: "09:40 AM", lastScan: "10:05 AM", action: "Resolve" },
];

function PutwallManagement() {
  return (
    <div className="bg-muted/40 p-4">
      <style>{css}</style>
      <div className="pw-screen">
        {/* Top bar */}
        <div className="pw-topbar">
          <div>
            <div className="pw-topbar-title">
              <LayoutGrid className="pw-ico" aria-hidden="true" />
              Putwall management
            </div>
            <div className="pw-topbar-sub">Sorting station A · 24 pigeonholes</div>
          </div>
          <div className="pw-actions">
            <button className="pw-btn">
              <Filter className="pw-ico-sm" aria-hidden="true" />
              Filter
            </button>
            <button className="pw-btn">
              <RefreshCw className="pw-ico-sm" aria-hidden="true" />
              Refresh
            </button>
            <button className="pw-btn pw-btn-primary">
              <Plus className="pw-ico-sm" aria-hidden="true" />
              New putwall
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="pw-filters">
          <span className="pw-filter-label">Status</span>
          <span className="pw-chip active">All</span>
          <span className="pw-chip">Free</span>
          <span className="pw-chip">In progress</span>
          <span className="pw-chip">Done</span>
          <span className="pw-chip">Blocked</span>
          <span className="pw-filters-right">
            <span className="pw-filter-label">Station</span>
            <span className="pw-chip active">Station A</span>
            <span className="pw-chip">Station B</span>
          </span>
        </div>

        {/* Metrics */}
        <div className="pw-metrics">
          <div className="pw-metric">
            <div className="pw-metric-label">Total pigeonholes</div>
            <div className="pw-metric-val">24</div>
          </div>
          <div className="pw-metric">
            <div className="pw-metric-label">In progress</div>
            <div className="pw-metric-val amber">7</div>
          </div>
          <div className="pw-metric">
            <div className="pw-metric-label">Done — awaiting pickup</div>
            <div className="pw-metric-val green">5</div>
          </div>
          <div className="pw-metric">
            <div className="pw-metric-label">Free / available</div>
            <div className="pw-metric-val info">12</div>
          </div>
        </div>

        {/* Grid */}
        <div className="pw-section-label">Pigeonhole grid</div>
        <div className="pw-grid">
          {grid.map((c) => (
            <div key={c.id} className={`pw-cell ${c.status}`}>
              <div className="pw-id">
                <span className={`pw-dot dot-${c.status}`} />
                {c.id}
              </div>
              {c.status === "free" ? (
                <div className="pw-order pw-free-label">Free</div>
              ) : (
                <>
                  <div className="pw-order">{c.order}</div>
                  <div
                    className="pw-count"
                    style={c.status === "blocked" ? { color: "#A32D2D" } : undefined}
                  >
                    {c.count}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Detail table */}
        <div className="pw-section-label">Pigeonhole detail table</div>
        <div className="pw-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pigeonhole ID</th>
                <th>Status</th>
                <th>Mapped order</th>
                <th>Seller</th>
                <th>Items placed / expected</th>
                <th>Tote source</th>
                <th>Assigned at</th>
                <th>Last scan</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="pw-td-strong">{r.id}</td>
                  <td>
                    <span className={`pw-badge badge-${r.status}`}>
                      {badgeLabel[r.status]}
                    </span>
                  </td>
                  <td>
                    {r.order}
                    <div className="pw-col-note">{r.channel}</div>
                  </td>
                  <td>{r.seller}</td>
                  <td>{r.placed}</td>
                  <td>{r.tote}</td>
                  <td>{r.assigned}</td>
                  <td>{r.lastScan}</td>
                  <td>
                    <button
                      className={
                        r.action === "Transfer"
                          ? "pw-btn pw-btn-primary pw-btn-sm"
                          : r.action === "Resolve"
                            ? "pw-btn pw-btn-sm pw-btn-danger"
                            : "pw-btn pw-btn-sm"
                      }
                    >
                      {r.action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="pw-legend">
          <span><span className="pw-dot dot-free" />Free</span>
          <span><span className="pw-dot dot-in-progress" />In progress</span>
          <span><span className="pw-dot dot-done" />Done — awaiting pickup</span>
          <span><span className="pw-dot dot-blocked" />Blocked</span>
        </div>
      </div>
    </div>
  );
}

// Scoped styles — every rule is prefixed with `.pw-screen` so the generic
// selectors (table/th/td/buttons) never leak into other screens.
const css = `
.pw-screen{--c-bg:#ffffff;--c-bg2:#f7f6f1;--c-border:#e6e4dc;--c-border2:#d8d6cd;--c-t1:#1c1b18;--c-t2:#4a4843;--c-t3:#88857d;--c-info-t:#1e40af;--c-info-b:#bcd0f5;--c-info-bg:#eaf0fb;--c-success:#3B6D11;--c-warning:#854F0B;
  background:var(--c-bg);border:0.5px solid var(--c-border);border-radius:12px;overflow:hidden;font-family:inherit;max-width:1100px;margin:0 auto}
.pw-screen .pw-ico{width:15px;height:15px;vertical-align:-2px;margin-right:6px;display:inline-block}
.pw-screen .pw-ico-sm{width:14px;height:14px}
.pw-topbar{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:0.5px solid var(--c-border)}
.pw-topbar-title{font-size:14px;font-weight:600;color:var(--c-t1);display:flex;align-items:center}
.pw-topbar-sub{font-size:12px;color:var(--c-t3);margin-top:2px}
.pw-actions{display:flex;gap:8px}
.pw-screen .pw-btn{font-size:12px;padding:6px 12px;border:0.5px solid var(--c-border2);border-radius:8px;background:transparent;color:var(--c-t2);cursor:pointer;display:inline-flex;align-items:center;gap:6px;line-height:1}
.pw-screen .pw-btn-primary{background:var(--c-info-bg);border-color:var(--c-info-b);color:var(--c-info-t)}
.pw-screen .pw-btn-danger{border-color:#A32D2D;color:#791F1F}
.pw-screen .pw-btn-sm{font-size:11px;padding:4px 8px}
.pw-filters{display:flex;gap:8px;padding:10px 16px;border-bottom:0.5px solid var(--c-border);flex-wrap:wrap;align-items:center}
.pw-filter-label{font-size:11px;color:var(--c-t3);margin-right:4px}
.pw-filters-right{margin-left:auto;display:flex;gap:8px;align-items:center}
.pw-chip{font-size:11px;padding:4px 10px;border:0.5px solid var(--c-border);border-radius:20px;color:var(--c-t2);background:var(--c-bg2)}
.pw-chip.active{border-color:var(--c-info-b);color:var(--c-info-t);background:var(--c-info-bg)}
.pw-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;border-bottom:0.5px solid var(--c-border);background:var(--c-border)}
.pw-metric{padding:12px 16px;background:var(--c-bg2)}
.pw-metric-label{font-size:11px;color:var(--c-t3);margin-bottom:4px}
.pw-metric-val{font-size:20px;font-weight:600;color:var(--c-t1)}
.pw-metric-val.green{color:var(--c-success)}
.pw-metric-val.amber{color:var(--c-warning)}
.pw-metric-val.info{color:var(--c-info-t)}
.pw-section-label{font-size:11px;font-weight:600;color:var(--c-t3);padding:10px 16px 6px;letter-spacing:0.06em;text-transform:uppercase}
.pw-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;padding:0 16px 16px}
.pw-cell{border:0.5px solid var(--c-border);border-radius:8px;padding:8px 10px;min-height:72px}
.pw-cell.free{background:var(--c-bg2)}
.pw-cell.in-progress{background:#FAEEDA;border-color:#854F0B}
.pw-cell.done{background:#EAF3DE;border-color:#3B6D11}
.pw-cell.blocked{background:#FCEBEB;border-color:#A32D2D}
.pw-id{font-size:12px;font-weight:600;color:var(--c-t1);display:flex;align-items:center}
.pw-cell.in-progress .pw-id{color:#633806}
.pw-cell.done .pw-id{color:#27500A}
.pw-cell.blocked .pw-id{color:#791F1F}
.pw-order{font-size:10px;color:var(--c-t2);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pw-free-label{color:var(--c-t3);font-size:10px;margin-top:6px}
.pw-cell.in-progress .pw-order{color:#854F0B}
.pw-cell.done .pw-order{color:#3B6D11}
.pw-count{font-size:10px;margin-top:6px;color:var(--c-t3)}
.pw-cell.in-progress .pw-count{color:#854F0B}
.pw-cell.done .pw-count{color:#3B6D11}
.pw-dot{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:5px}
.dot-free{background:#888780}
.dot-in-progress{background:#854F0B}
.dot-done{background:#3B6D11}
.dot-blocked{background:#A32D2D}
.pw-table-wrap{padding:0 16px 16px;overflow-x:auto}
.pw-screen table{width:100%;border-collapse:collapse;font-size:12px}
.pw-screen th{text-align:left;font-weight:600;font-size:11px;color:var(--c-t3);padding:6px 8px;border-bottom:0.5px solid var(--c-border);white-space:nowrap}
.pw-screen td{padding:7px 8px;border-bottom:0.5px solid var(--c-border);color:var(--c-t1);vertical-align:top}
.pw-screen tr:last-child td{border-bottom:none}
.pw-td-strong{font-weight:600}
.pw-badge{display:inline-block;font-size:10px;padding:2px 8px;border-radius:20px;font-weight:600}
.badge-in-progress{background:#FAEEDA;color:#633806}
.badge-done{background:#EAF3DE;color:#27500A}
.badge-blocked{background:#FCEBEB;color:#791F1F}
.pw-col-note{font-size:10px;color:var(--c-t3);margin-top:2px}
.pw-legend{padding:8px 16px 12px;display:flex;gap:16px;font-size:11px;color:var(--c-t3);flex-wrap:wrap}
.pw-legend span{display:inline-flex;align-items:center}
`;
