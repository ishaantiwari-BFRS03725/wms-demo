import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { gateBarcodePattern } from "@/lib/wms/gate-entry-data";
import type { GrnBox, QcStatus } from "@/lib/wms/b2b-grn-data";

export function QcBadge({ qc }: { qc: QcStatus }) {
  if (qc === "good") {
    return (
      <span className="inline-flex items-center rounded-[3px] border border-status-picked/30 bg-status-picked/5 px-2 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em] text-status-picked">
        Good
      </span>
    );
  }
  if (qc === "bad") {
    return (
      <span className="inline-flex items-center rounded-[3px] border border-destructive/30 bg-destructive/5 px-2 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em] text-destructive">
        Bad
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-[3px] border border-border bg-muted px-2 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
      Pending
    </span>
  );
}

export function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-foreground">{value}</div>
    </div>
  );
}

export function GrnBoxLabel({ box }: { box: GrnBox }) {
  const bars = useMemo(() => gateBarcodePattern(box.boxId), [box.boxId]);
  return (
    <div className="relative overflow-hidden rounded-md border-2 border-dashed border-border bg-background p-4">
      <div className="flex h-10 items-end gap-[1px]">
        {bars.map((w, i) => (
          <div
            key={i}
            style={{ width: w * 2 }}
            className={cn("h-full", i % 2 === 0 ? "bg-foreground" : "bg-transparent")}
          />
        ))}
      </div>
      <div className="mt-2 font-mono text-sm font-bold tracking-wider">{box.boxId}</div>
      <div className="my-2 border-t border-dashed border-border" />
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.06em]">
        <LabelRow label="SKU" value={box.sku} />
        <LabelRow label="Pack" value={`${box.packSize} pcs`} />
        <LabelRow label="Batch" value={box.batch || "—"} />
        <LabelRow label="Expiry" value={box.expiry || "—"} />
      </dl>
      <div className="mt-2 truncate text-[11px] text-muted-foreground">{box.skuName}</div>
    </div>
  );
}

function LabelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
