import { createFileRoute } from "@tanstack/react-router";
import { CycleCountScreen } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/cycle-count")({
  head: () => ({ meta: [{ title: "Cycle Count & Audit — SRF 2.0" }] }),
  component: () => (
    <div className="srf-mock">
      <CycleCountScreen />
    </div>
  ),
});
