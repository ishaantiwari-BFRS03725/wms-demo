import { createFileRoute } from "@tanstack/react-router";
import { RTVFlow } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/returns-rtv")({
  head: () => ({ meta: [{ title: "RTV · Return to Vendor — SRF 2.0" }] }),
  component: () => (
    <div className="srf-mock">
      <RTVFlow />
    </div>
  ),
});
