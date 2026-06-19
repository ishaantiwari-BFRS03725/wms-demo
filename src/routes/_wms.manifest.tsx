import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Layers,
  Printer,
  ScanBarcode,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
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
import { cn } from "@/lib/utils";
import {
  assignCombo,
  barcodePattern,
  channelStyles,
  comboKey,
  courierStyles,
  genManifestId,
  letterAt,
  type ManifestCombo,
} from "@/lib/wms/manifest-data";

export const Route = createFileRoute("/_wms/manifest")({
  head: () => ({
    meta: [{ title: "Manifest — WMS Outbound" }],
  }),
  component: ManifestModule,
});

interface Pile {
  letter: string;
  combo: ManifestCombo;
  awbs: string[];
}

interface ClosedManifest {
  id: string;
  letter: string;
  combo: ManifestCombo;
  awbs: string[];
  createdAt: Date;
}

interface LastScan {
  awb: string;
  combo: ManifestCombo;
  pileLetter: string;
  isNewPile: boolean;
}

function ManifestModule() {
  const [awbInput, setAwbInput] = useState("");
  const [scannedAwbs, setScannedAwbs] = useState<Set<string>>(new Set());
  const [piles, setPiles] = useState<Pile[]>([]);
  const [letterIdx, setLetterIdx] = useState(0);
  const [lastScan, setLastScan] = useState<LastScan | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [printQueue, setPrintQueue] = useState<ClosedManifest[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalScanned = useMemo(
    () => piles.reduce((sum, p) => sum + p.awbs.length, 0),
    [piles],
  );

  const handleScan = () => {
    const awb = awbInput.trim().toUpperCase();
    if (!awb) return;

    if (scannedAwbs.has(awb)) {
      setScanError(`AWB ${awb} already scanned in this session.`);
      setAwbInput("");
      inputRef.current?.focus();
      return;
    }
    setScanError(null);

    const combo = assignCombo(awb);
    const key = comboKey(combo);
    const existing = piles.find((p) => comboKey(p.combo) === key);

    let pileLetter: string;
    let isNewPile = false;
    if (existing) {
      pileLetter = existing.letter;
      setPiles((ps) =>
        ps.map((p) =>
          comboKey(p.combo) === key ? { ...p, awbs: [...p.awbs, awb] } : p,
        ),
      );
    } else {
      pileLetter = letterAt(letterIdx);
      isNewPile = true;
      setPiles((ps) => [...ps, { letter: pileLetter, combo, awbs: [awb] }]);
      setLetterIdx((i) => i + 1);
    }

    setScannedAwbs((s) => new Set(s).add(awb));
    setLastScan({ awb, combo, pileLetter, isNewPile });
    setAwbInput("");
    inputRef.current?.focus();
  };

  const closePile = (letter: string) => {
    const pile = piles.find((p) => p.letter === letter);
    if (!pile) return;
    const manifest: ClosedManifest = {
      id: genManifestId(),
      letter: pile.letter,
      combo: pile.combo,
      awbs: pile.awbs,
      createdAt: new Date(),
    };
    setPiles((ps) => ps.filter((p) => p.letter !== letter));
    setPrintQueue([manifest]);
  };

  const closeAll = () => {
    if (piles.length === 0) return;
    const manifests: ClosedManifest[] = piles.map((p) => ({
      id: genManifestId(),
      letter: p.letter,
      combo: p.combo,
      awbs: p.awbs,
      createdAt: new Date(),
    }));
    setPiles([]);
    setPrintQueue(manifests);
  };

  const dismissPrint = () => {
    setPrintQueue([]);
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-muted/40 py-4">
      <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-md border border-border bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 border-b border-border bg-background px-4 py-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          New Manifest
        </div>
        <div className="text-xs text-muted-foreground">
          Outbound · Manifest creation
        </div>
      </div>

      <div className="space-y-3 p-4">
        {/* Scan input */}
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
              <ScanBarcode className="h-3.5 w-3.5" />
              Scan AWB
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>
                <span className="font-mono font-semibold text-foreground">
                  {totalScanned}
                </span>{" "}
                scanned
              </span>
              <span className="text-border">·</span>
              <span>
                <span className="font-mono font-semibold text-foreground">
                  {piles.length}
                </span>{" "}
                {piles.length === 1 ? "pile" : "piles"}
              </span>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleScan();
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              autoFocus
              value={awbInput}
              onChange={(e) => setAwbInput(e.target.value)}
              placeholder="Scan AWB barcode…"
              className="h-12 flex-1 font-mono text-base"
            />
            <Button type="submit" className="h-12 px-6" disabled={!awbInput.trim()}>
              Add
            </Button>
          </form>
          {scanError && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm font-medium text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {scanError}
            </div>
          )}
        </Card>

        {/* Last scan flash */}
        {lastScan && (
          <Card
            className={cn(
              "space-y-3 border-2 p-4 transition-colors",
              lastScan.isNewPile
                ? "border-status-picked/40 bg-status-picked/5"
                : "border-primary/30 bg-primary/5",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                <CheckCircle2
                  className={cn(
                    "h-3.5 w-3.5",
                    lastScan.isNewPile ? "text-status-picked" : "text-primary",
                  )}
                />
                {lastScan.isNewPile ? "New pile created" : "Added to pile"}
              </div>
              <div className="font-mono text-[11px] text-muted-foreground">
                {lastScan.awb}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Big pile letter */}
              <div
                className={cn(
                  "flex h-16 w-16 shrink-0 items-center justify-center rounded-md border-2 text-3xl font-black",
                  lastScan.isNewPile
                    ? "border-status-picked/60 bg-status-picked/10 text-status-picked"
                    : "border-primary/40 bg-primary/10 text-primary",
                )}
              >
                {lastScan.pileLetter}
              </div>
              {/* Combo badges */}
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                <ChannelBadge channel={lastScan.combo.channel} />
                <CourierBadge courier={lastScan.combo.courier} />
                <SellerBadge seller={lastScan.combo.seller} />
              </div>
            </div>
          </Card>
        )}

        {/* Active piles header */}
        <div className="space-y-2 px-1 pt-1">
          <div>
            <div className="text-sm font-semibold">Active Shipment Cages</div>
            <div className="text-[11px] text-muted-foreground">
              Grouped by Seller + Channel + Courier
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-full"
            disabled={piles.length === 0}
            onClick={closeAll}
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Close All
          </Button>
        </div>

        {/* Piles grid */}
        {piles.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Scan an AWB to start building piles.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {piles.map((p) => (
              <PileCard key={p.letter} pile={p} onClose={closePile} />
            ))}
          </div>
        )}

      </div>

      {/* Print sticker dialog */}
      <Dialog open={printQueue.length > 0} onOpenChange={(o) => !o && dismissPrint()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              {printQueue.length > 1
                ? `${printQueue.length} manifest stickers`
                : "Manifest sticker"}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto">
            {printQueue.map((m) => (
              <ManifestSticker key={m.id} manifest={m} />
            ))}
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={dismissPrint}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Printed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

// ─── Cards & badges ───

function PileCard({
  pile,
  onClose,
}: {
  pile: Pile;
  onClose: (letter: string) => void;
}) {
  return (
    <Card className="flex items-center gap-3 p-2.5">
      {/* Pile letter */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-border bg-muted text-lg font-black">
        {pile.letter}
      </div>

      {/* Combo info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1 leading-tight">
          <ChannelBadge channel={pile.combo.channel} size="sm" />
          <CourierBadge courier={pile.combo.courier} size="sm" />
        </div>
        <div className="mt-0.5 truncate text-[11px] font-medium">
          {pile.combo.seller}
        </div>
      </div>

      {/* Count */}
      <div className="shrink-0 text-right">
        <div className="font-mono text-base font-bold leading-tight">
          {pile.awbs.length}
        </div>
        <div className="text-[9px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
          shpmts
        </div>
      </div>

      {/* Close action */}
      <Button
        size="sm"
        variant="outline"
        className="h-8 shrink-0 px-2 text-[11px]"
        onClick={() => onClose(pile.letter)}
      >
        Close
      </Button>
    </Card>
  );
}

function ChannelBadge({
  channel,
  size = "md",
}: {
  channel: ManifestCombo["channel"];
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "rounded-md border font-bold",
        channelStyles[channel],
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
      )}
    >
      {channel}
    </span>
  );
}

function CourierBadge({
  courier,
  size = "md",
}: {
  courier: ManifestCombo["courier"];
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border font-bold",
        courierStyles[courier],
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
      )}
    >
      <Truck className={cn(size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3")} />
      {courier}
    </span>
  );
}

function SellerBadge({ seller }: { seller: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
      <Layers className="h-3 w-3 text-muted-foreground" />
      {seller}
    </span>
  );
}

function ManifestSticker({ manifest }: { manifest: ClosedManifest }) {
  const bars = useMemo(() => barcodePattern(manifest.id), [manifest.id]);
  const created = manifest.createdAt.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return (
    <div className="rounded-md border-2 border-dashed border-border bg-background p-4">
      {/* Barcode + manifest ID — centred header */}
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
          {manifest.id}
        </div>
      </div>

      <div className="my-3 border-t border-dashed border-border" />

      {/* Hero — shipment count */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Shipments
        </span>
        <span className="font-mono text-5xl font-black leading-none">
          {manifest.awbs.length}
        </span>
      </div>

      <div className="my-3 border-t border-dashed border-border" />

      {/* Footer details — single column, label-aligned */}
      <dl className="space-y-1 text-xs">
        <StickerRow label="Seller" value={manifest.combo.seller} />
        <StickerRow label="Channel" value={manifest.combo.channel} />
        <StickerRow label="Courier" value={manifest.combo.courier} />
        <StickerRow label="Created" value={created} mono />
      </dl>
    </div>
  );
}

function StickerRow({
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
      <dd className={cn("flex-1 font-medium", mono && "font-mono")}>
        {value}
      </dd>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
