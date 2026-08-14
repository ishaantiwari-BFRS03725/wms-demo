import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/wms/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TASKS, INITIAL_COUNTS } from "@/lib/cycle-count";

export const Route = createFileRoute("/_wms/cycle-count/supervisor-review")({
  head: () => ({ meta: [{ title: "Supervisor Review — Inventory" }] }),
  component: SupervisorReviewList,
});

type Decision = "accepted" | "rejected";

function rowKey(taskId: string, binId: string) {
  return `${taskId}-${binId}`;
}

function SupervisorReviewList() {
  const rows = useMemo(
    () =>
      TASKS.flatMap((task) =>
        (INITIAL_COUNTS[task.id] ?? [])
          .filter((bin) => bin.physicalQty !== null)
          .map((bin) => {
            const diffQty = bin.physicalQty! - bin.systemQty;
            const status = diffQty === 0 ? "OK" : diffQty > 0 ? "Excess" : "Short";
            const diffAmount = diffQty * bin.mrp;
            return { taskId: task.id, status, diffQty, diffAmount, key: rowKey(task.id, bin.binId), ...bin };
          }),
      ),
    [],
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

  const pendingRows = rows.filter((r) => !decisions[r.key]);
  const allPendingSelected = pendingRows.length > 0 && pendingRows.every((r) => selected.has(r.key));

  function toggleRow(key: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(pendingRows.map((r) => r.key)) : new Set());
  }

  function decideRows(keys: string[], decision: Decision) {
    setDecisions((prev) => {
      const next = { ...prev };
      keys.forEach((k) => (next[k] = decision));
      return next;
    });
    setSelected((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => next.delete(k));
      return next;
    });
    toast.success(`${keys.length} bin${keys.length > 1 ? "s" : ""} ${decision}`);
  }

  function decideOne(key: string, decision: Decision) {
    decideRows([key], decision);
  }

  function decideSelected(decision: Decision) {
    if (selected.size === 0) return;
    decideRows([...selected], decision);
  }

  return (
    <div>
      <PageHeader title="Supervisor Review" subtitle={`INVENTORY · ${rows.length} COUNTED BINS`} />

      <div className="p-7">
        <Link to="/cycle-count" className="mb-4 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Cycle Count
        </Link>

        <div className="rounded-md border border-border bg-card">
          {selected.size > 0 && (
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                {selected.size} SELECTED
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 text-[11px]"
                  onClick={() => decideSelected("rejected")}
                >
                  <X className="h-3.5 w-3.5" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  className="h-7 gap-1.5 text-[11px]"
                  onClick={() => decideSelected("accepted")}
                >
                  <Check className="h-3.5 w-3.5" />
                  Accept
                </Button>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-9">
                  <Checkbox
                    checked={allPendingSelected}
                    onCheckedChange={(c) => toggleAll(!!c)}
                    disabled={pendingRows.length === 0}
                    aria-label="Select all"
                  />
                </TableHead>
                {["Task ID", "Status", "Bin", "SKU", "Lot", "MFG", "Expiry", "MRP", "Pack Size", "System", "Physical", "Diff Qty", "Diff Amount"].map((h) => (
                  <TableHead key={h} className="font-mono text-[10px] uppercase tracking-[0.06em]">{h}</TableHead>
                ))}
                <TableHead className="font-mono text-[10px] uppercase tracking-[0.06em]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} className="py-8 text-center font-mono text-[11px] uppercase text-muted-foreground">
                    No counted bins yet
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => {
                  const decision = decisions[r.key];
                  return (
                    <TableRow key={r.key} className={cn(decision && "opacity-50")}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(r.key)}
                          onCheckedChange={(c) => toggleRow(r.key, !!c)}
                          disabled={!!decision}
                          aria-label={`Select ${r.key}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-[12px] font-semibold">{r.taskId}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-[3px] border px-1.5 py-0.5 font-mono text-[10px] uppercase",
                          r.status === "OK" && "border-ok/40 bg-ok-bg text-ok",
                          r.status === "Excess" && "border-warn/40 bg-warn-bg text-warn",
                          r.status === "Short" && "border-risk/40 bg-risk-bg text-risk",
                        )}>
                          {r.status}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-[12px] font-semibold">{r.binId}</TableCell>
                      <TableCell className="font-mono text-[11px]">{r.sku}</TableCell>
                      <TableCell className="font-mono text-[11px]">{r.lot}</TableCell>
                      <TableCell className="font-mono text-[11px] whitespace-nowrap">{r.mfd}</TableCell>
                      <TableCell className="font-mono text-[11px] whitespace-nowrap">{r.expiry}</TableCell>
                      <TableCell className="text-right font-mono text-[12px]">₹{r.mrp}</TableCell>
                      <TableCell className="text-right font-mono text-[12px]">{r.packSize}</TableCell>
                      <TableCell className="text-right font-mono text-[12px]">{r.systemQty}</TableCell>
                      <TableCell className="text-right font-mono text-[12px]">{r.physicalQty}</TableCell>
                      <TableCell className="text-right font-mono text-[12px]">
                        <span className={cn(r.diffQty > 0 ? "text-ok" : r.diffQty < 0 ? "text-risk" : "text-muted-foreground")}>
                          {r.diffQty > 0 ? `+${r.diffQty}` : r.diffQty === 0 ? "—" : r.diffQty}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-[12px]">
                        <span className={cn(r.diffAmount > 0 ? "text-ok" : r.diffAmount < 0 ? "text-risk" : "text-muted-foreground")}>
                          {r.diffAmount === 0 ? "—" : `${r.diffAmount > 0 ? "+" : "-"}₹${Math.abs(r.diffAmount)}`}
                        </span>
                      </TableCell>
                      <TableCell>
                        {decision ? (
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-[3px] border px-1.5 py-0.5 font-mono text-[10px] uppercase",
                            decision === "accepted" ? "border-ok/40 bg-ok-bg text-ok" : "border-risk/40 bg-risk-bg text-risk",
                          )}>
                            {decision}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={() => decideOne(r.key, "rejected")}
                              aria-label="Reject"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => decideOne(r.key, "accepted")}
                              aria-label="Accept"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
