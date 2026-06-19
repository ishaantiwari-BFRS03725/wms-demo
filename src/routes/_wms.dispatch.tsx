import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  MapPin,
  MinusCircle,
  PenLine,
  ScanBarcode,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Truck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";
import {
  assignCombo,
  barcodePattern,
  channelStyles,
  courierStyles,
  type ManifestCombo,
} from "@/lib/wms/manifest-data";
import {
  awbOutcome,
  genShiplistId,
  removalReasons,
} from "@/lib/wms/dispatch-data";

export const Route = createFileRoute("/_wms/dispatch")({
  head: () => ({
    meta: [{ title: "Dispatch — Handover" }],
  }),
  component: Dispatch,
});

type Step =
  | "scan-gatepass"
  | "scan-manifest"
  | "scan-awbs"
  | "poh-close"
  | "complete";

interface AcceptedShipment {
  awb: string;
  scannedAt: Date;
}

interface RemovedShipment {
  awb: string;
  reason: string;
}

interface RemoveQueueItem {
  awb: string;
  reason: string;
}

interface GatePass {
  id: string;
  combo: ManifestCombo;
}

interface Manifest {
  id: string;
  combo: ManifestCombo;
}

interface LastScan {
  awb: string;
  kind: "accepted" | "pre-screened";
  reason?: string;
}

const checklistItems = [
  "Seal Number Verified",
  "Physical Count Matches",
  "Vehicle Cleanliness Checked",
  "Document Bundle Handover",
] as const;

