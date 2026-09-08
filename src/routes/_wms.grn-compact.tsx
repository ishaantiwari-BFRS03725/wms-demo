import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ClipboardList,
  Minus,
  Package,
  Plus,
  ScanBarcode,
  ScanText,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { boxConsignment, type BoxConsignment, type GrnItem } from "@/lib/wms/grn-data";

// Temporary demo/explainer screen only — the live /grn screen is untouched.
// This is the finalized compact layout for the item-QC panel (progressive
// disclosure won out over a tabbed alternative that was tried and dropped)
// so it fits small desktop stations on the floor, while keeping every
// existing detail: scan input, item image, batch/MRP/MFG/expiry and
// quantity. Meant to be shown to developers as the target to build.

export const Route = createFileRoute("/_wms/grn-compact")({
  head: () => ({
    meta: [{ title: "GRN QC · Compact Redesign — WMS" }],
  }),
  component: GrnCompactRedesign,
});

const DEMO_BOX_ID = "BOX-7F3A-001";
const REJECT_REASONS = ["Damaged", "Expired", "Torn", "Faded"] as const;

// Deterministic 13-digit EAN-like code from a SKU — demo data only, no real
// barcode registry behind it.
const eanFor = (sku: string): string => {
  let h = 0;
  for (let i = 0; i < sku.length; i++) h = (h * 31 + sku.charCodeAt(i)) >>> 0;
  const digits = String(h).padStart(12, "0").slice(-12);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += i % 2 === 0 ? Number(digits[i]) : Number(digits[i]) * 3;
  const check = (10 - (sum % 10)) % 10;
  return `${digits}${check}`;
};

type QcMode = "good" | "bad";

interface Batch {
  mrp: string;
  lot: string;
  mfg: string;
  expiry: string;
}
const emptyBatch: Batch = { mrp: "", lot: "", mfg: "", expiry: "" };

interface PendingItem {
  sku: string;
  name: string;
  expected: GrnItem;
}

interface LogRow {
  sku: string;
  name: string;
  image: string;
  mode: QcMode;
  reason?: string;
  batch?: Batch;
  qty: number;
}

