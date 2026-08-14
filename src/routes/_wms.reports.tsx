import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BarChart3,
  Check,
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

type FieldKey = "locations" | "status" | "fromDate" | "toDate" | "objectId";

interface ReportDef {
  id: string;
  name: string;
  desc: string;
  fields: FieldKey[];
  statusOptions?: string[];
  objectHint?: string;
}

interface TreeFolder {
  label: string;
  children?: TreeFolder[];
  reports?: ReportDef[];
}

const LOCATIONS = [
  "North-A1 Warehouse",
  "South-B2 Depot",
  "East-C3 Hub",
  "West-D4 Center",
];

const REPORT_TREE: TreeFolder[] = [
  {
    label: "Inbound",
    reports: [
          {
            id: "po",
            name: "Purchase Order Report",
            desc: "Track purchase orders, expected vs received quantities and ageing",
            fields: ["locations", "status", "fromDate", "toDate", "objectId"],
            statusOptions: ["Open", "Partially Received", "Received", "Closed", "Cancelled"],
            objectHint: "Enter comma separated PO IDs (e.g. PO-1042, PO-1108)",
          },
          {
            id: "asn",
            name: "ASN Report",
            desc: "Advance shipment notices with appointment and dock status",
            fields: ["locations", "status", "fromDate", "toDate", "objectId"],
            statusOptions: ["Created", "In Transit", "Arrived", "GRN Done", "Cancelled"],
            objectHint: "Enter comma separated ASN IDs (e.g. ASN-552101)",
          },
          {
            id: "grn",
            name: "GRN Report",
            desc: "Goods receipt notes with QC outcomes and put-away status",
            fields: ["locations", "fromDate", "toDate", "objectId"],
            objectHint: "Enter comma separated GRN IDs (e.g. GRN184459)",
          },
          {
            id: "putaway",
            name: "Putaway Report",
            desc: "Putaway tasks with source GRN, destination bins and completion status",
            fields: ["locations", "status", "fromDate", "toDate", "objectId"],
            statusOptions: ["Pending", "In Progress", "Completed", "Cancelled"],
            objectHint: "Enter comma separated Putaway IDs (e.g. PA-1017)",
          },
          {
            id: "gate-entry",
            name: "Gate Entry Report",
            desc: "Vehicle gate entries with arrival, dock and exit timestamps",
            fields: ["locations", "fromDate", "toDate", "objectId"],
            objectHint: "Enter comma separated Gate Entry IDs (e.g. GE-44021)",
          },
          {
            id: "unloading",
            name: "Unloading Report",
            desc: "Dock unloading activity with handled quantities and turnaround time",
            fields: ["locations", "status", "fromDate", "toDate", "objectId"],
            statusOptions: ["Scheduled", "Unloading", "Completed", "Cancelled"],
            objectHint: "Enter comma separated ASN / Dock IDs",
          },
        ],
      },
      {
        label: "Outbound",
        reports: [
          {
            id: "so",
            name: "Sales Order Report",
            desc: "Order fulfilment status across picking, packing and dispatch",
            fields: ["locations", "status", "fromDate", "toDate", "objectId"],
            statusOptions: ["New", "Picking", "Packed", "Manifested", "Shipped", "Cancelled"],
            objectHint: "Enter comma separated Order IDs (e.g. ORD-902145)",
          },
          {
            id: "picklist",
            name: "Picklist Report",
            desc: "Picklist progress, picker productivity and short picks",
            fields: ["locations", "status", "fromDate", "toDate"],
            statusOptions: ["Open", "In Progress", "Part Picked", "Completed"],
          },
          {
            id: "manifest",
            name: "Manifest Report",
            desc: "Courier manifests with seller, channel, shipment counts, creator and shipping status",
            fields: ["locations", "status", "fromDate", "toDate", "objectId"],
            statusOptions: ["Created", "Part Shipped", "Shipped"],
            objectHint: "Enter comma separated Manifest IDs (e.g. MNFST-7A3C9F12)",
          },
          {
            id: "pack",
            name: "Pack Report",
            desc: "Packing activity with box counts, pack size and packer productivity",
            fields: ["locations", "status", "fromDate", "toDate", "objectId"],
            statusOptions: ["Open", "Part Packed", "Packed", "Cancelled"],
            objectHint: "Enter comma separated Order / Box IDs",
          },
          {
            id: "dispatch",
            name: "Dispatch Report",
            desc: "Dispatched shipments with courier, manifest and handover details",
            fields: ["locations", "status", "fromDate", "toDate", "objectId"],
            statusOptions: ["Ready to Dispatch", "Dispatched", "Handed Over", "Cancelled"],
            objectHint: "Enter comma separated Order / AWB IDs",
          },
        ],
      },
      {
        label: "Inventory",
        reports: [
          {
            id: "ledger",
            name: "Stock Ledger Report",
            desc: "Inventory movements with opening and closing balances",
            fields: ["locations", "fromDate", "toDate", "objectId"],
            objectHint: "Enter comma separated SKUs (e.g. 600179, 601002)",
          },
          {
            id: "bin",
            name: "Bin Occupancy Report",
            desc: "Bin-level utilisation and free capacity snapshot",
            fields: ["locations"],
          },
          {
            id: "item-movement",
            name: "Item Movement Report",
            desc: "Bin-to-bin and item movements with source, destination and quantity",
            fields: ["locations", "status", "fromDate", "toDate", "objectId"],
            statusOptions: ["Pending", "In Progress", "Completed", "Cancelled"],
            objectHint: "Enter comma separated SKUs or Movement IDs",
          },
          {
            id: "replenishment",
            name: "Replenishment Report",
            desc: "Pick-face replenishment tasks with priority and fill status",
            fields: ["locations", "status", "fromDate", "toDate", "objectId"],
            statusOptions: ["Suggested", "In Progress", "Completed", "Cancelled"],
            objectHint: "Enter comma separated SKUs or Bin IDs",
          },
          {
            id: "near-expiry",
            name: "Near to Expiry Report",
            desc: "Stock approaching expiry by remaining shelf life and quantity",
            fields: ["locations", "fromDate", "toDate", "objectId"],
            objectHint: "Enter comma separated SKUs (e.g. 600179, 601002)",
          },
        ],
      },
      {
        label: "Billing",
        reports: [
          {
            id: "invoice",
            name: "Invoice Summary",
            desc: "Billed activities and charges by fulfilment location",
            fields: ["locations", "fromDate", "toDate"],
          },
        ],
      },
      {
        label: "Audit",
        reports: [
          {
            id: "item-ledger",
            name: "Item Ledger",
            desc: "Item-level audit trail of every stock transaction with running balance",
            fields: ["locations", "fromDate", "toDate", "objectId"],
            objectHint: "Enter comma separated SKUs (e.g. 600179, 601002)",
          },
          {
            id: "bin-ledger",
            name: "Bin Ledger",
            desc: "Bin-level audit trail of inbound and outbound movements with running balance",
            fields: ["locations", "fromDate", "toDate", "objectId"],
            objectHint: "Enter comma separated Bin IDs (e.g. MD-LPN-1017)",
          },
        ],
      },
  { label: "Custom Reports", reports: [] },
];

