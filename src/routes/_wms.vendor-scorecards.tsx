import { createFileRoute } from "@tanstack/react-router";
import { FinScorecards } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/vendor-scorecards")({
  component: () => (
    <div className="srf-mock">
      <FinScorecards />
    </div>
  ),
});
