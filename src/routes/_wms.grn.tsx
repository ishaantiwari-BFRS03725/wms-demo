import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Layers,
  Maximize2,
  Minus,
  Package,
  Plus,
  Printer,
  ScanBarcode,
  ScanText,
  Search,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  binQcType,
  boxConsignment,
  genGrnDocId,
  genUsn,
  genWid,
  grnBarcodePattern,
  GRN_TASKS,
  type BoxConsignment,
  type GrnItem,
} from "@/lib/wms/grn-data";

// Rejection reasons offered on the GRN QC screen.
const GRN_REJECT_REASONS = ["Damaged", "Expired", "Torn", "Faded"] as const;

export const Route = createFileRoute("/_wms/grn")({
  head: () => ({
    meta: [{ title: "GRN — Inbound" }],
  }),
  component: Grn,
});

type Step =
  | "scan-qc-table"
  | "select-box"
  | "scan-bin"
  | "scan-items"
  | "session-done";

type QcMode = "good" | "bad";

interface Batch {
  mrp: string;
  lot: string;
  mfg: string;
  expiry: string;
}

interface PendingItem {
  sku: string;
  name: string;
  expected: GrnItem;
}

interface QcItemRow {
  sku: string;
  name: string;
  lpn: string;
  mode: QcMode;
  reason?: string;
  batch?: Batch;
  // Per-unit label id: WID for good units, USN for bad units.
  label: string;
}

interface GrnDoc {
  grnId: string;
  boxId: string;
  asn: string;
  seller: string;
  good: number;
  bad: number;
  rows: QcItemRow[];
}

const emptyBatch: Batch = { mrp: "", lot: "", mfg: "", expiry: "" };

