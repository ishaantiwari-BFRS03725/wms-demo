import { createFileRoute } from "@tanstack/react-router";
import { AdmPolicies } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/policies")({
  component: () => (
    <div className="srf-mock">
      <AdmPolicies />
    </div>
  ),
});
