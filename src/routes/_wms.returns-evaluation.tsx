import { createFileRoute } from "@tanstack/react-router";
import { QcReturns } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/returns-evaluation")({
  head: () => ({ meta: [{ title: "Returns Evaluation — SRF 2.0" }] }),
  component: () => (
    <div className="srf-mock">
      <QcReturns />
    </div>
  ),
});
