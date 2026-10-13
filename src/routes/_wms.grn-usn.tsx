import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Fingerprint,
  Layers,
  Maximize2,
  Minus,
  Package,
  Plus,
  Printer,
  ScanBarcode,
  ScanText,
  Search,
  ShieldCheck,
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
  genGrnDocId,
  genItemUsn,
  genWid,
  grnBarcodePattern,
  USN_GRN_TASKS,
  usnBoxConsignment,
  usnModeForTable,
  usnModeLabel,
  type UsnBoxConsignment,
  type UsnGrnItem,
  type UsnMode,
} from "@/lib/wms/grn-usn-data";

const GRN_REJECT_REASONS = ["Damaged", "Expired", "Torn", "Faded"] as const;

export const Route = createFileRoute("/_wms/grn-usn")({
  head: () => ({
    meta: [{ title: "GRN — USN Tracking" }],
  }),
  component: GrnUsn,
});

type Step = "scan-qc-table" | "select-box" | "scan-items" | "session-done";
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
  expected: UsnGrnItem;
}

interface QcItemRow {
  sku: string;
  name: string;
  lpn: string;
  mode: QcMode;
  reason?: string;
  batch?: Batch;
  label: string;
  usnTracked: boolean;
  usnSource?: UsnMode;
}

interface GrnDoc {
  grnId: string;
  boxId: string;
  asn: string;
  seller: string;
  good: number;
  bad: number;
  expected: number;
  received: number;
  variance: boolean;
  signedOffBy?: string;
  rows: QcItemRow[];
}

const emptyBatch: Batch = { mrp: "", lot: "", mfg: "", expiry: "" };

