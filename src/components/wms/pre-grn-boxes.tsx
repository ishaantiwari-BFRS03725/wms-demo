import { useMemo, useState } from "react";
import { History, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import {
  REPRINT_REASONS,
  logReprint,
  preGrnBarcodePattern,
  type BoxRecord,
  type BoxStatus,
} from "@/lib/wms/pre-grn-data";

const BOX_STATUS_BADGE: Record<BoxStatus, string> = {
  Open: "bg-ai-bg text-ai border-ai/30",
  Received: "bg-sys-bg text-sys border-sys/30",
  Closed: "bg-ok-bg text-ok border-ok/30",
  Voided: "bg-risk-bg text-risk border-risk/30",
};

export function BoxStatusBadge({ status }: { status: BoxStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[3px] border px-2 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em]",
        BOX_STATUS_BADGE[status],
      )}
    >
      {status}
    </span>
  );
}

export interface BoxLabelData {
  boxId: string;
  sku: string;
  skuName: string;
  batch: string;
  expiry: string;
  caseSize: number;
  mrp?: string;
}

export function BoxLabel({ box, reprint = false }: { box: BoxLabelData; reprint?: boolean }) {
  const bars = useMemo(() => preGrnBarcodePattern(box.boxId), [box.boxId]);
  return (
    <div className="relative overflow-hidden rounded-md border-2 border-dashed border-border bg-background p-4">
      {reprint && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rotate-[-18deg] font-mono text-2xl font-bold uppercase tracking-widest text-destructive/20">
            Reprint
          </span>
        </div>
      )}
      <div className="flex h-10 items-end gap-[1px]">
        {bars.map((w, i) => (
          <div
            key={i}
            style={{ width: w * 2 }}
            className={cn("h-full", i % 2 === 0 ? "bg-foreground" : "bg-transparent")}
          />
        ))}
      </div>
      <div className="mt-2 font-mono text-sm font-bold tracking-wider">{box.boxId}</div>
      <div className="my-2 border-t border-dashed border-border" />
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.06em]">
        <LabelRow label="SKU" value={box.sku} />
        <LabelRow label="Case" value={`${box.caseSize} pcs`} />
        <LabelRow label="Batch" value={box.batch || "—"} />
        <LabelRow label="Expiry" value={box.expiry || "—"} />
      </dl>
      <div className="mt-2 truncate text-[11px] text-muted-foreground">{box.skuName}</div>
    </div>
  );
}

function LabelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

export function BoxIdTable({
  boxes,
  onChanged,
  showPreGrn = false,
  showStatus = true,
}: {
  boxes: BoxRecord[];
  onChanged?: () => void;
  showPreGrn?: boolean;
  showStatus?: boolean;
}) {
  const [historyBox, setHistoryBox] = useState<BoxRecord | null>(null);
  const [reprintBox, setReprintBox] = useState<BoxRecord | null>(null);
  const [reason, setReason] = useState("");
  const cols = 8 + (showPreGrn ? 1 : 0) + (showStatus ? 1 : 0);

  const confirmReprint = () => {
    if (!reprintBox || !reason) return;
    logReprint(reprintBox.boxId, reason, "R. Mehta");
    toast.success(`Reprinted ${reprintBox.boxId}`, { description: reason });
    setReprintBox(null);
    setReason("");
    onChanged?.();
  };

  return (
    <>
      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted [&>th]:sticky [&>th]:top-0 [&>th]:z-20 [&>th]:bg-muted [&>th]:shadow-[inset_0_-1px_0_hsl(var(--border))]">
              <TableHead>Box ID</TableHead>
              {showStatus && <TableHead>Status</TableHead>}
              {showPreGrn && <TableHead>Pre-GRN</TableHead>}
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Case Size</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>MRP</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {boxes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={cols}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No boxes match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              boxes.map((b) => (
                <TableRow key={b.boxId}>
                  <TableCell className="whitespace-nowrap font-mono text-xs font-medium">
                    {b.boxId}
                  </TableCell>
                  {showStatus && (
                    <TableCell>
                      <BoxStatusBadge status={b.status} />
                    </TableCell>
                  )}
                  {showPreGrn && <TableCell className="font-mono text-xs">{b.preGrnId}</TableCell>}
                  <TableCell>
                    <div className="font-mono text-xs">{b.sku}</div>
                    <div className="text-[11px] text-muted-foreground">{b.skuName}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{b.caseSize}</TableCell>
                  <TableCell className="font-mono text-xs">{b.batch || "—"}</TableCell>
                  <TableCell className="tabular-nums">{b.mrp || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {b.expiry || "—"}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.06em] text-muted-foreground">
                      {b.sellerCode ? "Seller code" : `System · ${b.printedCount}×`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5"
                        onClick={() => setHistoryBox(b)}
                      >
                        <History className="h-3.5 w-3.5" />
                        History
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5"
                        disabled={b.status === "Voided" || b.sellerCode}
                        title={
                          b.status === "Voided"
                            ? "Voided Box IDs cannot be reprinted"
                            : b.sellerCode
                              ? "Seller box codes are not label-printed"
                              : undefined
                        }
                        onClick={() => {
                          setReprintBox(b);
                          setReason("");
                        }}
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Reprint
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!historyBox} onOpenChange={(o) => !o && setHistoryBox(null)}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">{historyBox?.boxId}</DialogTitle>
          </DialogHeader>
          {historyBox && (
            <div className="space-y-4">
              <dl className="grid grid-cols-3 gap-3 rounded-md border border-border bg-muted/30 p-3 font-mono text-[10px] uppercase tracking-[0.06em]">
                <LabelRow label="ASN" value={historyBox.asnId} />
                <LabelRow label="PO" value={historyBox.poNumber} />
                <LabelRow label="Pre-GRN" value={historyBox.preGrnId} />
                <LabelRow label="Batch" value={historyBox.batch || "—"} />
                <LabelRow label="MRP" value={historyBox.mrp || "—"} />
                <LabelRow label="Mfg" value={historyBox.mfg || "—"} />
              </dl>
              <div className="space-y-0">
                {historyBox.history.map((h, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      {i < historyBox.history.length - 1 && (
                        <div className="my-0.5 w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="pb-4">
                      <div className="text-sm font-medium">{h.event}</div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                        {h.at} · {h.by}
                      </div>
                      {h.detail && (
                        <div className="mt-0.5 text-[11px] text-muted-foreground">{h.detail}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!reprintBox} onOpenChange={(o) => !o && setReprintBox(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Reprint label</DialogTitle>
          </DialogHeader>
          {reprintBox && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Reprinting <span className="font-mono text-foreground">{reprintBox.boxId}</span>.
                The reprint is logged with your user, device and time, and the label carries a
                Reprint mark.
              </p>
              <div className="space-y-1.5">
                <label className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  Reason
                </label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPRINT_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <BoxLabel box={reprintBox} reprint />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReprintBox(null)}>
              Cancel
            </Button>
            <Button disabled={!reason} onClick={confirmReprint}>
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
