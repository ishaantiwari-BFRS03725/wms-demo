import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpFromLine,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Hash,
  IndianRupee,
  MapPin,
  Package,
  Plus,
  ScanBarcode,
  Tags,
  Warehouse,
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

export const Route = createFileRoute("/_wms/item-movement")({
  head: () => ({
    meta: [{ title: "Item Movement — Inventory" }],
  }),
  component: ItemMovement,
});

// ─── Item movement ────────────────────────────────────────────────────────────

interface MovementTask {
  id: string;
  reason: string;
  fromBin: string;
  toBin: string;
  sku: string;
  name: string;
  image: string;
  suggestedQty: number;
  allowQty: boolean;
}

interface SkuCapture {
  batch: boolean;
  batchNo?: string;
  expiry: boolean;
  expiryDate?: string;
  mfg: boolean;
  mfgDate?: string;
  mrp: boolean;
  mrpValue?: string;
}

const SKU_CAPTURE: Record<string, SkuCapture> = {
  "600179": {
    batch: true,
    batchNo: "BTH-AD141-0423",
    expiry: true,
    expiryDate: "01/04/2026",
    mfg: false,
    mrp: false,
  },
  "600900": { batch: false, expiry: false, mfg: false, mrp: false },
  "600822": {
    batch: true,
    batchNo: "BTH-RK450-0123",
    expiry: true,
    expiryDate: "03/01/2026",
    mfg: true,
    mfgDate: "03/01/2021",
    mrp: true,
    mrpValue: "1499",
  },
};

const captureFor = (sku: string): SkuCapture =>
  SKU_CAPTURE[sku] ?? { batch: false, expiry: false, mfg: false, mrp: false };

const ITEM_CATALOG: Record<string, { name: string; image: string }> = {
  "600179": {
    name: "boAt Airdopes 141 TWS Earbuds",
    image: "https://picsum.photos/seed/boat-airdopes-141/400/240",
  },
  "600822": {
    name: "boAt Rockerz 450 Bluetooth Headphones",
    image: "https://picsum.photos/seed/boat-rockerz-450/400/240",
  },
  "600868": {
    name: "boAt Bassheads 100 Wired Earphones",
    image: "https://picsum.photos/seed/boat-bassheads-100/400/240",
  },
  "600900": {
    name: "boAt Stone 350 Bluetooth Speaker",
    image: "https://picsum.photos/seed/boat-stone-350/400/240",
  },
  "601000": {
    name: "boAt Wave Call Smartwatch",
    image: "https://picsum.photos/seed/boat-wave-watch/400/240",
  },
  "601002": {
    name: "boAt Type-C 500 Charging Cable",
    image: "https://picsum.photos/seed/boat-cable-500/400/240",
  },
};

const TASKS: MovementTask[] = [
  {
    id: "MOV-3001",
    reason: "Replenishment · Bulk → Pick",
    fromBin: "BULK16-02",
    toBin: "PICK01-A1",
    sku: "600179",
    name: "boAt Airdopes 141 TWS Earbuds",
    image: "https://picsum.photos/seed/boat-airdopes-141/400/240",
    suggestedQty: 50,
    allowQty: true,
  },
  {
    id: "MOV-3002",
    reason: "Consolidation · Merge bins",
    fromBin: "BULK10-14",
    toBin: "PICK02-B3",
    sku: "600900",
    name: "boAt Stone 350 Bluetooth Speaker",
    image: "https://picsum.photos/seed/boat-stone-350/400/240",
    suggestedQty: 12,
    allowQty: true,
  },
  {
    id: "MOV-3003",
    reason: "Putaway · Inward → Bulk",
    fromBin: "RX-LPN-204",
    toBin: "BULK09-13",
    sku: "600822",
    name: "boAt Rockerz 450 Bluetooth Headphones",
    image: "https://picsum.photos/seed/boat-rockerz-450/400/240",
    suggestedQty: 24,
    allowQty: true,
  },
];

// ─── Bin movement ─────────────────────────────────────────────────────────────

interface BinMovementTask {
  id: string;
  reason: string;
  fromLocation: string;
  binNo: string;
  toLocation: string;
  items: Array<{ sku: string; name: string; qty: number }>;
}

const BIN_TASKS: BinMovementTask[] = [
  {
    id: "BMV-4001",
    reason: "Relocation · Bulk reorg",
    fromLocation: "BULK16-02",
    binNo: "BIN-A12-402",
    toLocation: "BULK10-14",
    items: [
      { sku: "600179", name: "boAt Airdopes 141 TWS Earbuds", qty: 250 },
      { sku: "600868", name: "boAt Bassheads 100 Wired Earphones", qty: 80 },
    ],
  },
  {
    id: "BMV-4002",
    reason: "Putaway · Receiving → Bulk",
    fromLocation: "RX-LPN-204",
    binNo: "LPN-7081",
    toLocation: "BULK09-13",
    items: [
      { sku: "600822", name: "boAt Rockerz 450 Bluetooth Headphones", qty: 24 },
    ],
  },
];

