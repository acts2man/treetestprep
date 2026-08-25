import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, CalendarDays, CheckCircle2, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { StatTile } from "@/components/dashboard/StatTile";
import { StatusBadge } from "@/components/dashboard/DataTable";

export const Route = createFileRoute("/portal/")({
  component: PortalDashboard,
});

function PortalDashboard() {
  const { user, profile } = useAuth();

  const { data } = useQuery({
    queryKey: ["portal-overview", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const [registrations, classes, resources] = await Promise.all([
        supabase
          .from("registrations")
          .select("id, status, payment_status, created_at, classes(title, start_date, schedule)")
          .order("created_at", { ascending: false }),
        supabase
          .from("classes")
          .select("id, title, start_date, schedule, location")
          .eq("status", "published")
          .order("start_date", { ascending: true }),
        supabase.from("resources").select("id, title, category, file_url").limit(5),
      ]);
      return {
        registrations: (registrations.data ?? []) as any[],
        classes: (classes.data ?? []) as any[],
        resources: (resources.data ?? []) as any[],
      };
    },
  });

  const registrations = data?.registrations ?? [];
  const confirmed = registrations.filter((row) => row.status === "confirmed").length;
  const name = profile?.display_name || user?.email?.split("@")[0] || "there";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Welcome back, {name}!</h1>
        <p className="mt-1 text-sm text-white/60">
          Keep working toward your ISA Certified Arborist credential.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="My registrations"
          value={registrations.length}
          icon={ClipboardList}
          tint="bg-indigo-600/40"
        />
        <StatTile
          label="Confirmed"
          value={confirmed}
          icon={CheckCircle2}
          tint="bg-emerald-600/40"
        />
        <StatTile
          label="Upcoming classes"
          value={data?.classes.length ?? 0}
          icon={CalendarDays}
          tint="bg-purple-600/40"
        />
        <StatTile
          label="Resources"
          value={data?.resources.length ?? 0}
          icon={BookOpen}
          tint="bg-amber-600/40"
        />
      </div>

      <section className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0a1228] to-[#05070d] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">My registrations</h2>
          <Link to="/portal/registrations" className="text-xs text-[#d9c58c] underline">
            View all
          </Link>
        </div>
        <ul className="mt-4 space-y-3">
          {registrations.slice(0, 4).map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-white">{row.classes?.title ?? "Course registration"}</p>
                <p className="text-xs text-white/50">
                  {row.classes?.schedule ?? "Schedule to be announced"}
                </p>
              </div>
              <div className="flex gap-2">
                <StatusBadge value={row.status} />
                <StatusBadge value={row.payment_status} />
              </div>
            </li>
          ))}
          {registrations.length === 0 && (
            <li className="py-6 text-center text-sm text-white/50">
              You have no registrations yet.{" "}
              <Link to="/class-registration-page" className="text-[#d9c58c] underline">
                Register for the course
              </Link>
            </li>
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0a1228] to-[#05070d] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Upcoming classes</h2>
          <Link to="/portal/classes" className="text-xs text-[#d9c58c] underline">
            View all
          </Link>
        </div>
        <ul className="mt-4 space-y-3">
          {(data?.classes ?? []).slice(0, 3).map((row) => (
            <li key={row.id}>
              <p className="text-sm text-white">{row.title}</p>
              <p className="text-xs text-white/50">
                {row.start_date ?? "Dates to be announced"} · {row.schedule ?? ""}
              </p>
            </li>
          ))}
          {(data?.classes ?? []).length === 0 && (
            <li className="py-6 text-center text-sm text-white/50">No classes scheduled yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
