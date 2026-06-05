import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Layers,
  PackageSearch,
  Printer,
  ScanBarcode,
  ScanText,
  Search,
  ThumbsDown,
  ThumbsUp,
  Video,
  XCircle,
} from "lucide-react";
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
import { qcRejectReasons } from "@/lib/wms/inbound-data";
import {
  boxConsignment,
  genGrnDocId,
  grnBarcodePattern,
  GRN_TASKS,
  type BoxConsignment,
  type GrnItem,
} from "@/lib/wms/grn-data";

export const Route = createFileRoute("/_wms/grn")({
  head: () => ({
    meta: [{ title: "GRN — Inbound" }],
  }),
  component: Grn,
});

type Step =
  | "scan-qc-table"
  | "select-box"
  | "scan-good-lpn"
  | "scan-bad-lpn"
  | "scan-items"
  | "done"
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
  const [goodLpn, setGoodLpn] = useState<string | null>(null);
  const [badLpn, setBadLpn] = useState<string | null>(null);
  const [grnDocs, setGrnDocs] = useState<GrnDoc[]>([]);

  // Per-box
  const [box, setBox] = useState<BoxConsignment | null>(null);
  const [qcItems, setQcItems] = useState<QcItemRow[]>([]);
  const [pendingItem, setPendingItem] = useState<PendingItem | null>(null);
  const [batch, setBatch] = useState<Batch>(emptyBatch);
  const [paramFails, setParamFails] = useState<Record<string, boolean>>({});
  const [lastDoc, setLastDoc] = useState<GrnDoc | null>(null);
  const [recordingStart, setRecordingStart] = useState<Date | null>(null);

  const [scanError, setScanError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [pendencyOpen, setPendencyOpen] = useState(false);
  const [pendencySearch, setPendencySearch] = useState("");
  const [scanKey, setScanKey] = useState(0);

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

  // ---- Handlers ----
  const onQcTableScan = (val: string) => {
    const v = val.trim().toUpperCase();
    if (!v) return;
    setQcTable(v);
    setStep("select-box");
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
    setRecordingStart(new Date());
    setStep(goodLpn && badLpn ? "scan-items" : "scan-good-lpn");
    setScanKey((k) => k + 1);
  };

  const onGoodLpnScan = (val: string) => {
    const v = val.trim().toUpperCase();
    if (!v) return;
    if (v === badLpn) {
      setScanError("Good LPN must be different from the Bad LPN.");
      setScanKey((k) => k + 1);
      return;
    }
    setScanError(null);
    setGoodLpn(v);
    setStep("scan-bad-lpn");
    setScanKey((k) => k + 1);
  };

  const onBadLpnScan = (val: string) => {
    const v = val.trim().toUpperCase();
    if (!v) return;
    if (v === goodLpn) {
      setScanError("Bad LPN must be different from the Good LPN.");
      setScanKey((k) => k + 1);
      return;
    }
    setScanError(null);
    setBadLpn(v);
    setStep("scan-items");
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
    setBatch(emptyBatch);
    setScanKey((k) => k + 1);
  };

  const ocrCapture = () => {
    if (!pendingItem) return;
    const e = pendingItem.expected;
    setBatch({ mrp: e.mrp, lot: e.lot, mfg: e.mfg, expiry: e.expiry });
  };

  const commitGood = () => {
    if (!pendingItem || !goodLpn || !batchReady) return;
    setQcItems((prev) => [
      ...prev,
      {
        sku: pendingItem.sku,
        name: pendingItem.name,
        lpn: goodLpn,
        mode: "good",
        batch,
      },
    ]);
    setPendingItem(null);
    setBatch(emptyBatch);
    setScanKey((k) => k + 1);
  };

  const confirmReject = () => {
    if (!pendingItem || !badLpn || !rejectReason) return;
    setQcItems((prev) => [
      ...prev,
      {
        sku: pendingItem.sku,
        name: pendingItem.name,
        lpn: badLpn,
        mode: "bad",
        reason: rejectReason,
        batch: batchReady ? batch : undefined,
      },
    ]);
    setPendingItem(null);
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
    setLastDoc(doc);
    setStep("done");
  };

  const nextBox = () => {
    setBox(null);
    setQcItems([]);
    setPendingItem(null);
    setBatch(emptyBatch);
    setParamFails({});
    setScanError(null);
    setRecordingStart(null);
    setStep("select-box");
    setScanKey((k) => k + 1);
  };

  const resetSession = () => {
    setStep("scan-qc-table");
    setQcTable(null);
    setGoodLpn(null);
    setBadLpn(null);
    setGrnDocs([]);
    setBox(null);
    setQcItems([]);
    setPendingItem(null);
    setBatch(emptyBatch);
    setParamFails({});
    setLastDoc(null);
    setScanError(null);
    setRecordingStart(null);
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

  // Pendency = expected units not yet QC'd.
  const pendingUnits = items.reduce(
    (s, it) => s + Math.max(0, it.qty - (scannedBySku[it.sku] ?? 0)),
    0,
  );
  const totalUnits = items.reduce((s, it) => s + it.qty, 0);

  const filteredItems = useMemo(() => {
    const q = pendencySearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q),
    );
  }, [items, pendencySearch]);

  const failedParams = box ? box.qcParams.filter((p) => paramFails[p]) : [];

  return (
    <div className="pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-background px-6 py-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          GRN · Inbound QC
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {qcTable && (
            <div className="text-right">
              QC Table{" "}
              <span className="font-mono font-semibold text-foreground">
                {qcTable}
              </span>
            </div>
          )}
          {box && (
            <div className="text-right">
              ASN{" "}
              <span className="font-mono font-semibold text-foreground">
                {box.asn}
              </span>
            </div>
          )}
          {grnDocs.length > 0 && (
            <div className="rounded-full bg-status-picked/15 px-2 py-0.5 font-semibold text-status-picked">
              {grnDocs.length} GRN{grnDocs.length === 1 ? "" : "s"} done
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-6 p-6">
        <div className="flex-1 max-w-[640px] space-y-2">
          {/* Box context chip */}
          {box &&
            (step === "scan-good-lpn" ||
              step === "scan-bad-lpn" ||
              step === "scan-items") && (
              <Card className="flex items-center justify-between gap-3 p-2.5">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Box
                  </div>
                  <div className="font-mono text-sm font-bold">{box.boxId}</div>
                </div>
                <div className="min-w-0 text-right">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Seller
                  </div>
                  <div className="truncate text-sm font-semibold">
                    {box.seller}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Mode
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                      box.sellerFirst
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {box.sellerFirst ? "Seller-first" : "Seller-agnostic"}
                  </span>
                </div>
              </Card>
            )}

          {/* Step — QC Table */}
          {step === "scan-qc-table" && (
            <Card className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
            <>
              <Card className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <ScanBarcode className="h-3.5 w-3.5" />
                  Scan Box ID
                </div>
                <p className="text-xs text-muted-foreground">
                  GRN is done at box level. The WMS fetches the ASN from the Box
                  ID.
                </p>
                <ScanRow
                  key={`box-${scanKey}`}
                  placeholder="e.g. BOX-7F3A-001"
                  onScan={startBox}
                  autoFocus
                />
              </Card>

              <Card className="overflow-hidden p-0">
                <div className="flex items-center gap-1.5 border-b border-border bg-muted/30 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Or pick a task from unloading
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
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {t.items} units
                      </span>
                    </button>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* Step — Good LPN */}
          {step === "scan-good-lpn" && (
            <Card className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-status-picked">
                <ThumbsUp className="h-3.5 w-3.5" />
                Scan GOOD QC bin LPN
              </div>
              <p className="text-[11px] text-muted-foreground">
                Collects all items that pass QC. Retained for the session.
              </p>
              {scanError && <ErrorBanner message={scanError} />}
              <ScanRow
                key={`good-${scanKey}`}
                placeholder="Scan Good QC LPN…"
                onScan={onGoodLpnScan}
                autoFocus
              />
            </Card>
          )}

          {/* Step — Bad LPN */}
          {step === "scan-bad-lpn" && (
            <Card className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-destructive">
                <ThumbsDown className="h-3.5 w-3.5" />
                Scan BAD QC bin LPN
              </div>
              <p className="text-[11px] text-muted-foreground">
                Collects any items rejected during QC. Must differ from the Good
                LPN.
              </p>
              {scanError && <ErrorBanner message={scanError} />}
              <ScanRow
                key={`bad-${scanKey}`}
                placeholder="Scan Bad QC LPN…"
                onScan={onBadLpnScan}
                autoFocus
              />
            </Card>
          )}

          {/* Step — Item QC */}
          {step === "scan-items" && box && goodLpn && badLpn && (
            <>
              {/* Bin strip */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex items-center gap-1.5 rounded-md border border-status-picked/30 bg-status-picked/5 px-2 py-1 text-[10px]">
                  <ThumbsUp className="h-3 w-3 text-status-picked" />
                  <span className="uppercase tracking-wide text-muted-foreground">
                    Good
                  </span>
                  <span className="ml-auto truncate font-mono font-semibold">
                    {goodLpn}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1 text-[10px]">
                  <ThumbsDown className="h-3 w-3 text-destructive" />
                  <span className="uppercase tracking-wide text-muted-foreground">
                    Bad
                  </span>
                  <span className="ml-auto truncate font-mono font-semibold">
                    {badLpn}
                  </span>
                </div>
              </div>

              {/* Focused item card */}
              {!allItemsDone || pendingItem ? (
                <Card className="space-y-2 p-3">
                  <div className="flex gap-2.5">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md border border-border bg-muted/20">
                      {pendingItem ? (
                        <img
                          src={pendingItem.expected.image}
                          alt={pendingItem.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] text-muted-foreground">
                          Scan to verify
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      {pendingItem ? (
                        <>
                          <div className="text-xs font-bold leading-tight">
                            {pendingItem.name}
                          </div>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {pendingItem.sku}
                          </div>
                          <div className="grid grid-cols-2 gap-x-1.5 text-[10px]">
                            <QcRow label="MRP" value={pendingItem.expected.mrp} />
                            {pendingItem.expected.size && (
                              <QcRow
                                label="Size"
                                value={pendingItem.expected.size}
                              />
                            )}
                            {pendingItem.expected.color && (
                              <QcRow
                                label="Colour"
                                value={pendingItem.expected.color}
                              />
                            )}
                            {pendingItem.expected.weight && (
                              <QcRow
                                label="Wt"
                                value={pendingItem.expected.weight}
                              />
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full items-center text-[11px] text-muted-foreground">
                          Scan an item SKU to begin QC. Verify against the image
                          and parameters.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Batch / variant capture */}
                  {pendingItem && (
                    <div className="space-y-2 rounded-md border border-border bg-muted/20 p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
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
                      <div className="grid grid-cols-2 gap-1.5">
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
                          onChange={(v) =>
                            setBatch((b) => ({ ...b, expiry: v }))
                          }
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        OCR auto-fills from the label; edit any field for manual
                        entry.
                      </p>
                    </div>
                  )}

                  {/* Good / Bad */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 bg-status-picked text-[11px] text-white hover:bg-status-picked/90"
                      onClick={commitGood}
                      disabled={!pendingItem || !batchReady}
                    >
                      <ThumbsUp className="mr-1 h-3 w-3" />
                      Good QC
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 border-destructive/40 text-[11px] text-destructive hover:bg-destructive/5 hover:text-destructive"
                      onClick={() => {
                        setRejectReason("");
                        setRejectOpen(true);
                      }}
                      disabled={!pendingItem}
                    >
                      <ThumbsDown className="mr-1 h-3 w-3" />
                      Bad QC
                    </Button>
                  </div>

                  {scanError && <ErrorBanner message={scanError} />}
                  <ScanRow
                    key={`item-${scanKey}`}
                    placeholder={pendingItem ? "Finish current item…" : "Scan item SKU…"}
                    onScan={onItemScan}
                    autoFocus
                  />
                </Card>
              ) : (
                <Card className="flex items-center gap-2 border-status-picked/30 bg-status-picked/5 p-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-status-picked" />
                  <div className="text-xs font-medium text-status-picked">
                    All expected items QC'd — finish to generate the GRN
                    document.
                  </div>
                </Card>
              )}

              {/* QC'd table */}
              {qcTableRows.length > 0 && (
                <Card className="overflow-hidden p-0">
                  <div className="border-b border-border bg-muted/30 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    QC'd items ({qcTableRows.length})
                  </div>
                  <div className="[&_th]:px-2 [&_th]:py-1.5 [&_td]:px-2 [&_td]:py-1.5 [&_th]:h-auto [&_th]:text-[10px] [&_td]:text-xs">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/20">
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead>Batch</TableHead>
                          <TableHead>QC</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {qcTableRows.map((r, idx) => (
                          <TableRow key={`${r.lpn}-${r.sku}-${idx}`}>
                            <TableCell>
                              <div className="font-medium leading-tight">
                                {r.name}
                              </div>
                              <div className="font-mono text-[10px] text-muted-foreground">
                                {r.sku} · {r.lpn}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums">
                              {r.qty}
                            </TableCell>
                            <TableCell className="text-[10px] text-muted-foreground">
                              {r.batch
                                ? `${r.batch.lot} · Exp ${r.batch.expiry}`
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                                  r.mode === "good"
                                    ? "bg-status-picked/15 text-status-picked"
                                    : "bg-destructive/15 text-destructive",
                                )}
                              >
                                {r.mode === "good" ? "Good" : r.reason ?? "Bad"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              )}

              <Button
                className="h-10 w-full"
                disabled={qcItems.length === 0 || !!pendingItem}
                onClick={finishBox}
              >
                <Printer className="mr-2 h-4 w-4" />
                Finish box &amp; generate GRN
              </Button>
            </>
          )}

          {/* Step — Box done */}
          {step === "done" && lastDoc && (
            <>
              <Card className="space-y-2 p-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-picked/15 text-status-picked">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-base font-semibold">Box GRN complete</div>
                  <div className="text-xs text-muted-foreground">
                    A GRN document was created for this box.
                  </div>
                </div>
              </Card>

              <GrnDocSticker doc={lastDoc} />

              <Button className="h-11 w-full" onClick={nextBox}>
                <Boxes className="mr-2 h-4 w-4" />
                GRN next box
              </Button>
              <Button
                variant="outline"
                className="h-11 w-full"
                onClick={() => setStep("session-done")}
              >
                <Layers className="mr-2 h-4 w-4" />
                Complete GRN session ({grnDocs.length})
              </Button>
            </>
          )}

          {/* Step — Session summary */}
          {step === "session-done" && (
            <>
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
            </>
          )}
        </div>

        {/* Right column — pendency, QC params, camera */}
        {step === "scan-items" && box && (
          <div className="w-[240px] shrink-0 space-y-2">
            {/* Pendency */}
            <Card className="p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  ASN pendency
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px]"
                  onClick={() => {
                    setPendencySearch("");
                    setPendencyOpen(true);
                  }}
                >
                  <PackageSearch className="mr-1 h-3 w-3" />
                  {pendingUnits}/{totalUnits} left
                </Button>
              </div>
              <div className="space-y-1">
                {items.map((it) => {
                  const count = scannedBySku[it.sku] ?? 0;
                  const done = count >= it.qty;
                  return (
                    <div
                      key={it.sku}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded border px-1.5 py-1 text-[11px]",
                        done
                          ? "border-status-picked/30 bg-status-picked/5"
                          : "border-border bg-background",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {it.name}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 font-mono font-bold tabular-nums",
                          done && "text-status-picked",
                        )}
                      >
                        {count}/{it.qty}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Seller QC parameters — mark any that don't match as failed */}
            {box.sellerFirst && box.qcParams.length > 0 && (
              <Card className="p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                    Seller QC params
                  </div>
                  {failedParams.length > 0 && (
                    <span className="rounded-full bg-destructive/15 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                      {failedParams.length} failed
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {box.qcParams.map((p) => {
                    const failed = !!paramFails[p];
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          setParamFails((prev) => ({ ...prev, [p]: !prev[p] }))
                        }
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded border px-2 py-1 text-left text-[11px] transition-colors",
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
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  Tap a parameter to mark it failed if it doesn't match.
                </p>
              </Card>
            )}

            {/* Camera */}
            {recordingStart && (
              <CameraPanel startedAt={recordingStart} stationId={qcTable} />
            )}
          </div>
        )}
      </div>

      {/* Pendency modal */}
      <Dialog open={pendencyOpen} onOpenChange={setPendencyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageSearch className="h-4 w-4" />
              ASN pendency
              {box && (
                <span className="font-mono text-xs font-normal text-muted-foreground">
                  {box.asn}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={pendencySearch}
              onChange={(e) => setPendencySearch(e.target.value)}
              placeholder="Search by name or SKU…"
              className="h-9 pl-8 text-sm"
            />
          </div>
          <div className="max-h-[320px] space-y-1 overflow-y-auto">
            {filteredItems.length === 0 && (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No matching items.
              </div>
            )}
            {filteredItems.map((it) => {
              const count = scannedBySku[it.sku] ?? 0;
              const done = count >= it.qty;
              return (
                <div
                  key={it.sku}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-md border px-2.5 py-1.5",
                    done
                      ? "border-status-picked/30 bg-status-picked/5"
                      : "border-border bg-background",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold leading-tight">
                      {it.name}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {it.sku} · {it.mrp}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-mono text-sm font-bold tabular-nums",
                        done && "text-status-picked",
                      )}
                    >
                      {count}/{it.qty}
                    </span>
                    {done && (
                      <CheckCircle2 className="h-4 w-4 text-status-picked" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

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
            <div className="rounded-md border border-border bg-muted/30 p-2.5">
              <div className="text-[10px] uppercase text-muted-foreground">
                SKU
              </div>
              <div className="font-mono text-sm font-semibold">
                {pendingItem?.sku}
              </div>
            </div>
            <Select value={rejectReason} onValueChange={setRejectReason}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select reason…" />
              </SelectTrigger>
              <SelectContent>
                {qcRejectReasons.map((r) => (
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
      <label className="text-[9px] uppercase tracking-wider text-muted-foreground">
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

function GrnDocSticker({ doc }: { doc: GrnDoc }) {
  const bars = useMemo(() => grnBarcodePattern(doc.grnId), [doc.grnId]);
  return (
    <div className="rounded-lg border-2 border-dashed border-border bg-background p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          GRN Document
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">
          {doc.boxId}
        </span>
      </div>
      <div className="flex flex-col items-center">
        <div className="flex items-end gap-px">
          {bars.map((w, i) => (
            <div
              key={i}
              style={{ width: `${w * 2}px` }}
              className={cn("h-12", i % 2 === 0 ? "bg-foreground" : "bg-transparent")}
            />
          ))}
        </div>
        <div className="mt-1 font-mono text-sm font-bold tracking-wider">
          {doc.grnId}
        </div>
      </div>
      <div className="my-3 border-t border-dashed border-border" />
      <dl className="space-y-1 text-xs">
        <Row label="ASN" value={doc.asn} mono />
        <Row label="Seller" value={doc.seller} />
        <Row label="Good QC" value={String(doc.good)} />
        <Row label="Bad QC" value={String(doc.bad)} />
      </dl>
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
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
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

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="w-16 shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className={cn("flex-1 font-medium", mono && "font-mono")}>{value}</dd>
    </div>
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
      <span className="w-14 shrink-0 text-muted-foreground">{label}</span>
      <span className={cn("font-medium", mono && "font-mono")}>{value}</span>
    </div>
  );
}

function CameraPanel({
  startedAt,
  stationId,
}: {
  startedAt: Date;
  stationId: string | null;
}) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedSec = Math.max(
    0,
    Math.floor((Date.now() - startedAt.getTime()) / 1000),
  );
  const mm = String(Math.floor(elapsedSec / 60)).padStart(2, "0");
  const ss = String(elapsedSec % 60).padStart(2, "0");
  const now = new Date().toLocaleTimeString("en-IN", { hour12: false });

  return (
    <div className="sticky top-4 space-y-1.5">
      <div className="overflow-hidden rounded-lg border border-border bg-black shadow-sm">
        <div className="relative aspect-square bg-black">
          <img
            src="https://picsum.photos/seed/grn-bench-cam/400/400"
            alt="GRN bench live feed"
            className="h-full w-full object-cover opacity-70 grayscale"
          />

          <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
            </span>
            <span className="font-bold uppercase tracking-wider">Rec</span>
            <span className="font-mono">
              {mm}:{ss}
            </span>
          </div>

          <div className="absolute right-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-mono text-white backdrop-blur">
            {now}
          </div>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border border-white/30" />
          </div>

          <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1.5 text-[9px] text-white">
            <span className="truncate rounded bg-black/70 px-1.5 py-0.5 backdrop-blur">
              Cam 05{stationId ? ` · ${stationId}` : ""}
            </span>
            <span className="shrink-0 rounded bg-black/70 px-1.5 py-0.5 font-mono backdrop-blur">
              1080p
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 border-t border-border bg-background px-2 py-1 text-[10px] text-muted-foreground">
          <Video className="h-2.5 w-2.5" />
          GRN session · recording
        </div>
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
