import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeftRight, Play } from "lucide-react";
import { PageHeader } from "@/components/wms/page-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_wms/run-demo")({
  head: () => ({
    meta: [{ title: "Run Demo" }],
  }),
  component: RunDemo,
});

interface DemoCard {
  id: string;
  title: string;
  description: string;
  icon: typeof ArrowLeftRight;
  available: boolean;
}

const DEMOS: DemoCard[] = [
  {
    id: "good-to-bad",
    title: "Good-to-Bad Movement",
    description:
      "Walks through moving damaged stock from a good bin into quarantine — creating the movement task, auto-raising the QC exception ticket, generating USNs, and scanning the units across on the floor.",
    icon: ArrowLeftRight,
    available: false,
  },
];

function RunDemo() {
  return (
    <div>
      <PageHeader title="Run Demo" subtitle="GUIDED DEMONSTRATIONS" />

      <div className="p-7">
        <p className="mb-5 max-w-2xl text-sm text-muted-foreground">
          Pick a demonstration and press play to be walked through each screen step by step — with
          on-screen prompts telling you exactly what to click and type, like a guided training
          session.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEMOS.map((demo) => (
            <div
              key={demo.id}
              className="flex flex-col rounded-md border border-border bg-card p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ai-bg text-ai">
                  <demo.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold">{demo.title}</h2>
                    {!demo.available && (
                      <span className="rounded-[3px] border border-muted-foreground/30 bg-muted px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em] text-muted-foreground">
                        Coming soon
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="mt-3 flex-1 text-xs leading-relaxed text-muted-foreground">
                {demo.description}
              </p>

              <Button className="mt-4 gap-2" disabled={!demo.available}>
                <Play className="h-4 w-4" />
                Play demo
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
