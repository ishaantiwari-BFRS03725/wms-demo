import { createFileRoute } from "@tanstack/react-router";
import { Alerts } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/alerts")({
  head: () => ({ meta: [{ title: "Alerts — SRF 2.0" }] }),
  component: () => (
    <div className="srf-mock">
      <Alerts />
    </div>
  ),
});
