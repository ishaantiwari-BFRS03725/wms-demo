import { createFileRoute } from "@tanstack/react-router";
import { AdmAudit } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/audit-log")({
  component: () => (
    <div className="srf-mock">
      <AdmAudit />
    </div>
  ),
});
