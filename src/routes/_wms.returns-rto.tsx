import { createFileRoute } from "@tanstack/react-router";
import { RTOFlow } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/returns-rto")({
  head: () => ({ meta: [{ title: "RTO · Return to Origin — SRF 2.0" }] }),
  component: () => (
    <div className="srf-mock">
      <RTOFlow />
    </div>
  ),
});
