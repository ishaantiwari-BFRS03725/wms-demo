import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Ban, ChevronDown, Plus, X } from "lucide-react";
import { SELLER_DIRECTORY } from "@/lib/wms/gate-entry-data";

export const Route = createFileRoute("/_wms/reject-reason-master")({
  head: () => ({
    meta: [{ title: "Reject Reason Master — Masters" }],
  }),
  component: RejectReasonMaster,
});

// ─── Types & seed data ──────────────────────────────────────────────────────

type Level = "L1" | "L2" | "L3";
type Applicability = "Inbound GRN" | "Sales Return QC" | "Both";

interface RejectReason {
  code: string; // Reason Code — primary key, e.g. DMG_PACK
  description: string; // Reason Description shown in the QC/GRN picker
  extCode: string; // External system code — blank until mapped
  level: Level;
  seller: string;
  storageSubtype?: string; // optional storage subtype mapping
  applicability: Applicability;
  vasEligible: boolean;
}

const SELLERS = SELLER_DIRECTORY.map((s) => s.name);

const INITIAL_REASONS: RejectReason[] = [
  {
    code: "DMG_PACK",
    description: "Damaged Packaging",
    extCode: "",
    level: "L1",
    seller: SELLERS[0],
    storageSubtype: "Fragile",
    applicability: "Inbound GRN",
    vasEligible: true,
  },
  {
    code: "EXP_STOCK",
    description: "Expired Product",
    extCode: "",
    level: "L2",
    seller: SELLERS[1],
    applicability: "Inbound GRN",
    vasEligible: false,
  },
  {
    code: "WRG_SKU",
    description: "Wrong Item",
    extCode: "",
    level: "L1",
    seller: SELLERS[2],
    applicability: "Both",
    vasEligible: false,
  },
  {
    code: "QTY_MISMATCH",
    description: "Quantity Mismatch",
    extCode: "",
    level: "L2",
    seller: SELLERS[3],
    applicability: "Inbound GRN",
    vasEligible: false,
  },
  {
    code: "MRP_MISSING",
    description: "MRP Tag Missing",
    extCode: "",
    level: "L1",
    seller: SELLERS[4],
    storageSubtype: "High Value",
    applicability: "Inbound GRN",
    vasEligible: true,
  },
  {
    code: "BARCODE_UNREADABLE",
    description: "Barcode Unreadable",
    extCode: "",
    level: "L3",
    seller: SELLERS[5],
    applicability: "Both",
    vasEligible: false,
  },
  {
    code: "SIZE_MISMATCH",
    description: "Size / Colour Mismatch",
    extCode: "",
    level: "L1",
    seller: SELLERS[6],
    applicability: "Sales Return QC",
    vasEligible: false,
  },
  {
    code: "LABEL_TORN",
    description: "Torn Label",
    extCode: "",
    level: "L2",
    seller: SELLERS[7],
    applicability: "Inbound GRN",
    vasEligible: false,
  },
  {
    code: "LEAK_LIQUID",
    description: "Liquid Leakage",
    extCode: "",
    level: "L1",
    seller: SELLERS[8],
    storageSubtype: "Hazmat",
    applicability: "Both",
    vasEligible: true,
  },
  {
    code: "SET_INCOMPLETE",
    description: "Incomplete Set",
    extCode: "",
    level: "L2",
    seller: SELLERS[9],
    applicability: "Sales Return QC",
    vasEligible: false,
  },
  {
    code: "SEAL_BROKEN",
    description: "Seal Broken",
    extCode: "",
    level: "L1",
    seller: SELLERS[0],
    applicability: "Sales Return QC",
    vasEligible: false,
  },
  {
    code: "WRONG_BATCH",
    description: "Wrong Batch",
    extCode: "",
    level: "L3",
    seller: SELLERS[1],
    applicability: "Inbound GRN",
    vasEligible: false,
  },
  {
    code: "TEMP_BREACH",
    description: "Temperature Breach",
    extCode: "",
    level: "L1",
    seller: SELLERS[2],
    storageSubtype: "Cold Storage",
    applicability: "Inbound GRN",
    vasEligible: true,
  },
  {
    code: "DUP_SCAN",
    description: "Duplicate Scan",
    extCode: "",
    level: "L3",
    seller: SELLERS[3],
    applicability: "Both",
    vasEligible: false,
  },
  {
    code: "WT_MISMATCH",
    description: "Weight Mismatch",
    extCode: "",
    level: "L2",
    seller: SELLERS[4],
    applicability: "Inbound GRN",
    vasEligible: false,
  },
  {
    code: "INV_MISSING",
    description: "Missing Invoice / Challan",
    extCode: "",
    level: "L2",
    seller: SELLERS[5],
    applicability: "Inbound GRN",
    vasEligible: false,
  },
  {
    code: "COUNTERFEIT",
    description: "Counterfeit Suspected",
    extCode: "",
    level: "L1",
    seller: SELLERS[6],
    storageSubtype: "High Value",
    applicability: "Both",
    vasEligible: true,
  },
  {
    code: "WRONG_CARTON",
    description: "Wrong Carton Received",
    extCode: "",
    level: "L3",
    seller: SELLERS[7],
    applicability: "Inbound GRN",
    vasEligible: false,
  },
];

