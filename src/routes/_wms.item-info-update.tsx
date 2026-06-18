import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Camera,
  Hash,
  IndianRupee,
  Info,
  MapPin,
  PackageSearch,
  ScanBarcode,
  SquarePen,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_wms/item-info-update")({
  head: () => ({
    meta: [{ title: "Item Info Update — Inventory" }],
  }),
  component: ItemInfoUpdate,
});

interface BinItem {
  sku: string;
  name: string;
  image: string;
  qty: string;
  batchNo: string;
  mrp: string;
  expiryDate: string; // yyyy-mm-dd or ""
  mfgDate: string; // yyyy-mm-dd or ""
}

const BIN = "BIN-A12-402";

const BIN_ITEMS: BinItem[] = [
  {
    sku: "SKU-99201-WH",
    name: "boAt Airdopes 141 TWS Earbuds",
    image:
      "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=640&q=60",
    qty: "250",
    batchNo: "B-2024-X45",
    mrp: "1250.00",
    expiryDate: "2025-10-12",
    mfgDate: "2024-01-05",
  },
  {
    sku: "SKU-44023-BL",
    name: "boAt Rockerz 255 Neckband",
    image:
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=640&q=60",
    qty: "12",
    batchNo: "B-2023-Y02",
    mrp: "480.00",
    expiryDate: "",
    mfgDate: "",
  },
  {
    sku: "SKU-77312-RD",
    name: "boAt Stone 350 Speaker",
    image:
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=640&q=60",
    qty: "1020",
    batchNo: "B-2024-P99",
    mrp: "599.00",
    expiryDate: "2027-12-08",
    mfgDate: "2025-02-20",
  },
  {
    sku: "SKU-50118-GR",
    name: "boAt Wave Call Smartwatch",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=640&q=60",
    qty: "64",
    batchNo: "B-2024-K11",
    mrp: "1799.00",
    expiryDate: "2028-06-30",
    mfgDate: "2025-03-15",
  },
];