interface ScreenProps {
  box: BoxConsignment;
  binLpn: string;
  onChangeLpn: (v: string) => void;
  pendingItem: PendingItem | null;
  qcQty: number;
  setQcQty: (n: number) => void;
  pendingMax: number;
  batch: Batch;
  setBatch: React.Dispatch<React.SetStateAction<Batch>>;
  batchReady: boolean;
  scanError: string | null;
  scanKey: number;
  onItemScan: (v: string) => void;
  ocrCapture: () => void;
  onConfirmGood: () => void;
  onRejectOpen: () => void;
  onZoom: () => void;
  qcItems: LogRow[];
  totals: { good: number; bad: number };
  imageOpen: boolean;
  setImageOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

function GrnCompactRedesign() {
  const box = useMemo(() => boxConsignment(DEMO_BOX_ID), []);
  const [binLpn, setBinLpn] = useState("GRN-BIN-014"); // demo bin — Good QC (WID)

  const [qcItems, setQcItems] = useState<LogRow[]>([]);
  const [pendingItem, setPendingItem] = useState<PendingItem | null>(null);
  const [qcQty, setQcQty] = useState(1);
  const [batch, setBatch] = useState<Batch>(emptyBatch);
  const [scanError, setScanError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [scanKey, setScanKey] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  const scannedBySku = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of qcItems) map[r.sku] = (map[r.sku] ?? 0) + r.qty;
    return map;
  }, [qcItems]);

  const batchReady = !!(batch.lot && batch.mfg && batch.expiry && batch.mrp);
  const pendingScanned = pendingItem ? (scannedBySku[pendingItem.sku] ?? 0) : 0;
  const pendingMax = pendingItem ? Math.max(1, pendingItem.expected.qty - pendingScanned) : 1;

  const totals = useMemo(() => {
    let good = 0;
    let bad = 0;
    for (const r of qcItems) {
      if (r.mode === "good") good += r.qty;
      else bad += r.qty;
    }
    return { good, bad };
  }, [qcItems]);

  const startNewItem = () => {
    setPendingItem(null);
    setQcQty(1);
    setBatch(emptyBatch);
    setImageOpen(false);
    setScanKey((k) => k + 1);
  };

  const onItemScan = (val: string) => {
    const sku = val.trim().toUpperCase();
    if (!sku) return;
    if (pendingItem) {
      setScanError("Finish QC on the current item first.");
      setScanKey((k) => k + 1);
      return;
    }
    const expected = box.items.find((it) => it.sku === sku);
    if (!expected) {
      setScanError(`${sku} is not part of this box (ASN ${box.asn}).`);
      setScanKey((k) => k + 1);
      return;
    }
    if ((scannedBySku[sku] ?? 0) >= expected.qty) {
      setScanError(`${sku} already fully QC'd for this box.`);
      setScanKey((k) => k + 1);
      return;
    }
    setScanError(null);
    setPendingItem({ sku, name: expected.name, expected });
    setQcQty(1);
    setBatch(emptyBatch);
    setImageOpen(false);
    setScanKey((k) => k + 1);
  };

  const ocrCapture = () => {
    if (!pendingItem) return;
    const e = pendingItem.expected;
    setBatch({ mrp: e.mrp, lot: e.lot, mfg: e.mfg, expiry: e.expiry });
  };

  const commitRow = (mode: QcMode, reason?: string) => {
    if (!pendingItem) return;
    const n = Math.min(Math.max(1, qcQty), pendingMax);
    const row: LogRow = {
      sku: pendingItem.sku,
      name: pendingItem.name,
      image: pendingItem.expected.image,
      mode,
      reason,
      batch: batchReady ? batch : undefined,
      qty: n,
    };
    setQcItems((prev) => {
      const key = (r: LogRow) => `${r.sku}|${r.mode}|${r.reason ?? ""}|${r.batch?.lot ?? ""}`;
      const existing = prev.find((r) => key(r) === key(row));
      // Newest / most-recently-touched row always goes to the front — the
      // operator should never have to scroll to see what they just scanned.
      if (existing) {
        const merged = { ...existing, qty: existing.qty + n };
        return [merged, ...prev.filter((r) => r !== existing)];
      }
      return [row, ...prev];
    });
    startNewItem();
  };

  const commitGood = () => commitRow("good");
  const confirmReject = () => {
    if (!rejectReason) return;
    commitRow("bad", rejectReason);
    setRejectOpen(false);
    setRejectReason("");
  };

  const shared: ScreenProps = {
    box,
    binLpn,
    onChangeLpn: (v: string) => setBinLpn(v.trim().toUpperCase()),
    pendingItem,
    qcQty,
    setQcQty,
    pendingMax,
    batch,
    setBatch,
    batchReady,
    scanError,
    scanKey,
    onItemScan,
    ocrCapture,
    onConfirmGood: commitGood,
    onRejectOpen: () => {
      setRejectReason("");
      setRejectOpen(true);
    },
    onZoom: () => setZoomOpen(true),
    qcItems,
    totals,
    imageOpen,
    setImageOpen,
  };

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center gap-1.5 text-sm font-semibold">
        <ClipboardList className="h-4 w-4 text-muted-foreground" />
        GRN · QC screen — compact redesign
      </div>

      <div className="flex flex-1 justify-center overflow-hidden">
        <CompactPanel>
          <DisclosureScreen {...shared} />
        </CompactPanel>
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
                <div className="font-mono text-sm font-semibold">
                  {Math.min(Math.max(1, qcQty), pendingMax)}
                </div>
              </div>
            </div>
            <Select value={rejectReason} onValueChange={setRejectReason}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select reason…" />
              </SelectTrigger>
              <SelectContent>
                {REJECT_REASONS.map((r) => (
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
    </div>
  );
}

function CompactPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full w-full max-w-[1160px] overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex h-full flex-col overflow-hidden">{children}</div>
    </div>
  );
}

