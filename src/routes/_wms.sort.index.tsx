import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Layers, Package, ShuffleIcon } from "lucide-react";
import { PageHeader } from "@/components/wms/page-header";
import { Card } from "@/components/ui/card";
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
    <div>
      <PageHeader
        title="Sort"
        subtitle={`${sortTasks.length} sortation tasks assigned`}
      />
      <div className="space-y-3 p-4">
        {sortTasks.map((t) => (
          <Link
            key={t.id}
            to="/sort/$taskId"
            params={{ taskId: t.id }}
            className="block"
          >
            <Card className="p-4 transition-colors hover:bg-muted/40 active:bg-muted">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <ShuffleIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{t.id}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.wave} · Tote {t.toteId}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
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
                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
