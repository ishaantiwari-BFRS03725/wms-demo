import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — SRF 2.0" }] }),
  component: () => (
    <div className="srf-mock">
      <Dashboard />
    </div>
  ),
});
