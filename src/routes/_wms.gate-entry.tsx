import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Camera,
  CheckCircle2,
  Eye,
  Hash,
  Package,
  Printer,
  ShieldCheck,
  Trash2,
  Truck,
  Upload,
  User,
  Wrench,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  gateBarcodePattern,
  genGatePassId,
  TRANSPORTERS,
  VEHICLE_CONDITIONS,
  VEHICLE_TYPES,
} from "@/lib/wms/gate-entry-data";

export const Route = createFileRoute("/_wms/gate-entry")({
  head: () => ({
    meta: [{ title: "Gate Entry — Inbound" }],
  }),
  component: GateEntry,
});

type Step = "type" | "details" | "preview" | "complete";

const STEPS: { id: Step; label: string }[] = [
  { id: "type", label: "Type" },
  { id: "details", label: "Details" },
  { id: "preview", label: "Preview" },
];

// Gate entry type — only the Seller flow is built in this demo; the others are
// shown for context but out of scope.
type GateEntryType = "seller" | "visitor" | "scrap" | "infra";

const GATE_ENTRY_TYPES: {
  id: GateEntryType;
  label: string;
  desc: string;
  icon: React.ReactNode;
  inScope: boolean;
}[] = [
  {
    id: "seller",
    label: "Seller",
    desc: "Seller / vendor deliveries & returns",
    icon: <Package className="h-6 w-6" />,
    inScope: true,
  },
  {
    id: "visitor",
    label: "Visitor",
    desc: "Visitor entry management",
    icon: <User className="h-6 w-6" />,
    inScope: false,
  },
  {
    id: "scrap",
    label: "Scrap",
    desc: "Scrap material movement",
    icon: <Trash2 className="h-6 w-6" />,
    inScope: false,
  },
  {
    id: "infra",
    label: "Infra",
    desc: "Infrastructure & maintenance",
    icon: <Wrench className="h-6 w-6" />,
    inScope: false,
  },
];

// Gate entry registers the vehicle at the gate and cuts a single gate pass.
// The activity type (Inward / Pickup / Return) and its seller / dock / document
// details are captured later, at the unloading screen.
interface GatePass {
  id: string;
  dateTime: string;
  gateNumber: string;
  transporter: string;
  driverName: string;
  driverMobile: string;
  vehicleNumber: string;
  driverLicense: string;
  vehicleCondition: string;
  vehicleType: string;
}

const defaultDateTime = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