function ScreenHeader({
  box,
  binLpn,
  onChangeLpn,
}: {
  box: BoxConsignment;
  binLpn: string;
  onChangeLpn: (v: string) => void;
}) {
  const [changing, setChanging] = useState(false);
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border bg-background px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold">
        <ScanBarcode className="h-3.5 w-3.5 text-muted-foreground" />
        GRN QC
      </div>
      {changing ? (
        <div className="flex w-64 items-center gap-1.5">
          <div className="min-w-0 flex-1">
            <ScanInputRow
              placeholder="Scan new LPN…"
              autoFocus
              onScan={(v) => {
                onChangeLpn(v);
                setChanging(false);
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => setChanging(false)}
            className="shrink-0 rounded border border-border bg-background px-2 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted/60"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
          <span>{box.boxId}</span>
          <span className="text-border">|</span>
          <span className="font-semibold text-status-picked">{binLpn}</span>
          <button
            type="button"
            onClick={() => setChanging(true)}
            className="flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted/60"
          >
            <ScanBarcode className="h-3 w-3" />
            Change LPN
          </button>
        </div>
      )}
    </div>
  );
}

function ScanInputRow({
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
        className="h-9 font-mono text-sm"
      />
    </form>
  );
}

function QuickScanChips({ box, onScan }: { box: BoxConsignment; onScan: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {box.items.map((it) => (
        <button
          key={it.sku}
          type="button"
          onClick={() => onScan(it.sku)}
          className="rounded-full border border-border bg-muted/40 px-2 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:bg-muted"
        >
          {it.sku}
        </button>
      ))}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-[11px] font-medium text-destructive">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </div>
  );
}

function QtyStepper({
  qty,
  max,
  onChange,
}: {
  qty: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="h-7 w-7"
        disabled={qty <= 1}
        onClick={() => onChange(Math.max(1, qty - 1))}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <span className="w-6 text-center font-mono text-xs font-bold tabular-nums">{qty}</span>
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="h-7 w-7"
        disabled={qty >= max}
        onClick={() => onChange(Math.min(max, qty + 1))}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}

function AttrLine({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-border/40 py-1 text-[11px] last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("truncate font-medium text-foreground", mono && "font-mono")}>
        {value}
      </span>
    </div>
  );
}

function AttrList({ item }: { item: PendingItem }) {
  return (
    <div>
      <AttrLine label="SKU" value={item.sku} mono />
      <AttrLine label="MRP" value={item.expected.mrp} />
      <AttrLine label="Size" value={item.expected.size} />
      <AttrLine label="Colour" value={item.expected.color} />
      <AttrLine label="Weight" value={item.expected.weight} />
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
      <label className="text-[9px] font-mono uppercase tracking-[0.05em] text-muted-foreground">
        {label}
      </label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        className="h-7 text-[11px]"
      />
    </div>
  );
}

function BatchGrid({
  batch,
  setBatch,
  onOcr,
  cols = 2,
}: {
  batch: Batch;
  setBatch: React.Dispatch<React.SetStateAction<Batch>>;
  onOcr: () => void;
  cols?: 2 | 4;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold font-mono uppercase tracking-[0.06em] text-muted-foreground">
          Batch / variant
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-6 px-1.5 text-[10px]"
          onClick={onOcr}
        >
          <ScanText className="mr-1 h-3 w-3" />
          OCR
        </Button>
      </div>
      <div className={cn("grid gap-1.5", cols === 4 ? "grid-cols-4" : "grid-cols-2")}>
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
    </div>
  );
}

function ItemThumb({
  src,
  alt,
  size = 56,
  onClick,
}: {
  src: string;
  alt: string;
  size?: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ width: size, height: size }}
      className="shrink-0 overflow-hidden rounded-md border border-border bg-muted/20"
    >
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    </button>
  );
}