const FIELD_LABEL: Record<FieldKey, string> = {
  locations: "Fulfillment Locations",
  status: "Status",
  fromDate: "From Date",
  toDate: "To Date",
  objectId: "Object ID",
};

interface ReportRequest {
  id: string;
  report: string;
  range: string;
  submitted: string;
  status: "Queued" | "Processing" | "Completed" | "Failed";
}

const SEED_REQUESTS: ReportRequest[] = [
  {
    id: "REQ-20481",
    report: "Purchase Order Report",
    range: "2026-06-01 → 2026-06-28",
    submitted: "2026-06-29 14:22",
    status: "Completed",
  },
  {
    id: "REQ-20479",
    report: "Stock Ledger Report",
    range: "2026-06-15 → 2026-06-29",
    submitted: "2026-06-29 11:05",
    status: "Processing",
  },
  {
    id: "REQ-20475",
    report: "ASN Report",
    range: "2026-05-01 → 2026-06-01",
    submitted: "2026-06-28 18:40",
    status: "Failed",
  },
];

// Flatten all reports for lookup / search.
const ALL_REPORTS: ReportDef[] = (() => {
  const out: ReportDef[] = [];
  const walk = (folders: TreeFolder[]) => {
    for (const f of folders) {
      if (f.reports) out.push(...f.reports);
      if (f.children) walk(f.children);
    }
  };
  walk(REPORT_TREE);
  return out;
})();

