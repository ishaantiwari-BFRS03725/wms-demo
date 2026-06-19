import { createFileRoute } from "@tanstack/react-router";
import { ControlTowerHome } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/control-tower")({
  head: () => ({ meta: [{ title: "Network Control Tower — SRF 2.0" }] }),
  component: () => (
    <div className="srf-mock">
      <ControlTowerHome />
    </div>
  ),
});