function ConfirmFooter({
  pendingItem,
  batchReady,
  qty,
  onGood,
  onReject,
}: {
  pendingItem: PendingItem | null;
  batchReady: boolean;
  qty: number;
  onGood: () => void;
  onReject: () => void;
}) {
  if (!pendingItem) {
    return (
      <div className="border-t border-border bg-background px-3 py-2.5 text-center text-[11px] text-muted-foreground">
        Scan an item to begin QC
      </div>
    );
  }
  return (
    <div className="flex justify-end gap-2 border-t border-border bg-background p-2.5">
      <Button
        type="button"
        variant="outline"
        className="h-9 border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
        onClick={onReject}
      >
        <ThumbsDown className="mr-1.5 h-4 w-4" />
        Reject
      </Button>
      <Button
        type="button"
        className="h-9 bg-status-picked text-white hover:bg-status-picked/90"
        disabled={!batchReady}
        onClick={onGood}
      >
        <ThumbsUp className="mr-1.5 h-4 w-4" />
        Good{qty > 1 ? ` (${qty})` : ""}
      </Button>
    </div>
  );
}

// Full scanned-items table — desktop has the width to spare, so the log gets
// real columns instead of a squeezed list.
function LogTable({ rows }: { rows: LogRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="py-10 text-center text-[11px] text-muted-foreground">
        No items scanned yet
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-10 text-[10px]">Img</TableHead>
            <TableHead className="text-[10px]">EAN</TableHead>
            <TableHead className="text-[10px]">Description</TableHead>
            <TableHead className="text-[10px]">MRP</TableHead>
            <TableHead className="text-[10px]">Batch / Expiry</TableHead>
            <TableHead className="text-right text-[10px]">Qty</TableHead>
            <TableHead className="text-[10px]">QC</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i} className="text-xs [&>td]:py-1.5">
              <TableCell>
                <ItemThumb src={r.image} alt={r.name} size={28} />
              </TableCell>
              <TableCell className="font-mono text-muted-foreground">{eanFor(r.sku)}</TableCell>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell className="text-[11px] text-muted-foreground">
                {r.batch?.mrp ?? "—"}
              </TableCell>
              <TableCell className="text-[11px] text-muted-foreground">
                {r.batch ? `${r.batch.lot} · Exp ${r.batch.expiry}` : "—"}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{r.qty}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    "rounded-[2px] px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase",
                    r.mode === "good"
                      ? "bg-status-picked/15 text-status-picked"
                      : "bg-destructive/15 text-destructive",
                  )}
                >
                  {r.mode === "good" ? "Good" : (r.reason ?? "Bad")}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// A live scanned-items panel — used beside the progressive-disclosure column,
// where the freed-up desktop width goes to something useful instead of
// staying empty.
function LogPanel({
  qcItems,
  totals,
}: {
  qcItems: LogRow[];
  totals: { good: number; bad: number };
}) {
  return (
    <div className="flex flex-col rounded-md border border-border">
      <div className="flex items-center justify-between border-b border-border bg-neutral-200 px-3 py-2">
        <span className="text-[11px] font-semibold text-neutral-900">Scanned items</span>
        <div className="flex items-center gap-4 font-mono text-[10px]">
          <span className="text-neutral-600">
            Total scanned{" "}
            <span className="font-bold text-neutral-900">{totals.good + totals.bad}</span>
          </span>
          <span className="text-status-picked">
            Good <span className="font-bold">{totals.good}</span>
          </span>
          <span className="text-destructive">
            Bad <span className="font-bold">{totals.bad}</span>
          </span>
        </div>
      </div>
      {/* No internal scroll here on purpose — newest row is always prepended,
          so the operator sees what they just scanned without scrolling. */}
      <div className="p-2">
        <LogTable rows={qcItems} />
      </div>
    </div>
  );
}

