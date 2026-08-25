import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DataTable, PageHeader, type Column } from "@/components/dashboard/DataTable";

export const Route = createFileRoute("/admin/students")({
  component: AdminStudents,
});

type Student = {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  registrations: { id: string }[];
};

function AdminStudents() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-students"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, email, phone, created_at, registrations(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Student[];
    },
  });

  const columns: Column<Student>[] = [
    { key: "name", header: "Name", render: (row) => row.display_name || "—" },
    { key: "email", header: "Email", render: (row) => row.email || "—" },
    { key: "phone", header: "Phone", render: (row) => row.phone || "—" },
    {
      key: "registrations",
      header: "Registrations",
      render: (row) => row.registrations?.length ?? 0,
    },
    {
      key: "joined",
      header: "Joined",
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Everyone with a Tree Test Prep account."
      />
      <DataTable
        rows={data ?? []}
        columns={columns}
        isLoading={isLoading}
        empty="No students have signed up yet."
      />
    </div>
  );
}
