import { createFileRoute } from "@tanstack/react-router";
import { ManagerHome } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/site-performance")({
  head: () => ({ meta: [{ title: "Site Performance — SRF 2.0" }] }),
  component: () => (
    <div className="srf-mock">
      <ManagerHome />
    </div>
  ),
});
