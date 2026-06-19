import { Link, createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
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

export const Route = createFileRoute("/_wms/replenishment-setup")({
  head: () => ({
    meta: [{ title: "Replenishment Setup — Inventory" }],
  }),
  component: ReplenishmentSetup,
});

// ─── Data ─────────────────────────────────────────────────────────────────────

const WAREHOUSES = [
  { code: "DEL01", name: "Delhi — Bilaspur" },
  { code: "MUM01", name: "Mumbai — Bhiwandi" },
  { code: "BLR01", name: "Bengaluru — Hoskote" },
  { code: "HYD01", name: "Hyderabad — Medchal" },
];

interface PolicyRow {
  sku: string;
  name: string;
  min: number;
  max: number;
  updatedAt: string;
}

const CURRENT_POLICY: PolicyRow[] = [
  { sku: "600179", name: "boAt Airdopes 141 TWS Earbuds", min: 20, max: 100, updatedAt: "09/06/2026" },
  { sku: "600822", name: "boAt Rockerz 450 Bluetooth Headphones", min: 10, max: 50, updatedAt: "09/06/2026" },
  { sku: "600868", name: "boAt Bassheads 100 Wired Earphones", min: 15, max: 75, updatedAt: "08/06/2026" },
  { sku: "600900", name: "boAt Stone 350 Bluetooth Speaker", min: 8, max: 40, updatedAt: "08/06/2026" },
  { sku: "601000", name: "boAt Wave Call Smartwatch", min: 12, max: 60, updatedAt: "07/06/2026" },
  { sku: "601002", name: "boAt Type-C 500 Charging Cable", min: 30, max: 150, updatedAt: "07/06/2026" },
  { sku: "601005", name: "boAt Aavante Bar 1160 Soundbar", min: 5, max: 25, updatedAt: "05/06/2026" },
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
  total: 500,
  successful: 495,
  failed: 5,
  duplicate: 8,
  updated: 312,
  new: 183,
};

// ─── Screen ───────────────────────────────────────────────────────────────────

function ReplenishmentSetup() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [summary, setSummary] = useState<UploadSummary | null>(null);
  const [query, setQuery] = useState("");
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
    toast.success("Min-Max policy uploaded");
  };

  const filteredPolicy = CURRENT_POLICY.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${p.sku} ${p.name}`.toLowerCase().includes(q);
  });

  const downloadTemplate = () => {
    const header = [
      "SKU No*",
      "Minimum Quantity*",
      "Max Quantity*",
      "Create/Update",
    ];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    // Sample rows illustrating create (blank), update, and delete.
    const sample = [
      ["600179", "20", "100", ""],
      ["600822", "15", "60", "Update"],
      ["600900", "", "", "Delete"],
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
    a.download = "min-max-upload-template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const exportPolicyCsv = () => {
    const header = [
      "SKU Code",
      "Item",
      "Minimum Qty",
      "Maximum Qty",
      "Last Updated",
    ];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [
      header.map(escape).join(","),
      ...CURRENT_POLICY.map((p) =>
        [p.sku, p.name, String(p.min), String(p.max), p.updatedAt]
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
    a.download = "min-max-policy.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Min-Max policy exported");
  };

  return (
    <div>
      <PageHeader
        title="Replenishment Setup"
        subtitle="Min-Max Replenishment Policy Upload — stock thresholds the replenishment engine uses to refill pick-face from reserve / bulk storage."
      />

      <div className="space-y-6 p-6">
      <Link
        to="/replenishment"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Replenishment
      </Link>

      {/* ── Upload Min-Max Policy ──────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="text-sm font-semibold">Upload Min-Max Policy</div>
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
            {["SKU No*", "Minimum Quantity*", "Max Quantity*", "Create/Update"].map(
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
              add a new SKU with its Min and Max quantity — leave the last column
              blank.
            </li>
            <li>
              <span className="font-semibold text-foreground">Update:</span>{" "}
              change an existing SKU's Min/Max — write{" "}
              <span className="font-mono">Update</span> in the last column.
            </li>
            <li>
              <span className="font-semibold text-foreground">Delete:</span>{" "}
              remove a SKU's mapping entirely — write{" "}
              <span className="font-mono">Delete</span> in the last column.
            </li>
          </ul>
          <p className="mt-2 text-[11px] text-muted-foreground">
            * SKU No, Minimum Quantity and Max Quantity are mandatory (Min/Max not
            required when deleting).
          </p>
        </div>
      </Card>

      {/* ── Current Min-Max Policy ─────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div className="text-sm font-semibold">Current Min-Max Policy</div>
          <div className="flex items-center gap-3">
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
              {filteredPolicy.length} of {CURRENT_POLICY.length} SKUs
            </span>
            <Button variant="outline" size="sm" onClick={exportPolicyCsv}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[7rem_1fr_6rem_6rem_7rem] gap-3 border-b border-border bg-muted/30 px-5 py-2.5 text-[10px] font-semibold font-mono uppercase tracking-[0.08em] text-muted-foreground">
          <span>SKU Code</span>
          <span>Item</span>
          <span className="text-right">Minimum Qty</span>
          <span className="text-right">Maximum Qty</span>
          <span className="text-right">Last Updated</span>
        </div>

        {/* Rows */}
        {filteredPolicy.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No SKUs match your search.
          </div>
        ) : (
          filteredPolicy.map((p) => (
            <div
              key={p.sku}
              className="grid grid-cols-[7rem_1fr_6rem_6rem_7rem] items-center gap-3 border-b border-border px-5 py-2.5 text-sm last:border-0"
            >
              <span className="font-mono font-medium">{p.sku}</span>
              <span className="truncate text-muted-foreground">{p.name}</span>
              <span className="text-right font-mono tabular-nums">{p.min}</span>
              <span className="text-right font-mono tabular-nums">{p.max}</span>
              <span className="text-right text-xs text-muted-foreground">
                {p.updatedAt}
              </span>
            </div>
          ))
        )}
      </Card>

      {/* ── Step 3: Summary / Confirmation ─────────────────────────────────── */}
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
                  Replenishment policy saved
                </div>
                <div className="mt-0.5 text-xs">
                  Min-Max thresholds updated for the uploaded SKUs.
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
                    <span className="font-semibold">{summary.failed} records failed</span>{" "}
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  value,
  onYes,
  onNo,
}: {
  value: boolean;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <div className="flex w-32 rounded-md border border-border bg-muted/40 p-1">
      <button
        type="button"
        onClick={onYes}
        className={cn(
          "flex-1 rounded-[2px] py-1.5 text-sm font-medium transition-colors",
          value ? "bg-background text-foreground" : "text-muted-foreground",
        )}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={onNo}
        className={cn(
          "flex-1 rounded-[2px] py-1.5 text-sm font-medium transition-colors",
          !value ? "bg-background text-foreground" : "text-muted-foreground",
        )}
      >
        No
      </button>
    </div>
  );
}

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
