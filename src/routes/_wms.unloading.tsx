import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Anchor,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  HelpCircle,
  ListChecks,
  Package,
  PackageOpen,
  Printer,
  ScanBarcode,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  awbIsIdentified,
  genRanId,
  inboundBarcodePattern,
  sellerFor,
} from "@/lib/wms/inbound-data";
import {
  consignmentForGatePass,
  gateBarcodePattern,
  genBoxIds,
  isReturnGatePass,
  type GatePassConsignment,
} from "@/lib/wms/gate-entry-data";

export const Route = createFileRoute("/_wms/unloading")({
  head: () => ({
    meta: [{ title: "Unloading — Inbound" }],
  }),
  component: Unloading,
});

type Step =
  // shared
  | "scan-gatepass"
  // returns flow
  | "scan-awbs"
  | "complete"
  // standard flow
  | "dock"
  | "count"
  | "print-boxes"
  | "scan-boxes"
  | "pod"
  | "done";

interface ScannedReturn {
  awb: string;
  bucket: "identified" | "unidentified";
  seller: string;
}

interface ReturnAck {
  ran: string;
  bucket: "identified" | "unidentified";
  returns: ScannedReturn[];
}

interface ScannedBox {
  id: string;
  qc: "ok" | "rejected";
}

const dateLabel = (d: Date) =>
  d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function Unloading() {
  const [step, setStep] = useState<Step>("scan-gatepass");
  const [gatePass, setGatePass] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanKey, setScanKey] = useState(0);

  // ----- Returns flow -----
  const [gatePassSeller, setGatePassSeller] = useState<string | null>(null);
  const [returns, setReturns] = useState<ScannedReturn[]>([]);
  const [acknowledgements, setAcknowledgements] = useState<ReturnAck[]>([]);
  const [closedAt, setClosedAt] = useState<Date | null>(null);
  const [printOpen, setPrintOpen] = useState(false);

  // ----- Standard flow -----
  const [consignment, setConsignment] = useState<GatePassConsignment | null>(
    null,
  );
  const [dockId, setDockId] = useState("");
  const [boxCount, setBoxCount] = useState(0);
  const [boxIds, setBoxIds] = useState<string[]>([]);
  const [scanned, setScanned] = useState<ScannedBox[]>([]);
  const [boxPrintOpen, setBoxPrintOpen] = useState(false);
  const [boxesPrinted, setBoxesPrinted] = useState(false);
  const [podCaptured, setPodCaptured] = useState(false);
  const [damagedCaptured, setDamagedCaptured] = useState(false);
  const unloadDate = useMemo(() => new Date(), []);

  const identified = returns.filter((r) => r.bucket === "identified");
  const unidentified = returns.filter((r) => r.bucket === "unidentified");

  const guardCount = consignment?.boxCount ?? 0;
  const shortfall = guardCount - boxCount;
  const exceptionRaised = shortfall > 0;

  const onGatePassScan = (val: string) => {
    const id = val.trim().toUpperCase();
    if (!id) return;
    setGatePass(id);
    setScanError(null);
    if (isReturnGatePass(id)) {
      setGatePassSeller(sellerFor(id));
      setStep("scan-awbs");
    } else {
      const c = consignmentForGatePass(id);
      setConsignment(c);
      setBoxCount(c.boxCount);
      setStep("dock");
    }
    setScanKey((k) => k + 1);
  };

  // --- Returns handlers ---
  const onAwbScan = (val: string) => {
    const awb = val.trim().toUpperCase();
    if (!awb) return;
    if (returns.find((r) => r.awb === awb)) {
      setScanError(`${awb} already scanned at the gate.`);
      setScanKey((k) => k + 1);
      return;
    }
    const bucket: "identified" | "unidentified" = awbIsIdentified(awb)
      ? "identified"
      : "unidentified";
    setReturns((rs) => [...rs, { awb, bucket, seller: sellerFor(awb) }]);
    setScanError(null);
    setScanKey((k) => k + 1);
  };

  const completeUnloading = () => {
    if (returns.length === 0) return;
    const buckets: ("identified" | "unidentified")[] = [
      "identified",
      "unidentified",
    ];
    const acks: ReturnAck[] = buckets
      .map((bucket) => {
        const rs = returns.filter((r) => r.bucket === bucket);
        if (rs.length === 0) return null;
        return { ran: genRanId(), bucket, returns: rs };
      })
      .filter((a): a is ReturnAck => a !== null);
    setAcknowledgements(acks);
    setClosedAt(new Date());
    setStep("complete");
  };

  // --- Standard handlers ---
  const confirmDock = () => {
    if (!dockId.trim()) return;
    setStep("count");
  };

  const confirmCount = () => {
    if (boxCount < 1 || !gatePass) return;
    setBoxIds(genBoxIds(gatePass, boxCount));
    setStep("print-boxes");
  };

  const onBoxScan = (val: string) => {
    const id = val.trim().toUpperCase();
    if (!id) return;
    if (!boxIds.includes(id)) {
      toast.error("This box doesn't belong to this gate entry.", {
        description: id,
      });
      setScanKey((k) => k + 1);
      return;
    }
    if (scanned.some((b) => b.id === id)) {
      toast.warning(`${id} already scanned.`);
      setScanKey((k) => k + 1);
      return;
    }
    setScanned((prev) => [{ id, qc: "ok" }, ...prev]);
    setScanKey((k) => k + 1);
  };

  const setBoxQc = (id: string, qc: "ok" | "rejected") =>
    setScanned((prev) => prev.map((b) => (b.id === id ? { ...b, qc } : b)));

  const reset = () => {
    setStep("scan-gatepass");
    setGatePass(null);
    setScanError(null);
    setGatePassSeller(null);
    setReturns([]);
    setAcknowledgements([]);
    setClosedAt(null);
    setConsignment(null);
    setDockId("");
    setBoxCount(0);
    setBoxIds([]);
    setBoxesPrinted(false);
    setScanned([]);
    setPodCaptured(false);
    setDamagedCaptured(false);
    setScanKey((k) => k + 1);
  };

  const allScanned = boxIds.length > 0 && scanned.length === boxIds.length;
  const rejectedCount = scanned.filter((b) => b.qc === "rejected").length;

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-muted/40 py-4">
      <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 border-b border-border bg-background px-4 py-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <PackageOpen className="h-4 w-4 text-muted-foreground" />
            Unloading
            {consignment && (
              <span className="text-muted-foreground">· Inbound</span>
            )}
            {gatePassSeller !== null && (
              <span className="text-muted-foreground">· Returns</span>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {gatePass && (
              <div className="text-right text-xs text-muted-foreground">
                Gate Pass{" "}
                <span className="font-mono font-semibold text-foreground">
                  {gatePass}
                </span>
              </div>
            )}
            {dockId.trim() && step !== "dock" && (
              <DockTag dockId={dockId} />
            )}
          </div>
        </div>

        <div className="space-y-3 p-4">
          {/* Step — Gate Pass */}
          {step === "scan-gatepass" && (
            <Card className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <ScanBarcode className="h-3.5 w-3.5" />
                Scan Gate Pass
              </div>
              <p className="text-xs text-muted-foreground">
                Created at gate entry. A return gate pass opens the returns flow;
                any other pass opens standard unloading.
              </p>
              <ScanRow
                key={`gp-${scanKey}`}
                placeholder="e.g. GP-2024-008912"
                onScan={onGatePassScan}
                autoFocus
              />
            </Card>
          )}

          {/* ----------------- STANDARD FLOW ----------------- */}

          {/* Step — Marry to dock */}
          {step === "dock" && consignment && (
            <>
              <ConsignmentCard c={consignment} />
              <Card className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Anchor className="h-3.5 w-3.5" />
                  Marry to Dock
                </div>
                <p className="text-xs text-muted-foreground">
                  Scan or enter the dock the vehicle has been assigned to.
                </p>
                <ScanRow
                  key={`dock-${scanKey}`}
                  placeholder="e.g. DOCK-FK-03"
                  onScan={(v) => setDockId(v.trim().toUpperCase())}
                  value={dockId}
                  onChange={(v) => setDockId(v.toUpperCase())}
                  autoFocus
                />
              </Card>
              <Button
                className="h-11 w-full"
                disabled={!dockId.trim()}
                onClick={confirmDock}
              >
                <Anchor className="mr-2 h-4 w-4" />
                Marry gate pass to dock
              </Button>
            </>
          )}

          {/* Step — Box count + shortage exception */}
          {step === "count" && consignment && (
            <>
              <Card className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Package className="h-3.5 w-3.5" />
                  Box Count
                </div>
                <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Entered by guard</span>
                  <span className="font-mono text-lg font-bold tabular-nums">
                    {guardCount}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  After the global count, you may revise this down if boxes are
                  short. You cannot enter more than the guard recorded.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 shrink-0 text-lg"
                    onClick={() => setBoxCount((n) => Math.max(1, n - 1))}
                  >
                    –
                  </Button>
                  <Input
                    value={String(boxCount)}
                    onChange={(e) => {
                      const n = Number(e.target.value.replace(/[^0-9]/g, "")) || 0;
                      setBoxCount(Math.min(guardCount, Math.max(0, n)));
                    }}
                    inputMode="numeric"
                    className="h-11 text-center font-mono text-lg font-bold"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 shrink-0 text-lg"
                    onClick={() =>
                      setBoxCount((n) => Math.min(guardCount, n + 1))
                    }
                  >
                    +
                  </Button>
                </div>
                {exceptionRaised && (
                  <div className="flex items-start gap-2 rounded-md border border-orange-300 bg-orange-50 p-3 text-xs text-orange-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                    <span>
                      Shortage of <b>{shortfall}</b> box
                      {shortfall === 1 ? "" : "es"} flagged. An exception will be
                      raised for the supervisor to review.
                    </span>
                  </div>
                )}
              </Card>
              <Button
                className="h-11 w-full"
                disabled={boxCount < 1}
                onClick={confirmCount}
              >
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Confirm {boxCount} box{boxCount === 1 ? "" : "es"}
              </Button>
            </>
          )}

          {/* Step — Print box ID barcodes */}
          {step === "print-boxes" && consignment && (
            <>
              <Card className="space-y-3 p-4 text-center">
                <Printer className="mx-auto h-7 w-7 text-primary" />
                <div>
                  <div className="text-sm font-semibold">
                    {boxIds.length} box label{boxIds.length === 1 ? "" : "s"} ready
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Each label carries the box ID, ASN {consignment.asn} and the
                    unloading date.
                  </div>
                </div>
                {boxesPrinted ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-1.5 rounded-md border border-status-dispatched/30 bg-status-dispatched/5 px-3 py-2 text-xs font-medium text-status-dispatched">
                      <CheckCircle2 className="h-4 w-4" />
                      Box labels printed
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        toast.success("Reprint request sent to manager.", {
                          description: "Awaiting approval before labels reissue.",
                        })
                      }
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Request reprint
                    </Button>
                    <p className="text-[11px] text-muted-foreground">
                      Box labels print once. A reprint needs manager approval.
                    </p>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setBoxPrintOpen(true)}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print box ID barcodes
                  </Button>
                )}
              </Card>
              <Button
                className="h-11 w-full"
                onClick={() => setStep("scan-boxes")}
              >
                <ScanBarcode className="mr-2 h-4 w-4" />
                Proceed to scan boxes
              </Button>
            </>
          )}

          {/* Step — Scan boxes to confirm */}
          {step === "scan-boxes" && (
            <>
              <Card className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <ScanBarcode className="h-3.5 w-3.5" />
                  Scan box IDs
                </div>
                <ScanRow
                  key={`box-${scanKey}`}
                  placeholder="Scan box ID…"
                  onScan={onBoxScan}
                  autoFocus
                />
                <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Scanned</span>
                  <span className="font-mono font-bold tabular-nums">
                    {scanned.length} / {boxIds.length}
                  </span>
                </div>
              </Card>

              {scanned.length > 0 && (
                <Card className="space-y-1.5 p-3">
                  <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <span>Scanned boxes ({scanned.length})</span>
                    {rejectedCount > 0 && (
                      <span className="text-destructive">
                        {rejectedCount} rejected
                      </span>
                    )}
                  </div>
                  {scanned.map((b) => (
                    <div
                      key={b.id}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-md border px-2 py-1.5",
                        b.qc === "ok"
                          ? "border-status-picked/30 bg-status-picked/5"
                          : "border-destructive/40 bg-destructive/5",
                      )}
                    >
                      <span className="truncate font-mono text-xs font-semibold">
                        {b.id}
                      </span>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => setBoxQc(b.id, "ok")}
                          title="QC OK"
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                            b.qc === "ok"
                              ? "bg-status-picked text-white"
                              : "text-muted-foreground hover:bg-muted",
                          )}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setBoxQc(b.id, "rejected")}
                          title="QC Reject"
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                            b.qc === "rejected"
                              ? "bg-destructive text-white"
                              : "text-muted-foreground hover:bg-muted",
                          )}
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </Card>
              )}

              <Button
                className="h-11 w-full"
                disabled={scanned.length === 0}
                onClick={() => setStep("pod")}
              >
                <ListChecks className="mr-2 h-4 w-4" />
                {allScanned
                  ? "All boxes scanned — continue"
                  : `Continue (${scanned.length} of ${boxIds.length} scanned)`}
              </Button>
            </>
          )}

          {/* Step — POD capture */}
          {step === "pod" && (
            <>
              <Card className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Camera className="h-3.5 w-3.5" />
                  Proof of Delivery
                </div>
                <p className="text-xs text-muted-foreground">
                  Capture the final receiving copy with stamp &amp; signature.
                </p>
                <button
                  onClick={() => setPodCaptured((v) => !v)}
                  className={cn(
                    "flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
                    podCaptured
                      ? "border-status-dispatched/40 bg-status-dispatched/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/40",
                  )}
                >
                  {podCaptured ? (
                    <>
                      <CheckCircle2 className="h-8 w-8 text-status-dispatched" />
                      <span className="text-xs font-medium text-status-dispatched">
                        receiving-copy.jpg captured
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Tap to retake
                      </span>
                    </>
                  ) : (
                    <>
                      <Camera className="h-8 w-8 text-primary" />
                      <span className="text-xs font-medium">
                        Capture / upload POD copy
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Stamped &amp; signed receiving copy
                      </span>
                    </>
                  )}
                </button>
              </Card>

              <Card className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Camera className="h-3.5 w-3.5" />
                  Damaged Boxes
                  <span className="font-normal lowercase tracking-normal text-muted-foreground/70">
                    (optional)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Photograph any boxes received damaged
                  {rejectedCount > 0 ? ` (${rejectedCount} rejected at QC)` : ""}.
                </p>
                <button
                  onClick={() => setDamagedCaptured((v) => !v)}
                  className={cn(
                    "flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
                    damagedCaptured
                      ? "border-orange-300 bg-orange-50"
                      : "border-border hover:border-primary/40 hover:bg-muted/40",
                  )}
                >
                  {damagedCaptured ? (
                    <>
                      <CheckCircle2 className="h-8 w-8 text-orange-600" />
                      <span className="text-xs font-medium text-orange-700">
                        damaged-boxes.jpg captured
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Tap to retake
                      </span>
                    </>
                  ) : (
                    <>
                      <Camera className="h-8 w-8 text-primary" />
                      <span className="text-xs font-medium">
                        Capture / upload damage photo
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Attach to the unloading exception
                      </span>
                    </>
                  )}
                </button>
              </Card>

              <Button
                className="h-11 w-full"
                disabled={!podCaptured}
                onClick={() => setStep("done")}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Complete unloading
              </Button>
            </>
          )}

          {/* Step — Standard done */}
          {step === "done" && consignment && (
            <>
              <Card className="space-y-2 p-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-dispatched/15 text-status-dispatched">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-base font-semibold">
                    Unloading complete
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {scanned.length - rejectedCount} accepted
                    {rejectedCount > 0 ? ` · ${rejectedCount} rejected` : ""} at{" "}
                    {dockId} · POD captured
                  </div>
                </div>
              </Card>
              {exceptionRaised && (
                <div className="flex items-start gap-2 rounded-md border border-orange-300 bg-orange-50 p-3 text-xs text-orange-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                  <span>
                    Shortage exception ({shortfall} box
                    {shortfall === 1 ? "" : "es"}) sent to supervisor for review.
                  </span>
                </div>
              )}
              {rejectedCount > 0 && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {rejectedCount} box{rejectedCount === 1 ? "" : "es"} rejected at
                    QC — flagged for supervisor review.
                  </span>
                </div>
              )}
              <Button variant="outline" className="h-11 w-full" onClick={reset}>
                Start new unloading
              </Button>
            </>
          )}

          {/* ----------------- RETURNS FLOW ----------------- */}

          {step === "scan-awbs" && (
            <>
              <Card className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <ScanBarcode className="h-3.5 w-3.5" />
                  Scan return AWB
                </div>
                {scanError && <ErrorBanner message={scanError} />}
                <ScanRow
                  key={`awb-${scanKey}`}
                  placeholder="Scan return AWB…"
                  onScan={onAwbScan}
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground">
                  The system auto-routes each AWB to the Identified pile if a
                  return request already exists, otherwise to the Unidentified
                  pile.
                </p>
              </Card>

              <div className="grid grid-cols-2 gap-2">
                <BucketTile
                  title="Identified"
                  count={identified.length}
                  tone="ok"
                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                />
                <BucketTile
                  title="Unidentified"
                  count={unidentified.length}
                  tone="warn"
                  icon={<HelpCircle className="h-3.5 w-3.5" />}
                />
              </div>

              {identified.length > 0 && (
                <Card className="space-y-1.5 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-status-picked" />
                    Identified pile ({identified.length})
                  </div>
                  {identified.map((r) => (
                    <AwbRow key={r.awb} awb={r.awb} seller={r.seller} tone="ok" />
                  ))}
                </Card>
              )}

              {unidentified.length > 0 && (
                <Card className="space-y-1.5 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <HelpCircle className="h-3.5 w-3.5 text-orange-600" />
                    Unidentified pile ({unidentified.length})
                  </div>
                  {unidentified.map((r) => (
                    <AwbRow
                      key={r.awb}
                      awb={r.awb}
                      seller={r.seller}
                      tone="warn"
                    />
                  ))}
                </Card>
              )}

              <Button
                className="h-11 w-full"
                disabled={returns.length === 0}
                onClick={completeUnloading}
              >
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Complete unloading ({returns.length})
              </Button>
            </>
          )}

          {step === "complete" && closedAt && (
            <>
              <Card className="space-y-2 p-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-picked/15 text-status-picked">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-base font-semibold">
                    Unloading complete
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {acknowledgements.length} return acknowledgement
                    {acknowledgements.length === 1 ? "" : "s"} generated
                  </div>
                  {gatePass && (
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Gate Pass{" "}
                      <span className="font-mono font-semibold text-foreground">
                        {gatePass}
                      </span>{" "}
                      ·{" "}
                      {closedAt.toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                  )}
                </div>
              </Card>

              <Button className="h-11 w-full" onClick={() => setPrintOpen(true)}>
                <Printer className="mr-2 h-4 w-4" />
                Print stickers ({acknowledgements.length})
              </Button>

              <Button variant="outline" className="h-11 w-full" onClick={reset}>
                Start new unloading
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Box label print dialog */}
      <Dialog open={boxPrintOpen} onOpenChange={setBoxPrintOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              {boxIds.length} box label{boxIds.length === 1 ? "" : "s"}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto">
            {consignment &&
              boxIds.map((id) => (
                <BoxSticker
                  key={id}
                  boxId={id}
                  asn={consignment.asn}
                  date={dateLabel(unloadDate)}
                />
              ))}
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={() => {
                setBoxesPrinted(true);
                setBoxPrintOpen(false);
              }}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Printed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return ack print dialog */}
      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              {acknowledgements.length > 1
                ? `${acknowledgements.length} return ack stickers`
                : "Return ack sticker"}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto">
            {acknowledgements.map((a) => (
              <RanSticker key={a.ran} ack={a} />
            ))}
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={() => setPrintOpen(false)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Printed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DockTag({ dockId }: { dockId: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        Dock
      </span>
      <span className="font-mono text-xs font-semibold text-foreground">
        {dockId}
      </span>
    </div>
  );
}

function ConsignmentCard({ c }: { c: GatePassConsignment }) {
  return (
    <Card className="space-y-2 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{c.seller.name}</span>
        {c.community && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            {c.community}
          </span>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        <Fact label="ASN" value={c.asn} mono />
        <Fact label="Vendor" value={c.seller.id} mono />
        <Fact label="Boxes (guard)" value={String(c.boxCount)} />
        <Fact label="Warehouse" value={c.seller.warehouseId} mono />
      </dl>
    </Card>
  );
}

function Fact({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className={cn("font-medium", mono && "font-mono")}>{value}</dd>
    </div>
  );
}

function BoxSticker({
  boxId,
  asn,
  date,
}: {
  boxId: string;
  asn: string;
  date: string;
}) {
  const bars = useMemo(() => gateBarcodePattern(boxId), [boxId]);
  return (
    <div className="rounded-lg border-2 border-dashed border-border bg-background p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Inbound Box
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {date}
        </span>
      </div>
      <div className="flex flex-col items-center">
        <div className="flex items-end gap-px">
          {bars.map((w, i) => (
            <div
              key={i}
              style={{ width: `${w * 2}px` }}
              className={cn(
                "h-10",
                i % 2 === 0 ? "bg-foreground" : "bg-transparent",
              )}
            />
          ))}
        </div>
        <div className="mt-1 font-mono text-sm font-bold tracking-wider">
          {boxId}
        </div>
      </div>
      <div className="my-3 border-t border-dashed border-border" />
      <dl className="space-y-1 text-xs">
        <StickerRow label="ASN" value={asn} />
        <StickerRow label="Unloaded" value={date} />
      </dl>
    </div>
  );
}

function RanSticker({ ack }: { ack: ReturnAck }) {
  const bars = useMemo(() => inboundBarcodePattern(ack.ran), [ack.ran]);
  const isIdentified = ack.bucket === "identified";
  return (
    <div className="rounded-lg border-2 border-dashed border-border bg-background p-4">
      <div className="mb-2 flex items-center justify-between">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            isIdentified
              ? "bg-status-picked/15 text-status-picked"
              : "bg-orange-100 text-orange-700",
          )}
        >
          {isIdentified ? "Identified" : "Unidentified"}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Return Ack
        </span>
      </div>

      <div className="flex flex-col items-center">
        <div className="flex items-end gap-px">
          {bars.map((w, i) => (
            <div
              key={i}
              style={{ width: `${w * 2}px` }}
              className={cn(
                "h-12",
                i % 2 === 0 ? "bg-foreground" : "bg-transparent",
              )}
            />
          ))}
        </div>
        <div className="mt-1 font-mono text-sm font-bold tracking-wider">
          {ack.ran}
        </div>
      </div>

      <div className="my-3 border-t border-dashed border-border" />

      <div className="flex flex-col items-center">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Shipments
        </span>
        <span className="font-mono text-5xl font-black leading-none">
          {ack.returns.length}
        </span>
      </div>

      <div className="my-3 border-t border-dashed border-border" />

      <dl className="space-y-1 text-xs">
        <StickerRow
          label="Type"
          value={isIdentified ? "Identified" : "Unidentified"}
        />
        <StickerRow
          label="Sellers"
          value={String(new Set(ack.returns.map((r) => r.seller)).size)}
        />
      </dl>
    </div>
  );
}

function StickerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="w-16 shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="flex-1 font-medium">{value}</dd>
    </div>
  );
}

