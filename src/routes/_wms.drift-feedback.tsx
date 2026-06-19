import { createFileRoute } from "@tanstack/react-router";
import { AdmDrift } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/drift-feedback")({
  head: () => ({ meta: [{ title: "Drift & Feedback — SRF 2.0" }] }),
  component: () => (
    <div className="srf-mock">
      <AdmDrift />
    </div>
  ),
});
