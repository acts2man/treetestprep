import { Suspense, lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  GraduationCap,
  Mail,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatTile } from "@/components/dashboard/StatTile";

const DashboardCharts = lazy(() => import("@/components/admin/DashboardCharts"));

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
  type: "registration" | "inquiry" | "class";
  title: string;
  subtitle: string;
  created_at: string;
};

function AdminDashboard() {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    staleTime: 60_000,
    queryFn: async () => {
      const [
        classes,
        registrations,
        confirmed,
        instructors,
        resources,
        inquiries,
        paidRows,
      ] = await Promise.all([
        count("classes", (q) => q.eq("status", "published")),
        count("registrations"),
        count("registrations", (q) => q.eq("status", "confirmed")),
        count("instructors", (q) => q.eq("is_visible", true)),
        count("resources"),
        count("inquiries", (q) => q.eq("status", "new")),
        supabase.from("registrations").select("amount_cents, payment_status, created_at"),
      ]);

      const rows = (paidRows.data ?? []) as {
        amount_cents: number;
        payment_status: string;
        created_at: string;
      }[];
      const paid = rows.filter((row) => row.payment_status === "paid");
      const revenue = paid.reduce((total, row) => total + (row.amount_cents ?? 0), 0) / 100;
      const monthRevenue =
        paid
          .filter((row) => row.created_at >= startOfMonth)
          .reduce((total, row) => total + (row.amount_cents ?? 0), 0) / 100;

      return {
        classes,
        registrations,
        confirmed,
        instructors,
        resources,
        inquiries,
        revenue,
        monthRevenue,
      };
    },
  });

  const { data: activity } = useQuery({
    queryKey: ["admin-activity"],
    staleTime: 60_000,
    queryFn: async (): Promise<Activity[]> => {
      const [registrations, inquiries, classes] = await Promise.all([
        supabase
          .from("registrations")
          .select("id, full_name, status, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("inquiries")
          .select("id, name, subject, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("classes")
          .select("id, title, start_date, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const items: Activity[] = [
        ...((registrations.data ?? []) as any[]).map((row) => ({
          id: `r-${row.id}`,
          type: "registration" as const,
          title: `${row.full_name} registered`,
          subtitle: `Status: ${row.status}`,
          created_at: row.created_at,
        })),
        ...((inquiries.data ?? []) as any[]).map((row) => ({
          id: `i-${row.id}`,
          type: "inquiry" as const,
          title: `${row.name} sent an inquiry`,
          subtitle: row.subject || "No subject",
          created_at: row.created_at,
        })),
        ...((classes.data ?? []) as any[]).map((row) => ({
          id: `c-${row.id}`,
          type: "class" as const,
          title: row.title,
          subtitle: row.start_date ? `Starts ${row.start_date}` : "No start date",
          created_at: row.created_at,
        })),
      ];

      return items
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .slice(0, 8);
    },
  });

  const money = (value: number | undefined) =>
    `$${(value ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Course dashboard</h1>
        <p className="mt-1 text-sm text-white/60">
          Registrations, classes and website activity for Tree Test Prep.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Registrations"
          value={stats?.registrations ?? 0}
          icon={ClipboardList}
          tint="bg-indigo-600/40"
        />
        <StatTile
          label="Confirmed seats"
          value={stats?.confirmed ?? 0}
          icon={CheckCircle2}
          tint="bg-sky-600/40"
        />
        <StatTile
          label="Published classes"
          value={stats?.classes ?? 0}
          icon={CalendarDays}
          tint="bg-purple-600/40"
        />
        <StatTile
          label="Total revenue"
          value={money(stats?.revenue)}
          icon={DollarSign}
          tint="bg-emerald-600/40"
        />
        <StatTile
          label="Revenue this month"
          value={money(stats?.monthRevenue)}
          icon={DollarSign}
          tint="bg-emerald-600/40"
        />
        <StatTile
          label="New inquiries"
          value={stats?.inquiries ?? 0}
          icon={Mail}
          tint="bg-rose-600/40"
        />
        <StatTile
          label="Study resources"
          value={stats?.resources ?? 0}
          icon={BookOpen}
          tint="bg-amber-600/40"
        />
      </div>

      <Suspense
        fallback={
          <div className="h-72 animate-pulse rounded-xl border border-white/10 bg-[#0a1228]" />
        }
      >
        <DashboardCharts />
      </Suspense>

      <section className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0a1228] to-[#05070d] p-4">
        <h2 className="text-sm font-semibold text-white">Recent activity</h2>
        <ul className="mt-4 space-y-3">
          {(activity ?? []).map((item) => {
            const Icon =
              item.type === "registration"
                ? UserPlus
                : item.type === "inquiry"
                  ? MessageSquare
                  : GraduationCap;
            const tint =
              item.type === "registration"
                ? "bg-emerald-600/30"
                : item.type === "inquiry"
                  ? "bg-rose-600/30"
                  : "bg-indigo-600/30";
            return (
              <li key={item.id} className="flex items-start gap-3">
                <span className={`rounded-lg p-2 ${tint}`}>
                  <Icon className="h-4 w-4 text-white" />
                </span>
                <div className="flex-1">
                  <p className="text-sm text-white">{item.title}</p>
                  <p className="text-xs text-white/50">{item.subtitle}</p>
                </div>
                <span className="text-xs text-white/40">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </li>
            );
          })}
          {(activity ?? []).length === 0 && (
            <li className="py-6 text-center text-sm text-white/50">No activity yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
