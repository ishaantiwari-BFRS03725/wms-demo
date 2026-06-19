import { createFileRoute } from "@tanstack/react-router";
import { GatepassScreen } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/gatepass-log")({
  component: () => (
    <div className="srf-mock">
      <GatepassScreen />
    </div>
  ),
});
