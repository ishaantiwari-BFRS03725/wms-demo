import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  RotateCcw,
  Search,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/wms/page-header";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_wms/safety-stock")({
  head: () => ({
    meta: [{ title: "Safety Stock — Inventory" }],
  }),
  component: SafetyStock,
});

// ─── Data ─────────────────────────────────────────────────────────────────────

const WAREHOUSES = ["Dasna", "Bhiwandi"];

interface SafetyStockRow {
  sku: string;
  name: string;
  warehouse: string;
  qty: number;
  updatedAt: string;
}

const CURRENT_SAFETY_STOCK: SafetyStockRow[] = [
  { sku: "600179", name: "boAt Airdopes 141 TWS Earbuds", warehouse: "Dasna", qty: 150, updatedAt: "28/09/2026" },
  { sku: "600822", name: "boAt Rockerz 450 Bluetooth Headphones", warehouse: "Dasna", qty: 40, updatedAt: "28/09/2026" },
  { sku: "600868", name: "boAt Bassheads 100 Wired Earphones", warehouse: "Dasna", qty: 60, updatedAt: "25/09/2026" },
  { sku: "600900", name: "boAt Stone 350 Bluetooth Speaker", warehouse: "Dasna", qty: 10, updatedAt: "25/09/2026" },
  { sku: "601005", name: "boAt Aavante Bar 1160 Soundbar", warehouse: "Dasna", qty: 8, updatedAt: "22/09/2026" },
  { sku: "601020", name: "boAt Immortal 1300 Gaming Headset", warehouse: "Dasna", qty: 15, updatedAt: "22/09/2026" },
  { sku: "601000", name: "boAt Wave Call Smartwatch", warehouse: "Bhiwandi", qty: 12, updatedAt: "27/09/2026" },
  { sku: "601002", name: "boAt Type-C 500 Charging Cable", warehouse: "Bhiwandi", qty: 80, updatedAt: "27/09/2026" },
  { sku: "601010", name: "boAt Nirvana Ion ANC Earbuds", warehouse: "Bhiwandi", qty: 25, updatedAt: "24/09/2026" },
  { sku: "601005", name: "boAt Aavante Bar 1160 Soundbar", warehouse: "Bhiwandi", qty: 6, updatedAt: "20/09/2026" },
  { sku: "601015", name: "boAt Lunar Connect Smartwatch Strap", warehouse: "Bhiwandi", qty: 20, updatedAt: "20/09/2026" },
];

interface UploadSummary {
  total: number;
  successful: number;
  failed: number;
  duplicate: number;
  updated: number;
  new: number;
}

const MOCK_SUMMARY: UploadSummary = {
  total: 340,
  successful: 332,
  failed: 8,
  duplicate: 4,
  updated: 201,
  new: 131,
};

// ─── Screen ───────────────────────────────────────────────────────────────────

