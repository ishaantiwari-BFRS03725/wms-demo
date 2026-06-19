import { createFileRoute } from "@tanstack/react-router";
import { FinRecovery } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/recovery-queue")({
  head: () => ({ meta: [{ title: "Recovery Queue — SRF 2.0" }] }),
  component: () => (
    <div className="srf-mock">
      <FinRecovery />
    </div>
  ),
});