function Dispatch() {
  const [step, setStep] = useState<Step>("scan-gatepass");
  const [gatePass, setGatePass] = useState<GatePass | null>(null);
  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [accepted, setAccepted] = useState<AcceptedShipment[]>([]);
  const [removed, setRemoved] = useState<RemovedShipment[]>([]);
  const [preScreened, setPreScreened] = useState(0);
  const [lastScan, setLastScan] = useState<LastScan | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Remove-from-shiplist dialog state
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeQueue, setRemoveQueue] = useState<RemoveQueueItem[]>([]);
  const [removeScanError, setRemoveScanError] = useState<string | null>(null);

  // POH state
  const [shiplistId, setShiplistId] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [fePhotoUrl, setFePhotoUrl] = useState("");
  const [closedAt, setClosedAt] = useState<Date | null>(null);

  const [scanKey, setScanKey] = useState(0);

  const acceptedAwbs = useMemo(
    () => new Set(accepted.map((s) => s.awb)),
    [accepted],
  );

  // ── Step handlers ────────────────────────────────────────
  const onGatePassScan = (val: string) => {
    const id = val.trim().toUpperCase();
    if (!id) return;
    const combo = assignCombo(id);
    setGatePass({ id, combo });
    setStep("scan-manifest");
    setScanKey((k) => k + 1);
  };

  const onManifestScan = (val: string) => {
    const id = val.trim().toUpperCase();
    if (!id || !gatePass) return;
    // Skip duplicates — same manifest already added to this shiplist
    if (manifests.some((m) => m.id === id)) {
      setStep("scan-awbs");
      setScanKey((k) => k + 1);
      return;
    }
    setManifests((ms) => [...ms, { id, combo: gatePass.combo }]);
    setStep("scan-awbs");
    setScanKey((k) => k + 1);
  };

  const onAwbScan = (val: string) => {
    const awb = val.trim().toUpperCase();
    if (!awb) return;

    if (acceptedAwbs.has(awb)) {
      setScanError(`${awb} already on shiplist.`);
      setScanKey((k) => k + 1);
      return;
    }
    if (removed.find((r) => r.awb === awb)) {
      setScanError(`${awb} was removed from this shiplist.`);
      setScanKey((k) => k + 1);
      return;
    }

    const outcome = awbOutcome(awb);
    if (outcome.status === "rejected") {
      // Pre-screened — never added to shiplist. Just warn the supervisor.
      setPreScreened((n) => n + 1);
      setLastScan({ awb, kind: "pre-screened", reason: outcome.reason });
      setScanError(null);
      toast.warning(`${awb} · ${outcome.reason} — hand back, not on shiplist`);
      setScanKey((k) => k + 1);
      return;
    }

    setAccepted((ss) => [...ss, { awb, scannedAt: new Date() }]);
    setLastScan({ awb, kind: "accepted" });
    setScanError(null);
    setScanKey((k) => k + 1);
  };

  // ── Remove-from-shiplist handlers ────────────────────────
  const openRemoveDialog = () => {
    setRemoveQueue([]);
    setRemoveScanError(null);
    setRemoveOpen(true);
  };

  const onRemoveScan = (val: string) => {
    const awb = val.trim().toUpperCase();
    if (!awb) return;
    if (removeQueue.find((q) => q.awb === awb)) {
      setRemoveScanError(`${awb} already in removal queue.`);
      return;
    }
    if (!acceptedAwbs.has(awb)) {
      setRemoveScanError(`${awb} is not on the current shiplist.`);
      return;
    }
    setRemoveScanError(null);
    setRemoveQueue((q) => [...q, { awb, reason: "" }]);
  };

  const setQueueReason = (awb: string, reason: string) => {
    setRemoveQueue((q) =>
      q.map((item) => (item.awb === awb ? { ...item, reason } : item)),
    );
  };

  const dropFromQueue = (awb: string) => {
    setRemoveQueue((q) => q.filter((item) => item.awb !== awb));
  };

  const confirmRemoval = () => {
    if (removeQueue.length === 0) return;
    if (removeQueue.some((q) => !q.reason)) {
      setRemoveScanError("Select a reason for every queued shipment.");
      return;
    }
    const removeSet = new Set(removeQueue.map((q) => q.awb));
    setAccepted((ss) => ss.filter((s) => !removeSet.has(s.awb)));
    setRemoved((r) => [
      ...r,
      ...removeQueue.map((q) => ({ awb: q.awb, reason: q.reason })),
    ]);
    setRemoveQueue([]);
    setRemoveScanError(null);
    setRemoveOpen(false);
  };

  // ── POH handlers ─────────────────────────────────────────
  const enterPoh = () => {
    if (accepted.length === 0) return;
    if (!shiplistId) setShiplistId(genShiplistId());
    setStep("poh-close");
  };

  const canClose =
    !!signatureUrl && !!fePhotoUrl && accepted.length > 0;

  const confirmClose = () => {
    setClosedAt(new Date());
    setStep("complete");
  };

  const reset = () => {
    setStep("scan-gatepass");
    setGatePass(null);
    setManifests([]);
    setAccepted([]);
    setRemoved([]);
    setPreScreened(0);
    setLastScan(null);
    setScanError(null);
    setSignatureUrl("");
    setFePhotoUrl("");
    setShiplistId("");
    setClosedAt(null);
    setScanKey((k) => k + 1);
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 border-b border-border bg-background px-4 py-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <Truck className="h-4 w-4 text-muted-foreground" />
          Dispatch · Handover
        </div>
        {gatePass && step !== "complete" && (
          <div className="text-right text-xs text-muted-foreground">
            Gate Pass{" "}
            <span className="font-mono font-semibold text-foreground">
              {gatePass.id}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        {/* Gate Pass / Manifest context cards */}
        {gatePass && step !== "scan-gatepass" && step !== "complete" && (
          <PassCard label="Gate Pass" id={gatePass.id} combo={gatePass.combo} />
        )}
        {manifests.length > 0 && step !== "scan-manifest" && step !== "complete" && step !== "scan-gatepass" && (
          <Card className="space-y-1 border-status-picked/30 bg-status-picked/5 p-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-status-picked" />
              <div className="text-[11px] uppercase text-muted-foreground">
                Manifests on shiplist ({manifests.length})
              </div>
            </div>
            <div className="space-y-0.5 pl-6">
              {manifests.map((m) => (
                <div
                  key={m.id}
                  className="font-mono text-xs font-semibold"
                >
                  {m.id}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── Step: Scan Gate Pass ── */}
        {step === "scan-gatepass" && (
          <Card className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
              <ScanBarcode className="h-3.5 w-3.5" />
              Scan Gate Pass
            </div>
            <p className="text-xs text-muted-foreground">
              Provided by the courier field executive at handover.
            </p>
            <ScanRow
              key={`gp-${scanKey}`}
              placeholder="e.g. GP-A1B2"
              onScan={onGatePassScan}
              autoFocus
            />
          </Card>
        )}

        {/* ── Step: Scan Manifest ── */}
        {step === "scan-manifest" && (
          <Card className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
              <ScanBarcode className="h-3.5 w-3.5" />
              Scan Manifest sticker
            </div>
            <p className="text-xs text-muted-foreground">
              From the cage/box containing manifested shipments.
            </p>
            <ScanRow
              key={`mf-${scanKey}`}
              placeholder="e.g. MNFST-XXXXXXXX"
              onScan={onManifestScan}
              autoFocus
            />
          </Card>
        )}

        {/* ── Step: Scan AWBs ── */}
        {step === "scan-awbs" && (
          <>
            <Card className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                <ScanBarcode className="h-3.5 w-3.5" />
                Scan shipment AWB
              </div>
              {scanError && <ErrorBanner message={scanError} />}
              <ScanRow
                key={`awb-${scanKey}`}
                placeholder="Scan AWB barcode…"
                onScan={onAwbScan}
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                Cancelled shipments are pre-screened and stay off the shiplist.
                If the courier rejects an accepted shipment, use{" "}
                <em>Remove from Shiplist</em>.
              </p>
            </Card>

            {/* Last scan flash */}
            {lastScan && <ScanFlash scan={lastScan} />}

            {/* Counts */}
            <div className="grid grid-cols-3 gap-2">
              <CountTile
                label="On shiplist"
                value={accepted.length}
                accent="picked"
              />
              <CountTile
                label="Pre-screened"
                value={preScreened}
                accent="warn"
              />
              <CountTile
                label="Removed"
                value={removed.length}
                accent="muted"
              />
            </div>

            {/* Accepted list */}
            {accepted.length > 0 && (
              <Card className="space-y-2 p-4">
                <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-status-picked" />
                  On shiplist ({accepted.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {accepted.map((s) => (
                    <span
                      key={s.awb}
                      className="rounded-md bg-status-picked/10 px-2 py-0.5 font-mono text-[11px] text-status-picked"
                    >
                      {s.awb}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Removed list */}
            {removed.length > 0 && (
              <Card className="space-y-2 p-4">
                <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  <MinusCircle className="h-3.5 w-3.5" />
                  Removed from shiplist ({removed.length})
                </div>
                <div className="space-y-1.5">
                  {removed.map((r) => (
                    <div
                      key={r.awb}
                      className="flex items-start justify-between gap-2 rounded-md border border-border bg-muted/30 p-2 text-xs"
                    >
                      <div>
                        <div className="font-mono text-sm font-semibold text-muted-foreground line-through">
                          {r.awb}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {r.reason}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-[2px] bg-muted px-1.5 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                        Removed
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Add another manifest to the same shiplist */}
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-full"
              onClick={() => {
                setStep("scan-manifest");
                setScanKey((k) => k + 1);
              }}
            >
              <ScanBarcode className="mr-2 h-3.5 w-3.5" />
              Add another manifest to this shiplist
            </Button>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-11 flex-1"
                disabled={accepted.length === 0}
                onClick={openRemoveDialog}
              >
                <MinusCircle className="mr-2 h-4 w-4" />
                Remove from Shiplist
              </Button>
              <Button
                className="h-11 flex-1"
                disabled={accepted.length === 0}
                onClick={enterPoh}
              >
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Close Shiplist
              </Button>
            </div>
          </>
        )}

        {/* ── Step: POH Close ── */}
        {step === "poh-close" && gatePass && manifests.length > 0 && (
          <PohScreen
            shiplistId={shiplistId}
            gatePass={gatePass}
            manifests={manifests}
            totalShipments={accepted.length}
            exceptionsHandled={preScreened + removed.length}
            signatureUrl={signatureUrl}
            setSignatureUrl={setSignatureUrl}
            fePhotoUrl={fePhotoUrl}
            setFePhotoUrl={setFePhotoUrl}
            canClose={canClose}
            onCancel={() => setStep("scan-awbs")}
            onConfirm={confirmClose}
          />
        )}

        {/* ── Complete ── */}
        {step === "complete" &&
          gatePass &&
          manifests.length > 0 &&
          closedAt && (
            <CompletionCard
              shiplistId={shiplistId}
              closedAt={closedAt}
              gatePass={gatePass}
              manifests={manifests}
              totalShipments={accepted.length}
              exceptionsHandled={preScreened + removed.length}
              signatureUrl={signatureUrl}
              fePhotoUrl={fePhotoUrl}
              onReset={reset}
            />
          )}
      </div>

      {/* Remove-from-shiplist dialog */}
      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <MinusCircle className="h-4 w-4" />
              Remove Shipments from Handover
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Scan input */}
            <div>
              <label className="mb-1 block text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                Scan AWB to Remove
              </label>
              {removeScanError && <ErrorBanner message={removeScanError} />}
              <ScanRow
                key={`rm-${removeQueue.length}`}
                placeholder="Scan or enter AWB number…"
                onScan={onRemoveScan}
                autoFocus
              />
            </div>

            {/* Queue list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  Queued for Removal
                </div>
                <span className="rounded-[3px] bg-muted px-2 py-0.5 font-mono text-[11px] font-medium">
                  {removeQueue.length} item{removeQueue.length === 1 ? "" : "s"}
                </span>
              </div>
              {removeQueue.length === 0 ? (
                <div className="rounded-md border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                  No shipments queued. Scan an AWB above.
                </div>
              ) : (
                <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                  {removeQueue.map((q) => (
                    <RemovalRow
                      key={q.awb}
                      item={q}
                      onReason={(r) => setQueueReason(q.awb, r)}
                      onDrop={() => dropFromQueue(q.awb)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Audit notice */}
            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3 text-[11px] text-muted-foreground">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Removing these shipments will return them to the pick area for
                re-assignment. This action is tracked in the warehouse audit
                log.
              </span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setRemoveOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={
                removeQueue.length === 0 ||
                removeQueue.some((q) => !q.reason)
              }
              onClick={confirmRemoval}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              Confirm Removal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Subcomponents
// ───────────────────────────────────────────────────────────

function PassCard({
  label,
  id,
  combo,
}: {
  label: string;
  id: string;
  combo: ManifestCombo;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] uppercase text-muted-foreground">{label}</div>
          <div className="font-mono text-sm font-semibold">{id}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={cn(
              "rounded-md border px-2 py-0.5 text-[10px] font-bold",
              channelStyles[combo.channel],
            )}
          >
            {combo.channel}
          </span>
          <span
            className={cn(
              "rounded-md border px-2 py-0.5 text-[10px] font-bold",
              courierStyles[combo.courier],
            )}
          >
            {combo.courier}
          </span>
        </div>
      </div>
      <div className="mt-2 text-xs">
        <span className="text-muted-foreground">Seller · </span>
        <span className="font-medium">{combo.seller}</span>
      </div>
    </Card>
  );
}

function ScanFlash({ scan }: { scan: LastScan }) {
  const isAccepted = scan.kind === "accepted";
  return (
    <Card
      className={cn(
        "flex items-center gap-3 border-2 p-3",
        isAccepted
          ? "border-status-picked/40 bg-status-picked/5"
          : "border-destructive/40 bg-destructive/5",
      )}
    >
      {isAccepted ? (
        <CheckCircle2 className="h-5 w-5 text-status-picked" />
      ) : (
        <XCircle className="h-5 w-5 text-destructive" />
      )}
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-[11px] font-medium font-mono uppercase tracking-[0.06em]",
            isAccepted ? "text-status-picked" : "text-destructive",
          )}
        >
          {isAccepted ? "Added to shiplist" : "Pre-screened · do NOT add"}
        </div>
        <div className="font-mono text-sm font-semibold">{scan.awb}</div>
        {scan.reason && (
          <div className="text-[11px] text-muted-foreground">{scan.reason}</div>
        )}
      </div>
    </Card>
  );
}

function CountTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "picked" | "warn" | "muted";
}) {
  const colors =
    accent === "picked"
      ? "bg-status-picked/10 text-status-picked"
      : accent === "warn"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground";
  return (
    <Card className="flex items-center justify-between gap-2 p-3">
      <div>
        <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
        <div className="font-mono text-lg font-bold leading-tight">{value}</div>
      </div>
      <div className={cn("rounded-md px-2 py-1 text-[10px] font-bold", colors)}>
        {value > 0 ? "•" : "—"}
      </div>
    </Card>
  );
}

function RemovalRow({
  item,
  onReason,
  onDrop,
}: {
  item: RemoveQueueItem;
  onReason: (r: string) => void;
  onDrop: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border-l-4 border-destructive border-y border-r border-border bg-background p-2.5">
      <div className="min-w-0 flex-1">
        <div className="font-mono text-xs font-semibold">{item.awb}</div>
        <div className="text-[10px] text-muted-foreground">In current shiplist</div>
      </div>
      <Select value={item.reason} onValueChange={onReason}>
        <SelectTrigger className="h-8 w-[150px] text-xs">
          <SelectValue placeholder="Select reason…" />
        </SelectTrigger>
        <SelectContent>
          {removalReasons.map((r) => (
            <SelectItem key={r} value={r} className="text-xs">
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onDrop}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ── POH (Proof of Handover) inline screen ──

function PohScreen({
  shiplistId,
  gatePass,
  manifests,
  totalShipments,
  exceptionsHandled,
  signatureUrl,
  setSignatureUrl,
  fePhotoUrl,
  setFePhotoUrl,
  canClose,
  onCancel,
  onConfirm,
}: {
  shiplistId: string;
  gatePass: GatePass;
  manifests: Manifest[];
  totalShipments: number;
  exceptionsHandled: number;
  signatureUrl: string;
  setSignatureUrl: (s: string) => void;
  fePhotoUrl: string;
  setFePhotoUrl: (s: string) => void;
  canClose: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {

  return (
    <>
      {/* Header */}
      <Card className="space-y-1 p-4">
        <div className="text-base font-bold">Proof of Handover (POH)</div>
        <div className="text-xs text-muted-foreground">
          Finalize dispatch &amp; close Gate Pass for Shiplist{" "}
          <span className="font-mono font-semibold text-foreground">
            {shiplistId}
          </span>
        </div>
      </Card>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Card className="space-y-1 p-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase text-muted-foreground">
              Total Shipments
            </div>
            <Truck className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-black">
              {totalShipments}
            </span>
            <span className="text-[11px] text-muted-foreground">units</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-status-picked">
            <CheckCircle2 className="h-3 w-3" />
            100% Manifested
          </div>
        </Card>

        <Card className="space-y-1 p-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase text-muted-foreground">
              Exceptions Handled
            </div>
            <TriangleAlert className="h-3.5 w-3.5 text-destructive" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-black">
              {String(exceptionsHandled).padStart(2, "0")}
            </span>
            <span className="text-[11px] text-muted-foreground">resolved</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            Pre-screened &amp; removed
          </div>
        </Card>

        <Card className="space-y-1 p-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase text-muted-foreground">
              Courier Partner
            </div>
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="text-sm font-bold leading-tight">
            {gatePass.combo.courier}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground">
            {gatePass.id}
          </div>
        </Card>
      </div>

      {/* Signature + Photo */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="space-y-2 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <PenLine className="h-3.5 w-3.5" />
              Courier FE Signature
            </div>
          </div>
          <SignaturePad value={signatureUrl} onChange={setSignatureUrl} />
          <p className="text-[10px] italic text-muted-foreground">
            By signing, the Field Executive acknowledges the physical receipt of
            the manifests above.
          </p>
        </Card>

        <Card className="space-y-2 p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <Camera className="h-3.5 w-3.5" />
            Capture FE Photo
          </div>
          <PhotoCapture value={fePhotoUrl} onCapture={setFePhotoUrl} />
        </Card>
      </div>

      {/* Action bar */}
      <div className="flex gap-2">
        <Button variant="outline" className="h-11 flex-1" onClick={onCancel}>
          Back
        </Button>
        <Button
          className="h-11 flex-[2]"
          disabled={!canClose}
          onClick={onConfirm}
        >
          <ShieldCheck className="mr-2 h-4 w-4" />
          Close Shiplist &amp; Gate Pass
        </Button>
      </div>
    </>
  );
}

// ── Completion screen ──

function CompletionCard({
  shiplistId,
  closedAt,
  gatePass,
  manifests,
  totalShipments,
  exceptionsHandled,
  signatureUrl,
  fePhotoUrl,
  onReset,
}: {
  shiplistId: string;
  closedAt: Date;
  gatePass: GatePass;
  manifests: Manifest[];
  totalShipments: number;
  exceptionsHandled: number;
  signatureUrl: string;
  fePhotoUrl: string;
  onReset: () => void;
}) {
  const bars = useMemo(() => barcodePattern(shiplistId), [shiplistId]);
  return (
    <>
      <Card className="space-y-4 p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-status-picked/15">
            <CheckCircle2 className="h-7 w-7 text-status-picked" />
          </div>
          <div>
            <div className="text-base font-semibold">Shiplist Closed</div>
            <div className="text-xs text-muted-foreground">
              Proof of Handover archived · Gate Pass marked Closed
            </div>
          </div>
        </div>

        {/* Shiplist ID + barcode */}
        <div className="rounded-md border-2 border-dashed border-border p-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
            Shiplist ID
          </div>
          <div className="font-mono text-sm font-bold">{shiplistId}</div>
          <div className="mt-2 flex items-end gap-px">
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
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <SummaryField label="Gate Pass" value={gatePass.id} mono />
          <SummaryField
            label={manifests.length === 1 ? "Manifest" : `Manifests (${manifests.length})`}
            value={
              manifests.length === 1
                ? manifests[0].id
                : `${manifests[0].id} +${manifests.length - 1} more`
            }
            mono
          />
          <SummaryField label="Seller" value={gatePass.combo.seller} />
          <SummaryField label="Courier" value={gatePass.combo.courier} />
          <SummaryField label="Shipments" value={String(totalShipments)} />
          <SummaryField label="Exceptions" value={String(exceptionsHandled)} />
          <SummaryField
            label="Closed"
            value={closedAt.toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          />
          <SummaryField label="Gate Pass status" value="CLOSED" highlight />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1 text-[10px] uppercase text-muted-foreground">
              FE signature
            </div>
            <div className="rounded-md border border-border bg-background p-2">
              {signatureUrl ? (
                <img
                  src={signatureUrl}
                  alt="Signature"
                  className="h-16 w-full object-contain"
                />
              ) : (
                <div className="h-16 text-xs text-muted-foreground">—</div>
              )}
            </div>
          </div>
          <div>
            <div className="mb-1 text-[10px] uppercase text-muted-foreground">
              FE photo
            </div>
            <div className="overflow-hidden rounded-md border border-border bg-background">
              {fePhotoUrl ? (
                <img
                  src={fePhotoUrl}
                  alt="FE"
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="aspect-square w-full" />
              )}
            </div>
          </div>
        </div>
      </Card>

      <Button className="h-11 w-full" onClick={onReset}>
        Start new handover
      </Button>
    </>
  );
}

function SummaryField({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div
        className={cn(
          "font-medium",
          mono && "font-mono",
          highlight && "text-status-picked",
        )}
      >
        {value}
      </div>
    </div>
  );
}

// ── Signature pad ──

function SignaturePad({
  value,
  onChange,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);

  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (c.width / r.width),
      y: (e.clientY - r.top) * (c.height / r.height),
    };
  };

  const start = (e: React.PointerEvent) => {
    drawing.current = true;
    last.current = pos(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current || !last.current) return;
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    const p = pos(e);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (!hasInk) setHasInk(true);
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    if (canvasRef.current && hasInk) {
      onChange(canvasRef.current.toDataURL());
    }
  };

  const clear = () => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
    onChange("");
  };

  return (
    <div className="space-y-1.5">
      <div className="relative rounded-md border-2 border-dashed border-border bg-white">
        <canvas
          ref={canvasRef}
          width={480}
          height={140}
          className="block h-[140px] w-full touch-none"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
        />
        {!hasInk && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
            <PenLine className="h-5 w-5 text-muted-foreground/50" />
            <span className="text-[11px] text-muted-foreground">
              Sign within this boundary
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {value ? "✓ Captured" : "Awaiting signature"}
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          Clear Canvas
        </Button>
      </div>
    </div>
  );
}

// ── Photo capture (demo placeholder) ──

function PhotoCapture({
  value,
  onCapture,
}: {
  value: string;
  onCapture: (url: string) => void;
}) {
  const capture = () => {
    const seed = `fe-${Math.random().toString(36).slice(2, 8)}`;
    onCapture(`https://picsum.photos/seed/${seed}/240/240`);
  };
  return (
    <div className="space-y-1.5">
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border border-border bg-muted/30">
        {value ? (
          <img src={value} alt="FE" className="h-full w-full object-cover" />
        ) : (
          <div className="px-4 text-center text-xs text-muted-foreground">
            Photo not captured
          </div>
        )}
        <Button
          type="button"
          size="sm"
          className="absolute"
          onClick={capture}
        >
          <Camera className="mr-1.5 h-3.5 w-3.5" />
          {value ? "Recapture" : "Capture Proof"}
        </Button>
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="flex items-center gap-1 text-destructive">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
          {value ? "CAPTURED" : "REC PREVIEW"}
        </span>
        <span className="text-muted-foreground">Cam 02 · Dock Entrance</span>
      </div>
    </div>
  );
}

// ── Shared ──

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
