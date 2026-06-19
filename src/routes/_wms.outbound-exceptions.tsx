import { createFileRoute } from "@tanstack/react-router";
import { OutboundExceptionsScreen } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/outbound-exceptions")({
  head: () => ({ meta: [{ title: "Outbound Exceptions — SRF 2.0" }] }),
  component: () => (
    <div className="srf-mock">
      <OutboundExceptionsScreen />
    </div>
  ),
});