function GateEntry() {
  const [step, setStep] = useState<Step>("type");

  // Gate entry type — Seller is the only in-scope flow in this demo.
  const [gateEntryType, setGateEntryType] = useState<GateEntryType>("seller");

  // Gate entry details
  const [dateTime, setDateTime] = useState(defaultDateTime);
  const [gateNumber, setGateNumber] = useState("1");
  const [transporter, setTransporter] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverMobile, setDriverMobile] = useState("");

  // Vehicle details
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverLicense, setDriverLicense] = useState("");
  const [vehicleCondition, setVehicleCondition] = useState<string>(VEHICLE_CONDITIONS[0]);
  const [vehicleType, setVehicleType] = useState("");
  const [licensePhotoUploaded, setLicensePhotoUploaded] = useState(false);
  const [vehiclePhotos, setVehiclePhotos] = useState<Record<string, boolean>>({});
  const toggleVehiclePhoto = (key: string) =>
    setVehiclePhotos((prev) => ({ ...prev, [key]: !prev[key] }));

  // Output — one gate pass per registered vehicle
  const [passes, setPasses] = useState<GatePass[]>([]);
  const [printOne, setPrintOne] = useState<GatePass | null>(null);

  // Good vehicles need only front & back; anything else is treated as damaged
  // and requires all four sides photographed.
  const vehicleGood = vehicleCondition === "Good";
  const vehiclePhotoTiles = vehicleGood
    ? [
        { key: "front", label: "Vehicle front" },
        { key: "back", label: "Vehicle back" },
      ]
    : [
        { key: "front", label: "Vehicle front" },
        { key: "back", label: "Vehicle back" },
        { key: "left", label: "Damage — left" },
        { key: "right", label: "Damage — right" },
        { key: "top", label: "Damage — top" },
        { key: "rear", label: "Damage — rear close-up" },
      ];
  const photosComplete = vehiclePhotoTiles.every((t) => vehiclePhotos[t.key]);

  const detailsValid =
    dateTime.trim() &&
    transporter.trim() &&
    driverName.trim() &&
    vehicleNumber.trim() &&
    photosComplete;

  const submit = () => {
    const pass: GatePass = {
      id: genGatePassId(),
      dateTime,
      gateNumber,
      transporter,
      driverName,
      driverMobile,
      vehicleNumber,
      driverLicense,
      vehicleCondition,
      vehicleType,
    };
    setPasses([pass]);
    setStep("complete");
  };

  const reset = () => {
    setStep("type");
    setGateEntryType("seller");
    setDateTime(defaultDateTime());
    setGateNumber("1");
    setTransporter("");
    setDriverName("");
    setDriverMobile("");
    setVehicleNumber("");
    setDriverLicense("");
    setVehicleCondition(VEHICLE_CONDITIONS[0]);
    setVehicleType("");
    setLicensePhotoUploaded(false);
    setVehiclePhotos({});
    setPasses([]);
    setPrintOne(null);
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-muted/40">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">
                {step === "complete" ? "Gate Entry · Registration" : "New Gate Entry"}
              </h1>
              <p className="text-xs text-muted-foreground">
                Inbound vehicle registration · North-A1 Warehouse
              </p>
            </div>
          </div>
          {step !== "complete" && <Stepper current={step} />}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-6">
        {/* Step 1 — Type */}
        {step === "type" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-base font-semibold">Select Gate Entry Type</h2>
              <p className="mx-auto max-w-xl text-sm text-muted-foreground">
                Executed at the warehouse gate. Gate entry is universal — the activity type and
                seller details are captured later at unloading, not here.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {GATE_ENTRY_TYPES.map((t) => (
                <TypeCard
                  key={t.id}
                  active={gateEntryType === t.id}
                  inScope={t.inScope}
                  onClick={() => t.inScope && setGateEntryType(t.id)}
                  icon={t.icon}
                  title={t.label}
                  desc={t.desc}
                />
              ))}
            </div>
            <div className="flex justify-center pt-1">
              <Button size="lg" onClick={() => setStep("details")}>
                Continue with Seller
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Details */}
        {step === "details" && (
          <div className="space-y-5">
            <DetailsSection title="Gate Entry Details">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Date & Time" required>
                  <Input
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                  />
                </Field>
                <Field label="Gate Number">
                  <Input
                    value={gateNumber}
                    onChange={(e) => setGateNumber(e.target.value)}
                    placeholder="e.g. 1"
                  />
                </Field>
                <Field label="Transporter" required>
                  <Select value={transporter} onValueChange={setTransporter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select transporter" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSPORTERS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Driver Name" required>
                  <Input
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Driver full name"
                  />
                </Field>
                <Field label="Driver Mobile">
                  <Input
                    value={driverMobile}
                    onChange={(e) => setDriverMobile(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="10-digit mobile (optional)"
                    inputMode="numeric"
                    maxLength={10}
                  />
                </Field>
              </div>
            </DetailsSection>

            <DetailsSection title="Vehicle Details">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Vehicle Number" required>
                  <Input
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. MH 12 AB 1234"
                    className="font-mono"
                  />
                </Field>
                <Field label="Driver License">
                  <div className="flex items-center gap-2">
                    <Input
                      value={driverLicense}
                      onChange={(e) => setDriverLicense(e.target.value.toUpperCase())}
                      placeholder="License number"
                      className="font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "shrink-0",
                        licensePhotoUploaded && "border-status-dispatched/40 text-status-dispatched",
                      )}
                      onClick={() => setLicensePhotoUploaded((v) => !v)}
                    >
                      {licensePhotoUploaded ? (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      {licensePhotoUploaded ? "Photo added" : "Upload photo"}
                    </Button>
                  </div>
                </Field>
                <Field label="Vehicle Condition" required>
                  <Select value={vehicleCondition} onValueChange={setVehicleCondition}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_CONDITIONS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    {vehicleGood
                      ? "Front & back photos are mandatory."
                      : `${vehicleCondition} selected — all four sides must be photographed.`}
                  </p>
                </Field>
                <Field label="Vehicle Type">
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_TYPES.map((t) => (
                        <SelectItem key={t.label} value={t.label}>
                          {t.label} · up to {t.maxWeight.toLocaleString()} kg
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold font-mono uppercase tracking-[0.06em] text-muted-foreground">
                    Vehicle Photos
                  </span>
                  <span
                    className={cn(
                      "rounded-[2px] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.06em]",
                      vehicleGood
                        ? "bg-muted text-muted-foreground"
                        : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {vehicleGood ? "Front & back mandatory" : "4-side mandatory"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {vehiclePhotoTiles.map((t) => (
                    <PhotoTile
                      key={t.key}
                      label={t.label}
                      captured={!!vehiclePhotos[t.key]}
                      onClick={() => toggleVehiclePhoto(t.key)}
                    />
                  ))}
                </div>
              </div>
            </DetailsSection>

            <NavRow
              onBack={() => setStep("type")}
              onNext={() => setStep("preview")}
              nextDisabled={!detailsValid}
              nextLabel="Preview"
              nextIcon={<Eye className="ml-2 h-4 w-4" />}
            />
          </div>
        )}

        {/* Step 3 — Preview */}
        {step === "preview" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold">Review Gate Entry</h2>
              <p className="text-sm text-muted-foreground">
                Verify all details below. A gate pass will be generated on submission.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <SummaryTile
                label="Gate Number"
                value={gateNumber || "—"}
                icon={<Hash className="h-4 w-4" />}
              />
              <SummaryTile
                label="Vehicle"
                value={vehicleNumber || "—"}
                hint="Verified"
                accent
                icon={<Truck className="h-4 w-4" />}
              />
              <SummaryTile label="Vehicle Type" value={vehicleType || "—"} />
              <SummaryTile label="Transporter" value={transporter || "—"} />
            </div>

            <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                <FooterFact
                  label="Date & Time"
                  value={
                    dateTime
                      ? new Date(dateTime).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "—"
                  }
                />
                <FooterFact label="Driver" value={driverName || "—"} />
                <FooterFact label="Driver Mobile" value={driverMobile || "—"} mono />
                <FooterFact label="Driver License" value={driverLicense || "—"} mono />
                <FooterFact label="Vehicle Condition" value={vehicleCondition} />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setStep("details")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={submit}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Confirm &amp; Submit
                </Button>
              </div>
            </Card>
            <p className="text-center text-[11px] text-muted-foreground">
              This entry will be logged with a timestamp on submission · Activity type is captured
              at unloading.
            </p>
          </div>
        )}

        {/* Step 4 — Complete / Gate pass */}
        {step === "complete" && passes.length > 0 && (
          <div className="space-y-5">
            <Card className="flex flex-wrap items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-status-dispatched/15 text-status-dispatched">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-semibold font-mono uppercase tracking-[0.06em] text-status-dispatched">
                  Process Complete
                </div>
                <div className="text-base font-semibold">Registration successful</div>
                <p className="max-w-xl text-sm text-muted-foreground">
                  The vehicle has been registered at the gate. The gate pass below has been generated
                  and is ready for printing. Activity type is assigned at unloading.
                </p>
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              {passes.map((p) => (
                <GatePassCard key={p.id} pass={p} onPrint={() => setPrintOne(p)} />
              ))}
            </div>

            <div className="flex justify-center pt-1">
              <Button variant="outline" onClick={reset}>
                <Truck className="mr-2 h-4 w-4" />
                New Gate Entry
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Print single dialog */}
      <Dialog open={!!printOne} onOpenChange={(o) => !o && setPrintOne(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Gate Pass
            </DialogTitle>
          </DialogHeader>
          {printOne && <PassSticker pass={printOne} />}
          <DialogFooter>
            <Button className="w-full" onClick={() => setPrintOne(null)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Printed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------------------------------------------------------- Stepper */

function Stepper({ current }: { current: Step }) {
  const idx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="hidden items-center gap-2 md:flex">
      {STEPS.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={s.id} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                  active
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  active || done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && <span className="h-px w-6 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------ Primitives */

function DetailsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="space-y-4 p-5">
      <div className="text-xs font-semibold font-mono uppercase tracking-[0.06em] text-muted-foreground">
        {title}
      </div>
      {children}
    </Card>
  );
}

function TypeCard({
  active,
  inScope,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  inScope: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!inScope}
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-lg border-2 p-6 text-center transition-colors",
        active
          ? "border-primary bg-primary/5"
          : inScope
            ? "border-border bg-background hover:border-primary/40"
            : "cursor-not-allowed border-border bg-muted/30 opacity-70",
      )}
    >
      {!inScope && (
        <span className="absolute left-3 top-3 rounded-[2px] bg-muted px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Not in this demo
        </span>
      )}
      {active && <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-primary" />}
      <span
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full",
          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <span className="text-base font-semibold">{title}</span>
      <span className="text-xs text-muted-foreground">{desc}</span>
    </button>
  );
}

function PhotoTile({
  label,
  captured,
  onClick,
}: {
  label: string;
  captured: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-colors",
        captured
          ? "border-status-dispatched/50 bg-status-dispatched/5"
          : "border-border hover:border-primary/40",
      )}
    >
      {captured ? (
        <CheckCircle2 className="h-5 w-5 text-status-dispatched" />
      ) : (
        <Camera className="h-5 w-5 text-muted-foreground" />
      )}
      <span className="text-xs font-medium">{label}</span>
      <span
        className={cn(
          "font-mono text-[10px] font-semibold uppercase tracking-[0.06em]",
          captured ? "text-status-dispatched" : "text-destructive",
        )}
      >
        {captured ? "Captured" : "Required"}
      </span>
    </button>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}

function NavRow({
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  nextIcon,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextIcon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 pt-1">
      {onBack ? (
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      ) : (
        <span />
      )}
      <Button onClick={onNext} disabled={nextDisabled}>
        {nextLabel}
        {nextIcon ?? <ArrowRight className="ml-2 h-4 w-4" />}
      </Button>
    </div>
  );
}

/* ----------------------------------------------------------- Small parts */

function SummaryTile({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Card className={cn("p-4", accent && "border-primary/40 bg-primary/5")}>
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </div>
        {icon && <span className="text-primary">{icon}</span>}
      </div>
      <div className="mt-1 truncate text-2xl font-bold tabular-nums">{value}</div>
      {hint && <div className="text-[11px] font-medium text-muted-foreground">{hint}</div>}
    </Card>
  );
}

function FooterFact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      <div className={cn("text-sm font-semibold", mono && "font-mono")}>{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------- Gate pass */

function GatePassCard({ pass, onPrint }: { pass: GatePass; onPrint: () => void }) {
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Boxes className="h-4 w-4" />
          </span>
          <div>
            <div className="text-[10px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
              Pass ID
            </div>
            <div className="font-mono text-sm font-bold">{pass.id}</div>
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-[2px] bg-status-dispatched/15 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-status-dispatched">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          Open
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-3">
        <div>
          <div className="text-[10px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
            Vehicle
          </div>
          <div className="font-mono text-sm font-semibold">{pass.vehicleNumber}</div>
        </div>
        <div>
          <div className="text-[10px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
            Driver
          </div>
          <div className="text-sm font-semibold">{pass.driverName}</div>
        </div>
        <div>
          <div className="text-[10px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
            Transporter
          </div>
          <div className="truncate text-sm font-semibold">{pass.transporter}</div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="rounded-[2px] bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
          Gate {pass.gateNumber || "—"}
        </span>
        <Button size="sm" variant="outline" onClick={onPrint}>
          <Printer className="mr-1.5 h-3.5 w-3.5" />
          Print Pass
        </Button>
      </div>
    </Card>
  );
}

function PassSticker({ pass }: { pass: GatePass }) {
  const bars = useMemo(() => gateBarcodePattern(pass.id), [pass.id]);
  return (
    <div className="rounded-md border-2 border-dashed border-border bg-background p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold font-mono uppercase tracking-[0.06em] text-muted-foreground">
          Inbound Gate Pass
        </span>
      </div>

      <div className="flex flex-col items-center">
        <div className="flex items-end gap-px">
          {bars.map((w, i) => (
            <div
              key={i}
              style={{ width: `${w * 2}px` }}
              className={cn("h-10", i % 2 === 0 ? "bg-foreground" : "bg-transparent")}
            />
          ))}
        </div>
        <div className="mt-1 font-mono text-sm font-bold tracking-wider">{pass.id}</div>
      </div>

      <div className="my-3 border-t border-dashed border-border" />

      <dl className="space-y-1.5 text-xs">
        <StickerRow
          label="Date"
          value={
            pass.dateTime
              ? new Date(pass.dateTime).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
              : "—"
          }
        />
        <StickerRow label="Gate No." value={pass.gateNumber || "—"} />
        <StickerRow label="Transporter" value={pass.transporter} />
        <StickerRow label="Vehicle" value={pass.vehicleNumber} mono />
        <StickerRow label="Driver" value={pass.driverName} />
        {pass.driverMobile && <StickerRow label="Mobile" value={pass.driverMobile} mono />}
        {pass.driverLicense && <StickerRow label="Licence" value={pass.driverLicense} mono />}
      </dl>
    </div>
  );
}

function StickerRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="w-20 shrink-0 text-[10px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </dt>
      <dd className={cn("flex-1 font-medium", mono && "font-mono")}>{value}</dd>
    </div>
  );
}