type FormState = {
  locations: string[];
  status: string;
  fromDate: string;
  toDate: string;
  objectId: string;
};

const emptyForm = (): FormState => ({
  locations: [],
  status: "",
  fromDate: "",
  toDate: "",
  objectId: "",
});

function fmtLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function prettyRange(form: FormState): string {
  const trim = (v: string) => (v ? v.replace("T", " ") : "");
  const a = trim(form.fromDate);
  const b = trim(form.toDate);
  if (a && b) return `${a} → ${b}`;
  if (a) return `from ${a}`;
  if (b) return `until ${b}`;
  return "All time";
}

function Reports() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    Inbound: true,
  });
  const [treeSearch, setTreeSearch] = useState("");
  const [selectedId, setSelectedId] = useState("po");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [locOpen, setLocOpen] = useState(false);
  const [showLocError, setShowLocError] = useState(false);
  const [requests, setRequests] = useState<ReportRequest[]>(SEED_REQUESTS);
  const [view, setView] = useState<"builder" | "status">("builder");
  const [banner, setBanner] = useState<string | null>(null);
  const [activeChip, setActiveChip] = useState<string | null>(null);

  const report = useMemo(
    () => ALL_REPORTS.find((r) => r.id === selectedId) ?? ALL_REPORTS[0],
    [selectedId],
  );

  const q = treeSearch.trim().toLowerCase();
  const matches = (r: ReportDef) => q === "" || r.name.toLowerCase().includes(q);

  const toggleFolder = (label: string) =>
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));

  const selectReport = (id: string) => {
    setSelectedId(id);
    setForm(emptyForm());
    setShowLocError(false);
    setBanner(null);
    setActiveChip(null);
    setView("builder");
  };

  const setField = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setActiveChip(null);
  };

  const toggleLocation = (loc: string) => {
    setShowLocError(false);
    setActiveChip(null);
    setForm((prev) => ({
      ...prev,
      locations: prev.locations.includes(loc)
        ? prev.locations.filter((l) => l !== loc)
        : [...prev.locations, loc],
    }));
  };

  const resetFilters = () => {
    setForm(emptyForm());
    setShowLocError(false);
    setBanner(null);
    setActiveChip(null);
  };

  const generate = () => {
    if (report.fields.includes("locations") && form.locations.length === 0) {
      setShowLocError(true);
      setBanner(null);
      return;
    }
    const seq = 20482 + requests.length - SEED_REQUESTS.length;
    const req: ReportRequest = {
      id: `REQ-${seq}`,
      report: report.name,
      range: prettyRange(form),
      submitted: fmtLocal(new Date()).replace("T", " "),
      status: "Queued",
    };
    setRequests((prev) => [req, ...prev]);
    setBanner(`${req.id} submitted — track it under Request Status.`);
  };

  const applyChip = (chip: string) => {
    const now = new Date();
    if (chip === "Last 24 Hours") {
      const from = new Date(now.getTime() - 24 * 3600 * 1000);
      setForm((prev) => ({ ...prev, fromDate: fmtLocal(from), toDate: fmtLocal(now) }));
    } else if (chip === "North Region Only") {
      setForm((prev) => ({ ...prev, locations: ["North-A1 Warehouse"] }));
      setShowLocError(false);
    } else if (chip === "Critical Audit Trail") {
      setForm((prev) => ({
        ...prev,
        status: report.statusOptions?.includes("Critical") ? "Critical" : prev.status,
      }));
    }
    setActiveChip(chip);
  };

  const locationLabel =
    form.locations.length === 0
      ? "Select locations"
      : form.locations.length <= 2
        ? form.locations.join(", ")
        : `${form.locations.length} locations selected`;

  return (
    <div className="bg-muted/40 p-4">
      <style>{css}</style>
      <div className="rx-screen">
        {/* Header */}
        <div className="rx-header">
          <div className="rx-header-title">Report Explorer</div>
          <span className="rx-header-div" />
          <button
            className={`rx-btn rx-btn-ghost${view === "status" ? " rx-btn-on" : ""}`}
            onClick={() => setView(view === "status" ? "builder" : "status")}
          >
            <FileText className="rx-ico-sm" aria-hidden="true" />
            Request Status
            {requests.length > 0 && (
              <span className="rx-count">{requests.length}</span>
            )}
          </button>
        </div>

        <div className="rx-body">
          {/* Left tree */}
          <div className="rx-tree">
            <div className="rx-search">
              <Search className="rx-ico-sm rx-search-ico" aria-hidden="true" />
              <input
                placeholder="Search Reports"
                value={treeSearch}
                onChange={(e) => setTreeSearch(e.target.value)}
              />
            </div>

            <div className="rx-tree-list">
              {REPORT_TREE.map((root) => {
                const rootOpen = q !== "" || expanded[root.label];
                return (
                  <div key={root.label}>
                    <div
                      className="rx-node rx-node-root"
                      onClick={() => toggleFolder(root.label)}
                    >
                      {rootOpen ? (
                        <ChevronDown className="rx-ico-sm" aria-hidden="true" />
                      ) : (
                        <ChevronRight className="rx-ico-sm" aria-hidden="true" />
                      )}
                      <Folder className="rx-ico-sm" aria-hidden="true" />
                      {root.label}
                    </div>

                    {rootOpen &&
                      root.children?.map((sub) => {
                        const subReports = (sub.reports ?? []).filter(matches);
                        if (q !== "" && subReports.length === 0) return null;
                        const subOpen = q !== "" || expanded[sub.label];
                        return (
                          <div key={sub.label}>
                            <div
                              className="rx-node rx-lvl1"
                              onClick={() => toggleFolder(sub.label)}
                            >
                              {subOpen ? (
                                <ChevronDown className="rx-ico-sm" aria-hidden="true" />
                              ) : (
                                <ChevronRight className="rx-ico-sm" aria-hidden="true" />
                              )}
                              <Folder className="rx-ico-sm" aria-hidden="true" />
                              {sub.label}
                            </div>
                            {subOpen &&
                              subReports.map((r) => (
                                <div
                                  key={r.id}
                                  className={`rx-node rx-lvl2${r.id === selectedId && view === "builder" ? " active" : ""}`}
                                  onClick={() => selectReport(r.id)}
                                >
                                  <FileText className="rx-ico-sm" aria-hidden="true" />
                                  {r.name}
                                </div>
                              ))}
                          </div>
                        );
                      })}

                    {rootOpen &&
                      root.reports &&
                      (root.reports.filter(matches).length > 0
                        ? root.reports.filter(matches).map((r) => (
                            <div
                              key={r.id}
                              className={`rx-node rx-lvl1${r.id === selectedId && view === "builder" ? " active" : ""}`}
                              onClick={() => selectReport(r.id)}
                            >
                              <FileText className="rx-ico-sm" aria-hidden="true" />
                              {r.name}
                            </div>
                          ))
                        : q === "" && (
                            <div className="rx-node rx-lvl1 rx-node-muted">
                              No reports yet
                            </div>
                          ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main */}
          <div className="rx-main">
            {view === "status" ? (
              <div className="rx-card">
                <div className="rx-card-head">
                  <div className="rx-card-icon">
                    <FileText className="rx-ico" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="rx-card-title">Request Status</div>
                    <div className="rx-card-sub">
                      Recent report generation requests for this session
                    </div>
                  </div>
                </div>
                <div className="rx-req-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Request ID</th>
                        <th>Report</th>
                        <th>Date Range</th>
                        <th>Submitted</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((r) => (
                        <tr key={r.id}>
                          <td className="rx-mono">{r.id}</td>
                          <td>{r.report}</td>
                          <td className="rx-mono">{r.range}</td>
                          <td className="rx-mono">{r.submitted}</td>
                          <td>
                            <span className={`rx-badge rx-badge-${r.status.toLowerCase()}`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {requests.length === 0 && (
                        <tr>
                          <td className="rx-empty" colSpan={5}>
                            No requests yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="rx-card-foot">
                  <button
                    className="rx-btn rx-btn-ghost"
                    onClick={() => setView("builder")}
                  >
                    Back to Builder
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="rx-card">
                  <div className="rx-card-head">
                    <div className="rx-card-icon">
                      <FileText className="rx-ico" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="rx-card-title">{report.name}</div>
                      <div className="rx-card-sub">{report.desc}</div>
                    </div>
                  </div>

                  <div className="rx-form">
                    {report.fields.map((fk) => {
                      const full = fk === "objectId";
                      return (
                        <div
                          key={fk}
                          className={`rx-field${full ? " rx-field-full" : ""}`}
                        >
                          <label>
                            {FIELD_LABEL[fk]}
                            {fk === "locations" && <span className="rx-req"> *</span>}
                          </label>

                          {fk === "locations" && (
                            <div className="rx-loc">
                              <div
                                className={`rx-select${form.locations.length === 0 ? " rx-placeholder" : ""}${showLocError ? " rx-error" : ""}`}
                                onClick={() => setLocOpen((o) => !o)}
                              >
                                {locationLabel}
                                <ChevronDown className="rx-ico-sm" aria-hidden="true" />
                              </div>
                              {locOpen && (
                                <>
                                  <div
                                    className="rx-overlay"
                                    onClick={() => setLocOpen(false)}
                                  />
                                  <div className="rx-dropdown">
                                    {LOCATIONS.map((loc) => {
                                      const on = form.locations.includes(loc);
                                      return (
                                        <div
                                          key={loc}
                                          className="rx-option"
                                          onClick={() => toggleLocation(loc)}
                                        >
                                          <span
                                            className={`rx-check${on ? " on" : ""}`}
                                          >
                                            {on && (
                                              <Check
                                                className="rx-ico-xs"
                                                aria-hidden="true"
                                              />
                                            )}
                                          </span>
                                          {loc}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </>
                              )}
                              {showLocError && (
                                <div className="rx-error-text">
                                  Select at least one location
                                </div>
                              )}
                            </div>
                          )}

                          {fk === "status" && (
                            <div className="rx-select-wrap">
                              <select
                                value={form.status}
                                onChange={(e) => setField("status", e.target.value)}
                                className={form.status ? "" : "rx-placeholder"}
                              >
                                <option value="">Select Status</option>
                                {report.statusOptions?.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown
                                className="rx-ico-sm rx-select-ico"
                                aria-hidden="true"
                              />
                            </div>
                          )}

                          {(fk === "fromDate" || fk === "toDate") && (
                            <input
                              className="rx-date"
                              type="datetime-local"
                              value={form[fk]}
                              onChange={(e) => setField(fk, e.target.value)}
                            />
                          )}

                          {fk === "objectId" && (
                            <input
                              className="rx-text"
                              placeholder={report.objectHint ?? "Enter comma separated IDs"}
                              value={form.objectId}
                              onChange={(e) => setField("objectId", e.target.value)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {banner && (
                    <div className="rx-info rx-info-ok">
                      <Check className="rx-ico-sm" aria-hidden="true" />
                      <span>{banner}</span>
                    </div>
                  )}

                  <div className="rx-info">
                    <Info className="rx-ico-sm" aria-hidden="true" />
                    <span>
                      Report generation might take up to 2 minutes for high-volume
                      data sets spanning more than 30 days. You will be notified via
                      the{" "}
                      <span className="rx-link" onClick={() => setView("status")}>
                        Request Status
                      </span>{" "}
                      dashboard.
                    </span>
                  </div>

                  <div className="rx-card-foot">
                    <button className="rx-btn rx-btn-ghost" onClick={resetFilters}>
                      Reset Filters
                    </button>
                    <button className="rx-btn rx-btn-primary" onClick={generate}>
                      <BarChart3 className="rx-ico-sm" aria-hidden="true" />
                      Generate Report
                    </button>
                  </div>
                </div>

                <div className="rx-bottom">
                  <div className="rx-quick">
                    <div className="rx-quick-label">Quick Filters</div>
                    {["Last 24 Hours", "North Region Only", "Critical Audit Trail"].map(
                      (chip) => (
                        <div
                          key={chip}
                          className={`rx-quick-chip${activeChip === chip ? " active" : ""}`}
                          onClick={() => applyChip(chip)}
                        >
                          {chip}
                        </div>
                      ),
                    )}
                  </div>
                  <div className="rx-analytics">
                    <div className="rx-analytics-body">
                      <div className="rx-analytics-title">Analytics Preview</div>
                      <div className="rx-analytics-sub">
                        Check historical performance trends for this specific report
                        type before generating.
                      </div>
                      <div
                        className="rx-link rx-analytics-link"
                        onClick={() => setView("status")}
                      >
                        View Trends
                        <TrendingUp className="rx-ico-sm" aria-hidden="true" />
                      </div>
                    </div>
                    <div className="rx-analytics-badge">
                      <BarChart3 className="rx-ico" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Scoped styles — prefixed with `.rx-screen` so generic selectors never leak.
const css = `
.rx-screen{--c-bg:#ffffff;--c-bg2:#f5f3ee;--c-border:#e2dfd5;--c-border2:#d0ccbf;--c-t1:#1a1a1a;--c-t2:#555555;--c-t3:#8a8a85;--c-info-t:#b8751f;--c-info-b:#e8c389;--c-info-bg:#fbf0dc;--c-mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
  background:var(--c-bg);border:1px solid var(--c-border);border-radius:4px;overflow:hidden;font-family:inherit;max-width:1280px;margin:0 auto}
.rx-screen .rx-ico{width:18px;height:18px}
.rx-screen .rx-ico-sm{width:14px;height:14px;flex:none}
.rx-screen .rx-ico-xs{width:11px;height:11px;flex:none}
.rx-header{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--c-border)}
.rx-header-title{font-size:15px;font-weight:600;color:var(--c-t1)}
.rx-header-div{width:1px;height:18px;background:var(--c-border2)}
.rx-screen .rx-btn{font-size:12px;padding:6px 12px;border:1px solid var(--c-border2);border-radius:4px;background:transparent;color:var(--c-t2);cursor:pointer;display:inline-flex;align-items:center;gap:6px;line-height:1}
.rx-screen .rx-btn-ghost{background:var(--c-bg2)}
.rx-screen .rx-btn-on{background:var(--c-info-bg);border-color:var(--c-info-b);color:var(--c-info-t);font-weight:600}
.rx-screen .rx-btn-primary{background:#1f1d17;border-color:#1f1d17;color:#fff;padding:9px 18px;font-weight:600}
.rx-screen .rx-btn-primary:hover{background:#2b281f}
.rx-count{display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:var(--c-info-t);color:#fff;font-size:10px;font-weight:700}
.rx-body{display:flex;align-items:stretch}
.rx-tree{width:240px;flex:none;border-right:1px solid var(--c-border);padding:14px 12px;background:var(--c-bg)}
.rx-search{position:relative;margin-bottom:14px}
.rx-search-ico{position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--c-t3)}
.rx-search input{width:100%;box-sizing:border-box;font-size:12px;padding:8px 10px 8px 28px;border:1px solid var(--c-border);border-radius:4px;background:var(--c-bg2);color:var(--c-t2)}
.rx-tree-list{display:flex;flex-direction:column;gap:2px}
.rx-node{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--c-t2);padding:6px 8px;border-radius:3px;cursor:pointer}
.rx-node:hover{background:var(--c-bg2)}
.rx-node-root{font-weight:600;color:var(--c-t1)}
.rx-node-muted{color:var(--c-t3);cursor:default;font-style:italic}
.rx-node-muted:hover{background:transparent}
.rx-lvl1{padding-left:18px}
.rx-lvl2{padding-left:40px}
.rx-node.active{background:var(--c-info-bg);color:var(--c-info-t);font-weight:600;box-shadow:inset 2px 0 0 var(--c-info-t)}
.rx-main{flex:1;padding:18px;background:var(--c-bg2);display:flex;flex-direction:column;gap:18px;min-width:0}
.rx-card{background:var(--c-bg);border:1px solid var(--c-border);border-radius:4px;padding:22px 26px}
.rx-card-head{display:flex;gap:12px;align-items:flex-start;margin-bottom:22px}
.rx-card-icon{width:40px;height:40px;flex:none;border-radius:4px;background:var(--c-info-bg);color:var(--c-info-t);display:flex;align-items:center;justify-content:center}
.rx-card-title{font-size:18px;font-weight:600;color:var(--c-t1)}
.rx-card-sub{font-size:12px;color:var(--c-t3);margin-top:2px}
.rx-form{display:grid;grid-template-columns:1fr 1fr;gap:16px 22px}
.rx-field{display:flex;flex-direction:column;gap:7px;min-width:0}
.rx-field-full{grid-column:1 / -1}
.rx-field label{font-family:var(--c-mono);font-size:10.5px;font-weight:500;text-transform:uppercase;letter-spacing:0.06em;color:var(--c-t3)}
.rx-req{color:#b5321f}
.rx-select,.rx-input,.rx-text{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:13px;color:var(--c-t1);padding:11px 13px;border:1px solid var(--c-border2);border-radius:4px;background:var(--c-bg)}
.rx-select{cursor:pointer}
.rx-select .rx-ico-sm{color:var(--c-t3)}
.rx-placeholder{color:var(--c-t3)}
.rx-select.rx-error{border-color:#b5321f}
.rx-error-text{font-size:11px;color:#b5321f;margin-top:5px}
.rx-loc{position:relative}
.rx-overlay{position:fixed;inset:0;z-index:20}
.rx-dropdown{position:absolute;z-index:21;top:calc(100% + 4px);left:0;right:0;background:var(--c-bg);border:1px solid var(--c-border2);border-radius:4px;box-shadow:0 8px 24px rgba(0,0,0,0.10);padding:4px;display:flex;flex-direction:column}
.rx-option{display:flex;align-items:center;gap:9px;font-size:13px;color:var(--c-t1);padding:9px 10px;border-radius:3px;cursor:pointer}
.rx-option:hover{background:var(--c-bg2)}
.rx-check{width:16px;height:16px;flex:none;border:1px solid var(--c-border2);border-radius:3px;display:flex;align-items:center;justify-content:center;color:#fff}
.rx-check.on{background:var(--c-info-t);border-color:var(--c-info-t)}
.rx-select-wrap{position:relative}
.rx-screen .rx-select-wrap select{appearance:none;width:100%;box-sizing:border-box;font-size:13px;color:var(--c-t1);padding:11px 34px 11px 13px;border:1px solid var(--c-border2);border-radius:4px;background:var(--c-bg);cursor:pointer}
.rx-screen .rx-select-wrap select.rx-placeholder{color:var(--c-t3)}
.rx-select-ico{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--c-t3);pointer-events:none}
.rx-screen .rx-date{width:100%;box-sizing:border-box;font-size:13px;color:var(--c-t1);padding:10px 13px;border:1px solid var(--c-border2);border-radius:4px;background:var(--c-bg)}
.rx-screen .rx-text{width:100%;box-sizing:border-box;color:var(--c-t1)}
.rx-screen .rx-text::placeholder{color:var(--c-t3)}
.rx-screen input:focus,.rx-screen select:focus{outline:none;border-color:var(--c-info-t);box-shadow:0 0 0 2px var(--c-info-bg)}
.rx-info{display:flex;gap:9px;align-items:flex-start;margin-top:20px;padding:13px 15px;border:1px solid var(--c-info-b);border-radius:4px;background:var(--c-info-bg);font-size:12px;color:var(--c-t2);line-height:1.5}
.rx-info .rx-ico-sm{color:var(--c-info-t);margin-top:1px}
.rx-info-ok{border-color:#a9cdb5;background:#dff0e4;color:#2e5d3f}
.rx-info-ok .rx-ico-sm{color:#2e7a4e}
.rx-link{color:var(--c-info-t);font-weight:600;cursor:pointer}
.rx-card-foot{display:flex;align-items:center;justify-content:space-between;margin-top:22px;padding-top:18px;border-top:1px solid var(--c-border)}
.rx-bottom{display:grid;grid-template-columns:300px 1fr;gap:18px}
.rx-quick,.rx-analytics{background:var(--c-bg);border:1px solid var(--c-border);border-radius:4px;padding:16px 18px}
.rx-quick-label{font-family:var(--c-mono);font-size:10.5px;font-weight:500;color:var(--c-t3);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:12px}
.rx-quick-chip{font-size:12px;color:var(--c-t1);padding:9px 12px;border:1px solid var(--c-border);border-radius:4px;background:var(--c-bg2);margin-bottom:8px;cursor:pointer}
.rx-quick-chip:hover{border-color:var(--c-border2)}
.rx-quick-chip.active{border-color:var(--c-info-t);background:var(--c-info-bg);color:var(--c-info-t);font-weight:600}
.rx-analytics{display:flex;align-items:center;justify-content:space-between;gap:16px}
.rx-analytics-title{font-size:16px;font-weight:600;color:var(--c-t1)}
.rx-analytics-sub{font-size:12px;color:var(--c-t2);margin-top:6px;max-width:340px;line-height:1.5}
.rx-analytics-link{display:inline-flex;align-items:center;gap:5px;margin-top:12px;font-size:13px}
.rx-analytics-badge{width:84px;height:84px;flex:none;border-radius:4px;background:var(--c-info-bg);color:#d4a861;display:flex;align-items:center;justify-content:center}
.rx-analytics-badge .rx-ico{width:34px;height:34px}
.rx-req-table{overflow:auto;border:1px solid var(--c-border);border-radius:4px}
.rx-screen .rx-req-table table{width:100%;border-collapse:collapse;font-size:12px;white-space:nowrap}
.rx-screen .rx-req-table th{position:sticky;top:0;background:var(--c-bg2);text-align:left;font-weight:600;font-size:11px;color:var(--c-t3);padding:9px 12px;border-bottom:1px solid var(--c-border)}
.rx-screen .rx-req-table td{padding:10px 12px;border-bottom:1px solid var(--c-border);color:var(--c-t1)}
.rx-screen .rx-req-table tr:last-child td{border-bottom:none}
.rx-mono{font-family:var(--c-mono);font-size:11.5px}
.rx-empty{text-align:center;color:var(--c-t3);padding:28px 12px}
.rx-badge{display:inline-block;font-size:11px;font-weight:600;padding:3px 9px;border-radius:10px}
.rx-badge-queued{background:#eeebe3;color:#6b6862}
.rx-badge-processing{background:#fbf0dc;color:#a86b1a}
.rx-badge-completed{background:#dff0e4;color:#2e7a4e}
.rx-badge-failed{background:#fae5e0;color:#b5321f}
`;
