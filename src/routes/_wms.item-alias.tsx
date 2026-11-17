import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Plus, ScanLine, X } from "lucide-react";

export const Route = createFileRoute("/_wms/item-alias")({
  head: () => ({
    meta: [{ title: "Item Alias — Masters" }],
  }),
  component: ItemAlias,
});

// ─── Types & seed data ──────────────────────────────────────────────────────

type AliasType = "Master Carton" | "Inner Carton" | "Outer Carton" | "Others";

interface Item {
  sku: string;
  description: string;
}

interface Alias {
  id: string;
  sku: string;
  description: string;
  packSize: number;
  barcode: string;
  type: AliasType;
}

const ITEMS: Item[] = [
  { sku: "SKU-99201-WH", description: "boAt Airdopes 141 TWS Earbuds" },
  { sku: "SKU-44023-BL", description: "boAt Rockerz 255 Neckband" },
  { sku: "SKU-77312-RD", description: "boAt Stone 350 Bluetooth Speaker" },
  { sku: "SKU-50118-GR", description: "boAt Wave Call Smartwatch" },
  { sku: "SKU-60090-BK", description: "boAt Bassheads 100 Wired Earphones" },
  { sku: "SKU-60100-BK", description: "boAt Type-C 500 Charging Cable" },
  { sku: "SKU-60120-WH", description: "boAt Nirvana Ion ANC Earbuds" },
];

const TYPES: AliasType[] = ["Master Carton", "Inner Carton", "Outer Carton", "Others"];

const INITIAL_ALIASES: Alias[] = [
  { id: "A1", sku: "SKU-99201-WH", description: "boAt Airdopes 141 TWS Earbuds", packSize: 1, barcode: "8901234567890", type: "Others" },
  { id: "A2", sku: "SKU-99201-WH", description: "boAt Airdopes 141 TWS Earbuds", packSize: 6, barcode: "8901234567906", type: "Inner Carton" },
  { id: "A3", sku: "SKU-99201-WH", description: "boAt Airdopes 141 TWS Earbuds", packSize: 12, barcode: "18901234567897", type: "Master Carton" },
  { id: "A4", sku: "SKU-44023-BL", description: "boAt Rockerz 255 Neckband", packSize: 1, barcode: "890123459001", type: "Others" },
  { id: "A5", sku: "SKU-44023-BL", description: "boAt Rockerz 255 Neckband", packSize: 24, barcode: "18901234590018", type: "Outer Carton" },
  { id: "A6", sku: "SKU-77312-RD", description: "boAt Stone 350 Bluetooth Speaker", packSize: 1, barcode: "8901234571234", type: "Others" },
  { id: "A7", sku: "SKU-77312-RD", description: "boAt Stone 350 Bluetooth Speaker", packSize: 6, barcode: "18901234571241", type: "Master Carton" },
  { id: "A8", sku: "SKU-50118-GR", description: "boAt Wave Call Smartwatch", packSize: 1, barcode: "8901234575678", type: "Others" },
  { id: "A9", sku: "SKU-60090-BK", description: "boAt Bassheads 100 Wired Earphones", packSize: 1, barcode: "8901234579012", type: "Others" },
  { id: "A10", sku: "SKU-60090-BK", description: "boAt Bassheads 100 Wired Earphones", packSize: 2, barcode: "28901234579019", type: "Inner Carton" },
  { id: "A11", sku: "SKU-60100-BK", description: "boAt Type-C 500 Charging Cable", packSize: 24, barcode: "18901234582342", type: "Outer Carton" },
  { id: "A12", sku: "SKU-60120-WH", description: "boAt Nirvana Ion ANC Earbuds", packSize: 1, barcode: "8901234585678", type: "Others" },
];

const TYPE_FILTERS: Array<"All" | AliasType> = ["All", ...TYPES];

// ─── Screen ───────────────────────────────────────────────────────────────

