import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Maximize2,
  Package,
  PackageCheck,
  ScanBarcode,
  Search,
  SearchX,
  ShoppingBag,
  TriangleAlert,
  X,
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

export const Route = createFileRoute("/_wms/pack")({
  head: () => ({
    meta: [{ title: "Pack — WMS" }],
  }),
  component: PackStation,
});

type PackStep = "scan-station" | "scan-tote" | "scan-items" | "scan-packaging";

const channelStyles: Record<string, string> = {
  Amazon: "bg-warn-bg text-warn border-warn/30",
  Flipkart: "bg-sys-bg text-sys border-sys/30",
  Shopify: "bg-ok-bg text-ok border-ok/30",
  Myntra: "bg-ai-bg text-ai border-ai-ring",
};

type PackedRow = {
  sku: string;
  name: string;
  qty: number;
  mrp: string;
  lot: string;
  box: string;
  image: string;
};

function PackStation() {
  const [step, setStep] = useState<PackStep>("scan-station");
  const [stationId, setStationId] = useState("");
  const [toteError, setToteError] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<PackOrder | null>(null);
  const [scannedQty, setScannedQty] = useState<Record<string, number>>({});
  const [nfSkus, setNfSkus] = useState<Set<string>>(new Set());
  const [damagedSkus, setDamagedSkus] = useState<Set<string>>(new Set());
  const [lastScannedItem, setLastScannedItem] = useState<PackItem | null>(null);
  const [packedItems, setPackedItems] = useState<PackedRow[]>([]);
  const [itemError, setItemError] = useState<string | null>(null);
  const [packagingError, setPackagingError] = useState<string | null>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [printToteError, setPrintToteError] = useState<string | null>(null);
  const [nfDialogOpen, setNfDialogOpen] = useState(false);
  const [nfSelectedSku, setNfSelectedSku] = useState("");
  const [scanKey, setScanKey] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [itemSearch, setItemSearch] = useState("");


  // Packing material adherence
  const [adhTotal, setAdhTotal] = useState(0);
  const [adhMatches, setAdhMatches] = useState(0);
  const adherencePct =
    adhTotal === 0 ? null : Math.round((adhMatches / adhTotal) * 100);

  const recommended = currentOrder ? channelPackaging[currentOrder.channel] : null;

  const totalItemQty =
    currentOrder?.items.reduce((s, it) => s + it.qty, 0) ?? 0;
  const totalScanned = Object.values(scannedQty).reduce((s, n) => s + n, 0);

  const unscannedItems =
    currentOrder?.items.filter(
      (it) => (scannedQty[it.sku] ?? 0) < it.qty && !nfSkus.has(it.sku),
    ) ?? [];

  const checkAllDone = (qty: Record<string, number>) =>
    currentOrder!.items.every((it) => (qty[it.sku] ?? 0) >= it.qty);

  const allItemsDone = !!currentOrder && checkAllDone(scannedQty);

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
          mrp: item.mrp ?? "—",
          lot: item.lot ?? "—",
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
    if (nfSkus.has(sku)) {
      setNfSkus((s) => { const n = new Set(s); n.delete(sku); return n; });
    }
    if (damagedSkus.has(sku)) {
      setDamagedSkus((s) => { const n = new Set(s); n.delete(sku); return n; });
    }
    const newQty = { ...scannedQty, [sku]: already + 1 };
    setScannedQty(newQty);
    setScanKey((k) => k + 1);
  };

  const onMarkDamaged = () => {
    if (!lastScannedItem) return;
    const dmg = lastScannedItem;
    setDamagedSkus((s) => new Set(s).add(dmg.sku));
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
    setAdhTotal((n) => n + 1);
    if (recommended && id === recommended.id) setAdhMatches((n) => n + 1);
    if (lastScannedItem) commitToPacked(lastScannedItem);
    setLastScannedItem(null);
    setPrintOpen(true);
  };

  const onClosePack = () => {
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

  const onClosePrint = () => {
    setPrintOpen(false);
    setPrintToteError(null);
    onClosePack();
  };


  const progressPct = totalItemQty === 0 ? 0 : Math.round((totalScanned / totalItemQty) * 100);

  const filteredPacked = itemSearch.trim()
    ? packedItems.filter((p) =>
        [p.sku, p.name, p.box].some((f) =>
          f.toLowerCase().includes(itemSearch.trim().toLowerCase()),
        ),
      )
    : packedItems;

  return (
    <div className="flex h-full flex-col">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-2.5">
        {/* Left: order type */}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">Pack</span>
          </div>
          {currentOrder && (
            <>
              <span className="text-border">|</span>
              <span className="text-sm">
                <span className="text-muted-foreground">Order Type: </span>
                <span className="font-bold">{currentOrder.orderType}</span>
              </span>
            </>
          )}
        </div>

        {/* Right: station + adherence + close pack */}
        <div className="flex items-center gap-3">
          {stationId && (
            <span className="text-sm">
              <span className="text-muted-foreground">Table ID: </span>
              <span className="font-bold font-mono">{stationId}</span>
            </span>
          )}
          {stationId && (
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
                    Adherence {adherencePct === null ? "—" : `${adherencePct}%`}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[240px] text-xs">
                  Packing-material adherence — percentage of orders packed using
                  the system-recommended packaging this session.
                  {adherencePct !== null && (
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {adhMatches} of {adhTotal} packs matched the recommendation.
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {step === "scan-items" && (
            <Button
              variant="outline"
              size="sm"
              className="hidden h-8 gap-1.5 text-xs"
              onClick={onClosePack}
            >
              <Package className="h-3.5 w-3.5" />
              Close Pack
              <kbd className="ml-1 rounded border border-border bg-muted px-1 font-mono text-[10px] text-muted-foreground">
                ALT+P
              </kbd>
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* ── Scan station ── */}
        {step === "scan-station" && (
          <Card className="space-y-3 p-4 max-w-md">
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
          <Card className="space-y-3 p-4 max-w-md">
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
            {/* Upper panel: scan + order info | item attributes | image | actions */}
            <div className="flex max-h-[300px] overflow-hidden rounded-lg border border-border bg-card shadow-sm">

              {/* Zone 1: Scan input + order info */}
              <div className="w-64 shrink-0 overflow-y-auto border-r border-border p-4 space-y-4">
                {/* Scan input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    Scan Item ID<span className="text-destructive">*</span>
                  </label>
                  <ScanRowInline
                    key={`item-${allItemsDone ? "done" : "live"}-${scanKey}`}
                    placeholder="Scan or type & hit enter"
                    onScan={onItemScan}
                    autoFocus={!allItemsDone}
                  />
                  {itemError && <ErrorBanner message={itemError} />}
                </div>

                {/* Order info box */}
                <div className="rounded border border-border bg-muted/20 p-3 space-y-2 text-sm">
                  <InfoRow label="Order No" value={currentOrder.orderNo} mono />
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground text-[12px]">Channel</span>
                    <ChannelLogo channel={currentOrder.channel} />
                  </div>
                  <InfoRow label="Courier" value={currentOrder.courier} />
                </div>
              </div>

              {/* Zone 2: Item attributes */}
              <div className="min-w-0 flex-1 border-r border-border p-4">
                <div className="space-y-0">
                  <AttrRow label="Name" value={lastScannedItem?.name} />
                  <AttrRow label="SKU" value={lastScannedItem?.sku} mono />
                  <AttrRow label="Colour" value={lastScannedItem?.color} swatch />
                  <AttrRow label="Brand" value={lastScannedItem?.brand} />
                  <AttrRow label="Size" value={lastScannedItem?.size} />
                  <AttrRow label="MRP" value={lastScannedItem?.mrp} />
                  <AttrRow label="Weight" value={lastScannedItem?.weight} />
                  {lastScannedItem?.lot && (
                    <AttrRow label="Lot" value={lastScannedItem.lot} mono />
                  )}
                  {lastScannedItem?.expiry && (
                    <AttrRow label="Expiry" value={lastScannedItem.expiry} />
                  )}
                </div>
                {damagedSkus.has(lastScannedItem?.sku ?? "") && (
                  <div className="mt-3 inline-flex items-center gap-1 rounded-[3px] border border-risk/30 bg-risk-bg px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-risk">
                    <TriangleAlert className="h-3 w-3" />
                    Damaged — replacement requested
                  </div>
                )}
              </div>

              {/* Zone 3: Product image (portrait crop) + separate action strip */}
              <div className="flex shrink-0 border-l border-border">
                <div className="group relative w-72 shrink-0 bg-muted/10">
                  {lastScannedItem ? (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setZoomOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setZoomOpen(true);
                      }}
                      className="h-full w-full cursor-zoom-in overflow-hidden"
                      title="Click to expand"
                    >
                      <img
                        src={lastScannedItem.image}
                        alt={lastScannedItem.name}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                      />
                      <span className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/45 px-1.5 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                        <Maximize2 className="h-3 w-3" />
                        Expand
                      </span>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                      <Package className="h-12 w-12 text-muted-foreground/20" />
                      <span className="px-4 text-[11px] text-muted-foreground/60">
                        Scan an item to preview
                      </span>
                    </div>
                  )}
                </div>

                {/* Action button strip (right of image) */}
                <div className="flex flex-col gap-1.5 border-l border-border p-2">
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          disabled={!lastScannedItem || damagedSkus.has(lastScannedItem?.sku ?? "")}
                          onClick={onMarkDamaged}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full border shadow-sm backdrop-blur transition-colors",
                            !lastScannedItem || damagedSkus.has(lastScannedItem?.sku ?? "")
                              ? "border-border bg-background/70 text-muted-foreground/40 cursor-not-allowed"
                              : "border-destructive/40 bg-background/90 text-destructive hover:bg-destructive/10",
                          )}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="text-xs">
                        Mark Damaged
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          disabled={unscannedItems.length === 0}
                          onClick={() => { setNfSelectedSku(""); setNfDialogOpen(true); }}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full border shadow-sm backdrop-blur transition-colors",
                            unscannedItems.length === 0
                              ? "border-border bg-background/70 text-muted-foreground/40 cursor-not-allowed"
                              : "border-border bg-background/90 text-foreground hover:bg-background",
                          )}
                        >
                          <SearchX className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="text-xs">
                        Not Found
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            {/* Progress bar — full-width row between the details card and the table */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium">Progress</span>
                  <span className="font-mono font-semibold text-foreground tabular-nums">
                    {totalScanned}/{totalItemQty}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {allItemsDone && (
                    <span className="flex items-center gap-1 font-medium text-ok">
                      <PackageCheck className="h-3.5 w-3.5" />
                      All items scanned
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

            {/* Packaging scan — appears only after all items are scanned */}
            {allItemsDone && recommended && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 shrink-0 text-primary" />
                  <div className="text-sm">
                    <span className="text-muted-foreground">Recommended packaging: </span>
                    <span className="font-semibold">{recommended.name}</span>
                    <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">
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

            {/* All Items table */}
            <div className="pt-2">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-foreground">All Items</h2>
                <div className="relative w-64">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="Search items…"
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
                      <TableHead className="text-[11px] font-semibold text-foreground/70 text-right">Qty</TableHead>
                      <TableHead className="text-[11px] font-semibold text-foreground/70">MRP</TableHead>
                      <TableHead className="text-[11px] font-semibold text-foreground/70">Batch</TableHead>
                      <TableHead className="text-[11px] font-semibold text-foreground/70">Box No.</TableHead>
                      <TableHead className="w-16 text-[11px] font-semibold text-foreground/70">Image</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPacked.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Package className="h-10 w-10 opacity-20" />
                            <span className="text-sm">No Records Found</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPacked.map((p) => (
                        <TableRow key={p.sku} className="text-xs [&>td]:py-1">
                          <TableCell className="font-mono text-muted-foreground">{p.sku}</TableCell>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">{p.qty}</TableCell>
                          <TableCell>{p.mrp}</TableCell>
                          <TableCell className="font-mono text-[11px] text-muted-foreground">{p.lot}</TableCell>
                          <TableCell className="font-mono text-[11px]">{p.box}</TableCell>
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
            <Button variant="outline" className="flex-1" onClick={() => setNfDialogOpen(false)}>
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

      {/* ── Image zoom ── */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-xl p-2">
          {lastScannedItem && (
            <div className="space-y-2">
              <img
                src={lastScannedItem.image}
                alt={lastScannedItem.name}
                className="max-h-[70vh] w-full rounded-md object-contain"
              />
              <div className="px-1 pb-1 text-center">
                <div className="text-sm font-semibold">{lastScannedItem.name}</div>
                <div className="font-mono text-xs text-muted-foreground">
                  {lastScannedItem.sku}
                </div>
              </div>
            </div>
          )}
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

/** Attribute row in the item details panel — label: value style */
function AttrRow({
  label,
  value,
  mono = false,
  swatch = false,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  swatch?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-0 border-b border-border/50 py-2 last:border-0">
      <span className="w-24 shrink-0 text-[12px] font-semibold text-foreground">
        {label}:
      </span>
      <span
        className={cn(
          "flex items-center gap-1.5 text-[12px] text-foreground/80",
          mono && "font-mono",
          !value && "text-muted-foreground",
        )}
      >
        {swatch && value && (
          <span
            className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-border"
            style={{ backgroundColor: value.toLowerCase() }}
          />
        )}
        {value ?? "—"}
      </span>
    </div>
  );
}

/** Order info row in the left panel */
function InfoRow({
  label,
  value,
  mono = false,
  danger = false,
  done = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  danger?: boolean;
  done?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground text-[12px]">{label}</span>
      <span
        className={cn(
          "font-semibold text-[12px]",
          mono && "font-mono",
          danger && "text-destructive",
          done && "text-ok",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** Small brand-logo lockup for the sales channel */
function ChannelLogo({ channel }: { channel: string }) {
  switch (channel) {
    case "Amazon":
      return (
        <span className="inline-flex flex-col items-center leading-none">
          <span className="text-[13px] font-bold lowercase tracking-tight text-[#232F3E]">
            amazon
          </span>
          <svg width="44" height="6" viewBox="0 0 44 6" fill="none" aria-hidden>
            <path
              d="M1 1.4 C 14 5.8, 30 5.8, 43 1.4"
              stroke="#FF9900"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </span>
      );
    case "Flipkart":
      return (
        <span className="inline-flex items-center gap-1 rounded-[3px] bg-[#2874F0] px-1.5 py-0.5">
          <ShoppingBag className="h-3 w-3 text-[#FFE11B]" />
          <span className="text-[12px] font-semibold italic text-white">Flipkart</span>
        </span>
      );
    case "Shopify":
      return (
        <span className="inline-flex items-center gap-1">
          <span className="flex h-4 w-4 items-center justify-center rounded-[3px] bg-[#95BF47]">
            <ShoppingBag className="h-2.5 w-2.5 text-white" />
          </span>
          <span className="text-[12px] font-bold text-[#5E8E3E]">Shopify</span>
        </span>
      );
    case "Myntra":
      return (
        <span className="text-[13px] font-extrabold italic tracking-tight text-[#FF3F6C]">
          Myntra
        </span>
      );
    default:
      return <span className="text-[12px] font-semibold">{channel}</span>;
  }
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm font-medium text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

/** Scan row with a QR icon button on the right */
function ScanRowInline({
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
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
        className="h-10 flex-1 font-mono text-sm"
      />
      <button
        type="submit"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        tabIndex={-1}
      >
        <ScanBarcode className="h-4 w-4" />
      </button>
    </form>
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
