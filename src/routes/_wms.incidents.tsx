import { createFileRoute } from "@tanstack/react-router";
import { CtIncidents } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/incidents")({
  head: () => ({ meta: [{ title: "Incidents — SRF 2.0" }] }),
  component: () => (
    <div className="srf-mock">
      <CtIncidents />
    </div>
  ),
});
