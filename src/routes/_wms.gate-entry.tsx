import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Anchor,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Boxes,
  Building2,
  CheckCircle2,
  ImageUp,
  Layers,
  MapPin,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  Thermometer,
  Trash2,
  Truck,
  Users,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_META,
  ACTIVITY_TYPES,
  boxCountForSeller,
  COMMUNITY_META,
  genGatePassId,
  gateBarcodePattern,
  getTripInfo,
  lineWeightFor,
  SELLER_DIRECTORY,
  summaryLinesFor,
  VEHICLE_TYPES,
  type ActivityType,
  type Community,
  type SellerRecord,
} from "@/lib/wms/gate-entry-data";

export const Route = createFileRoute("/_wms/gate-entry")({
  head: () => ({
    meta: [{ title: "Gate Entry — Inbound" }],
  }),
  component: GateEntry,
});

type Step = "origin" | "vehicle" | "method" | "summary" | "complete";
type Method = "po" | "trip";

const STEPS: { id: Step; label: string }[] = [
  { id: "origin", label: "Origin" },
  { id: "vehicle", label: "Vehicle" },
  { id: "method", label: "Consignment" },
  { id: "summary", label: "Summary" },
];

interface AddedSeller extends SellerRecord {
  activity: ActivityType;
  boxes: number;
}

interface GatePass {
  id: string;
  seller: AddedSeller;
  activity: ActivityType;
  boxes: number;
}