// Progressive disclosure + always-visible scanned-items rail.
function DisclosureScreen(props: ScreenProps) {
  const {
    box,
    binLpn,
    onChangeLpn,
    pendingItem,
    qcQty,
    setQcQty,
    pendingMax,
    batch,
    setBatch,
    batchReady,
    scanError,
    scanKey,
    onItemScan,
    ocrCapture,
    onConfirmGood,
    onRejectOpen,
    onZoom,
    imageOpen,
    setImageOpen,
    qcItems,
    totals,
  } = props;

  return (
    <>
      <ScreenHeader box={box} binLpn={binLpn} onChangeLpn={onChangeLpn} />
      {/* Each column scrolls on its own — if the left column grows (an
          accordion opens), only it scrolls internally. The scanned-items
          rail on the right never has to, so the operator always sees it. */}
      <div className="flex flex-1 gap-3 overflow-hidden p-3">
        {/* Left: collapsible controls — starts almost empty */}
        <div className="w-[460px] shrink-0 space-y-2 overflow-y-auto">
          <ScanInputRow
            key={`scan-${scanKey}`}
            placeholder={pendingItem ? "Finish current item…" : "Scan item SKU…"}
            onScan={onItemScan}
            autoFocus
          />
          {!pendingItem && <QuickScanChips box={box} onScan={onItemScan} />}
          {scanError && <ErrorBanner message={scanError} />}

          {pendingItem && (
            <div key={`${pendingItem.sku}-${scanKey}`} className="space-y-2">
              <div className="overflow-hidden rounded-md border border-border">
                <button
                  type="button"
                  onClick={() => setImageOpen((o) => !o)}
                  className="flex w-full items-center gap-2 p-2 text-left"
                >
                  <ItemThumb src={pendingItem.expected.image} alt={pendingItem.name} size={112} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold leading-tight">
                      {pendingItem.name}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {pendingItem.sku}
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                      imageOpen && "rotate-180",
                    )}
                  />
                </button>
                {imageOpen && (
                  <button type="button" onClick={onZoom} className="block w-full">
                    <img
                      src={pendingItem.expected.image}
                      alt={pendingItem.name}
                      className="aspect-square w-full object-cover"
                    />
                  </button>
                )}
              </div>

              {/* Side by side, not stacked — the extra width buys back the
                  vertical space progressive disclosure is trying to save. */}
              <div className="flex gap-2">
                <Accordion
                  type="multiple"
                  defaultValue={["details"]}
                  className="min-w-0 flex-1 rounded-md border border-border px-2.5"
                >
                  <AccordionItem value="details" className="border-b-0">
                    <AccordionTrigger className="py-2 text-[12px] font-semibold">
                      Item details
                    </AccordionTrigger>
                    <AccordionContent className="pb-2 pt-0">
                      <AttrList item={pendingItem} />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <Accordion
                  type="multiple"
                  defaultValue={batchReady ? [] : ["batch"]}
                  className="min-w-0 flex-1 rounded-md border border-border px-2.5"
                >
                  <AccordionItem value="batch" className="border-b-0">
                    <AccordionTrigger className="py-2 text-[12px] font-semibold">
                      <span className="flex items-center gap-1.5">
                        Batch / variant
                        <Badge variant={batchReady ? "ok" : "warn"}>
                          {batchReady ? "captured" : "required"}
                        </Badge>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-2 pt-0">
                      <BatchGrid batch={batch} setBatch={setBatch} onOcr={ocrCapture} />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-2.5 py-1.5">
                <span className="text-[10px] font-semibold font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  Qty
                </span>
                <QtyStepper qty={qcQty} max={pendingMax} onChange={setQcQty} />
              </div>
            </div>
          )}
        </div>

        {/* Right: freed-up width goes to a live log instead of sitting empty */}
        <div className="min-w-0 flex-1 overflow-y-auto">
          <LogPanel qcItems={qcItems} totals={totals} />
        </div>
      </div>
      <ConfirmFooter
        pendingItem={pendingItem}
        batchReady={batchReady}
        qty={qcQty}
        onGood={onConfirmGood}
        onReject={onRejectOpen}
      />
    </>
  );
}
