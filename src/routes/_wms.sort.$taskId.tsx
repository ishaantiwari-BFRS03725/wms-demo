import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Inbox,
  PackageCheck,
  ScanBarcode,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [transferred, setTransferred] = useState<Set<string>>(new Set());
  // separate transfer process: scan putwall -> scan tote -> transfer
  const [transferOpen, setTransferOpen] = useState(false);
  const [tStep, setTStep] = useState<"putwall" | "tote">("putwall");
  const [tPutwall, setTPutwall] = useState("");
  const [tTote, setTTote] = useState("");
  const [tError, setTError] = useState<string | null>(null);

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

  // Completed putwalls still awaiting transfer to a tote.
  const readyPutwalls = putwallEntries.filter(
    (e) => e.done && !transferred.has(e.pw),
  );

  const openTransfer = () => {
    setTStep("putwall");
    setTPutwall("");
    setTTote("");
    setTError(null);
    setTransferOpen(true);
  };

  const onTransferPutwallScan = (val: string) => {
    const pw = val.trim().toUpperCase();
    if (!readyPutwalls.some((e) => e.pw === pw)) {
      setTError(`${pw} is not a completed putwall ready for transfer.`);
      return;
    }
    setTPutwall(pw);
    setTError(null);
    setTStep("tote");
  };

  const confirmTransfer = () => {
    if (!tPutwall || !tTote.trim()) return;
    setTransferred((prev) => new Set(prev).add(tPutwall));
    setTransferOpen(false);
  };

  // Derive suggestion fresh every render — avoids stale-closure issues
  const currentItem = scan.sku
    ? task.items.find((it) => it.sku === scan.sku) ?? null
    : null;
  const suggestion = currentItem ? (orderMap[currentItem.orderId] ?? null) : null;

  // ----- Step 1: scan source tote -----
  if (step === "scan-tote") {
    return (
      <ScreenShell taskId={task.id} subtitle="Step 1 of 2 · Scan source tote">
        <Card className="space-y-4 p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
      <ScreenShell taskId={task.id} subtitle="Sortation complete">
        <Card className="space-y-4 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-status-dispatched/15 text-status-dispatched">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Task {task.id}</h3>
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
    const item = task.items.find((it) => it.sku.toUpperCase() === sku);
    const mapped = item ? (orderMap[item.orderId] ?? null) : null;
    setScan({ itemScanned: true, sku });
  };

  const onPutwallScan = (val: string) => {
    if (!scan.sku) return;
    const pw = val.trim().toUpperCase();
    if (!/^PW-\d+$/i.test(pw)) {
      toast.error("Invalid putwall. Format: PW-1");
      return;
    }
    const item = task.items.find((it) => it.sku === scan.sku);

    if (item) {
      const existing = orderMap[item.orderId];
      if (existing && existing !== pw) {
        setPutwallError(`Wrong putwall. Scan ${existing} to continue.`);
        return;
      }
      const conflict = Object.entries(orderMap).find(
        ([oId, p]) => p === pw && oId !== item.orderId,
      );
      if (conflict) {
        toast.error(`${pw} is mapped to ${conflict[0]}. Scan a new putwall ID.`);
        return;
      }
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
      taskId={task.id}
      subtitle={`Step 2 of 2 · Tote ${tote} · ${task.items.length - remaining.length}/${task.items.length} sorted`}
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
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
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
                <div className="flex items-center gap-3 rounded-md border-2 border-status-picked/50 bg-status-picked/10 p-3 ring-1 ring-status-picked/30">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-status-picked/20 text-lg font-bold text-status-picked">
                    →
                  </div>
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-status-picked/70">
                      Suggested putwall
                    </div>
                    <div className="font-mono text-lg font-bold text-status-picked">
                      {suggestion}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                  New order — scan an empty putwall to map it.
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

        {/* Completed putwalls awaiting transfer — display only. Transfer is a
            separate scan-driven process started from the button below. */}
        {readyPutwalls.length > 0 ? (
          <Card className="space-y-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Inbox className="h-3.5 w-3.5" />
                Ready to transfer ({readyPutwalls.length})
              </div>
            </div>
            <div className="space-y-2">
              {readyPutwalls.map((e) => (
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
                  <span className="shrink-0 rounded-full bg-status-picked/15 px-2 py-0.5 text-[10px] font-medium text-status-picked">
                    Sorting done
                  </span>
                </div>
              ))}
            </div>
            <Button className="h-11 w-full" onClick={openTransfer}>
              <PackageCheck className="h-4 w-4" />
              Transfer putwall to tote
            </Button>
          </Card>
        ) : null}

        {allSorted ? (
          <Button className="h-11 w-full" onClick={() => setStep("done")}>
            Finish task
          </Button>
        ) : null}
      </div>

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Transfer putwall to tote</DialogTitle>
            <DialogDescription>
              {tStep === "putwall"
                ? "Scan a completed putwall to begin the transfer."
                : "Scan the pick tote, then confirm the transfer."}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1 — scan completed putwall */}
          {tStep === "putwall" ? (
            <div className="space-y-3">
              {tError ? (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2.5 text-sm font-medium text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {tError}
                </div>
              ) : null}
              <ScanRow
                key="t-putwall"
                label="Scan completed putwall"
                placeholder="e.g. PW-1"
                onScan={onTransferPutwallScan}
                autoFocus
              />
            </div>
          ) : (
            /* Step 2 — scan pick tote */
            <div className="space-y-3">
              <div className="rounded-md border border-status-picked/40 bg-status-picked/5 p-2.5">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Putwall
                </div>
                <div className="font-mono text-sm font-semibold text-status-picked">
                  {tPutwall}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Scan pick tote
                </label>
                <Input
                  autoFocus
                  className="h-11 font-mono text-sm"
                  placeholder="Scan pick tote…"
                  value={tTote}
                  onChange={(e) => setTTote(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferOpen(false)}>
              Cancel
            </Button>
            <Button disabled={tStep !== "tote" || !tTote.trim()} onClick={confirmTransfer}>
              <PackageCheck className="h-4 w-4" />
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScreenShell>
  );
}

function ScreenShell({
  taskId,
  subtitle,
  children,
}: {
  taskId: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pb-8">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-background px-4 py-3">
        <Link
          to="/sort"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Sort
        </Link>
        <div className="text-right">
          <div className="text-sm font-semibold">{taskId}</div>
          <div className="text-[11px] text-muted-foreground">{subtitle}</div>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function ScanRow({
  label,
  placeholder,
  onScan,
  autoFocus,
}: {
  label: string;
  placeholder: string;
  onScan: (value: string) => void;
  autoFocus?: boolean;
}) {
  const [val, setVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
      >
        <Input
          ref={inputRef}
          autoFocus={autoFocus}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder}
          className="h-11 font-mono text-sm"
        />
      </form>
    </div>
  );
}
