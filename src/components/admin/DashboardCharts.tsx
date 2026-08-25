import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

type Registration = { created_at: string; status: string; amount_cents: number };

function monthKey(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short" });
}

export default function DashboardCharts() {
  const { data } = useQuery({
    queryKey: ["admin-charts"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registrations")
        .select("created_at, status, amount_cents")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Registration[];
    },
  });

  const rows = data ?? [];

  const months: { month: string; registrations: number; revenue: number }[] = [];
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - index);
    months.push({ month: monthKey(date), registrations: 0, revenue: 0 });
  }
  for (const row of rows) {
    const label = monthKey(new Date(row.created_at));
    const bucket = months.find((entry) => entry.month === label);
    if (bucket) {
      bucket.registrations += 1;
      bucket.revenue += (row.amount_cents ?? 0) / 100;
    }
  }

  const statuses = ["pending", "confirmed", "waitlisted", "cancelled"];
  const byStatus = statuses.map((status) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count: rows.filter((row) => row.status === status).length,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0a1228] to-[#05070d] p-4">
        <h2 className="text-sm font-semibold text-white">Registrations & revenue</h2>
        <p className="mb-4 text-xs text-white/50">Last six months</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={months}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="month" stroke="#93a0bd" fontSize={12} />
              <YAxis stroke="#93a0bd" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "#0a1228",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8,
                  color: "#fff",
                }}
              />
              <Area
                type="monotone"
                dataKey="registrations"
                stroke="#349e49"
                fill="rgba(52,158,73,0.25)"
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#d9c58c"
                fill="rgba(217,197,140,0.15)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0a1228] to-[#05070d] p-4">
        <h2 className="text-sm font-semibold text-white">Registrations by status</h2>
        <p className="mb-4 text-xs text-white/50">All time</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="status" stroke="#93a0bd" fontSize={12} />
              <YAxis stroke="#93a0bd" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "#0a1228",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8,
                  color: "#fff",
                }}
              />
              <Bar dataKey="count" fill="#1d3770" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