function Grn() {
  const [step, setStep] = useState<Step>("scan-qc-table");

  // Session-level (retained till logout)
  const [qcTable, setQcTable] = useState<string | null>(null);
  const [grnDocs, setGrnDocs] = useState<GrnDoc[]>([]);

  // Per-box: one QC bin, with a QC status assigned on the item screen.
  const [box, setBox] = useState<BoxConsignment | null>(null);
  const [binLpn, setBinLpn] = useState<string | null>(null);
  const [binQc, setBinQc] = useState<QcMode>("good");
  const [changingBin, setChangingBin] = useState(false);
  const [qcItems, setQcItems] = useState<QcItemRow[]>([]);
  const [pendingItem, setPendingItem] = useState<PendingItem | null>(null);
  const [qcQty, setQcQty] = useState(1);
  const [batch, setBatch] = useState<Batch>(emptyBatch);
  const [paramFails, setParamFails] = useState<Record<string, boolean>>({});

  const [scanError, setScanError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [labelRows, setLabelRows] = useState<QcItemRow[]>([]);
  const [scanKey, setScanKey] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [itemSearch, setItemSearch] = useState("");

  const scannedBySku = useMemo(() => {
    const map: Record<string, number> = {};
    for (const it of qcItems) map[it.sku] = (map[it.sku] ?? 0) + 1;
    if (pendingItem) map[pendingItem.sku] = (map[pendingItem.sku] ?? 0) + 1;
    return map;
  }, [qcItems, pendingItem]);

  const items = box?.items ?? [];
  const allItemsDone =
    items.length > 0 && items.every((it) => (scannedBySku[it.sku] ?? 0) >= it.qty);

  const totals = useMemo(() => {
    let good = 0;
    let bad = 0;
    for (const it of qcItems) it.mode === "good" ? (good += 1) : (bad += 1);
    return { good, bad };
  }, [qcItems]);

  const batchReady = !!(batch.lot && batch.mfg && batch.expiry && batch.mrp);

  // How many units of the pending item remain open — the operator can QC a
  // whole batch at once by entering a quantity (defaults to 1).
  const pendingCommitted = pendingItem
    ? qcItems.filter((r) => r.sku === pendingItem.sku).length
    : 0;
  const pendingMax = pendingItem
    ? Math.max(1, pendingItem.expected.qty - pendingCommitted)
    : 1;

  // ---- Handlers ----
  const onQcTableScan = (val: string) => {
    const v = val.trim().toUpperCase();
    if (!v) return;
    setQcTable(v);
    setStep("select-box");
    setScanKey((k) => k + 1);
  };

  const onBinScan = (val: string) => {
    const v = val.trim().toUpperCase();
    if (!v) return;
    setScanError(null);
    setBinLpn(v);
    // The bin itself carries the QC mode — a Good bin issues WID labels, a Bad
    // bin issues USN labels. The operator never toggles it by hand.
    setBinQc(binQcType(v));
    setChangingBin(false);
    setStep("scan-items");
    setScanKey((k) => k + 1);
  };

  const changeBin = () => {
    setChangingBin(true);
    setScanError(null);
    setStep("scan-bin");
    setScanKey((k) => k + 1);
  };

  const startBox = (boxId: string) => {
    const v = boxId.trim().toUpperCase();
    if (!v) return;
    setBox(boxConsignment(v));
    setQcItems([]);
    setPendingItem(null);
    setBatch(emptyBatch);
    setParamFails({});
    setScanError(null);
    setStep("scan-bin");
    setScanKey((k) => k + 1);
  };

  const onItemScan = (val: string) => {
    const v = val.trim().toUpperCase();
    if (!v || !box) return;
    if (pendingItem) {
      setScanError("Finish QC on the current item first.");
      setScanKey((k) => k + 1);
      return;
    }
    const expected = items.find((it) => it.sku === v);
    if (!expected) {
      setScanError(`${v} is not part of this box (ASN ${box.asn}).`);
      setScanKey((k) => k + 1);
      return;
    }
    if ((scannedBySku[v] ?? 0) >= expected.qty) {
      setScanError(`${v} already fully QC'd for this box.`);
      setScanKey((k) => k + 1);
      return;
    }
    setScanError(null);
    setPendingItem({ sku: v, name: expected.name, expected });
    setQcQty(1);
    setBatch(emptyBatch);
    setScanKey((k) => k + 1);
  };

  const ocrCapture = () => {
    if (!pendingItem) return;
    const e = pendingItem.expected;
    setBatch({ mrp: e.mrp, lot: e.lot, mfg: e.mfg, expiry: e.expiry });
  };

  // A WID identifies a SKU+batch, not an individual unit — so every good unit
  // of the same SKU and batch shares one WID (reused across repeat scans in
  // this box). Only USNs are unique per rejected unit.
  const widForBatch = (sku: string, b: Batch): string => {
    const existing = qcItems.find(
      (r) =>
        r.mode === "good" &&
        r.sku === sku &&
        r.batch?.lot === b.lot &&
        r.batch?.mfg === b.mfg &&
        r.batch?.expiry === b.expiry &&
        r.batch?.mrp === b.mrp,
    );
    return existing?.label ?? genWid();
  };

  const commitGood = () => {
    if (!pendingItem || !binLpn || !batchReady) return;
    const n = Math.min(Math.max(1, qcQty), pendingMax);
    const wid = widForBatch(pendingItem.sku, batch);
    const rows: QcItemRow[] = Array.from({ length: n }, () => ({
      sku: pendingItem.sku,
      name: pendingItem.name,
      lpn: binLpn,
      mode: "good" as const,
      batch,
      label: wid,
    }));
    setQcItems((prev) => [...prev, ...rows]);
    setLabelRows(rows); // print N WID labels (same WID), then scan into the bin
    setPendingItem(null);
    setQcQty(1);
    setBatch(emptyBatch);
    setScanKey((k) => k + 1);
  };

  const confirmReject = () => {
    if (!pendingItem || !binLpn || !rejectReason) return;
    const n = Math.min(Math.max(1, qcQty), pendingMax);
    const rows: QcItemRow[] = Array.from({ length: n }, () => ({
      sku: pendingItem.sku,
      name: pendingItem.name,
      lpn: binLpn,
      mode: "bad" as const,
      reason: rejectReason,
      batch: batchReady ? batch : undefined,
      label: genUsn(),
    }));
    setQcItems((prev) => [...prev, ...rows]);
    setLabelRows(rows); // print N USN labels, then scan them into the bin
    setPendingItem(null);
    setQcQty(1);
    setBatch(emptyBatch);
    setRejectReason("");
    setRejectOpen(false);
    setScanKey((k) => k + 1);
  };

  const finishBox = () => {
    if (!box || qcItems.length === 0) return;
    const doc: GrnDoc = {
      grnId: genGrnDocId(),
      boxId: box.boxId,
      asn: box.asn,
      seller: box.seller,
      good: totals.good,
      bad: totals.bad,
      rows: qcItems,
    };
    setGrnDocs((prev) => [...prev, doc]);
    toast.success(`GRN generated · ${doc.grnId}`, {
      description: `${doc.boxId} — ${doc.good} good · ${doc.bad} bad. GRN, WID & USN labels sent to printer.`,
    });
    // No done screen — go straight back to scanning the next box.
    nextBox();
  };

  const nextBox = () => {
    setBox(null);
    setBinLpn(null);
    setBinQc("good");
    setQcItems([]);
    setPendingItem(null);
    setBatch(emptyBatch);
    setParamFails({});
    setScanError(null);
    setStep("select-box");
    setScanKey((k) => k + 1);
  };

  const resetSession = () => {
    setStep("scan-qc-table");
    setQcTable(null);
    setGrnDocs([]);
    setBox(null);
    setBinLpn(null);
    setBinQc("good");
    setQcItems([]);
    setPendingItem(null);
    setBatch(emptyBatch);
    setParamFails({});
    setScanError(null);
    setScanKey((k) => k + 1);
  };

  const qcTableRows = useMemo(() => {
    const map = new Map<string, QcItemRow & { qty: number }>();
    for (const it of qcItems) {
      const key = `${it.lpn}|${it.sku}|${it.mode}|${it.reason ?? ""}`;
      const ex = map.get(key);
      if (ex) ex.qty += 1;
      else map.set(key, { ...it, qty: 1 });
    }
    return Array.from(map.values());
  }, [qcItems]);

  const failedParams = box ? box.qcParams.filter((p) => paramFails[p]) : [];

  const imageForSku = (sku: string) =>
    box?.items.find((it) => it.sku === sku)?.image;

  const filteredQcRows = itemSearch.trim()
    ? qcTableRows.filter((r) =>
        [r.sku, r.name, r.lpn].some((f) =>
          f.toLowerCase().includes(itemSearch.trim().toLowerCase()),
        ),
      )
    : qcTableRows;

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-2.5">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">GRN</span>
          </div>
          {box && (
            <>
              <span className="text-border">|</span>
              <span className="text-sm">
                <span className="text-muted-foreground">Seller: </span>
                <span className="font-bold">{box.seller}</span>
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {qcTable && (
            <span className="text-sm">
              <span className="text-muted-foreground">QC Table: </span>
              <span className="font-bold font-mono">{qcTable}</span>
            </span>
          )}
          {box && (
            <span className="text-sm">
              <span className="text-muted-foreground">ASN: </span>
              <span className="font-bold font-mono">{box.asn}</span>
            </span>
          )}
          {grnDocs.length > 0 && (
            <span className="rounded-[2px] border border-status-picked/30 bg-status-picked/15 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-status-picked">
              {grnDocs.length} GRN{grnDocs.length === 1 ? "" : "s"} done
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Step — QC Table */}
          {step === "scan-qc-table" && (
            <Card className="max-w-md space-y-3 p-4">
              <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                <ScanBarcode className="h-3.5 w-3.5" />
                Scan QC Table
              </div>
              <p className="text-xs text-muted-foreground">
                Scan once to bind this session to a QC table. It stays active for
                the whole login session.
              </p>
              <ScanRow
                key={`qct-${scanKey}`}
                placeholder="e.g. QCT-01"
                onScan={onQcTableScan}
                autoFocus
              />
            </Card>
          )}

          {/* Step — Select / scan box */}
          {step === "select-box" && (
            <div className="max-w-md space-y-2">
              <Card className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  <ScanBarcode className="h-3.5 w-3.5" />
                  Scan Box ID
                </div>
                <p className="text-xs text-muted-foreground">
                  GRN is done at box level. Scan a pending Box ID to start — the
                  WMS fetches the ASN from it. You&apos;ll scan the GRN bin next.
                </p>
                <ScanRow
                  key={`box-${scanKey}`}
                  placeholder="e.g. BOX-7F3A-001"
                  onScan={startBox}
                  autoFocus
                />
              </Card>

              <Card className="overflow-hidden p-0">
                <div className="flex items-center gap-1.5 border-b border-border bg-muted/30 px-3 py-2 text-[11px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Pending boxes from unloading
                </div>
                <div className="divide-y divide-border">
                  {GRN_TASKS.map((t) => (
                    <button
                      key={t.taskId}
                      onClick={() => startBox(t.boxId)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-sm font-semibold">
                          {t.boxId}
                        </div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {t.seller} · {t.asn}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-[2px] bg-muted px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                        {t.items} units
                      </span>
                    </button>
                  ))}
                </div>
              </Card>

              {grnDocs.length > 0 && (
                <Button
                  variant="outline"
                  className="h-11 w-full"
                  onClick={() => setStep("session-done")}
                >
                  <Layers className="mr-2 h-4 w-4" />
                  Complete GRN session ({grnDocs.length})
                </Button>
              )}
            </div>
          )}

          {/* Step — QC bin */}
          {step === "scan-bin" && (
            <div className="max-w-md space-y-2">
              {box && (
                <Card className="flex items-center justify-between gap-3 p-2.5">
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                      Box
                    </div>
                    <div className="font-mono text-sm font-bold">
                      {box.boxId}
                    </div>
                  </div>
                  <div className="min-w-0 text-right">
                    <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                      Seller
                    </div>
                    <div className="truncate text-sm font-semibold">
                      {box.seller}
                    </div>
                  </div>
                </Card>
              )}

              <Card className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  <ScanBarcode className="h-3.5 w-3.5" />
                  Scan GRN bin LPN
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Scan the GRN bin for this box, then scan its items. The QC mode
                  is read from the bin: a <span className="font-semibold text-status-picked">Good</span> bin issues
                  WID labels, a <span className="font-semibold text-destructive">Bad</span> bin issues USN labels.
                  Good and bad items can&apos;t share a bin — change the bin to switch modes.
                </p>
                {scanError && <ErrorBanner message={scanError} />}
                <ScanRow
                  key={`bin-${scanKey}`}
                  placeholder="Scan Good or Bad GRN bin…"
                  onScan={onBinScan}
                  autoFocus
                />
              </Card>
            </div>
          )}

          {/* Step — Item QC */}
          {step === "scan-items" && box && binLpn && (
            <>
              {/* Upper details card: scan + context | attributes | image */}
              <div className="flex h-[400px] overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                {/* Zone 1: scan input + quantity + context + QC bin */}
                <div className="w-96 shrink-0 space-y-3 overflow-y-auto border-r border-border p-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-foreground">
                      Scan Item ID<span className="text-destructive">*</span>
                    </label>
                    <ScanRow
                      key={`item-${scanKey}`}
                      placeholder={pendingItem ? "Finish current item…" : "Scan item SKU…"}
                      onScan={onItemScan}
                      autoFocus
                    />
                    {scanError && <ErrorBanner message={scanError} />}
                  </div>

                  {/* Quantity to QC — pulled up next to the scan input */}
                  {pendingItem && (
                    <div className="rounded-md border border-border bg-muted/20 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold font-mono uppercase tracking-[0.06em] text-muted-foreground">
                          Quantity
                        </span>
                        <div className="inline-flex items-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => setQcQty((q) => Math.max(1, q - 1))}
                            disabled={qcQty <= 1}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <Input
                            value={qcQty}
                            onChange={(e) => {
                              const n = parseInt(
                                e.target.value.replace(/\D/g, ""),
                                10,
                              );
                              if (Number.isNaN(n)) return setQcQty(1);
                              setQcQty(Math.min(Math.max(1, n), pendingMax));
                            }}
                            inputMode="numeric"
                            className="h-8 w-14 text-center font-mono text-sm"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() =>
                              setQcQty((q) => Math.min(pendingMax, q + 1))
                            }
                            disabled={qcQty >= pendingMax}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Context info */}
                  <div className="space-y-2 rounded border border-border bg-muted/20 p-3">
                    <InfoRow label="Box" value={box.boxId} mono />
                    <InfoRow label="Seller" value={box.seller} />
                  </div>

                  {/* QC bin + status toggle */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold font-mono uppercase tracking-[0.06em] text-muted-foreground">
                        QC Bin
                      </span>
                      <button
                        type="button"
                        onClick={changeBin}
                        className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted/60"
                      >
                        <ScanBarcode className="h-3 w-3" />
                        Change bin
                      </button>
                    </div>
                    <div
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5",
                        binQc === "good"
                          ? "border-status-picked/30 bg-status-picked/5"
                          : "border-destructive/30 bg-destructive/5",
                      )}
                    >
                      <span className="truncate font-mono text-xs font-bold">
                        {binLpn}
                      </span>
                      <span
                        className={cn(
                          "flex shrink-0 items-center gap-1 rounded-[2px] px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.06em]",
                          binQc === "good"
                            ? "bg-status-picked text-white"
                            : "bg-destructive text-white",
                        )}
                      >
                        {binQc === "good" ? (
                          <>
                            <ThumbsUp className="h-3 w-3" />
                            Good
                          </>
                        ) : (
                          <>
                            <ThumbsDown className="h-3 w-3" />
                            Bad
                          </>
                        )}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      QC mode is set by the bin — this is a{" "}
                      <span className="font-semibold">
                        {binQc === "good" ? "Good" : "Bad"}
                      </span>{" "}
                      bin, so each unit gets a{" "}
                      <span className="font-semibold">
                        {binQc === "good" ? "WID" : "USN"}
                      </span>{" "}
                      label. Change the bin to switch modes.
                    </p>
                  </div>

                </div>

                {/* Zone 2: item attributes */}
                <div className="min-w-0 flex-1 overflow-y-auto border-r border-border p-4">
                  {pendingItem ? (
                    <div className="space-y-0">
                      <AttrRow label="Name" value={pendingItem.name} />
                      <AttrRow label="SKU" value={pendingItem.sku} mono />
                      <AttrRow label="MRP" value={pendingItem.expected.mrp} />
                      {pendingItem.expected.size && (
                        <AttrRow label="Size" value={pendingItem.expected.size} />
                      )}
                      {pendingItem.expected.color && (
                        <AttrRow
                          label="Colour"
                          value={pendingItem.expected.color}
                          swatch
                        />
                      )}
                      {pendingItem.expected.weight && (
                        <AttrRow label="Weight" value={pendingItem.expected.weight} />
                      )}
                    </div>
                  ) : (
                    <div className="px-2 py-4 text-center text-[12px] text-muted-foreground">
                      Scan an item SKU to begin QC. Verify against the image and
                      parameters.
                    </div>
                  )}
                </div>

                {/* Zone 2b: seller QC params — vertical column beside details */}
                {box.sellerFirst && box.qcParams.length > 0 && (
                  <div className="w-60 shrink-0 space-y-1.5 overflow-y-auto border-r border-border p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold font-mono uppercase tracking-[0.06em] text-primary">
                        Seller QC params
                      </span>
                      {failedParams.length > 0 && (
                        <span className="rounded-[2px] bg-destructive/15 px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.06em] text-destructive">
                          {failedParams.length} failed
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {box.qcParams.map((p) => {
                        const failed = !!paramFails[p];
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() =>
                              setParamFails((prev) => ({
                                ...prev,
                                [p]: !prev[p],
                              }))
                            }
                            className={cn(
                              "flex items-center justify-between gap-2 rounded border px-2 py-1.5 text-left text-[11px] transition-colors",
                              failed
                                ? "border-destructive/40 bg-destructive/10 text-destructive"
                                : "border-border bg-background text-foreground hover:bg-muted/40",
                            )}
                          >
                            <span className="min-w-0 flex-1 truncate">{p}</span>
                            {failed ? (
                              <span className="flex shrink-0 items-center gap-0.5 font-semibold">
                                <XCircle className="h-3 w-3" />
                                Failed
                              </span>
                            ) : (
                              <span className="flex shrink-0 items-center gap-0.5 text-status-picked">
                                <CheckCircle2 className="h-3 w-3" />
                                Match
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Zone 3: product image */}
                <div className="group relative w-64 shrink-0 self-stretch overflow-hidden bg-muted/10">
                  {pendingItem ? (
                    <button
                      type="button"
                      onClick={() => setZoomOpen(true)}
                      className="absolute inset-0 h-full w-full cursor-zoom-in"
                      title="Click to expand"
                    >
                      <img
                        src={pendingItem.expected.image}
                        alt={pendingItem.name}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                      />
                      <span className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/45 px-1.5 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                        <Maximize2 className="h-3 w-3" />
                        Expand
                      </span>
                    </button>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                      <Package className="h-12 w-12 text-muted-foreground/20" />
                      <span className="px-4 text-[11px] text-muted-foreground/60">
                        Scan an item to preview
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* QC action card — quantity + batch + confirm (while an item is pending) */}
              {pendingItem ? (
                <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    {/* Confirm — routed to the bin's assigned QC status */}
                    {binQc === "good" ? (
                      <Button
                        type="button"
                        className="h-9 bg-status-picked text-white hover:bg-status-picked/90"
                        onClick={commitGood}
                        disabled={!batchReady}
                      >
                        <ThumbsUp className="mr-1.5 h-4 w-4" />
                        Confirm — Good QC{qcQty > 1 ? ` (${qcQty})` : ""}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                        onClick={() => {
                          setRejectReason("");
                          setRejectOpen(true);
                        }}
                      >
                        <ThumbsDown className="mr-1.5 h-4 w-4" />
                        Confirm — Bad QC{qcQty > 1 ? ` (${qcQty})` : ""}
                      </Button>
                    )}
                  </div>

                  {/* Batch / variant capture */}
                  <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold font-mono uppercase tracking-[0.06em] text-muted-foreground">
                        Batch / variant details
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px]"
                        onClick={ocrCapture}
                      >
                        <ScanText className="mr-1 h-3 w-3" />
                        Capture via OCR
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      <BatchField
                        label="MRP"
                        value={batch.mrp}
                        onChange={(v) => setBatch((b) => ({ ...b, mrp: v }))}
                      />
                      <BatchField
                        label="Lot"
                        value={batch.lot}
                        onChange={(v) => setBatch((b) => ({ ...b, lot: v }))}
                      />
                      <BatchField
                        label="MFG"
                        value={batch.mfg}
                        onChange={(v) => setBatch((b) => ({ ...b, mfg: v }))}
                      />
                      <BatchField
                        label="Expiry"
                        value={batch.expiry}
                        onChange={(v) => setBatch((b) => ({ ...b, expiry: v }))}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      OCR auto-fills from the label; edit any field for manual
                      entry.
                    </p>
                  </div>
                </div>
              ) : allItemsDone ? (
                <div className="flex items-center gap-2 rounded-lg border border-status-picked/30 bg-status-picked/5 p-4">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-status-picked" />
                  <div className="text-xs font-medium text-status-picked">
                    All expected items QC'd — finish to generate the GRN document.
                  </div>
                </div>
              ) : null}

              {/* QC'd items table — Pack-style */}
              <div className="pt-2">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-foreground">
                    QC&apos;d Items
                  </h2>
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
                        <TableHead className="text-[11px] font-semibold text-foreground/70">
                          SKU
                        </TableHead>
                        <TableHead className="text-[11px] font-semibold text-foreground/70">
                          Description
                        </TableHead>
                        <TableHead className="text-right text-[11px] font-semibold text-foreground/70">
                          Qty
                        </TableHead>
                        <TableHead className="text-[11px] font-semibold text-foreground/70">
                          GRN Bin
                        </TableHead>
                        <TableHead className="text-[11px] font-semibold text-foreground/70">
                          Batch
                        </TableHead>
                        <TableHead className="text-[11px] font-semibold text-foreground/70">
                          QC
                        </TableHead>
                        <TableHead className="w-16 text-[11px] font-semibold text-foreground/70">
                          Image
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQcRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-16 text-center">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <Package className="h-10 w-10 opacity-20" />
                              <span className="text-sm">No Records Found</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredQcRows.map((r, idx) => (
                          <TableRow
                            key={`${r.lpn}-${r.sku}-${idx}`}
                            className="text-xs [&>td]:py-1"
                          >
                            <TableCell className="font-mono text-muted-foreground">
                              {r.sku}
                            </TableCell>
                            <TableCell className="font-medium">{r.name}</TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">
                              {r.qty}
                            </TableCell>
                            <TableCell className="font-mono text-[11px]">
                              {r.lpn}
                            </TableCell>
                            <TableCell className="text-[11px] text-muted-foreground">
                              {r.batch
                                ? `${r.batch.lot} · Exp ${r.batch.expiry}`
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "rounded-[2px] px-1.5 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em]",
                                  r.mode === "good"
                                    ? "bg-status-picked/15 text-status-picked"
                                    : "bg-destructive/15 text-destructive",
                                )}
                              >
                                {r.mode === "good" ? "Good" : r.reason ?? "Bad"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="h-8 w-8 overflow-hidden rounded border border-border bg-muted/20">
                                {imageForSku(r.sku) && (
                                  <img
                                    src={imageForSku(r.sku)}
                                    alt={r.name}
                                    className="h-full w-full object-contain p-0.5"
                                  />
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Button
                className="h-10 w-full"
                disabled={qcItems.length === 0 || !!pendingItem}
                onClick={finishBox}
              >
                <Printer className="mr-2 h-4 w-4" />
                Confirm &amp; submit
              </Button>
            </>
          )}

          {/* Step — Session summary */}
          {step === "session-done" && (
            <div className="max-w-md space-y-2">
              <Card className="space-y-2 p-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-dispatched/15 text-status-dispatched">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-base font-semibold">GRN session complete</div>
                  <div className="text-xs text-muted-foreground">
                    {grnDocs.length} box GRN{grnDocs.length === 1 ? "" : "s"} on{" "}
                    {qcTable}
                  </div>
                </div>
              </Card>

              <SessionSummary qcTable={qcTable ?? "—"} docs={grnDocs} />

              <Button className="h-11 w-full" onClick={resetSession}>
                Start new session
              </Button>
            </div>
          )}
      </div>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ThumbsDown className="h-4 w-4" />
              Rejection reason
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 p-2.5">
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">
                  SKU
                </div>
                <div className="font-mono text-sm font-semibold">
                  {pendingItem?.sku}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase text-muted-foreground">
                  Qty to reject
                </div>
                <div className="font-mono text-sm font-semibold">
                  {Math.min(Math.max(1, qcQty), pendingMax)}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              A unique serial number (USN) is generated for each rejected unit;
              the USN barcodes print once the box GRN is completed.
            </p>
            <Select value={rejectReason} onValueChange={setRejectReason}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select reason…" />
              </SelectTrigger>
              <SelectContent>
                {GRN_REJECT_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setRejectOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={!rejectReason}
              onClick={confirmReject}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image zoom */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-xl p-2">
          {pendingItem && (
            <div className="space-y-2">
              <img
                src={pendingItem.expected.image}
                alt={pendingItem.name}
                className="max-h-[70vh] w-full rounded-md object-contain"
              />
              <div className="px-1 pb-1 text-center">
                <div className="text-sm font-semibold">{pendingItem.name}</div>
                <div className="font-mono text-xs text-muted-foreground">
                  {pendingItem.sku}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Label print + scan-back modal — WID for good units, USN for bad. */}
      <LabelPrintModal rows={labelRows} onClose={() => setLabelRows([])} />
    </div>
  );
}

function BatchField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-0.5">
      <label className="text-[9px] font-mono uppercase tracking-[0.06em]r text-muted-foreground">
        {label}
      </label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        className="h-8 text-xs"
      />
    </div>
  );
}

// Pops up right after a QC confirm: prints the per-unit labels (WID for good,
// USN for bad), then the operator scans each one back — a running count tracks
// how many of the N labels have been placed on their units before closing.
function LabelPrintModal({
  rows,
  onClose,
}: {
  rows: QcItemRow[];
  onClose: () => void;
}) {
  const [printed, setPrinted] = useState(false);
  const [scanned, setScanned] = useState(0);
  const [scanKey, setScanKey] = useState(0);
  const open = rows.length > 0;
  const good = (rows[0]?.mode ?? "good") === "good";
  const kind = good ? "WID" : "USN";

  // Reset print + scan progress whenever a fresh set of labels comes in.
  useEffect(() => {
    if (rows.length > 0) {
      setPrinted(false);
      setScanned(0);
      setScanKey((k) => k + 1);
    }
  }, [rows]);

  const allScanned = scanned >= rows.length;

  const onLabelScan = () => {
    setScanned((s) => Math.min(rows.length, s + 1));
    setScanKey((k) => k + 1);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xs gap-0 overflow-hidden p-0">
        <DialogHeader className="space-y-0 border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-sm">
            {good ? (
              <ThumbsUp className="h-4 w-4 text-status-picked" />
            ) : (
              <ThumbsDown className="h-4 w-4 text-destructive" />
            )}
            {rows.length > 1 ? `${rows.length} ${kind} labels` : `${kind} label`}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[45vh] space-y-3 overflow-y-auto bg-neutral-800 px-6 py-5">
          {rows.map((r, i) => (
            <PrintedLabel key={`${r.label}-${i}`} row={r} />
          ))}
        </div>

        <div className="space-y-2 border-t border-border px-4 py-3">
          {!printed ? (
            <Button className="h-9 w-full" onClick={() => setPrinted(true)}>
              <Printer className="mr-2 h-4 w-4" />
              Print {rows.length > 1 ? `${rows.length} labels` : "label"}
            </Button>
          ) : allScanned ? (
            <>
              <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-status-picked">
                <CheckCircle2 className="h-4 w-4" />
                All {rows.length} {kind} label{rows.length > 1 ? "s" : ""} scanned
                into bin
              </div>
              <Button variant="outline" className="h-9 w-full" onClick={onClose}>
                Done
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Scan each label into the bin
                </span>
                <span className="font-mono text-xs font-bold tabular-nums">
                  {scanned} of {rows.length} scanned
                </span>
              </div>
              <ScanRow
                key={`label-scan-${scanKey}`}
                placeholder={`Scan ${kind}…`}
                onScan={onLabelScan}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setScanned(rows.length)}
                className="w-full text-center text-[10px] font-medium text-muted-foreground underline-offset-2 hover:underline"
              >
                Scan all (demo)
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// A single label as it appears on the thermal paper (white stock, black print).
// Good units carry a WID; bad units carry a USN plus the rejection reason.
function PrintedLabel({ row }: { row: QcItemRow }) {
  const bars = useMemo(() => grnBarcodePattern(row.label ?? row.sku), [row]);
  const good = row.mode === "good";
  return (
    <div className="rounded-sm bg-white p-3 text-black shadow-lg ring-1 ring-black/10">
      <div className="mb-1 text-center font-mono text-[9px] font-bold uppercase tracking-[0.08em]">
        {good ? "Good unit · WID" : "Rejected unit · USN"}
      </div>
      <div className="flex flex-col items-center">
        <div className="flex items-end gap-px">
          {bars.map((w, i) => (
            <div
              key={i}
              style={{ width: `${w * 1.4}px` }}
              className={cn("h-10", i % 2 === 0 ? "bg-black" : "bg-transparent")}
            />
          ))}
        </div>
        <div className="mt-1 font-mono text-sm font-bold tracking-[0.15em]">
          {row.label}
        </div>
      </div>
      <div className="mt-2 border-t border-dashed border-neutral-300 pt-1.5 text-[10px] leading-tight">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold">{row.name}</span>
          <span className="shrink-0 rounded-[2px] border border-black/70 px-1 py-0.5 font-mono text-[8.5px] font-bold uppercase">
            {good ? "Good" : row.reason ?? "Bad"}
          </span>
        </div>
        <div className="font-mono text-[9px] text-neutral-600">{row.sku}</div>
      </div>
    </div>
  );
}

function SessionSummary({
  qcTable,
  docs,
}: {
  qcTable: string;
  docs: GrnDoc[];
}) {
  const good = docs.reduce((s, d) => s + d.good, 0);
  const bad = docs.reduce((s, d) => s + d.bad, 0);
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
        <span className="text-[11px] font-semibold font-mono uppercase tracking-[0.06em] text-muted-foreground">
          Summarized GRN · {qcTable}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {good} good · {bad} bad
        </span>
      </div>
      <div className="[&_th]:px-2 [&_th]:py-1.5 [&_td]:px-2 [&_td]:py-1.5 [&_th]:h-auto [&_th]:text-[10px] [&_td]:text-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20">
              <TableHead>GRN ID</TableHead>
              <TableHead>Box</TableHead>
              <TableHead className="text-right">Good</TableHead>
              <TableHead className="text-right">Bad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.map((d) => (
              <TableRow key={d.grnId}>
                <TableCell className="font-mono text-[11px]">{d.grnId}</TableCell>
                <TableCell className="font-mono text-[11px]">{d.boxId}</TableCell>
                <TableCell className="text-right font-mono tabular-nums text-status-picked">
                  {d.good}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-destructive">
                  {d.bad}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

/** Attribute row in the item details panel — label: value style (Pack parity) */
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

/** Context info row in the left panel — label / value */
function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span
        className={cn(
          "truncate text-[12px] font-semibold text-foreground",
          mono && "font-mono",
        )}
      >
        {value}
      </span>
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
