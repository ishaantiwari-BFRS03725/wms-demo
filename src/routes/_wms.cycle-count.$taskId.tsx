import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/wms/page-header";
import { Button } from "@/components/ui/button";
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
  runReconciliation,
  BinTypeTag,
  type ReconciliationStep,
} from "@/lib/cycle-count";

export const Route = createFileRoute("/_wms/cycle-count/$taskId")({
  head: () => ({ meta: [{ title: "Cycle Count Task — Inventory" }] }),
  component: CycleCountDetail,
});

function CycleCountDetail() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();
  const task = TASKS.find((t) => t.id === taskId);
  const counts = INITIAL_COUNTS[taskId] ?? [];

  const [steps, setSteps] = useState<ReconciliationStep[]>([]);
  const [adjusted, setAdjusted] = useState(false);

  if (!task) {
    return (
      <div>
        <PageHeader title="Cycle Count Task" subtitle="NOT FOUND" />
        <div className="p-7">
          <Link to="/cycle-count" className="font-mono text-[12px] text-sys hover:underline">← Back to Cycle Count</Link>
          <p className="mt-4 text-[13px] text-muted-foreground">Task “{taskId}” was not found.</p>
        </div>
      </div>
    );
  }

  const counted = counts.filter((b) => b.physicalQty !== null).length;

  function handleAdjust() {
    const { steps: newSteps } = runReconciliation(counts, INITIAL_SUSPENSE);
    setSteps(newSteps);
    setAdjusted(true);
    const resolved = newSteps.filter((s) => s.type === "reconcile").length;
    const pna = newSteps.filter((s) => s.type === "pna").length;
    toast.success(`Adjustment complete — ${resolved} resolved, ${pna} PNA`);
  }

  function handleReject() {
    toast.success(`${task!.id} sent back to operator for rescan`);
    navigate({ to: "/cycle-count" });
  }

  return (
    <div>
      <PageHeader
        title={`Cycle Count · ${task.id}`}
        subtitle={`${task.zone.toUpperCase()} · ${task.assignedTo.toUpperCase()} · ${counted}/${task.totalBins} BINS COUNTED`}
        actions={
          <div className="flex items-center gap-2">
            {!adjusted ? (
              <>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-[12px]" onClick={handleReject}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reject &amp; Rescan
                </Button>
                <Button size="sm" className="h-8 gap-1.5 text-[12px]" onClick={handleAdjust}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Adjust
                </Button>
              </>
            ) : (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-ok">
                <CheckCircle2 className="h-4 w-4" />
                RECONCILED
              </span>
            )}
          </div>
        }
      />

      <div className="p-7">
        <Link to="/cycle-count" className="mb-4 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Cycle Count
        </Link>

        <div className="flex flex-col gap-4">
          {/* Bin count table */}
          <div className="rounded-md border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Bin Counts</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  {["Bin", "Type", "SKU", "Lot", "MFG", "Expiry", "MRP", "Pack Size", "System", "Physical", "Delta", "Status"].map((h) => (
                    <TableHead key={h} className="font-mono text-[10px] uppercase tracking-[0.06em]">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {counts.map((bin) => {
                  const delta = bin.physicalQty !== null ? bin.physicalQty - bin.systemQty : null;
                  const isPna = bin.lot === "LOT-X99";
                  return (
                    <TableRow key={bin.binId} className={cn(isPna && "bg-risk-bg/30")}>
                      <TableCell className="font-mono text-[12px] font-semibold">{bin.binId}</TableCell>
                      <TableCell><BinTypeTag type={bin.binType} /></TableCell>
                      <TableCell className="font-mono text-[11px]">{bin.sku}</TableCell>
                      <TableCell className="font-mono text-[11px]">{bin.lot}</TableCell>
                      <TableCell className="font-mono text-[11px] whitespace-nowrap">{bin.mfd}</TableCell>
                      <TableCell className="font-mono text-[11px] whitespace-nowrap">{bin.expiry}</TableCell>
                      <TableCell className="text-right font-mono text-[12px]">₹{bin.mrp}</TableCell>
                      <TableCell className="text-right font-mono text-[12px]">{bin.packSize}</TableCell>
                      <TableCell className="text-right font-mono text-[12px]">{bin.systemQty}</TableCell>
                      <TableCell className="text-right font-mono text-[12px]">
                        {bin.physicalQty !== null ? bin.physicalQty : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right font-mono text-[12px]">
                        {delta !== null ? (
                          <span className={cn(delta > 0 ? "text-ok" : delta < 0 ? "text-risk" : "text-muted-foreground")}>
                            {delta > 0 ? `+${delta}` : delta === 0 ? "—" : delta}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {bin.physicalQty === null ? (
                          <span className="inline-flex items-center gap-1 rounded-[3px] border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">Pending</span>
                        ) : isPna ? (
                          <span className="inline-flex items-center gap-1 rounded-[3px] border border-risk/40 bg-risk-bg px-1.5 py-0.5 font-mono text-[10px] uppercase text-risk">PNA</span>
                        ) : delta === 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-[3px] border border-ok/40 bg-ok-bg px-1.5 py-0.5 font-mono text-[10px] uppercase text-ok">OK</span>
                        ) : delta! > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-[3px] border border-warn/40 bg-warn-bg px-1.5 py-0.5 font-mono text-[10px] uppercase text-warn">Excess</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-[3px] border border-risk/40 bg-risk-bg px-1.5 py-0.5 font-mono text-[10px] uppercase text-risk">Short</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Reconciliation log */}
          {steps.length > 0 && (
            <div className="rounded-md border border-border bg-card">
              <div className="border-b border-border px-4 py-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Reconciliation Log</span>
              </div>
              <div className="divide-y divide-border">
                {steps.map((step, i) => (
                  <div
                    key={i}
                    className={cn("flex items-start gap-2.5 px-4 py-2.5", step.type === "global" && step.result === "info" && "bg-muted/40")}
                  >
                    <div className="mt-0.5 shrink-0">
                      {step.result === "ok" && <CheckCircle2 className="h-3.5 w-3.5 text-ok" />}
                      {step.result === "warn" && <TriangleAlert className="h-3.5 w-3.5 text-warn" />}
                      {step.result === "risk" && <AlertCircle className="h-3.5 w-3.5 text-risk" />}
                      {step.result === "info" && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                    <span className={cn(
                      "text-[12px] leading-relaxed",
                      step.result === "ok" && "text-foreground",
                      step.result === "warn" && "text-warn",
                      step.result === "risk" && "text-risk",
                      step.result === "info" && "text-muted-foreground",
                      (step.type === "global" || step.type === "info") && step.result === "info" && "font-mono text-[11px]",
                    )}>
                      {step.message}
                    </span>
                    {step.qty !== undefined && step.type === "reconcile" && (
                      <span className="ml-auto shrink-0 rounded-[3px] border border-ok/40 bg-ok-bg px-1.5 py-0.5 font-mono text-[10px] text-ok">
                        QTY {step.qty}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