function GrnUsn() {
  const [step, setStep] = useState<Step>("scan-qc-table");

  // Session-level
  const [qcTable, setQcTable] = useState<string | null>(null);
  const [usnMode, setUsnMode] = useState<UsnMode>("wms");
  const [grnDocs, setGrnDocs] = useState<GrnDoc[]>([]);

  // Per-box
  const [box, setBox] = useState<UsnBoxConsignment | null>(null);
  const [binLpn, setBinLpn] = useState<string | null>(null);
  const [binQc, setBinQc] = useState<QcMode>("good");
  const [qcItems, setQcItems] = useState<QcItemRow[]>([]);

  // Per-item (pending EAN → USN mapping → bin → batch → confirm)
  const [pendingItem, setPendingItem] = useState<PendingItem | null>(null);
  const [qcQty, setQcQty] = useState(1);
  const [scannedUsns, setScannedUsns] = useState<string[]>([]);
  const [pendingUsns, setPendingUsns] = useState<string[]>([]);
  const [batch, setBatch] = useState<Batch>(emptyBatch);
  const [paramFails, setParamFails] = useState<Record<string, boolean>>({});

  const [scanError, setScanError] = useState<string | null>(null);
  const [usnScanError, setUsnScanError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [labelRows, setLabelRows] = useState<QcItemRow[]>([]);
  const [signoffOpen, setSignoffOpen] = useState(false);
  const [signoffName, setSignoffName] = useState("");
  const [scanKey, setScanKey] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [itemSearch, setItemSearch] = useState("");

  const scannedBySku = useMemo(() => {
    const map: Record<string, number> = {};
    for (const it of qcItems) map[it.sku] = (map[it.sku] ?? 0) + 1;
    return map;
  }, [qcItems]);

  const items = box?.items ?? [];

  const totals = useMemo(() => {
    let good = 0;
    let bad = 0;
    for (const it of qcItems) {
      if (it.mode === "good") good += 1;
      else bad += 1;
    }
    return { good, bad };
  }, [qcItems]);

  // Live reconciliation — Expected / Received / Remaining / Excess for the box.
  const recon = useMemo(() => {
    const expected = items.reduce((s, it) => s + it.qty, 0);
    const received = qcItems.length;
    let excess = 0;
    for (const it of items) {
      const got = scannedBySku[it.sku] ?? 0;
      if (got > it.qty) excess += got - it.qty;
    }
    const remaining = Math.max(0, expected - received);
    return { expected, received, remaining, excess };
  }, [items, qcItems, scannedBySku]);

  const batchReady = !!(batch.lot && batch.mfg && batch.expiry && batch.mrp);

  // Remaining units of the pending SKU — a couple of extra slots are allowed
  // past "expected" so the operator can demonstrate an excess receipt.
  const pendingRemaining = pendingItem
    ? pendingItem.expected.qty - (scannedBySku[pendingItem.sku] ?? 0)
    : 0;
  const pendingMax = pendingItem ? (pendingRemaining > 0 ? pendingRemaining : 3) : 1;
  const pendingExcess = pendingItem && pendingRemaining <= 0;

  const usnLocked = pendingUsns.length > 0 || scannedUsns.length > 0;
  const usnTarget = Math.min(Math.max(1, qcQty), pendingMax);
  const usnMappingDone =
    !pendingItem || !pendingItem.expected.usnTracked || scannedUsns.length >= usnTarget;
  const readyForBin = !!pendingItem && usnMappingDone;

  // ---- Handlers ----
  const onQcTableScan = (val: string) => {
    const v = val.trim().toUpperCase();
    if (!v) return;
    setQcTable(v);
    setUsnMode(usnModeForTable(v));
    setStep("select-box");
    setScanKey((k) => k + 1);
  };

  const onBinScan = (val: string) => {
    const v = val.trim().toUpperCase();
    if (!v) return;
    setScanError(null);
    setBinLpn(v);
    setBinQc(binQcType(v));
    setScanKey((k) => k + 1);
  };

  const changeBin = () => {
    setBinLpn(null);
    setScanError(null);
    setScanKey((k) => k + 1);
  };

  const startBox = (boxId: string) => {
    const v = boxId.trim().toUpperCase();
    if (!v) return;
    setBox(usnBoxConsignment(v));
    setBinLpn(null);
    setBinQc("good");
    setQcItems([]);
    setPendingItem(null);
    setBatch(emptyBatch);
    setParamFails({});
    setScanError(null);
    setStep("scan-items");
    setScanKey((k) => k + 1);
  };

  const onEanScan = (val: string) => {
    const v = val.trim().toUpperCase();
    if (!v || !box) return;
    if (pendingItem) {
      setScanError("Finish the current item first.");
      setScanKey((k) => k + 1);
      return;
    }
    const expected = items.find((it) => it.sku === v);
    if (!expected) {
      setScanError(`${v} is not part of this box (ASN ${box.asn}).`);
      setScanKey((k) => k + 1);
      return;
    }
    setScanError(null);
    setPendingItem({ sku: v, name: expected.name, expected });
    setQcQty(1);
    setScannedUsns([]);
    setPendingUsns([]);
    setUsnScanError(null);
    setBatch(emptyBatch);
    setScanKey((k) => k + 1);
  };

  const ocrCapture = () => {
    if (!pendingItem) return;
    const e = pendingItem.expected;
    setBatch({ mrp: e.mrp, lot: e.lot, mfg: e.mfg, expiry: e.expiry });
  };

  // WMS-generated USN: operator confirms qty, WMS generates + prints labels.
  const generateUsns = () => {
    if (!pendingItem) return;
    const n = usnTarget;
    const usns = Array.from({ length: n }, () => genItemUsn());
    setPendingUsns(usns);
  };

  // Vendor-attached USN: scan the existing ASN/seller-supplied USN or the
  // manufacturer serial directly — no WMS label to print.
  const onUsnScan = (val: string) => {
    const v = val.trim().toUpperCase();
    if (!v || !pendingItem) return;
    const allUsns = new Set(qcItems.filter((r) => r.usnTracked).map((r) => r.label));
    if (allUsns.has(v) || scannedUsns.includes(v)) {
      setUsnScanError(`${v} has already been mapped to a unit in this box.`);
      setScanKey((k) => k + 1);
      return;
    }
    setUsnScanError(null);
    setScannedUsns((prev) => [...prev, v]);
    setScanKey((k) => k + 1);
  };

  const widForBatch = (sku: string, b: Batch): string => {
    const existing = qcItems.find(
      (r) =>
        r.mode === "good" &&
        r.sku === sku &&
        !r.usnTracked &&
        r.batch?.lot === b.lot &&
        r.batch?.mfg === b.mfg &&
        r.batch?.expiry === b.expiry &&
        r.batch?.mrp === b.mrp,
    );
    return existing?.label ?? genWid();
  };

  const buildRows = (mode: QcMode, reason?: string): QcItemRow[] => {
    if (!pendingItem || !binLpn) return [];
    const usnTracked = pendingItem.expected.usnTracked;
    if (usnTracked) {
      return scannedUsns.map((usn) => ({
        sku: pendingItem.sku,
        name: pendingItem.name,
        lpn: binLpn,
        mode,
        reason,
        batch: batchReady ? batch : undefined,
        label: usn,
        usnTracked: true,
        usnSource: usnMode,
      }));
    }
    const n = usnTarget;
    if (mode === "good") {
      const wid = widForBatch(pendingItem.sku, batch);
      return Array.from({ length: n }, () => ({
        sku: pendingItem.sku,
        name: pendingItem.name,
        lpn: binLpn,
        mode,
        batch,
        label: wid,
        usnTracked: false,
      }));
    }
    return Array.from({ length: n }, () => ({
      sku: pendingItem.sku,
      name: pendingItem.name,
      lpn: binLpn,
      mode,
      reason,
      batch: batchReady ? batch : undefined,
      label: genItemUsn(),
      usnTracked: false,
    }));
  };

  const resetPending = () => {
    setPendingItem(null);
    setQcQty(1);
    setScannedUsns([]);
    setPendingUsns([]);
    setBatch(emptyBatch);
    setScanKey((k) => k + 1);
  };

  const commitGood = () => {
    if (!pendingItem || !binLpn || !batchReady) return;
    const rows = buildRows("good");
    setQcItems((prev) => [...prev, ...rows]);
    // Only non-tracked good units need a fresh WID label printed + scanned
    // back — USN-tracked units already had their serial applied in step 3/4.
    if (!pendingItem.expected.usnTracked) setLabelRows(rows);
    resetPending();
  };

  const confirmReject = () => {
    if (!pendingItem || !binLpn || !rejectReason) return;
    const rows = buildRows("bad", rejectReason);
    setQcItems((prev) => [...prev, ...rows]);
    if (!pendingItem.expected.usnTracked) setLabelRows(rows);
    setRejectReason("");
    setRejectOpen(false);
    resetPending();
  };

  const finalizeDoc = (signedOffBy?: string) => {
    if (!box) return;
    const doc: GrnDoc = {
      grnId: genGrnDocId(),
      boxId: box.boxId,
      asn: box.asn,
      seller: box.seller,
      good: totals.good,
      bad: totals.bad,
      expected: recon.expected,
      received: recon.received,
      variance: recon.remaining > 0 || recon.excess > 0,
      signedOffBy,
      rows: qcItems,
    };
    setGrnDocs((prev) => [...prev, doc]);
    toast.success(`GRN generated · ${doc.grnId}`, {
      description: `${doc.boxId} — ${doc.good} good · ${doc.bad} bad. ${
        doc.variance ? "Variance signed off. " : ""
      }Labels sent to printer.`,
    });
    setSignoffOpen(false);
    setSignoffName("");
    nextBox();
  };

  const finishBox = () => {
    if (!box || qcItems.length === 0) return;
    if (recon.remaining > 0 || recon.excess > 0) {
      setSignoffOpen(true);
      return;
    }
    finalizeDoc();
  };

  const nextBox = () => {
    setBox(null);
    setBinLpn(null);
    setBinQc("good");
    setQcItems([]);
    resetPending();
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
    resetPending();
    setScanError(null);
    setScanKey((k) => k + 1);
  };

  const qcTableRows = useMemo(() => {
    const map = new Map<string, QcItemRow & { qty: number }>();
    for (const it of qcItems) {
      const key = it.usnTracked
        ? `${it.lpn}|${it.sku}|${it.label}`
        : `${it.lpn}|${it.sku}|${it.mode}|${it.reason ?? ""}`;
      const ex = map.get(key);
      if (ex) ex.qty += 1;
      else map.set(key, { ...it, qty: 1 });
    }
    return Array.from(map.values());
  }, [qcItems]);

  const failedParams = box ? box.qcParams.filter((p) => paramFails[p]) : [];

  const imageForSku = (sku: string) => box?.items.find((it) => it.sku === sku)?.image;

  const filteredQcRows = itemSearch.trim()
    ? qcTableRows.filter((r) =>
        [r.sku, r.name, r.lpn, r.label].some((f) =>
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
            <Fingerprint className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">GRN · USN Tracking</span>
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
          {qcTable && (
            <button
              type="button"
              title="Demo only — in production this is fixed by the Warehouse Manager"
              onClick={() => setUsnMode((m) => (m === "wms" ? "vendor" : "wms"))}
              className="flex items-center gap-1.5 rounded-[2px] border border-ai/30 bg-ai/10 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-ai hover:bg-ai/15"
            >
              <Fingerprint className="h-3 w-3" />
              {usnModeLabel(usnMode)}
            </button>
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
              Scan once to bind this session to a QC table. The USN mode (WMS-generated vs
              Vendor-attached) is configured per table by the Warehouse Manager and stays active for
              the session.
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
                Scan a pending Box ID to fetch its ASN and SKU lines — lines flagged USN-tracked
                will require a serial scan per unit.
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
                {USN_GRN_TASKS.map((t) => (
                  <button
                    key={t.taskId}
                    onClick={() => startBox(t.boxId)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-sm font-semibold">{t.boxId}</div>
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

        {/* Step — Item QC */}
        {step === "scan-items" && box && (
          <>
            {/* Live reconciliation strip */}
            <ReconStrip recon={recon} />

            <div className="flex h-[420px] overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              {/* Zone 1: scan + context */}
              <div className="w-96 shrink-0 space-y-3 overflow-y-auto border-r border-border p-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    Scan EAN<span className="text-destructive">*</span>
                  </label>
                  <ScanRow
                    key={`ean-${scanKey}`}
                    placeholder={pendingItem ? "Finish current item…" : "Scan EAN barcode…"}
                    onScan={onEanScan}
                    autoFocus
                  />
                  {scanError && <ErrorBanner message={scanError} />}
                </div>

                <div className="space-y-2 rounded border border-border bg-muted/20 p-3">
                  <InfoRow label="Box" value={box.boxId} mono />
                  <InfoRow label="Seller" value={box.seller} />
                </div>

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
                          disabled={qcQty <= 1 || usnLocked}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <Input
                          value={qcQty}
                          onChange={(e) => {
                            const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
                            if (Number.isNaN(n)) return setQcQty(1);
                            setQcQty(Math.min(Math.max(1, n), pendingMax));
                          }}
                          disabled={usnLocked}
                          inputMode="numeric"
                          className="h-8 w-14 text-center font-mono text-sm"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => setQcQty((q) => Math.min(pendingMax, q + 1))}
                          disabled={qcQty >= pendingMax || usnLocked}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {pendingExcess && (
                      <p className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-amber-600">
                        <AlertTriangle className="h-3 w-3" />
                        Expected qty already received — this will record as excess.
                      </p>
                    )}
                  </div>
                )}

                {binLpn ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold font-mono uppercase tracking-[0.06em] text-muted-foreground">
                        Bin ID
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
                      <span className="truncate font-mono text-xs font-bold">{binLpn}</span>
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
                      Bin stays active until changed.
                    </p>
                  </div>
                ) : (
                  <div className="rounded border border-dashed border-border p-2 text-[10px] text-muted-foreground">
                    Bin ID is scanned once the unit&apos;s serial is mapped.
                  </div>
                )}
              </div>

              {/* Zone 2: item attributes */}
              <div className="min-w-0 flex-1 overflow-y-auto border-r border-border p-4">
                {pendingItem ? (
                  <div className="space-y-0">
                    <AttrRow label="SKU No" value={pendingItem.sku} mono />
                    <AttrRow label="Name" value={pendingItem.name} />
                    <AttrRow label="Description" value={describeItem(pendingItem.expected)} />
                    <AttrRow label="MRP" value={pendingItem.expected.mrp} />
                    <div className="flex items-center gap-2 border-b border-border/50 py-2 last:border-0">
                      <span className="w-24 shrink-0 text-[12px] font-semibold text-foreground">
                        USN tracked:
                      </span>
                      {pendingItem.expected.usnTracked ? (
                        <span className="flex items-center gap-1 rounded-[2px] bg-ai/15 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-ai">
                          <Fingerprint className="h-3 w-3" />
                          Yes
                        </span>
                      ) : (
                        <span className="rounded-[2px] bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                          No — box/batch level
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="px-2 py-4 text-center text-[12px] text-muted-foreground">
                    Scan an EAN to begin. Item details populate for visual verification.
                  </div>
                )}
              </div>

              {/* Zone 3: USN mapping panel (only for USN-tracked SKUs) */}
              {pendingItem?.expected.usnTracked && (
                <div className="w-80 shrink-0 space-y-2.5 overflow-y-auto border-r border-border p-4">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold font-mono uppercase tracking-[0.06em] text-primary">
                    <Fingerprint className="h-3.5 w-3.5" />
                    Map USN ({scannedUsns.length}/{usnTarget})
                  </span>

                  {usnMode === "wms" ? (
                    pendingUsns.length === 0 ? (
                      <>
                        <p className="text-[11px] text-muted-foreground">
                          WMS generates the USNs and prints their labels — apply one to each unit,
                          then scan it back.
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 w-full text-[11px]"
                          onClick={generateUsns}
                        >
                          <Printer className="mr-1.5 h-3.5 w-3.5" />
                          Generate {usnTarget} USN
                          {usnTarget > 1 ? "s" : ""}
                        </Button>
                      </>
                    ) : null
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      Scan the existing ASN/seller-supplied USN or the manufacturer serial barcode
                      on each unit.
                    </p>
                  )}

                  {usnMode === "vendor" && !usnMappingDone && (
                    <>
                      <ScanRow
                        key={`usn-${scanKey}`}
                        placeholder="Scan vendor/manufacturer USN…"
                        onScan={onUsnScan}
                        autoFocus
                      />
                      {usnScanError && <ErrorBanner message={usnScanError} />}
                    </>
                  )}

                  {scannedUsns.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {scannedUsns.map((u) => (
                        <span
                          key={u}
                          className="rounded-[2px] border border-status-picked/30 bg-status-picked/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-status-picked"
                        >
                          {u}
                        </span>
                      ))}
                    </div>
                  )}

                  {usnMappingDone && (
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-status-picked">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      All units mapped
                    </div>
                  )}
                </div>
              )}

              {/* Zone 4: product image */}
              <div className="group relative w-56 shrink-0 self-stretch overflow-hidden bg-muted/10">
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

            {/* Action card: bin scan (if needed) → batch capture → confirm */}
            {pendingItem && readyForBin && !binLpn ? (
              <Card className="max-w-md space-y-3 p-4">
                <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  <ScanBarcode className="h-3.5 w-3.5" />
                  Scan Bin ID
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Scan the Good or Bad LPN this unit is being placed into. The bin stays active
                  until changed.
                </p>
                {scanError && <ErrorBanner message={scanError} />}
                <ScanRow
                  key={`bin-${scanKey}`}
                  placeholder="Scan Good or Bad bin…"
                  onScan={onBinScan}
                  autoFocus
                />
              </Card>
            ) : pendingItem && readyForBin ? (
              <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-end gap-3">
                  {binQc === "good" ? (
                    <Button
                      type="button"
                      className="h-9 bg-status-picked text-white hover:bg-status-picked/90"
                      onClick={commitGood}
                      disabled={!batchReady}
                    >
                      <ThumbsUp className="mr-1.5 h-4 w-4" />
                      Confirm — Good QC{usnTarget > 1 ? ` (${usnTarget})` : ""}
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
                      Confirm — Bad QC{usnTarget > 1 ? ` (${usnTarget})` : ""}
                    </Button>
                  )}
                </div>

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
                    OCR auto-fills from the label; edit any field for manual entry. Captured at
                    box/batch level, same as a standard GRN.
                  </p>
                </div>

                {box.sellerFirst && box.qcParams.length > 0 && (
                  <div className="space-y-1.5">
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
                    <div className="grid grid-cols-2 gap-1 md:grid-cols-3">
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
              </div>
            ) : null}

            {/* QC'd items table */}
            <div className="pt-2">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-foreground">QC&apos;d Items</h2>
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
                        Bin
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold text-foreground/70">
                        Label / USN
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
                        <TableCell colSpan={8} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Package className="h-10 w-10 opacity-20" />
                            <span className="text-sm">No Records Found</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredQcRows.map((r, idx) => (
                        <TableRow
                          key={`${r.lpn}-${r.sku}-${r.label}-${idx}`}
                          className="text-xs [&>td]:py-1"
                        >
                          <TableCell className="font-mono text-muted-foreground">{r.sku}</TableCell>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {r.qty}
                          </TableCell>
                          <TableCell className="font-mono text-[11px]">{r.lpn}</TableCell>
                          <TableCell className="font-mono text-[11px]">
                            {r.usnTracked ? (
                              <span className="flex items-center gap-1 text-ai">
                                <Fingerprint className="h-3 w-3" />
                                {r.label}
                              </span>
                            ) : (
                              r.label
                            )}
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">
                            {r.batch ? `${r.batch.lot} · Exp ${r.batch.expiry}` : "—"}
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
                              {r.mode === "good" ? "Good" : (r.reason ?? "Bad")}
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
                  {grnDocs.length} box GRN{grnDocs.length === 1 ? "" : "s"} on {qcTable}
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
                <div className="text-[10px] uppercase text-muted-foreground">SKU</div>
                <div className="font-mono text-sm font-semibold">{pendingItem?.sku}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase text-muted-foreground">Qty to reject</div>
                <div className="font-mono text-sm font-semibold">{usnTarget}</div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {pendingItem?.expected.usnTracked
                ? "Each mapped USN carries through to the rejected unit — no new label is printed."
                : "A unique serial number (USN) is generated for each rejected unit; the barcodes print once the box GRN is completed."}
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
            <Button variant="outline" className="flex-1" onClick={() => setRejectOpen(false)}>
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
                <div className="font-mono text-xs text-muted-foreground">{pendingItem.sku}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* WMS-generated USN: print + scan-back modal (step 3 → 4) */}
      <UsnPrintModal
        usns={pendingUsns}
        itemName={pendingItem?.name ?? ""}
        itemSku={pendingItem?.sku ?? ""}
        onDone={(usns) => {
          setScannedUsns(usns);
          setPendingUsns([]);
        }}
      />

      {/* Label print + scan-back — WID/USN for non-USN-tracked items only */}
      <LabelPrintModal rows={labelRows} onClose={() => setLabelRows([])} />

      {/* Supervisor sign-off — required only when there's a variance */}
      <Dialog open={signoffOpen} onOpenChange={setSignoffOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <ShieldCheck className="h-4 w-4" />
              Supervisor sign-off required
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground">
              This box has a variance against the expected quantity — a supervisor must sign off
              before the GRN is submitted.
            </p>
            <div className="grid grid-cols-4 gap-2 rounded-md border border-border bg-muted/20 p-2.5 text-center">
              <ReconCell label="Expected" value={recon.expected} />
              <ReconCell label="Received" value={recon.received} />
              <ReconCell
                label="Remaining"
                value={recon.remaining}
                tone={recon.remaining > 0 ? "warn" : undefined}
              />
              <ReconCell
                label="Excess"
                value={recon.excess}
                tone={recon.excess > 0 ? "bad" : undefined}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">
                Supervisor name / ID
              </label>
              <Input
                value={signoffName}
                onChange={(e) => setSignoffName(e.target.value)}
                placeholder="e.g. Rahul Mehta"
                className="h-10"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setSignoffOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-amber-600 text-white hover:bg-amber-600/90"
              disabled={!signoffName.trim()}
              onClick={() => finalizeDoc(signoffName.trim())}
            >
              Approve &amp; submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function describeItem(item: UsnGrnItem): string {
  const parts = [item.color, item.size, item.weight].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : item.name;
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
      <label className="text-[9px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
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

// Live Expected / Received / Remaining / Excess strip for the box in progress.
function ReconStrip({
  recon,
}: {
  recon: { expected: number; received: number; remaining: number; excess: number };
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <ReconCard label="Expected" value={recon.expected} />
      <ReconCard label="Received" value={recon.received} />
      <ReconCard
        label="Remaining"
        value={recon.remaining}
        tone={recon.remaining > 0 ? "warn" : undefined}
      />
      <ReconCard label="Excess" value={recon.excess} tone={recon.excess > 0 ? "bad" : undefined} />
    </div>
  );
}

function ReconCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "warn" | "bad";
}) {
  return (
    <Card
      className={cn(
        "flex items-center justify-between px-3 py-2",
        tone === "warn" && "border-amber-400/40 bg-amber-50/60",
        tone === "bad" && "border-destructive/40 bg-destructive/5",
      )}
    >
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-mono text-lg font-bold tabular-nums",
          tone === "warn" && "text-amber-600",
          tone === "bad" && "text-destructive",
        )}
      >
        {value}
      </span>
    </Card>
  );
}

function ReconCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "warn" | "bad";
}) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.06em] text-muted-foreground">{label}</div>
      <div
        className={cn(
          "font-mono text-sm font-bold tabular-nums",
          tone === "warn" && "text-amber-600",
          tone === "bad" && "text-destructive",
        )}
      >
        {value}
      </div>
    </div>
  );
}

// WMS-generated USN: prints N serial labels, then the operator applies +
// scans each one back onto its unit — the resulting serials become the
// mapped USNs for the pending item (step 3 → 4).
function UsnPrintModal({
  usns,
  itemName,
  itemSku,
  onDone,
}: {
  usns: string[];
  itemName: string;
  itemSku: string;
  onDone: (usns: string[]) => void;
}) {
  const [printed, setPrinted] = useState(false);
  const [scanned, setScanned] = useState(0);
  const [scanKey, setScanKey] = useState(0);
  const open = usns.length > 0;

  useEffect(() => {
    if (usns.length > 0) {
      setPrinted(false);
      setScanned(0);
      setScanKey((k) => k + 1);
    }
  }, [usns]);

  const allScanned = scanned >= usns.length;

  const onLabelScan = () => {
    setScanned((s) => Math.min(usns.length, s + 1));
    setScanKey((k) => k + 1);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-xs gap-0 overflow-hidden p-0">
        <DialogHeader className="space-y-0 border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Fingerprint className="h-4 w-4 text-ai" />
            {usns.length > 1 ? `${usns.length} USN labels` : "USN label"}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[45vh] space-y-3 overflow-y-auto bg-neutral-800 px-6 py-5">
          {usns.map((u, i) => (
            <UsnPrintedLabel key={`${u}-${i}`} usn={u} name={itemName} sku={itemSku} />
          ))}
        </div>

        <div className="space-y-2 border-t border-border px-4 py-3">
          {!printed ? (
            <Button className="h-9 w-full" onClick={() => setPrinted(true)}>
              <Printer className="mr-2 h-4 w-4" />
              Print {usns.length > 1 ? `${usns.length} labels` : "label"}
            </Button>
          ) : allScanned ? (
            <>
              <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-status-picked">
                <CheckCircle2 className="h-4 w-4" />
                All {usns.length} USN{usns.length > 1 ? "s" : ""} applied &amp; scanned
              </div>
              <Button variant="outline" className="h-9 w-full" onClick={() => onDone(usns)}>
                Done
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Apply each label, then scan it
                </span>
                <span className="font-mono text-xs font-bold tabular-nums">
                  {scanned} of {usns.length} scanned
                </span>
              </div>
              <ScanRow
                key={`usn-print-scan-${scanKey}`}
                placeholder="Scan USN…"
                onScan={onLabelScan}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setScanned(usns.length)}
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

function UsnPrintedLabel({ usn, name, sku }: { usn: string; name: string; sku: string }) {
  const bars = useMemo(() => grnBarcodePattern(usn), [usn]);
  return (
    <div className="rounded-sm bg-white p-3 text-black shadow-lg ring-1 ring-black/10">
      <div className="mb-1 text-center font-mono text-[9px] font-bold uppercase tracking-[0.08em]">
        WMS-generated · USN
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
        <div className="mt-1 font-mono text-sm font-bold tracking-[0.15em]">{usn}</div>
      </div>
      <div className="mt-2 border-t border-dashed border-neutral-300 pt-1.5 text-[10px] leading-tight">
        <div className="truncate font-semibold">{name}</div>
        <div className="font-mono text-[9px] text-neutral-600">{sku}</div>
      </div>
    </div>
  );
}

// Pops up after a QC confirm for non-USN-tracked items — prints the per-unit
// labels (WID for good, USN for bad), then the operator scans each one back.
function LabelPrintModal({ rows, onClose }: { rows: QcItemRow[]; onClose: () => void }) {
  const [printed, setPrinted] = useState(false);
  const [scanned, setScanned] = useState(0);
  const [scanKey, setScanKey] = useState(0);
  const open = rows.length > 0;
  const good = (rows[0]?.mode ?? "good") === "good";
  const kind = good ? "WID" : "USN";

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
                All {rows.length} {kind} label{rows.length > 1 ? "s" : ""} scanned into bin
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
        <div className="mt-1 font-mono text-sm font-bold tracking-[0.15em]">{row.label}</div>
      </div>
      <div className="mt-2 border-t border-dashed border-neutral-300 pt-1.5 text-[10px] leading-tight">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold">{row.name}</span>
          <span className="shrink-0 rounded-[2px] border border-black/70 px-1 py-0.5 font-mono text-[8.5px] font-bold uppercase">
            {good ? "Good" : (row.reason ?? "Bad")}
          </span>
        </div>
        <div className="font-mono text-[9px] text-neutral-600">{row.sku}</div>
      </div>
    </div>
  );
}

function SessionSummary({ qcTable, docs }: { qcTable: string; docs: GrnDoc[] }) {
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
              <TableHead>Variance</TableHead>
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
                <TableCell className="text-[11px]">
                  {d.variance ? (
                    <span className="text-amber-600">Signed off · {d.signedOffBy}</span>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function AttrRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-0 border-b border-border/50 py-2 last:border-0">
      <span className="w-24 shrink-0 text-[12px] font-semibold text-foreground">{label}:</span>
      <span
        className={cn(
          "flex items-center gap-1.5 text-[12px] text-foreground/80",
          mono && "font-mono",
          !value && "text-muted-foreground",
        )}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span
        className={cn("truncate text-[12px] font-semibold text-foreground", mono && "font-mono")}
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
