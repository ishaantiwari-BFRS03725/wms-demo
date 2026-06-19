import { createFileRoute } from "@tanstack/react-router";
import { InboundExceptionsScreen } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/inbound-exceptions")({
  head: () => ({ meta: [{ title: "Inbound Exceptions — SRF 2.0" }] }),
  component: () => (
    <div className="srf-mock">
      <InboundExceptionsScreen />
    </div>
  ),
});
