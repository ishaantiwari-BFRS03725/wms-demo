import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, Printer, ScanLine, ThumbsDown, ThumbsUp } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { GrnBoxLabel, Meta, QcBadge } from "@/components/wms/b2b-grn-boxes";
import {
  consignmentForGatePass,
  isReturnGatePass,
  type GatePassConsignment,
} from "@/lib/wms/gate-entry-data";
import {
  CATALOGUE,
  boxIdFor,
  findSku,
  nextGrnId,
  nextLotId,
  nowStamp,
  sanitizeBatch,
  saveB2bGrnDoc,
  type B2bGrnDoc,
  type GrnBox,
  type GrnLot,
  type QcStatus,
} from "@/lib/wms/b2b-grn-data";

export const Route = createFileRoute("/_wms/b2b-grn/new")({
  head: () => ({
    meta: [{ title: "New B2B GRN — Inbound" }],
  }),
  component: NewB2bGrn,
});

const OPERATOR = "R. Mehta";

interface Capture {
  sku: string;
  packSize: string;
  batch: string;
  mrp: string;
  expiry: string;
  boxCount: string;
}

const emptyCapture: Capture = { sku: "", packSize: "", batch: "", mrp: "", expiry: "", boxCount: "" };

const SAMPLE_GATE_PASSES = ["GP-2024-008912", "GP-2024-009210", "GP-2024-009317"];

