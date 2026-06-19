import { createFileRoute } from "@tanstack/react-router";
import { AdmUsers } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/users-roles")({
  component: () => (
    <div className="srf-mock">
      <AdmUsers />
    </div>
  ),
});
