import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  HelpCircle,
  Layers,
  Mail,
  Plus,
  Printer,
  Save,
  ScanBarcode,
  ThumbsDown,
  ThumbsUp,
  Video,
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
import {
  genUsnId,
  getReturnRanProfile,
  inboundBarcodePattern,
  qcRejectReasons,
  type ExpectedReturnItem,
  type ReturnAwbProfile,
} from "@/lib/wms/inbound-data";

export const Route = createFileRoute("/_wms/sales-return-grn")({
  head: () => ({
    meta: [{ title: "Sales Return GRN — Inbound" }],
  }),
  component: SalesReturnGrn,
});

type Step =
  | "scan-qc-station"
  | "scan-ran"
  | "scan-good-lpn"
  | "scan-bad-lpn"
  | "scan-awb"
  | "scan-items"
  | "unidentified"
  | "done";

// Suggested remarks for unidentified return parcels (operator can pick one).
const UNIDENTIFIED_REMARKS = [
  "No AWB / label match found",
  "Shipping label damaged or unreadable",
  "Empty parcel received",
  "Wrong item returned",
  "Parcel belongs to a different seller",
  "Missing return authorisation (RAN)",
  "Packaging tampered / opened in transit",
  "Counterfeit or non-original product",
  "Partial / incomplete return",
  "Customer details not traceable",
];

type QcMode = "good" | "bad";

interface PendingItem {
  sku: string;
  name: string;
  expected?: ExpectedReturnItem;
}

interface QcItemRow {
  sku: string;
  name: string;
  lpn: string;
  mode: QcMode;
  reason?: string;
}

const orderNumberFromAwb = (awb: string): string => {
  let h = 0;
  for (let i = 0; i < awb.length; i++) h = (h * 31 + awb.charCodeAt(i)) | 0;
  const n = (Math.abs(h) % 9_000_000) + 1_000_000;
  return `ORD-${n}`;
};