const LEVEL_FILTERS: Array<"All" | Level> = ["All", "L1", "L2", "L3"];

// ─── Screen ───────────────────────────────────────────────────────────────

function RejectReasonMaster() {
  const [reasons, setReasons] = useState<RejectReason[]>(INITIAL_REASONS);
  const [levelFilter, setLevelFilter] = useState<"All" | Level>("All");
  const [sellerFilter, setSellerFilter] = useState<"All" | string>("All");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reasons.filter(
      (r) =>
        (levelFilter === "All" || r.level === levelFilter) &&
        (sellerFilter === "All" || r.seller === sellerFilter) &&
        (q === "" || r.code.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)),
    );
  }, [reasons, levelFilter, sellerFilter, query]);

  const addReason = (row: RejectReason) => {
    setReasons((prev) => [row, ...prev]);
    setCreateOpen(false);
  };

  return (
    <div className="bg-muted/40 p-4">
      <style>{css}</style>
      <div className="rr-screen">
        {/* Top bar */}
        <div className="rr-topbar">
          <div>
            <div className="rr-topbar-title">
              <Ban className="rr-ico" aria-hidden="true" />
              Reject Reason Master
            </div>
            <div className="rr-topbar-sub">QC &amp; GRN rejection reasons · North-A1 Warehouse</div>
          </div>
          <div className="rr-actions">
            <button className="rr-btn rr-btn-primary" onClick={() => setCreateOpen(true)}>
              <Plus className="rr-ico-sm" aria-hidden="true" />
              Add New Reason
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="rr-filters">
          <span className="rr-filter-label">Level</span>
          {LEVEL_FILTERS.map((l) => (
            <span
              key={l}
              className={`rr-chip${levelFilter === l ? " active" : ""}`}
              onClick={() => setLevelFilter(l)}
            >
              {l}
            </span>
          ))}
          <span className="rr-filters-right">
            <input
              className="rr-search"
              placeholder="Search code or reason…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="rr-select-wrap rr-select-sm">
              <select value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)}>
                <option value="All">All Sellers</option>
                {SELLERS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="rr-ico-sm rr-select-ico" aria-hidden="true" />
            </div>
          </span>
        </div>

        {/* Table */}
        <div className="rr-section-label">Reject reason register</div>
        <div className="rr-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reason Code</th>
                <th>Reject Reason</th>
                <th>Level</th>
                <th>Seller</th>
                <th>Storage Subtype</th>
                <th>Applicability</th>
                <th>VAS Eligible</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td className="rr-empty" colSpan={7}>
                    No reject reasons match these filters.
                  </td>
                </tr>
              ) : (
                visible.map((r) => (
                  <tr key={r.code}>
                    <td className="rr-td-strong rr-mono">{r.code}</td>
                    <td>{r.description}</td>
                    <td>
                      <span className={`rr-level level-${r.level}`}>{r.level}</span>
                    </td>
                    <td>{r.seller}</td>
                    <td className="rr-muted">{r.storageSubtype || "—"}</td>
                    <td>{r.applicability}</td>
                    <td>
                      <span className={`rr-badge ${r.vasEligible ? "badge-yes" : "badge-no"}`}>
                        {r.vasEligible ? "Yes" : "No"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {createOpen &&
        createPortal(
          <CreateReasonModal
            existingCodes={reasons.map((r) => r.code)}
            onClose={() => setCreateOpen(false)}
            onCreate={addReason}
          />,
          document.body,
        )}
    </div>
  );
}

// ─── Create modal ─────────────────────────────────────────────────────────

function CreateReasonModal({
  existingCodes,
  onClose,
  onCreate,
}: {
  existingCodes: string[];
  onClose: () => void;
  onCreate: (row: RejectReason) => void;
}) {
  const [code, setCode] = useState("");
  const [seller, setSeller] = useState(SELLERS[0]);
  const [description, setDescription] = useState("");
  const [storageSubtype, setStorageSubtype] = useState("");
  const [applicability, setApplicability] = useState<Applicability>("Both");
  const [vasEligible, setVasEligible] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    const rc = code.trim().toUpperCase().replace(/\s+/g, "_");
    if (!rc) return setErr("Reason Code is required.");
    if (existingCodes.includes(rc)) return setErr(`${rc} already exists.`);
    if (!description.trim()) return setErr("Reason Description is required.");
    if (!seller) return setErr("Seller is required.");
    onCreate({
      code: rc,
      description: description.trim(),
      extCode: "",
      level: "L1",
      seller,
      storageSubtype: storageSubtype.trim() || undefined,
      applicability,
      vasEligible,
    });
  };

  return (
    <div className="rr-overlay" onClick={onClose}>
      <style>{css}</style>
      <div className="rr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rr-topbar">
          <div>
            <div className="rr-topbar-title">
              <Ban className="rr-ico" aria-hidden="true" />
              Add New Reject Reason
            </div>
            <div className="rr-topbar-sub">Register a new QC / GRN rejection reason</div>
          </div>
          <button className="rr-close" onClick={onClose} aria-label="Close">
            <X className="rr-ico-sm" aria-hidden="true" />
          </button>
        </div>

        <div className="rr-form">
          <div className="rr-grid">
            <div className="rr-field">
              <label>
                Reason Code (Primary Key)<span className="rr-req">*</span>
              </label>
              <input
                className="rr-input-el rr-mono-input"
                placeholder="e.g. DMG_PACK"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setErr(null);
                }}
              />
            </div>
            <div className="rr-field">
              <label>
                Seller<span className="rr-req">*</span>
              </label>
              <div className="rr-select-wrap">
                <select value={seller} onChange={(e) => setSeller(e.target.value)}>
                  {SELLERS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="rr-ico-sm rr-select-ico" aria-hidden="true" />
              </div>
            </div>
            <div className="rr-field rr-field-full">
              <label>
                Reason Description<span className="rr-req">*</span>
              </label>
              <input
                className="rr-input-el"
                placeholder='e.g. "Seal Broken", "Liquid Leakage", "Wrong Item"'
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setErr(null);
                }}
              />
            </div>
            <div className="rr-field">
              <label>Storage Subtype Mapping</label>
              <input
                className="rr-input-el"
                placeholder="Optional — e.g. Fragile, Cold Storage"
                value={storageSubtype}
                onChange={(e) => setStorageSubtype(e.target.value)}
              />
            </div>
            <div className="rr-field">
              <label>
                Process Applicability<span className="rr-req">*</span>
              </label>
              <div className="rr-select-wrap">
                <select
                  value={applicability}
                  onChange={(e) => setApplicability(e.target.value as Applicability)}
                >
                  <option value="Inbound GRN">Inbound GRN</option>
                  <option value="Sales Return QC">Sales Return QC</option>
                  <option value="Both">Both</option>
                </select>
                <ChevronDown className="rr-ico-sm rr-select-ico" aria-hidden="true" />
              </div>
            </div>
            <div className="rr-field">
              <label>VAS Eligibility</label>
              <div className="rr-toggle">
                <button
                  type="button"
                  className={!vasEligible ? "active" : ""}
                  onClick={() => setVasEligible(false)}
                >
                  No
                </button>
                <button
                  type="button"
                  className={vasEligible ? "active" : ""}
                  onClick={() => setVasEligible(true)}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>

          {err && <div className="rr-alert rr-alert-err">{err}</div>}
        </div>

        <div className="rr-form-foot">
          <button className="rr-btn rr-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="rr-btn rr-btn-primary" onClick={submit}>
            <Plus className="rr-ico-sm" aria-hidden="true" />
            Add Reason
          </button>
        </div>
      </div>
    </div>
  );
}

