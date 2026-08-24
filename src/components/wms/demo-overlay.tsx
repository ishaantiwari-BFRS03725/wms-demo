import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, GraduationCap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { endTour, nextStep, prevStep, tourSteps, useTour } from "@/lib/wms/demo-tour";

// Floating "coach" overlay for guided demos. Mounted once in the WMS layout so
// it persists across route changes. When a tour is active it navigates to the
// current step's route, spotlights the target element (if present on screen),
// and shows a fixed instruction card the user advances manually.

export function DemoOverlay() {
  const { activeTour, stepIndex } = useTour();
  const navigate = useNavigate();
  const steps = tourSteps(activeTour);
  const step = steps[stepIndex] ?? null;
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Navigate to the step's screen whenever the step changes.
  useEffect(() => {
    if (!step) return;
    navigate({ to: step.route });
  }, [step?.route, stepIndex, activeTour]);

  // Track the target element's position so the spotlight ring follows it
  // through scrolling / layout changes. Best-effort: if the element isn't on
  // screen yet (e.g. it only appears after the user acts) we show no ring.
  useEffect(() => {
    if (!step?.target) {
      setRect(null);
      return;
    }
    let raf = 0;
    let didScroll = false;
    let prev = "";
    const tick = () => {
      const el = document.querySelector<HTMLElement>(`[data-demo="${step.target}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        const key = `${r.left}|${r.top}|${r.width}|${r.height}`;
        if (key !== prev) {
          prev = key;
          setRect(r);
        }
        if (!didScroll) {
          didScroll = true;
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else if (prev !== "") {
        prev = "";
        setRect(null);
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [step?.target, stepIndex, activeTour]);

  if (!activeTour || !step) return null;

  const total = steps.length;
  const isLast = stepIndex === total - 1;

  return (
    <>
      {/* Spotlight ring + dimming (only when a target is on screen) */}
      {rect && (
        <div
          className="pointer-events-none fixed z-[80] rounded-lg ring-2 ring-primary transition-all duration-150"
          style={{
            left: rect.left - 6,
            top: rect.top - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: "0 0 0 9999px rgba(2, 6, 23, 0.45)",
          }}
        />
      )}

      {/* Coach card */}
      <div className="fixed bottom-5 right-5 z-[100] w-[340px] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-lg border border-border bg-card shadow-xl">
        <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-ai-bg text-ai">
            <GraduationCap className="h-3.5 w-3.5" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
            Guided demo
          </span>
          <span className="ml-auto font-mono text-[10px] tabular-nums text-muted-foreground">
            {stepIndex + 1} / {total}
          </span>
          <button
            type="button"
            onClick={endTour}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            title="End demo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${((stepIndex + 1) / total) * 100}%` }}
          />
        </div>

        <div className="px-4 py-3.5">
          <h3 className="text-sm font-semibold">{step.title}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{step.body}</p>

          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 px-2.5"
              disabled={stepIndex === 0}
              onClick={prevStep}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <Button size="sm" className="ml-auto h-8 gap-1.5 px-3" onClick={nextStep}>
              {isLast ? "Finish" : "Next"}
              {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