function ItemAlias() {
  const [aliases, setAliases] = useState<Alias[]>(INITIAL_ALIASES);
  const [typeFilter, setTypeFilter] = useState<"All" | AliasType>("All");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return aliases.filter(
      (a) =>
        (typeFilter === "All" || a.type === typeFilter) &&
        (q === "" ||
          a.sku.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.barcode.toLowerCase().includes(q)),
    );
  }, [aliases, typeFilter, query]);

  const addAlias = (row: Alias) => {
    setAliases((prev) => [row, ...prev]);
    setCreateOpen(false);
  };

  return (
    <div className="bg-muted/40 p-4">
      <style>{css}</style>
      <div className="ia-screen">
        {/* Top bar */}
        <div className="ia-topbar">
          <div>
            <div className="ia-topbar-title">
              <ScanLine className="ia-ico" aria-hidden="true" />
              Item Alias
            </div>
            <div className="ia-topbar-sub">Map alternate barcodes to a SKU · North-A1 Warehouse</div>
          </div>
          <div className="ia-actions">
            <button className="ia-btn ia-btn-primary" onClick={() => setCreateOpen(true)}>
              <Plus className="ia-ico-sm" aria-hidden="true" />
              Add New Alias
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="ia-filters">
          <span className="ia-filter-label">Type</span>
          {TYPE_FILTERS.map((t) => (
            <span
              key={t}
              className={`ia-chip${typeFilter === t ? " active" : ""}`}
              onClick={() => setTypeFilter(t)}
            >
              {t}
            </span>
          ))}
          <span className="ia-filters-right">
            <input
              className="ia-search"
              placeholder="Search SKU, description or barcode…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </span>
        </div>

        {/* Table */}
        <div className="ia-section-label">Barcode alias register</div>
        <div className="ia-table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Description</th>
                <th>Pack Size</th>
                <th>Barcode</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td className="ia-empty" colSpan={5}>
                    No barcode aliases match these filters.
                  </td>
                </tr>
              ) : (
                visible.map((a) => (
                  <tr key={a.id}>
                    <td className="ia-td-strong ia-mono">{a.sku}</td>
                    <td>{a.description}</td>
                    <td className="ia-muted">{a.packSize} pcs</td>
                    <td className="ia-mono">{a.barcode}</td>
                    <td>
                      <span className={`ia-type type-${a.type.replace(/[^A-Za-z0-9]/g, "")}`}>{a.type}</span>
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
          <CreateAliasModal
            existingBarcodes={aliases.map((a) => a.barcode)}
            onClose={() => setCreateOpen(false)}
            onCreate={addAlias}
          />,
          document.body,
        )}
    </div>
  );
}

// ─── Create modal ─────────────────────────────────────────────────────────

function CreateAliasModal({
  existingBarcodes,
  onClose,
  onCreate,
}: {
  existingBarcodes: string[];
  onClose: () => void;
  onCreate: (row: Alias) => void;
}) {
  const [sku, setSku] = useState(ITEMS[0].sku);
  const [packSize, setPackSize] = useState("1");
  const [barcode, setBarcode] = useState("");
  const [type, setType] = useState<AliasType>("Others");
  const [err, setErr] = useState<string | null>(null);

  const selectedItem = ITEMS.find((i) => i.sku === sku) ?? ITEMS[0];

  const submit = () => {
    const ps = Number(packSize);
    if (!packSize.trim() || !Number.isInteger(ps) || ps <= 0) {
      return setErr("Pack Size must be a whole number greater than 0.");
    }
    const bc = barcode.trim();
    if (!bc) return setErr("Barcode is required.");
    if (existingBarcodes.some((b) => b.toLowerCase() === bc.toLowerCase())) {
      return setErr(`${bc} is already mapped to a SKU.`);
    }
    onCreate({
      id: `A${Date.now()}`,
      sku,
      description: selectedItem.description,
      packSize: ps,
      barcode: bc,
      type,
    });
  };

  return (
    <div className="ia-overlay" onClick={onClose}>
      <style>{css}</style>
      <div className="ia-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ia-topbar">
          <div>
            <div className="ia-topbar-title">
              <ScanLine className="ia-ico" aria-hidden="true" />
              Add New Alias
            </div>
            <div className="ia-topbar-sub">Map a new barcode to an existing SKU</div>
          </div>
          <button className="ia-close" onClick={onClose} aria-label="Close">
            <X className="ia-ico-sm" aria-hidden="true" />
          </button>
        </div>

        <div className="ia-form">
          <div className="ia-grid">
            <div className="ia-field">
              <label>
                SKU<span className="ia-req">*</span>
              </label>
              <div className="ia-select-wrap">
                <select value={sku} onChange={(e) => setSku(e.target.value)}>
                  {ITEMS.map((i) => (
                    <option key={i.sku} value={i.sku}>
                      {i.sku}
                    </option>
                  ))}
                </select>
                <ChevronDown className="ia-ico-sm ia-select-ico" aria-hidden="true" />
              </div>
            </div>
            <div className="ia-field">
              <label>Description</label>
              <input className="ia-input-el" value={selectedItem.description} disabled />
            </div>
            <div className="ia-field">
              <label>
                Pack Size (pcs)<span className="ia-req">*</span>
              </label>
              <input
                className="ia-input-el"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                placeholder="e.g. 1, 6, 12, 24"
                value={packSize}
                onChange={(e) => {
                  setPackSize(e.target.value);
                  setErr(null);
                }}
              />
            </div>
            <div className="ia-field">
              <label>
                Type<span className="ia-req">*</span>
              </label>
              <div className="ia-select-wrap">
                <select value={type} onChange={(e) => setType(e.target.value as AliasType)}>
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <ChevronDown className="ia-ico-sm ia-select-ico" aria-hidden="true" />
              </div>
            </div>
            <div className="ia-field ia-field-full">
              <label>
                Barcode<span className="ia-req">*</span>
              </label>
              <input
                className="ia-input-el ia-mono-input"
                placeholder="e.g. 8901234567890 or SR-99201-WH-02"
                value={barcode}
                onChange={(e) => {
                  setBarcode(e.target.value);
                  setErr(null);
                }}
              />
            </div>
          </div>

          {err && <div className="ia-alert ia-alert-err">{err}</div>}
        </div>

        <div className="ia-form-foot">
          <button className="ia-btn ia-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="ia-btn ia-btn-primary" onClick={submit}>
            <Plus className="ia-ico-sm" aria-hidden="true" />
            Add Alias
          </button>
        </div>
      </div>
    </div>
  );
}

