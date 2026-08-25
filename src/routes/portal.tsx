import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleGate } from "@/components/dashboard/RoleGate";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import dashboardCss from "../styles/dashboard.css?url";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "Student Portal | Tree Test Prep" },
      { name: "description", content: "Your classes, registrations and study resources." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "stylesheet", href: dashboardCss }],
  }),
  component: PortalLayoutRoute,
});

function PortalLayoutRoute() {
  return (
    <RoleGate require="member">
      <DashboardLayout role="member">
        <Outlet />
      </DashboardLayout>
    </RoleGate>
  );
}
