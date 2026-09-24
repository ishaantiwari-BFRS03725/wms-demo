import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, BookOpen, CheckCircle2, Clock, Eye, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/wms/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Temporary demo/explainer screen only — not linked from the sidebar.
// The live Inbound > Exceptions screen (Putaway Exception tab) forces a
// three-click drill-down for the common case where one putaway task has
// several exception reasons: View task -> View reason -> Back -> View next
// reason. This page puts three alternative interaction patterns for that
// same data side by side so a direction can be picked before it's built
// for real.

export const Route = createFileRoute("/_wms/exceptions-redesign")({
  head: () => ({
    meta: [{ title: "Putaway Exceptions · Redesign Options — WMS" }],
  }),
  component: RedesignScreen,
});

type Reason = "Mismatch" | "Short" | "Excess" | "Damaged";
type LineStatus = "open" | "resolved";

interface ExceptionLine {
  sku: string;
  qty: number;
  remark: string;
  status: LineStatus;
}

interface ExceptionReason {
  reason: Reason;
  lines: ExceptionLine[];
}

type Severity = "Low" | "Medium" | "High";

interface AiSummary {
  severity: Severity;
  description: string;
  action: string;
  sopRef: string;
  // Deep link into the Knowledge Base user manual — `section` is a heading id
  // within `src/lib/wms/knowledge-base-data.ts` that the viewer resolves to
  // its containing page and scrolls to.
  sop: { section: string; label: string };
}

interface PutawayException {
  id: string;
  putawayTask: string;
  seller: string;
  vendor: string;
  raisedAgo: string;
  reasons: ExceptionReason[];
  aiSummary: AiSummary;
}

const initialData: PutawayException[] = [
  {
    id: "PUT #6273",
    putawayTask: "PUT-000004",
    seller: "—",
    vendor: "—",
    raisedAgo: "19h ago",
    reasons: [
      {
        reason: "Mismatch",
        lines: [
          {
            sku: "LS-TMB-OCT25",
            qty: 2,
            remark: "Scanned SKU differs from putaway plan",
            status: "open",
          },
        ],
      },
    ],
    aiSummary: {
      severity: "Medium",
      description:
        "1 open exception on this task — a SKU mismatch on 2 units. The scanned SKU doesn't match the putaway plan, so posting this as-is will misstate the bin's inventory ledger.",
      action:
        "Re-scan the physical SKU and bin before resolving. If the mismatch is confirmed (not a scan error), reassign the putaway plan to the scanned SKU rather than forcing a match to the original plan.",
      sopRef: "INB-PUT-07",
      sop: { section: "verify-inventory-after-put-away", label: "Put Away · Verify inventory after Put Away" },
    },
  },
  {
    id: "PUT #6272",
    putawayTask: "PUT-000003",
    seller: "—",
    vendor: "—",
    raisedAgo: "19h ago",
    reasons: [
      {
        reason: "Mismatch",
        lines: [
          {
            sku: "LS-TMB-NOV25",
            qty: 1,
            remark: "Expected LS-TMB-DEC25, scanned LS-TMB-NOV25",
            status: "open",
          },
        ],
      },
      {
        reason: "Short",
        lines: [{ sku: "LS-TMB-NOV25", qty: 1, remark: "—", status: "open" }],
      },
    ],
    aiSummary: {
      severity: "High",
      description:
        "2 open exceptions on this task — a SKU mismatch on 1 unit and a short pick of 1 unit. Left unresolved together, the shortage can get double-counted as both a receiving discrepancy and a putaway exception.",
      action:
        "Resolve the mismatch first (re-scan to confirm SKU), then reconcile the short quantity against the GRN before writing it off. If the GRN also shows a shortfall, raise it to the vendor scorecard instead of resolving in isolation.",
      sopRef: "INB-PUT-07, INB-PUT-11",
      sop: { section: "short-receipt", label: "QC / GRN · Short receipt" },
    },
  },
];

const reasonBadgeVariant = (reason: Reason) =>
  reason === "Mismatch"
    ? "warn"
    : reason === "Short"
      ? "sys"
      : reason === "Excess"
        ? "ok"
        : "destructive";

