import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { PageHeader } from "@/components/wms/page-header";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BoxIdTable } from "@/components/wms/pre-grn-boxes";
import { listBoxes, type BoxStatus } from "@/lib/wms/pre-grn-data";

export const Route = createFileRoute("/_wms/box-id-register")({
  head: () => ({
    meta: [{ title: "Box ID Register — Inbound" }],
  }),
  component: BoxIdRegisterPage,
});

const ALL = "all";
const STATUSES: BoxStatus[] = ["Open", "Received", "Closed", "Voided"];

function BoxIdRegisterPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [asn, setAsn] = useState(ALL);
  const [tick, setTick] = useState(0);

  const all = listBoxes();
  const asnOptions = useMemo(() => Array.from(new Set(all.map((b) => b.asnId))).sort(), [all]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((b) => {
      if (q) {
        const hay =
          `${b.boxId} ${b.sku} ${b.skuName} ${b.batch} ${b.preGrnId} ${b.asnId} ${b.poNumber}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (status !== ALL && b.status !== status) return false;
      if (asn !== ALL && b.asnId !== asn) return false;
      return true;
    });
    // `tick` forces a re-read after a reprint mutates the register.
  }, [all, search, status, asn, tick]);

  return (
    <div>
      <PageHeader
        title="Box ID Register"
        subtitle="Every Box ID issued at Pre-GRN, with its attributes, status and history."
        actions={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Box ID, SKU, batch, Pre-GRN…"
                className="h-9 w-72 pl-8"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={asn} onValueChange={setAsn}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All ASNs</SelectItem>
                {asnOptions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      <div className="space-y-4 p-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
          {visible.length} of {all.length} boxes
        </div>
        <BoxIdTable boxes={visible} showPreGrn onChanged={() => setTick((t) => t + 1)} />
      </div>
    </div>
  );
}
