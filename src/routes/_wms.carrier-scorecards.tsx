import { createFileRoute } from "@tanstack/react-router";
import { CtCarriers } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/carrier-scorecards")({
  component: () => (
    <div className="srf-mock">
      <CtCarriers />
    </div>
  ),
});