function AwbRow({
  awb,
  seller,
  tone,
}: {
  awb: string;
  seller: string;
  tone: "ok" | "warn";
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-xs",
        tone === "ok"
          ? "border-status-picked/30 bg-status-picked/5"
          : "border-orange-300 bg-orange-50",
      )}
    >
      <span className="font-mono font-semibold">{awb}</span>
      <span
        className={cn(
          "shrink-0 truncate rounded-full px-1.5 py-0.5 text-[10px] font-medium",
          tone === "ok"
            ? "bg-status-picked/15 text-status-picked"
            : "bg-orange-100 text-orange-700",
        )}
        title={seller}
      >
        {seller}
      </span>
    </div>
  );
}

function BucketTile({
  title,
  count,
  tone,
  icon,
}: {
  title: string;
  count: number;
  tone: "ok" | "warn";
  icon: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "flex items-center justify-between gap-2 p-3",
        tone === "ok"
          ? "border-status-picked/30 bg-status-picked/5"
          : "border-orange-300 bg-orange-50",
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide">
        <span
          className={tone === "ok" ? "text-status-picked" : "text-orange-600"}
        >
          {icon}
        </span>
        {title}
      </div>
      <span className="font-mono text-lg font-bold tabular-nums leading-none">
        {count}
      </span>
    </Card>
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
  value,
  onChange,
}: {
  placeholder: string;
  onScan: (value: string) => void;
  autoFocus?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const [internal, setInternal] = useState("");
  const val = value !== undefined ? value : internal;
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!val.trim()) return;
        onScan(val);
        if (value === undefined) setInternal("");
        inputRef.current?.focus();
      }}
    >
      <Input
        ref={inputRef}
        autoFocus={autoFocus}
        value={val}
        onChange={(e) => {
          if (onChange) onChange(e.target.value);
          if (value === undefined) setInternal(e.target.value);
        }}
        placeholder={placeholder}
        className="h-11 font-mono text-sm"
      />
    </form>
  );
}