// Known bin contents used by the ad-hoc bin flow
// ─── Screen ───────────────────────────────────────────────────────────────────

function ItemMovement() {
  const [batchActive, setBatchActive] = useState(false);
  const [activeBinTaskId, setActiveBinTaskId] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [adHocActive, setAdHocActive] = useState(false);

  const activeBinTask = BIN_TASKS.find((t) => t.id === activeBinTaskId) ?? null;

  const openTasks = TASKS.filter((t) => !doneIds.includes(t.id));
  const openBinTasks = BIN_TASKS.filter((t) => !doneIds.includes(t.id));
  const allDone = openTasks.length === 0 && openBinTasks.length === 0;

  const markDone = (id: string) =>
    setDoneIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

  if (adHocActive) {
    return <AdHocMovementFlow onExit={() => setAdHocActive(false)} />;
  }

  if (batchActive) {
    return (
      <MovementBatchFlow
        tasks={openTasks}
        onExit={() => setBatchActive(false)}
        onComplete={() => {
          setDoneIds((prev) => [
            ...prev,
            ...openTasks.map((t) => t.id).filter((id) => !prev.includes(id)),
          ]);
          setBatchActive(false);
        }}
      />
    );
  }

  if (activeBinTask) {
    return (
      <BinMovementFlow
        task={activeBinTask}
        onExit={() => setActiveBinTaskId(null)}
        onComplete={() => {
          markDone(activeBinTask.id);
          setActiveBinTaskId(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-muted/40 py-4">
      <div className="mx-auto w-full max-w-[420px] space-y-3">
        <div className="overflow-hidden rounded-md border border-border bg-background">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">Item Movement</div>
              <div className="text-[11px] text-muted-foreground">
                Tap a task to start. Bins and items are system-suggested.
              </div>
            </div>
            <button
              type="button"
              title="New ad-hoc movement"
              onClick={() => setAdHocActive(true)}
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {allDone ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <CheckCircle2 className="h-7 w-7 text-status-picked" />
              <div className="text-sm font-medium">All tasks completed</div>
              <div className="text-[11px] text-muted-foreground">
                No pending movement tasks.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {openTasks.length > 0 && (
                <>
                  <div className="flex items-center justify-between px-4 py-2">
                    <div className="text-[10px] font-semibold font-mono uppercase tracking-[0.06em] text-muted-foreground">
                      Item · Assigned to you
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      {openTasks.length} {openTasks.length === 1 ? "task" : "tasks"}
                      {" · "}
                      {openTasks.reduce((s, t) => s + t.suggestedQty, 0)} units
                    </div>
                  </div>
                  {openTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-sm font-semibold">
                          {t.id}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {t.reason}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                          <span className="font-mono font-medium">
                            {t.fromBin}
                          </span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono font-medium">{t.toBin}</span>
                        </div>
                      </div>
                      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                        {t.suggestedQty}
                      </span>
                    </div>
                  ))}
                  <div className="px-4 py-3">
                    <Button
                      className="h-11 w-full"
                      onClick={() => setBatchActive(true)}
                    >
                      <Package className="h-4 w-4" />
                      Start movement · pick into tote
                    </Button>
                  </div>
                </>
              )}

              {openBinTasks.length > 0 && (
                <>
                  <div className="px-4 py-2 text-[10px] font-semibold font-mono uppercase tracking-[0.06em]st text-muted-foreground">
                    Bin
                  </div>
                  {openBinTasks.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveBinTaskId(t.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Package className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-sm font-semibold">
                          {t.id}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {t.reason}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                          <span className="font-mono font-medium">
                            {t.fromLocation}
                          </span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono font-medium">
                            {t.toLocation}
                          </span>
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          Bin: {t.binNo} · {t.items.length}{" "}
                          {t.items.length === 1 ? "SKU" : "SKUs"},{" "}
                          {t.items.reduce((s, i) => s + i.qty, 0)} units
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Ad-hoc movement ──────────────────────────────────────────────────────────

function AdHocMovementFlow({ onExit }: { onExit: () => void }) {
  const [type, setType] = useState<"item" | "bin">("item");
  const [flowKey, setFlowKey] = useState(0);

  const switchType = (t: "item" | "bin") => {
    if (t === type) return;
    setType(t);
    setFlowKey((k) => k + 1);
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-muted/40 py-4">
      <div className="mx-auto w-full max-w-[420px]">
        <div className="overflow-hidden rounded-md border border-border bg-background">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Tasks
            </button>
            <div className="text-sm font-semibold">Ad-hoc Movement</div>
          </div>

          {/* Type toggle */}
          <div className="border-b border-border p-3">
            <div className="flex overflow-hidden rounded-md border border-border">
              <button
                type="button"
                onClick={() => switchType("item")}
                className={cn(
                  "flex-1 py-2 text-xs font-medium transition-colors",
                  type === "item"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted/50",
                )}
              >
                Item Movement
              </button>
              <button
                type="button"
                onClick={() => switchType("bin")}
                className={cn(
                  "flex-1 py-2 text-xs font-medium transition-colors",
                  type === "bin"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted/50",
                )}
              >
                Bin Movement
              </button>
            </div>
          </div>

          {/* Flow */}
          <div className="p-4 pb-6">
            {type === "item" ? (
              <AdHocItemFlow key={`item-${flowKey}`} onComplete={onExit} />
            ) : (
              <AdHocBinFlow key={`bin-${flowKey}`} onComplete={onExit} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type ItemAdHocStage = "from-bin" | "item" | "to-bin" | "confirm";

function AdHocItemFlow({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<ItemAdHocStage>("from-bin");
  const [fromBin, setFromBin] = useState("");
  const [scannedSku, setScannedSku] = useState("");
  const [qty, setQty] = useState("1");
  const [toBin, setToBin] = useState("");

  const itemInfo = ITEM_CATALOG[scannedSku];
  const cap = captureFor(scannedSku);

  const stageNum: Record<ItemAdHocStage, number> = {
    "from-bin": 1,
    item: 2,
    "to-bin": 3,
    confirm: 4,
  };

  return (
    <div className="space-y-3">
      {/* Step 1 — From bin */}
      {stage === "from-bin" && (
        <Card className="space-y-3 p-4">
          <SuggestRow
            icon={MapPin}
            label="Source bin or location"
            value="e.g. BULK16-02"
          />
          <FreeScanRow
            label="Scan or type from bin"
            demoValue="BULK16-02"
            onScan={(v) => {
              setFromBin(v);
              setStage("item");
            }}
          />
        </Card>
      )}

      {/* Step 2 — Scan item */}
      {stage === "item" && (
        <Card className="space-y-3 p-4">
          <ConfirmedStrip label="From" value={fromBin} />

          {!scannedSku ? (
            <>
              <SuggestRow
                icon={Tags}
                label="Item barcode or SKU"
                value="e.g. 600179"
              />
              <FreeScanRow
                label="Scan item barcode / SKU"
                demoValue="600179"
                onScan={(sku) => {
                  setScannedSku(sku);
                  setQty("1");
                }}
              />
            </>
          ) : (
            <div className="space-y-3">
              {itemInfo ? (
                <div className="overflow-hidden rounded-md border border-border bg-muted/30">
                  <div className="flex h-56 w-full items-center justify-center bg-white p-3">
                    <img
                      src={itemInfo.image}
                      alt={itemInfo.name}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="space-y-0.5 p-3">
                    <div className="text-sm font-semibold leading-snug">
                      {itemInfo.name}
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {scannedSku}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-warn/30 bg-warn-bg px-3 py-2.5 text-xs text-warn">
                  <span className="font-mono font-semibold">{scannedSku}</span>
                  <span className="ml-1">— unrecognised SKU</span>
                  <button
                    type="button"
                    className="ml-auto text-[10px] underline"
                    onClick={() => setScannedSku("")}
                  >
                    Re-scan
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <FieldHeader icon={Hash} label="Quantity to move" />
                <Input
                  autoFocus
                  inputMode="numeric"
                  value={qty}
                  onChange={(e) =>
                    setQty(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="h-11 text-base font-mono"
                />
              </div>

              {cap.batch && (
                <ReadonlyField
                  icon={Tags}
                  label="Batch being moved"
                  value={cap.batchNo ?? "—"}
                  mono
                />
              )}
              {cap.expiry && (
                <ReadonlyField
                  icon={CalendarClock}
                  label="Expiry date"
                  value={cap.expiryDate ?? "—"}
                />
              )}
              {cap.mfg && (
                <ReadonlyField
                  icon={Calendar}
                  label="Manufacturing date"
                  value={cap.mfgDate ?? "—"}
                />
              )}
              {cap.mrp && (
                <ReadonlyField
                  icon={IndianRupee}
                  label="MRP"
                  value={cap.mrpValue ?? "—"}
                  mono
                />
              )}

              <Button
                className="h-11 w-full"
                disabled={!qty || Number(qty) <= 0}
                onClick={() => setStage("to-bin")}
              >
                Next: Select destination
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Step 3 — To bin */}
      {stage === "to-bin" && (
        <Card className="space-y-3 p-4">
          <ConfirmedStrip label="From" value={fromBin} />
          <ConfirmedStrip
            label="Item"
            value={`${scannedSku}${itemInfo ? " · " + itemInfo.name : ""}`}
          />
          <SuggestRow
            icon={MapPin}
            label="Destination bin or location"
            value="e.g. PICK01-A1"
          />
          <FreeScanRow
            label="Scan or type to bin"
            demoValue="PICK01-A1"
            onScan={(v) => {
              if (norm(v) === norm(fromBin)) {
                toast.error("Destination cannot be same as source");
                return;
              }
              setToBin(v);
              setStage("confirm");
            }}
          />
        </Card>
      )}

      {/* Step 4 — Confirm */}
      {stage === "confirm" && (
        <Card className="space-y-3 p-4">
          <div className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
            <div className="text-[10px] font-semibold font-mono uppercase tracking-[0.06em] text-muted-foreground">
              Move summary
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  From
                </div>
                <div className="font-mono text-sm font-semibold">{fromBin}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  To
                </div>
                <div className="font-mono text-sm font-semibold">{toBin}</div>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                Item
              </div>
              <div className="text-sm font-semibold">
                {itemInfo?.name ?? scannedSku}
              </div>
              <div className="font-mono text-[11px] text-muted-foreground">
                {scannedSku}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                Quantity
              </div>
              <div className="font-mono text-sm font-semibold">{qty} units</div>
            </div>
          </div>
          <Button
            className="h-11 w-full"
            onClick={() => {
              toast.success("Item moved successfully");
              onComplete();
            }}
          >
            Confirm movement
          </Button>
        </Card>
      )}
    </div>
  );
}

type BinAdHocStage = "source-location" | "bin" | "dest-location";

function AdHocBinFlow({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<BinAdHocStage>("source-location");
  const [sourceLocation, setSourceLocation] = useState("");
  const [binNo, setBinNo] = useState("");
  const [destLocation, setDestLocation] = useState("");
  const [destScanned, setDestScanned] = useState(false);

  const stageNum: Record<BinAdHocStage, number> = {
    "source-location": 1,
    bin: 2,
    "dest-location": 3,
  };

  return (
    <div className="space-y-3">
      {/* Step 1 — Source location */}
      {stage === "source-location" && (
        <Card className="space-y-3 p-4">
          <SuggestRow
            icon={MapPin}
            label="Source location"
            value="e.g. BULK16-02"
          />
          <FreeScanRow
            label="Scan or type source location"
            demoValue="BULK16-02"
            onScan={(v) => {
              setSourceLocation(v);
              setStage("bin");
            }}
          />
        </Card>
      )}

      {/* Step 2 — Scan bin */}
      {stage === "bin" && (
        <Card className="space-y-3 p-4">
          <ConfirmedStrip
            label="Location"
            value={sourceLocation}
            onClear={() => {
              setSourceLocation("");
              setBinNo("");
              setStage("source-location");
            }}
          />
          <SuggestRow
            icon={Package}
            label="Bin at this location"
            value="e.g. BIN-A12-402"
          />
          <FreeScanRow
            label="Scan bin"
            demoValue="BIN-A12-402"
            onScan={(v) => {
              setBinNo(v);
              setStage("dest-location");
            }}
          />
        </Card>
      )}

      {/* Step 3 — Destination */}
      {stage === "dest-location" && (
        <Card className="space-y-3 p-4">
          <ConfirmedStrip label="Bin" value={binNo} />
          {!destScanned ? (
            <>
              <SuggestRow
                icon={MapPin}
                label="Destination location"
                value="e.g. BULK10-14"
              />
              <FreeScanRow
                label="Scan or type destination"
                demoValue="BULK10-14"
                onScan={(v) => {
                  if (norm(v) === norm(sourceLocation)) {
                    toast.error("Destination cannot be same as source");
                    return;
                  }
                  setDestLocation(v);
                  setDestScanned(true);
                }}
              />
            </>
          ) : (
            <div className="space-y-3">
              <ConfirmedStrip label="Destination" value={destLocation} />
              <div className="rounded-md border border-border bg-muted/20 p-3 space-y-3">
                <div className="text-[10px] font-semibold font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  Move summary
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                      From
                    </div>
                    <div className="font-mono text-sm font-semibold">
                      {sourceLocation}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                      To
                    </div>
                    <div className="font-mono text-sm font-semibold">
                      {destLocation}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                    Bin
                  </div>
                  <div className="font-mono text-sm font-semibold">{binNo}</div>
                </div>
              </div>
              <Button
                className="h-11 w-full"
                onClick={() => {
                  toast.success("Bin moved successfully");
                  onComplete();
                }}
              >
                Confirm bin movement
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ─── Item movement batch flow (pick → putaway; drop zone on demand) ──────────

type BatchPhase = "assign-tote" | "pick" | "putaway" | "done";

interface PutawayState {
  toBin: string;
  editing: boolean;
}

function MovementBatchFlow({
  tasks,
  onExit,
  onComplete,
}: {
  tasks: MovementTask[];
  onExit: () => void;
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<BatchPhase>("assign-tote");
  const [tote, setTote] = useState("");
  const [staging, setStaging] = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const [dropScan, setDropScan] = useState("");

  // pick phase
  const [pickIdx, setPickIdx] = useState(0);
  const [fromScanned, setFromScanned] = useState(false);
  const [itemScanned, setItemScanned] = useState(false);
  const [qty, setQty] = useState("");
  const [pickedQty, setPickedQty] = useState<Record<string, number>>({});

  // putaway phase
  const [putIdx, setPutIdx] = useState(0);
  const [toScanned, setToScanned] = useState(false);
  const [putaway, setPutaway] = useState<Record<string, PutawayState>>(() =>
    Object.fromEntries(
      tasks.map((t) => [t.id, { toBin: t.toBin, editing: false }]),
    ),
  );

  const totalUnits = tasks.reduce((s, t) => s + t.suggestedQty, 0);
  const pickedUnits = Object.values(pickedQty).reduce((s, q) => s + q, 0);

  const pickTask = tasks[pickIdx];
  const putTask = tasks[putIdx];

  const startPick = (task: MovementTask) => {
    setFromScanned(false);
    setItemScanned(false);
    setQty(String(task.suggestedQty));
  };

  const goToPutaway = () => {
    setPutIdx(0);
    setToScanned(false);
    setPhase("putaway");
  };

  const advancePick = (movedQty: number) => {
    setPickedQty((prev) => ({ ...prev, [pickTask.id]: movedQty }));
    if (pickIdx + 1 < tasks.length) {
      const nextIdx = pickIdx + 1;
      setPickIdx(nextIdx);
      startPick(tasks[nextIdx]);
    } else {
      goToPutaway();
    }
  };

  const advancePutaway = () => {
    if (putIdx + 1 < tasks.length) {
      setPutIdx(putIdx + 1);
      setToScanned(false);
    } else {
      setPhase("done");
    }
  };

  // ── Phase: assign tote ──────────────────────────────────────────────────
  if (phase === "assign-tote") {
    return (
      <BatchShell onExit={onExit} subtitle="Assign pick tote">
        <div className="mb-3 rounded-md border border-border bg-muted/20 px-3 py-2.5 text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">{tasks.length}</span>{" "}
          {tasks.length === 1 ? "task" : "tasks"} ·{" "}
          <span className="font-semibold text-foreground">{totalUnits}</span>{" "}
          units to move
        </div>
        <Card className="space-y-3 p-4">
          <SuggestRow
            icon={Package}
            label="Scan a pick tote"
            value="e.g. TOTE-4471"
          />
          <FreeScanRow
            label="Scan tote LPN"
            demoValue="TOTE-4471"
            onScan={(v) => {
              setTote(v);
              setPickIdx(0);
              startPick(tasks[0]);
              setPhase("pick");
            }}
          />
        </Card>
      </BatchShell>
    );
  }

  // ── Phase: pick ─────────────────────────────────────────────────────────
  if (phase === "pick" && pickTask) {
    const cap = captureFor(pickTask.sku);
    return (
      <BatchShell onExit={onExit} subtitle={`Pick · ${pickIdx + 1} of ${tasks.length}`}>
        <ToteStrip tote={tote} onDropZone={() => setDropOpen(true)} />
        <ProgressStrip label="Picked" value={pickedUnits} max={totalUnits} />

        {!fromScanned ? (
          <Card className="mt-3 space-y-3 p-4">
            <SuggestRow
              icon={MapPin}
              label="Go to From bin"
              value={pickTask.fromBin}
            />
            <ScanRow
              label="Scan From bin"
              placeholder={pickTask.fromBin}
              expected={pickTask.fromBin}
              onScan={(val) => {
                if (norm(val) === norm(pickTask.fromBin)) setFromScanned(true);
                else toast.error("Wrong From bin scanned");
              }}
            />
          </Card>
        ) : (
          <Card className="mt-3 space-y-3 p-4">
            <ConfirmedStrip label="From bin" value={pickTask.fromBin} />
            <div className="overflow-hidden rounded-md border border-border bg-muted/30">
              <div className="flex h-56 w-full items-center justify-center bg-white p-3">
                <img
                  src={pickTask.image}
                  alt={pickTask.name}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                />
              </div>
              <div className="space-y-1 p-3">
                <div className="text-sm font-semibold leading-snug">
                  {pickTask.name}
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {pickTask.sku}
                </div>
              </div>
            </div>

            {!itemScanned ? (
              <ScanRow
                label="Scan item barcode"
                placeholder={pickTask.sku}
                expected={pickTask.sku}
                onScan={(val) => {
                  if (norm(val) === norm(pickTask.sku)) setItemScanned(true);
                  else toast.error("Wrong item scanned");
                }}
              />
            ) : (
              <>
            <ConfirmedStrip label="Item" value={pickTask.sku} />
            <div className="space-y-2">
              <FieldHeader icon={Hash} label="Quantity to tote" />
              <p className="text-[11px] text-muted-foreground">
                Suggested{" "}
                <span className="font-semibold text-foreground">
                  {pickTask.suggestedQty}
                </span>{" "}
                units.
              </p>
              <Input
                inputMode="numeric"
                value={qty}
                onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ""))}
                className="h-11 text-base font-mono"
              />
            </div>

            {cap.batch && (
              <ReadonlyField
                icon={Tags}
                label="Batch being moved"
                value={cap.batchNo ?? "—"}
                mono
              />
            )}
            {cap.expiry && (
              <ReadonlyField
                icon={CalendarClock}
                label="Expiry date"
                value={cap.expiryDate ?? "—"}
              />
            )}
            {cap.mfg && (
              <ReadonlyField
                icon={Calendar}
                label="Manufacturing date"
                value={cap.mfgDate ?? "—"}
              />
            )}
            {cap.mrp && (
              <ReadonlyField
                icon={IndianRupee}
                label="MRP"
                value={cap.mrpValue ?? "—"}
                mono
              />
            )}

            <Button
              className="h-11 w-full"
              disabled={!qty || Number(qty) <= 0}
              onClick={() => {
                if (Number(qty) > pickTask.suggestedQty) {
                  toast.error("Quantity exceeds the suggested amount");
                  return;
                }
                toast.success("Added to tote");
                advancePick(Number(qty));
              }}
            >
              <Package className="h-4 w-4" />
              Add to tote
            </Button>
              </>
            )}
          </Card>
        )}

        <DropZoneDialog
          open={dropOpen}
          onOpenChange={setDropOpen}
          value={dropScan}
          onChange={setDropScan}
          onConfirm={() => {
            setStaging(dropScan.trim());
            toast.success(`Tote parked at ${dropScan.trim()}`);
            setDropScan("");
            setDropOpen(false);
            goToPutaway();
          }}
        />
      </BatchShell>
    );
  }

  // ── Phase: putaway ──────────────────────────────────────────────────────
  if (phase === "putaway" && putTask) {
    const put = putaway[putTask.id];
    const setPut = (patch: Partial<PutawayState>) =>
      setPutaway((prev) => ({
        ...prev,
        [putTask.id]: { ...prev[putTask.id], ...patch },
      }));

    return (
      <BatchShell onExit={onExit} subtitle={`Putaway · ${putIdx + 1} of ${tasks.length}`}>
        <ToteStrip tote={tote} staging={staging} />
        <Card className="mt-3 space-y-3 p-4">
          <div className="rounded-md bg-primary/10 p-3 text-sm text-primary ring-1 ring-primary/25">
            <div className="flex items-center gap-2 font-semibold">
              <ArrowDownToLine className="h-4 w-4" />
              Putaway — place items into a bin
            </div>
            <p className="mt-1 text-xs text-primary/90">
              Take{" "}
              <span className="font-semibold">
                {pickedQty[putTask.id] ?? putTask.suggestedQty} units
              </span>{" "}
              from tote{" "}
              <span className="font-mono font-semibold">{tote}</span>, then scan
              the To bin below and place them there.
            </p>
          </div>
          <div className="overflow-hidden rounded-md border border-border bg-muted/30">
            <div className="flex h-40 w-full items-center justify-center bg-white p-3">
              <img
                src={putTask.image}
                alt={putTask.name}
                className="max-h-full max-w-full object-contain"
                loading="lazy"
              />
            </div>
            <div className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold leading-snug">
                  {putTask.name}
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {putTask.sku}
                </div>
              </div>
              <span className="shrink-0 font-mono text-xs font-semibold">
                {pickedQty[putTask.id] ?? putTask.suggestedQty} units
              </span>
            </div>
          </div>

          {!toScanned ? (
            <>
              {!put.editing ? (
                <>
                  <div className="flex items-center justify-between">
                    <FieldHeader icon={MapPin} label="Suggested To bin" />
                    <button
                      type="button"
                      onClick={() => setPut({ editing: true })}
                      className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    >
                      Change
                    </button>
                  </div>
                  <div className="font-mono text-2xl font-semibold tracking-tight">
                    {put.toBin}
                  </div>
                  <ScanRow
                    label="Scan To bin to put away"
                    placeholder={put.toBin}
                    expected={put.toBin}
                    onScan={(val) => {
                      if (norm(val) === norm(put.toBin)) setToScanned(true);
                      else toast.error("Wrong To bin scanned");
                    }}
                  />
                </>
              ) : (
                <>
                  <FieldHeader icon={MapPin} label="Enter a different To bin" />
                  <FreeScanRow
                    label="Scan or type To bin"
                    demoValue={put.toBin}
                    onScan={(v) => {
                      if (norm(v) === norm(putTask.fromBin)) {
                        toast.error("Destination cannot be the source bin");
                        return;
                      }
                      setPut({ toBin: v, editing: false });
                      toast.success(`Destination set to ${v}`);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setPut({ editing: false })}
                    className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  >
                    Keep suggested ({putTask.toBin})
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <ConfirmedStrip label="To bin" value={put.toBin} />
              <ScanRow
                label="Scan item to place"
                placeholder={putTask.sku}
                expected={putTask.sku}
                onScan={(val) => {
                  if (norm(val) !== norm(putTask.sku)) {
                    toast.error("Wrong item scanned");
                    return;
                  }
                  toast.success("Putaway confirmed");
                  advancePutaway();
                }}
              />
            </div>
          )}
        </Card>
      </BatchShell>
    );
  }

  // ── Phase: done ─────────────────────────────────────────────────────────
  return (
    <BatchShell onExit={onExit} subtitle="Batch complete">
      <Card className="space-y-4 p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-status-dispatched/15 text-status-dispatched">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Movement complete</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {tasks.length} {tasks.length === 1 ? "item" : "items"} ·{" "}
            {pickedUnits} units picked into {tote} and put away.
          </p>
        </div>
        <Button className="h-11 w-full" onClick={onComplete}>
          Back to tasks
        </Button>
      </Card>
    </BatchShell>
  );
}

function BatchShell({
  subtitle,
  onExit,
  children,
}: {
  subtitle: string;
  onExit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-3rem)] bg-muted/40 py-4">
      <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-md border border-border bg-background">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Tasks
          </button>
          <div className="text-right">
            <div className="text-sm font-semibold">Item Movement</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
              {subtitle}
            </div>
          </div>
        </div>
        <div className="p-4 pb-6">{children}</div>
      </div>
    </div>
  );
}

function ToteStrip({
  tote,
  staging,
  onDropZone,
}: {
  tote: string;
  staging?: string;
  onDropZone?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-1.5">
      <div className="flex min-w-0 items-center gap-1.5 text-xs">
        <Package className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
          Tote
        </span>
        <span className="truncate font-mono font-medium">{tote}</span>
      </div>
      {staging ? (
        <div className="flex shrink-0 items-center gap-1.5 text-xs">
          <Warehouse className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono font-medium">{staging}</span>
        </div>
      ) : onDropZone ? (
        <button
          type="button"
          onClick={onDropZone}
          className="inline-flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          <Warehouse className="h-3 w-3" />
          Scan drop zone
        </button>
      ) : null}
    </div>
  );
}

function DropZoneDialog({
  open,
  onOpenChange,
  value,
  onChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Drop tote at drop zone</DialogTitle>
          <DialogDescription>
            Leave the tote at a drop zone so putaway can be done later. Scan the
            drop zone barcode.
          </DialogDescription>
        </DialogHeader>
        <div>
          <label className="text-xs font-mono font-medium uppercase tracking-[0.06em] text-muted-foreground">
            Drop zone barcode
          </label>
          <Input
            autoFocus
            className="mt-1 h-11 font-mono"
            placeholder="e.g. STG-02"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!value.trim()} onClick={onConfirm}>
            Confirm drop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProgressStrip({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{label}</span>
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

// ─── Bin movement flow (task-driven) ─────────────────────────────────────────

type BinStage = "source-location" | "bin" | "dest-location";

function BinMovementFlow({
  task,
  onExit,
  onComplete,
}: {
  task: BinMovementTask;
  onExit: () => void;
  onComplete: () => void;
}) {
  const [stage, setStage] = useState<BinStage>("source-location");
  const [destScanned, setDestScanned] = useState(false);

  const stageNum: Record<BinStage, number> = {
    "source-location": 1,
    bin: 2,
    "dest-location": 3,
  };

  const complete = () => {
    toast.success("Bin moved successfully");
    onComplete();
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-muted/40 py-4">
      <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-md border border-border bg-background">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Tasks
          </button>
          <div className="text-right">
            <div className="text-sm font-semibold">{task.id}</div>
          </div>
        </div>

        <div className="p-4 pb-6">
          <div className="mb-3 grid grid-cols-2 gap-1.5">
            <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-1.5 text-[11px]">
              <ArrowUpFromLine className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                From
              </span>
              <span className="ml-auto truncate font-mono font-semibold">
                {task.fromLocation}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-1.5 text-[11px]">
              <ArrowDownToLine className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                To
              </span>
              <span className="ml-auto truncate font-mono font-semibold">
                {task.toLocation}
              </span>
            </div>
          </div>

          {stage === "source-location" && (
            <Card className="space-y-3 p-4">
              <SuggestRow
                icon={MapPin}
                label="Go to source location"
                value={task.fromLocation}
              />
              <ScanRow
                label="Scan source location"
                placeholder={task.fromLocation}
                expected={task.fromLocation}
                onScan={(val) => {
                  if (norm(val) === norm(task.fromLocation)) setStage("bin");
                  else toast.error("Wrong location scanned");
                }}
              />
            </Card>
          )}

          {stage === "bin" && (
            <Card className="space-y-3 p-4">
              <ConfirmedStrip label="Location" value={task.fromLocation} />
              <SuggestRow
                icon={Package}
                label="Scan bin at this location"
                value={task.binNo}
              />
              <ScanRow
                label="Scan bin"
                placeholder={task.binNo}
                expected={task.binNo}
                onScan={(val) => {
                  if (norm(val) === norm(task.binNo)) setStage("dest-location");
                  else toast.error("Bin not found at this location");
                }}
              />
            </Card>
          )}

          {stage === "dest-location" && (
            <Card className="space-y-3 p-4">
              <ConfirmedStrip label="Bin" value={task.binNo} />
              {!destScanned ? (
                <>
                  <SuggestRow
                    icon={MapPin}
                    label="Go to destination"
                    value={task.toLocation}
                  />
                  <ScanRow
                    label="Scan destination location"
                    placeholder={task.toLocation}
                    expected={task.toLocation}
                    onScan={(val) => {
                      if (norm(val) === norm(task.toLocation))
                        setDestScanned(true);
                      else toast.error("Wrong destination scanned");
                    }}
                  />
                </>
              ) : (
                <div className="space-y-3">
                  <ConfirmedStrip label="Destination" value={task.toLocation} />
                  <div className="rounded-md border border-border bg-muted/20 p-3 space-y-3">
                    <div className="text-[10px] font-semibold font-mono uppercase tracking-[0.06em] text-muted-foreground">
                      Move summary
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                          From
                        </div>
                        <div className="font-mono text-sm font-semibold">
                          {task.fromLocation}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                          To
                        </div>
                        <div className="font-mono text-sm font-semibold">
                          {task.toLocation}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                        Bin
                      </div>
                      <div className="font-mono text-sm font-semibold">
                        {task.binNo}
                      </div>
                    </div>
                  </div>
                  <Button className="h-11 w-full" onClick={complete}>
                    Confirm bin movement
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────

const norm = (v: string) => v.trim().toUpperCase();

function ConfirmedStrip({
  label,
  value,
  onClear,
}: {
  label: string;
  value: string;
  onClear?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-status-picked" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="ml-auto truncate font-mono text-xs font-semibold">
        {value}
      </span>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="ml-2 shrink-0 text-[10px] text-muted-foreground underline hover:text-foreground"
        >
          Change
        </button>
      )}
    </div>
  );
}

function SuggestRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.06em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 font-mono text-2xl font-semibold tracking-tight">
        {value}
      </div>
    </div>
  );
}

function FieldHeader({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

function ReadonlyField({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <FieldHeader icon={icon} label={label} />
      <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2.5">
        <span className={cn("text-sm font-semibold", mono && "font-mono")}>
          {value}
        </span>
        <span className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
          System
        </span>
      </div>
    </div>
  );
}

/** Validates against an expected value (task-driven flows). */
function ScanRow({
  label,
  placeholder,
  expected,
  onScan,
}: {
  label: string;
  placeholder: string;
  expected: string;
  onScan: (value: string) => void;
}) {
  const [val, setVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <ScanBarcode className="h-3.5 w-3.5 text-muted-foreground" />
        <label className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </label>
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
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder}
          className="h-11 font-mono text-sm"
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
        >
          Auto
        </Button>
      </form>
    </div>
  );
}

/** Accepts any non-empty input — used in ad-hoc flows. */
function FreeScanRow({
  label,
  demoValue,
  onScan,
}: {
  label: string;
  demoValue?: string;
  onScan: (value: string) => void;
}) {
  const [val, setVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <ScanBarcode className="h-3.5 w-3.5 text-muted-foreground" />
        <label className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </label>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!val.trim()) return;
          onScan(val.trim());
          setVal("");
          inputRef.current?.focus();
        }}
        className="flex gap-2"
      >
        <Input
          ref={inputRef}
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={demoValue ?? "Scan or type…"}
          className="h-11 font-mono text-sm"
        />
        {demoValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-11 px-2 text-xs"
            onClick={() => {
              onScan(demoValue);
              setVal("");
            }}
          >
            Auto
          </Button>
        )}
      </form>
    </div>
  );
}
