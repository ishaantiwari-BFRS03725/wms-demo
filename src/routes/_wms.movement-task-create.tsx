import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  ArrowLeftRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Package,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_wms/movement-task-create")({
  head: () => ({
    meta: [{ title: "Create Movement Tasks — Inventory" }],
  }),
  component: MovementTaskCreate,
});

// ─── Types & data ─────────────────────────────────────────────────────────────

interface CreatedTask {
  id: string;
  type: "item" | "bin";
  from: string;
  to: string;
  sku?: string;
  skuName?: string;
  binNo?: string;
  qty?: number;
  reason: string;
  createdAt: string;
}

const SKU_OPTIONS = [
  { sku: "600179", name: "boAt Airdopes 141 TWS Earbuds" },
  { sku: "600822", name: "boAt Rockerz 450 Bluetooth Headphones" },
  { sku: "600868", name: "boAt Bassheads 100 Wired Earphones" },
  { sku: "600900", name: "boAt Stone 350 Bluetooth Speaker" },
  { sku: "601000", name: "boAt Wave Call Smartwatch" },
  { sku: "601002", name: "boAt Type-C 500 Charging Cable" },
  { sku: "601005", name: "boAt Aavante Bar 1160 Soundbar" },
];

const ITEM_REASONS = [
  "Replenishment · Bulk → Pick",
  "Consolidation · Merge bins",
  "Putaway · Inward → Bulk",
  "Quality hold · Move to quarantine",
  "Customer request",
];

const BIN_REASONS = [
  "Relocation · Bulk reorg",
  "Putaway · Receiving → Bulk",
  "Warehouse reorganization",
  "Quality hold",
];

