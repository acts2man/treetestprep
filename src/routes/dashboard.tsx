import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import dashboardCss from "../styles/dashboard.css?url";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dashboard | Tree Test Prep" },
      { name: "description", content: "Redirecting you to your Tree Test Prep dashboard." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "stylesheet", href: dashboardCss }],
  }),
  component: DashboardRedirect,
});

function DashboardRedirect() {
  const { loading, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/auth", replace: true });
      return;
    }
    void navigate({ to: isAdmin ? "/admin" : "/portal", replace: true });
  }, [loading, user, isAdmin, navigate]);

  return (
    <div className="dashboard-shell flex min-h-screen items-center justify-center bg-[#0a0f1e] text-sm text-white/70">
      Loading...
    </div>
  );
}