// Scoped styles — prefixed with `.ia-screen` / `.ia-overlay` so selectors never leak.
const css = `
.ia-screen{--c-bg:#ffffff;--c-bg2:#f5f3ee;--c-border:#e2dfd5;--c-border2:#d0ccbf;--c-t1:#1a1a1a;--c-t2:#555555;--c-t3:#8a8a85;--c-info-t:#b8751f;--c-info-b:#e8c389;--c-info-bg:#fbf0dc;--c-green:#2e7a4e;--c-amber:#a86b1a;--c-red:#b5321f;--c-blue:#3a5a99;--c-mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
  background:var(--c-bg);border:1px solid var(--c-border);border-radius:4px;overflow:hidden;font-family:inherit;width:100%}
.ia-overlay{--c-bg:#ffffff;--c-bg2:#f5f3ee;--c-border:#e2dfd5;--c-border2:#d0ccbf;--c-t1:#1a1a1a;--c-t2:#555555;--c-t3:#8a8a85;--c-info-t:#b8751f;--c-info-b:#e8c389;--c-info-bg:#fbf0dc;--c-red:#b5321f;--c-mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
  position:fixed;inset:0;background:rgba(31,29,23,0.45);display:flex;align-items:flex-start;justify-content:center;padding:32px 16px;z-index:100;overflow-y:auto}
.ia-modal{background:var(--c-bg);border:1px solid var(--c-border);border-radius:4px;width:100%;max-width:720px;box-shadow:0 20px 50px rgba(31,29,23,0.25);overflow:hidden}
.ia-close{background:transparent;border:0;color:var(--c-t3);cursor:pointer;padding:4px;border-radius:3px;display:inline-flex;align-items:center}
.ia-close:hover{background:var(--c-bg2);color:var(--c-t1)}
.ia-screen .ia-ico,.ia-modal .ia-ico{width:16px;height:16px;vertical-align:-3px;margin-right:7px;display:inline-block}
.ia-screen .ia-ico-sm,.ia-modal .ia-ico-sm{width:14px;height:14px;flex:none}
.ia-topbar{display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid var(--c-border)}
.ia-topbar-title{font-size:15px;font-weight:600;color:var(--c-t1);display:flex;align-items:center}
.ia-topbar-sub{font-size:12px;color:var(--c-t3);margin-top:2px}
.ia-actions{display:flex;gap:8px}
.ia-screen .ia-btn,.ia-modal .ia-btn{font-size:12px;padding:7px 13px;border:1px solid var(--c-border2);border-radius:4px;background:transparent;color:var(--c-t2);cursor:pointer;display:inline-flex;align-items:center;gap:6px;line-height:1}
.ia-screen .ia-btn-ghost,.ia-modal .ia-btn-ghost{background:var(--c-bg2)}
.ia-screen .ia-btn-primary,.ia-modal .ia-btn-primary{background:#1f1d17;border-color:#1f1d17;color:#fff;font-weight:600}
.ia-screen .ia-btn-primary:hover,.ia-modal .ia-btn-primary:hover{background:#2b281f}
.ia-field{display:flex;flex-direction:column;gap:7px;min-width:0}
.ia-field-full{grid-column:1 / -1}
.ia-field label{font-family:var(--c-mono);font-size:10.5px;font-weight:500;text-transform:uppercase;letter-spacing:0.06em;color:var(--c-t3)}
.ia-req{color:var(--c-red);margin-left:3px}
.ia-screen .ia-input-el,.ia-modal .ia-input-el{width:100%;box-sizing:border-box;font-size:13px;color:var(--c-t1);padding:10px 13px;border:1px solid var(--c-border2);border-radius:4px;background:var(--c-bg)}
.ia-modal .ia-input-el:disabled{color:var(--c-t3);background:var(--c-bg2)}
.ia-modal .ia-mono-input{font-family:var(--c-mono)}
.ia-screen .ia-input-el::placeholder,.ia-modal .ia-input-el::placeholder{color:var(--c-t3)}
.ia-select-wrap{position:relative}
.ia-screen .ia-select-wrap select,.ia-modal .ia-select-wrap select{appearance:none;width:100%;box-sizing:border-box;font-size:13px;color:var(--c-t1);padding:10px 34px 10px 13px;border:1px solid var(--c-border2);border-radius:4px;background:var(--c-bg);cursor:pointer}
.ia-select-ico{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--c-t3);pointer-events:none}
.ia-modal input:focus,.ia-modal select:focus{outline:none;border-color:var(--c-info-t);box-shadow:0 0 0 2px var(--c-info-bg)}
.ia-alert{margin-top:12px;padding:10px 13px;border-radius:4px;font-size:12px;line-height:1.4;border:1px solid transparent}
.ia-alert-err{background:#fae5e0;color:#b5321f;border-color:rgba(181,50,31,0.3)}
.ia-filters{display:flex;gap:8px;padding:10px 18px;border-bottom:1px solid var(--c-border);flex-wrap:wrap;align-items:center}
.ia-filter-label{font-family:var(--c-mono);font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:var(--c-t3);margin-right:4px}
.ia-filters-right{margin-left:auto;display:flex;gap:8px;align-items:center}
.ia-chip{font-size:11px;padding:4px 11px;border:1px solid var(--c-border);border-radius:4px;color:var(--c-t2);background:var(--c-bg2);cursor:pointer;user-select:none}
.ia-chip:hover{border-color:var(--c-border2)}
.ia-chip.active{border-color:var(--c-info-b);color:var(--c-info-t);background:var(--c-info-bg);font-weight:600}
.ia-screen .ia-search{font-size:12px;padding:6px 10px;border:1px solid var(--c-border2);border-radius:4px;background:var(--c-bg);color:var(--c-t1);width:260px}
.ia-screen .ia-search::placeholder{color:var(--c-t3)}
.ia-section-label{font-family:var(--c-mono);font-size:10.5px;font-weight:500;color:var(--c-t3);padding:12px 18px 8px;letter-spacing:0.08em;text-transform:uppercase}
.ia-table-wrap{margin:0 18px 16px;overflow:auto;border:1px solid var(--c-border);border-radius:4px}
.ia-screen table{width:100%;border-collapse:collapse;font-size:12px;white-space:nowrap}
.ia-screen th{position:sticky;top:0;z-index:1;background:var(--c-bg2);text-align:left;font-family:var(--c-mono);font-weight:500;font-size:10.5px;text-transform:uppercase;letter-spacing:0.06em;color:var(--c-t3);padding:7px 10px;border-bottom:1px solid var(--c-border)}
.ia-screen td{padding:9px 10px;border-bottom:1px solid var(--c-border);color:var(--c-t1);vertical-align:middle}
.ia-screen tr:last-child td{border-bottom:none}
.ia-td-strong{font-weight:700}
.ia-mono{font-family:var(--c-mono);font-size:11px}
.ia-muted{color:var(--c-t3)}
.ia-empty{text-align:center;color:var(--c-t3);padding:26px 12px}
.ia-type{display:inline-block;font-family:var(--c-mono);font-size:9.5px;font-weight:600;letter-spacing:0.06em;padding:2px 8px;border-radius:2px;border:1px solid transparent;text-transform:uppercase}
.type-MasterCarton{background:var(--c-info-bg);color:var(--c-info-t);border-color:var(--c-info-b)}
.type-InnerCarton{background:#dff0e4;color:var(--c-green);border-color:rgba(46,122,78,0.3)}
.type-OuterCarton{background:#e6ecf5;color:var(--c-blue);border-color:rgba(58,90,153,0.3)}
.type-Others{background:#eeebe3;color:var(--c-t2);border-color:rgba(107,104,98,0.3)}
.ia-form{padding:18px 22px}
.ia-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px 20px}
.ia-form-foot{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:16px 22px;border-top:1px solid var(--c-border)}
`;
