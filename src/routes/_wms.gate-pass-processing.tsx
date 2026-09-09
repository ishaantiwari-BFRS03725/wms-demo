import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Anchor,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  CheckCircle2,
  ClipboardCheck,
  Plus,
  Printer,
  RotateCcw,
  ScanBarcode,
  Ticket,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  consignmentForGatePass,
  gateBarcodePattern,
  genGatePassId,
  SELLER_DIRECTORY,
  stockCountForConsignment,
  type GatePassConsignment,
  type GatePassSeller,
  type SellerRecord,
} from "@/lib/wms/gate-entry-data";

export const Route = createFileRoute("/_wms/gate-pass-processing")({
  head: () => ({
    meta: [{ title: "Gate Pass Processing" }],
  }),
  component: GatePassProcessing,
});

type Step = "scan-entry" | "dock" | "activity-type" | "issue-passes" | "issued" | "released";

type ActivityType = "inward" | "outward" | "return";

interface IssuedPass {
  gatePass: string;
  seller: GatePassSeller;
}

interface PoAsnEntry {
  id: string;
  sellerId: string;
  poAsn: string;
  boxCount: number;
}

const dateLabel = (d: Date) =>
  d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function GatePassProcessing() {
  const [step, setStep] = useState<Step>("scan-entry");
  const [entryId, setEntryId] = useState<string | null>(null);
  const [scanKey, setScanKey] = useState(0);

  const [consignment, setConsignment] = useState<GatePassConsignment | null>(
    null,
  );
  const [dockId, setDockId] = useState("");
  const [activityType, setActivityType] = useState<ActivityType | null>(null);
  const [poAsn, setPoAsn] = useState("");
  const [boxCount, setBoxCount] = useState(0);
  const [poAsnEntries, setPoAsnEntries] = useState<PoAsnEntry[]>([]);
  const [issueSelected, setIssueSelected] = useState<Record<string, boolean>>(
    {},
  );
  const [issued, setIssued] = useState<IssuedPass[]>([]);
  const [printOpen, setPrintOpen] = useState(false);

  const issueDate = useMemo(() => new Date(), []);

  const activityUnloads = activityType === "inward" || activityType === "return";
  const activityCloses = activityType === "outward";
  const selectedEntries = poAsnEntries.filter((e) => issueSelected[e.id]);

  const sellerById = (id: string): SellerRecord =>
    SELLER_DIRECTORY.find((s) => s.id === id) ?? consignment!.seller;

  // PO / ASN references the operator can pick against — each one carries its
  // own seller/vendor, since a vehicle's PO/ASNs can span multiple sellers.
  const poAsnOptions = useMemo(
    () =>
      SELLER_DIRECTORY.map((s) => ({
        value: s.asn,
        label: `${s.asn} · ${s.name}`,
        sellerId: s.id,
      })),
    [],
  );

  const currentOption = poAsnOptions.find((o) => o.value === poAsn);
  const currentSeller = currentOption
    ? sellerById(currentOption.sellerId)
    : undefined;

  const stockCount =
    entryId && currentSeller
      ? stockCountForConsignment({
          gatePass: entryId,
          seller: currentSeller,
          asn: poAsn,
          boxCount,
        })
      : 0;

  const onEntryScan = (val: string) => {
    const id = val.trim().toUpperCase();
    if (!id) return;
    setEntryId(id);
    const c = consignmentForGatePass(id);
    setConsignment(c);
    setBoxCount(c.boxCount);
    setStep("dock");
    setScanKey((k) => k + 1);
  };

  const confirmDock = () => {
    if (!dockId.trim()) return;
    setStep("activity-type");
  };

  const addPoAsnEntry = () => {
    if (!currentOption || boxCount < 1) return;
    setPoAsnEntries((prev) => [
      ...prev,
      {
        id: `${currentOption.sellerId}-${poAsn}-${prev.length}-${Date.now()}`,
        sellerId: currentOption.sellerId,
        poAsn,
        boxCount,
      },
    ]);
    setPoAsn("");
    setBoxCount(consignment?.boxCount ?? 0);
  };

  const removePoAsnEntry = (id: string) => {
    setPoAsnEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const confirmActivity = () => {
    if (activityUnloads) {
      if (poAsnEntries.length === 0) return;
      // Pre-select every PO/ASN added on the previous screen; the operator can deselect.
      setIssueSelected(Object.fromEntries(poAsnEntries.map((e) => [e.id, true])));
      setStep("issue-passes");
    } else if (activityCloses) {
      setStep("released");
    }
  };

  const issuePasses = () => {
    if (selectedEntries.length === 0) return;
    const passes = selectedEntries.map((e) => ({
      gatePass: genGatePassId(activityType === "return"),
      seller: { seller: sellerById(e.sellerId), asn: e.poAsn, boxCount: e.boxCount },
    }));
    setIssued(passes);
    setStep("issued");
    setPrintOpen(true);
  };

  const reset = () => {
    setStep("scan-entry");
    setEntryId(null);
    setConsignment(null);
    setDockId("");
    setActivityType(null);
    setPoAsn("");
    setBoxCount(0);
    setPoAsnEntries([]);
    setIssueSelected({});
    setIssued([]);
    setPrintOpen(false);
    setScanKey((k) => k + 1);
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-muted/40 py-4">
      <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-md border border-border bg-background">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 border-b border-border bg-background px-4 py-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Ticket className="h-4 w-4 text-muted-foreground" />
            Gate Pass Processing
          </div>
          <div className="flex flex-col items-end gap-1">
            {entryId && (
              <div className="text-right text-xs text-muted-foreground">
                Entry{" "}
                <span className="font-mono font-semibold text-foreground">
                  {entryId}
                </span>
              </div>
            )}
            {dockId.trim() && step !== "dock" && <DockTag dockId={dockId} />}
          </div>
        </div>

        <div className="space-y-3 p-4">
          {/* Step — Scan gate entry */}
          {step === "scan-entry" && (
            <Card className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                <ScanBarcode className="h-3.5 w-3.5" />
                Scan Gate Entry
              </div>
              <p className="text-xs text-muted-foreground">
                Scan the vehicle's gate entry, marry it to a dock, and issue a
                gate pass per PO/ASN.
              </p>
              <ScanRow
                key={`entry-${scanKey}`}
                placeholder="e.g. GE-2024-008912"
                onScan={onEntryScan}
                autoFocus
              />
            </Card>
          )}

          {/* Step — Marry to dock */}
          {step === "dock" && consignment && (
            <>
              <Card className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
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
                Marry vehicle to dock
              </Button>
            </>
          )}

          {/* Step — Activity type */}
          {step === "activity-type" && consignment && (
            <>
              <Card className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                  Activity Type
                </div>
                <p className="text-xs text-muted-foreground">
                  Select what this vehicle is here for.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <ActivityOption
                    label="Inbound"
                    hint="Receiving — issues passes"
                    icon={<ArrowDownToLine className="h-4 w-4" />}
                    selected={activityType === "inward"}
                    onClick={() => setActivityType("inward")}
                  />
                  <ActivityOption
                    label="Return"
                    hint="Customer returns — issues passes"
                    icon={<RotateCcw className="h-4 w-4" />}
                    selected={activityType === "return"}
                    onClick={() => setActivityType("return")}
                  />
                  <ActivityOption
                    label="Outbound"
                    hint="Dispatch — no unloading"
                    icon={<ArrowUpFromLine className="h-4 w-4" />}
                    selected={activityType === "outward"}
                    onClick={() => {
                      setActivityType("outward");
                      setPoAsn("");
                    }}
                  />
                </div>

                {activityUnloads && consignment && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                        Scan ASN, STN, PO or other
                      </label>
                      <Select value={poAsn} onValueChange={setPoAsn}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select ASN / STN / PO / other…" />
                        </SelectTrigger>
                        <SelectContent>
                          {poAsnOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {poAsn && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                              Box Count
                            </label>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-11 w-11 shrink-0 text-lg"
                                onClick={() =>
                                  setBoxCount((n) => Math.max(1, n - 1))
                                }
                              >
                                –
                              </Button>
                              <Input
                                value={String(boxCount)}
                                onChange={(e) => {
                                  const n =
                                    Number(
                                      e.target.value.replace(/[^0-9]/g, ""),
                                    ) || 0;
                                  setBoxCount(Math.max(0, n));
                                }}
                                inputMode="numeric"
                                className="h-11 text-center font-mono text-lg font-bold"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-11 w-11 shrink-0 text-lg"
                                onClick={() => setBoxCount((n) => n + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                              Stock Count
                            </label>
                            <div className="flex h-11 items-center justify-between rounded-md border border-border bg-muted/30 px-3">
                              <span className="font-mono text-lg font-bold tabular-nums">
                                {stockCount}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                units · ASN
                              </span>
                            </div>
                          </div>
                        </div>

                        {currentSeller && (
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                              Vendor
                            </label>
                            <div className="flex h-11 items-center rounded-md border border-border bg-muted/30 px-3 text-sm font-medium">
                              {currentSeller.name}
                              <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                                {currentSeller.id}
                              </span>
                            </div>
                          </div>
                        )}

                        <Button
                          variant="outline"
                          className="h-11 w-full"
                          onClick={addPoAsnEntry}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add PO/ASN
                        </Button>
                      </>
                    )}

                    {poAsnEntries.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                          PO/ASNs to process ({poAsnEntries.length})
                        </label>
                        <div className="space-y-1.5">
                          {poAsnEntries.map((e) => (
                            <div
                              key={e.id}
                              className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="truncate font-semibold">
                                  {sellerById(e.sellerId).name}
                                </div>
                                <div className="font-mono text-muted-foreground">
                                  {e.poAsn}
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="rounded-[3px] bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                                  {e.boxCount} boxes
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removePoAsnEntry(e.id)}
                                  className="text-muted-foreground transition-colors hover:text-destructive"
                                  aria-label={`Remove ${e.poAsn}`}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activityCloses && (
                  <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      No unloading for outbound. The gate pass closes and the
                      vehicle is released once confirmed.
                    </span>
                  </div>
                )}
              </Card>
              <Button
                className="h-11 w-full"
                disabled={
                  activityUnloads
                    ? poAsnEntries.length === 0
                    : !activityCloses
                }
                onClick={confirmActivity}
              >
                {activityCloses ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Close gate pass &amp; release vehicle
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Continue to gate pass issue
                  </>
                )}
              </Button>
            </>
          )}

          {/* Step — Issue gate passes (multi-select sellers) */}
          {step === "issue-passes" && (
            <>
              <Card className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  <Ticket className="h-3.5 w-3.5" />
                  Issue Gate Passes
                </div>
                <p className="text-xs text-muted-foreground">
                  Only the PO/ASNs added on the previous screen are eligible.
                  One pass is cut per PO/ASN — box printing &amp; scanning
                  happens later in Unloading.
                </p>
                <div className="space-y-2">
                  {poAsnEntries.map((e) => (
                    <SellerRow
                      key={e.id}
                      s={{
                        seller: sellerById(e.sellerId),
                        asn: e.poAsn,
                        boxCount: e.boxCount,
                      }}
                      checked={!!issueSelected[e.id]}
                      onToggle={() =>
                        setIssueSelected((prev) => ({
                          ...prev,
                          [e.id]: !prev[e.id],
                        }))
                      }
                    />
                  ))}
                </div>
              </Card>
              <Button
                className="h-11 w-full"
                disabled={selectedEntries.length === 0}
                onClick={issuePasses}
              >
                <Ticket className="mr-2 h-4 w-4" />
                Issue {selectedEntries.length} gate pass
                {selectedEntries.length === 1 ? "" : "es"}
              </Button>
            </>
          )}

          {/* Step — Passes issued */}
          {step === "issued" && (
            <>
              <Card className="space-y-2 p-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-dispatched/15 text-status-dispatched">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-base font-semibold">
                    {issued.length} gate pass{issued.length === 1 ? "" : "es"} issued
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Married to {dockId} · {dateLabel(issueDate)}
                  </div>
                </div>
              </Card>

              <Card className="space-y-1.5 p-3">
                <div className="text-[11px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  Gate passes
                </div>
                {issued.map((p) => (
                  <div
                    key={p.gatePass}
                    className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/20 px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold">
                        {p.seller.seller.name}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {p.gatePass}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-[3px] bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {p.seller.boxCount} boxes
                    </span>
                  </div>
                ))}
              </Card>

              <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Take these gate passes to the <b>Unloading</b> menu to print box
                  IDs, scan boxes and capture POD.
                </span>
              </div>

              <Button className="h-11 w-full" onClick={() => setPrintOpen(true)}>
                <Printer className="mr-2 h-4 w-4" />
                Print gate passes ({issued.length})
              </Button>
              <Button variant="outline" className="h-11 w-full" onClick={reset}>
                Process another vehicle
              </Button>
            </>
          )}

          {/* Step — Outbound released (no unloading) */}
          {step === "released" && (
            <>
              <Card className="space-y-2 p-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-dispatched/15 text-status-dispatched">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-base font-semibold">
                    Gate pass processed
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Outbound — no unloading required. Vehicle released
                    {dockId.trim() ? ` from ${dockId}` : ""}.
                  </div>
                </div>
              </Card>
              <Button variant="outline" className="h-11 w-full" onClick={reset}>
                Process another vehicle
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Gate pass print dialog */}
      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              {issued.length} gate pass{issued.length === 1 ? "" : "es"}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto">
            {issued.map((p) => (
              <GatePassSticker
                key={p.gatePass}
                pass={p}
                dockId={dockId}
                date={dateLabel(issueDate)}
              />
            ))}
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={() => {
                toast.success("Gate passes sent to printer.");
                setPrintOpen(false);
              }}
            >
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
      <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
        Dock
      </span>
      <span className="font-mono text-xs font-semibold text-foreground">
        {dockId}
      </span>
    </div>
  );
}

function ActivityOption({
  label,
  hint,
  icon,
  selected,
  onClick,
}: {
  label: string;
  hint: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 rounded-md border-2 px-3 py-2.5 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/40 hover:bg-muted/40",
      )}
    >
      <span
        className={cn(
          "flex items-center gap-1.5 text-sm font-semibold",
          selected ? "text-primary" : "text-foreground",
        )}
      >
        {icon}
        {label}
      </span>
      <span className="text-[11px] text-muted-foreground">{hint}</span>
    </button>
  );
}

function SellerRow({
  s,
  checked,
  onToggle,
}: {
  s: GatePassSeller;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-3 rounded-md border-2 px-3 py-2.5 text-left transition-colors",
        checked
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/40 hover:bg-muted/40",
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border-2 transition-colors",
          checked ? "border-primary bg-primary text-white" : "border-border",
        )}
      >
        {checked && <CheckCircle2 className="h-3.5 w-3.5" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{s.seller.name}</div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-mono">{s.asn}</span>
          <span>·</span>
          <span className="font-mono">{s.seller.id}</span>
        </div>
      </div>
      <span className="shrink-0 rounded-[3px] bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        {s.boxCount} boxes
      </span>
    </button>
  );
}

function GatePassSticker({
  pass,
  dockId,
  date,
}: {
  pass: IssuedPass;
  dockId: string;
  date: string;
}) {
  const bars = useMemo(() => gateBarcodePattern(pass.gatePass), [pass.gatePass]);
  return (
    <div className="rounded-md border-2 border-dashed border-border bg-background p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-semibold">
          {pass.seller.seller.name}
        </span>
        <span className="shrink-0 rounded-[3px] bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
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
          {pass.gatePass}
        </div>
      </div>
      <div className="my-3 border-t border-dashed border-border" />
      <dl className="space-y-1 text-xs">
        <StickerRow label="Seller" value={pass.seller.seller.name} />
        <StickerRow label="ASN" value={pass.seller.asn} />
        <StickerRow label="Boxes" value={String(pass.seller.boxCount)} />
        <StickerRow label="Dock" value={dockId} />
      </dl>
    </div>
  );
}

function StickerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="w-16 shrink-0 text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
      <dd className="flex-1 font-medium">{value}</dd>
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