function ItemInfoUpdate() {
  // Operator must scan a location first — the screen starts empty until then.
  const [scannedBin, setScannedBin] = useState<string | null>(null);
  const [activeSku, setActiveSku] = useState<string | null>(null);
  // SKUs that already have an update request awaiting approval.
  const [pending, setPending] = useState<string[]>([]);

  const activeItem = BIN_ITEMS.find((i) => i.sku === activeSku) ?? null;

  // Step 1 — empty screen with only a Scan Location field.
  if (!scannedBin) {
    return (
      <div className="min-h-[calc(100vh-3rem)] bg-muted/40 py-4">
        <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-md border border-border bg-background">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
              <SquarePen className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">Item Info Update</div>
              <div className="text-[11px] text-muted-foreground">
                Scan a location to view its items.
              </div>
            </div>
          </div>

          <div className="p-4">
            <Card className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Scan location
              </div>
              <ScanLocationRow
                placeholder={BIN}
                expected={BIN}
                onScan={(val) => {
                  if (val.trim().toUpperCase() === BIN.toUpperCase()) {
                    setScannedBin(BIN);
                  } else {
                    toast.error("Location not found");
                  }
                }}
              />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (activeItem) {
    return (
      <EditForm
        item={activeItem}
        onExit={() => setActiveSku(null)}
        onSubmit={() => {
          setPending((p) => (p.includes(activeItem.sku) ? p : [...p, activeItem.sku]));
          setActiveSku(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-muted/40 py-4">
      <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-md border border-border bg-background">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
            <SquarePen className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">Item Info Update</div>
            <div className="text-[11px] text-muted-foreground">
              Request a change to batch information — applied after approval.
            </div>
          </div>
        </div>

        <div className="space-y-3 p-4">
          {/* Scanned location context */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Location
              </div>
              <button
                type="button"
                onClick={() => setScannedBin(null)}
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                Change
              </button>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2.5">
              <span className="font-mono text-sm font-semibold">{scannedBin}</span>
              <span className="rounded-[3px] border border-border bg-secondary px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-secondary-foreground">
                {BIN_ITEMS.length} Items
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
            <PackageSearch className="h-3.5 w-3.5" />
            Select an item to edit
          </div>

          {/* Item list */}
          <div className="space-y-2.5">
            {BIN_ITEMS.map((item) => {
              const isPending = pending.includes(item.sku);
              return (
                <Card
                  key={item.sku}
                  className={cn(
                    "p-3",
                    isPending && "opacity-70",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                        Item Number
                      </div>
                      <div className="truncate font-mono text-base font-semibold">
                        {item.sku}
                      </div>
                    </div>
                    {isPending ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-[3px] border border-status-packed/30 bg-status-packed/15 px-2 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em] text-status-packed">
                        <Clock className="h-3 w-3" />
                        Pending approval
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 shrink-0 gap-1.5 px-2.5 text-xs"
                        onClick={() => setActiveSku(item.sku)}
                      >
                        <SquarePen className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    )}
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
                    <Cell label="Quantity" value={`${item.qty} Units`} />
                    <Cell label="Batch No" value={item.batchNo} mono />
                    <Cell label="MRP" value={`INR ${item.mrp}`} />
                    <Cell
                      label="Expiry Date"
                      value={item.expiryDate || "—"}
                      mono
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScanLocationRow({
  placeholder,
  expected,
  onScan,
}: {
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
          Scan or enter location
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

function Cell({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      <div className={cn("font-medium", mono && "font-mono")}>{value}</div>
    </div>
  );
}

function EditForm({
  item,
  onExit,
  onSubmit,
}: {
  item: BinItem;
  onExit: () => void;
  onSubmit: () => void;
}) {
  const [batchNo, setBatchNo] = useState(item.batchNo);
  const [mrp, setMrp] = useState(item.mrp);
  const [expiryDate, setExpiryDate] = useState(item.expiryDate);
  const [mfgDate, setMfgDate] = useState(item.mfgDate);
  const [photo, setPhoto] = useState<{ name: string; url: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const changed = useMemo(
    () =>
      batchNo !== item.batchNo ||
      mrp !== item.mrp ||
      expiryDate !== item.expiryDate ||
      mfgDate !== item.mfgDate,
    [batchNo, mrp, expiryDate, mfgDate, item],
  );

  const canSubmit = changed && !!photo;

  const submit = () => {
    if (!changed) {
      toast.error("No changes to submit");
      return;
    }
    if (!photo) {
      toast.error("A photo of the item is required");
      return;
    }
    toast.success("Update request submitted for approval");
    onSubmit();
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-muted/40 py-4">
      <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-md border border-border bg-background">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Items
          </button>
          <div className="text-right">
            <div className="text-sm font-semibold">Edit Item Details</div>
            <div className="text-[11px] text-muted-foreground">Update request</div>
          </div>
        </div>

        <div className="space-y-4 p-4 pb-6">
          {/* Item banner */}
          <div className="relative overflow-hidden rounded-md border border-border bg-muted/30">
            <img
              src={item.image}
              alt={item.name}
              className="h-28 w-full object-cover"
              loading="lazy"
            />
            <div className="space-y-0.5 p-3">
              <div className="text-sm font-semibold leading-snug">{item.name}</div>
              <div className="font-mono text-[11px] text-muted-foreground">
                SKU: {item.sku} · {BIN}
              </div>
            </div>
          </div>

          <EditField icon={Hash} label="Batch Number">
            <Input
              value={batchNo}
              onChange={(e) => setBatchNo(e.target.value)}
              className="h-11 font-mono text-sm"
            />
          </EditField>

          <EditField icon={IndianRupee} label="Maximum Retail Price (MRP)">
            <Input
              inputMode="decimal"
              value={mrp}
              onChange={(e) => setMrp(e.target.value.replace(/[^0-9.]/g, ""))}
              className="h-11 font-mono text-sm"
            />
          </EditField>

          <EditField icon={CalendarClock} label="Expiry Date">
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="h-11 font-mono text-sm"
            />
          </EditField>

          <EditField icon={Calendar} label="Manufacturing Date">
            <Input
              type="date"
              value={mfgDate}
              onChange={(e) => setMfgDate(e.target.value)}
              className="h-11 font-mono text-sm"
            />
          </EditField>

          {/* Mandatory item photo */}
          <EditField icon={Camera} label="Item Photo (Required)">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setPhoto({ name: file.name, url: URL.createObjectURL(file) });
              }}
            />
            {photo ? (
              <div className="relative overflow-hidden rounded-md border border-border">
                <img
                  src={photo.url}
                  alt="Item photo"
                  className="h-40 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1.5 border-t border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-status-picked" />
                  <span className="truncate">{photo.name}</span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
              >
                <Camera className="h-6 w-6" />
                <span className="text-xs font-medium">Take or upload a photo</span>
                <span className="text-[10px]">Required before submitting</span>
              </button>
            )}
          </EditField>

          {/* Approval note */}
          <div className="flex gap-2.5 rounded-md border border-border bg-muted/30 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              Modified batch information will be sent for approval. A photo of the
              physical item is mandatory. Please ensure documentation matches
              physical labels.
            </p>
          </div>

          <Button className="h-12 w-full gap-2" disabled={!canSubmit} onClick={submit}>
            <CheckCircle2 className="h-4 w-4" />
            Submit for approval
          </Button>
          {changed && !photo ? (
            <p className="text-center text-[11px] text-muted-foreground">
              <Camera className="mr-0.5 inline h-3 w-3" />
              Add a photo of the item to enable submission.
            </p>
          ) : canSubmit ? (
            <p className="text-center text-[11px] text-muted-foreground">
              <ChevronRight className="mr-0.5 inline h-3 w-3" />
              Request goes to the approver — inventory updates only once approved.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EditField({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      {children}
    </div>
  );
}
