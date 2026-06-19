import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronRight,
  FileText,
  Layers,
  PackageCheck,
  ScanBarcode,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  KIT_MAPPINGS,
  KIT_ORDERS,
  type KitOrderRow,
} from "@/lib/wms/kit-data";

export const Route = createFileRoute("/_wms/kitting")({
  head: () => ({
    meta: [{ title: "Kitting — Inventory" }],
  }),
  component: KittingScreen,
});

const norm = (v: string) => v.trim().toUpperCase();

interface ComponentLine {
  sku: string;
  name: string;
  perKit: number;
  required: number;
  scanned: number;
}

interface KittingResult {
  doc: string;
  lpn: string;
  order: KitOrderRow;
  components: ComponentLine[];
}

function KittingScreen() {
  // Kit orders that have been picked and are ready for assembly.
  const readyOrders = useMemo(
    () => KIT_ORDERS.filter((o) => o.type === "Kit" && o.status === "Picked"),
    [],
  );

  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lpn, setLpn] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [docCounter, setDocCounter] = useState(7);
  const [result, setResult] = useState<KittingResult | null>(null);

  const openOrders = readyOrders.filter((o) => !doneIds.includes(o.id));
  const selected = readyOrders.find((o) => o.id === selectedId) ?? null;
  const mapping = selected
    ? KIT_MAPPINGS.find((m) => m.kitSku === selected.kitSku) ?? null
    : null;

  // Expected scan order — kit by kit, each component in mapping order repeated
  // by its per-kit quantity. e.g. one kit of A×2,B×1 → [A,A,B], then repeat.
  const expectedSequence = useMemo<string[]>(() => {
    if (!selected || !mapping) return [];
    const seq: string[] = [];
    for (let k = 0; k < selected.kitQty; k++) {
      for (const c of mapping.components) {
        for (let i = 0; i < c.qty; i++) seq.push(c.sku);
      }
    }
    return seq;
  }, [selected, mapping]);

  const perKitUnits = mapping
    ? mapping.components.reduce((s, c) => s + c.qty, 0)
    : 0;
  const totalUnits = expectedSequence.length;
  const expectedSku = step < totalUnits ? expectedSequence[step] : null;
  const currentKit =
    perKitUnits > 0
      ? Math.min(selected?.kitQty ?? 0, Math.floor(step / perKitUnits) + 1)
      : 0;

  const components = useMemo<ComponentLine[]>(() => {
    if (!selected || !mapping) return [];
    const scannedSoFar = expectedSequence.slice(0, step);
    return mapping.components.map((c) => ({
      sku: c.sku,
      name: c.name,
      perKit: c.qty,
      required: c.qty * selected.kitQty,
      scanned: scannedSoFar.filter((s) => s === c.sku).length,
    }));
  }, [selected, mapping, expectedSequence, step]);

  const allScanned = totalUnits > 0 && step >= totalUnits;

  const openOrder = (id: string) => {
    setSelectedId(id);
    setLpn(null);
    setStep(0);
    setResult(null);
  };

  const backToList = () => {
    setSelectedId(null);
    setLpn(null);
    setStep(0);
    setResult(null);
  };

  const scanLpn = (raw: string) => {
    if (!raw.trim()) return;
    setLpn(norm(raw));
    toast.success(`LPN ${norm(raw)} scanned`);
  };

  const scanChild = (raw: string) => {
    if (!expectedSku) return;
    const code = norm(raw);
    if (code !== norm(expectedSku)) {
      toast.error(`Expected ${expectedSku} next — scan as per kit sequence`);
      return;
    }
    setStep((s) => s + 1);
  };

  const performKitting = () => {
    if (!selected || !lpn || !allScanned) return;
    const doc = `KITTING-${String(docCounter).padStart(2, "0")}`;
    setResult({ doc, lpn, order: selected, components });
    setDoneIds((prev) => [...prev, selected.id]);
    setDocCounter((c) => c + 1);
    toast.success(
      `${doc} created — ${selected.kitQty} units of ${selected.kitSku} ready for putaway`,
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold">Kitting</h1>
        <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
          Select a picked kit order, scan the LPN, then scan each child SKU in
          the mapped sequence — one kit at a time. A kitting document is
          generated for putaway: child stock is consumed and fresh kit-SKU
          inventory is created.
        </p>
      </div>

      {/* ── Success / document ─────────────────────────────────────────────── */}
      {result ? (
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <FileText className="h-4 w-4 text-primary" />
            <div className="text-sm font-semibold">Kitting Completed</div>
          </div>
          <div className="space-y-5 p-5">
            <div className="flex items-start gap-3 rounded-md border border-ok/30 bg-ok-bg p-4 text-ok">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <div className="text-sm font-semibold">
                  Kitting document {result.doc} created
                </div>
                <div className="mt-0.5 text-xs">
                  Output staged on LPN{" "}
                  <span className="font-mono font-semibold">{result.lpn}</span>.
                  This document is the basis for putaway (handled like a GRN).
                </div>
              </div>
            </div>

            {/* Inventory effect */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-border p-4">
                <div className="mb-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  Child SKUs consumed
                </div>
                <div className="space-y-1.5">
                  {result.components.map((c) => (
                    <div
                      key={c.sku}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate text-muted-foreground">
                        <span className="font-mono text-foreground">
                          {c.sku}
                        </span>{" "}
                        {c.name}
                      </span>
                      <span className="font-mono font-semibold text-risk">
                        −{c.required}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-border p-4">
                <div className="mb-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  Kit SKU created
                </div>
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm text-muted-foreground">
                    <span className="font-mono text-foreground">
                      {result.order.kitSku}
                    </span>{" "}
                    {result.order.kitName}
                  </span>
                  <span className="font-mono text-lg font-semibold text-ok">
                    +{result.order.kitQty}
                  </span>
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-warn/30 bg-warn-bg px-2.5 py-1 text-xs text-warn">
                  <PackageCheck className="h-3.5 w-3.5" />
                  Pending putaway
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <Button onClick={backToList} className="gap-2">
                Kit another order
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ) : selected ? (
        /* ── Scan & kit ───────────────────────────────────────────────────── */
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
            <button
              type="button"
              onClick={backToList}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Orders
            </button>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-mono font-semibold">{selected.id}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-mono">{selected.kitSku}</span>
              <span className="text-muted-foreground">{selected.kitName}</span>
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs">
                {selected.kitQty} kits
              </span>
            </div>
          </div>

          <div className="space-y-5 p-5">
            {/* Step 1 — LPN */}
            {!lpn ? (
              <div className="space-y-4">
                <Stepper current={1} />
                <Card className="max-w-md space-y-3 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Boxes className="h-4 w-4 text-primary" />
                    Scan the LPN / tote to stage the kits
                  </div>
                  <ScanRow
                    label="Scan LPN"
                    placeholder="e.g. LPN-7001"
                    autoValue="LPN-7001"
                    onScan={scanLpn}
                  />
                </Card>
              </div>
            ) : (
              <div className="space-y-4">
                <Stepper current={2} />

                {/* LPN confirmed + sequence prompt */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-ok" />
                    LPN
                    <span className="font-mono font-semibold">{lpn}</span>
                  </div>
                  {!allScanned ? (
                    <div className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs">
                      <span className="text-muted-foreground">
                        Building kit {currentKit} of {selected.kitQty} · Next
                        scan
                      </span>
                      <span className="font-mono font-semibold text-primary">
                        {expectedSku}
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-md border border-ok/30 bg-ok-bg px-3 py-1.5 text-xs text-ok">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      All {totalUnits} units scanned
                    </div>
                  )}
                </div>

                {!allScanned && (
                  <ScanRow
                    label="Scan child SKU (in sequence)"
                    placeholder={expectedSku ?? ""}
                    autoValue={expectedSku ?? undefined}
                    onScan={scanChild}
                  />
                )}

                {/* Component checklist */}
                <div className="overflow-hidden rounded-md border border-border">
                  <div className="grid grid-cols-[6rem_1fr_5rem_8rem] gap-3 border-b border-border bg-muted/30 px-4 py-2.5 text-[10px] font-semibold font-mono uppercase tracking-[0.08em] text-muted-foreground">
                    <span>SKU</span>
                    <span>Item</span>
                    <span className="text-right">Per Kit</span>
                    <span className="text-right">Scanned</span>
                  </div>
                  <div className="divide-y divide-border">
                    {components.map((c) => {
                      const done = c.scanned >= c.required;
                      const isNext = expectedSku === c.sku;
                      const pct = Math.min(
                        100,
                        Math.round((c.scanned / c.required) * 100),
                      );
                      return (
                        <div
                          key={c.sku}
                          className={cn(
                            "grid grid-cols-[6rem_1fr_5rem_8rem] items-center gap-3 px-4 py-3 text-sm",
                            isNext && "bg-primary/5",
                          )}
                        >
                          <span className="font-mono text-xs font-medium">
                            {c.sku}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-muted-foreground">
                              {c.name}
                            </div>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-[2px] bg-muted">
                              <div
                                className={cn(
                                  "h-full rounded-[2px] transition-all",
                                  done ? "bg-ok" : "bg-primary",
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-right font-mono tabular-nums">
                            {c.perKit}
                          </span>
                          <span className="flex items-center justify-end gap-1.5 font-mono tabular-nums">
                            <span>
                              <span
                                className={cn(
                                  "font-semibold",
                                  done ? "text-ok" : "text-foreground",
                                )}
                              >
                                {c.scanned}
                              </span>
                              <span className="text-muted-foreground">
                                {" "}
                                / {c.required}
                              </span>
                            </span>
                            {done && (
                              <CheckCircle2 className="h-4 w-4 text-ok" />
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                  <Button
                    onClick={performKitting}
                    disabled={!allScanned}
                    className="gap-2"
                  >
                    <Layers className="h-4 w-4" />
                    Complete Kitting
                  </Button>
                  {!allScanned && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setStep(totalUnits)}
                    >
                      Auto-scan all
                    </Button>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {allScanned
                      ? "All components scanned — ready to create the kitting document."
                      : "Scan the highlighted SKU to continue the kit sequence."}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      ) : (
        /* ── Order selection ──────────────────────────────────────────────── */
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="text-sm font-semibold">
              Kit Orders Ready for Kitting{" "}
              <span className="ml-1.5 rounded-[3px] bg-primary/10 px-2 py-0.5 font-mono text-xs font-medium text-primary">
                {openOrders.length}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Picked orders awaiting assembly
            </div>
          </div>

          {openOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 opacity-30" />
              <p className="text-sm">No kit orders are waiting to be kitted.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {openOrders.map((o) => {
                const m = KIT_MAPPINGS.find((x) => x.kitSku === o.kitSku);
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => openOrder(o.id)}
                    className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold">
                          {o.id}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {o.kitSku}
                        </span>
                        <span className="text-sm">{o.kitName}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {o.kitQty} kits · {m?.components.length ?? 0} child SKUs ·
                        Created {o.createdAt}
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-[2px] border border-sys/30 bg-sys-bg px-2 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em] text-sys">
                      Picked
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function Stepper({ current }: { current: 1 | 2 }) {
  const steps = ["Scan LPN", "Scan child SKUs"];
  return (
    <div className="flex items-center gap-2 text-xs">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-[3px] font-mono text-[10px] font-semibold",
                done
                  ? "bg-ok text-white"
                  : active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {done ? "✓" : n}
            </span>
            <span
              className={cn(
                active ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {n < steps.length && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Scan / type a barcode. */
function ScanRow({
  label,
  placeholder,
  autoValue,
  onScan,
}: {
  label: string;
  placeholder: string;
  autoValue?: string;
  onScan: (value: string) => void;
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
      <div className="mb-1.5 flex items-center gap-2">
        <ScanBarcode className="h-3.5 w-3.5 text-muted-foreground" />
        <label className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </label>
      </div>
      <div className="flex max-w-md gap-2">
        <Input
          ref={inputRef}
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder}
          className="h-11 font-mono text-sm"
        />
        <Button type="submit" variant="secondary" className="h-11">
          Scan
        </Button>
        {autoValue && (
          <Button
            type="button"
            variant="ghost"
            className="h-11 px-2 text-xs"
            onClick={() => {
              onScan(autoValue);
              setVal("");
            }}
          >
            Auto
          </Button>
        )}
      </div>
    </form>
  );
}
