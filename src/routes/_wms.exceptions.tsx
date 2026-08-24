import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Printer, Tag } from "lucide-react";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { inboundBarcodePattern } from "@/lib/wms/inbound-data";
import {
  type GoodToBadTicket,
  type RejectReason,
  generateUsns,
  isOverSla,
  rejectReasons,
  setRejectReason,
  useGoodToBadTickets,
} from "@/lib/wms/good-to-bad-data";

export const Route = createFileRoute("/_wms/exceptions")({
  head: () => ({
    meta: [{ title: "Exceptions — Inventory" }],
  }),
  component: ExceptionsScreen,
});

function fmtRaised(ms: number) {
  return new Date(ms).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ExceptionsScreen() {
  const tickets = useGoodToBadTickets();
  const [openId, setOpenId] = useState<string | null>(null);
  const openTicket = tickets.find((t) => t.id === openId) ?? null;

  const openCount = tickets.filter((t) => t.status !== "Closed").length;

  return (
    <div>
      <PageHeader
        title="Exceptions"
        subtitle={`GOOD-TO-BAD STOCK MOVEMENT · ${openCount} OPEN OF ${tickets.length}`}
      />

      <div className="p-7">
        <div data-demo="exc-table" className="rounded-md border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                {["Type", "Ref ID", "Reason / Description", "Raised", "Status", "Action"].map(
                  (h) => (
                    <TableHead
                      key={h}
                      className="font-mono text-[10px] uppercase tracking-[0.06em]"
                    >
                      {h}
                    </TableHead>
                  ),
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center font-mono text-[11px] uppercase text-muted-foreground"
                  >
                    No exception tickets
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((t) => {
                  const overSla = isOverSla(t);
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="text-[12px]">Inventory - Move</TableCell>
                      <TableCell className="font-mono text-[12px] font-semibold">
                        {t.taskId}
                        <div className="font-mono text-[10px] font-normal text-muted-foreground">
                          {t.id}
                        </div>
                      </TableCell>
                      <TableCell className="text-[12px]">
                        Damage Segregation — Good-to-Bad QC stock movement
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {t.skuName} ({t.sku}) · {t.fromBin} → {t.toBin} · Qty {t.requestedQty}
                          {t.rejectReason ? ` · ${t.rejectReason}` : ""}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                        {fmtRaised(t.raisedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-[3px] border px-1.5 py-0.5 font-mono text-[10px] uppercase",
                              t.status === "Closed" && "border-ok/40 bg-ok-bg text-ok",
                              t.status === "Ready to Move" && "border-warn/40 bg-warn-bg text-warn",
                              t.status === "Open" &&
                                "border-muted-foreground/30 bg-muted text-muted-foreground",
                            )}
                          >
                            {t.status}
                          </span>
                          {overSla && (
                            <span className="inline-flex items-center gap-1 rounded-[3px] border border-risk/40 bg-risk-bg px-1.5 py-0.5 font-mono text-[10px] uppercase text-risk">
                              <AlertTriangle className="h-3 w-3" />
                              Overdue
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1.5 text-[11px]"
                          onClick={() => setOpenId(t.id)}
                        >
                          View & Print
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Sheet open={!!openTicket} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl">
          {openTicket && <TicketDetail ticket={openTicket} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function TicketDetail({ ticket }: { ticket: GoodToBadTicket }) {
  const [reason, setReason] = useState<RejectReason | "">(ticket.rejectReason ?? "");
  const remaining = ticket.requestedQty - ticket.usns.length;
  const [genQty, setGenQty] = useState(String(Math.max(remaining, 0)));
  const [lastBatch, setLastBatch] = useState<string[] | null>(null);
  const overSla = isOverSla(ticket);

  const confirmReason = () => {
    if (!reason) return;
    setRejectReason(ticket.id, reason);
    toast.success(`Reject reason set to "${reason}"`);
  };

  const generate = () => {
    const qty = Number(genQty);
    if (!qty || qty <= 0) return;
    if (qty > remaining) {
      toast.error(`Only ${remaining} unit(s) remaining to generate`);
      return;
    }
    const usns = generateUsns(ticket.id, qty);
    setLastBatch(usns.map((u) => u.id));
    setGenQty(String(Math.max(remaining - qty, 0)));
    toast.success(`Print job sent — 1 sheet, ${usns.length} label(s)`);
  };

  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="flex-shrink-0 border-b border-border px-6 py-4">
        <SheetTitle>{ticket.id}</SheetTitle>
        <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
          Linked task {ticket.taskId}
          {overSla && (
            <span className="inline-flex items-center gap-1 rounded-[3px] border border-risk/40 bg-risk-bg px-1.5 py-0.5 text-risk">
              <AlertTriangle className="h-3 w-3" />
              Overdue
            </span>
          )}
        </div>
      </SheetHeader>

      <div className="flex-1 space-y-5 px-6 py-5">
        <div className="rounded-md border border-border bg-muted/20 p-3 space-y-2">
          <div className="text-sm font-semibold">{ticket.skuName}</div>
          <div className="font-mono text-[11px] text-muted-foreground">
            SKU {ticket.sku}
            {ticket.batch ? ` · Batch ${ticket.batch}` : ""}
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                From Bin
              </div>
              <div className="font-mono text-sm font-semibold">{ticket.fromBin}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                To Bin
              </div>
              <div className="font-mono text-sm font-semibold">{ticket.toBin}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                Requested Qty
              </div>
              <div className="font-mono text-sm font-semibold">{ticket.requestedQty}</div>
            </div>
          </div>
        </div>

        {/* Reject reason */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
            Reject reason
          </label>
          {ticket.rejectReason ? (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm font-medium">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              {ticket.rejectReason}
            </div>
          ) : (
            <div className="flex gap-2">
              <Select value={reason} onValueChange={(v) => setReason(v as RejectReason)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select reason…" />
                </SelectTrigger>
                <SelectContent>
                  {rejectReasons.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" disabled={!reason} onClick={confirmReason}>
                Confirm
              </Button>
            </div>
          )}
        </div>

        {/* USN generation */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
            Generate USNs — {ticket.usns.length} of {ticket.requestedQty} generated
          </label>
          <div className="flex gap-2">
            <Input
              inputMode="numeric"
              value={genQty}
              onChange={(e) => setGenQty(e.target.value.replace(/[^0-9]/g, ""))}
              className="h-9 w-28 font-mono"
              disabled={!ticket.rejectReason || remaining <= 0}
            />
            <Button
              size="sm"
              className="gap-1.5"
              disabled={!ticket.rejectReason || remaining <= 0 || !genQty || Number(genQty) <= 0}
              onClick={generate}
            >
              <Printer className="h-3.5 w-3.5" />
              Generate
            </Button>
          </div>
          {!ticket.rejectReason && (
            <p className="text-[11px] text-muted-foreground">
              Confirm the reject reason before generating USNs.
            </p>
          )}
          {remaining <= 0 && ticket.usns.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Full requested quantity has been generated.
            </p>
          )}
        </div>

        {/* Just-printed batch preview */}
        {lastBatch && (
          <div className="space-y-2">
            <div className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
              Print batch — {lastBatch.length} label(s)
            </div>
            <div className="grid grid-cols-2 gap-2">
              {lastBatch.map((usn) => (
                <UsnLabel key={usn} usn={usn} ticket={ticket} />
              ))}
            </div>
          </div>
        )}

        {/* All USNs */}
        {ticket.usns.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
              All generated USNs
            </div>
            <div className="divide-y divide-border rounded-md border border-border">
              {ticket.usns.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between px-3 py-1.5 font-mono text-[11px]"
                >
                  <span className="font-semibold">{u.id}</span>
                  <span
                    className={cn(
                      "rounded-[3px] border px-1.5 py-0.5 text-[10px] uppercase",
                      u.status === "moved"
                        ? "border-ok/40 bg-ok-bg text-ok"
                        : "border-warn/40 bg-warn-bg text-warn",
                    )}
                  >
                    {u.status === "moved" ? "Moved" : "Printed, Awaiting Move"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UsnLabel({ usn, ticket }: { usn: string; ticket: GoodToBadTicket }) {
  const bars = useMemo(() => inboundBarcodePattern(usn), [usn]);
  return (
    <div className="rounded-md border-2 border-dashed border-border bg-background p-2.5">
      <div className="flex items-end gap-px">
        {bars.slice(0, 28).map((w, i) => (
          <div
            key={i}
            style={{ width: `${w * 1.4}px` }}
            className={cn("h-7", i % 2 === 0 ? "bg-foreground" : "bg-transparent")}
          />
        ))}
      </div>
      <div className="mt-1 font-mono text-[10px] font-bold tracking-wide">{usn}</div>
      <div className="mt-1 space-y-0.5 font-mono text-[9px] text-muted-foreground">
        <div>
          SKU {ticket.sku}
          {ticket.batch ? ` · ${ticket.batch}` : ""}
        </div>
        <div>
          {ticket.id} · {ticket.rejectReason}
        </div>
      </div>
    </div>
  );
}
