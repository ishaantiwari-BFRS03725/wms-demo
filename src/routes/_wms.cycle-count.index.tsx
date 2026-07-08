import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ListOrdered,
  Plus,
  ScanLine,
  Smartphone,
  Boxes,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/wms/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TASKS,
  INITIAL_COUNTS,
  INITIAL_SUSPENSE,
  SKU_BATCHES,
  type BinCount,
  type BatchOption,
  KindTag,
  StatusTag,
  BinTypeTag,
  MetricTile,
} from "@/lib/cycle-count";

export const Route = createFileRoute("/_wms/cycle-count/")({
  head: () => ({ meta: [{ title: "Cycle Count — Inventory" }] }),
  component: CycleCount,
});

function CycleCount() {
  const [mode, setMode] = useState<"supervisor" | "operator">("supervisor");

  const openSuspense = INITIAL_SUSPENSE.filter((e) => e.status === "open").length;
  const awaitingReview = TASKS.filter((t) => t.status === "review").length;
  const active = TASKS.filter((t) => t.status === "in-progress").length;

  return (
    <div>
      <PageHeader
        title="Cycle Count"
        subtitle={mode === "supervisor" ? `INVENTORY · ${active} ACTIVE · ${awaitingReview} AWAITING REVIEW · ${openSuspense} SUSPENSE OPEN` : "INVENTORY"}
        actions={
          <div className="flex items-center gap-1 rounded-[4px] border border-border bg-card p-0.5">
            <ModeButton active={mode === "supervisor"} onClick={() => setMode("supervisor")} icon={<ClipboardCheck className="h-3.5 w-3.5" />} label="Supervisor" />
            <ModeButton active={mode === "operator"} onClick={() => setMode("operator")} icon={<Smartphone className="h-3.5 w-3.5" />} label="Operator HHT" />
          </div>
        }
      />

      <div className="p-7">
        {mode === "supervisor" ? <SupervisorView /> : <OperatorView />}
      </div>
    </div>
  );
}

// ─── Supervisor View ──────────────────────────────────────────────────────────

