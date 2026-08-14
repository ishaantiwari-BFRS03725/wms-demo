import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpFromLine,
  Boxes,
  CheckCircle2,
  Eye,
  Hash,
  Printer,
  RotateCcw,
  Search,
  ShieldCheck,
  Truck,
  Upload,
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_META,
  DOCKS,
  gateBarcodePattern,
  genGatePassId,
  SELLER_DIRECTORY,
  TRANSPORTERS,
  VEHICLE_CONDITIONS,
  VEHICLE_TYPES,
  type ActivityType,
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

const ACTIVITY_ICON: Record<ActivityType, React.ReactNode> = {
  inward: <ArrowDownToLine className="h-5 w-5" />,
  pickup: <ArrowUpFromLine className="h-5 w-5" />,
  returns: <RotateCcw className="h-5 w-5" />,
};

const ACTIVITY_DESC: Record<ActivityType, string> = {
  inward: "Goods arriving into the warehouse.",
  pickup: "Vehicle collecting outbound consignments.",
  returns: "Customer or vendor returns coming back in.",
};

// One gate pass is cut per selected activity — a vehicle at the gate for
// both Inward and Pickup gets two separate passes, sharing the same vehicle
// & driver details.
interface GatePass {
  id: string;
  activity: ActivityType;
  dateTime: string;
  gateNumber: string;
  transporter: string;
  driverName: string;
  driverMobile: string;
  vehicleNumber: string;
  driverLicense: string;
  vehicleCondition: string;
  vehicleType: string;
  sellerName?: string;
  dock?: string;
}

const defaultDateTime = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

function GateEntry() {
  const [step, setStep] = useState<Step>("type");

  // Type — a vehicle can be at the gate for more than one reason at once
  // (e.g. dropping off Inward stock and collecting a Pickup).
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const toggleActivity = (a: ActivityType) =>
    setActivities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

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

  // Seller & activity details (Inward only)
  const [sellerId, setSellerId] = useState("");
  const [dock, setDock] = useState("");
  const [documentsUploaded, setDocumentsUploaded] = useState(false);
  const [sellerDetailsSubmitted, setSellerDetailsSubmitted] = useState(false);

  // Output — one gate pass per selected activity
  const [passes, setPasses] = useState<GatePass[]>([]);
  const [printOne, setPrintOne] = useState<GatePass | null>(null);

  const typeValid = activities.length > 0;
  const detailsValid =
    dateTime.trim() &&
    transporter.trim() &&
    driverName.trim() &&
    vehicleNumber.trim() &&
    (!activities.includes("inward") || sellerDetailsSubmitted);

  const selectedSeller = SELLER_DIRECTORY.find((s) => s.id === sellerId);

  const submit = () => {
    if (activities.length === 0) return;
    const generated: GatePass[] = activities.map((a) => ({
      id: genGatePassId(a === "returns"),
      activity: a,
      dateTime,
      gateNumber,
      transporter,
      driverName,
      driverMobile,
      vehicleNumber,
      driverLicense,
      vehicleCondition,
      vehicleType,
      ...(a === "inward" ? { sellerName: selectedSeller?.name, dock } : {}),
    }));
    setPasses(generated);
    setStep("complete");
  };

  const reset = () => {
    setStep("type");
    setActivities([]);
    setDateTime(defaultDateTime());
    setGateNumber("1");
    setTransporter("");
    setDriverName("");
    setDriverMobile("");
    setVehicleNumber("");
    setDriverLicense("");
    setVehicleCondition(VEHICLE_CONDITIONS[0]);
    setVehicleType("");
    setSellerId("");
    setDock("");
    setDocumentsUploaded(false);
    setSellerDetailsSubmitted(false);
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
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold">Select Activity Type</h2>
              <p className="text-sm text-muted-foreground">
                What is this vehicle at the gate for? Select all that apply.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {(Object.keys(ACTIVITY_META) as ActivityType[]).map((a) => (
                <ActivityCard
                  key={a}
                  active={activities.includes(a)}
                  onClick={() => toggleActivity(a)}
                  icon={ACTIVITY_ICON[a]}
                  title={ACTIVITY_META[a].label}
                  desc={ACTIVITY_DESC[a]}
                />
              ))}
            </div>
            <NavRow
              onNext={() => setStep("details")}
              nextDisabled={!typeValid}
              nextLabel="Continue"
            />
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
                  <Input
                    value={driverLicense}
                    onChange={(e) => setDriverLicense(e.target.value.toUpperCase())}
                    placeholder="License number"
                    className="font-mono"
                  />
                </Field>
                <Field label="Vehicle Condition">
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
            </DetailsSection>

            <DetailsSection title="Activity Type">
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(ACTIVITY_META) as ActivityType[]).map((a) => (
                  <button
                    key={a}
                    onClick={() => toggleActivity(a)}
                    className={cn(
                      "rounded-md border-2 py-2.5 text-sm font-medium transition-colors",
                      activities.includes(a)
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-background text-foreground hover:border-primary/40",
                    )}
                  >
                    {ACTIVITY_META[a].label}
                  </button>
                ))}
              </div>
            </DetailsSection>

            {activities.includes("inward") && (
              <Card className="space-y-4 border-primary/30 bg-primary/5 p-5">
                <div className="text-xs font-semibold font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  Seller &amp; Activity Details
                </div>

                {sellerDetailsSubmitted ? (
                  <div className="flex items-center justify-between rounded-md border border-status-dispatched/30 bg-status-dispatched/10 px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold">{selectedSeller?.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {dock} · Documents attached
                      </div>
                    </div>
                    <button
                      onClick={() => setSellerDetailsSubmitted(false)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <>
                    <Field label="Scan ASN, STN, PO or other">
                      <SellerCombobox value={sellerId} onSelect={setSellerId} />
                    </Field>
                    <Field label="Dock">
                      <Select value={dock} onValueChange={setDock}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Dock" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCKS.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Documents" required>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDocumentsUploaded((v) => !v)}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {documentsUploaded ? "Documents attached" : "Upload Documents"}
                        </Button>
                        {!documentsUploaded && (
                          <span className="text-xs text-destructive">
                            Invoice / Challan required
                          </span>
                        )}
                      </div>
                    </Field>
                    <Button
                      className="w-full bg-status-dispatched text-white hover:bg-status-dispatched/90"
                      disabled={!sellerId || !dock || !documentsUploaded}
                      onClick={() => setSellerDetailsSubmitted(true)}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Submit Seller Details
                    </Button>
                  </>
                )}
              </Card>
            )}

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
        {step === "preview" && activities.length > 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold">Review Gate Entry</h2>
              <p className="text-sm text-muted-foreground">
                Verify all details below. A separate gate pass will be generated for each activity.
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
              <SummaryTile
                label="Gate Passes"
                value={String(activities.length).padStart(2, "0")}
                hint="Will be generated"
              />
              <SummaryTile label="Transporter" value={transporter || "—"} />
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold">Activities ({activities.length})</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {activities.map((a) => (
                  <Card key={a} className="flex items-start gap-3 p-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      {ACTIVITY_ICON[a]}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold">{ACTIVITY_META[a].label}</span>
                        <ActivityBadge activity={a} />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {a === "inward"
                          ? `${selectedSeller?.name ?? "—"} · ${dock || "—"}`
                          : "Standard gate pass · " + vehicleNumber}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
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
                <FooterFact label="Vehicle Type" value={vehicleType || "—"} />
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
              This entry will be logged with a timestamp on submission · All data verified per
              warehouse protocols.
            </p>
          </div>
        )}

        {/* Step 4 — Complete / Gate passes */}
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
                  The vehicle has been registered at the gate. The following {passes.length} gate
                  pass{passes.length === 1 ? "" : "es"} have been generated and are ready for
                  printing.
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

function ActivityCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-md border-2 p-4 text-left transition-colors",
        active
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:border-primary/40",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <div>
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          {title}
          {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
        </div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </button>
  );
}

/* ------------------------------------------------------- Seller combobox */

function SellerCombobox({ value, onSelect }: { value: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = SELLER_DIRECTORY.find((s) => s.id === value);
  const q = query.trim().toLowerCase();
  const results = q
    ? SELLER_DIRECTORY.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.asn.toLowerCase().includes(q),
      )
    : SELLER_DIRECTORY;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-11 w-full justify-start font-normal",
            !selected && "text-muted-foreground",
          )}
        >
          <Search className="mr-2 h-4 w-4" />
          {selected
            ? `${selected.name} · ${selected.asn}`
            : "Search seller / vendor / ASN / PO (or scan STN)"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search seller / vendor / ASN…"
          />
          <CommandList>
            {results.length === 0 ? (
              <CommandEmpty>No sellers found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {results.map((s) => (
                  <CommandItem
                    key={s.id}
                    value={s.id}
                    onSelect={() => {
                      onSelect(s.id);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">{s.name}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{s.asn}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
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

const ACTIVITY_TONE_CLASS: Record<string, string> = {
  blue: "bg-status-picked/15 text-status-picked",
  purple: "bg-status-manifested/15 text-status-manifested",
  amber: "bg-status-packed/15 text-status-packed",
};

function ActivityBadge({ activity }: { activity: ActivityType }) {
  const meta = ACTIVITY_META[activity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[2px] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em]",
        ACTIVITY_TONE_CLASS[meta.tone],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

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

      <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-4">
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
            {pass.sellerName ? "Seller" : "Transporter"}
          </div>
          <div className="truncate text-sm font-semibold">
            {pass.sellerName ?? pass.transporter}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
            Activity Type
          </div>
          <div className="mt-0.5">
            <ActivityBadge activity={pass.activity} />
          </div>
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
        <ActivityBadge activity={pass.activity} />
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
        {pass.sellerName && <StickerRow label="Seller" value={pass.sellerName} />}
        {pass.dock && <StickerRow label="Dock" value={pass.dock} />}
        <StickerRow label="Activity" value={ACTIVITY_META[pass.activity].label} />
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