function NewB2bGrn() {
  const navigate = useNavigate();
  const [gatePassScan, setGatePassScan] = useState("");
  const [consignment, setConsignment] = useState<GatePassConsignment | null>(null);
  const [skuScan, setSkuScan] = useState("");
  const [cap, setCap] = useState<Capture>(emptyCapture);
  const [lots, setLots] = useState<GrnLot[]>([]);
  const [boxes, setBoxes] = useState<GrnBox[]>([]);
  const [preview, setPreview] = useState<GrnBox[] | null>(null);
  const [lpnScan, setLpnScan] = useState("");
  const seqRef = useRef(new Map<string, number>());
  const gatePassRef = useRef<HTMLInputElement>(null);
  const skuRef = useRef<HTMLInputElement>(null);
  const lpnRef = useRef<HTMLInputElement>(null);

  const cat = cap.sku ? findSku(cap.sku) : undefined;
  const packSize = Number(cap.packSize) || 0;
  const boxCount = Number(cap.boxCount) || 0;
  const qty = packSize * boxCount;

  const activeBox = useMemo(
    () => boxes.find((b) => !b.lpn || b.qc === "pending") ?? null,
    [boxes],
  );
  const placedCount = boxes.filter((b) => b.lpn && b.qc !== "pending").length;

  const errors = useMemo(() => {
    const e: string[] = [];
    if (!consignment) return ["Scan a gate pass to begin."];
    if (!cat) return ["Scan a SKU to start a lot."];
    if (!packSize) e.push("Select a pack size.");
    if (!cap.batch.trim()) e.push("Batch is required.");
    if (!cap.mrp.trim()) e.push("MRP is required.");
    if (!cap.expiry.trim()) e.push("Expiry date is required.");
    const n = Number(cap.boxCount);
    if (!cap.boxCount.trim() || !Number.isInteger(n) || n <= 0) {
      e.push("Number of boxes must be a positive whole number.");
    }
    return e;
  }, [consignment, cat, packSize, cap]);

  const onGatePassScan = (raw: string) => {
    const id = raw.trim().toUpperCase();
    if (!id) return;
    setGatePassScan("");
    if (isReturnGatePass(id)) {
      toast.error("That is a return gate pass.", {
        description: "Return consignments go through Unloading, not B2B GRN.",
      });
      gatePassRef.current?.focus();
      return;
    }
    setConsignment(consignmentForGatePass(id));
    setCap(emptyCapture);
    setLots([]);
    setBoxes([]);
    toast.success(`${id} scanned`);
  };

  const onSkuScan = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    setSkuScan("");
    const found = findSku(value);
    if (!found) {
      toast.error(`"${value}" is not a recognised SKU.`);
      skuRef.current?.focus();
      return;
    }
    setCap({
      ...emptyCapture,
      sku: found.sku,
      packSize: found.packSizes.length === 1 ? String(found.packSizes[0]) : "",
    });
  };

  const submitAndPrint = () => {
    if (!consignment || !cat || errors.length) return;
    const key = `${cat.sku}|${sanitizeBatch(cap.batch)}|${packSize}`;
    const startSeq = seqRef.current.get(key) ?? 1;
    seqRef.current.set(key, startSeq + boxCount);

    const newBoxes: GrnBox[] = Array.from({ length: boxCount }, (_, i) => ({
      boxId: boxIdFor(cat.sku, cap.batch, packSize, startSeq + i),
      sku: cat.sku,
      skuName: cat.name,
      packSize,
      batch: cap.batch.trim(),
      mrp: cap.mrp.trim(),
      expiry: cap.expiry.trim(),
      lpn: null,
      qc: "pending",
    }));

    const lot: GrnLot = {
      id: nextLotId(),
      sku: cat.sku,
      skuName: cat.name,
      packSize,
      batch: cap.batch.trim(),
      mrp: cap.mrp.trim(),
      expiry: cap.expiry.trim(),
      boxCount,
      qty,
      createdAt: nowStamp(),
    };

    setLots((l) => [...l, lot]);
    setBoxes((b) => [...b, ...newBoxes]);
    setCap(emptyCapture);
    setPreview(newBoxes);
    toast.success(`${boxCount} box ID${boxCount === 1 ? "" : "s"} printed`);
  };

  const onLpnScan = (raw: string) => {
    const lpn = raw.trim().toUpperCase();
    if (!lpn) return;
    setLpnScan("");
    if (!activeBox) {
      toast.error("No box is awaiting placement.");
      return;
    }
    setBoxes((prev) =>
      prev.map((b) => (b.boxId === activeBox.boxId ? { ...b, lpn } : b)),
    );
    toast.success(`${activeBox.boxId} → ${lpn}`, { description: "Now set QC good / bad." });
  };

  const setQc = (boxId: string, qc: QcStatus) => {
    setBoxes((prev) => prev.map((b) => (b.boxId === boxId ? { ...b, qc } : b)));
    lpnRef.current?.focus();
  };

  const completeGrn = () => {
    if (!lots.length || !consignment) return;
    const doc: B2bGrnDoc = {
      id: nextGrnId(),
      gatePass: consignment.gatePass,
      seller: consignment.seller.name,
      asn: consignment.asn,
      warehouseId: consignment.seller.warehouseId,
      lots,
      boxes,
      createdBy: OPERATOR,
      createdAt: nowStamp(),
    };
    saveB2bGrnDoc(doc);
    toast.success(`${doc.id} closed`, {
      description: `${lots.length} lot${lots.length === 1 ? "" : "s"} · ${boxes.length} box${boxes.length === 1 ? "" : "es"} · ${placedCount} placed & QC'd.`,
    });
    navigate({ to: "/b2b-grn" });
  };

  return (
    <div>
      <div className="border-b border-border bg-background px-6 py-5">
        <Link
          to="/b2b-grn"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to B2B GRNs
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">New B2B GRN</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Scan a gate pass, capture each lot, print a box ID per box, then place each
              box against an LPN and QC it.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!consignment ? (
              <div className="relative w-[280px]">
                <ScanLine className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={gatePassRef}
                  autoFocus
                  value={gatePassScan}
                  onChange={(e) => setGatePassScan(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onGatePassScan(gatePassScan);
                  }}
                  placeholder="Scan gate pass — e.g. GP-2024-008912"
                  className="h-9 pl-8 font-mono text-xs"
                />
              </div>
            ) : (
              <div className="rounded-md border border-border bg-muted/30 px-3 py-1.5 font-mono text-xs">
                Gate Pass <span className="font-semibold">{consignment.gatePass}</span>
              </div>
            )}
            <Button size="sm" className="h-9 gap-1.5" disabled={!lots.length} onClick={completeGrn}>
              <Check className="h-3.5 w-3.5" />
              Complete GRN
            </Button>
          </div>
        </div>
      </div>

      {!consignment ? (
        <div className="p-6">
          <div className="space-y-4 rounded-md border border-dashed border-border bg-card py-16 text-center text-sm text-muted-foreground">
            <div>Scan a gate pass to start a B2B GRN.</div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                Try:
              </span>
              {SAMPLE_GATE_PASSES.map((gp) => (
                <button
                  key={gp}
                  type="button"
                  onClick={() => onGatePassScan(gp)}
                  className="rounded-md border border-border bg-background px-2.5 py-1 font-mono text-xs text-foreground hover:border-primary/40 hover:bg-muted"
                >
                  {gp}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap gap-x-8 gap-y-2 rounded-md border border-border bg-muted/30 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.06em]">
            <Meta label="Seller" value={consignment.seller.name} />
            <Meta label="Vendor" value={consignment.seller.id} />
            <Meta label="ASN" value={consignment.asn} />
            <Meta label="Warehouse" value={consignment.seller.warehouseId} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[440px_1fr]">
            <Card className="h-fit overflow-hidden">
              <div className="border-b border-border px-5 py-3">
                <h2 className="text-sm font-semibold">SKU Details</h2>
                <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                  Scan a SKU, pick a pack size, set the batch and print
                </p>
              </div>
              <div className="space-y-4 p-5">
                <div className="relative">
                  <ScanLine className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={skuRef}
                    value={skuScan}
                    onChange={(e) => setSkuScan(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSkuScan(skuScan);
                    }}
                    placeholder="Scan SKU — e.g. SKU-99201-WH"
                    className="h-9 pl-8 font-mono text-xs"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                    Try:
                  </span>
                  {CATALOGUE.map((item) => (
                    <button
                      key={item.sku}
                      type="button"
                      onClick={() => onSkuScan(item.sku)}
                      className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[11px] text-foreground hover:border-primary/40 hover:bg-muted"
                      title={item.name}
                    >
                      {item.sku}
                    </button>
                  ))}
                </div>

                {cat && (
                  <>
                    <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
                      <div className="font-mono text-xs">{cat.sku}</div>
                      <div className="text-[11px] text-muted-foreground">{cat.name}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Pack size">
                        <Select
                          value={cap.packSize}
                          onValueChange={(v) => setCap((c) => ({ ...c, packSize: v }))}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {cat.packSizes.map((s) => (
                              <SelectItem key={s} value={String(s)}>
                                {s} pcs / box
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Batch">
                        <Input
                          value={cap.batch}
                          onChange={(e) => setCap((c) => ({ ...c, batch: e.target.value }))}
                          placeholder="B2409-H"
                          className="h-9 font-mono text-xs"
                        />
                      </Field>
                      <Field label="MRP">
                        <Input
                          value={cap.mrp}
                          onChange={(e) => setCap((c) => ({ ...c, mrp: e.target.value }))}
                          placeholder="₹449"
                          className="h-9 text-xs"
                        />
                      </Field>
                      <Field label="Expiry date">
                        <Input
                          type="date"
                          value={cap.expiry}
                          onChange={(e) => setCap((c) => ({ ...c, expiry: e.target.value }))}
                          className="h-9 font-mono text-xs"
                        />
                      </Field>
                      <Field label="Number of boxes">
                        <Input
                          value={cap.boxCount}
                          onChange={(e) => setCap((c) => ({ ...c, boxCount: e.target.value }))}
                          placeholder="0"
                          className="h-9 tabular-nums"
                        />
                      </Field>
                    </div>

                    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.06em]">
                      <span className="text-muted-foreground">Lot quantity</span>
                      <span className="tabular-nums">
                        {boxCount || 0} × {packSize || 0} = {qty}
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
                      onClick={submitAndPrint}
                    >
                      <Printer className="h-4 w-4" />
                      Submit &amp; print {boxCount || 0} label{boxCount === 1 ? "" : "s"}
                    </Button>
                  </>
                )}
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="overflow-hidden">
                <div className="border-b border-border px-5 py-3">
                  <h2 className="text-sm font-semibold">Lots in this GRN</h2>
                  <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                    {lots.length} lots · {boxes.length} boxes · {lots.reduce((s, l) => s + l.qty, 0)} units
                  </p>
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
                        <TableHead className="text-right">Pack size</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead className="text-right">Boxes</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lots.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="font-mono text-xs">{l.id}</TableCell>
                          <TableCell>
                            <div className="font-mono text-xs">{l.sku}</div>
                            <div className="text-[11px] text-muted-foreground">{l.skuName}</div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{l.packSize}</TableCell>
                          <TableCell className="font-mono text-xs">{l.batch}</TableCell>
                          <TableCell className="whitespace-nowrap font-mono text-xs">
                            {l.expiry}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{l.boxCount}</TableCell>
                          <TableCell className="text-right tabular-nums">{l.qty}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>

              <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                  <div>
                    <h2 className="text-sm font-semibold">Place &amp; QC</h2>
                    <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                      Scan the LPN each box is placed in, then mark QC good / bad
                    </p>
                  </div>
                  {boxes.length > 0 && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                      {placedCount} / {boxes.length} placed
                    </span>
                  )}
                </div>

                {boxes.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    Print boxes from a lot to begin placement.
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 border-b border-border bg-muted/20 px-5 py-3">
                      {activeBox ? (
                        <>
                          <div className="flex items-center justify-between font-mono text-xs">
                            <span>
                              Next box <span className="font-semibold">{activeBox.boxId}</span>
                            </span>
                            <span className="text-muted-foreground">{activeBox.sku}</span>
                          </div>
                          <div className="relative">
                            <ScanLine className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              ref={lpnRef}
                              value={lpnScan}
                              onChange={(e) => setLpnScan(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") onLpnScan(lpnScan);
                              }}
                              disabled={!!activeBox.lpn}
                              placeholder="Scan LPN…"
                              className="h-9 pl-8 font-mono text-xs"
                            />
                          </div>
                          {!activeBox.lpn && (
                            <button
                              type="button"
                              onClick={() => onLpnScan(`LPN-DEMO-${activeBox.boxId.slice(-3)}`)}
                              className="rounded-md border border-border bg-background px-2.5 py-1 font-mono text-[11px] text-foreground hover:border-primary/40 hover:bg-muted"
                            >
                              Try: LPN-DEMO-{activeBox.boxId.slice(-3)}
                            </button>
                          )}
                          {activeBox.lpn && (
                            <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                              <span className="font-mono text-xs">
                                LPN <span className="font-semibold">{activeBox.lpn}</span>
                              </span>
                              <div className="flex items-center gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 gap-1.5"
                                  onClick={() => setQc(activeBox.boxId, "good")}
                                >
                                  <ThumbsUp className="h-3.5 w-3.5" />
                                  Good
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 gap-1.5 text-destructive hover:text-destructive"
                                  onClick={() => setQc(activeBox.boxId, "bad")}
                                >
                                  <ThumbsDown className="h-3.5 w-3.5" />
                                  Bad
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Check className="h-3.5 w-3.5" />
                          All boxes placed and QC'd.
                        </div>
                      )}
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>Box ID</TableHead>
                          <TableHead>LPN</TableHead>
                          <TableHead>QC</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {boxes.map((b) => (
                          <TableRow key={b.boxId} className={cn(b.boxId === activeBox?.boxId && "bg-ai-bg/40")}>
                            <TableCell className="font-mono text-xs">{b.boxId}</TableCell>
                            <TableCell className="font-mono text-xs">{b.lpn || "—"}</TableCell>
                            <TableCell>
                              <QcBadge qc={b.qc} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </Card>
            </div>
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
              <GrnBoxLabel key={b.boxId} box={b} />
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
