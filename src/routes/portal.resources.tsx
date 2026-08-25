import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/DataTable";

export const Route = createFileRoute("/portal/resources")({
  component: PortalResources,
});

type ResourceRow = {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  category: string;
};

function PortalResources() {
  const { data, isLoading } = useQuery({
    queryKey: ["portal-resources"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("id, title, description, file_url, category")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ResourceRow[];
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study resources"
        description="Guides, handouts and links shared by your instructors."
      />

      {isLoading && <p className="text-sm text-white/50">Loading...</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {(data ?? []).map((row) => (
          <article
            key={row.id}
            className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0a1228] to-[#05070d] p-5"
          >
            <p className="text-xs uppercase tracking-wide text-[#d9c58c]">
              {row.category.replace(/_/g, " ")}
            </p>
            <h2 className="mt-1 text-sm font-semibold text-white">{row.title}</h2>
            {row.description && <p className="mt-2 text-sm text-white/70">{row.description}</p>}
            {row.file_url && (
              <a
                href={row.file_url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#d9c58c] underline"
              >
                <Download className="h-4 w-4" /> Open resource
              </a>
            )}
          </article>
        ))}
        {!isLoading && (data ?? []).length === 0 && (
          <p className="rounded-xl border border-white/10 bg-[#0a1228] p-10 text-center text-sm text-white/50 md:col-span-2">
            No resources have been shared yet.
          </p>
        )}
      </div>
    </div>
  );
}
