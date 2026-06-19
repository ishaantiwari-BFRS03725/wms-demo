import { createFileRoute } from "@tanstack/react-router";
import { MgrTrends } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/trends")({
  head: () => ({ meta: [{ title: "Trends — SRF 2.0" }] }),
  component: () => (
    <div className="srf-mock">
      <MgrTrends />
    </div>
  ),
});
