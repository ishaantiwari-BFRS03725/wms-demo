import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Boxes,
  Check,
  ChevronRight,
  ChevronsUpDown,
  Layers,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CHILD_SKUS,
  KIT_MAPPINGS,
  KIT_SKU_MASTER,
  childBySku,
  kitMasterBySku,
  type KitComponent,
  type KitMapping,
} from "@/lib/wms/kit-data";

export const Route = createFileRoute("/_wms/kit-mapping")({
  head: () => ({
    meta: [{ title: "Kit Mapping — Inventory" }],
  }),
  component: KitMappingScreen,
});

interface DraftComponent {
  sku: string;
  qty: string;
}

function KitMappingScreen() {
  const [mappings, setMappings] = useState<KitMapping[]>(KIT_MAPPINGS);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  // New-mapping form state
  const [kitSku, setKitSku] = useState("");
  const [kitName, setKitName] = useState("");
  const [rows, setRows] = useState<DraftComponent[]>([{ sku: "", qty: "" }]);

  const resetForm = () => {
    setKitSku("");
    setKitName("");
    setRows([{ sku: "", qty: "" }]);
  };

  // Kit SKUs from the master that are not already mapped.
  const kitSkuOptions = useMemo(() => {
    const mapped = new Set(mappings.map((m) => m.kitSku));
    return KIT_SKU_MASTER.filter((k) => !mapped.has(k.sku));
  }, [mappings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mappings;
    return mappings.filter((m) =>
      `${m.kitSku} ${m.kitName} ${m.components.map((c) => `${c.sku} ${c.name}`).join(" ")}`
        .toLowerCase()
        .includes(q),
    );
  }, [mappings, query]);

  const addRow = () => setRows((r) => [...r, { sku: "", qty: "" }]);
  const removeRow = (i: number) =>
    setRows((r) => (r.length === 1 ? r : r.filter((_, idx) => idx !== i)));
  const setRow = (i: number, patch: Partial<DraftComponent>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const saveMapping = () => {
    if (!kitSku.trim() || !kitName.trim()) {
      toast.error("Enter a Kit SKU and name");
      return;
    }
    if (mappings.some((m) => m.kitSku === kitSku.trim())) {
      toast.error("A mapping already exists for this Kit SKU");
      return;
    }
    const cleaned = rows
      .filter((r) => r.sku && Number(r.qty) > 0)
      .map<KitComponent>((r) => ({
        sku: r.sku,
        name: childBySku(r.sku)?.name ?? r.sku,
        qty: Number(r.qty),
      }));
    if (cleaned.length === 0) {
      toast.error("Add at least one child component with quantity");
      return;
    }
    const skuSet = new Set(cleaned.map((c) => c.sku));
    if (skuSet.size !== cleaned.length) {
      toast.error("A child SKU is repeated — combine them into one row");
      return;
    }
    const mapping: KitMapping = {
      kitSku: kitSku.trim(),
      kitName: kitName.trim(),
      components: cleaned,
      updatedAt: new Date().toLocaleDateString("en-GB"),
    };
    setMappings((prev) => [mapping, ...prev]);
    toast.success(`Kit mapping for ${mapping.kitSku} saved`);
    resetForm();
    setFormOpen(false);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Kit Mapping</h1>
          <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
            Define the bill-of-materials for each Kit (mother) SKU — the child
            component SKUs and the quantity of each needed to build one unit. Kit
            availability is derived from component stock; the kit holds no
            independent inventory.
          </p>
        </div>
        <Button onClick={() => setFormOpen((o) => !o)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Kit Mapping
        </Button>
      </div>

      {/* New-mapping form */}
      {formOpen && (
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <Layers className="h-4 w-4 text-primary" />
            <div className="text-sm font-semibold">Create Kit Mapping</div>
          </div>
          <div className="space-y-5 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Kit SKU (mother)">
                <KitSkuSelect
                  value={kitSku}
                  options={kitSkuOptions}
                  onChange={(sku) => {
                    setKitSku(sku);
                    setKitName(kitMasterBySku(sku)?.name ?? "");
                  }}
                />
              </Field>
              <Field label="Kit Name">
                <Input
                  value={kitName}
                  readOnly
                  placeholder="Auto-filled from SKU master"
                  className="bg-muted/40"
                />
              </Field>
            </div>

            {/* Components */}
            <div className="space-y-2">
              <div className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
                Child Components
              </div>
              <div className="space-y-2">
                {rows.map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Select
                      value={row.sku}
                      onValueChange={(v) => setRow(i, { sku: v })}
                    >
                      <SelectTrigger className="flex-1 font-mono">
                        <SelectValue placeholder="Select child SKU…" />
                      </SelectTrigger>
                      <SelectContent>
                        {CHILD_SKUS.map((c) => (
                          <SelectItem key={c.sku} value={c.sku}>
                            <span className="font-mono">{c.sku}</span>
                            <span className="ml-2 text-muted-foreground">
                              {c.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      inputMode="numeric"
                      value={row.qty}
                      onChange={(e) =>
                        setRow(i, {
                          qty: e.target.value.replace(/[^0-9]/g, ""),
                        })
                      }
                      placeholder="Qty / kit"
                      className="w-28 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Remove component"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRow}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add component
              </Button>
            </div>

            <div className="flex items-center gap-2 border-t border-border pt-4">
              <Button onClick={saveMapping}>Save Mapping</Button>
              <Button
                variant="ghost"
                onClick={() => {
                  resetForm();
                  setFormOpen(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Existing mappings */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div className="text-sm font-semibold">Kit Mappings</div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search kit or child SKU…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 w-64 pl-8 pr-8"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <span className="whitespace-nowrap text-xs text-muted-foreground">
              {filtered.length} of {mappings.length} kits
            </span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-muted-foreground">
            <Boxes className="h-8 w-8 opacity-30" />
            <p className="text-sm">No kit mappings match your search.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((m) => (
              <div key={m.kitSku} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold">
                          {m.kitSku}
                        </span>
                        <span className="text-sm font-medium">{m.kitName}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {m.components.length}{" "}
                        {m.components.length === 1 ? "component" : "components"} ·
                        Updated {m.updatedAt}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Components — BOM */}
                <div className="mt-3 ml-12 flex flex-wrap gap-2">
                  {m.components.map((c) => (
                    <div
                      key={c.sku}
                      className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs"
                    >
                      <span
                        className={cn(
                          "flex h-5 min-w-5 items-center justify-center rounded bg-primary/10 px-1 font-mono font-semibold text-primary",
                        )}
                      >
                        {c.qty}×
                      </span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono">{c.sku}</span>
                      <span className="text-muted-foreground">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function KitSkuSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { sku: string; name: string }[];
  onChange: (sku: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? kitMasterBySku(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-2">
              <span className="font-mono">{selected.sku}</span>
              <span className="truncate text-muted-foreground">
                {selected.name}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">Search Kit SKU…</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search SKU or name…" />
          <CommandList>
            <CommandEmpty>No matching Kit SKU.</CommandEmpty>
            <CommandGroup>
              {options.map((k) => (
                <CommandItem
                  key={k.sku}
                  value={`${k.sku} ${k.name}`}
                  onSelect={() => {
                    onChange(k.sku);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === k.sku ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="font-mono">{k.sku}</span>
                  <span className="ml-2 truncate text-muted-foreground">
                    {k.name}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium font-mono uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}
