import { createFileRoute } from "@tanstack/react-router";
import { Agents } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/agent-directory")({
  head: () => ({ meta: [{ title: "Agent Directory — SRF 2.0" }] }),
  component: () => (
    <div className="srf-mock">
      <Agents />
    </div>
  ),
});
