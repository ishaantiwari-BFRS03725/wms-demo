import { createFileRoute } from "@tanstack/react-router";
import { MgrAgents } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/agent-health")({
  head: () => ({ meta: [{ title: "Agent Health — SRF 2.0" }] }),
  component: () => (
    <div className="srf-mock">
      <MgrAgents />
    </div>
  ),
});