function GateEntry() {
  const [step, setStep] = useState<Step>("origin");

  // Origin
  const [transporter, setTransporter] = useState("");
  const [transporterContact, setTransporterContact] = useState("");
  const [origin, setOrigin] = useState("");

  // Vehicle & driver
  const [vehicleNo, setVehicleNo] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [driverLicense, setDriverLicense] = useState("");

  // Consignment method
  const [method, setMethod] = useState<Method>("po");

  // Seller PO path
  const [sellers, setSellers] = useState<AddedSeller[]>([]);
  const [runsheetUploaded, setRunsheetUploaded] = useState(false);
  const [maxWeight, setMaxWeight] = useState("");
  const [tempControlled, setTempControlled] = useState(false);

  // Trip ID path
  const [tripId, setTripId] = useState("");

  // Output
  const [passes, setPasses] = useState<GatePass[]>([]);
  const [printAllOpen, setPrintAllOpen] = useState(false);
  const [printOne, setPrintOne] = useState<GatePass | null>(null);

  const tripInfo = useMemo(
    () =>
      method === "trip" && tripId.trim().length >= 4
        ? getTripInfo(tripId, vehicleType)
        : null,
    [method, tripId, vehicleType],
  );

  // Sellers actually on this consignment — explicit for PO, system-clubbed for
  // a Trip ID (identities stay behind the scenes during entry).
  const activeSellers: AddedSeller[] = useMemo(
    () =>
      method === "trip"
        ? (tripInfo?.sellers.map((s) => ({
            ...s,
            activity: s.defaultActivity,
            boxes: boxCountForSeller(s.id),
          })) ?? [])
        : sellers,
    [method, tripInfo, sellers],
  );

  const availableSellers = SELLER_DIRECTORY.filter(
    (s) => !sellers.some((a) => a.id === s.id),
  );

  const addSeller = (id: string) => {
    const rec = SELLER_DIRECTORY.find((s) => s.id === id);
    if (!rec) return;
    if (sellers.some((s) => s.id === rec.id)) return; // dedup guard
    const picked = VEHICLE_TYPES.find((v) => v.label === vehicleType);
    if (picked && !maxWeight) setMaxWeight(String(picked.maxWeight));
    setSellers((prev) => [
      ...prev,
      { ...rec, activity: rec.defaultActivity, boxes: boxCountForSeller(rec.id) },
    ]);
  };

  const setSellerActivity = (id: string, activity: ActivityType) =>
    setSellers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, activity } : s)),
    );

  const setSellerBoxes = (id: string, boxes: number) =>
    setSellers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, boxes } : s)),
    );

  const removeSeller = (id: string) =>
    setSellers((prev) => prev.filter((s) => s.id !== id));

  const totals = useMemo(() => {
    const lineItems = activeSellers.reduce(
      (sum, s) => sum + summaryLinesFor(s, s.activity).length,
      0,
    );
    const skuCount = activeSellers.reduce((sum, s) => sum + s.skuCount, 0);
    const weight = activeSellers.reduce(
      (sum, s) => sum + lineWeightFor(s, s.activity),
      0,
    );
    return { lineItems, skuCount, weight };
  }, [activeSellers]);

  const originValid = transporter.trim() && origin.trim();
  const vehicleValid = vehicleNo.trim() && vehicleType && driverName.trim();
  const consignmentValid =
    method === "po" ? sellers.length > 0 : !!tripInfo;

  const submit = () => {
    const generated: GatePass[] = activeSellers.map((s) => ({
      id: genGatePassId(),
      seller: s,
      activity: s.activity,
      boxes: s.boxes,
    }));
    setPasses(generated);
    setStep("complete");
  };

  const reset = () => {
    setStep("origin");
    setTransporter("");
    setTransporterContact("");
    setOrigin("");
    setVehicleNo("");
    setVehicleType("");
    setDriverName("");
    setDriverPhone("");
    setDriverLicense("");
    setMethod("po");
    setSellers([]);
    setRunsheetUploaded(false);
    setMaxWeight("");
    setTempControlled(false);
    setTripId("");
    setPasses([]);
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-muted/40">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">
                {step === "complete"
                  ? "Gate Entry · Registration"
                  : "New Gate Entry"}
              </h1>
              <p className="text-xs text-muted-foreground">
                Inbound vehicle registration · North-A1 Warehouse
              </p>
            </div>
          </div>
          {step !== "complete" && <Stepper current={step} />}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {/* Step 1 — Origin */}
        {step === "origin" && (
          <SectionCard
            icon={<MapPin className="h-4 w-4" />}
            title="Origin & Transporter"
            subtitle="Where the vehicle is coming from."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Transporter Name" required>
                <Input
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                  placeholder="e.g. BlueDart Surface"
                />
              </Field>
              <Field label="Transporter Contact">
                <Input
                  value={transporterContact}
                  onChange={(e) => setTransporterContact(e.target.value)}
                  placeholder="Phone / coordinator"
                />
              </Field>
              <Field label="Origin Location" required>
                <Input
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. Bhiwandi Hub, MH"
                />
              </Field>
            </div>
            <GateProtocol />
            <NavRow
              onNext={() => setStep("vehicle")}
              nextDisabled={!originValid}
            />
          </SectionCard>
        )}

        {/* Step 2 — Vehicle & driver */}
        {step === "vehicle" && (
          <SectionCard
            icon={<Truck className="h-4 w-4" />}
            title="Vehicle & Driver"
            subtitle="Captured at the gate before docking."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Vehicle Number" required>
                <Input
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                  placeholder="e.g. HR-38-AS-9921"
                  className="font-mono"
                />
              </Field>
              <Field label="Vehicle Type" required>
                <Select
                  value={vehicleType}
                  onValueChange={(v) => {
                    setVehicleType(v);
                    const picked = VEHICLE_TYPES.find((t) => t.label === v);
                    if (picked) setMaxWeight(String(picked.maxWeight));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type…" />
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
              <Field label="Driver Name" required>
                <Input
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="e.g. Vikram Singh"
                />
              </Field>
              <Field label="Driver Phone">
                <Input
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="Mobile number"
                />
              </Field>
              <Field label="Driver Licence No.">
                <Input
                  value={driverLicense}
                  onChange={(e) =>
                    setDriverLicense(e.target.value.toUpperCase())
                  }
                  placeholder="DL number"
                  className="font-mono"
                />
              </Field>
            </div>
            <NavRow
              onBack={() => setStep("origin")}
              onNext={() => setStep("method")}
              nextDisabled={!vehicleValid}
            />
          </SectionCard>
        )}

        {/* Step 3 — Consignment method */}
        {step === "method" && (
          <div className="space-y-6">
            {/* Method chooser */}
            <div className="grid gap-3 sm:grid-cols-2">
              <MethodCard
                active={method === "po"}
                onClick={() => setMethod("po")}
                icon={<Building2 className="h-5 w-5" />}
                title="Seller PO"
                desc="Add individual sellers by vendor / ASN."
              />
              <MethodCard
                active={method === "trip"}
                onClick={() => setMethod("trip")}
                icon={<Layers className="h-5 w-5" />}
                title="Trip ID"
                desc="Clubbed community-program consignment."
              />
            </div>

            {/* ---- Seller PO ---- */}
            {method === "po" && (
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div className="space-y-6">
                  <Card className="space-y-3 p-5">
                    <div className="text-sm font-semibold">Select Sellers</div>
                    <VendorCombobox
                      available={availableSellers}
                      onAdd={addSeller}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Type at least 3 characters to search. Each result shows the
                      vendor&apos;s ASN; community sellers are flagged.
                    </p>
                  </Card>

                  <Card className="overflow-hidden">
                    <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          Added Sellers
                        </span>
                        <span className="rounded-[2px] bg-primary/10 px-2 py-0.5 text-[10px] font-semibold font-mono uppercase tracking-[0.06em] text-primary">
                          {sellers.length} seller
                          {sellers.length === 1 ? "" : "s"} added
                        </span>
                      </div>
                      {sellers.length > 0 && (
                        <button
                          onClick={() => setSellers([])}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {sellers.length === 0 ? (
                      <div className="flex flex-col items-center gap-1 px-5 py-10 text-center">
                        <Building2 className="h-7 w-7 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                          No sellers added yet.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Search the dropdown above to start.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-2 text-[11px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                          <span>Seller / ASN</span>
                          <span className="w-28">Warehouse ID</span>
                          <span className="w-20">Boxes</span>
                          <span className="w-36">Activity</span>
                          <span className="w-8 text-right" />
                        </div>
                        {sellers.map((s) => (
                          <div
                            key={s.id}
                            className={cn(
                              "grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3",
                              s.community && "bg-primary/[0.03]",
                            )}
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <SellerAvatar name={s.name} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="truncate text-sm font-medium">
                                    {s.name}
                                  </span>
                                  {s.community && (
                                    <CommunityTag
                                      community={s.community}
                                      small
                                    />
                                  )}
                                </div>
                                <div className="font-mono text-[11px] text-muted-foreground">
                                  {s.asn}
                                </div>
                              </div>
                            </div>
                            <span className="w-28 font-mono text-xs text-muted-foreground">
                              {s.warehouseId}
                            </span>
                            <Input
                              value={String(s.boxes)}
                              onChange={(e) =>
                                setSellerBoxes(
                                  s.id,
                                  Math.max(
                                    0,
                                    Number(e.target.value.replace(/[^0-9]/g, "")) ||
                                      0,
                                  ),
                                )
                              }
                              inputMode="numeric"
                              className="h-8 w-20 text-center font-mono text-xs"
                              title="Boxes recorded at gate"
                            />
                            <div className="w-36">
                              <Select
                                value={s.activity}
                                onValueChange={(v) =>
                                  setSellerActivity(s.id, v as ActivityType)
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ACTIVITY_TYPES.map((a) => (
                                    <SelectItem key={a} value={a}>
                                      {ACTIVITY_META[a].label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <button
                              onClick={() => removeSeller(s.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                              title="Remove"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  <NavRow
                    onBack={() => setStep("vehicle")}
                    onNext={() => setStep("summary")}
                    nextLabel="Proceed to Summary"
                    nextDisabled={!consignmentValid}
                  />
                </div>

                {/* Optional details */}
                <div className="space-y-4">
                  <Card className="space-y-3 p-4">
                    <div className="text-sm font-medium">
                      Route Runsheet Photo
                    </div>
                    <button
                      onClick={() => setRunsheetUploaded((v) => !v)}
                      className={cn(
                        "flex w-full flex-col items-center gap-2 rounded-md border-2 border-dashed px-4 py-6 text-center transition-colors",
                        runsheetUploaded
                          ? "border-status-dispatched/40 bg-status-dispatched/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/40",
                      )}
                    >
                      {runsheetUploaded ? (
                        <>
                          <CheckCircle2 className="h-7 w-7 text-status-dispatched" />
                          <span className="text-xs font-medium text-status-dispatched">
                            runsheet.jpg attached
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Click to remove
                          </span>
                        </>
                      ) : (
                        <>
                          <ImageUp className="h-7 w-7 text-primary" />
                          <span className="text-xs font-medium">
                            Click or drag to upload
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            PNG, JPG up to 10MB
                          </span>
                        </>
                      )}
                    </button>
                  </Card>

                  <Card className="space-y-4 p-4">
                    <Field label="Max Weight Capacity">
                      <div className="relative">
                        <Input
                          value={maxWeight}
                          onChange={(e) =>
                            setMaxWeight(e.target.value.replace(/[^0-9]/g, ""))
                          }
                          placeholder="5000"
                          className="pr-12 font-mono"
                          inputMode="numeric"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground">
                          KG
                        </span>
                      </div>
                      {vehicleType && (
                        <p className="text-[11px] text-muted-foreground">
                          Suggested from {vehicleType}.
                        </p>
                      )}
                    </Field>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <Thermometer className="h-3.5 w-3.5 text-muted-foreground" />
                        Temperature Controlled
                      </div>
                      <div className="grid grid-cols-2 gap-1 rounded-md border border-border p-1">
                        <button
                          onClick={() => setTempControlled(false)}
                          className={cn(
                            "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                            !tempControlled
                              ? "bg-background"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          No
                        </button>
                        <button
                          onClick={() => setTempControlled(true)}
                          className={cn(
                            "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                            tempControlled
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          Yes
                        </button>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* ---- Trip ID ---- */}
            {method === "trip" && (
              <div className="space-y-5">
                <Card className="space-y-3 p-5">
                  <Field label="Trip ID" required>
                    <Input
                      value={tripId}
                      onChange={(e) => setTripId(e.target.value.toUpperCase())}
                      placeholder="e.g. TRIP-FK-88213"
                      className="h-11 font-mono"
                    />
                  </Field>
                  <p className="text-[11px] text-muted-foreground">
                    A Trip ID is a pre-clubbed, multi-seller community
                    consignment. The dock is auto-assigned from the community
                    program and the vehicle brought in.
                  </p>
                </Card>

                {tripInfo ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <InfoTile
                      icon={<Users className="h-4 w-4" />}
                      label="Community Program"
                      value={tripInfo.community}
                      accent
                    />
                    <InfoTile
                      icon={<Anchor className="h-4 w-4" />}
                      label="Assigned Dock"
                      value={tripInfo.dock}
                    />
                    <InfoTile
                      icon={<Layers className="h-4 w-4" />}
                      label="Clubbed Sellers"
                      value={String(tripInfo.clubbedCount)}
                    />
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
                    Enter a Trip ID to load the community program and dock
                    assignment.
                  </div>
                )}

                <NavRow
                  onBack={() => setStep("vehicle")}
                  onNext={() => setStep("summary")}
                  nextLabel="Proceed to Summary"
                  nextDisabled={!consignmentValid}
                />
              </div>
            )}
          </div>
        )}

        {/* Step 4 — Summary */}
        {step === "summary" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold">Review Gate Entry</h2>
              <p className="text-sm text-muted-foreground">
                {method === "po"
                  ? "Verify all details below before confirming. Each group is categorised by seller and activity type."
                  : "Clubbed community consignment. Verify the program and dock before confirming."}
              </p>
            </div>

            {method === "po" ? (
              <>
                <div className="grid gap-3 sm:grid-cols-4">
                  <SummaryTile
                    label="Total Sellers"
                    value={String(sellers.length).padStart(2, "0")}
                    hint="Active vendors"
                  />
                  <SummaryTile
                    label="Line Items"
                    value={String(totals.lineItems)}
                    hint={`${totals.skuCount} SKUs`}
                  />
                  <SummaryTile
                    label="Est. Weight"
                    value={`${Math.round(totals.weight).toLocaleString()}`}
                    hint="Kilograms"
                  />
                  <SummaryTile
                    label="Vehicle"
                    value={vehicleNo || "—"}
                    hint="Verified"
                    accent
                    icon={<BadgeCheck className="h-4 w-4" />}
                  />
                </div>

                <div className="space-y-4">
                  {sellers.map((s) => (
                    <SellerSummary key={s.id} seller={s} />
                  ))}
                </div>
              </>
            ) : (
              tripInfo && (
                <div className="grid gap-3 sm:grid-cols-4">
                  <SummaryTile
                    label="Trip ID"
                    value={tripInfo.tripId}
                    hint="Clubbed consignment"
                  />
                  <SummaryTile
                    label="Community"
                    value={tripInfo.community}
                    hint="Program"
                    accent
                    icon={<Users className="h-4 w-4" />}
                  />
                  <SummaryTile
                    label="Assigned Dock"
                    value={tripInfo.dock}
                    hint="Auto-assigned"
                  />
                  <SummaryTile
                    label="Clubbed Sellers"
                    value={String(tripInfo.clubbedCount)}
                    hint="Behind the scenes"
                  />
                </div>
              )
            )}

            {/* Footer */}
            <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="flex flex-wrap gap-x-8 gap-y-2">
                <FooterFact label="Vehicle Reg" value={vehicleNo || "—"} mono />
                <FooterFact label="Driver" value={driverName || "—"} />
                <FooterFact label="Transporter" value={transporter || "—"} />
                {method === "po" && (
                  <>
                    <FooterFact
                      label="Temp. Controlled"
                      value={tempControlled ? "Yes" : "No"}
                    />
                    <FooterFact
                      label="Max Weight"
                      value={maxWeight ? `${maxWeight} kg` : "—"}
                      mono
                    />
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setStep("method")}>
                  Back
                </Button>
                <Button onClick={submit}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Confirm &amp; Submit
                </Button>
              </div>
            </Card>
            <p className="text-center text-[11px] text-muted-foreground">
              This entry is logged with timestamp{" "}
              {new Date().toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}{" "}
              · All data verified per warehouse protocols.
            </p>
          </div>
        )}

        {/* Step 5 — Complete / Gate passes */}
        {step === "complete" && (
          <div className="space-y-5">
            <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-status-dispatched/15 text-status-dispatched">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-semibold font-mono uppercase tracking-[0.06em] text-status-dispatched">
                    Process Complete
                  </div>
                  <div className="text-base font-semibold">
                    Registration successful
                  </div>
                  <p className="max-w-xl text-sm text-muted-foreground">
                    All inbound items registered. The following {passes.length}{" "}
                    gate pass{passes.length === 1 ? "" : "es"} have been
                    generated and are ready for printing and gate deployment.
                  </p>
                </div>
              </div>
              <Button onClick={() => setPrintAllOpen(true)}>
                <Printer className="mr-2 h-4 w-4" />
                Print All Passes
              </Button>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              {passes.map((p) => (
                <GatePassCard
                  key={p.id}
                  pass={p}
                  onPrint={() => setPrintOne(p)}
                />
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryTile
                label="Total Items"
                value={String(totals.skuCount)}
                hint="SKUs"
              />
              <SummaryTile label="Est. Processing" value="45" hint="Minutes" />
              <SummaryTile
                label="Current Queue"
                value="Low"
                hint="Immediate docking"
                accent
              />
            </div>

            <div className="flex justify-center pt-1">
              <Button variant="outline" onClick={reset}>
                <Plus className="mr-2 h-4 w-4" />
                New Gate Entry
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Print all dialog */}
      <Dialog open={printAllOpen} onOpenChange={setPrintAllOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              {passes.length} gate pass{passes.length === 1 ? "" : "es"}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto">
            {passes.map((p) => (
              <PassSticker key={p.id} pass={p} />
            ))}
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={() => setPrintAllOpen(false)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Printed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                {done ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
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

function SectionCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="space-y-5 p-6">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </span>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>
      {children}
    </Card>
  );
}

function MethodCard({
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
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
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
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

function GateProtocol() {
  return (
    <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold font-mono uppercase tracking-[0.06em] text-primary">
        <ShieldCheck className="h-3.5 w-3.5" />
        Gate Protocol
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        All inbound vehicles must have a pre-registered ASN (Advanced Shipping
        Notice). If no ASN exists, contact the procurement office before
        admitting the vehicle.
      </p>
    </div>
  );
}

/* ------------------------------------------------------- Vendor combobox */

function VendorCombobox({
  available,
  onAdd,
}: {
  available: SellerRecord[];
  onAdd: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results =
    q.length >= 3
      ? available.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.id.toLowerCase().includes(q) ||
            s.asn.toLowerCase().includes(q),
        )
      : [];

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-11 w-full justify-start font-normal text-muted-foreground"
        >
          <Search className="mr-2 h-4 w-4" />
          Search and add multiple sellers…
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Type 3+ characters…"
          />
          <CommandList>
            {q.length < 3 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                Type at least 3 characters to search vendors.
              </div>
            ) : results.length === 0 ? (
              <CommandEmpty>No vendors found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {results.map((s) => (
                  <CommandItem
                    key={s.id}
                    value={s.id}
                    onSelect={() => {
                      onAdd(s.id);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium">
                          {s.name}
                        </span>
                        {s.community && (
                          <CommunityTag community={s.community} small />
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {s.asn}
                      </span>
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

/* ----------------------------------------------------------- Small parts */

function SellerAvatar({ name }: { name: string }) {
  const letter = name.charAt(0).toUpperCase();
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
      {letter}
    </span>
  );
}

const COMMUNITY_TONE: Record<string, string> = {
  blue: "bg-status-picked/15 text-status-picked",
  amber: "bg-status-packed/15 text-status-packed",
  pink: "bg-pink-100 text-pink-700",
};

function CommunityTag({
  community,
  small,
}: {
  community: Community;
  small?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[2px] font-mono font-semibold uppercase tracking-[0.06em]",
        small ? "px-1.5 py-0.5 text-[9.5px]" : "px-2 py-0.5 text-[10px]",
        COMMUNITY_TONE[COMMUNITY_META[community].tone],
      )}
    >
      <Users className="h-3 w-3" />
      {community}
    </span>
  );
}

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
      <div className="mt-1 truncate text-2xl font-bold tabular-nums">
        {value}
      </div>
      {hint && (
        <div className="text-[11px] font-medium text-muted-foreground">
          {hint}
        </div>
      )}
    </Card>
  );
}

function InfoTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card className={cn("p-4", accent && "border-primary/40 bg-primary/5")}>
      <div className="flex items-center gap-1.5 text-[11px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
        <span className={accent ? "text-primary" : "text-muted-foreground"}>
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-1 font-mono text-lg font-bold">{value}</div>
    </Card>
  );
}

function FooterFact({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      <div className={cn("text-sm font-semibold", mono && "font-mono")}>
        {value}
      </div>
    </div>
  );
}

/* --------------------------------------------------------- Seller summary */

function SellerSummary({ seller }: { seller: AddedSeller }) {
  const lines = summaryLinesFor(seller, seller.activity);
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <SellerAvatar name={seller.name} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold">{seller.name}</span>
              {seller.community && <CommunityTag community={seller.community} small />}
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">
              {seller.asn} · {seller.id}
            </div>
          </div>
        </div>
        <ActivityBadge activity={seller.activity} />
      </div>

      <div className="border-t border-border">
        {seller.activity === "inward" && (
          <SummaryTable
            head={["Item Description", "Invoice #", "Quantity", "Weight"]}
            rows={lines.map((l) =>
              l.kind === "inward"
                ? [l.description, l.invoice, `${l.qty} Units`, `${l.weight} kg`]
                : [],
            )}
          />
        )}
        {seller.activity === "returns" && (
          <SummaryTable
            head={["Item Description", "RMA Ticket", "Return Reason", "Qty"]}
            rows={lines.map((l) =>
              l.kind === "returns"
                ? [l.description, l.rma, l.reason, `${l.qty} Units`]
                : [],
            )}
          />
        )}
        {seller.activity === "pickup" && (
          <SummaryTable
            head={["Batch Identifier", "Pickup Ref", "Pallets", "Loading Dock"]}
            rows={lines.map((l) =>
              l.kind === "pickup"
                ? [l.description, l.pickupRef, `${l.pallets} Pallets`, l.dock]
                : [],
            )}
          />
        )}
      </div>
    </Card>
  );
}

function SummaryTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-muted/40 text-left text-[11px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
          {head.map((h, i) => (
            <th
              key={h}
              className={cn(
                "px-5 py-2 font-medium",
                i === 0 ? "" : "whitespace-nowrap",
              )}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.map((r, ri) => (
          <tr key={ri}>
            {r.map((c, ci) => (
              <td
                key={ci}
                className={cn(
                  "px-5 py-2.5",
                  ci === 0
                    ? "font-medium"
                    : "whitespace-nowrap text-muted-foreground",
                  ci === 1 && "font-mono text-xs",
                )}
              >
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ------------------------------------------------------------- Gate pass */

function GatePassCard({
  pass,
  onPrint,
}: {
  pass: GatePass;
  onPrint: () => void;
}) {
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

      <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
        <div>
          <div className="text-[10px] font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
            Seller Name
          </div>
          <div className="text-sm font-semibold">{pass.seller.name}</div>
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
          ITM +{pass.seller.skuCount}
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
        <span className="text-[10px] font-semibold font-mono uppercase tracking-[0.06em]r text-muted-foreground">
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
              className={cn(
                "h-10",
                i % 2 === 0 ? "bg-foreground" : "bg-transparent",
              )}
            />
          ))}
        </div>
        <div className="mt-1 font-mono text-sm font-bold tracking-wider">
          {pass.id}
        </div>
      </div>

      <div className="my-3 border-t border-dashed border-border" />

      <dl className="space-y-1.5 text-xs">
        <StickerRow label="Seller" value={pass.seller.name} />
        <StickerRow label="Vendor ID" value={pass.seller.id} mono />
        {pass.seller.community && (
          <StickerRow label="Community" value={pass.seller.community} />
        )}
        <StickerRow label="ASN" value={pass.seller.asn} mono />
        <StickerRow
          label="Activity"
          value={ACTIVITY_META[pass.activity].label}
        />
        <StickerRow label="Boxes" value={`${pass.boxes}`} />
        <StickerRow label="Items" value={`${pass.seller.skuCount} SKUs`} />
        <StickerRow label="Warehouse" value={pass.seller.warehouseId} mono />
      </dl>
    </div>
  );
}

function StickerRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="w-20 shrink-0 text-[10px] font-mono uppercase tracking-[0.06em]r text-muted-foreground">
        {label}
      </dt>
      <dd className={cn("flex-1 font-medium", mono && "font-mono")}>{value}</dd>
    </div>
  );
}