function SalesReturnGrn() {
  const [step, setStep] = useState<Step>("scan-qc-station");
  const [qcStation, setQcStation] = useState<string | null>(null);
  const [ran, setRan] = useState<string | null>(null);
  const [recordingStart, setRecordingStart] = useState<Date | null>(null);
  const [awb, setAwb] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [profile, setProfile] = useState<ReturnAwbProfile | null>(null);
  const [goodLpn, setGoodLpn] = useState<string | null>(null);
  const [badLpn, setBadLpn] = useState<string | null>(null);
  const [qcItems, setQcItems] = useState<QcItemRow[]>([]);
  const [pendingItem, setPendingItem] = useState<PendingItem | null>(null);
  const [qcMode, setQcMode] = useState<QcMode>("good");
  const [scanError, setScanError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [usn, setUsn] = useState("");
  const [scanKey, setScanKey] = useState(0);
  const [unidReason, setUnidReason] = useState("");
  const [unidNote, setUnidNote] = useState("");

  const totals = useMemo(() => {
    let good = 0;
    let bad = 0;
    for (const it of qcItems) {
      if (it.mode === "good") good += 1;
      else bad += 1;
    }
    return { good, bad };
  }, [qcItems]);

  // Count of each SKU already scanned — committed items + the pending item
  const scannedBySku = useMemo(() => {
    const map: Record<string, number> = {};
    for (const it of qcItems) map[it.sku] = (map[it.sku] ?? 0) + 1;
    if (pendingItem) {
      map[pendingItem.sku] = (map[pendingItem.sku] ?? 0) + 1;
    }
    return map;
  }, [qcItems, pendingItem]);

  const isIdentified = profile?.type === "identified";
  const expectedItems = profile?.expectedItems ?? [];

  // Active expected item — the first one with remaining qty (picking-style focus)
  const activeExpected = useMemo(() => {
    if (!isIdentified) return null;
    return (
      expectedItems.find((it) => (scannedBySku[it.sku] ?? 0) < it.qty) ?? null
    );
  }, [isIdentified, expectedItems, scannedBySku]);

  const allExpectedDone =
    isIdentified &&
    expectedItems.length > 0 &&
    expectedItems.every((it) => (scannedBySku[it.sku] ?? 0) >= it.qty);

  // Aggregated QC table — one row per unique (SKU + LPN + QC mode + reason)
  const qcTableRows = useMemo(() => {
    const map = new Map<
      string,
      {
        sku: string;
        name: string;
        bin: string;
        mode: QcMode;
        reason?: string;
        qty: number;
      }
    >();
    for (const it of qcItems) {
      const key = `${it.lpn}|${it.sku}|${it.mode}|${it.reason ?? ""}`;
      const existing = map.get(key);
      if (existing) {
        existing.qty += 1;
      } else {
        map.set(key, {
          sku: it.sku,
          name: it.name,
          bin: it.lpn,
          mode: it.mode,
          reason: it.reason,
          qty: 1,
        });
      }
    }
    return Array.from(map.values());
  }, [qcItems]);

  const onQcStationScan = (val: string) => {
    const v = val.trim().toUpperCase();
    if (!v) return;
    setQcStation(v);
    setStep("scan-ran");
    setScanKey((k) => k + 1);
  };

  const onRanScan = (val: string) => {
    const v = val.trim().toUpperCase();
    if (!v) return;
    setRan(v);
    const prof = getReturnRanProfile(v);
    setProfile(prof);
    setRecordingStart(new Date());
    // Unidentified returns are not QC'd — skip the Good/Bad bin setup and go
    // straight to the AWB scan.
    if (prof?.type === "unidentified") {
      setStep("scan-awb");
    } else {
      // Identified — scan the two session bins (Good + Bad) once
      setStep("scan-good-lpn");
    }
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
    setStep("scan-awb");
    setScanKey((k) => k + 1);
  };

  const onAwbScan = (val: string) => {
    const v = val.trim().toUpperCase();
    if (!v) return;
    setAwb(v);
    setOrderNumber(orderNumberFromAwb(v));
    // Unidentified parcel — no QC, just capture the AWB & notify the seller.
    if (profile?.type === "unidentified") {
      setStep("unidentified");
    } else {
      setStep("scan-items");
    }
    setScanKey((k) => k + 1);
  };

  const saveUnidentified = () => {
    setStep("done");
  };

  // Commits the current pending item to the Good LPN bin
  const commitPendingToGood = () => {
    if (!pendingItem || !goodLpn) return;
    setQcItems((prev) => [
      ...prev,
      {
        sku: pendingItem.sku,
        name: pendingItem.name,
        lpn: goodLpn,
        mode: "good",
      },
    ]);
    setPendingItem(null);
  };

  const onItemScan = (val: string) => {
    const v = val.trim().toUpperCase();
    if (!v) return;
    // Identified flow — enforce SKU match against the active expected item
    if (isIdentified) {
      if (!activeExpected) {
        setScanError("All expected items already QC'd. Finish to print USN.");
        setScanKey((k) => k + 1);
        return;
      }
      const expectedSku = activeExpected.sku;
      if (v !== expectedSku) {
        const expectedKnown = expectedItems.find((it) => it.sku === v);
        if (expectedKnown) {
          setScanError(
            `Finish ${expectedSku} first — ${expectedKnown.sku} comes next.`,
          );
        } else {
          setScanError(`${v} is not part of this return.`);
        }
        setScanKey((k) => k + 1);
        return;
      }
      // scannedBySku already counts the pending item, so if it's already at
      // qty there's no room for another scan of this SKU.
      const already = scannedBySku[v] ?? 0;
      if (already >= activeExpected.qty) {
        setScanError(`${v} already fully scanned for this return.`);
        setScanKey((k) => k + 1);
        return;
      }
    }
    setScanError(null);

    // Commit the previous pending → Good LPN (default flow)
    if (pendingItem) commitPendingToGood();

    // Set the new pending item from the just-scanned SKU
    const expected = expectedItems.find((it) => it.sku === v);
    setPendingItem({
      sku: v,
      name: expected?.name ?? v,
      expected,
    });
    // Mode resets to Good for the new pending item
    setQcMode("good");
    setScanKey((k) => k + 1);
  };

  // "Bad QC" action — opens reason dialog for the current pending item
  const openBadQc = () => {
    if (!pendingItem) {
      setScanError("Scan an item first, then mark it Bad QC.");
      setScanKey((k) => k + 1);
      return;
    }
    setQcMode("bad");
    setRejectReason("");
    setRejectOpen(true);
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
      },
    ]);
    setPendingItem(null);
    setQcMode("good");
    setRejectReason("");
    setRejectOpen(false);
    setScanKey((k) => k + 1);
  };

  const cancelReject = () => {
    setQcMode("good");
    setRejectReason("");
    setRejectOpen(false);
    setScanKey((k) => k + 1);
  };

  const finishQc = () => {
    // Commit any pending item to Good before finishing
    if (pendingItem) commitPendingToGood();
    setUsn(genUsnId());
    setStep("done");
  };

  const reset = () => {
    // Keep QC station, RAN, recording, profile AND the Good/Bad LPN bins
    // active — same session, next AWB
    setStep("scan-awb");
    setAwb(null);
    setOrderNumber(null);
    setQcItems([]);
    setPendingItem(null);
    setQcMode("good");
    setRejectReason("");
    setUsn("");
    setUnidReason("");
    setUnidNote("");
    setScanError(null);
    setScanKey((k) => k + 1);
  };

  const isUnidentified = profile?.type === "unidentified";

  return (
    <div className="pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-background px-6 py-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          Sales Return GRN · Return QC
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {qcStation && (
            <div className="text-right">
              QC Station{" "}
              <span className="font-mono font-semibold text-foreground">
                {qcStation}
              </span>
            </div>
          )}
          {ran && (
            <div className="text-right">
              RAN{" "}
              <span className="font-mono font-semibold text-foreground">
                {ran}
              </span>
            </div>
          )}
          {recordingStart && (
            <div className="flex items-center gap-1.5 rounded-[3px] border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-destructive">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
              </span>
              <span className="text-[10px] font-bold font-mono uppercase tracking-[0.08em]">
                Rec
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-6 p-6">
        {/* Main column */}
        <div className="flex-1 space-y-2 max-w-[640px]">
          {/* Compact profile chip — known from the RAN scan onwards */}
          {profile &&
            step !== "scan-qc-station" &&
            step !== "scan-ran" &&
            step !== "done" && (
            <div
              className={cn(
                "flex items-center justify-between gap-2 rounded-md border px-2.5 py-1 text-[11px]",
                isUnidentified
                  ? "border-warn/30 bg-warn-bg text-warn"
                  : "border-status-picked/30 bg-status-picked/5 text-status-picked",
              )}
            >
              <div className="flex items-center gap-1.5 font-medium">
                {isUnidentified ? (
                  <HelpCircle className="h-3 w-3" />
                ) : (
                  <CheckCircle2 className="h-3 w-3" />
                )}
                {isUnidentified ? "Unidentified" : "Identified"}
              </div>
              {!isUnidentified && (profile.channel || profile.seller) && (
                <div className="truncate text-[10px] text-muted-foreground">
                  {[profile.channel, profile.seller]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              )}
            </div>
          )}

          {/* Step 0 — QC Station */}
          {step === "scan-qc-station" && (
            <Card className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                <ScanBarcode className="h-3.5 w-3.5" />
                Scan QC Station
              </div>
              <p className="text-xs text-muted-foreground">
                Scan once to bind this session to a QC station. The station
                stays active for the entire shift.
              </p>
              <ScanRow
                key={`qcs-${scanKey}`}
                placeholder="e.g. QCS-01"
                onScan={onQcStationScan}
                autoFocus
              />
            </Card>
          )}

          {/* Step 0.5 — Return Acknowledgement Number */}
          {step === "scan-ran" && (
            <Card className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                <ScanBarcode className="h-3.5 w-3.5" />
                Scan Return Ack barcode
              </div>
              <p className="text-xs text-muted-foreground">
                Scan the RAN sticker on the return bag / box. Video recording
                will begin as soon as this is scanned.
              </p>
              <ScanRow
                key={`ran-${scanKey}`}
                placeholder="e.g. RAN-XXXXXXXX"
                onScan={onRanScan}
                autoFocus
              />
            </Card>
          )}

          {/* Step 1 — AWB */}
          {step === "scan-awb" && (
            <Card className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                <ScanBarcode className="h-3.5 w-3.5" />
                Scan return AWB
              </div>
              <ScanRow
                key={`awb-${scanKey}`}
                placeholder="Scan AWB barcode…"
                onScan={onAwbScan}
                autoFocus
              />
            </Card>
          )}

          {/* Unidentified parcel — no QC, capture AWB + remarks, notify seller */}
          {step === "unidentified" && awb && (
            <>
              <Card className="space-y-2 border-warn/30 bg-warn-bg p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-warn">
                  <HelpCircle className="h-4 w-4" />
                  Unidentified parcel — do not QC
                </div>
                <p className="text-xs text-warn/90">
                  This parcel could not be matched to a return. QC is not required.
                  Save the AWB number and notify the seller for further
                  instructions. No items are scanned and no USN is printed.
                </p>
              </Card>

              {/* AWB captured */}
              <Card className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                    AWB to be saved
                  </div>
                  <div className="font-mono text-base font-bold">{awb}</div>
                </div>
                <span className="rounded-[3px] border border-warn/30 bg-warn-bg px-2 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em] text-warn">
                  Unidentified
                </span>
              </Card>

              {/* Remarks */}
              <Card className="space-y-3 p-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                    Remarks
                  </label>
                  <Select value={unidReason} onValueChange={setUnidReason}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select a reason…" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIDENTIFIED_REMARKS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                    Additional note (optional)
                  </label>
                  <Input
                    value={unidNote}
                    onChange={(e) => setUnidNote(e.target.value)}
                    placeholder="Add any extra detail for the seller…"
                    className="h-11 text-sm"
                  />
                </div>
              </Card>

              <Button
                className="h-11 w-full"
                disabled={!unidReason}
                onClick={saveUnidentified}
              >
                <Save className="mr-2 h-4 w-4" />
                Save AWB &amp; notify seller
              </Button>
            </>
          )}

          {/* Expected items — prominent list shown from AWB scan onwards */}
          {profile?.type === "identified" &&
            profile.expectedItems &&
            profile.expectedItems.length > 0 &&
            step !== "scan-qc-station" &&
            step !== "scan-ran" &&
            step !== "done" && (
              <Card className="p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[11px] font-semibold font-mono uppercase tracking-[0.06em] text-muted-foreground">
                    Expected items
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Total{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {profile.expectedItems.reduce((s, it) => s + it.qty, 0)}
                    </span>{" "}
                    units
                  </div>
                </div>
                <div className="space-y-1.5">
                  {profile.expectedItems.map((it) => {
                    const count = scannedBySku[it.sku] ?? 0;
                    const done = count >= it.qty;
                    const isCurrent =
                      !done &&
                      activeExpected?.sku === it.sku &&
                      step === "scan-items";
                    return (
                      <div
                        key={it.sku}
                        className={cn(
                          "space-y-1 rounded-md border px-2.5 py-1.5",
                          done
                            ? "border-status-picked/30 bg-status-picked/5"
                            : isCurrent
                              ? "border-primary/40 bg-primary/5"
                              : "border-border bg-background",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold leading-tight">
                              {it.name}
                            </div>
                            <div className="font-mono text-[10px] text-muted-foreground">
                              {it.sku}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "font-mono text-sm font-bold tabular-nums leading-none",
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
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0 text-[10px] text-muted-foreground">
                          {it.mrp && (
                            <span>
                              <span className="text-muted-foreground/70">
                                MRP:
                              </span>{" "}
                              <span className="font-medium text-foreground">
                                {it.mrp}
                              </span>
                            </span>
                          )}
                          {it.color && (
                            <span>
                              <span className="text-muted-foreground/70">
                                Colour:
                              </span>{" "}
                              <span className="font-medium text-foreground">
                                {it.color}
                              </span>
                            </span>
                          )}
                          {it.size && (
                            <span>
                              <span className="text-muted-foreground/70">
                                Size:
                              </span>{" "}
                              <span className="font-medium text-foreground">
                                {it.size}
                              </span>
                            </span>
                          )}
                          {it.weight && (
                            <span>
                              <span className="text-muted-foreground/70">
                                Wt:
                              </span>{" "}
                              <span className="font-medium text-foreground">
                                {it.weight}
                              </span>
                            </span>
                          )}
                          {it.lot && (
                            <span>
                              <span className="text-muted-foreground/70">
                                Lot:
                              </span>{" "}
                              <span className="font-mono font-medium text-foreground">
                                {it.lot}
                              </span>
                            </span>
                          )}
                          {it.expiry && (
                            <span>
                              <span className="text-muted-foreground/70">
                                Exp:
                              </span>{" "}
                              <span className="font-medium text-foreground">
                                {it.expiry}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

          {/* Step 2a — Scan the GOOD LPN (session bin) */}
          {step === "scan-good-lpn" && (
            <Card className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-status-picked">
                <ThumbsUp className="h-3.5 w-3.5" />
                Scan GOOD QC bin LPN
              </div>
              <p className="text-[11px] text-muted-foreground">
                This LPN will collect all items that pass QC during this
                session.
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

          {/* Step 2b — Scan the BAD LPN (session bin) */}
          {step === "scan-bad-lpn" && (
            <Card className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-destructive">
                <ThumbsDown className="h-3.5 w-3.5" />
                Scan BAD QC bin LPN
              </div>
              <p className="text-[11px] text-muted-foreground">
                This LPN will collect any items rejected during QC. It must be
                different from the Good QC LPN.
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

          {/* Step 4 — Item scanning */}
          {step === "scan-items" && awb && goodLpn && badLpn && (
            <>
              {/* Order info — shown after AWB scan */}
              <Card className="flex items-center justify-between gap-3 p-2.5">
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                    Order
                  </div>
                  <div className="font-mono text-sm font-bold">
                    {orderNumber ?? "—"}
                  </div>
                </div>
                <div className="min-w-0 text-right">
                  <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                    Channel
                  </div>
                  <div className="text-sm font-semibold">
                    {profile?.channel ?? "Unknown"}
                  </div>
                </div>
                <div className="min-w-0 text-right">
                  <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                    AWB
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {awb}
                  </div>
                </div>
              </Card>

              {/* Bin strip — Good + Bad LPNs */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex items-center gap-1.5 rounded-md border border-status-picked/30 bg-status-picked/5 px-2 py-1 text-[10px]">
                  <ThumbsUp className="h-3 w-3 text-status-picked" />
                  <span className="text-muted-foreground font-mono uppercase tracking-[0.06em]">
                    Good
                  </span>
                  <span className="ml-auto truncate font-mono font-semibold">
                    {goodLpn}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1 text-[10px]">
                  <ThumbsDown className="h-3 w-3 text-destructive" />
                  <span className="text-muted-foreground font-mono uppercase tracking-[0.06em]">
                    Bad
                  </span>
                  <span className="ml-auto truncate font-mono font-semibold">
                    {badLpn}
                  </span>
                </div>
              </div>

              {/* Focused item card — pendingItem driven */}
              {!(isIdentified && allExpectedDone) && (
                <Card className="space-y-2 p-3">
                  <div className="flex gap-2.5">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md border border-border bg-muted/20">
                      {pendingItem?.expected ? (
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
                          {pendingItem.expected && (
                            <div className="grid grid-cols-2 gap-x-1.5 gap-y-0 text-[10px]">
                              {pendingItem.expected.mrp && (
                                <QcRow
                                  label="MRP"
                                  value={pendingItem.expected.mrp}
                                />
                              )}
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
                          )}
                        </>
                      ) : (
                        <div className="flex h-full items-center text-[11px] text-muted-foreground">
                          QC details will appear here after scanning.
                        </div>
                      )}
                    </div>
                    {pendingItem?.expected && (
                      <div className="flex shrink-0 flex-col items-end justify-center rounded-md bg-muted/40 px-2 py-1">
                        <span className="text-[9px] uppercase text-muted-foreground">
                          QC'd
                        </span>
                        <span className="font-mono text-sm font-bold tabular-nums leading-none">
                          {scannedBySku[pendingItem.sku] ?? 0}/
                          {pendingItem.expected.qty}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Good / Bad QC selection */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-8 text-[11px]",
                        qcMode === "good"
                          ? "border-status-picked bg-status-picked/10 text-status-picked"
                          : "border-border text-muted-foreground",
                      )}
                      onClick={() => setQcMode("good")}
                    >
                      <ThumbsUp className="mr-1 h-3 w-3" />
                      Good QC {qcMode === "good" && "•"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-destructive/40 text-[11px] text-destructive hover:bg-destructive/5 hover:text-destructive"
                      onClick={openBadQc}
                      disabled={!pendingItem}
                    >
                      <ThumbsDown className="mr-1 h-3 w-3" />
                      Bad QC
                    </Button>
                  </div>

                  {scanError && <ErrorBanner message={scanError} />}
                  <ScanRow
                    key={`item-${scanKey}`}
                    placeholder={
                      isIdentified && activeExpected
                        ? `Scan ${activeExpected.sku}…`
                        : "Scan item SKU…"
                    }
                    onScan={onItemScan}
                    autoFocus
                  />
                </Card>
              )}

              {/* Identified — finished hint */}
              {isIdentified && allExpectedDone && !pendingItem && (
                <Card className="flex items-center gap-2 border-status-picked/30 bg-status-picked/5 p-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-status-picked" />
                  <div className="text-xs font-medium text-status-picked">
                    All expected items QC'd — finish to print USN.
                  </div>
                </Card>
              )}

              {/* QC'd items table */}
              {qcTableRows.length > 0 && (
                <Card className="overflow-hidden p-0">
                  <div className="border-b border-border bg-muted/30 px-3 py-2 text-[11px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                    QC'd items ({qcTableRows.length})
                  </div>
                  <div className="[&_th]:px-2 [&_th]:py-1.5 [&_td]:px-2 [&_td]:py-1.5 [&_th]:h-auto [&_th]:text-[10px] [&_td]:text-xs">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/20">
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead>Bin</TableHead>
                          <TableHead>QC</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {qcTableRows.map((r, idx) => (
                          <TableRow key={`${r.bin}-${r.sku}-${idx}`}>
                            <TableCell>
                              <div className="font-medium leading-tight">
                                {r.name}
                              </div>
                              <div className="font-mono text-[10px] text-muted-foreground">
                                {r.sku}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums">
                              {r.qty}
                            </TableCell>
                            <TableCell className="font-mono text-[10px]">
                              {r.bin}
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "rounded-[3px] border px-1.5 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em]",
                                  r.mode === "good"
                                    ? "border-ok/30 bg-ok-bg text-ok"
                                    : "border-risk/30 bg-risk-bg text-risk",
                                )}
                              >
                                {r.mode === "good" ? "Good" : "Bad"}
                              </span>
                            </TableCell>
                            <TableCell className="text-[10px] text-muted-foreground">
                              {r.reason ?? "—"}
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
                disabled={qcItems.length === 0 && !pendingItem}
                onClick={finishQc}
              >
                <Printer className="mr-2 h-4 w-4" />
                Finish QC &amp; print USN
              </Button>
            </>
          )}

          {/* Step 5 — Done (identified: USN; unidentified: seller notified) */}
          {step === "done" && awb && isUnidentified && (
            <>
              <Card className="space-y-2 p-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warn-bg text-warn">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-base font-semibold">
                    AWB saved · Seller notified
                  </div>
                  <div className="text-xs text-muted-foreground">
                    No QC performed for this unidentified parcel.
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <dl className="space-y-1 text-xs">
                  <Row label="AWB" value={awb} mono />
                  <Row label="Type" value="Unidentified" />
                  <Row label="Remarks" value={unidReason || "—"} />
                  {unidNote && <Row label="Note" value={unidNote} />}
                </dl>
              </Card>

              <Button className="h-11 w-full" onClick={reset}>
                Start next AWB
              </Button>
            </>
          )}

          {step === "done" && awb && !isUnidentified && (
            <>
              <Card className="space-y-2 p-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-picked/15 text-status-picked">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-base font-semibold">QC complete</div>
                  <div className="text-xs text-muted-foreground">
                    USN generated for packing material.
                  </div>
                </div>
              </Card>

              <UsnSticker
                usn={usn}
                awb={awb}
                goodLpn={goodLpn ?? "—"}
                badLpn={badLpn ?? "—"}
                good={totals.good}
                bad={totals.bad}
                unidentified={isUnidentified}
              />

              <Button className="h-11 w-full" onClick={reset}>
                Start next AWB
              </Button>
            </>
          )}
        </div>

        {/* Camera column — visible while a session is recording */}
        {recordingStart && (
          <div className="w-[220px] shrink-0">
            <CameraPanel
              startedAt={recordingStart}
              stationId={qcStation}
            />
          </div>
        )}
      </div>

      {/* Reject reason dialog */}
      <Dialog
        open={rejectOpen}
        onOpenChange={(o) => {
          if (!o) cancelReject();
        }}
      >
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
              {pendingItem?.name && pendingItem.name !== pendingItem.sku && (
                <div className="text-[11px] text-muted-foreground">
                  {pendingItem.name}
                </div>
              )}
            </div>
            <label className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
              Reason
            </label>
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
              onClick={cancelReject}
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

function UsnSticker({
  usn,
  awb,
  goodLpn,
  badLpn,
  good,
  bad,
  unidentified,
}: {
  usn: string;
  awb: string;
  goodLpn: string;
  badLpn: string;
  good: number;
  bad: number;
  unidentified: boolean;
}) {
  const bars = useMemo(() => inboundBarcodePattern(usn), [usn]);
  return (
    <div className="rounded-md border-2 border-dashed border-border bg-background p-4">
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
          {usn}
        </div>
      </div>
      <div className="my-3 border-t border-dashed border-border" />
      <dl className="space-y-1 text-xs">
        <Row label="AWB" value={awb} mono />
        <Row label="Type" value={unidentified ? "Unidentified" : "Identified"} />
        <Row label="Good LPN" value={goodLpn} mono />
        <Row label="Bad LPN" value={badLpn} mono />
        <Row label="Good QC" value={String(good)} />
        <Row label="Bad QC" value={String(bad)} />
      </dl>
    </div>
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
      <dt className="w-16 shrink-0 text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
      <dd className={cn("flex-1 font-medium", mono && "font-mono")}>{value}</dd>
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
  // Force a re-render every second so the elapsed timer ticks
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
      <div className="overflow-hidden rounded-md border border-border bg-black">
        <div className="relative aspect-square bg-black">
          <img
            src="https://picsum.photos/seed/qc-bench-cam/400/400"
            alt="QC bench live feed"
            className="h-full w-full object-cover opacity-70 grayscale"
          />

          {/* REC indicator */}
          <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-risk opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-risk" />
            </span>
            <span className="font-bold font-mono uppercase tracking-[0.08em]">Rec</span>
            <span className="font-mono">
              {mm}:{ss}
            </span>
          </div>

          {/* Timestamp top-right */}
          <div className="absolute right-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-mono text-white backdrop-blur">
            {now}
          </div>

          {/* Crosshair */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border border-white/30" />
          </div>

          {/* Bottom label */}
          <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1.5 text-[9px] text-white">
            <span className="truncate rounded bg-black/70 px-1.5 py-0.5 backdrop-blur">
              Cam 03{stationId ? ` · ${stationId}` : ""}
            </span>
            <span className="shrink-0 rounded bg-black/70 px-1.5 py-0.5 font-mono backdrop-blur">
              1080p
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 border-t border-border bg-background px-2 py-1 text-[10px] text-muted-foreground">
          <Video className="h-2.5 w-2.5" />
          QC session · recording
        </div>
      </div>
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

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "bad";
}) {
  return (
    <Card className="flex items-center justify-between gap-2 p-3">
      <span className="text-[10px] uppercase text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-lg font-bold tabular-nums leading-none",
          tone === "ok" ? "text-status-picked" : "text-destructive",
        )}
      >
        {value}
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
