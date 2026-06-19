import { createFileRoute } from "@tanstack/react-router";
import { FinanceHome } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/billing-leakage")({
  component: () => (
    <div className="srf-mock">
      <FinanceHome />
    </div>
  ),
});
