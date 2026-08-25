import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatusBadge } from "@/components/dashboard/DataTable";

export const Route = createFileRoute("/admin/inquiries")({
  component: AdminInquiries,
});

type InquiryRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
};

function AdminInquiries() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-inquiries"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as InquiryRow[];
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Inquiry updated");
      void queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inquiries"
        description="Messages sent from the contact page."
      />

      {isLoading && <p className="text-sm text-white/50">Loading...</p>}

      <div className="space-y-4">
        {(data ?? []).map((row) => (
          <article
            key={row.id}
            className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0a1228] to-[#05070d] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  {row.subject || "General inquiry"}
                </h2>
                <p className="text-xs text-white/50">
                  {row.name} · {row.email}
                  {row.phone ? ` · ${row.phone}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge value={row.status} />
                <select
                  value={row.status}
                  onChange={(event) => update.mutate({ id: row.id, status: event.target.value })}
                  className="rounded-md border border-white/15 bg-[#0a0f1e] px-2 py-1 text-xs text-white"
                >
                  <option value="new">New</option>
                  <option value="in_progress">In progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm text-white/75">{row.message}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-white/40">
              <span>{new Date(row.created_at).toLocaleString()}</span>
              <a href={`mailto:${row.email}`} className="text-[#d9c58c] underline">
                Reply by email
              </a>
            </div>
          </article>
        ))}
        {!isLoading && (data ?? []).length === 0 && (
          <p className="rounded-xl border border-white/10 bg-[#0a1228] p-10 text-center text-sm text-white/50">
            No inquiries yet.
          </p>
        )}
      </div>
    </div>
  );
}
