import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Inbox,
  Layers,
  Package,
  PackageOpen,
  ScanBarcode,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { sortedPigeonholes, type SortedPigeonhole } from "@/lib/wms/sort-data";

export const Route = createFileRoute("/_wms/sort/empty")({
  head: () => ({
    meta: [{ title: "Empty Pigeonhole — WMS Outbound" }],
  }),
  component: EmptyPigeonhole,
});

type Stage = "scan-pigeonhole" | "scan-bin";

function EmptyPigeonhole() {
  const [stage, setStage] = useState<Stage>("scan-pigeonhole");
  const [activePh, setActivePh] = useState<SortedPigeonhole | null>(null);
  const [emptied, setEmptied] = useState<Set<string>>(new Set());
  const [phError, setPhError] = useState<string | null>(null);

  const pending = useMemo(
    () => sortedPigeonholes.filter((p) => !emptied.has(p.id)),
    [emptied],
  );
  const allDone = pending.length === 0;

  const selectPigeonhole = (ph: SortedPigeonhole) => {
    setActivePh(ph);
    setPhError(null);
    setStage("scan-bin");
  };

  const onPigeonholeScan = (val: string) => {
    const id = val.trim().toUpperCase();
    const ph = sortedPigeonholes.find((p) => p.id === id);
    if (!ph) {
      setPhError(`${id} is not a sorted pigeonhole.`);
      return;
    }
    if (emptied.has(id)) {
      setPhError(`${id} has already been emptied.`);
      return;
    }
    selectPigeonhole(ph);
  };

  const onBinScan = (val: string) => {
    if (!activePh) return;
    const bin = val.trim().toUpperCase();
    if (!bin) return;
    setEmptied((prev) => new Set(prev).add(activePh.id));
    toast.success(`${activePh.id} emptied into ${bin}`);
    setActivePh(null);
    setStage("scan-pigeonhole");
  };

  const cancelBin = () => {
    setActivePh(null);
    setPhError(null);
    setStage("scan-pigeonhole");
  };

  const subtitle = allDone
    ? "All pigeonholes emptied"
    : `${pending.length} pigeonhole${pending.length === 1 ? "" : "s"} ready`;

  return (
    <ScreenShell subtitle={subtitle}>
      {allDone ? (
        <Card className="space-y-4 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-status-dispatched/15 text-status-dispatched">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">All done</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {emptied.size} pigeonhole{emptied.size === 1 ? "" : "s"} emptied
              into pick bins.
            </p>
          </div>
          <Button className="h-12 w-full text-base" asChild>
            <Link to="/sort">Back to Sort</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Scan zone */}
          <Card className="space-y-3 p-4">
            {stage === "scan-pigeonhole" ? (
              <>
                {phError ? (
                  <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {phError}
                  </div>
                ) : null}
                <ScanRow
                  label="Scan sorted pigeonhole"
                  placeholder="e.g. PW-1"
                  autoValue={pending[0]?.id}
                  onScan={onPigeonholeScan}
                  autoFocus
                />
              </>
            ) : activePh ? (
              <>
                <div className="rounded-md border border-status-picked/40 bg-status-picked/10 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] font-mono uppercase tracking-[0.06em] text-status-picked/70">
                      Pigeonhole
                    </div>
                    <span className="rounded-[3px] border border-status-picked/30 bg-status-picked/15 px-2 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em] text-status-picked">
                      Sorted
                    </span>
                  </div>
                  <div className="mt-0.5 font-mono text-2xl font-bold text-status-picked">
                    {activePh.id}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="font-mono">{activePh.orderId}</span>
                    <span className="inline-flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {activePh.items} units
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                  <PackageOpen className="h-3.5 w-3.5 shrink-0" />
                  Move all items into a pick bin, then scan the bin to empty this
                  pigeonhole.
                </div>
                <ScanRow
                  key="bin"
                  label="Scan pick bin"
                  placeholder="e.g. PICK-BIN-07"
                  autoValue="PICK-BIN-07"
                  onScan={onBinScan}
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-full"
                  onClick={cancelBin}
                >
                  Cancel
                </Button>
              </>
            ) : null}
          </Card>

          {/* Ready-to-empty list — display + tap to start */}
          {stage === "scan-pigeonhole" && pending.length > 0 ? (
            <Card className="space-y-2 p-4">
              <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                <Inbox className="h-3.5 w-3.5" />
                Ready to empty ({pending.length})
              </div>
              <div className="space-y-2">
                {pending.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPigeonhole(p)}
                    className="flex w-full items-center gap-3 rounded-md border border-border bg-background p-2.5 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <PackageOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-sm font-semibold">
                        {p.id}
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="font-mono">{p.orderId}</span>
                        <span className="inline-flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {p.items}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {p.wave}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[10px] text-muted-foreground">
                        {p.sortedAgo}
                      </div>
                      <ChevronRight className="ml-auto mt-0.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          ) : null}

          {emptied.size > 0 ? (
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-status-picked" />
              {emptied.size} emptied this session
            </div>
          ) : null}
        </div>
      )}
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
          <div className="text-right">
            <div className="text-sm font-semibold">Empty Pigeonhole</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
              {subtitle}
            </div>
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
  autoValue,
  onScan,
  autoFocus,
}: {
  label: string;
  placeholder: string;
  autoValue?: string;
  onScan: (value: string) => void;
  autoFocus?: boolean;
}) {
  const [val, setVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <ScanBarcode className="h-3.5 w-3.5 text-muted-foreground" />
        <label className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </label>
      </div>
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
        {autoValue ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-11 px-2 text-xs"
            onClick={() => {
              onScan(autoValue);
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
