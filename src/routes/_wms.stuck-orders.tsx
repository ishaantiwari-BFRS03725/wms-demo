import { createFileRoute } from "@tanstack/react-router";
import { CtStuck } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/stuck-orders")({
  head: () => ({ meta: [{ title: "Stuck Orders — SRF 2.0" }] }),
  component: () => (
    <div className="srf-mock">
      <CtStuck />
    </div>
  ),
});
