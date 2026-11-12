import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  Check,
  Printer,
  ScanLine,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { BoxLabel } from "@/components/wms/pre-grn-boxes";
import { cn } from "@/lib/utils";
import {
  CATALOGUE,
  FRESH_ASNS,
  boxIdExists,
  buildQrPayload,
  formatBoxId,
  interpretScan,
  listPreGrnDocs,
  nextBoxSerial,
  nextLotId,
  nextPreGrnId,
  nowStamp,
  savePreGrnDoc,
  simulateOcr,
  type BoxRecord,
  type CaptureFill,
  type FreshAsn,
  type LotEntry,
} from "@/lib/wms/pre-grn-data";

export const Route = createFileRoute("/_wms/pre-grn/new")({
  head: () => ({
    meta: [{ title: "New Pre-GRN — Inbound" }],
  }),
  component: NewPreGrnPage,
});

const OPERATOR = "R. Mehta";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const parseLotDate = (s: string): number | null => {
  const m = s.trim().match(/^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})$/);
  if (!m) return null;
  const mi = MONTHS.findIndex((x) => x.toLowerCase() === m[2].toLowerCase());
  if (mi < 0) return null;
  return new Date(Number(m[3]), mi, Number(m[1])).getTime();
};

const money = (s: string) => s.replace(/[^0-9]/g, "");

interface Capture {
  sku: string;
  caseSize: string;
  batch: string;
  mrp: string;
  mfg: string;
  expiry: string;
  boxCount: string;
  sellerCodes: string[];
  sources: string[];
}

const emptyCapture: Capture = {
  sku: "",
  caseSize: "",
  batch: "",
  mrp: "",
  mfg: "",
  expiry: "",
  boxCount: "",
  sellerCodes: [],
  sources: [],
};

