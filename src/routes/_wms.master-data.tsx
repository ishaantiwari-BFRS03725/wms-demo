import { createFileRoute } from "@tanstack/react-router";
import { AdmMaster } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/master-data")({
  component: () => (
    <div className="srf-mock">
      <AdmMaster />
    </div>
  ),
});
