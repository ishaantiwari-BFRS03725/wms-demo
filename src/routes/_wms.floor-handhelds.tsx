import { createFileRoute } from "@tanstack/react-router";
import { FloorScreens } from "@/srf/srf-screens";
import "@/srf/srf-mock.css";

export const Route = createFileRoute("/_wms/floor-handhelds")({
  component: () => (
    <div className="srf-mock">
      <FloorScreens />
    </div>
  ),
});
