import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
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
  ScanBarcode,
  Tags,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_wms/item-movement")({
  head: () => ({
    meta: [{ title: "Item Movement — Inventory" }],
  }),
  component: ItemMovement,
});

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

// What gets captured is driven by the SKU/item, not the task. Each SKU
// declares which batch-level attributes must be recorded on movement.
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

function ItemMovement() {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<string[]>([]);

  const activeTask = TASKS.find((t) => t.id === activeTaskId) ?? null;
  const openTasks = TASKS.filter((t) => !doneIds.includes(t.id));

  if (activeTask) {
    return (
      <MovementFlow
        task={activeTask}
        onExit={() => setActiveTaskId(null)}
        onComplete={() => {
          setDoneIds((prev) =>
            prev.includes(activeTask.id) ? prev : [...prev, activeTask.id],
          );
          setActiveTaskId(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-muted/40 py-4">
      <div className="mx-auto w-full max-w-[420px] space-y-3">
        <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">Item Movement</div>
              <div className="text-[11px] text-muted-foreground">
                Tap a task to start. Bins and items are system-suggested.
              </div>
            </div>
          </div>
          <div className="divide-y divide-border">
            {openTasks.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <CheckCircle2 className="h-7 w-7 text-status-picked" />
                <div className="text-sm font-medium">All tasks completed</div>
                <div className="text-[11px] text-muted-foreground">
                  No pending movement tasks.
                </div>
              </div>
            ) : (
              openTasks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTaskId(t.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">
                        {t.id}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {t.reason}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                      <span className="font-mono font-medium">{t.fromBin}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono font-medium">{t.toBin}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type Stage =
  | "from-bin"
  | "to-bin"
  | "item"
  | "qty"
  | "batch"
  | "expiry"
  | "mfg"
  | "mrp"
  | "confirm"
  | "done";

function MovementFlow({
  task,
  onExit,
  onComplete,
}: {
  task: MovementTask;
  onExit: () => void;
  onComplete: () => void;
}) {
  // What gets captured is decided by the SKU, not the task.
  const cap = captureFor(task.sku);

  // Scan-driven flow: From bin → To bin → Item (qty + batch details). The
  // movement is committed the moment the item details are completed.
  const stages = useMemo<Stage[]>(
    () => ["from-bin", "to-bin", "item"],
    [],
  );

  const [stageIdx, setStageIdx] = useState(0);
  const stage = stages[stageIdx];
  const next = () => setStageIdx((i) => Math.min(i + 1, stages.length - 1));

  const complete = () => {
    toast.success("Item moved successfully");
    onComplete();
  };

  const [itemScanned, setItemScanned] = useState(false);
  const [qty, setQty] = useState(String(task.suggestedQty));

  // Does the item screen need a details panel after scanning?
  const needsDetails =
    task.allowQty || cap.batch || cap.expiry || cap.mfg || cap.mrp;

  // Batch-level details are system-populated, so the only operator input
  // that can block completion is the quantity.
  const detailsComplete = !task.allowQty || (!!qty && Number(qty) > 0);

  const stepNo = stageIdx + 1;
  const totalSteps = stages.length;

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-muted/40 py-4">
      <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-xl border border-border bg-background shadow-sm">
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
          <div className="text-right">
            <div className="text-sm font-semibold">{task.id}</div>
            <div className="text-[11px] text-muted-foreground">
              {`Step ${stepNo} of ${totalSteps}`}
            </div>
          </div>
        </div>

        <div className="p-4 pb-6">
          {/* Suggested route strip — always visible during the flow */}
          {
            <div className="mb-3 grid grid-cols-2 gap-1.5">
              <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-1.5 text-[11px]">
                <ArrowUpFromLine className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  From
                </span>
                <span className="ml-auto truncate font-mono font-semibold">
                  {task.fromBin}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-1.5 text-[11px]">
                <ArrowDownToLine className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  To
                </span>
                <span className="ml-auto truncate font-mono font-semibold">
                  {task.toBin}
                </span>
              </div>
            </div>
          }

          {/* Step 1 — Scan From Bin */}
          {stage === "from-bin" ? (
            <Card className="space-y-3 p-4">
              <SuggestRow icon={MapPin} label="Go to From bin" value={task.fromBin} />
              <ScanRow
                label="Scan From bin"
                placeholder={task.fromBin}
                expected={task.fromBin}
                onScan={(val) => {
                  if (norm(val) === norm(task.fromBin)) next();
                  else toast.error("Wrong From bin scanned");
                }}
              />
            </Card>
          ) : null}

          {/* Step 2 — Scan To Bin */}
          {stage === "to-bin" ? (
            <Card className="space-y-3 p-4">
              <SuggestRow icon={MapPin} label="Go to To bin" value={task.toBin} />
              <ScanRow
                label="Scan To bin"
                placeholder={task.toBin}
                expected={task.toBin}
                onScan={(val) => {
                  if (norm(val) === norm(task.toBin)) next();
                  else toast.error("Wrong To bin scanned");
                }}
              />
            </Card>
          ) : null}

          {/* Step 3 — Scan Item barcode */}
          {stage === "item" ? (
            <Card className="space-y-3 p-4">
              <div className="overflow-hidden rounded-md border border-border bg-muted/30">
                <img
                  src={task.image}
                  alt={task.name}
                  className="h-32 w-full object-cover"
                  loading="lazy"
                />
                <div className="space-y-1 p-3">
                  <div className="text-sm font-semibold leading-snug">
                    {task.name}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {task.sku}
                  </div>
                </div>
              </div>
              {!itemScanned ? (
                <ScanRow
                  label="Scan item barcode"
                  placeholder={task.sku}
                  expected={task.sku}
                  onScan={(val) => {
                    if (norm(val) !== norm(task.sku)) {
                      toast.error("Wrong item scanned");
                      return;
                    }
                    if (needsDetails) setItemScanned(true);
                    else complete();
                  }}
                />
              ) : (
                <div className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-status-picked">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Item scanned
                  </div>

                  {/* Quantity (if allowed) */}
                  {task.allowQty ? (
                    <div className="space-y-2">
                      <FieldHeader icon={Hash} label="Quantity to move" />
                      <p className="text-[11px] text-muted-foreground">
                        Suggested{" "}
                        <span className="font-semibold text-foreground">
                          {task.suggestedQty}
                        </span>{" "}
                        units.
                      </p>
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
                  ) : null}

                  {/* Batch-level details — system-populated, shown so the
                      operator can verify before confirming. */}
                  {cap.batch ? (
                    <ReadonlyField
                      icon={Tags}
                      label="Batch being moved"
                      value={cap.batchNo ?? "—"}
                      mono
                    />
                  ) : null}
                  {cap.expiry ? (
                    <ReadonlyField
                      icon={CalendarClock}
                      label="Expiry date"
                      value={cap.expiryDate ?? "—"}
                    />
                  ) : null}
                  {cap.mfg ? (
                    <ReadonlyField
                      icon={Calendar}
                      label="Manufacturing date"
                      value={cap.mfgDate ?? "—"}
                    />
                  ) : null}
                  {cap.mrp ? (
                    <ReadonlyField
                      icon={IndianRupee}
                      label="MRP"
                      value={cap.mrpValue ?? "—"}
                      mono
                    />
                  ) : null}

                  <Button
                    className="h-11 w-full"
                    disabled={!detailsComplete}
                    onClick={() => {
                      if (task.allowQty && Number(qty) > task.suggestedQty) {
                        toast.error("Quantity exceeds the suggested amount");
                        return;
                      }
                      complete();
                    }}
                  >
                    Confirm movement
                  </Button>
                </div>
              )}
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const norm = (v: string) => v.trim().toUpperCase();

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
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
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
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
        <span
          className={cn("text-sm font-semibold", mono && "font-mono")}
        >
          {value}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          System
        </span>
      </div>
    </div>
  );
}

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
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