const severityBadgeVariant = (severity: Severity) =>
  severity === "High" ? "destructive" : severity === "Medium" ? "warn" : "ok";

function statusOf(exc: PutawayException): LineStatus {
  return exc.reasons.every((r) => r.lines.every((l) => l.status === "resolved"))
    ? "resolved"
    : "open";
}

const OPTIONS = [
  { value: "b", label: "B · Grouped drawer" },
  { value: "e", label: "E · Flat checklist drawer" },
  { value: "c", label: "C · Split-pane modal" },
] as const;
type OptionValue = (typeof OPTIONS)[number]["value"];

function RedesignScreen() {
  const [option, setOption] = useState<OptionValue>("b");
  const [data, setData] = useState(initialData);

  const resolveLine = (excId: string, reasonIdx: number, lineIdx: number) => {
    setData((prev) =>
      prev.map((exc) => {
        if (exc.id !== excId) return exc;
        const reasons = exc.reasons.map((r, ri) => {
          if (ri !== reasonIdx) return r;
          const lines = r.lines.map((l, li) =>
            li === lineIdx ? { ...l, status: "resolved" as const } : l,
          );
          return { ...r, lines };
        });
        return { ...exc, reasons };
      }),
    );
    toast.success("Line marked resolved");
  };

  const openCount = data.filter((e) => statusOf(e) === "open").length;

  return (
    <div>
      <PageHeader title="Putaway Exceptions — Redesign Options" />

      <div className="space-y-5 p-7">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
            Option
          </span>
          <ToggleGroup
            type="single"
            value={option}
            onValueChange={(v) => v && setOption(v as OptionValue)}
            className="justify-start rounded-md border border-border bg-muted/30 p-1"
          >
            {OPTIONS.map((o) => (
              <ToggleGroupItem
                key={o.value}
                value={o.value}
                className="h-8 rounded-[4px] px-3 text-[12px] data-[state=on]:bg-background data-[state=on]:shadow-sm"
              >
                {o.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <OptionBlurb option={option} />

        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Open Exceptions" value={String(openCount)} icon={AlertTriangle} />
          <StatCard label="Last 24 Hours" value="2" icon={Clock} />
          <StatCard label="Last 7 Days" value="2" icon={Clock} />
          <StatCard label="Avg Age" value="18h 58m" icon={CheckCircle2} />
        </div>

        <div className="flex items-center justify-between">
          <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
            Putaway Exception
          </div>
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        <StandardTable data={data} option={option} onResolve={resolveLine} />
      </div>
    </div>
  );
}

function OptionBlurb({ option }: { option: OptionValue }) {
  const text: Record<OptionValue, string> = {
    b: '"View" opens a right-side drawer, same as today, but every reason is expanded and stacked in its own grouped section in one scroll — no second click, no Back button. Familiar drawer pattern, still needs a panel.',
    e: "Same drawer, but no grouping at all — every SKU line from every reason sits in one flat table with a Reason column, so the whole task can be cleared as a single checklist. Fastest when a task only has a couple of lines total; gets noisy once it has many reasons.",
    c: '"View" opens a wider modal with reasons as a left-hand rail and the selected reason\'s lines on the right. Switching reasons updates the right pane in place instead of navigating — good when a task could have many reasons.',
  };
  return <p className="text-sm text-muted-foreground">{text[option]}</p>;
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof AlertTriangle;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-1.5 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function ReasonPill({ reason }: { reason: Reason }) {
  return <Badge variant={reasonBadgeVariant(reason)}>{reason}</Badge>;
}

function AiIntelligenceCard({ exc }: { exc: PutawayException }) {
  const { severity, description, action, sopRef, sop } = exc.aiSummary;
  return (
    <div className="rounded-md border border-ai-ring bg-ai-bg/40 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-ai">
          <Sparkles className="h-3.5 w-3.5" />
          AI Intelligence
        </div>
        <Badge variant={severityBadgeVariant(severity)}>{severity} severity</Badge>
      </div>
      <p className="mt-2 text-[12.5px] leading-snug text-foreground">{description}</p>
      <div className="mt-2 rounded-[4px] bg-background/60 px-2.5 py-2 text-[12px] leading-snug text-muted-foreground">
        <span className="font-medium text-foreground">Suggested action ({sopRef}): </span>
        {action}
      </div>
      <Link
        to="/knowledge-base"
        search={{ section: sop.section }}
        target="_blank"
        className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-ai hover:underline"
      >
        <BookOpen className="h-3.5 w-3.5" />
        Read SOP before resolving: {sop.label}
      </Link>
    </div>
  );
}

function ExceptionRowMeta({ exc }: { exc: PutawayException }) {
  return (
    <div>
      <div className="font-mono text-[12px] font-semibold">{exc.id}</div>
      <div className="font-mono text-[10px] text-muted-foreground">{exc.putawayTask}</div>
    </div>
  );
}

// --- Shared table for all options (open a panel on View) ---------------

function StandardTable({
  data,
  option,
  onResolve,
}: {
  data: PutawayException[];
  option: OptionValue;
  onResolve: (excId: string, reasonIdx: number, lineIdx: number) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openExc = data.find((e) => e.id === openId) ?? null;

  return (
    <>
      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {["ASN / PO", "Seller", "Vendor", "Reasons", "Raised At", "Status", "Actions"].map(
                (h) => (
                  <TableHead key={h} className="font-mono text-[10px] uppercase tracking-[0.06em]">
                    {h}
                  </TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((exc) => {
              const status = statusOf(exc);
              return (
                <TableRow key={exc.id}>
                  <TableCell>
                    <ExceptionRowMeta exc={exc} />
                  </TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{exc.seller}</TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{exc.vendor}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {exc.reasons.map((r) => (
                        <ReasonPill key={r.reason} reason={r.reason} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                    {exc.raisedAgo}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status === "resolved" ? "ok" : "warn"}>{status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1.5 text-[11px]"
                      onClick={() => setOpenId(exc.id)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {option === "b" || option === "e" ? (
        <Sheet open={!!openExc} onOpenChange={(o) => !o && setOpenId(null)}>
          <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl">
            {openExc &&
              (option === "b" ? (
                <DrawerAllReasons exc={openExc} onResolve={onResolve} />
              ) : (
                <FlatChecklistDrawer exc={openExc} onResolve={onResolve} />
              ))}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={!!openExc} onOpenChange={(o) => !o && setOpenId(null)}>
          <DialogContent className="max-w-3xl gap-0 p-0">
            {openExc && <SplitPaneModal exc={openExc} onResolve={onResolve} />}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// --- Option B: drawer, all reasons expanded, single scroll --------------

function DrawerAllReasons({
  exc,
  onResolve,
}: {
  exc: PutawayException;
  onResolve: (excId: string, reasonIdx: number, lineIdx: number) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="flex-shrink-0 border-b border-border px-6 py-4">
        <SheetTitle>{exc.id}</SheetTitle>
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
          Putaway task {exc.putawayTask} · {exc.reasons.length} reason
          {exc.reasons.length > 1 ? "s" : ""}
        </div>
      </SheetHeader>

      <div className="flex-1 space-y-4 px-6 py-5">
        <AiIntelligenceCard exc={exc} />
        {exc.reasons.map((r, ri) => (
          <div key={r.reason} className="rounded-md border border-border">
            <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-3 py-2">
              <ReasonPill reason={r.reason} />
              <span className="font-mono text-[10px] text-muted-foreground">
                {r.lines.length} line{r.lines.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="divide-y divide-border">
              {r.lines.map((l, li) => (
                <div
                  key={`${l.sku}-${li}`}
                  className="flex items-center justify-between px-3 py-2.5"
                >
                  <div>
                    <div className="font-mono text-[12px] font-semibold">{l.sku}</div>
                    <div className="text-[11px] text-muted-foreground">
                      Qty {l.qty}
                      {l.remark !== "—" ? ` · ${l.remark}` : ""}
                    </div>
                  </div>
                  {l.status === "open" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px]"
                      onClick={() => onResolve(exc.id, ri, li)}
                    >
                      Resolve
                    </Button>
                  ) : (
                    <Badge variant="ok">resolved</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Option E: drawer, all lines flattened into one checklist -----------

function FlatChecklistDrawer({
  exc,
  onResolve,
}: {
  exc: PutawayException;
  onResolve: (excId: string, reasonIdx: number, lineIdx: number) => void;
}) {
  const rows = exc.reasons.flatMap((r, ri) =>
    r.lines.map((l, li) => ({ ...l, reason: r.reason, ri, li })),
  );

  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="flex-shrink-0 border-b border-border px-6 py-4">
        <SheetTitle>{exc.id}</SheetTitle>
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
          Putaway task {exc.putawayTask} · {rows.length} line{rows.length > 1 ? "s" : ""} to clear
        </div>
      </SheetHeader>

      <div className="flex-1 space-y-4 px-6 py-5">
        <AiIntelligenceCard exc={exc} />
        <Table>
          <TableHeader>
            <TableRow>
              {["Reason", "SKU Code", "Qty", "Remark", "Status", ""].map((h) => (
                <TableHead key={h} className="font-mono text-[10px] uppercase tracking-[0.06em]">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.reason}-${row.sku}-${row.li}`}>
                <TableCell>
                  <ReasonPill reason={row.reason} />
                </TableCell>
                <TableCell className="font-mono text-[12px]">{row.sku}</TableCell>
                <TableCell className="font-mono text-[12px]">{row.qty}</TableCell>
                <TableCell className="text-[12px] text-muted-foreground">{row.remark}</TableCell>
                <TableCell>
                  <Badge variant={row.status === "resolved" ? "ok" : "warn"}>{row.status}</Badge>
                </TableCell>
                <TableCell>
                  {row.status === "open" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px]"
                      onClick={() => onResolve(exc.id, row.ri, row.li)}
                    >
                      Resolve
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// --- Option C: modal with a reason rail + detail pane -------------------

function SplitPaneModal({
  exc,
  onResolve,
}: {
  exc: PutawayException;
  onResolve: (excId: string, reasonIdx: number, lineIdx: number) => void;
}) {
  const [selected, setSelected] = useState(0);
  const active = exc.reasons[Math.min(selected, exc.reasons.length - 1)];
  const activeIdx = exc.reasons.indexOf(active);

  return (
    <div>
      <DialogHeader className="border-b border-border px-6 py-4">
        <DialogTitle>{exc.id}</DialogTitle>
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
          Putaway task {exc.putawayTask}
        </div>
      </DialogHeader>
      <div className="px-6 pt-4">
        <AiIntelligenceCard exc={exc} />
      </div>
      <div className="flex h-[380px]">
        <div className="w-48 shrink-0 border-r border-border p-2">
          {exc.reasons.map((r, ri) => {
            const allResolved = r.lines.every((l) => l.status === "resolved");
            return (
              <button
                key={r.reason}
                onClick={() => setSelected(ri)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[13px] transition-colors cursor-pointer",
                  ri === activeIdx ? "bg-muted font-medium" : "hover:bg-muted/50",
                )}
              >
                <span className="flex items-center gap-2">
                  <ReasonPill reason={r.reason} />
                </span>
                {allResolved ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-ok" />
                ) : (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {r.lines.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
            {active.reason} · {active.lines.length} line{active.lines.length > 1 ? "s" : ""}
          </div>
          <div className="space-y-2">
            {active.lines.map((l, li) => (
              <div
                key={`${l.sku}-${li}`}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2.5"
              >
                <div>
                  <div className="font-mono text-[12px] font-semibold">{l.sku}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Qty {l.qty}
                    {l.remark !== "—" ? ` · ${l.remark}` : ""}
                  </div>
                </div>
                {l.status === "open" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px]"
                    onClick={() => onResolve(exc.id, activeIdx, li)}
                  >
                    Resolve
                  </Button>
                ) : (
                  <Badge variant="ok">resolved</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
