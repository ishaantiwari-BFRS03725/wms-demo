import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Inbox,
  ScanBarcode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSortTask, type SortTask } from "@/lib/wms/sort-data";

export const Route = createFileRoute("/_wms/sort/$taskId")({
  head: ({ params }) => ({
    meta: [{ title: `Sorting ${params.taskId} — WMS` }],
  }),
  loader: ({ params }): SortTask => {
    const t = getSortTask(params.taskId);
    if (!t) throw new Error("Sort task not found");
    return t;
  },
  notFoundComponent: () => (
    <div className="p-6 text-sm text-muted-foreground">
      Sort task not found.{" "}
      <Link to="/sort" className="text-primary underline">
        Back to Sort
      </Link>
    </div>
  ),
  component: SortProcess,
});

type Step = "scan-tote" | "sorting" | "done";

interface ScanState {
  itemScanned: boolean;
  sku: string | null;
}

function SortProcess() {
  const task = Route.useLoaderData() as SortTask;
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("scan-tote");
  const [tote, setTote] = useState("");
  // sku -> putwall it was placed in
  const [placed, setPlaced] = useState<Record<string, string>>({});
  // orderId -> putwall id
  const [orderMap, setOrderMap] = useState<Record<string, string>>({});
  const [scan, setScan] = useState<ScanState>({
    itemScanned: false,
    sku: null,
  });
  const [putwallError, setPutwallError] = useState<string | null>(null);

  const remaining = useMemo(
    () => task.items.filter((it) => !placed[it.sku]),
    [task.items, placed],
  );

  // group items by order to compute pigeonhole status
  const itemsByOrder = useMemo(() => {
    const map = new Map<string, typeof task.items>();
    for (const it of task.items) {
      const arr = map.get(it.orderId) ?? [];
      arr.push(it);
      map.set(it.orderId, arr);
    }
    return map;
  }, [task.items]);

  const putwallEntries = useMemo(() => {
    return Object.entries(orderMap).map(([orderId, pw]) => {
      const items = itemsByOrder.get(orderId) ?? [];
      const placedCount = items.filter((it) => placed[it.sku]).length;
      const done = placedCount === items.length;
      return { orderId, pw, placedCount, total: items.length, done };
    });
  }, [orderMap, itemsByOrder, placed]);

  const allSorted =
    task.items.length > 0 && task.items.every((it) => placed[it.sku]);

  // Pigeonholes whose order has been fully sorted. Emptying them into a pick
  // bin is a separate operator activity handled on the Empty Pigeonhole screen.
  const completedPutwalls = putwallEntries.filter((e) => e.done);

  // Pool of pigeonholes the system can direct operators to. A pigeonhole is
  // available until it has been assigned to an order this session.
  const PIGEONHOLES = useMemo(
    () => Array.from({ length: 12 }, (_, i) => `PW-${i + 1}`),
    [],
  );
  const occupiedPigeonholes = useMemo(() => {
    // Read from `placed` (every scan that landed in a pigeonhole, including
    // unrecognised SKUs that never make it into `orderMap`) so no pigeonhole is
    // ever double-suggested.
    return new Set(Object.values(placed));
  }, [placed]);
  const nextAvailablePigeonhole = useMemo(
    () => PIGEONHOLES.find((pw) => !occupiedPigeonholes.has(pw)) ?? null,
    [PIGEONHOLES, occupiedPigeonholes],
  );

  // Derive suggestion fresh every render — avoids stale-closure issues.
  // Same order seen before -> direct back to its pigeonhole. New order ->
  // system assigns the next empty pigeonhole itself.
  const currentItem = scan.sku
    ? task.items.find((it) => it.sku === scan.sku) ?? null
    : null;
  const suggestion = scan.sku
    ? (currentItem ? orderMap[currentItem.orderId] : undefined) ??
      nextAvailablePigeonhole
    : null;

  // ----- Step 1: scan source tote -----
  if (step === "scan-tote") {
    return (
      <ScreenShell subtitle="Scan source tote">
        <Card className="space-y-4 p-4">
          <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
            <ScanBarcode className="h-3.5 w-3.5" />
            Scan tote from batch picklist
          </div>
          <Input
            autoFocus
            placeholder={`e.g. ${task.toteId}`}
            value={tote}
            onChange={(e) => setTote(e.target.value)}
            className="h-12 text-base"
          />
          <Button
            className="h-12 w-full text-base"
            disabled={!tote.trim()}
            onClick={() => {
              setStep("sorting");
            }}
          >
            Start sorting
          </Button>
        </Card>
      </ScreenShell>
    );
  }

  // ----- Step 3: all done -----
  if (step === "done") {
    return (
      <ScreenShell subtitle="Sortation complete">
        <Card className="space-y-4 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-status-dispatched/15 text-status-dispatched">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Sortation complete</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {task.items.length} items sorted into {putwallEntries.length}{" "}
              pigeonholes.
            </p>
          </div>
          <Button
            className="h-12 w-full text-base"
            onClick={() => navigate({ to: "/sort" })}
          >
            Back to Sort
          </Button>
        </Card>
      </ScreenShell>
    );
  }

  // ----- Step 2: sorting loop -----
  const onItemScan = (val: string) => {
    const sku = val.trim().toUpperCase();
    setScan({ itemScanned: true, sku });
  };

  const onPutwallScan = (val: string) => {
    if (!scan.sku || !suggestion) return;
    const pw = val.trim().toUpperCase();
    if (pw !== suggestion) {
      setPutwallError(`Wrong putwall. Scan ${suggestion} to continue.`);
      return;
    }
    const item = task.items.find((it) => it.sku === scan.sku);

    if (item) {
      const existing = orderMap[item.orderId];
      if (!existing) {
        setOrderMap((m) => ({ ...m, [item.orderId]: pw }));
      }
      setPlaced((p) => ({ ...p, [item.sku]: pw }));
    } else {
      setPlaced((p) => ({ ...p, [scan.sku!]: pw }));
    }

    setPutwallError(null);
    setScan({ itemScanned: false, sku: null });
  };

  return (
    <ScreenShell
      subtitle={`Tote ${tote} · ${task.items.length - remaining.length}/${task.items.length} sorted`}
    >
      <div className="space-y-3">
        {/* Scan zone */}
        <Card className="space-y-3 p-4">
          {!scan.itemScanned ? (
            <ScanRow
              label="Scan item"
              placeholder="Scan SKU…"
              onScan={onItemScan}
              autoFocus
            />
          ) : (
            <>
              <div className="rounded-md border border-border bg-muted/30 p-3">
                <div className="text-[11px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  Item
                </div>
                <div className="mt-0.5 text-sm font-semibold">
                  {currentItem?.name ?? scan.sku}
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  {scan.sku}
                  {currentItem?.orderId ? ` · ${currentItem.orderId}` : ""}
                </div>
              </div>
              {suggestion ? (
                <div className="flex items-center gap-3 rounded-md border border-status-picked/40 bg-status-picked/10 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-status-picked/20 text-lg font-bold text-status-picked">
                    →
                  </div>
                  <div>
                    <div className="text-[11px] font-medium font-mono uppercase tracking-[0.06em] text-status-picked/70">
                      {currentItem && orderMap[currentItem.orderId]
                        ? "Go to putwall"
                        : "New order — go to putwall"}
                    </div>
                    <div className="font-mono text-lg font-bold text-status-picked">
                      {suggestion}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-warn/30 bg-warn-bg p-3 text-xs text-warn">
                  No empty pigeonholes available.
                </div>
              )}
              {putwallError ? (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {putwallError}
                </div>
              ) : null}
              <ScanRow
                label="Scan putwall"
                placeholder={suggestion ?? "e.g. PW-1"}
                expected={suggestion}
                onScan={onPutwallScan}
                autoFocus
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-full"
                onClick={() => {
                  setPutwallError(null);
                  setScan({ itemScanned: false, sku: null });
                }}
              >
                Cancel
              </Button>
            </>
          )}
        </Card>

        {/* Sorted pigeonholes — display only. Emptying them into a pick bin is
            a separate activity on the Empty Pigeonhole screen. */}
        {completedPutwalls.length > 0 ? (
          <Card className="space-y-2 p-4">
            <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
              <Inbox className="h-3.5 w-3.5" />
              Sorted pigeonholes ({completedPutwalls.length})
            </div>
            <div className="space-y-2">
              {completedPutwalls.map((e) => (
                <div
                  key={e.pw}
                  className="flex items-center justify-between gap-2 rounded-md border border-status-picked/40 bg-status-picked/5 p-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-semibold">{e.pw}</div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {e.orderId} · sorted
                    </div>
                  </div>
                  <span className="shrink-0 rounded-[3px] border border-status-picked/30 bg-status-picked/15 px-2 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em] text-status-picked">
                    Sorting done
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {allSorted ? (
          <Button className="h-11 w-full" onClick={() => setStep("done")}>
            Finish task
          </Button>
        ) : null}
      </div>
    </ScreenShell>
  );
}

function ScreenShell({
  subtitle,
  children,
}: {
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-3rem)] bg-muted/40 py-4">
      <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-md border border-border bg-background">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-background px-4 py-3">
          <Link
            to="/sort"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Sort
          </Link>
          <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
            {subtitle}
          </div>
        </div>
        <div className="p-4 pb-6">{children}</div>
      </div>
    </div>
  );
}

function ScanRow({
  label,
  placeholder,
  expected,
  onScan,
  autoFocus,
}: {
  label: string;
  placeholder: string;
  expected?: string | null;
  onScan: (value: string) => void;
  autoFocus?: boolean;
}) {
  const [val, setVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="mb-1 block text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </label>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!val.trim()) return;
          onScan(val);
          setVal("");
          inputRef.current?.focus();
        }}
        className="flex gap-2"
      >
        <Input
          ref={inputRef}
          autoFocus={autoFocus}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder}
          className="h-11 font-mono text-sm"
        />
        {expected ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-11 px-2 text-xs"
            onClick={() => {
              onScan(expected);
              setVal("");
            }}
          >
            Auto
          </Button>
        ) : null}
      </form>
    </div>
  );
}
