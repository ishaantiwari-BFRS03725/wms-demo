import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Layers, Package, ShuffleIcon } from "lucide-react";
import { sortTasks } from "@/lib/wms/sort-data";

export const Route = createFileRoute("/_wms/sort/")({
  head: () => ({
    meta: [
      { title: "Sort — WMS Outbound" },
      { name: "description", content: "Sortation tasks assigned to you." },
    ],
  }),
  component: SortPage,
});

function SortPage() {
  return (
    <div className="min-h-[calc(100vh-3rem)] bg-muted/40 py-4">
      <div className="mx-auto w-full max-w-[420px]">
        <div className="overflow-hidden rounded-md border border-border bg-background">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ShuffleIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">Sort</div>
              <div className="text-[11px] text-muted-foreground">
                {sortTasks.length} sortation task
                {sortTasks.length === 1 ? "" : "s"} assigned
              </div>
            </div>
          </div>

          {sortTasks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <ShuffleIcon className="h-7 w-7 text-muted-foreground" />
              <div className="text-sm font-medium">No sortation tasks</div>
              <div className="text-[11px] text-muted-foreground">
                Nothing assigned to you right now.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sortTasks.map((t) => (
                <Link
                  key={t.id}
                  to="/sort/$taskId"
                  params={{ taskId: t.id }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 active:bg-muted"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-sm font-semibold">{t.id}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {t.wave} · Tote {t.toteId}
                    </div>
                    <div className="mt-1.5 flex items-center gap-4 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Package className="h-3.5 w-3.5" />
                        {t.totalItems} units
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5" />
                        {t.totalOrders} orders
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
