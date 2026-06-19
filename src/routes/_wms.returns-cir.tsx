import { createFileRoute } from "@tanstack/react-router";
import { CIRFlow } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/returns-cir")({
  head: () => ({ meta: [{ title: "CIR · Customer Return — SRF 2.0" }] }),
  component: () => (
    <div className="srf-mock">
      <CIRFlow />
    </div>
  ),
});
