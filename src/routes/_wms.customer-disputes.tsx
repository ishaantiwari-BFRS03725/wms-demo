import { createFileRoute } from "@tanstack/react-router";
import { FinDisputes } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/customer-disputes")({
  head: () => ({ meta: [{ title: "Customer Disputes — SRF 2.0" }] }),
  component: () => (
    <div className="srf-mock">
      <FinDisputes />
    </div>
  ),
});
