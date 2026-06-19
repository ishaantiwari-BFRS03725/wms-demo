import { createFileRoute } from "@tanstack/react-router";
import { AdminHome } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/admin")({
  component: () => (
    <div className="srf-mock">
      <AdminHome />
    </div>
  ),
});
