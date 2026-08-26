import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, CalendarDays, FileText, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatTile } from "@/components/dashboard/StatTile";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const count = async (table: string, filter?: (query: any) => any) => {
  let query = supabase.from(table as never).select("id", { count: "exact", head: true });
  if (filter) query = filter(query);
  const { count: total } = await query;
  return total ?? 0;
};

type Activity = {
  id: string;
  title: string;
  subtitle: string;
  created_at: string;
};

function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    staleTime: 60_000,
    queryFn: async () => {
      const [classes, totalClasses, instructors, resources, pageEdits] = await Promise.all([
        count("classes", (q) => q.eq("status", "published")),
        count("classes"),
        count("instructors", (q) => q.eq("is_visible", true)),
        count("resources"),
        count("page_content_overrides"),
      ]);
      return { classes, totalClasses, instructors, resources, pageEdits };
    },
  });

  const { data: activity } = useQuery({
    queryKey: ["admin-activity"],
    staleTime: 60_000,
    queryFn: async (): Promise<Activity[]> => {
      const { data } = await supabase
        .from("classes")
        .select("id, title, start_date, created_at")
        .order("created_at", { ascending: false })
        .limit(8);
      return ((data ?? []) as any[]).map((row) => ({
        id: row.id,
        title: row.title,
        subtitle: row.start_date ? `Starts ${row.start_date}` : "No start date",
        created_at: row.created_at,
      }));
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Course dashboard</h1>
        <p className="mt-1 text-sm text-white/60">
          Classes, instructors, resources and website content for Tree Test Prep.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Published classes"
          value={stats?.classes ?? 0}
          icon={CalendarDays}
          tint="bg-purple-600/40"
        />
        <StatTile
          label="All classes"
          value={stats?.totalClasses ?? 0}
          icon={GraduationCap}
          tint="bg-blue-600/40"
        />
        <StatTile
          label="Instructors"
          value={stats?.instructors ?? 0}
          icon={GraduationCap}
          tint="bg-indigo-600/40"
        />
        <StatTile
          label="Resources"
          value={stats?.resources ?? 0}
          icon={BookOpen}
          tint="bg-amber-600/40"
        />
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0a1228] to-[#05070d] p-4">
          <h2 className="text-sm font-semibold text-white">Recently added classes</h2>
          <ul className="mt-4 space-y-3">
            {(activity ?? []).map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <span className="rounded-lg bg-indigo-600/30 p-2">
                  <CalendarDays className="h-4 w-4 text-white" />
                </span>
                <div className="flex-1">
                  <p className="text-sm text-white">{item.title}</p>
                  <p className="text-xs text-white/50">{item.subtitle}</p>
                </div>
                <span className="text-xs text-white/40">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
            {(activity ?? []).length === 0 && (
              <li className="py-6 text-center text-sm text-white/50">No classes yet.</li>
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0a1228] to-[#05070d] p-4">
          <h2 className="text-sm font-semibold text-white">Quick actions</h2>
          <p className="mt-1 text-xs text-white/50">
            Registration and revenue reporting will appear here once payments run through the site.
          </p>
          <div className="mt-4 grid gap-2">
            <Link
              to="/admin/pages"
              className="flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
            >
              <FileText className="h-4 w-4" /> Edit website pages ({stats?.pageEdits ?? 0} saved
              fields)
            </Link>
            <Link
              to="/admin/classes"
              className="flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
            >
              <CalendarDays className="h-4 w-4" /> Manage classes
            </Link>
            <Link
              to="/admin/resources"
              className="flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
            >
              <BookOpen className="h-4 w-4" /> Manage resources
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
