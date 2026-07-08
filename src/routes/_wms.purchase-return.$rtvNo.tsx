import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Search,
  Send,
} from "lucide-react";
import { PageHeader } from "@/components/wms/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { fmtTimestamp, getOrder, itemProgress, type Order } from "@/lib/wms/mock-data";

export const Route = createFileRoute("/_wms/purchase-return/$rtvNo")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.rtvNo} — Purchase Return` },
      {
        name: "description",
        content: `Return-to-vendor detail for ${params.rtvNo}.`,
      },
    ],
  }),
  loader: ({ params }) => {
    const orderNo = params.rtvNo.replace(/^RTV-/, "WMS-");
    const order = getOrder(orderNo);
    if (!order) throw notFound();
    return { order, rtvNo: params.rtvNo };
  },
  notFoundComponent: () => (
    <div className="p-10 text-center">
      <h2 className="text-lg font-semibold">RTV not found</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        We couldn't find that RTV reference.
      </p>
      <Link
        to="/purchase-return"
        className="mt-4 inline-block text-sm text-primary hover:underline"
      >
        ← Back to purchase returns
      </Link>
    </div>
  ),
  component: RtvDetailPage,
});

// ── Deterministic RTV attributes derived from the source order ───────────────
// The list reuses order data, so every displayed RTV field is synthesised from
// the order number (stable across reloads) rather than stored separately.
const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

type QcType = "GOOD" | "BAD";

const REJECT_REASONS = ["Damaged", "Expired", "Wrong Item", "Defective"];
const TRANSPORTERS = ["Delhivery", "BlueDart", "VRL Logistics", "TCI Express"];

// Map the order's fulfilment status onto the richer RTV processing lifecycle.
const PROCESSING_STATUS: Record<Order["status"], string> = {
  created: "Pending",
  picked: "Picked",
  packed: "Packed",
  manifested: "Manifest",
  dispatched: "Shipped",
};

const PROCESSING_STATUS_STYLES: Record<string, string> = {
  Pending: "bg-status-created/10 text-status-created border-status-created/40",
  Confirm: "bg-status-created/10 text-status-created border-status-created/40",
  Picked: "bg-status-picked/10 text-status-picked border-status-picked/40",
  Packed: "bg-status-packed/10 text-status-packed border-status-packed/40",
  Manifest:
    "bg-status-manifested/10 text-status-manifested border-status-manifested/40",
  Shipped:
    "bg-status-dispatched/10 text-status-dispatched border-status-dispatched/40",
};

interface RtvAttrs {
  rtvType: "Seller Initiated" | "System Recommended";
  processingStatus: string;
  qcType: QcType;
  transportMode: "Seller Transport" | "Shiprocket";
  transporter: string;
  lrNumber: string | null;
  expectedDispatch: Date;
}

function rtvAttrs(order: Order): RtvAttrs {
  const h = hash(order.orderNo);
  const qcType: QcType = h % 3 === 0 ? "BAD" : "GOOD";
  const transportMode =
    h % 2 === 0 ? "Shiprocket" : ("Seller Transport" as const);
  const transporter =
    transportMode === "Shiprocket"
      ? TRANSPORTERS[h % TRANSPORTERS.length]
      : "Self-arranged";
  // LR number only exists once the shipment has actually moved out.
  const hasLr =
    order.status === "manifested" || order.status === "dispatched";
  const created = new Date(order.createdAt);
  const expectedDispatch = new Date(
    created.getTime() + (2 + (h % 3)) * 24 * 60 * 60 * 1000,
  );
  return {
    rtvType: h % 2 === 0 ? "Seller Initiated" : "System Recommended",
    processingStatus: PROCESSING_STATUS[order.status],
    qcType,
    transportMode,
    transporter,
    lrNumber: hasLr ? `LR-${(h % 900000) + 100000}` : null,
    expectedDispatch,
  };
}

const rejectReasonFor = (sku: string) =>
  REJECT_REASONS[hash(sku) % REJECT_REASONS.length];

// ── RTV journey ─────────────────────────────────────────────────────────────
// RTV-specific stepper: no "Sorted" stage, and a "Documents Received" stage
// (seller paperwork/QC docs) sits between Packed and Manifested.
const RTV_JOURNEY_STEPS = [
  "Created",
  "Picklist Generated",
  "Picked",
  "Packed",
  "Documents Received",
  "Manifested",
  "Handed Over",
] as const;

type RtvStep = (typeof RTV_JOURNEY_STEPS)[number];

const RTV_COMPLETED_BY_STATUS: Record<Order["status"], number> = {
  created: 1, // Created
  picked: 3, // + Picklist Generated, Picked
  packed: 4, // + Packed
  manifested: 6, // + Documents Received, Manifested
  dispatched: 7, // + Handed Over
};

const RTV_OFFSETS_MIN: Record<RtvStep, number> = {
  Created: 0,
  "Picklist Generated": 15,
  Picked: 55,
  Packed: 140,
  "Documents Received": 190,
  Manifested: 240,
  "Handed Over": 360,
};

interface RtvJourneyEvent {
  step: RtvStep;
  state: "done" | "pending";
  at?: Date;
}

function rtvJourney(order: Order): RtvJourneyEvent[] {
  const completed = RTV_COMPLETED_BY_STATUS[order.status];
  const created = new Date(order.createdAt);
  return RTV_JOURNEY_STEPS.map((step, idx) =>
    idx < completed
      ? {
          step,
          state: "done" as const,
          at: new Date(created.getTime() + RTV_OFFSETS_MIN[step] * 60_000),
        }
      : { step, state: "pending" as const },
  );
}

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

interface JourneyComment {
  id: string;
  author: string;
  text: string;
  at: Date;
}

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </div>
        <div className="mt-1 text-xs font-semibold text-foreground">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

function RtvDetailPage() {
  const { order, rtvNo } = Route.useLoaderData();
  const attrs = rtvAttrs(order);
  const history = rtvJourney(order);
  const isBadQc = attrs.qcType === "BAD";

  const [journeyOpen, setJourneyOpen] = useState(true);
  const [comments, setComments] = useState<JourneyComment[]>([]);
  const [draft, setDraft] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  const filteredItems = order.items.filter((i) => {
    const q = itemSearch.trim().toLowerCase();
    if (!q) return true;
    return i.sku.toLowerCase().includes(q) || i.name.toLowerCase().includes(q);
  });

  const addComment = () => {
    const text = draft.trim();
    if (!text) return;
    setComments((c) => [
      ...c,
      { id: `c-${Date.now()}`, author: "You", text, at: new Date() },
    ]);
    setDraft("");
  };

  return (
    <div>
      <PageHeader
        title={rtvNo}
        subtitle={`${order.seller} · ${attrs.rtvType}`}
        actions={
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[4px] border px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-[0.06em]",
                isBadQc
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-status-picked/40 bg-status-picked/10 text-status-picked",
              )}
            >
              QC · {attrs.qcType}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[4px] border px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-[0.06em] before:inline-block before:size-[6px] before:rounded-full before:bg-current",
                PROCESSING_STATUS_STYLES[attrs.processingStatus] ??
                  "border-border bg-muted text-muted-foreground",
              )}
            >
              {attrs.processingStatus}
            </span>
          </div>
        }
      />

      <div className="space-y-4 px-7 pb-14 pt-5">
        <Link
          to="/purchase-return"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to purchase returns
        </Link>

        {/* RTV view fields */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
          <Stat label="RTV No.">
            <span className="font-mono">{rtvNo}</span>
          </Stat>
          <Stat label="Seller">{order.seller}</Stat>
          <Stat label="RTV Type">{attrs.rtvType}</Stat>
          <Stat label="Processing Status">{attrs.processingStatus}</Stat>
          <Stat label="QC Type">{attrs.qcType}</Stat>
          <Stat label="Transport Mode">{attrs.transportMode}</Stat>
          <Stat label="Transporter">{attrs.transporter}</Stat>
          <Stat label="LR Number">
            {attrs.lrNumber ? (
              <span className="font-mono">{attrs.lrNumber}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </Stat>
          <Stat label="Expected Dispatch">
            <div className="font-mono text-xs">
              {fmtDate(attrs.expectedDispatch)}
            </div>
          </Stat>
        </div>

        {/* Items table (LEFT) + Journey panel (RIGHT, collapsible) */}
        <div
          className={cn(
            "grid gap-4",
            journeyOpen ? "lg:grid-cols-[1fr_260px]" : "lg:grid-cols-[1fr_48px]",
          )}
        >
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Items ({filteredItems.length}
                {filteredItems.length !== order.items.length
                  ? ` of ${order.items.length}`
                  : ""}
                )
              </h2>
              <div className="relative w-56">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Search items…"
                  className="h-8 pl-7 text-xs"
                />
              </div>
            </div>
            <div className="overflow-x-auto rounded-md border border-border bg-card [&_th]:px-2 [&_th]:py-2 [&_td]:px-2 [&_td]:py-2 [&_th]:h-auto [&_th]:text-[10px] [&_td]:text-xs">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>SKU</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reject Reason</TableHead>
                    <TableHead className="text-right">Ordered</TableHead>
                    <TableHead className="text-right">Picked</TableHead>
                    <TableHead className="text-right">Packed</TableHead>
                    <TableHead className="text-right">Manifest</TableHead>
                    <TableHead className="text-right">Shipped</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-6 text-center text-xs text-muted-foreground"
                      >
                        No items match "{itemSearch}".
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {filteredItems.map((i) => {
                    const p = itemProgress(i.quantity, order.status);
                    return (
                      <TableRow key={i.sku}>
                        <TableCell className="font-mono text-[11px]">
                          {i.sku}
                        </TableCell>
                        <TableCell className="font-medium">{i.name}</TableCell>
                        <TableCell>
                          {isBadQc ? (
                            <span className="inline-block rounded-[2px] border border-destructive/30 bg-destructive/5 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                              {rejectReasonFor(i.sku)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <QtyCell value={p.ordered} />
                        <QtyCell value={p.picked} />
                        <QtyCell value={p.packed} />
                        <QtyCell value={p.manifested} />
                        <QtyCell value={p.shipped} />
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Journey panel (right, collapsible) */}
          <div className="lg:sticky lg:top-4 self-start">
            {journeyOpen ? (
              <Card>
                <CardContent className="space-y-3 p-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      RTV Journey
                    </h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setJourneyOpen(false)}
                      aria-label="Collapse journey"
                      title="Collapse"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <JourneyTimeline events={history} />

                  <div className="space-y-2 border-t border-border pt-4">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Comments ({comments.length})
                    </div>

                    {comments.length === 0 ? (
                      <p className="text-[11px] italic text-muted-foreground">
                        No comments yet.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {comments.map((c) => (
                          <li
                            key={c.id}
                            className="rounded-md border border-border bg-muted/30 p-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{c.author}</span>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {fmtTimestamp(c.at)}
                              </span>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap text-foreground">
                              {c.text}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        addComment();
                      }}
                      className="flex gap-1.5"
                    >
                      <Input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Add a comment…"
                        className="h-9 text-xs"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        disabled={!draft.trim()}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 p-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setJourneyOpen(true)}
                    aria-label="Expand journey"
                    title="Expand"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground [writing-mode:vertical-rl] [transform:rotate(180deg)]">
                    RTV Journey
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QtyCell({ value }: { value: number }) {
  return <TableCell className="text-right tabular-nums">{value}</TableCell>;
}

function JourneyTimeline({ events }: { events: RtvJourneyEvent[] }) {
  const lastDoneIdx = events.reduce(
    (acc, e, i) => (e.state === "done" ? i : acc),
    -1,
  );

  return (
    <ol className="relative">
      {events.map((e, idx) => {
        const isLast = idx === events.length - 1;
        const isDone = e.state === "done";
        const isCurrent = idx === lastDoneIdx;
        return (
          <li
            key={e.step}
            className={cn("relative flex gap-3", !isLast && "pb-4")}
          >
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[13px] top-7 -ml-px w-0.5",
                  isDone ? "bg-status-dispatched/70" : "bg-border",
                )}
                style={{ height: "calc(100% - 1rem)" }}
              />
            )}
            <div
              className={cn(
                "relative z-10 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full ring-1 ring-inset",
                isDone
                  ? "bg-status-dispatched text-white ring-status-dispatched"
                  : "bg-muted text-muted-foreground ring-border",
              )}
            >
              {isDone ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
              )}
            </div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "text-sm font-medium",
                    !isDone && "text-muted-foreground",
                  )}
                >
                  {e.step}
                </span>
                {isCurrent && (
                  <span className="rounded-[2px] bg-ai-bg px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.06em] text-ai">
                    Now
                  </span>
                )}
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                {e.at ? fmtTimestamp(e.at) : "Pending"}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
