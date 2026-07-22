import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  Layers,
  Lock,
  Package,
  PackageCheck,
  Plus,
  ScanBarcode,
  Search,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PackItem } from "@/lib/wms/pack-data";

export const Route = createFileRoute("/_wms/pack-b2b")({
  head: () => ({
    meta: [{ title: "B2B Pack (Multi-box) — WMS" }],
  }),
  component: PackB2BStation,
});

// ─── Data ─────────────────────────────────────────────────────────────────────

const img = (seed: string) => `https://picsum.photos/seed/${seed}/400/400`;

interface B2BOrder {
  orderNo: string;
  poNo: string;
  retailer: string;
  destination: string;
  sla: string;
  items: PackItem[];
}

interface Carton {
  id: string;
  name: string;
  dims: string;
}

const CARTONS: Carton[] = [
  { id: "CTN-S", name: "Small Carton", dims: "30×20×15 cm" },
  { id: "CTN-M", name: "Medium Carton", dims: "45×30×25 cm" },
  { id: "CTN-L", name: "Large Carton", dims: "60×40×40 cm" },
  { id: "PLT-STD", name: "Std Pallet", dims: "120×100 cm" },
];

const B2B_ORDER: B2BOrder = {
  orderNo: "WMS-B2B-50418",
  poNo: "PO-DMART-88722",
  retailer: "D-Mart · MYS-Saraswatipuram",
  destination: "RDC Mysuru · Dock 4",
  sla: "24h",
  items: [
    {
      sku: "HUL-SOAP-125",
      ean: "8901030512345",
      name: "Lifebuoy Soap 125g (Pack of 4)",
      qty: 24,
      image: img("soap-125"),
      brand: "HUL",
      size: "125 g × 4",
      weight: "560 g",
      mrp: "₹160",
    },
    {
      sku: "HUL-SHMP-340",
      ean: "8901030522345",
      name: "Sunsilk Shampoo 340ml",
      qty: 18,
      image: img("shmp-340"),
      brand: "HUL",
      size: "340 ml",
      weight: "380 g",
      mrp: "₹299",
    },
    {
      sku: "NST-MAGGI-560",
      ean: "8901058812345",
      name: "Maggi Noodles 8-pack 560g",
      qty: 30,
      image: img("maggi-560"),
      brand: "Nestlé",
      size: "560 g",
      weight: "620 g",
      mrp: "₹96",
    },
    {
      sku: "PNG-TIDE-1KG",
      ean: "8901072312345",
      name: "Tide Detergent 1kg",
      qty: 12,
      image: img("tide-1kg"),
      brand: "P&G",
      size: "1 kg",
      weight: "1.05 kg",
      mrp: "₹110",
    },
    {
      sku: "DAB-HONEY-500",
      ean: "8901207812345",
      name: "Dabur Honey 500g",
      qty: 6,
      image: img("honey-500"),
      brand: "Dabur",
      size: "500 g",
      weight: "560 g",
      mrp: "₹250",
    },
  ],
};

const toteOrderMap: Record<string, B2BOrder> = {
  "TOTE-B2B-01": B2B_ORDER,
  "PLT-B2B-01": B2B_ORDER,
};

const getOrderByTote = (toteId: string): B2BOrder | null =>
  toteOrderMap[toteId.trim().toUpperCase()] ?? null;

// ─── Types ─────────────────────────────────────────────────────────────────────

type Step = "scan-station" | "scan-tote" | "packing";

interface Box {
  id: string;
  carton: string | null;
  closed: boolean;
  lines: Record<string, number>;
}

const boxUnits = (b: Box) => Object.values(b.lines).reduce((s, n) => s + n, 0);

// ─── Screen ─────────────────────────────────────────────────────────────────────

