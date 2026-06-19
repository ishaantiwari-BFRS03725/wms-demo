import { createFileRoute } from "@tanstack/react-router";
import { QCHome } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/qc-station")({
  head: () => ({ meta: [{ title: "QC Station — SRF 2.0" }] }),
  component: () => (
    <div className="srf-mock">
      <QCHome />
    </div>
  ),
});