// Scoped styles — prefixed with `.rr-screen` / `.rr-overlay` so selectors never leak.
const css = `
.rr-screen{--c-bg:#ffffff;--c-bg2:#f5f3ee;--c-border:#e2dfd5;--c-border2:#d0ccbf;--c-t1:#1a1a1a;--c-t2:#555555;--c-t3:#8a8a85;--c-info-t:#b8751f;--c-info-b:#e8c389;--c-info-bg:#fbf0dc;--c-green:#2e7a4e;--c-amber:#a86b1a;--c-red:#b5321f;--c-mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
  background:var(--c-bg);border:1px solid var(--c-border);border-radius:4px;overflow:hidden;font-family:inherit;width:100%}
.rr-overlay{--c-bg:#ffffff;--c-bg2:#f5f3ee;--c-border:#e2dfd5;--c-border2:#d0ccbf;--c-t1:#1a1a1a;--c-t2:#555555;--c-t3:#8a8a85;--c-info-t:#b8751f;--c-info-b:#e8c389;--c-info-bg:#fbf0dc;--c-red:#b5321f;--c-mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
  position:fixed;inset:0;background:rgba(31,29,23,0.45);display:flex;align-items:flex-start;justify-content:center;padding:32px 16px;z-index:100;overflow-y:auto}
.rr-modal{background:var(--c-bg);border:1px solid var(--c-border);border-radius:4px;width:100%;max-width:720px;box-shadow:0 20px 50px rgba(31,29,23,0.25);overflow:hidden}
.rr-close{background:transparent;border:0;color:var(--c-t3);cursor:pointer;padding:4px;border-radius:3px;display:inline-flex;align-items:center}
.rr-close:hover{background:var(--c-bg2);color:var(--c-t1)}
.rr-screen .rr-ico,.rr-modal .rr-ico{width:16px;height:16px;vertical-align:-3px;margin-right:7px;display:inline-block}
.rr-screen .rr-ico-sm,.rr-modal .rr-ico-sm{width:14px;height:14px;flex:none}
.rr-topbar{display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid var(--c-border)}
.rr-topbar-title{font-size:15px;font-weight:600;color:var(--c-t1);display:flex;align-items:center}
.rr-topbar-sub{font-size:12px;color:var(--c-t3);margin-top:2px}
.rr-actions{display:flex;gap:8px}
.rr-screen .rr-btn,.rr-modal .rr-btn{font-size:12px;padding:7px 13px;border:1px solid var(--c-border2);border-radius:4px;background:transparent;color:var(--c-t2);cursor:pointer;display:inline-flex;align-items:center;gap:6px;line-height:1}
.rr-screen .rr-btn-ghost,.rr-modal .rr-btn-ghost{background:var(--c-bg2)}
.rr-screen .rr-btn-primary,.rr-modal .rr-btn-primary{background:#1f1d17;border-color:#1f1d17;color:#fff;font-weight:600}
.rr-screen .rr-btn-primary:hover,.rr-modal .rr-btn-primary:hover{background:#2b281f}
.rr-field{display:flex;flex-direction:column;gap:7px;min-width:0}
.rr-field-full{grid-column:1 / -1}
.rr-field label{font-family:var(--c-mono);font-size:10.5px;font-weight:500;text-transform:uppercase;letter-spacing:0.06em;color:var(--c-t3)}
.rr-req{color:var(--c-red);margin-left:3px}
.rr-screen .rr-input-el,.rr-modal .rr-input-el{width:100%;box-sizing:border-box;font-size:13px;color:var(--c-t1);padding:10px 13px;border:1px solid var(--c-border2);border-radius:4px;background:var(--c-bg)}
.rr-modal .rr-mono-input{font-family:var(--c-mono);text-transform:uppercase}
.rr-screen .rr-input-el::placeholder,.rr-modal .rr-input-el::placeholder{color:var(--c-t3)}
.rr-select-wrap{position:relative}
.rr-screen .rr-select-wrap select,.rr-modal .rr-select-wrap select{appearance:none;width:100%;box-sizing:border-box;font-size:13px;color:var(--c-t1);padding:10px 34px 10px 13px;border:1px solid var(--c-border2);border-radius:4px;background:var(--c-bg);cursor:pointer}
.rr-select-ico{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--c-t3);pointer-events:none}
.rr-select-sm select{padding-top:6px;padding-bottom:6px;font-size:12px}
.rr-modal input:focus,.rr-modal select:focus{outline:none;border-color:var(--c-info-t);box-shadow:0 0 0 2px var(--c-info-bg)}
.rr-modal .rr-toggle{display:grid;grid-template-columns:1fr 1fr;gap:1px;border:1px solid var(--c-border2);border-radius:4px;overflow:hidden}
.rr-modal .rr-toggle button{border:0;background:var(--c-bg2);color:var(--c-t2);font-size:13px;padding:9px 0;cursor:pointer}
.rr-modal .rr-toggle button.active{background:#1f1d17;color:#fff;font-weight:600}
.rr-alert{margin-top:12px;padding:10px 13px;border-radius:4px;font-size:12px;line-height:1.4;border:1px solid transparent}
.rr-alert-err{background:#fae5e0;color:#b5321f;border-color:rgba(181,50,31,0.3)}
.rr-filters{display:flex;gap:8px;padding:10px 18px;border-bottom:1px solid var(--c-border);flex-wrap:wrap;align-items:center}
.rr-filter-label{font-family:var(--c-mono);font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:var(--c-t3);margin-right:4px}
.rr-filters-right{margin-left:auto;display:flex;gap:8px;align-items:center}
.rr-chip{font-size:11px;padding:4px 11px;border:1px solid var(--c-border);border-radius:4px;color:var(--c-t2);background:var(--c-bg2);cursor:pointer;user-select:none}
.rr-chip:hover{border-color:var(--c-border2)}
.rr-chip.active{border-color:var(--c-info-b);color:var(--c-info-t);background:var(--c-info-bg);font-weight:600}
.rr-screen .rr-search{font-size:12px;padding:6px 10px;border:1px solid var(--c-border2);border-radius:4px;background:var(--c-bg);color:var(--c-t1);width:200px}
.rr-screen .rr-search::placeholder{color:var(--c-t3)}
.rr-section-label{font-family:var(--c-mono);font-size:10.5px;font-weight:500;color:var(--c-t3);padding:12px 18px 8px;letter-spacing:0.08em;text-transform:uppercase}
.rr-table-wrap{margin:0 18px 16px;overflow:auto;border:1px solid var(--c-border);border-radius:4px}
.rr-screen table{width:100%;border-collapse:collapse;font-size:12px;white-space:nowrap}
.rr-screen th{position:sticky;top:0;z-index:1;background:var(--c-bg2);text-align:left;font-family:var(--c-mono);font-weight:500;font-size:10.5px;text-transform:uppercase;letter-spacing:0.06em;color:var(--c-t3);padding:7px 10px;border-bottom:1px solid var(--c-border)}
.rr-screen td{padding:9px 10px;border-bottom:1px solid var(--c-border);color:var(--c-t1);vertical-align:middle}
.rr-screen tr:last-child td{border-bottom:none}
.rr-td-strong{font-weight:700}
.rr-mono{font-family:var(--c-mono);font-size:11px}
.rr-muted{color:var(--c-t3)}
.rr-empty{text-align:center;color:var(--c-t3);padding:26px 12px}
.rr-level{display:inline-block;font-family:var(--c-mono);font-size:9.5px;font-weight:600;letter-spacing:0.06em;padding:2px 8px;border-radius:2px;border:1px solid transparent}
.level-L1{background:#fae5e0;color:#b5321f;border-color:rgba(181,50,31,0.3)}
.level-L2{background:var(--c-info-bg);color:var(--c-info-t);border-color:var(--c-info-b)}
.level-L3{background:#e6ecf5;color:#3a5a99;border-color:rgba(58,90,153,0.3)}
.rr-badge{display:inline-block;font-family:var(--c-mono);font-size:9.5px;padding:2px 8px;border-radius:2px;font-weight:500;text-transform:uppercase;letter-spacing:0.06em;border:1px solid transparent}
.badge-yes{background:#dff0e4;color:#2e7a4e;border-color:rgba(46,122,78,0.3)}
.badge-no{background:#eeebe3;color:#6b6862;border-color:rgba(107,104,98,0.3)}
.rr-form{padding:18px 22px}
.rr-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px 20px}
.rr-form-foot{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:16px 22px;border-top:1px solid var(--c-border)}
`;
