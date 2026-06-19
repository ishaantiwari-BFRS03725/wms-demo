import { cn } from "@/lib/utils";
import type { OrderStatus, ItemStatus } from "@/lib/wms/mock-data";

type AnyStatus = OrderStatus | ItemStatus;

const STYLES: Record<AnyStatus, string> = {
  created: "bg-status-created/10 text-status-created border-status-created/30",
  picked: "bg-status-picked/10 text-status-picked border-status-picked/30",
  packed: "bg-status-packed/10 text-status-packed border-status-packed/30",
  manifested:
    "bg-status-manifested/10 text-status-manifested border-status-manifested/30",
  dispatched:
    "bg-status-dispatched/10 text-status-dispatched border-status-dispatched/30",
  pending: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: AnyStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[2px] border px-1.5 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em] leading-none before:inline-block before:size-[5px] before:rounded-full before:bg-current",
        STYLES[status],
      )}
    >
      {status}
    </span>
  );
}
