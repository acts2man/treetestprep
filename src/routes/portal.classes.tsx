import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, buttonClass } from "@/components/dashboard/DataTable";

export const Route = createFileRoute("/portal/classes")({
  component: PortalClasses,
});

type ClassRow = {
  id: string;
  title: string;
  format: string;
  start_date: string | null;
  end_date: string | null;
  schedule: string | null;
  location: string | null;
  price_cents: number;
  description: string | null;
};

function PortalClasses() {
  const { data, isLoading } = useQuery({
    queryKey: ["portal-classes"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("status", "published")
        .order("start_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ClassRow[];
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Classes" description="Upcoming cohorts you can join." />

      {isLoading && <p className="text-sm text-white/50">Loading...</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {(data ?? []).map((row) => (
          <article
            key={row.id}
            className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0a1228] to-[#05070d] p-5"
          >
            <h2 className="text-sm font-semibold text-white">{row.title}</h2>
            <p className="mt-1 text-xs uppercase tracking-wide text-[#d9c58c]">
              {row.format.replace("_", " ")} · ${(row.price_cents / 100).toFixed(0)}
            </p>
            {row.description && <p className="mt-3 text-sm text-white/70">{row.description}</p>}
            <dl className="mt-4 space-y-2 text-sm text-white/70">
              <div className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 h-4 w-4 text-white/40" />
                <span>
                  {row.start_date ?? "TBA"} → {row.end_date ?? "TBA"}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 text-white/40" />
                <span>{row.schedule ?? "Schedule to be announced"}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-white/40" />
                <span>{row.location ?? "Location to be announced"}</span>
              </div>
            </dl>
            <Link to="/class-registration-page" className={`${buttonClass} mt-4`}>
              Register
            </Link>
          </article>
        ))}
        {!isLoading && (data ?? []).length === 0 && (
          <p className="rounded-xl border border-white/10 bg-[#0a1228] p-10 text-center text-sm text-white/50 md:col-span-2">
            No classes are scheduled right now.
          </p>
        )}
      </div>
    </div>
  );
}
