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
import {
  fmtSlaRemaining,
  fmtTimestamp,
  getOrder,
  itemProgress,
  journeyHistory,
  slaDeadline,
  type JourneyEvent,
} from "@/lib/wms/mock-data";

export const Route = createFileRoute("/_wms/orders/$orderNo")({
  head: ({ params }) => ({
    meta: [
      { title: `Order ${params.orderNo} — WMS` },
      {
        name: "description",
        content: `Outbound journey and items for order ${params.orderNo}.`,
      },
    ],
  }),
  loader: ({ params }) => {
    const order = getOrder(params.orderNo);
    if (!order) throw notFound();
    return { order };
  },
  notFoundComponent: () => (
    <div className="p-10 text-center">
      <h2 className="text-lg font-semibold">Order not found</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        We couldn't find that order number in the outbound queue.
      </p>
      <Link
        to="/orders"
        className="mt-4 inline-block text-sm text-primary hover:underline"
      >
        ← Back to orders
      </Link>
    </div>
  ),
  component: OrderDetailPage,
});

const CHANNEL_STYLES: Record<string, string> = {
  Amazon: "bg-orange-50 text-orange-700 border-orange-300",
  Flipkart: "bg-blue-50 text-blue-700 border-blue-300",
  Shopify: "bg-green-50 text-green-700 border-green-300",
  Myntra: "bg-pink-50 text-pink-700 border-pink-300",
};

const STATUS_STYLES: Record<string, string> = {
  created: "bg-status-created/10 text-status-created border-status-created/40",
  picked: "bg-status-picked/10 text-status-picked border-status-picked/40",
  packed: "bg-status-packed/10 text-status-packed border-status-packed/40",
  manifested:
    "bg-status-manifested/10 text-status-manifested border-status-manifested/40",
  dispatched:
    "bg-status-dispatched/10 text-status-dispatched border-status-dispatched/40",
};

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

function OrderDetailPage() {
  const { order } = Route.useLoaderData();
  const history = journeyHistory(order);
  const deadline = slaDeadline(order.createdAt, order.sla);
  const rem = fmtSlaRemaining(deadline);

  const [journeyOpen, setJourneyOpen] = useState(true);
  const [comments, setComments] = useState<JourneyComment[]>([]);
  const [draft, setDraft] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  const filteredItems = order.items.filter((i) => {
    const q = itemSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      i.sku.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)
    );
  });

  const addComment = () => {
    const text = draft.trim();
    if (!text) return;
    setComments((c) => [
      ...c,
      {
        id: `c-${Date.now()}`,
        author: "You",
        text,
        at: new Date(),
      },
    ]);
    setDraft("");
  };

  return (
    <div>
      <PageHeader
        title={`Order ${order.orderNo}`}
        subtitle={`${order.seller} · Ext ${order.extOrderNo}`}
        actions={
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-[4px] border px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-[0.06em]",
                CHANNEL_STYLES[order.channel],
              )}
            >
              {order.channel}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[4px] border px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-[0.06em] before:inline-block before:size-[6px] before:rounded-full before:bg-current",
                STATUS_STYLES[order.status],
              )}
            >
              {order.status}
            </span>
          </div>
        }
      />

      <div className="space-y-4 px-7 pb-14 pt-5">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          <Stat label="Order Type">
            <span
              className={cn(
                "inline-block rounded-[2px] border px-1.5 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em]",
                order.orderType === "B2B"
                  ? "border-sys/30 bg-sys-bg text-sys"
                  : "border-ai-ring bg-ai-bg text-ai",
              )}
            >
              {order.orderType}
            </span>
          </Stat>
          <Stat label="Created At">
            <div className="font-mono text-xs">
              {fmtTimestamp(new Date(order.createdAt))}
            </div>
          </Stat>
          <Stat label={`SLA · ${order.sla}`}>
            <div className="font-mono text-xs">{fmtTimestamp(deadline)}</div>
            <div
              className={cn(
                "text-[11px] font-medium",
                rem.overdue
                  ? "text-destructive"
                  : rem.close
                    ? "text-orange-600"
                    : "text-muted-foreground",
              )}
            >
              {rem.text}
            </div>
          </Stat>
          <Stat label="Courier">{order.courier}</Stat>
          <Stat label="Payment">{order.paymentMode}</Stat>
          <Stat label="Total Qty">{order.totalQuantity}</Stat>
        </div>

        {/* Items table (LEFT) + Journey panel (RIGHT, collapsible) */}
        <div
          className={cn(
            "grid gap-4",
            journeyOpen
              ? "lg:grid-cols-[1fr_260px]"
              : "lg:grid-cols-[1fr_48px]",
          )}
        >
          {/* Items */}
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
                    <TableHead className="w-8 text-center">#</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Ordered</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Confirmed</TableHead>
                    <TableHead className="text-right">Cancelled</TableHead>
                    <TableHead className="text-right">Picked</TableHead>
                    <TableHead className="text-right">Packed</TableHead>
                    <TableHead className="text-right">Manifested</TableHead>
                    <TableHead className="text-right">Shipped</TableHead>
                    <TableHead className="text-right">Returned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={11}
                        className="py-6 text-center text-xs text-muted-foreground"
                      >
                        No items match "{itemSearch}".
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {filteredItems.map((i, idx) => {
                    const p = itemProgress(i.quantity, order.status);
                    return (
                      <TableRow key={i.sku}>
                        <TableCell className="text-center tabular-nums text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{i.name}</div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {i.sku}
                          </div>
                        </TableCell>
                        <QtyCell value={p.ordered} of={p.ordered} />
                        <QtyCell
                          value={p.pending}
                          of={p.ordered}
                          warn={p.pending > 0}
                        />
                        <QtyCell value={p.confirmed} of={p.ordered} />
                        <QtyCell
                          value={p.cancelled}
                          of={p.ordered}
                          warn={p.cancelled > 0}
                        />
                        <QtyCell value={p.picked} of={p.ordered} />
                        <QtyCell value={p.packed} of={p.ordered} />
                        <QtyCell value={p.manifested} of={p.ordered} />
                        <QtyCell value={p.shipped} of={p.ordered} />
                        <QtyCell
                          value={p.returned}
                          of={p.ordered}
                          warn={p.returned > 0}
                        />
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
                      Order Journey
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
                    Order Journey
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

function QtyCell({ value }: { value: number; of?: number; warn?: boolean }) {
  return (
    <TableCell className="text-right tabular-nums">{value}</TableCell>
  );
}

function JourneyTimeline({ events }: { events: JourneyEvent[] }) {
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
