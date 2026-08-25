import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export function RoleGate({
  require = "auth",
  children,
}: {
  require?: "auth" | "member" | "admin";
  children: ReactNode;
}) {
  const { loading, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const href = useRouterState({ select: (state) => state.location.href });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/auth/", replace: true });
      return;
    }
    if (require === "admin" && !isAdmin) {
      void navigate({ to: "/portal/", replace: true });
    }
  }, [loading, user, isAdmin, require, navigate, href]);

  if (loading || !user || (require === "admin" && !isAdmin)) {
    return (
      <div className="dashboard-shell flex min-h-screen items-center justify-center bg-[#0a0f1e] text-sm text-white/70">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