function SafetyStock() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [summary, setSummary] = useState<UploadSummary | null>(null);
  const [query, setQuery] = useState("");
  const [whFilter, setWhFilter] = useState("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFileName(null);
    setSummary(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = () => {
    if (!fileName) {
      toast.error("Please upload an Excel / CSV file first");
      return;
    }
    setSummary(MOCK_SUMMARY);
    toast.success("Safety stock levels uploaded");
  };

  const filteredRows = CURRENT_SAFETY_STOCK.filter((r) => {
    if (whFilter !== "all" && r.warehouse !== whFilter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${r.sku} ${r.name}`.toLowerCase().includes(q);
  });

  const downloadTemplate = () => {
    const header = ["SKU No*", "WH Name*", "Safety Stock Qty*", "Create/Update"];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    // Sample rows illustrating create (blank), update, and delete.
    const sample = [
      ["600179", "Dasna", "150", ""],
      ["601002", "Bhiwandi", "80", "Update"],
      ["600900", "Dasna", "", "Delete"],
    ];
    const lines = [
      header.map(escape).join(","),
      ...sample.map((r) => r.map(escape).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "safety-stock-upload-template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const exportCsv = () => {
    const header = ["SKU Code", "Item", "Warehouse", "Safety Stock Qty", "Last Updated"];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [
      header.map(escape).join(","),
      ...CURRENT_SAFETY_STOCK.map((r) =>
        [r.sku, r.name, r.warehouse, String(r.qty), r.updatedAt]
          .map(escape)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "safety-stock.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Safety stock exported");
  };

  return (
    <div>
      <PageHeader
        title="Safety Stock"
        subtitle="Safety Stock Level Upload — minimum buffer quantity to hold per SKU, per warehouse, before low-stock exceptions trigger."
      />

      <div className="space-y-6 p-6">
        {/* ── Upload Safety Stock Levels ──────────────────────────────────── */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="text-sm font-semibold">Upload Safety Stock Levels</div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download Template
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3 p-4">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFileName(f.name);
                  setSummary(null);
                }
              }}
            />
            {fileName ? (
              <div className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <FileSpreadsheet className="h-4 w-4 shrink-0 text-ok" />
                  <span className="truncate text-sm font-medium">{fileName}</span>
                </div>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={reset}
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-2 rounded-md border-2 border-dashed border-border px-4 py-2.5 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
              >
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Click to upload Excel / CSV
                </span>
                <span className="text-xs text-muted-foreground">
                  .xlsx, .xls or .csv
                </span>
              </button>
            )}
            <Button onClick={handleUpload}>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </div>

          {/* Template format & rules */}
          <div className="border-t border-border bg-muted/20 px-4 py-3">
            <div className="mb-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
              Template columns
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["SKU No*", "WH Name*", "Safety Stock Qty*", "Create/Update"].map(
                (col) => (
                  <span
                    key={col}
                    className="rounded-md border border-border bg-background px-2 py-0.5 font-mono text-xs"
                  >
                    {col}
                  </span>
                ),
              )}
            </div>
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              <li>
                <span className="font-semibold text-foreground">Create:</span>{" "}
                add a safety stock level for a SKU at a warehouse — leave the
                last column blank.
              </li>
              <li>
                <span className="font-semibold text-foreground">Update:</span>{" "}
                change an existing SKU + warehouse's safety stock quantity —
                write <span className="font-mono">Update</span> in the last
                column.
              </li>
              <li>
                <span className="font-semibold text-foreground">Delete:</span>{" "}
                remove a SKU + warehouse's safety stock mapping entirely — write{" "}
                <span className="font-mono">Delete</span> in the last column.
              </li>
            </ul>
            <p className="mt-2 text-[11px] text-muted-foreground">
              * SKU No, WH Name and Safety Stock Qty are mandatory (Qty not
              required when deleting). WH Name must match one of{" "}
              {WAREHOUSES.join(", ")}.
            </p>
          </div>
        </Card>

        {/* ── Current Safety Stock ───────────────────────────────────────── */}
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
            <div className="text-sm font-semibold">Current Safety Stock</div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={whFilter}
                onChange={(e) => setWhFilter(e.target.value)}
                className="h-9 rounded-md border border-border bg-background px-2.5 text-sm"
              >
                <option value="all">All Warehouses</option>
                {WAREHOUSES.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search SKU or item…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-9 w-60 pl-8 pr-8"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {filteredRows.length} of {CURRENT_SAFETY_STOCK.length} SKUs
              </span>
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[7rem_1fr_7rem_8rem_7rem] gap-3 border-b border-border bg-muted/30 px-5 py-2.5 text-[10px] font-semibold font-mono uppercase tracking-[0.08em] text-muted-foreground">
            <span>SKU Code</span>
            <span>Item</span>
            <span>Warehouse</span>
            <span className="text-right">Safety Stock Qty</span>
            <span className="text-right">Last Updated</span>
          </div>

          {/* Rows */}
          {filteredRows.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No SKUs match your search.
            </div>
          ) : (
            filteredRows.map((r, i) => (
              <div
                key={`${r.sku}-${r.warehouse}-${i}`}
                className="grid grid-cols-[7rem_1fr_7rem_8rem_7rem] items-center gap-3 border-b border-border px-5 py-2.5 text-sm last:border-0"
              >
                <span className="font-mono font-medium">{r.sku}</span>
                <span className="truncate text-muted-foreground">{r.name}</span>
                <span>{r.warehouse}</span>
                <span className="text-right font-mono tabular-nums">{r.qty}</span>
                <span className="text-right text-xs text-muted-foreground">
                  {r.updatedAt}
                </span>
              </div>
            ))
          )}
        </Card>

        {/* ── Upload summary ─────────────────────────────────────────────── */}
        {summary && (
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="text-sm font-semibold">Upload Completed</div>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                New upload
              </Button>
            </div>

            <div className="space-y-5 p-5">
              {/* Banner */}
              <div className="flex items-start gap-3 rounded-md border border-ok/30 bg-ok-bg p-4 text-ok">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <div className="text-sm font-semibold">
                    Safety stock levels saved
                  </div>
                  <div className="mt-0.5 text-xs">
                    Safety stock quantities updated for the uploaded SKU +
                    warehouse combinations.
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <Stat label="Total Records" value={summary.total} />
                <Stat label="Successful" value={summary.successful} tone="green" />
                <Stat label="Failed" value={summary.failed} tone="red" />
                <Stat label="Duplicate" value={summary.duplicate} tone="amber" />
                <Stat label="Updated" value={summary.updated} />
                <Stat label="New" value={summary.new} />
              </div>

              {/* Error report */}
              {summary.failed > 0 && (
                <div className="flex items-center justify-between rounded-md border border-warn/30 bg-warn-bg px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-warn" />
                    <div className="text-sm text-warn">
                      <span className="font-semibold">
                        {summary.failed} records failed
                      </span>{" "}
                      validation — download the report to review and fix them.
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.success("Error report downloaded")}
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Error report
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Small building blocks ────────────────────────────────────────────────────

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "green" | "red" | "amber";
}) {
  const color =
    tone === "green"
      ? "text-ok"
      : tone === "red"
        ? "text-risk"
        : tone === "amber"
          ? "text-warn"
          : "text-foreground";
  return (
    <div className="rounded-md border border-border p-3">
      <div className={cn("text-2xl font-bold tabular-nums", color)}>{value}</div>
      <div className="mt-0.5 text-[11px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
