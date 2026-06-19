import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function Placeholder({
  icon: Icon,
  module,
}: {
  icon: LucideIcon;
  module: string;
}) {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold">{module} module</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            This workflow isn't built yet. The {module.toLowerCase()} screen will
            live here once the operations team finalizes the SOP.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
