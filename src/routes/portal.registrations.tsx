import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  DataTable,
  PageHeader,
  StatusBadge,
  buttonClass,
  type Column,
} from "@/components/dashboard/DataTable";

export const Route = createFileRoute("/portal/registrations")({
  component: PortalRegistrations,
});

type Row = {
  id: string;
  amount_cents: number;
  status: string;
  payment_status: string;
  created_at: string;
  classes: { title: string; start_date: string | null } | null;
};

function PortalRegistrations() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["portal-registrations", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registrations")
        .select("id, amount_cents, status, payment_status, created_at, classes(title, start_date)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const columns: Column<Row>[] = [
    { key: "class", header: "Class", render: (row) => row.classes?.title ?? "Course registration" },
    { key: "start", header: "Starts", render: (row) => row.classes?.start_date ?? "TBA" },
    {
      key: "amount",
      header: "Amount",
      render: (row) => `$${(row.amount_cents / 100).toFixed(0)}`,
    },
    { key: "status", header: "Status", render: (row) => <StatusBadge value={row.status} /> },
    {
      key: "payment",
      header: "Payment",
      render: (row) => <StatusBadge value={row.payment_status} />,
    },
    {
      key: "created",
      header: "Registered",
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My registrations"
        description="Your seats in the ISA Certified Arborist prep course."
        action={
          <Link to="/class-registration-page" className={buttonClass}>
            Register for a class
          </Link>
        }
      />
      <DataTable
        rows={data ?? []}
        columns={columns}
        isLoading={isLoading}
        empty="You have no registrations yet."
      />
    </div>
  );
}
