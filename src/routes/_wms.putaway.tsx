import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  MapPin,
  MoveDown,
  ScanBarcode,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { type GrnBin, resolvePutawayBin } from "@/lib/wms/putaway-data";

export const Route = createFileRoute("/_wms/putaway")({
  head: () => ({
    meta: [{ title: "Putaway — Inbound" }],
  }),
  component: Putaway,
});

type Step = "assign" | "work";
type Mode = "bin" | "item";

function Putaway() {
  const [step, setStep] = useState<Step>("assign");
  const [assigned, setAssigned] = useState<GrnBin[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successCount, setSuccessCount] = useState(0);

  const scanBin = (code: string): "ok" | "dup" => {
    const bin = resolvePutawayBin(code);
    if (assigned.some((b) => b.id === bin.id)) return "dup";
    setAssigned((a) => [...a, bin]);
    return "ok";
  };

  const removeBin = (id: string) =>
    setAssigned((a) => a.filter((b) => b.id !== id));

  const startPutaway = () => {
    setCurrentIdx(0);
    setStep("work");
  };

  const completeCurrent = () => {
    const isLast = currentIdx >= assigned.length - 1;
    if (isLast) {
      setSuccessCount(assigned.length);
      setSuccessOpen(true);
      setStep("assign");
      setAssigned([]);
      setCurrentIdx(0);
    } else {
      setCurrentIdx((i) => i + 1);
    }
  };

  const currentBin = step === "work" ? assigned[currentIdx] : undefined;

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-muted/40 py-4">
      <div className="relative mx-auto w-full max-w-[440px]">
        <div className="rounded-md border border-border bg-background">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-2 rounded-t-md border-b border-border bg-background px-4 py-3">
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <MoveDown className="h-4 w-4 text-muted-foreground" />
              Putaway · GRN bins
            </div>
          </div>

          <div className="space-y-3 p-4">
            {step === "assign" && (
              <AssignStep
                assigned={assigned}
                onScan={scanBin}
                onRemove={removeBin}
                onProceed={startPutaway}
              />
            )}

            {step === "work" && currentBin && (
              <WorkStep
                key={currentBin.id}
                bin={currentBin}
                onComplete={completeCurrent}
              />
            )}
          </div>
        </div>
      </div>

      {/* Success — shown once all assigned bins are put away */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-status-picked/15">
              <CheckCircle2 className="h-8 w-8 text-status-picked" />
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-status-picked">
                Putaway complete
              </div>
              <p className="text-sm text-muted-foreground">
                {successCount} GRN bin{successCount > 1 ? "s" : ""} put away to
                storage.
              </p>
            </div>
            <Button
              className="mt-2 w-full"
              onClick={() => setSuccessOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Assign step — operator self-assigns by scanning GRN bins ─────────────────
function AssignStep({
  assigned,
  onScan,
  onRemove,
  onProceed,
}: {
  assigned: GrnBin[];
  onScan: (code: string) => "ok" | "dup";
  onRemove: (id: string) => void;
  onProceed: () => void;
}) {
  const [err, setErr] = useState<string | null>(null);

  const handleScan = (raw: string) => {
    const code = raw.trim().toUpperCase();
    if (!code) return;
    const res = onScan(code);
    if (res === "dup") {
      setErr(`${code} is already in your list.`);
      return;
    }
    setErr(null);
  };

  return (
    <>
      <Card className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
          <ScanBarcode className="h-3.5 w-3.5" />
          Self assign GRN bins
        </div>
        {err && <ErrorBanner message={err} />}
        <ScanRow
          placeholder="Scan GRN bin barcode…"
          onScan={handleScan}
          autoFocus
        />
      </Card>

      {assigned.length > 0 && (
        <Card className="space-y-1.5 p-3">
          <div className="text-[11px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
            Assigned to you ({assigned.length})
          </div>
          {assigned.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border p-2.5 text-xs"
            >
              <div className="min-w-0">
                <div className="font-mono text-sm font-semibold">{b.id}</div>
                <div className="text-[11px] text-muted-foreground">
                  {b.seller} · {b.zone}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="rounded-[2px] bg-muted px-2 py-1 font-mono text-[11px] font-semibold tabular-nums">
                    {b.items.length} SKUs
                  </span>
                  <span className="rounded-[2px] bg-muted px-2 py-1 font-mono text-[11px] font-semibold tabular-nums">
                    {b.totalQty} units
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(b.id)}
                className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={`Remove ${b.id}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </Card>
      )}

      <Button
        className="h-11 w-full"
        disabled={assigned.length === 0}
        onClick={onProceed}
      >
        Proceed{assigned.length > 0 ? ` (${assigned.length})` : ""}
      </Button>
    </>
  );
}

// ── Work step ────────────────────────────────────────────────────────────────
function WorkStep({
  bin,
  onComplete,
}: {
  bin: GrnBin;
  onComplete: () => void;
}) {
  const [mode, setMode] = useState<Mode>("bin");
  // Confirmed scan values keyed by field. A field is "scanned" once present.
  const [conf, setConf] = useState<Record<string, string>>({});
  const [scanned, setScanned] = useState<Record<string, number>>({});

  const confirm = (key: string, value: string) =>
    setConf((c) => ({ ...c, [key]: value }));
  const reset = (key: string) =>
    setConf((c) => {
      const next = { ...c };
      delete next[key];
      return next;
    });

  const scanItem = (sku: string) => {
    const item = bin.items.find((it) => it.sku === sku);
    if (!item) return false;
    const current = scanned[sku] ?? 0;
    if (current >= item.qty) return false;
    setScanned((s) => ({ ...s, [sku]: current + 1 }));
    return true;
  };

  const scannedTotal = bin.items.reduce(
    (s, it) => s + Math.min(scanned[it.sku] ?? 0, it.qty),
    0,
  );
  const allItemsScanned = scannedTotal === bin.totalQty;

  const binReady = conf.fromBin === bin.id && conf.toLocation === bin.location;
  const itemReady =
    conf.fromBin === bin.id &&
    conf.toBin === bin.storageBin &&
    conf.toLocation === bin.location &&
    allItemsScanned;
  const ready = mode === "bin" ? binReady : itemReady;

  return (
    <>
      {/* Suggested zone */}
      <Card className="space-y-3 border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.06em] text-primary">
          <MapPin className="h-3.5 w-3.5" />
          Suggested zone
        </div>
        <div>
          <div className="font-mono text-2xl font-bold tracking-tight">
            {bin.zone}
            <span className="ml-2 text-base font-semibold text-muted-foreground">
              {bin.aisle}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {bin.category} stock
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-background/60 p-2 text-xs">
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          Navigate to <span className="font-mono font-semibold">{bin.zone}</span>
        </div>
      </Card>

      {/* Mode toggle */}
      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(v) => v && setMode(v as Mode)}
        className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1"
      >
        <ToggleGroupItem
          value="item"
          className="h-9 rounded-[4px] text-xs font-medium data-[state=on]:bg-background data-[state=on]:shadow-sm"
        >
          Item Putaway
        </ToggleGroupItem>
        <ToggleGroupItem
          value="bin"
          className="h-9 rounded-[4px] text-xs font-medium data-[state=on]:bg-background data-[state=on]:shadow-sm"
        >
          Complete Bin Putaway
        </ToggleGroupItem>
      </ToggleGroup>

      <Card className="space-y-3 p-4">
        <ScanField
          label="From bin (GRN bin)"
          suggested={bin.id}
          confirmedValue={conf.fromBin}
          onConfirm={(v) => confirm("fromBin", v)}
          onReset={() => reset("fromBin")}
        />

        {mode === "item" && (
          <ScanField
            label="To bin (storage bin)"
            suggested={bin.storageBin}
            confirmedValue={conf.toBin}
            onConfirm={(v) => confirm("toBin", v)}
            onReset={() => reset("toBin")}
          />
        )}

        <ScanField
          label="To location (storage address)"
          suggested={bin.location}
          confirmedValue={conf.toLocation}
          onConfirm={(v) => confirm("toLocation", v)}
          onReset={() => reset("toLocation")}
        />

        {mode === "item" && (
          <ItemScan
            bin={bin}
            scanned={scanned}
            scannedTotal={scannedTotal}
            onScan={scanItem}
          />
        )}
      </Card>

      <Button className="h-11 w-full" disabled={!ready} onClick={onComplete}>
        {ready ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Confirm putaway
          </>
        ) : (
          "Scan all fields to confirm"
        )}
      </Button>
    </>
  );
}

// ── Item-level scan panel ────────────────────────────────────────────────────
function ItemScan({
  bin,
  scanned,
  scannedTotal,
  onScan,
}: {
  bin: GrnBin;
  scanned: Record<string, number>;
  scannedTotal: number;
  onScan: (sku: string) => boolean;
}) {
  const [err, setErr] = useState<string | null>(null);
  const pct = Math.round((scannedTotal / bin.totalQty) * 100);

  const handleScan = (raw: string) => {
    const sku = raw.trim().toUpperCase();
    if (!sku) return;
    const item = bin.items.find((it) => it.sku === sku);
    if (!item) {
      setErr(`${sku} is not in this bin.`);
      return;
    }
    if (!onScan(sku)) {
      setErr(`All ${item.qty} units of ${sku} already scanned.`);
      return;
    }
    setErr(null);
  };

  return (
    <div className="space-y-2.5 border-t border-border pt-3">
      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <ScanBarcode className="h-3.5 w-3.5" />
          Scan items
        </span>
        <span className="font-mono text-foreground tabular-nums">
          {scannedTotal}/{bin.totalQty}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-status-picked transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {err && <ErrorBanner message={err} />}
      <ScanRow placeholder="Scan item barcode / SKU…" onScan={handleScan} />

      {/* Item list — tappable to simulate a scan, with a prototype annotation
          pointing into the margin so viewers know this list is demo-only. */}
      <div className="relative space-y-1.5">
        {bin.items.map((it) => {
          const n = Math.min(scanned[it.sku] ?? 0, it.qty);
          const complete = n === it.qty;
          return (
            <button
              key={it.sku}
              type="button"
              onClick={() => handleScan(it.sku)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md border p-2 text-left transition-colors",
                complete
                  ? "border-status-picked/30 bg-status-picked/5"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <img
                src={it.image}
                alt=""
                className="h-9 w-9 shrink-0 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">{it.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  {it.sku}
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 font-mono text-xs font-semibold tabular-nums",
                  complete ? "text-status-picked" : "text-muted-foreground",
                )}
              >
                {n}/{it.qty}
              </span>
            </button>
          );
        })}

        <SimulationNote />
      </div>
    </div>
  );
}

// A hand-annotation style callout: a dot on the item list, a connector line
// into the margin, and a note flagging that this list is simulation-only.
function SimulationNote() {
  return (
    <div className="pointer-events-none absolute left-full top-1/2 hidden -translate-y-1/2 items-center lg:flex">
      {/* dot on the list edge */}
      <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-amber-500 bg-amber-100" />
      {/* connector line */}
      <span className="h-px w-12 shrink-0 border-t-2 border-dashed border-amber-400" />
      {/* note */}
      <div className="w-52 -rotate-1 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-900 shadow-sm">
        <span className="font-semibold">Only for simulation</span> — these items
        won't be displayed in the real app. The operator just scans; this
        on-screen list is a prototype aid.
      </div>
    </div>
  );
}

// ── Scan field with suggestion ───────────────────────────────────────────────
function ScanField({
  label,
  suggested,
  confirmedValue,
  onConfirm,
  onReset,
}: {
  label: string;
  suggested: string;
  confirmedValue?: string;
  onConfirm: (value: string) => void;
  onReset: () => void;
}) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState(false);
  const confirmed = confirmedValue != null;

  const submit = (raw: string) => {
    if (raw.trim().toUpperCase() === suggested.toUpperCase()) {
      onConfirm(suggested);
      setErr(false);
      setVal("");
    } else {
      setErr(true);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </span>
        {confirmed ? (
          <button
            type="button"
            onClick={() => {
              onReset();
              setVal("");
            }}
            className="text-[10px] font-medium text-muted-foreground underline underline-offset-2"
          >
            Rescan
          </button>
        ) : (
          <button
            type="button"
            onClick={() => submit(suggested)}
            className="rounded-[2px] bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground"
          >
            Suggested: {suggested}
          </button>
        )}
      </div>

      {confirmed ? (
        <div className="flex items-center gap-2 rounded-md border border-status-picked/30 bg-status-picked/5 p-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-status-picked" />
          <span className="font-mono text-sm font-semibold">
            {confirmedValue}
          </span>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(val);
          }}
        >
          <Input
            value={val}
            onChange={(e) => {
              setVal(e.target.value);
              setErr(false);
            }}
            placeholder="Scan…"
            className={cn(
              "h-10 font-mono text-sm",
              err && "border-destructive focus-visible:ring-destructive",
            )}
          />
        </form>
      )}
      {err && (
        <p className="text-[10px] font-medium text-destructive">
          Scanned code doesn't match the suggested {label.toLowerCase()}.
        </p>
      )}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2.5 text-xs font-medium text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

function ScanRow({
  placeholder,
  onScan,
  autoFocus,
}: {
  placeholder: string;
  onScan: (value: string) => void;
  autoFocus?: boolean;
}) {
  const [val, setVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  return (
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
        className="h-10 font-mono text-sm"
      />
    </form>
  );
}
