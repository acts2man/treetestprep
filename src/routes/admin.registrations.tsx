import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DataTable, PageHeader, type Column } from "@/components/dashboard/DataTable";

export const Route = createFileRoute("/admin/registrations")({
  component: AdminRegistrations,
});

type RegistrationRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  amount_cents: number;
  status: string;
  payment_status: string;
  created_at: string;
  classes: { title: string } | null;
};

const selectClass = "rounded-md border border-white/15 bg-[#0a0f1e] px-2 py-1 text-xs text-white";

function AdminRegistrations() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-registrations"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registrations")
        .select("*, classes(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as RegistrationRow[];
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, string> }) => {
      const { error } = await supabase.from("registrations").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registration updated");
      void queryClient.invalidateQueries({ queryKey: ["admin-registrations"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const columns: Column<RegistrationRow>[] = [
    { key: "name", header: "Student", render: (row) => row.full_name },
    { key: "email", header: "Email", render: (row) => row.email },
    { key: "class", header: "Class", render: (row) => row.classes?.title ?? "—" },
    {
      key: "amount",
      header: "Amount",
      render: (row) => `$${(row.amount_cents / 100).toFixed(0)}`,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <select
          className={selectClass}
          value={row.status}
          onChange={(event) => update.mutate({ id: row.id, patch: { status: event.target.value } })}
        >
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="waitlisted">Waitlisted</option>
          <option value="cancelled">Cancelled</option>
        </select>
      ),
    },
    {
      key: "payment",
      header: "Payment",
      render: (row) => (
        <select
          className={selectClass}
          value={row.payment_status}
          onChange={(event) =>
            update.mutate({ id: row.id, patch: { payment_status: event.target.value } })
          }
        >
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>
      ),
    },
    {
      key: "created",
      header: "Received",
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registrations"
        description="Course sign-ups, seat status and payment status."
      />
      <DataTable
        rows={data ?? []}
        columns={columns}
        isLoading={isLoading}
        empty="No registrations yet."
      />
    </div>
  );
}