function NewPreGrnPage() {
  const navigate = useNavigate();
  const [asnId, setAsnId] = useState("");
  const [lots, setLots] = useState<LotEntry[]>([]);
  const [boxes, setBoxes] = useState<BoxRecord[]>([]);
  const [cap, setCap] = useState<Capture>(emptyCapture);
  const [scan, setScan] = useState("");
  const [trail, setTrail] = useState<{ text: string; ok: boolean }[]>([]);
  const [preview, setPreview] = useState<BoxRecord[] | null>(null);
  const [lineSearch, setLineSearch] = useState("");
  const scanRef = useRef<HTMLInputElement>(null);

  const asn = FRESH_ASNS.find((a) => a.asnId === asnId);
  const cat = cap.sku ? CATALOGUE[cap.sku] : undefined;
  const size = Number(cap.caseSize) || 0;
  const count = cap.sellerCodes.length || Number(cap.boxCount) || 0;
  const qty = size * count;

  // Qty already pre-GRN'd against this ASN — earlier documents plus this session.
  const priorQty = useMemo(() => {
    const map = new Map<string, number>();
    if (!asn) return map;
    listPreGrnDocs()
      .filter((d) => d.asnId === asn.asnId)
      .forEach((d) => d.lots.forEach((l) => map.set(l.sku, (map.get(l.sku) ?? 0) + l.qty)));
    lots.forEach((l) => map.set(l.sku, (map.get(l.sku) ?? 0) + l.qty));
    return map;
  }, [asn, lots]);

  const poLines = useMemo(() => {
    if (!asn) return [];
    return asn.lines.map((l) => {
      const done = priorQty.get(l.sku) ?? 0;
      return { ...l, done, remaining: Math.max(0, l.orderedQty - done) };
    });
  }, [asn, priorQty]);

  const visibleLines = useMemo(() => {
    const q = lineSearch.trim().toLowerCase();
    if (!q) return poLines;
    return poLines.filter((l) =>
      `${l.sku} ${CATALOGUE[l.sku].name} ${CATALOGUE[l.sku].ean}`.toLowerCase().includes(q),
    );
  }, [poLines, lineSearch]);

  const remainingFor = (sku: string) => poLines.find((l) => l.sku === sku)?.remaining ?? 0;

  const errors = useMemo(() => {
    const e: string[] = [];
    if (!asn) return ["Select a Fresh ASN to begin."];
    if (!cap.sku) return ["Scan a SKU, box EAN or seller QR to start a lot."];
    const line = asn.lines.find((l) => l.sku === cap.sku);
    if (!line) e.push(`${cap.sku} is not on ${asn.poNumber} — lot cannot be confirmed.`);
    if (!size) e.push("Select a case size from the catalogue.");
    if (cat?.mandatory.batch && !cap.batch.trim()) e.push("Batch is mandatory for this SKU.");
    if (cat?.mandatory.mrp && !cap.mrp.trim()) e.push("MRP is mandatory for this SKU.");
    if (cap.mfg && cap.expiry) {
      const m = parseLotDate(cap.mfg);
      const x = parseLotDate(cap.expiry);
      if (m !== null && x !== null && x <= m) {
        e.push("Expiry must be later than the manufacturing date.");
      }
    }
    if (
      line?.expectedBatch &&
      cap.batch.trim().toUpperCase() !== line.expectedBatch.toUpperCase()
    ) {
      e.push(`Batch does not match the PO — ${line.expectedBatch} expected.`);
    }
    if (line && cap.mrp.trim() && money(cap.mrp) !== money(line.expectedMrp)) {
      e.push(`MRP does not match the PO — ${line.expectedMrp} expected.`);
    }
    if (!cap.sellerCodes.length) {
      const n = Number(cap.boxCount);
      if (!cap.boxCount.trim() || !Number.isInteger(n) || n <= 0) {
        e.push("Box count must be a positive whole number.");
      }
    }
    const dupe = cap.sellerCodes.find((c) => boxIdExists(c) || boxes.some((b) => b.boxId === c));
    if (dupe) e.push(`Seller box code ${dupe} already exists in the system.`);
    if (qty > remainingFor(cap.sku)) {
      e.push(
        `Quantity ${qty} exceeds the PO remaining ${remainingFor(cap.sku)} — no tolerance allowed.`,
      );
    }
    return e;
  }, [asn, cap, cat, size, qty, boxes, poLines]);

  const note = (text: string, ok: boolean) => setTrail((t) => [{ text, ok }, ...t].slice(0, 6));

  const applyFill = (fill: CaptureFill) =>
    setCap((c) => ({
      ...c,
      caseSize: fill.caseSize ? String(fill.caseSize) : c.caseSize,
      batch: fill.batch ?? c.batch,
      mrp: fill.mrp ?? c.mrp,
      mfg: fill.mfg ?? c.mfg,
      expiry: fill.expiry ?? c.expiry,
    }));

  const addSource = (s: string) =>
    setCap((c) => (c.sources.includes(s) ? c : { ...c, sources: [...c.sources, s] }));

  const handleScan = (raw: string) => {
    if (!asn) {
      toast.error("Select an ASN before scanning.");
      return;
    }
    const value = raw.trim();
    if (!value) return;
    setScan("");
    const res = interpretScan(value, asn);

    switch (res.kind) {
      case "sku": {
        const sizes = CATALOGUE[res.sku].activeCaseSizes;
        setCap((c) =>
          c.sku === res.sku
            ? c
            : {
                ...emptyCapture,
                sku: res.sku,
                caseSize: sizes.length === 1 ? String(sizes[0]) : "",
                sources: ["scan"],
              },
        );
        note(`${res.sku} recognised — SKU set`, true);
        break;
      }
      case "qr": {
        setCap((c) => ({
          ...(c.sku === res.sku ? c : { ...emptyCapture, sku: res.sku }),
          sources: [],
        }));
        applyFill(res.fill);
        addSource("seller QR");
        note(`Seller QR read — filled ${res.filled.join(", ")}`, true);
        break;
      }
      case "qr-unsupported":
        note("QR does not match the seller's format — nothing filled", false);
        toast.error("QR format not recognised for this seller", {
          description: "Capture the attributes another way — type them or scan the batch barcode.",
        });
        break;
      case "batch-barcode":
        if (!cap.sku) {
          note("Batch barcode scanned before a SKU — scan the SKU first", false);
          toast.error("Scan the SKU or box EAN first.");
          break;
        }
        applyFill(res.fill);
        addSource("barcode");
        note(`Batch barcode read — filled ${res.filled.join(", ")}`, true);
        break;
      case "seller-box-code":
        if (!cap.sku) {
          note("Seller box code scanned before a SKU", false);
          toast.error("Scan the SKU or box EAN first.");
          break;
        }
        if (cap.sellerCodes.includes(res.code)) {
          note(`${res.code} already scanned for this lot`, false);
          break;
        }
        setCap((c) => ({ ...c, sellerCodes: [...c.sellerCodes, res.code], boxCount: "" }));
        addSource("seller box code");
        note(`${res.code} added as a Box ID — no label will print`, true);
        break;
      case "sku-off-po":
        note(`${res.sku} is not on ${asn.poNumber} — rejected`, false);
        toast.error(`${res.sku} is not on ${asn.poNumber}`, {
          description: "Off-PO material is rejected; no labels are printed.",
        });
        break;
      case "wrong-type":
        note(`${res.scannedType} scanned here — wrong barcode type`, false);
        toast.error(`That is a ${res.scannedType}`, {
          description: "This field expects a SKU, EAN, seller QR, batch barcode or box code.",
        });
        break;
      default:
        note(`"${value}" not recognised`, false);
        toast.error("Scan not recognised.");
    }
    scanRef.current?.focus();
  };

  const runOcr = () => {
    if (!asn || !cap.sku) {
      toast.error("Scan the SKU or box EAN first.");
      return;
    }
    applyFill(simulateOcr(asn, cap.sku));
    addSource("OCR");
    note("Label photo read by OCR — review every value", true);
    toast.info("OCR read the label", {
      description: "Check each value and correct it before confirming the lot.",
    });
  };

  const makeLot = (
    a: FreshAsn,
    sku: string,
    caseSize: number,
    batch: string,
    mrp: string,
    mfg: string,
    expiry: string,
    boxCount: number,
    sellerCodes: string[],
    source: string,
  ) => {
    const lotId = nextLotId();
    const createdAt = nowStamp();
    const useSellerCodes = sellerCodes.length > 0;
    const boxIds = useSellerCodes
      ? sellerCodes
      : Array.from({ length: boxCount }, () =>
          formatBoxId(a, sku, caseSize, batch, nextBoxSerial(sku, caseSize, batch)),
        );
    const lot: LotEntry = {
      id: lotId,
      sku,
      skuName: CATALOGUE[sku].name,
      caseSize,
      batch,
      mrp,
      mfg,
      expiry,
      boxCount: boxIds.length,
      qty: boxIds.length * caseSize,
      sellerCode: useSellerCodes,
      source,
      boxIds,
      createdAt,
      createdBy: OPERATOR,
    };
    const newBoxes: BoxRecord[] = boxIds.map((boxId) => ({
      boxId,
      preGrnId: "",
      lotId,
      asnId: a.asnId,
      poNumber: a.poNumber,
      sku,
      skuName: CATALOGUE[sku].name,
      caseSize,
      batch,
      mrp,
      mfg,
      expiry,
      sellerCode: useSellerCodes,
      status: "Open",
      printedCount: useSellerCodes ? 0 : 1,
      history: [
        {
          event: "Created",
          at: createdAt,
          by: OPERATOR,
          detail: useSellerCodes ? "Seller box code used as Box ID" : `Captured via ${source}`,
        },
        ...(useSellerCodes
          ? []
          : [{ event: "Printed", at: createdAt, by: OPERATOR, detail: "Label printed" }]),
      ],
    }));
    return { lot, newBoxes };
  };

  const confirmLot = () => {
    if (!asn || errors.length) return;
    const source = cap.sources.length ? cap.sources.join(" + ") : "manual";
    const { lot, newBoxes } = makeLot(
      asn,
      cap.sku,
      size,
      cap.batch.trim(),
      cap.mrp.trim(),
      cap.mfg.trim(),
      cap.expiry.trim(),
      Number(cap.boxCount),
      cap.sellerCodes,
      source,
    );
    setLots((l) => [...l, lot]);
    setBoxes((b) => [...b, ...newBoxes]);
    setCap(emptyCapture);
    setTrail([]);
    if (lot.sellerCode) {
      toast.success(`${lot.boxCount} seller box codes registered`, {
        description: "No labels printed — the boxes already carry unique codes.",
      });
    } else {
      setPreview(newBoxes);
    }
  };

  const complete = () => {
    if (!asn || !lots.length) return;
    const id = nextPreGrnId();
    savePreGrnDoc(
      {
        id,
        asnId: asn.asnId,
        poNumber: asn.poNumber,
        seller: asn.seller,
        warehouseId: asn.warehouseId,
        status: "Open",
        lots,
        boxCount: lots.reduce((s, l) => s + l.boxCount, 0),
        totalQty: lots.reduce((s, l) => s + l.qty, 0),
        createdBy: OPERATOR,
        createdAt: nowStamp(),
      },
      boxes.map((b) => ({ ...b, preGrnId: id })),
    );
    toast.success(`${id} created`, {
      description: `${lots.length} lots · ${lots.reduce((s, l) => s + l.boxCount, 0)} boxes ready for GRN.`,
    });
    navigate({ to: "/pre-grn" });
  };

  // Demo stand-in for a hardware scanner: reads the label of the next lot still
  // owed on the PO — the seller's QR when they have a configured format, the
  // plain SKU code otherwise.
  const demoScan = () => {
    if (!asn) return;
    const line =
      poLines.find((l) => l.remaining > 0 && !lots.some((x) => x.sku === l.sku)) ??
      poLines.find((l) => l.remaining > 0);
    if (!line) {
      toast.error("Every PO line on this ASN is fully pre-GRN'd.");
      return;
    }
    const sku = cap.sku || line.sku;
    handleScan(asn.hasQrFormat ? buildQrPayload(asn, sku) : sku);
  };

  return (
    <div>
      <div className="border-b border-border bg-background px-6 py-5">
        <Link
          to="/pre-grn"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pre-GRNs
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">New Pre-GRN</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Capture each lot once, then issue one Box ID label per box for GRN to scan.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={asnId}
              onValueChange={(v) => {
                setAsnId(v);
                setLots([]);
                setBoxes([]);
                setCap(emptyCapture);
                setTrail([]);
              }}
            >
              <SelectTrigger className="h-9 w-[260px]">
                <SelectValue placeholder="Select a Fresh ASN" />
              </SelectTrigger>
              <SelectContent>
                {FRESH_ASNS.map((a) => (
                  <SelectItem key={a.asnId} value={a.asnId}>
                    {a.asnId} · {a.seller}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="h-9 gap-1.5" disabled={!lots.length} onClick={complete}>
              <Check className="h-3.5 w-3.5" />
              Complete Pre-GRN
            </Button>
          </div>
        </div>
      </div>

      {!asn ? (
        <div className="p-6">
          <div className="rounded-md border border-dashed border-border bg-card py-16 text-center text-sm text-muted-foreground">
            Select a Fresh (Case Pack) ASN to start a Pre-GRN.
          </div>
        </div>
      ) : (
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap gap-x-8 gap-y-2 rounded-md border border-border bg-muted/30 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.06em]">
            <Meta label="Seller" value={asn.seller} />
            <Meta label="PO" value={asn.poNumber} />
            <Meta label="Warehouse" value={asn.warehouseId} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_440px]">
            <div className="space-y-4">
              <Card className="overflow-hidden">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-5 py-3">
                  <div>
                    <h2 className="text-sm font-semibold">PO lines</h2>
                    <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                      Quantity is matched against the remaining qty before any label prints
                    </p>
                  </div>
                  <div className="relative w-full max-w-xs">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={lineSearch}
                      onChange={(e) => setLineSearch(e.target.value)}
                      placeholder="Search SKU or product…"
                      className="h-9 pl-8"
                    />
                    {lineSearch && (
                      <button
                        type="button"
                        onClick={() => setLineSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Ordered</TableHead>
                      <TableHead className="text-right">Pre-GRN'd</TableHead>
                      <TableHead className="text-right">Remaining</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleLines.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-10 text-center text-sm text-muted-foreground"
                        >
                          No PO lines match "{lineSearch}".
                        </TableCell>
                      </TableRow>
                    ) : (
                      visibleLines.map((l) => (
                        <TableRow key={l.sku} className={cn(cap.sku === l.sku && "bg-ai-bg/40")}>
                          <TableCell>
                            <div className="font-mono text-xs">{l.sku}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {CATALOGUE[l.sku].name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{l.orderedQty}</TableCell>
                          <TableCell className="text-right tabular-nums">{l.done}</TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {l.remaining}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>

              <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                  <div>
                    <h2 className="text-sm font-semibold">Lots in this Pre-GRN</h2>
                    <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                      {lots.length} lots · {lots.reduce((s, l) => s + l.boxCount, 0)} boxes ·{" "}
                      {lots.reduce((s, l) => s + l.qty, 0)} units
                    </p>
                  </div>
                  {lots.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={() => setPreview(boxes.filter((b) => !b.sellerCode))}
                    >
                      <Printer className="h-3.5 w-3.5" />
                      All labels
                    </Button>
                  )}
                </div>
                {lots.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    No lots captured yet.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Lot</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Case</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead className="text-right">Boxes</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>Captured via</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lots.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="font-mono text-xs">{l.id}</TableCell>
                          <TableCell className="font-mono text-xs">{l.sku}</TableCell>
                          <TableCell className="text-right tabular-nums">{l.caseSize}</TableCell>
                          <TableCell className="font-mono text-xs">{l.batch || "—"}</TableCell>
                          <TableCell className="whitespace-nowrap font-mono text-xs">
                            {l.expiry || "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{l.boxCount}</TableCell>
                          <TableCell className="text-right tabular-nums">{l.qty}</TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">
                            {l.source}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </div>

            <Card className="h-fit overflow-hidden">
              <div className="border-b border-border px-5 py-3">
                <h2 className="text-sm font-semibold">Capture lot</h2>
                <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                  One field — scan anything the box carries
                </p>
              </div>
              <div className="space-y-4 p-5">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <ScanLine className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        ref={scanRef}
                        autoFocus
                        value={scan}
                        onChange={(e) => setScan(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleScan(scan);
                        }}
                        placeholder="Scan SKU, EAN, seller QR, batch barcode or box code"
                        className="h-9 pl-8 font-mono text-xs"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5"
                      onClick={runOcr}
                      title="Photograph the label and read it with OCR"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      OCR
                    </Button>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 w-full gap-1.5"
                    onClick={demoScan}
                  >
                    <ScanLine className="h-3.5 w-3.5" />
                    Scan
                  </Button>
                  {trail.length > 0 && (
                    <ul className="space-y-1 rounded-md border border-border bg-muted/30 p-2.5">
                      {trail.map((t, i) => (
                        <li
                          key={i}
                          className={cn(
                            "text-[11px] leading-snug",
                            t.ok ? "text-foreground" : "text-risk",
                          )}
                        >
                          {t.ok ? "✓" : "✕"} {t.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {cat && (
                  <>
                    <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
                      <div className="font-mono text-xs">{cat.sku}</div>
                      <div className="text-[11px] text-muted-foreground">{cat.name}</div>
                      <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.06em] text-muted-foreground">
                        Mandatory:{" "}
                        {[cat.mandatory.batch && "batch", cat.mandatory.mrp && "MRP"]
                          .filter(Boolean)
                          .join(", ") || "none"}{" "}
                        · Remaining {remainingFor(cat.sku)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Case size">
                        <Select
                          value={cap.caseSize}
                          onValueChange={(v) => setCap((c) => ({ ...c, caseSize: v }))}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {cat.activeCaseSizes.map((s) => (
                              <SelectItem key={s} value={String(s)}>
                                {s} pcs / case
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label={`Batch${cat.mandatory.batch ? " *" : ""}`}>
                        <Input
                          value={cap.batch}
                          onChange={(e) => setCap((c) => ({ ...c, batch: e.target.value }))}
                          placeholder="B2409-H"
                          className="h-9 font-mono text-xs"
                        />
                      </Field>
                      <Field label={`MRP${cat.mandatory.mrp ? " *" : ""}`}>
                        <Input
                          value={cap.mrp}
                          onChange={(e) => setCap((c) => ({ ...c, mrp: e.target.value }))}
                          placeholder="₹449"
                          className="h-9 text-xs"
                        />
                      </Field>
                      <Field label="Mfg date">
                        <Input
                          value={cap.mfg}
                          onChange={(e) => setCap((c) => ({ ...c, mfg: e.target.value }))}
                          placeholder="01 Jan 2026"
                          className="h-9 font-mono text-xs"
                        />
                      </Field>
                      <Field label="Expiry">
                        <Input
                          value={cap.expiry}
                          onChange={(e) => setCap((c) => ({ ...c, expiry: e.target.value }))}
                          placeholder="01 Jul 2027"
                          className="h-9 font-mono text-xs"
                        />
                      </Field>
                      <Field label="Box count">
                        <Input
                          value={
                            cap.sellerCodes.length ? String(cap.sellerCodes.length) : cap.boxCount
                          }
                          disabled={cap.sellerCodes.length > 0}
                          onChange={(e) => setCap((c) => ({ ...c, boxCount: e.target.value }))}
                          placeholder="0"
                          className="h-9 tabular-nums"
                        />
                      </Field>
                    </div>

                    {cap.sellerCodes.length > 0 && (
                      <div className="rounded-md border border-sys/30 bg-sys-bg px-3 py-2">
                        <div className="font-mono text-[9.5px] uppercase tracking-[0.06em] text-sys">
                          Seller box codes · no labels printed
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {cap.sellerCodes.map((c) => (
                            <div key={c} className="font-mono text-[11px]">
                              {c}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.06em]">
                      <span className="text-muted-foreground">Lot quantity</span>
                      <span className="tabular-nums">
                        {count} × {size || 0} = {qty} / {remainingFor(cap.sku)} remaining
                      </span>
                    </div>

                    {errors.length > 0 && (
                      <ul className="space-y-1 rounded-md border border-risk/30 bg-risk-bg px-3 py-2">
                        {errors.map((e) => (
                          <li key={e} className="flex gap-1.5 text-[11px] leading-snug text-risk">
                            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                            {e}
                          </li>
                        ))}
                      </ul>
                    )}

                    <Button
                      className="w-full gap-1.5"
                      disabled={errors.length > 0}
                      onClick={confirmLot}
                    >
                      <Printer className="h-4 w-4" />
                      {cap.sellerCodes.length
                        ? `Confirm lot · ${count} seller codes`
                        : `Confirm & print ${count || 0} labels`}
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[760px]">
          <DialogHeader>
            <DialogTitle>Print preview · {preview?.length ?? 0} labels</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {preview?.map((b) => (
              <BoxLabel key={b.boxId} box={b} />
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setPreview(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-foreground">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