const UPLOAD_PREVIEW: CreatedTask[] = [
  {
    id: "MOV-3010",
    type: "item",
    from: "BULK16-02",
    to: "PICK01-A1",
    sku: "600179",
    skuName: "boAt Airdopes 141 TWS Earbuds",
    qty: 30,
    reason: "Replenishment · Bulk → Pick",
    createdAt: "09/06/2026 14:22",
  },
  {
    id: "MOV-3011",
    type: "item",
    from: "BULK09-13",
    to: "PICK02-B3",
    sku: "600822",
    skuName: "boAt Rockerz 450 Bluetooth Headphones",
    qty: 12,
    reason: "Replenishment · Bulk → Pick",
    createdAt: "09/06/2026 14:22",
  },
  {
    id: "MOV-3012",
    type: "item",
    from: "RX-LPN-208",
    to: "BULK09-13",
    sku: "601005",
    skuName: "boAt Aavante Bar 1160 Soundbar",
    qty: 36,
    reason: "Putaway · Inward → Bulk",
    createdAt: "09/06/2026 14:22",
  },
  {
    id: "BMV-4010",
    type: "bin",
    from: "BULK16-02",
    to: "BULK10-14",
    binNo: "BIN-C07-201",
    reason: "Relocation · Bulk reorg",
    createdAt: "09/06/2026 14:22",
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

function MovementTaskCreate() {
  const [tab, setTab] = useState<"form" | "upload">("form");
  const [tasks, setTasks] = useState<CreatedTask[]>([]);
  const [uploadPreview, setUploadPreview] = useState<CreatedTask[] | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const movCounterRef = useRef(3004);
  const binCounterRef = useRef(4003);

  const addTask = (task: CreatedTask) => {
    setTasks((prev) => [task, ...prev]);
    toast.success(`Task ${task.id} created`);
  };

  const removeTask = (id: string) =>
    setTasks((prev) => prev.filter((t) => t.id !== id));

  const importPreview = () => {
    if (!uploadPreview) return;
    setTasks((prev) => [...uploadPreview, ...prev]);
    setUploadPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success(`${uploadPreview.length} tasks imported`);
  };

  const nextMovId = () => `MOV-${movCounterRef.current++}`;
  const nextBinId = () => `BMV-${binCounterRef.current++}`;

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold">Create Movement Tasks</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Add item or bin movement tasks individually via form, or bulk-import
          from an Excel / CSV file.
        </p>
      </div>

      {/* Create card */}
      <Card className="overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-border">
          {(["form", "upload"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "px-5 py-3 text-sm font-medium transition-colors",
                tab === t
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "form" ? "Create via Form" : "Upload Excel / CSV"}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === "form" ? (
            <TaskForm
              onAdd={(formData) => {
                const isItem = formData.type === "item";
                const skuEntry = SKU_OPTIONS.find(
                  (s) => s.sku === formData.sku,
                );
                addTask({
                  id: isItem ? nextMovId() : nextBinId(),
                  type: formData.type,
                  from: formData.from,
                  to: formData.to,
                  sku: isItem ? formData.sku : undefined,
                  skuName: isItem ? skuEntry?.name : undefined,
                  binNo: !isItem ? formData.binNo : undefined,
                  qty: isItem ? Number(formData.qty) : undefined,
                  reason: formData.reason,
                  createdAt: new Date().toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                });
              }}
            />
          ) : (
            <UploadTab
              fileInputRef={fileInputRef}
              preview={uploadPreview}
              onFileChange={() => setUploadPreview(UPLOAD_PREVIEW)}
              onImport={importPreview}
              onClear={() => {
                setUploadPreview(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            />
          )}
        </div>
      </Card>

      {/* Created tasks */}
      {tasks.length > 0 && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="text-sm font-semibold">
              Created Tasks{" "}
              <span className="ml-1.5 rounded-[3px] bg-primary px-1.5 py-0.5 font-mono text-[10px] font-medium leading-none text-primary-foreground">
                {tasks.length}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              These tasks will appear in the operator's queue
            </div>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[2rem_6rem_5rem_1fr_1fr_6rem_6rem_3rem] gap-3 border-b border-border bg-muted/30 px-5 py-2.5 text-[10px] font-semibold font-mono uppercase tracking-[0.08em] text-muted-foreground">
            <span>#</span>
            <span>Task ID</span>
            <span>Type</span>
            <span>From</span>
            <span>To</span>
            <span>SKU / Bin</span>
            <span>Qty / Reason</span>
            <span />
          </div>

          <div className="divide-y divide-border">
            {tasks.map((t, i) => (
              <div
                key={t.id}
                className="grid grid-cols-[2rem_6rem_5rem_1fr_1fr_6rem_6rem_3rem] items-center gap-3 px-5 py-3 text-sm"
              >
                <span className="text-xs text-muted-foreground">{i + 1}</span>
                <span className="font-mono text-xs font-semibold">{t.id}</span>
                <span>
                  {t.type === "item" ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium">
                      <ArrowLeftRight className="h-2.5 w-2.5" />
                      Item
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      <Package className="h-2.5 w-2.5" />
                      Bin
                    </span>
                  )}
                </span>
                <span className="font-mono text-xs">{t.from}</span>
                <span className="font-mono text-xs">{t.to}</span>
                <span className="truncate font-mono text-xs text-muted-foreground">
                  {t.sku ?? t.binNo ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t.qty != null ? `${t.qty} units` : t.reason.split(" ·")[0]}
                </span>
                <button
                  type="button"
                  onClick={() => removeTask(t.id)}
                  className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tasks.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
          <CheckCircle2 className="h-8 w-8 opacity-30" />
          <p className="text-sm">No tasks created yet</p>
        </div>
      )}
    </div>
  );
}

// ─── Form tab ─────────────────────────────────────────────────────────────────

interface FormData {
  type: "item" | "bin";
  from: string;
  to: string;
  sku: string;
  qty: string;
  binNo: string;
  reason: string;
}

function TaskForm({ onAdd }: { onAdd: (data: FormData) => void }) {
  const [formType, setFormType] = useState<"item" | "bin">("item");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState("");
  const [binNo, setBinNo] = useState("");
  const [reason, setReason] = useState("");

  const reasons = formType === "item" ? ITEM_REASONS : BIN_REASONS;

  const isValid =
    from.trim() &&
    to.trim() &&
    reason &&
    (formType === "bin"
      ? binNo.trim()
      : sku && qty && Number(qty) > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    if (from.trim().toUpperCase() === to.trim().toUpperCase()) {
      toast.error("From and To locations cannot be the same");
      return;
    }
    onAdd({ type: formType, from: from.trim(), to: to.trim(), sku, qty, binNo: binNo.trim(), reason });
    setFrom("");
    setTo("");
    setSku("");
    setQty("");
    setBinNo("");
    setReason("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type toggle */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
          Task type
        </label>
        <div className="flex overflow-hidden rounded-md border border-border w-fit">
          {(["item", "bin"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setFormType(t);
                setReason("");
                setSku("");
                setBinNo("");
              }}
              className={cn(
                "px-5 py-2 text-xs font-medium transition-colors",
                formType === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted/50",
              )}
            >
              {t === "item" ? "Item Movement" : "Bin Movement"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* From */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
            From {formType === "bin" ? "Location" : "Bin"}
          </label>
          <Input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="e.g. BULK16-02"
            className="font-mono"
          />
        </div>

        {/* To */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
            To {formType === "bin" ? "Location" : "Bin"}
          </label>
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="e.g. PICK01-A1"
            className="font-mono"
          />
        </div>
      </div>

      {formType === "item" ? (
        <div className="grid grid-cols-2 gap-4">
          {/* SKU */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
              SKU
            </label>
            <Select value={sku} onValueChange={setSku}>
              <SelectTrigger className="font-mono">
                <SelectValue placeholder="Select SKU…" />
              </SelectTrigger>
              <SelectContent>
                {SKU_OPTIONS.map((s) => (
                  <SelectItem key={s.sku} value={s.sku}>
                    <span className="font-mono">{s.sku}</span>
                    <span className="ml-2 text-muted-foreground">
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
              Quantity
            </label>
            <Input
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 50"
              className="font-mono"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <label className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
            Bin No
          </label>
          <Input
            value={binNo}
            onChange={(e) => setBinNo(e.target.value)}
            placeholder="e.g. BIN-A12-402"
            className="font-mono"
          />
        </div>
      )}

      {/* Reason */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
          Reason
        </label>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger>
            <SelectValue placeholder="Select reason…" />
          </SelectTrigger>
          <SelectContent>
            {reasons.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={!isValid} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Task
      </Button>
    </form>
  );
}

// ─── Upload tab ───────────────────────────────────────────────────────────────

function UploadTab({
  fileInputRef,
  preview,
  onFileChange,
  onImport,
  onClear,
}: {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  preview: CreatedTask[] | null;
  onFileChange: () => void;
  onImport: () => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Drop zone */}
      {!preview ? (
        <div
          className="flex cursor-pointer flex-col items-center gap-3 rounded-md border-2 border-dashed border-border px-6 py-12 transition-colors hover:border-primary/40 hover:bg-muted/20"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
            <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              Click to upload or drag and drop
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Accepts .xlsx and .csv files
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" type="button">
            <Upload className="h-3.5 w-3.5" />
            Choose file
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
      ) : null}

      {/* Template download */}
      {!preview && (
        <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Download template</p>
            <p className="text-xs text-muted-foreground">
              Use the provided template to ensure correct column formatting
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 shrink-0"
            type="button"
            onClick={() => toast.info("Template download would start here")}
          >
            <Download className="h-3.5 w-3.5" />
            Template
          </Button>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">
                Preview — {preview.length} tasks found
              </p>
              <p className="text-xs text-muted-foreground">
                Review before importing
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={onClear}
              >
                Cancel
              </Button>
              <Button size="sm" type="button" onClick={onImport} className="gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Import {preview.length} tasks
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-border">
            <div className="grid grid-cols-[5rem_5rem_1fr_1fr_6rem_6rem] gap-3 border-b border-border bg-muted/30 px-4 py-2.5 text-[10px] font-semibold font-mono uppercase tracking-[0.08em] text-muted-foreground">
              <span>Task ID</span>
              <span>Type</span>
              <span>From</span>
              <span>To</span>
              <span>SKU / Bin</span>
              <span>Qty / —</span>
            </div>
            <div className="divide-y divide-border">
              {preview.map((t) => (
                <div
                  key={t.id}
                  className="grid grid-cols-[5rem_5rem_1fr_1fr_6rem_6rem] items-center gap-3 px-4 py-3 text-sm"
                >
                  <span className="font-mono text-xs font-semibold">
                    {t.id}
                  </span>
                  <span>
                    {t.type === "item" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium">
                        <ArrowLeftRight className="h-2.5 w-2.5" />
                        Item
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        <Package className="h-2.5 w-2.5" />
                        Bin
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-xs">{t.from}</span>
                  <span className="font-mono text-xs">{t.to}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {t.sku ?? t.binNo ?? "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t.qty != null ? `${t.qty} units` : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
