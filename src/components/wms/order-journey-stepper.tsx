import { Check } from "lucide-react";
import { ORDER_STEPS, type OrderStatus } from "@/lib/wms/mock-data";
import { cn } from "@/lib/utils";

const LABELS: Record<OrderStatus, string> = {
  created: "Created",
  picked: "Picked",
  packed: "Packed",
  manifested: "Manifested",
  dispatched: "Dispatched",
};

export function OrderJourneyStepper({ status }: { status: OrderStatus }) {
  const currentIdx = ORDER_STEPS.indexOf(status);

  return (
    <ol className="flex w-full items-center">
      {ORDER_STEPS.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isLast = idx === ORDER_STEPS.length - 1;
        return (
          <li
            key={step}
            className={cn("flex items-center", !isLast && "flex-1")}
          >
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-inset text-sm font-semibold transition-colors",
                  isDone &&
                    "bg-status-dispatched text-white ring-status-dispatched",
                  isCurrent &&
                    "bg-primary text-primary-foreground ring-primary shadow-sm",
                  !isDone &&
                    !isCurrent &&
                    "bg-muted text-muted-foreground ring-border",
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : idx + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  isCurrent ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {LABELS[step]}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "mx-3 h-px flex-1 -mt-6",
                  idx < currentIdx ? "bg-status-dispatched" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
