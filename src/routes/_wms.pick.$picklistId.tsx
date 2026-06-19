import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  MapPin,
  Package,
  PackageCheck,
  Replace,
  ScanBarcode,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getPicklist, type Picklist } from "@/lib/wms/picklist-data";

export const Route = createFileRoute("/_wms/pick/$picklistId")({
  head: ({ params }) => ({
    meta: [{ title: `Picking ${params.picklistId} — WMS` }],
  }),
  loader: ({ params }): Picklist => {
    const picklist = getPicklist(params.picklistId);
    if (!picklist) throw new Error("Picklist not found");
    return picklist;
  },
  notFoundComponent: () => (
    <div className="p-6 text-sm text-muted-foreground">
      Picklist not found.{" "}
      <Link to="/pick" className="text-primary underline">
        Back to Pick
      </Link>
    </div>
  ),
  component: PickingScreen,
});

type Step = "scan-lpn" | "picking" | "drop-zone" | "done";

interface ItemProgress {
  picked: number;
  notFound: boolean;
  useAlt: boolean;
  locationScanned: boolean;
}

function PickingScreen() {
  const picklist = Route.useLoaderData() as Picklist;
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("scan-lpn");
  const [lpn, setLpn] = useState("");
  const [tote, setTote] = useState("");
  const [dropBarcode, setDropBarcode] = useState("");
  const [progress, setProgress] = useState<Record<string, ItemProgress>>(
    () =>
      Object.fromEntries(
        picklist.items.map((i) => [
          i.sku,
          { picked: 0, notFound: false, useAlt: false, locationScanned: false },
        ]),
      ),
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const [changeToteOpen, setChangeToteOpen] = useState(false);
  const [changeToteScan, setChangeToteScan] = useState("");
  const [newTote, setNewTote] = useState("");

  const activeItem = picklist.items[activeIdx];
  const activeProg = activeItem ? progress[activeItem.sku] : null;

  const totalPicked = useMemo(
    () => Object.values(progress).reduce((s, p) => s + p.picked, 0),
    [progress],
  );
  const totalTarget = picklist.totalItems;
  const allDone = picklist.items.every((i) => {
    const p = progress[i.sku];
    return p.notFound || p.picked >= i.quantity;
  });

  // -------- step 1: scan LPN + tote --------
  if (step === "scan-lpn") {
    return (
      <ScreenShell
        picklistId={picklist.id}
        subtitle="Step 1 of 3 · Assign pick tote"
      >
        <Card className="space-y-4 p-4">
          <SectionTitle icon={ScanBarcode} title="Scan pick tote LPN" />
          <Input
            autoFocus
            inputMode="text"
            placeholder="Scan tote LPN barcode…"
            value={tote}
            onChange={(e) => {
              setTote(e.target.value);
              setLpn(e.target.value);
            }}
            className="h-12 text-base"
          />
          <Button
            className="h-12 w-full text-base"
            disabled={!tote.trim()}
            onClick={() => {
              setStep("picking");
            }}
          >
            Start picking
          </Button>
        </Card>

      </ScreenShell>
    );
  }

  // -------- step 3: drop zone --------
  if (step === "drop-zone") {
    return (
      <ScreenShell
        picklistId={picklist.id}
        subtitle="Step 3 of 3 · Drop at drop-zone"
      >
        <Card className="space-y-4 p-4">
          <div className="rounded-md bg-status-picked/10 p-3 text-sm text-status-picked ring-1 ring-status-picked/30">
            <div className="flex items-center gap-2 font-medium">
              <PackageCheck className="h-4 w-4" />
              All items picked
            </div>
            <p className="mt-1 text-xs">
              Carry tote <span className="font-semibold">{tote}</span> to the
              outbound drop-zone and scan its barcode.
            </p>
          </div>
          <SectionTitle icon={ScanBarcode} title="Scan drop-zone barcode" />
          <Input
            autoFocus
            placeholder="e.g. DZ-OB-04"
            value={dropBarcode}
            onChange={(e) => setDropBarcode(e.target.value)}
            className="h-12 text-base"
          />
          <Button
            className="h-12 w-full text-base"
            disabled={!dropBarcode.trim()}
            onClick={() => {
              setStep("done");
            }}
          >
            Confirm drop
          </Button>
        </Card>
      </ScreenShell>
    );
  }

  // -------- step 4: done --------
  if (step === "done") {
    return (
      <ScreenShell picklistId={picklist.id} subtitle="Picklist complete">
        <Card className="space-y-4 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-status-dispatched/15 text-status-dispatched">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Picklist {picklist.id}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalPicked} of {totalTarget} units picked, tote {tote} dropped
              at {dropBarcode}.
            </p>
          </div>
          <Button
            className="h-12 w-full text-base"
            onClick={() => {
              navigate({ to: "/pick" });
            }}
          >
            Register Picklist
          </Button>
        </Card>
      </ScreenShell>
    );
  }

  // -------- step 2: picking --------
  const targetLocation = activeProg?.useAlt
    ? activeItem.altLocation
    : activeItem.location;

  const handleScanItem = () => {
    if (!activeProg?.locationScanned) {
      toast.error("Scan the storage location first");
      return;
    }
    setProgress((prev) => {
      const next = { ...prev };
      const p = { ...next[activeItem.sku] };
      p.picked = Math.min(p.picked + 1, activeItem.quantity);
      next[activeItem.sku] = p;
      return next;
    });
    if (activeProg.picked + 1 >= activeItem.quantity) {
      goNext();
    }
  };

  const goNext = () => {
    const nextIdx = picklist.items.findIndex((it, idx) => {
      if (idx <= activeIdx) return false;
      const p = progress[it.sku];
      return !(p.notFound || p.picked >= it.quantity);
    });
    if (nextIdx === -1) {
      const stillOpen = picklist.items.some((it) => {
        const p = progress[it.sku];
        return !(p.notFound || p.picked >= it.quantity);
      });
      if (!stillOpen) setStep("drop-zone");
    } else {
      setActiveIdx(nextIdx);
    }
  };

  return (
    <ScreenShell
      picklistId={picklist.id}
      subtitle="Step 2 of 3 · Picking"
      onChangeTote={() => setChangeToteOpen(true)}
    >
      <div className="space-y-3">
        {/* Persistent pick LPN strip */}
        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-1.5">
          <div className="flex items-center gap-1.5 min-w-0 text-xs">
            <Package className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
              Pick LPN
            </span>
            <span className="font-mono font-medium truncate">{tote}</span>
          </div>
          <button
            type="button"
            onClick={() => setChangeToteOpen(true)}
            className="text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline shrink-0"
          >
            Change
          </button>
        </div>

        <ProgressBar value={totalPicked} max={totalTarget} />

        <Card className="space-y-3 p-4">
          {!activeProg?.locationScanned ? (
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.06em] text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Go to location
              </div>
              <div className="mt-1 font-mono text-2xl font-semibold tracking-tight">
                {targetLocation}
              </div>
              {activeProg?.useAlt ? (
                <p className="mt-1 text-xs text-status-picked">
                  Alternative location (original marked Not Found)
                </p>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-mono font-medium">{targetLocation}</span>
              {activeProg?.useAlt ? (
                <span className="text-[11px] text-status-picked">(alt)</span>
              ) : null}
            </div>
          )}

          {!activeProg?.locationScanned ? (
            <ScanRow
              label="Scan location"
              placeholder={targetLocation}
              done={false}
              expected={targetLocation}
              onScan={(val) => {
                if (val.trim().toUpperCase() === targetLocation.toUpperCase()) {
                  setProgress((prev) => ({
                    ...prev,
                    [activeItem.sku]: {
                      ...prev[activeItem.sku],
                      locationScanned: true,
                    },
                  }));
                } else {
                  toast.error("Wrong location");
                }
              }}
            />
          ) : null}

          {activeProg?.locationScanned ? (
            <>
              <div className="overflow-hidden rounded-md border border-border bg-muted/30">
                <img
                  src={activeItem.image}
                  alt={activeItem.name}
                  className="h-32 w-full object-cover"
                  loading="lazy"
                />
                <div className="space-y-1.5 p-3">
                  <div className="text-sm font-semibold leading-snug">{activeItem.name}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {activeItem.sku}
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-[3px] border border-border bg-background px-2.5 py-1 font-mono text-[11px] font-medium">
                    <span className="tabular-nums">
                      {activeProg?.picked ?? 0} / {activeItem.quantity}
                    </span>
                    <span className="text-muted-foreground">picked</span>
                  </div>
                </div>
              </div>

              <ScanRow
                label="Scan item"
                placeholder={activeItem.sku}
                done={(activeProg?.picked ?? 0) >= activeItem.quantity}
                expected={activeItem.sku}
                onScan={(val) => {
                  if (val.trim().toUpperCase() === activeItem.sku.toUpperCase()) {
                    handleScanItem();
                  } else {
                    toast.error("Wrong SKU");
                  }
                }}
              />

              {(activeProg?.picked ?? 0) < activeItem.quantity ? (
                <Button
                  variant="outline"
                  className="h-11 w-full"
                  onClick={() => {
                    if (activeProg?.useAlt) {
                      toast.error("Already on alternative location");
                      return;
                    }
                    setProgress((prev) => ({
                      ...prev,
                      [activeItem.sku]: {
                        ...prev[activeItem.sku],
                        notFound: false,
                        useAlt: true,
                        locationScanned: false,
                      },
                    }));
                    toast(
                      `Try alternative: ${activeItem.altLocation}`,
                      { icon: "↻" },
                    );
                  }}
                >
                  <XCircle className="h-4 w-4" />
                  Not Found
                </Button>
              ) : null}
            </>
          ) : (
            <p className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
              Scan the location to reveal the item to pick.
            </p>
          )}
        </Card>

        {allDone ? (
          <Button
            className="h-11 w-full"
            onClick={() => setStep("drop-zone")}
          >
            Proceed to drop-zone
          </Button>
        ) : null}
      </div>


      <Dialog open={changeToteOpen} onOpenChange={setChangeToteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change tote</DialogTitle>
            <DialogDescription>
              Drop the current tote at the Pick Drop Area by scanning the drop
              barcode, then scan a new tote.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-mono font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Drop barcode
              </label>
              <Input
                className="mt-1 h-11"
                placeholder="e.g. PDA-02"
                value={changeToteScan}
                onChange={(e) => setChangeToteScan(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-mono font-medium uppercase tracking-[0.06em] text-muted-foreground">
                New tote barcode
              </label>
              <Input
                className="mt-1 h-11"
                placeholder="Scan new tote…"
                value={newTote}
                onChange={(e) => setNewTote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChangeToteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={!changeToteScan.trim() || !newTote.trim()}
              onClick={() => {
                setTote(newTote);
                setChangeToteScan("");
                setNewTote("");
                setChangeToteOpen(false);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScreenShell>
  );
}

function ScreenShell({
  picklistId,
  subtitle,
  children,
  onChangeTote,
}: {
  picklistId: string;
  subtitle: string;
  children: React.ReactNode;
  onChangeTote?: () => void;
}) {
  return (
    <div className="min-h-[calc(100vh-3rem)] bg-muted/40 py-4">
      <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-md border border-border bg-background">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-background px-4 py-3">
          <Link
            to="/pick"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Pick
          </Link>
          <div className="text-right">
            <div className="font-mono text-sm font-semibold">{picklistId}</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">{subtitle}</div>
          </div>
        </div>
        <div className="p-4 pb-6">{children}</div>
      </div>
      {onChangeTote ? null : null}
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {title}
    </div>
  );
}

function ScanRow({
  label,
  placeholder,
  done,
  expected,
  onScan,
}: {
  label: string;
  placeholder: string;
  done: boolean;
  expected: string;
  onScan: (value: string) => void;
}) {
  const [val, setVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </label>
        {done ? (
          <span className="inline-flex items-center gap-1 text-xs text-status-picked">
            <Check className="h-3.5 w-3.5" />
            Done
          </span>
        ) : null}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!val.trim()) return;
          onScan(val);
          setVal("");
          inputRef.current?.focus();
        }}
        className="flex gap-2"
      >
        <Input
          ref={inputRef}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder}
          className="h-11 font-mono text-sm"
          disabled={done}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-11 px-2 text-xs"
          onClick={() => {
            onScan(expected);
            setVal("");
          }}
          disabled={done}
        >
          Auto
        </Button>
      </form>
    </div>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>Progress</span>
        <span className="tabular-nums">
          {value} / {max} units
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-[2px] bg-muted">
        <div
          className="h-full bg-status-picked transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