function PackB2BStation() {
  const [step, setStep] = useState<Step>("scan-station");
  const [stationId, setStationId] = useState("");
  const [order, setOrder] = useState<B2BOrder | null>(null);
  const [toteError, setToteError] = useState<string | null>(null);
  const [itemError, setItemError] = useState<string | null>(null);
  const [scanKey, setScanKey] = useState(0);

  const [boxes, setBoxes] = useState<Box[]>([]);
  const [activeBoxId, setActiveBoxId] = useState("");
  const [lastScanned, setLastScanned] = useState<PackItem | null>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [nextToteError, setNextToteError] = useState<string | null>(null);

  const totalUnits = order?.items.reduce((s, it) => s + it.qty, 0) ?? 0;

  // aggregate scanned qty per sku across all boxes
  const scannedBySku = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const b of boxes) {
      for (const [sku, n] of Object.entries(b.lines)) {
        acc[sku] = (acc[sku] ?? 0) + n;
      }
    }
    return acc;
  }, [boxes]);

  const totalScanned = Object.values(scannedBySku).reduce((s, n) => s + n, 0);
  const progressPct =
    totalUnits === 0 ? 0 : Math.round((totalScanned / totalUnits) * 100);
  const allScanned = totalScanned === totalUnits && totalUnits > 0;

  const nonEmptyBoxes = boxes.filter((b) => boxUnits(b) > 0);
  const allBoxesClosed = nonEmptyBoxes.every((b) => b.closed);
  const finalizeReady = allScanned && allBoxesClosed && nonEmptyBoxes.length > 0;

  const activeBox = boxes.find((b) => b.id === activeBoxId) ?? null;

  // ── Actions ──────────────────────────────────────────────────────────────
  const onStationScan = (val: string) => {
    setStationId(val.trim().toUpperCase());
    setStep("scan-tote");
  };

  const loadTote = (val: string): boolean => {
    const o = getOrderByTote(val);
    if (!o) return false;
    setOrder(o);
    const firstBox: Box = { id: "B1", carton: null, closed: false, lines: {} };
    setBoxes([firstBox]);
    setActiveBoxId("B1");
    setLastScanned(null);
    setItemError(null);
    setStep("packing");
    return true;
  };

  const onToteScan = (val: string) => {
    if (!loadTote(val)) {
      setToteError(`No B2B order found for ${val.trim().toUpperCase()}`);
      setScanKey((k) => k + 1);
    } else {
      setToteError(null);
    }
  };

  const addBox = () => {
    const nextN = boxes.length + 1;
    const id = `B${nextN}`;
    setBoxes((prev) => [
      ...prev,
      { id, carton: null, closed: false, lines: {} },
    ]);
    setActiveBoxId(id);
    toast(`Box ${id} opened`, { icon: "📦" });
  };

  const onItemScan = (val: string) => {
    if (!order) return;
    const sku = val.trim().toUpperCase();
    const item = order.items.find((it) => it.sku.toUpperCase() === sku);
    if (!item) {
      setItemError(`SKU ${sku} is not part of this PO.`);
      setScanKey((k) => k + 1);
      return;
    }
    if ((scannedBySku[item.sku] ?? 0) >= item.qty) {
      setItemError(`${item.name} already fully packed.`);
      setScanKey((k) => k + 1);
      return;
    }
    if (!activeBox || activeBox.closed) {
      setItemError("No open box. Open a box before scanning.");
      setScanKey((k) => k + 1);
      return;
    }
    setItemError(null);
    setLastScanned(item);
    setBoxes((prev) =>
      prev.map((b) =>
        b.id === activeBoxId
          ? { ...b, lines: { ...b.lines, [item.sku]: (b.lines[item.sku] ?? 0) + 1 } }
          : b,
      ),
    );
    setScanKey((k) => k + 1);
  };

  const setActiveCarton = (cartonId: string) => {
    setBoxes((prev) =>
      prev.map((b) => (b.id === activeBoxId ? { ...b, carton: cartonId } : b)),
    );
  };

  const closeBox = (boxId: string) => {
    const box = boxes.find((b) => b.id === boxId);
    if (!box) return;
    if (boxUnits(box) === 0) {
      toast.error("Box is empty — scan items before closing.");
      return;
    }
    if (!box.carton) {
      toast.error("Select a carton type before closing the box.");
      return;
    }
    setBoxes((prev) =>
      prev.map((b) => (b.id === boxId ? { ...b, closed: true } : b)),
    );
    const carton = CARTONS.find((c) => c.id === box.carton);
    toast.success(`Box ${boxId} closed — label printed`, {
      description: `${carton?.name} · ${boxUnits(box)} units`,
    });
    // auto-open a fresh box if units remain
    const remaining = totalUnits - totalScanned;
    if (remaining > 0) {
      const nextN = boxes.length + 1;
      const id = `B${nextN}`;
      setBoxes((prev) => [
        ...prev,
        { id, carton: null, closed: false, lines: {} },
      ]);
      setActiveBoxId(id);
    }
  };

  const reopenBox = (boxId: string) => {
    setBoxes((prev) =>
      prev.map((b) => (b.id === boxId ? { ...b, closed: false } : b)),
    );
    setActiveBoxId(boxId);
  };

  const resetStation = () => {
    setOrder(null);
    setBoxes([]);
    setActiveBoxId("");
    setLastScanned(null);
    setItemError(null);
    setToteError(null);
    setItemSearch("");
    setStep("scan-tote");
    setScanKey((k) => k + 1);
  };

  const onNextToteScan = (val: string) => {
    if (!loadTote(val)) {
      setNextToteError(`No B2B order found for ${val.trim().toUpperCase()}`);
    } else {
      setFinalizeOpen(false);
      setNextToteError(null);
    }
  };

  // packed table rows: one row per sku+box
  const packedRows = useMemo(() => {
    if (!order) return [];
    const rows: Array<{
      sku: string;
      name: string;
      qty: number;
      mrp: string;
      box: string;
      image: string;
    }> = [];
    for (const b of boxes) {
      for (const [sku, n] of Object.entries(b.lines)) {
        const item = order.items.find((it) => it.sku === sku);
        if (!item || n === 0) continue;
        rows.push({
          sku,
          name: item.name,
          qty: n,
          mrp: item.mrp ?? "—",
          box: b.id,
          image: item.image,
        });
      }
    }
    return rows;
  }, [boxes, order]);

  const filteredRows = itemSearch.trim()
    ? packedRows.filter((p) =>
        [p.sku, p.name, p.box].some((f) =>
          f.toLowerCase().includes(itemSearch.trim().toLowerCase()),
        ),
      )
    : packedRows;

  return (
    <div className="flex h-full flex-col">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-2.5">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <Boxes className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">B2B Pack</span>
          </div>
          <span className="rounded-[3px] border border-sys/30 bg-sys-bg px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-sys">
            Multi-box
          </span>
          {order && (
            <>
              <span className="text-border">|</span>
              <span className="text-sm">
                <span className="text-muted-foreground">PO: </span>
                <span className="font-bold font-mono">{order.poNo}</span>
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {stationId && (
            <span className="text-sm">
              <span className="text-muted-foreground">Table ID: </span>
              <span className="font-bold font-mono">{stationId}</span>
            </span>
          )}
          {step === "packing" && (
            <span className="flex items-center gap-1.5 text-sm">
              <Boxes className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Boxes: </span>
              <span className="font-bold tabular-nums">{nonEmptyBoxes.length}</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-4">
        {/* ── Scan station ── */}
        {step === "scan-station" && (
          <Card className="max-w-md space-y-3 p-4">
            <SectionLabel icon={ScanBarcode} text="Scan packing station" />
            <ScanRow
              key="station"
              placeholder="e.g. PKS-B2B-01"
              onScan={onStationScan}
              autoFocus
            />
          </Card>
        )}

        {/* ── Scan tote ── */}
        {step === "scan-tote" && (
          <Card className="max-w-md space-y-3 p-4">
            <SectionLabel icon={ScanBarcode} text="Scan pick tote / pallet" />
            {toteError && <ErrorBanner message={toteError} />}
            <ScanRow
              key={`tote-${scanKey}`}
              placeholder="Scan tote or pallet barcode…"
              onScan={onToteScan}
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground">
              Demo barcodes:{" "}
              <span className="font-mono">TOTE-B2B-01</span> ·{" "}
              <span className="font-mono">PLT-B2B-01</span>
            </p>
          </Card>
        )}

        {/* ── Packing ── */}
        {step === "packing" && order && (
          <>
            {/* Order info strip */}
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-4">
              <InfoCell label="Order No" value={order.orderNo} mono />
              <InfoCell label="Retailer" value={order.retailer} />
              <InfoCell label="Ship to" value={order.destination} icon={Truck} />
              <InfoCell
                label="Lines · Units"
                value={`${order.items.length} · ${totalUnits}`}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
              {/* Left: scan + item preview */}
              <div className="space-y-4">
                <Card className="space-y-2 p-4">
                  <label className="block text-xs font-semibold text-foreground">
                    Scan Item into Box{" "}
                    <span className="font-mono text-sys">{activeBoxId}</span>
                    <span className="text-destructive">*</span>
                  </label>
                  <ScanRowInline
                    key={`item-${scanKey}`}
                    placeholder="Scan or type SKU & enter"
                    onScan={onItemScan}
                    autoFocus
                    disabled={!activeBox || activeBox.closed}
                  />
                  {itemError && <ErrorBanner message={itemError} />}
                  {(!activeBox || activeBox.closed) && (
                    <p className="text-[11px] text-warn">
                      No open box — open a box to continue scanning.
                    </p>
                  )}
                </Card>

                <Card className="overflow-hidden p-0">
                  <div className="aspect-square w-full bg-muted/10">
                    {lastScanned ? (
                      <img
                        src={lastScanned.image}
                        alt={lastScanned.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                        <Package className="h-10 w-10 text-muted-foreground/20" />
                        <span className="px-4 text-[11px] text-muted-foreground/60">
                          Scan an item to preview
                        </span>
                      </div>
                    )}
                  </div>
                  {lastScanned && (
                    <div className="space-y-0.5 p-3">
                      <div className="text-sm font-semibold leading-snug">
                        {lastScanned.name}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {lastScanned.sku}
                      </div>
                      <div className="pt-1 text-[11px] text-muted-foreground">
                        {[lastScanned.brand, lastScanned.size, lastScanned.mrp]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* Right: boxes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    Boxes / Cartons
                  </h2>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs"
                    onClick={addBox}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Box
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {boxes.map((b) => {
                    const units = boxUnits(b);
                    const isActive = b.id === activeBoxId;
                    const carton = CARTONS.find((c) => c.id === b.carton);
                    return (
                      <div
                        key={b.id}
                        className={cn(
                          "rounded-lg border p-3 transition-colors",
                          b.closed
                            ? "border-status-picked/40 bg-status-picked/5"
                            : isActive
                              ? "border-sys/50 bg-sys-bg/40 ring-1 ring-sys/30"
                              : "border-border bg-card",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => !b.closed && setActiveBoxId(b.id)}
                            className="flex items-center gap-2"
                          >
                            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-background text-sys">
                              <Package className="h-4 w-4" />
                            </span>
                            <span className="font-mono text-sm font-bold">
                              {b.id}
                            </span>
                          </button>
                          {b.closed ? (
                            <span className="inline-flex items-center gap-1 rounded-[3px] border border-status-picked/30 bg-status-picked/10 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-status-picked">
                              <Lock className="h-3 w-3" />
                              Closed
                            </span>
                          ) : isActive ? (
                            <span className="rounded-[3px] border border-sys/30 bg-sys-bg px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-sys">
                              Active
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActiveBoxId(b.id)}
                              className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                            >
                              Make active
                            </button>
                          )}
                        </div>

                        <div className="mt-2 flex items-baseline justify-between text-xs">
                          <span className="text-muted-foreground">Units</span>
                          <span className="font-mono font-semibold tabular-nums">
                            {units}
                          </span>
                        </div>

                        {b.closed ? (
                          <div className="mt-1 space-y-2">
                            <div className="flex items-baseline justify-between text-xs">
                              <span className="text-muted-foreground">Carton</span>
                              <span className="font-medium">
                                {carton?.name ?? "—"}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-full text-[11px]"
                              onClick={() => reopenBox(b.id)}
                            >
                              Reopen
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-2 space-y-2">
                            <Select
                              value={b.carton ?? ""}
                              onValueChange={(v) => {
                                setActiveBoxId(b.id);
                                setBoxes((prev) =>
                                  prev.map((x) =>
                                    x.id === b.id ? { ...x, carton: v } : x,
                                  ),
                                );
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Select carton…" />
                              </SelectTrigger>
                              <SelectContent>
                                {CARTONS.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    <span className="font-medium">{c.name}</span>
                                    <span className="ml-2 text-[11px] text-muted-foreground">
                                      {c.dims}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              className="h-8 w-full gap-1.5 text-xs"
                              disabled={units === 0 || !b.carton}
                              onClick={() => closeBox(b.id)}
                            >
                              <Lock className="h-3.5 w-3.5" />
                              Close &amp; print label
                            </Button>
                          </div>
                        )}

                        {/* per-box line preview */}
                        {units > 0 && (
                          <ul className="mt-2 space-y-0.5 border-t border-border/60 pt-2">
                            {Object.entries(b.lines).map(([sku, n]) => {
                              const it = order.items.find((x) => x.sku === sku);
                              return (
                                <li
                                  key={sku}
                                  className="flex items-center justify-between gap-2 text-[11px]"
                                >
                                  <span className="truncate text-muted-foreground">
                                    {it?.name ?? sku}
                                  </span>
                                  <span className="font-mono tabular-nums">
                                    ×{n}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-1.5 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium">Packed</span>
                  <span className="font-mono font-semibold tabular-nums text-foreground">
                    {totalScanned}/{totalUnits}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {allScanned && (
                    <span className="flex items-center gap-1 font-medium text-ok">
                      <PackageCheck className="h-3.5 w-3.5" />
                      All units packed
                    </span>
                  )}
                  <span className="font-mono font-semibold text-foreground">
                    {progressPct}%
                  </span>
                </div>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-status-picked transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Packed items table */}
            <div className="pt-1">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">Packed Items by Box</h2>
                <div className="relative w-64">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="Search items or box…"
                    className="h-8 pl-8 text-xs"
                  />
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="text-[11px] font-semibold text-foreground/70">SKU</TableHead>
                      <TableHead className="text-[11px] font-semibold text-foreground/70">Description</TableHead>
                      <TableHead className="text-right text-[11px] font-semibold text-foreground/70">Qty</TableHead>
                      <TableHead className="text-[11px] font-semibold text-foreground/70">MRP</TableHead>
                      <TableHead className="text-[11px] font-semibold text-foreground/70">Box No.</TableHead>
                      <TableHead className="w-16 text-[11px] font-semibold text-foreground/70">Image</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Package className="h-10 w-10 opacity-20" />
                            <span className="text-sm">No items packed yet</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRows.map((p) => (
                        <TableRow
                          key={`${p.sku}-${p.box}`}
                          className="text-xs [&>td]:py-1"
                        >
                          <TableCell className="font-mono text-muted-foreground">{p.sku}</TableCell>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">{p.qty}</TableCell>
                          <TableCell>{p.mrp}</TableCell>
                          <TableCell>
                            <span className="rounded-[3px] border border-sys/30 bg-sys-bg px-1.5 py-0.5 font-mono text-[10px] font-semibold text-sys">
                              {p.box}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="h-8 w-8 overflow-hidden rounded border border-border bg-muted/20">
                              <img
                                src={p.image}
                                alt={p.name}
                                className="h-full w-full object-contain p-0.5"
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Finalize bar */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground">
                {finalizeReady ? (
                  <span className="flex items-center gap-1.5 font-medium text-ok">
                    <CheckCircle2 className="h-4 w-4" />
                    All units packed across {nonEmptyBoxes.length}{" "}
                    {nonEmptyBoxes.length === 1 ? "box" : "boxes"} — ready to ship.
                  </span>
                ) : !allScanned ? (
                  <span>
                    {totalUnits - totalScanned} unit
                    {totalUnits - totalScanned === 1 ? "" : "s"} left to pack.
                  </span>
                ) : (
                  <span>Close all boxes to finalize.</span>
                )}
              </div>
              <Button
                className="gap-1.5"
                disabled={!finalizeReady}
                onClick={() => setFinalizeOpen(true)}
              >
                <Truck className="h-4 w-4" />
                Finalize shipment
              </Button>
            </div>
          </>
        )}
      </div>

      {/* ── Finalize dialog ── */}
      <Dialog open={finalizeOpen} onOpenChange={() => {}}>
        <DialogContent
          className="max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-3 rounded-md border border-status-picked/30 bg-status-picked/5 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-status-picked/15">
              <CheckCircle2 className="h-5 w-5 text-status-picked" />
            </div>
            <div>
              <div className="text-sm font-semibold">
                Shipment Packed &amp; Labels Printed
              </div>
              <div className="text-xs text-muted-foreground">
                Invoice, box labels and manifest sent to printer.
              </div>
            </div>
          </div>

          {order && (
            <div className="space-y-1.5 rounded-md border border-border bg-muted/20 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">PO</span>
                <span className="font-mono font-semibold">{order.poNo}</span>
              </div>
              {nonEmptyBoxes.map((b) => {
                const carton = CARTONS.find((c) => c.id === b.carton);
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="font-mono font-semibold">
                      {order.orderNo}-{b.id}
                    </span>
                    <span className="text-muted-foreground">
                      {carton?.name} · {boxUnits(b)} units
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-2">
            <SectionLabel icon={ScanBarcode} text="Scan next tote / pallet" />
            {nextToteError && <ErrorBanner message={nextToteError} />}
            <ScanRow
              key={`next-${finalizeOpen}`}
              placeholder="Scan next barcode…"
              onScan={onNextToteScan}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                setFinalizeOpen(false);
                resetStation();
              }}
            >
              Done — no next tote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Small components ────────────────────────────────────────────────────────

function SectionLabel({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {text}
    </div>
  );
}

function InfoCell({
  label,
  value,
  mono = false,
  icon: Icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 flex items-center gap-1.5 truncate text-sm font-semibold",
          mono && "font-mono",
        )}
      >
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm font-medium text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

function ScanRowInline({
  placeholder,
  onScan,
  autoFocus,
  disabled,
}: {
  placeholder: string;
  onScan: (value: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  const [val, setVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <form
      className="flex gap-1.5"
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
        disabled={disabled}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
        className="h-10 flex-1 font-mono text-sm"
      />
      <button
        type="submit"
        disabled={disabled}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
        tabIndex={-1}
      >
        <ScanBarcode className="h-4 w-4" />
      </button>
    </form>
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
        className="h-11 font-mono text-sm"
      />
    </form>
  );
}
