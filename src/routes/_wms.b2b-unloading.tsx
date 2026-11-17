import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  PackageOpen,
  PenLine,
  ScanBarcode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  consignmentForGatePass,
  isReturnGatePass,
  type GatePassConsignment,
} from "@/lib/wms/gate-entry-data";

export const Route = createFileRoute("/_wms/b2b-unloading")({
  head: () => ({
    meta: [{ title: "B2B Unloading" }],
  }),
  component: B2bUnloading,
});

let unloadSeq = 4120;
const nextUnloadId = () => `B2BUL-${String(unloadSeq++).padStart(5, "0")}`;

type Step = "scan-gatepass" | "box-count" | "signature-photo" | "done";

function B2bUnloading() {
  const [step, setStep] = useState<Step>("scan-gatepass");
  const [scanKey, setScanKey] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const [consignment, setConsignment] = useState<GatePassConsignment | null>(null);
  const [boxCount, setBoxCount] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [lrPhotoUrl, setLrPhotoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ id: string; at: Date } | null>(null);

  const n = Number(boxCount);
  const validCount = boxCount.trim() !== "" && Number.isInteger(n) && n > 0;
  const canSubmit = !!signatureUrl && !!lrPhotoUrl;

  const onGatePassScan = (raw: string) => {
    const id = raw.trim().toUpperCase();
    if (!id) return;
    if (isReturnGatePass(id)) {
      setScanError("That is a return gate pass. B2B Unloading is for standard inbound only.");
      setScanKey((k) => k + 1);
      return;
    }
    setConsignment(consignmentForGatePass(id));
    setScanError(null);
    setStep("box-count");
  };

  const confirmBoxCount = () => {
    if (!validCount) return setError("Enter the number of boxes unloaded (a whole number greater than 0).");
    setError(null);
    setStep("signature-photo");
  };

  const submit = () => {
    if (!signatureUrl) return setError("Capture the courier partner's signature.");
    if (!lrPhotoUrl) return setError("Capture a photo of the LR copy.");
    setError(null);
    setDone({ id: nextUnloadId(), at: new Date() });
    setStep("done");
  };

  const reset = () => {
    setStep("scan-gatepass");
    setConsignment(null);
    setBoxCount("");
    setSignatureUrl("");
    setLrPhotoUrl("");
    setError(null);
    setScanError(null);
    setDone(null);
    setScanKey((k) => k + 1);
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-muted/40 py-4">
      <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-md border border-border bg-background">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-background px-4 py-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <PackageOpen className="h-4 w-4 text-muted-foreground" />
            B2B Unloading
          </div>
          {consignment && (
            <div className="text-right text-xs text-muted-foreground">
              Gate Pass{" "}
              <span className="font-mono font-semibold text-foreground">{consignment.gatePass}</span>
            </div>
          )}
        </div>

        <div className="space-y-3 p-4">
          {/* Step — Scan Gate Pass */}
          {step === "scan-gatepass" && (
            <Card className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                <ScanBarcode className="h-3.5 w-3.5" />
                Scan Gate Pass
              </div>
              <p className="text-xs text-muted-foreground">
                Issued during Gate Pass Processing for this consignment.
              </p>
              <ScanRow
                key={`gp-${scanKey}`}
                placeholder="e.g. GP-2024-008912"
                onScan={onGatePassScan}
                autoFocus
              />
              {scanError && <ErrorBanner message={scanError} />}
            </Card>
          )}

          {/* Step — Number of boxes */}
          {step === "box-count" && consignment && (
            <>
              <ConsignmentCard c={consignment} />
              <Card className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  Number of boxes
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 shrink-0 text-lg"
                    onClick={() => setBoxCount((c) => String(Math.max(1, (Number(c) || 0) - 1)))}
                  >
                    –
                  </Button>
                  <Input
                    value={boxCount}
                    onChange={(e) => {
                      setBoxCount(e.target.value.replace(/[^0-9]/g, ""));
                      setError(null);
                    }}
                    inputMode="numeric"
                    placeholder="0"
                    className="h-11 text-center font-mono text-lg font-bold"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 shrink-0 text-lg"
                    onClick={() => setBoxCount((c) => String((Number(c) || 0) + 1))}
                  >
                    +
                  </Button>
                </div>
              </Card>

              {error && <ErrorBanner message={error} />}

              <Button className="h-11 w-full" disabled={!validCount} onClick={confirmBoxCount}>
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Confirm {boxCount || 0} box{n === 1 ? "" : "es"}
              </Button>
            </>
          )}

          {/* Step — Signature & LR photo */}
          {step === "signature-photo" && (
            <>
              <Card className="space-y-2 p-4">
                <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  <PenLine className="h-3.5 w-3.5" />
                  Courier Partner Signature
                </div>
                <SignaturePad value={signatureUrl} onChange={setSignatureUrl} />
              </Card>

              <Card className="space-y-2 p-4">
                <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  <Camera className="h-3.5 w-3.5" />
                  LR Copy
                </div>
                <PhotoCapture value={lrPhotoUrl} onCapture={setLrPhotoUrl} />
              </Card>

              {error && <ErrorBanner message={error} />}

              <Button className="h-11 w-full" disabled={!canSubmit} onClick={submit}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Complete Unloading
              </Button>
            </>
          )}

          {/* Step — Done */}
          {step === "done" && done && (
            <>
              <Card className="space-y-4 p-4">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-status-picked/15">
                    <CheckCircle2 className="h-7 w-7 text-status-picked" />
                  </div>
                  <div>
                    <div className="text-base font-semibold">Unloading Complete</div>
                    <div className="text-xs text-muted-foreground">
                      {done.id} · {n} box{n === 1 ? "" : "es"} ·{" "}
                      {done.at.toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="mb-1 text-[10px] uppercase text-muted-foreground">
                      Courier signature
                    </div>
                    <div className="rounded-md border border-border bg-background p-2">
                      <img
                        src={signatureUrl}
                        alt="Signature"
                        className="h-16 w-full object-contain"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] uppercase text-muted-foreground">LR copy</div>
                    <div className="overflow-hidden rounded-md border border-border bg-background">
                      <img src={lrPhotoUrl} alt="LR copy" className="aspect-square w-full object-cover" />
                    </div>
                  </div>
                </div>
              </Card>

              <Button className="h-11 w-full" onClick={reset}>
                Start new unloading
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ConsignmentCard({ c }: { c: GatePassConsignment }) {
  return (
    <Card className="space-y-2 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{c.seller.name}</span>
        {c.community && (
          <span className="rounded-[3px] border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold font-mono uppercase tracking-[0.06em] text-primary">
            {c.community}
          </span>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        <Fact label="ASN" value={c.asn} mono />
        <Fact label="Vendor" value={c.seller.id} mono />
        <Fact label="Boxes (guard)" value={String(c.boxCount)} />
        <Fact label="Warehouse" value={c.seller.warehouseId} mono />
      </dl>
    </Card>
  );
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
      <dd className={cn("font-medium", mono && "font-mono")}>{value}</dd>
    </div>
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

// ── Signature pad ──

function SignaturePad({
  value,
  onChange,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);

  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (c.width / r.width),
      y: (e.clientY - r.top) * (c.height / r.height),
    };
  };

  const start = (e: React.PointerEvent) => {
    drawing.current = true;
    last.current = pos(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current || !last.current) return;
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    const p = pos(e);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (!hasInk) setHasInk(true);
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    if (canvasRef.current && hasInk) {
      onChange(canvasRef.current.toDataURL());
    }
  };

  const clear = () => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
    onChange("");
  };

  return (
    <div className="space-y-1.5">
      <div className="relative rounded-md border-2 border-dashed border-border bg-white">
        <canvas
          ref={canvasRef}
          width={480}
          height={140}
          className="block h-[140px] w-full touch-none"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
        />
        {!hasInk && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
            <PenLine className="h-5 w-5 text-muted-foreground/50" />
            <span className="text-[11px] text-muted-foreground">Sign within this boundary</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {value ? "✓ Captured" : "Awaiting signature"}
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          Clear Canvas
        </Button>
      </div>
    </div>
  );
}

// ── Photo capture (demo placeholder) ──

function PhotoCapture({
  value,
  onCapture,
}: {
  value: string;
  onCapture: (url: string) => void;
}) {
  const capture = () => {
    const seed = `lr-${Math.random().toString(36).slice(2, 8)}`;
    onCapture(`https://picsum.photos/seed/${seed}/240/240`);
  };
  return (
    <div className="space-y-1.5">
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border border-border bg-muted/30">
        {value ? (
          <img src={value} alt="LR copy" className="h-full w-full object-cover" />
        ) : (
          <div className="px-4 text-center text-xs text-muted-foreground">
            LR copy not captured
          </div>
        )}
        <Button type="button" size="sm" className="absolute" onClick={capture}>
          <Camera className="mr-1.5 h-3.5 w-3.5" />
          {value ? "Retake" : "Capture LR copy"}
        </Button>
      </div>
    </div>
  );
}
