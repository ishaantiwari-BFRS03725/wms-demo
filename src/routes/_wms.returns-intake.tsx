import { createFileRoute } from "@tanstack/react-router";
import { OpReturns } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/returns-intake")({
  head: () => ({ meta: [{ title: "Returns Intake — SRF 2.0" }] }),
  component: () => (
    <div className="srf-mock">
      <OpReturns />
    </div>
  ),
});
