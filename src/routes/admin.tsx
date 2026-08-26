import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleGate } from "@/components/dashboard/RoleGate";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import dashboardCss from "../styles/dashboard.css?url";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console | Tree Test Prep" },
      { name: "description", content: "Manage classes, registrations and website content." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "stylesheet", href: dashboardCss }],
  }),
  component: AdminLayoutRoute,
});

function AdminLayoutRoute() {
  return (
    <RoleGate>
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    </RoleGate>
  );
}