function SupervisorView() {
  const navigate = useNavigate();
  const openSuspense = INITIAL_SUSPENSE.filter((e) => e.status === "open");
  const allDiscrepancies = Object.values(INITIAL_COUNTS)
    .flat()
    .filter((b) => b.physicalQty !== null && b.physicalQty !== b.systemQty).length;

  return (
    <>
      <div className="mb-6 grid grid-cols-4 gap-4">
        <MetricTile label="Active Tasks" value={TASKS.filter((t) => t.status === "in-progress").length} sub="In progress" />
        <MetricTile label="Awaiting Review" value={TASKS.filter((t) => t.status === "review").length} sub="Supervisor approval" variant="warn" />
        <MetricTile label="Open Discrepancies" value={allDiscrepancies} sub="Across all tasks" variant={allDiscrepancies > 0 ? "risk" : "ok"} />
        <MetricTile label="Suspense Entries" value={openSuspense.length} sub="Pending resolution" variant={openSuspense.length > 0 ? "warn" : "ok"} />
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-6">
        {/* Task list */}
        <div className="rounded-md border border-border bg-card">
          <div className="flex items-center border-b border-border px-4 py-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Count Tasks</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                {["Task ID", "Kind", "Zone", "Progress", "Assigned", "SLA", "Status", ""].map((h) => (
                  <TableHead key={h} className="font-mono text-[10px] uppercase tracking-[0.06em]">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {TASKS.map((task) => {
                const taskCounts = INITIAL_COUNTS[task.id] ?? [];
                const counted = taskCounts.filter((b) => b.physicalQty !== null).length;
                return (
                  <TableRow
                    key={task.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => navigate({ to: "/cycle-count/$taskId", params: { taskId: task.id } })}
                  >
                    <TableCell className="font-mono text-[12px] font-semibold">{task.id}</TableCell>
                    <TableCell><KindTag kind={task.kind} /></TableCell>
                    <TableCell className="text-[12px]">{task.zone}</TableCell>
                    <TableCell className="font-mono text-[12px]">{counted}/{task.totalBins} bins</TableCell>
                    <TableCell className="text-[12px]">{task.assignedTo}</TableCell>
                    <TableCell className="font-mono text-[12px]">{task.sla}</TableCell>
                    <TableCell><StatusTag status={task.status} /></TableCell>
                    <TableCell className="text-muted-foreground">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Suspense ledger summary */}
        <div className="rounded-md border border-border bg-card self-start">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Suspense Ledger</span>
            <span className={cn("font-mono text-[11px]", openSuspense.length > 0 ? "text-warn" : "text-ok")}>
              {openSuspense.length} OPEN
            </span>
          </div>

          <div className="border-b border-border px-4 py-2.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-full gap-1.5 text-[11px]"
              onClick={() => navigate({ to: "/cycle-count/ledger" })}
            >
              <ListOrdered className="h-3.5 w-3.5" />
              View Full Ledger
            </Button>
          </div>

          <div className="divide-y divide-border">
            {INITIAL_SUSPENSE.length === 0 && (
              <div className="px-4 py-6 text-center font-mono text-[11px] uppercase text-muted-foreground">Ledger clear</div>
            )}
            {INITIAL_SUSPENSE.map((e) => (
              <div key={e.id} className={cn("px-4 py-3 text-[11px]", e.status === "reconciled" && "opacity-40")}>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-foreground">{e.id}</span>
                  {e.status === "open" ? (
                    e.excessQty > 0 ? (
                      <span className="rounded-[3px] border border-ok/40 bg-ok-bg px-1.5 py-0.5 font-mono text-[10px] uppercase text-ok">Excess {e.excessQty}</span>
                    ) : (
                      <span className="rounded-[3px] border border-risk/40 bg-risk-bg px-1.5 py-0.5 font-mono text-[10px] uppercase text-risk">Short {e.suspenseQty}</span>
                    )
                  ) : (
                    <span className="rounded-[3px] border border-ok/40 bg-ok-bg px-1.5 py-0.5 font-mono text-[10px] uppercase text-ok">Reconciled</span>
                  )}
                </div>
                <div className="mt-1 text-muted-foreground">
                  <span className="font-mono">{e.binId}</span> · {e.sku} · {e.binType}
                </div>
                <div className="mt-0.5 font-mono text-muted-foreground/70">Lot {e.lot} · MRP ₹{e.mrp} · Pack {e.packSize}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Operator HHT View ────────────────────────────────────────────────────────

interface ScannedLine {
  sku: string;
  skuName: string;
  lot: string;
  qty: number;
}

function OperatorView() {
  const [operatorTaskId, setOperatorTaskId] = useState<string | null>(null);
  const [binIdx, setBinIdx] = useState(0);
  const [lines, setLines] = useState<ScannedLine[]>([]);
  const [scannedItem, setScannedItem] = useState<BinCount | null>(null);
  const [scanInput, setScanInput] = useState("");
  const [batch, setBatch] = useState<string>("");
  const [qty, setQty] = useState("");

  const eligibleTasks = TASKS.filter((t) => t.status === "pending" || t.status === "in-progress");

  function resetScanRow() {
    setScannedItem(null);
    setScanInput("");
    setBatch("");
    setQty("");
  }

  function startTask(id: string) {
    setOperatorTaskId(id);
    setBinIdx(0);
    setLines([]);
    resetScanRow();
  }

  function cancel() {
    setOperatorTaskId(null);
    setBinIdx(0);
    setLines([]);
    resetScanRow();
  }

  if (!operatorTaskId) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-md border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Available Tasks for Counting</span>
          </div>
          {eligibleTasks.length === 0 ? (
            <div className="px-4 py-8 text-center font-mono text-[11px] uppercase text-muted-foreground">No pending tasks — all caught up</div>
          ) : (
            <div className="divide-y divide-border">
              {eligibleTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[13px] font-semibold">{task.id}</span>
                      <KindTag kind={task.kind} />
                      <StatusTag status={task.status} />
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{task.zone} · {task.totalBins} bins · SLA {task.sla}</div>
                  </div>
                  <Button size="sm" className="h-8 gap-1.5 text-[12px]" onClick={() => startTask(task.id)}>
                    <Smartphone className="h-3.5 w-3.5" />
                    Start Count
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-md border border-sys/20 bg-sys-bg px-4 py-3 text-[12px] text-sys">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.06em] text-sys/70">Blind Count Mode</div>
          The operator does not see system quantities. Scan each item, pick its batch, and enter the quantity found — the system reconciles discrepancies later.
        </div>
      </div>
    );
  }

  const taskCounts = INITIAL_COUNTS[operatorTaskId] ?? [];
  const bin = taskCounts[binIdx];
  if (!bin) return null;

  const totalBins = taskCounts.length;
  const progress = Math.round((binIdx / totalBins) * 100);
  const batchOptions: BatchOption[] =
    SKU_BATCHES[bin.sku]?.length ? SKU_BATCHES[bin.sku] : [{ lot: bin.lot, mfd: bin.mfd, expiry: bin.expiry, mrp: bin.mrp }];

  function handleScan() {
    if (!scanInput.trim()) return;
    setScannedItem(bin);
    setBatch(batchOptions[0]?.lot ?? "");
  }

  function handleAdd() {
    const n = parseInt(qty, 10);
    if (!scannedItem || !batch || Number.isNaN(n) || n <= 0) {
      toast.error("Scan an item, pick a batch and enter a quantity");
      return;
    }
    setLines((prev) => [...prev, { sku: scannedItem.sku, skuName: scannedItem.skuName, lot: batch, qty: n }]);
    resetScanRow();
  }

  function handleSubmitBin() {
    if (binIdx + 1 < totalBins) {
      setBinIdx((i) => i + 1);
      setLines([]);
      resetScanRow();
      toast.success("Bin submitted");
    } else {
      toast.success("All bins counted — task sent for supervisor review");
      cancel();
    }
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-sm">
        <div className="rounded-[16px] border-2 border-border bg-background shadow-xl">
          <div className="flex items-center justify-between rounded-t-[14px] border-b border-border bg-muted/50 px-4 py-2.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">HHT · {operatorTaskId}</span>
            <button onClick={cancel} className="rounded p-0.5 text-muted-foreground hover:text-foreground">
              <AlertCircle className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="p-4">
            {/* Progress */}
            <div className="mb-4">
              <div className="mb-1.5 flex justify-between font-mono text-[10px] text-muted-foreground">
                <span>BIN {binIdx + 1} OF {totalBins}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted">
                <div className="h-1.5 rounded-full bg-foreground transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Bin location */}
            <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2.5">
              <Boxes className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-[15px] font-bold">{bin.binId}</span>
              <BinTypeTag type={bin.binType} />
              <span className="ml-auto font-mono text-[10px] uppercase text-muted-foreground">{lines.length} scanned</span>
            </div>

            {/* Scan row */}
            <div className="mb-4 rounded-md border border-border bg-card p-3">
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">Scan Item</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Scan / enter item barcode"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleScan(); }}
                  className="h-9 font-mono text-[12px]"
                />
                <Button size="sm" variant="outline" className="h-9 gap-1 text-[12px]" onClick={handleScan}>
                  <ScanLine className="h-3.5 w-3.5" />
                  Scan
                </Button>
              </div>

              {scannedItem && (
                <div className="mt-3 space-y-3">
                  <div className="rounded-[4px] bg-muted px-3 py-2">
                    <div className="text-[13px] font-medium">{scannedItem.skuName}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{scannedItem.sku}</div>
                  </div>
                  <div>
                    <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">Batch</label>
                    <Select value={batch} onValueChange={setBatch}>
                      <SelectTrigger className="h-9 text-[12px]">
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {batchOptions.map((b) => (
                          <SelectItem key={b.lot} value={b.lot} className="text-[12px]">
                            {b.lot} · MFD {b.mfd} · Exp {b.expiry} · ₹{b.mrp}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">Quantity</label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Units found"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                      className="h-9 text-center font-mono text-[15px] font-bold"
                    />
                  </div>
                  <Button size="sm" className="w-full h-9 gap-1 text-[12px]" onClick={handleAdd}>
                    <Plus className="h-3.5 w-3.5" />
                    Add Item
                  </Button>
                </div>
              )}
            </div>

            {/* Scanned lines */}
            <div className="mb-4 rounded-md border border-border bg-card">
              <div className="border-b border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">Scanned in this bin</div>
              {lines.length === 0 ? (
                <div className="px-3 py-4 text-center font-mono text-[10px] uppercase text-muted-foreground">Nothing scanned yet</div>
              ) : (
                <div className="divide-y divide-border">
                  {lines.map((l, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 text-[11px]">
                      <span className="font-mono font-semibold">{l.sku}</span>
                      <span className="font-mono text-muted-foreground">{l.lot}</span>
                      <span className="ml-auto font-mono font-semibold">×{l.qty}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button className="w-full h-9 text-[13px]" onClick={handleSubmitBin} disabled={lines.length === 0}>
              {binIdx + 1 < totalBins ? "Submit Bin & Next →" : "Submit & Complete Count"}
            </Button>

            <div className="mt-3 rounded-[4px] bg-muted px-3 py-2 font-mono text-[10px] text-muted-foreground">
              Blind count: system quantity is hidden. Scan freely, then submit.
            </div>
          </div>
        </div>

        {/* Bin list */}
        <div className="mt-4 rounded-md border border-border bg-card px-4 py-3">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">Bins</div>
          <div className="flex flex-col gap-1">
            {taskCounts.map((b, i) => (
              <div key={b.binId} className={cn("flex items-center gap-2 text-[11px]", i === binIdx && "font-semibold", i < binIdx && "text-muted-foreground")}>
                <div className={cn("h-1.5 w-1.5 rounded-full", i < binIdx ? "bg-ok" : i === binIdx ? "bg-foreground" : "bg-border")} />
                <span className="font-mono">{b.binId}</span>
                {i < binIdx && <CheckCircle2 className="ml-auto h-3 w-3 text-ok" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ModeButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors",
        active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
