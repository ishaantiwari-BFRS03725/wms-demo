import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  MapPin,
  MoveDown,
  ScanBarcode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { storageBayForLpn, tempHoldingArea } from "@/lib/wms/inbound-data";

export const Route = createFileRoute("/_wms/putaway")({
  head: () => ({
    meta: [{ title: "Putaway — Inbound" }],
  }),
  component: Putaway,
});

type Step = "scan" | "confirm-bay";

type Kind = "unidentified" | "identified";

interface Pending {
  code: string;
  kind: Kind;
  location: string;
}

interface PutawayLog {
  code: string;
  kind: Kind;
  location: string;
  at: Date;
}

function Putaway() {
  const [step, setStep] = useState<Step>("scan");
  const [pending, setPending] = useState<Pending | null>(null);
  const [log, setLog] = useState<PutawayLog[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanKey, setScanKey] = useState(0);

  const onScan = (val: string) => {
    const code = val.trim().toUpperCase();
    if (!code) return;
    if (log.find((l) => l.code === code)) {
      setScanError(`${code} has already been put away in this session.`);
      setScanKey((k) => k + 1);
      return;
    }
    setScanError(null);
    // USN — unidentified return holding
    if (code.startsWith("USN-")) {
      setPending({
        code,
        kind: "unidentified",
        location: tempHoldingArea(code),
      });
      setStep("confirm-bay");
      return;
    }
    // GRN LPN — identified return, put away to storage
    if (code.startsWith("GRN-LPN-") || code.startsWith("LPN-")) {
      setPending({
        code,
        kind: "identified",
        location: storageBayForLpn(code),
      });
      setStep("confirm-bay");
      return;
    }
    setScanError(
      "Unrecognised barcode — scan a USN sticker or a GRN LPN.",
    );
    setScanKey((k) => k + 1);
  };

  const confirmPutaway = () => {
    if (!pending) return;
    setLog((l) => [
      ...l,
      {
        code: pending.code,
        kind: pending.kind,
        location: pending.location,
        at: new Date(),
      },
    ]);
    setPending(null);
    setStep("scan");
    setScanKey((k) => k + 1);
  };

  const cancelPutaway = () => {
    setPending(null);
    setStep("scan");
    setScanKey((k) => k + 1);
  };

  const counts = {
    unidentified: log.filter((l) => l.kind === "unidentified").length,
    identified: log.filter((l) => l.kind === "identified").length,
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-muted/40 py-4">
      <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-md border border-border bg-background">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 border-b border-border bg-background px-4 py-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <MoveDown className="h-4 w-4 text-muted-foreground" />
            Putaway · Returns
          </div>
          <div className="text-right text-[11px] text-muted-foreground">
            <span className="font-mono font-semibold text-foreground">
              {log.length}
            </span>{" "}
            done
          </div>
        </div>

        <div className="space-y-3 p-4">
          {step === "scan" && (
            <>
              <Card className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  <ScanBarcode className="h-3.5 w-3.5" />
                  Scan USN or GRN LPN
                </div>
                {scanError && <ErrorBanner message={scanError} />}
                <ScanRow
                  key={`putaway-${scanKey}`}
                  placeholder="Scan barcode…"
                  onScan={onScan}
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground">
                  USN → temp holding area for unidentified returns. GRN LPN →
                  storage bay for identified return QC stock.
                </p>
              </Card>

              {log.length > 0 && (
                <Card className="space-y-1.5 p-3">
                  <div className="text-[11px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                    Recent putaways ({log.length})
                  </div>
                  {log
                    .slice()
                    .reverse()
                    .slice(0, 8)
                    .map((l) => (
                      <div
                        key={l.code}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-md border p-2 text-xs",
                          l.kind === "identified"
                            ? "border-status-picked/30 bg-status-picked/5"
                            : "border-warn/30 bg-warn-bg",
                        )}
                      >
                        <div className="min-w-0">
                          <div className="font-mono text-sm font-semibold">
                            {l.code}
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {l.location}
                          </div>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-[2px] px-1.5 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em]",
                            l.kind === "identified"
                              ? "bg-status-picked/15 text-status-picked"
                              : "bg-warn-bg text-warn",
                          )}
                        >
                          {l.kind === "identified" ? "Storage" : "Holding"}
                        </span>
                      </div>
                    ))}
                </Card>
              )}
            </>
          )}

          {step === "confirm-bay" && pending && (
            <>
              <Card
                className={cn(
                  "space-y-3 p-4",
                  pending.kind === "identified"
                    ? "border-status-picked/30 bg-status-picked/5"
                    : "border-warn/30 bg-warn-bg",
                )}
              >
                <div className="flex items-center gap-2 text-xs font-medium font-mono uppercase tracking-[0.06em]">
                  <ScanBarcode className="h-3.5 w-3.5" />
                  Scanned barcode
                </div>
                <div className="font-mono text-base font-bold">
                  {pending.code}
                </div>
                <div
                  className={cn(
                    "rounded-md p-2 text-xs",
                    pending.kind === "identified"
                      ? "bg-status-picked/10 text-status-picked"
                      : "bg-warn-bg text-warn",
                  )}
                >
                  {pending.kind === "identified"
                    ? "Identified return — put away to the assigned storage bay."
                    : "Unidentified return — move to the temp holding area for further inspection."}
                </div>
              </Card>

              <Card className="space-y-2 p-4">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {pending.kind === "identified"
                    ? "Storage bay"
                    : "Temp holding area"}
                </div>
                <div className="font-mono text-xl font-bold tracking-tight">
                  {pending.location}
                </div>
              </Card>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="h-11 flex-1"
                  onClick={cancelPutaway}
                >
                  Cancel
                </Button>
                <Button
                  className="h-11 flex-[2]"
                  onClick={confirmPutaway}
                >
                  Confirm putaway
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "ok" | "warn";
}) {
  return (
    <Card
      className={cn(
        "flex items-center justify-between gap-2 p-3",
        tone === "ok"
          ? "border-status-picked/30 bg-status-picked/5"
          : "border-warn/30 bg-warn-bg",
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-medium font-mono uppercase tracking-[0.06em]">
        <span
          className={tone === "ok" ? "text-status-picked" : "text-warn"}
        >
          {icon}
        </span>
        {label}
      </div>
      <span className="font-mono text-lg font-bold tabular-nums leading-none">
        {value}
      </span>
    </Card>
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
