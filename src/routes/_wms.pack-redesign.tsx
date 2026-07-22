import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Package,
  PackageCheck,
  ScanBarcode,
  SearchX,
  TriangleAlert,
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  allPackagingIds,
  channelPackaging,
  getOrderByTote,
  slaDeadline,
  type PackItem,
  type PackOrder,
} from "@/lib/wms/pack-data";

export const Route = createFileRoute("/_wms/pack-redesign")({
  head: () => ({
    meta: [{ title: "Pack (Redesign) — WMS" }],
  }),
  component: PackRedesignStation,
});

type PackStep = "scan-station" | "scan-tote" | "scan-items" | "scan-packaging";

const channelStyles: Record<string, string> = {
  Amazon: "bg-warn-bg text-warn border-warn/30",
  Flipkart: "bg-sys-bg text-sys border-sys/30",
  Shopify: "bg-ok-bg text-ok border-ok/30",
  Myntra: "bg-ai-bg text-ai border-ai-ring",
};

function PackRedesignStation() {
  const [step, setStep] = useState<PackStep>("scan-station");
  const [stationId, setStationId] = useState("");
  const [toteError, setToteError] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<PackOrder | null>(null);
  const [scannedQty, setScannedQty] = useState<Record<string, number>>({});
  const [nfSkus, setNfSkus] = useState<Set<string>>(new Set());
  const [damagedSkus, setDamagedSkus] = useState<Set<string>>(new Set());
  const [lastScannedItem, setLastScannedItem] = useState<PackItem | null>(null);
  const [packedItems, setPackedItems] = useState<
    { sku: string; name: string; qty: number; box: string; image: string }[]
  >([]);
  const [itemError, setItemError] = useState<string | null>(null);
  const [packagingError, setPackagingError] = useState<string | null>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [printToteError, setPrintToteError] = useState<string | null>(null);
  const [nfDialogOpen, setNfDialogOpen] = useState(false);
  const [nfSelectedSku, setNfSelectedSku] = useState("");
  const [scanKey, setScanKey] = useState(0);

  // Packing material adherence tracking — persistent across orders for the
  // duration of the packing station session.
  const [adhTotal, setAdhTotal] = useState(0);
  const [adhMatches, setAdhMatches] = useState(0);
  const adherencePct =
    adhTotal === 0 ? null : Math.round((adhMatches / adhTotal) * 100);

  const recommended = currentOrder ? channelPackaging[currentOrder.channel] : null;

  const totalItemQty =
    currentOrder?.items.reduce((s, it) => s + it.qty, 0) ?? 0;
  const totalScanned = Object.values(scannedQty).reduce((s, n) => s + n, 0);

  // Items not yet fully scanned and not already awaiting a replacement picklist
  const unscannedItems =
    currentOrder?.items.filter(
      (it) => (scannedQty[it.sku] ?? 0) < it.qty && !nfSkus.has(it.sku),
    ) ?? [];

  // Pack can close only when every single ordered unit has been scanned in.
  // Damaged or NF items do NOT bypass this — a fresh picklist is generated,
  // and the replacement still has to come into the pack via a scan.
  const checkAllDone = (qty: Record<string, number>) => {
    return currentOrder!.items.every(
      (it) => (qty[it.sku] ?? 0) >= it.qty,
    );
  };

  const allItemsDone = !!currentOrder && checkAllDone(scannedQty);

  // Box number is unique across the warehouse — order number + box index.
  const boxIdFor = (orderNo: string, n = 1) => `${orderNo}-B${n}`;

  const commitToPacked = (item: PackItem) => {
    if (!currentOrder) return;
    const box = boxIdFor(currentOrder.orderNo, 1);
    setPackedItems((prev) => {
      const existing = prev.find((p) => p.sku === item.sku);
      if (existing) {
        return prev.map((p) =>
          p.sku === item.sku ? { ...p, qty: p.qty + 1 } : p,
        );
      }
      return [
        ...prev,
        {
          sku: item.sku,
          name: item.name,
          qty: 1,
          box,
          image: item.image,
        },
      ];
    });
  };

  const onStationScan = (val: string) => {
    const id = val.trim().toUpperCase();
    setStationId(id);
    setStep("scan-tote");
  };

  const loadTote = (val: string): boolean => {
    const order = getOrderByTote(val);
    if (!order) return false;
    setCurrentOrder(order);
    setScannedQty({});
    setNfSkus(new Set());
    setDamagedSkus(new Set());
    setLastScannedItem(null);
    setPackedItems([]);
    setItemError(null);
    setStep("scan-items");
    return true;
  };

  const onToteScan = (val: string) => {
    if (!loadTote(val)) {
      setToteError(`No order found for tote ${val.trim().toUpperCase()}`);
      setScanKey((k) => k + 1);
    } else {
      setToteError(null);
    }
  };

  const onPrintToteScan = (val: string) => {
    if (!loadTote(val)) {
      setPrintToteError(`No order found for tote ${val.trim().toUpperCase()}`);
    } else {
      setPrintOpen(false);
      setPrintToteError(null);
      setScanKey((k) => k + 1);
    }
  };

  const onItemScan = (val: string) => {
    const sku = val.trim().toUpperCase();
    const item = currentOrder?.items.find((it) => it.sku.toUpperCase() === sku);
    if (!item) {
      setItemError(`SKU ${sku} is not part of this order.`);
      setScanKey((k) => k + 1);
      return;
    }
    const already = scannedQty[sku] ?? 0;
    if (already >= item.qty) {
      setItemError(`${item.name} already fully scanned.`);
      setScanKey((k) => k + 1);
      return;
    }
    setItemError(null);
    if (lastScannedItem) commitToPacked(lastScannedItem);
    setLastScannedItem(item);
    // Clear any prior NF / damaged flags for this SKU — this scan is the
    // replacement coming in to fulfil the pendency.
    if (nfSkus.has(sku)) {
      setNfSkus((s) => {
        const next = new Set(s);
        next.delete(sku);
        return next;
      });
    }
    if (damagedSkus.has(sku)) {
      setDamagedSkus((s) => {
        const next = new Set(s);
        next.delete(sku);
        return next;
      });
    }
    const newQty = { ...scannedQty, [sku]: already + 1 };
    setScannedQty(newQty);
    setScanKey((k) => k + 1);
  };

  const onMarkDamaged = () => {
    if (!lastScannedItem) return;
    const dmg = lastScannedItem;
    setDamagedSkus((s) => new Set(s).add(dmg.sku));
    // Undo the scan — the damaged unit doesn't go in the pack.
    setScannedQty((prev) => ({
      ...prev,
      [dmg.sku]: Math.max(0, (prev[dmg.sku] ?? 0) - 1),
    }));
    setLastScannedItem(null);
    toast.warning(`Picklist released — replacement requested for ${dmg.name}`, {
      duration: 10000,
      description: "A picker has been dispatched. Scan the replacement when it arrives.",
    });
    setScanKey((k) => k + 1);
  };

  const onConfirmNf = () => {
    if (!nfSelectedSku || !currentOrder) return;
    setNfSkus((s) => new Set(s).add(nfSelectedSku));
    const item = currentOrder.items.find((it) => it.sku === nfSelectedSku);
    toast.warning(
      `Picklist released — replacement requested for ${item?.name ?? nfSelectedSku}`,
      {
        duration: 10000,
        description: "A picker has been dispatched. Scan the replacement when it arrives.",
      },
    );
    setNfDialogOpen(false);
    setNfSelectedSku("");
    setScanKey((k) => k + 1);
  };

  const onPackagingScan = (val: string) => {
    if (!allItemsDone) {
      setPackagingError("Scan all items first before packaging.");
      setScanKey((k) => k + 1);
      return;
    }
    const id = val.trim().toUpperCase();
    if (!id) return;
    setPackagingError(null);
    // Any packaging barcode is accepted. Track adherence — only matches
    // against the system-recommended packaging count toward the %.
    setAdhTotal((n) => n + 1);
    if (recommended && id === recommended.id) {
      setAdhMatches((n) => n + 1);
    }
    if (lastScannedItem) commitToPacked(lastScannedItem);
    setLastScannedItem(null);
    setPrintOpen(true);
  };

  const onClosePrint = () => {
    setPrintOpen(false);
    setPrintToteError(null);
    setCurrentOrder(null);
    setScannedQty({});
    setNfSkus(new Set());
    setDamagedSkus(new Set());
    setLastScannedItem(null);
    setPackedItems([]);
    setItemError(null);
    setToteError(null);
    setStep("scan-tote");
    setScanKey((k) => k + 1);
  };

  return (
    <div className="pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 border-b border-border bg-background px-4 py-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <Package className="h-4 w-4 text-muted-foreground" />
          Pack
        </div>
        {stationId && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              Station{" "}
              <span className="font-mono font-semibold text-foreground">
                {stationId}
              </span>
            </span>
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    tabIndex={0}
                    className={cn(
                      "cursor-help rounded-[2px] border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em]",
                      adherencePct === null
                        ? "border-border bg-muted text-muted-foreground"
                        : adherencePct >= 90
                          ? "border-ok/30 bg-ok-bg text-ok"
                          : adherencePct >= 70
                            ? "border-warn/30 bg-warn-bg text-warn"
                            : "border-risk/30 bg-risk-bg text-risk",
                    )}
                  >
                    Adherence{" "}
                    {adherencePct === null ? "—" : `${adherencePct}%`}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[240px] text-xs">
                  Packing-material adherence for this packing station — the
                  percentage of orders packed using the system-recommended
                  packaging across the entire session.
                  {adherencePct !== null && (
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {adhMatches} of {adhTotal} packs matched the
                      recommendation.
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        {/* ── Scan station ── */}
        {step === "scan-station" && (
          <Card className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
              <ScanBarcode className="h-3.5 w-3.5" />
              Scan packing station
            </div>
            <ScanRow
              key="station"
              label=""
              placeholder="e.g. PKS-01"
              onScan={onStationScan}
              autoFocus
            />
          </Card>
        )}

        {/* ── Scan tote ── */}
        {step === "scan-tote" && (
          <Card className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
              <ScanBarcode className="h-3.5 w-3.5" />
              Scan pick tote
            </div>
            {toteError && <ErrorBanner message={toteError} />}
            <ScanRow
              key={`tote-${scanKey}`}
              label=""
              placeholder="Scan tote barcode…"
              onScan={onToteScan}
              autoFocus
            />
          </Card>
        )}

        {/* ── Scan items ── */}
        {step === "scan-items" && currentOrder && (
          <>
            <OrderCard order={currentOrder} />

            {/* Progress bar — full width, prominent */}
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                    Packing progress
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold tabular-nums text-foreground">
                      {totalScanned} / {totalItemQty}
                    </span>
                    <span className="text-xs text-muted-foreground">items</span>
                    {allItemsDone && (
                      <span className="flex items-center gap-1 rounded-[3px] border border-ok/30 bg-ok-bg px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-ok">
                        <PackageCheck className="h-3 w-3" />
                        All scanned
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-status-picked transition-all duration-300"
                    style={{
                      width: `${totalItemQty === 0 ? 0 : Math.round((totalScanned / totalItemQty) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  {currentOrder.items.map((it) => {
                    const scanned = scannedQty[it.sku] ?? 0;
                    const done = scanned >= it.qty;
                    const isNf = nfSkus.has(it.sku);
                    return (
                      <div
                        key={it.sku}
                        className={cn(
                          "min-w-0 flex-1 rounded-[3px] border px-2 py-1 text-[10px]",
                          done
                            ? "border-ok/30 bg-ok-bg text-ok"
                            : isNf
                              ? "border-warn/30 bg-warn-bg text-warn"
                              : "border-border bg-muted/30 text-muted-foreground",
                        )}
                      >
                        <div className="truncate font-medium">{it.name}</div>
                        <div className="font-mono tabular-nums">
                          {scanned}/{it.qty}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Two-column: controls left, large image right */}
            <div className="flex gap-3 items-start">
              {/* Left: QC panel + scan input + packaging */}
              <div className="min-w-0 flex-1 space-y-3">
                <Card className="space-y-3 p-4">
                  {/* QC attributes + actions */}
                  <div className="space-y-2">
                    {lastScannedItem ? (
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <div className="text-base font-bold leading-tight">
                                {lastScannedItem.name}
                              </div>
                              {damagedSkus.has(lastScannedItem.sku) && (
                                <span className="shrink-0 rounded-[2px] border border-risk/30 bg-risk-bg px-1.5 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em] text-risk">
                                  Damaged
                                </span>
                              )}
                            </div>
                            <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
                              <QcRow label="SKU" value={lastScannedItem.sku} mono />
                              {lastScannedItem.mrp && (
                                <QcRow label="MRP" value={lastScannedItem.mrp} />
                              )}
                              {lastScannedItem.color && (
                                <QcRow label="Colour" value={lastScannedItem.color} />
                              )}
                              {lastScannedItem.size && (
                                <QcRow label="Size" value={lastScannedItem.size} />
                              )}
                              {lastScannedItem.weight && (
                                <QcRow label="Weight" value={lastScannedItem.weight} />
                              )}
                              {lastScannedItem.lot && (
                                <QcRow label="Lot" value={lastScannedItem.lot} mono />
                              )}
                              {lastScannedItem.expiry && (
                                <QcRow label="Expiry" value={lastScannedItem.expiry} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-16 items-center text-xs text-muted-foreground">
                        QC details will appear here after scanning an item.
                      </div>
                    )}
                  </div>

                  {/* Actions row */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                      disabled={!lastScannedItem || damagedSkus.has(lastScannedItem.sku)}
                      onClick={onMarkDamaged}
                    >
                      <TriangleAlert className="mr-1.5 h-3.5 w-3.5" />
                      Mark Damaged
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={unscannedItems.length === 0}
                      onClick={() => {
                        setNfSelectedSku("");
                        setNfDialogOpen(true);
                      }}
                    >
                      <SearchX className="mr-1.5 h-3.5 w-3.5" />
                      Not Found
                    </Button>
                  </div>

                  {itemError && <ErrorBanner message={itemError} />}

                  <ScanRow
                    key={`item-${allItemsDone ? "done" : "live"}-${scanKey}`}
                    label="Scan item"
                    placeholder="Scan SKU…"
                    onScan={onItemScan}
                    autoFocus={!allItemsDone}
                  />

                  {/* Packaging scan — appears only after all items are scanned */}
                  {allItemsDone && recommended && (
                    <div className="space-y-2 border-t border-border pt-3">
                      <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 p-2.5">
                        <Package className="h-4 w-4 shrink-0 text-primary" />
                        <div className="min-w-0 text-xs">
                          <span className="text-muted-foreground">
                            Recommended packaging:{" "}
                          </span>
                          <span className="font-semibold">{recommended.name}</span>
                          <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                            ({recommended.id})
                          </span>
                        </div>
                      </div>
                      {packagingError && <ErrorBanner message={packagingError} />}
                      <ScanRow
                        key={`pkg-${scanKey}`}
                        label="Scan packaging material"
                        placeholder={`e.g. ${recommended.id}`}
                        onScan={onPackagingScan}
                        autoFocus
                      />
                    </div>
                  )}
                </Card>
              </div>

              {/* Right: large product image */}
              <div className="w-52 shrink-0">
                <Card className="overflow-hidden p-0">
                  <div className="h-64 w-full bg-muted/20">
                    {lastScannedItem ? (
                      <img
                        src={lastScannedItem.image}
                        alt={lastScannedItem.name}
                        className="h-full w-full object-contain p-3"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                        <Package className="h-10 w-10 text-muted-foreground/30" />
                        <span className="px-4 text-[11px] text-muted-foreground">
                          Scan an item to see its image
                        </span>
                      </div>
                    )}
                  </div>
                  {lastScannedItem && (
                    <div className="border-t border-border bg-muted/20 px-3 py-2">
                      <div className="truncate text-[11px] font-semibold leading-tight text-foreground">
                        {lastScannedItem.name}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {lastScannedItem.sku}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>

            {/* Packed items table */}
            {packedItems.length > 0 && (
              <Card className="overflow-hidden p-0">
                <div className="border-b border-border bg-muted/30 px-3 py-2 text-[11px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  Packed items ({packedItems.length})
                </div>
                <div className="[&_th]:px-3 [&_th]:py-2 [&_td]:px-3 [&_td]:py-2 [&_th]:h-auto [&_th]:text-[10px] [&_td]:text-xs">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20">
                        <TableHead className="w-12">Image</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Product Code</TableHead>
                        <TableHead>Box No.</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packedItems.map((p) => (
                        <TableRow key={p.sku}>
                          <TableCell>
                            <div className="h-10 w-10 overflow-hidden rounded border border-border bg-muted/30">
                              <img
                                src={p.image}
                                alt={p.name}
                                className="h-full w-full object-contain p-0.5"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {p.sku}
                          </TableCell>
                          <TableCell className="font-mono text-[10px]">
                            {p.box}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">
                            {p.qty}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      {/* ── Not Found dialog ── */}
      <Dialog open={nfDialogOpen} onOpenChange={setNfDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SearchX className="h-4 w-4" />
              Mark as Not Found
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
              Select item
            </label>
            <Select value={nfSelectedSku} onValueChange={setNfSelectedSku}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select a SKU…" />
              </SelectTrigger>
              <SelectContent>
                {unscannedItems.map((it) => (
                  <SelectItem key={it.sku} value={it.sku}>
                    <span className="font-medium">{it.name}</span>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {it.sku}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setNfDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={!nfSelectedSku}
              onClick={onConfirmNf}
            >
              Mark Not Found
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Print confirmation + next tote ── */}
      <Dialog open={printOpen} onOpenChange={() => {}}>
        <DialogContent
          className="max-w-sm"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-3 rounded-md border border-status-picked/30 bg-status-picked/5 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-status-picked/15">
              <CheckCircle2 className="h-5 w-5 text-status-picked" />
            </div>
            <div>
              <div className="text-sm font-semibold">Invoice &amp; Shipping Label Printed</div>
              <div className="text-xs text-muted-foreground">Documents sent to printer.</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
              <ScanBarcode className="h-3.5 w-3.5" />
              Scan next tote
            </div>
            {printToteError && <ErrorBanner message={printToteError} />}
            <ScanRow
              key={`print-tote-${printOpen}`}
              label=""
              placeholder="Scan tote barcode…"
              onScan={onPrintToteScan}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" className="w-full" onClick={onClosePrint}>
              Done — no next tote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderCard({
  order,
  compact = false,
}: {
  order: PackOrder;
  compact?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-xs font-semibold text-muted-foreground">
            {order.orderNo}
          </div>
          <div className="mt-0.5 truncate text-base font-bold leading-tight text-foreground">
            {order.seller}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {order.extOrderNo}
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-[4px] border px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.04em]",
            channelStyles[order.channel] ??
              "border-border bg-muted text-muted-foreground",
          )}
        >
          {order.channel}
        </span>
      </div>
      {!compact && (
        <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
          <div>
            <div className="text-muted-foreground">Courier</div>
            <div className="font-medium">{order.courier}</div>
          </div>
          <div>
            <div className="text-muted-foreground">SLA deadline</div>
            <div className="font-medium">{slaDeadline(order.sla)}</div>
          </div>
        </div>
      )}
    </Card>
  );
}

function QcRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-1.5">
      <span className="w-12 shrink-0 text-muted-foreground">{label}</span>
      <span className={cn("font-medium", mono && "font-mono")}>{value}</span>
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
      {label && (
        <label className="mb-1 block text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </label>
      )}
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
