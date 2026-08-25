import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DataTable,
  PageHeader,
  buttonClass,
  ghostButtonClass,
  inputClass,
  type Column,
} from "@/components/dashboard/DataTable";

export const Route = createFileRoute("/admin/instructors")({
  component: AdminInstructors,
});

type InstructorRow = {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  image_url: string | null;
  email: string | null;
  sort_order: number;
  is_visible: boolean;
};

const emptyForm = { name: "", role: "", bio: "", image_url: "", email: "", sort_order: "0" };

function AdminInstructors() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-instructors"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as InstructorRow[];
    },
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-instructors"] });
    void queryClient.invalidateQueries({ queryKey: ["public-instructors"] });
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("instructors").insert({
        name: form.name,
        role: form.role || null,
        bio: form.bio || null,
        image_url: form.image_url || null,
        email: form.email || null,
        sort_order: Number(form.sort_order || 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Instructor added");
      setForm(emptyForm);
      setShowForm(false);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<InstructorRow> }) => {
      const { error } = await supabase.from("instructors").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("instructors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Instructor removed");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const columns: Column<InstructorRow>[] = [
    {
      key: "name",
      header: "Instructor",
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.image_url && (
            <img src={row.image_url} alt="" className="h-9 w-9 rounded-full object-cover" />
          )}
          <span>{row.name}</span>
        </div>
      ),
    },
    { key: "role", header: "Role", render: (row) => row.role || "—" },
    { key: "email", header: "Email", render: (row) => row.email || "—" },
    { key: "order", header: "Order", render: (row) => row.sort_order },
    {
      key: "visible",
      header: "Visible",
      render: (row) => (
        <button
          type="button"
          onClick={() => update.mutate({ id: row.id, patch: { is_visible: !row.is_visible } })}
          className={
            row.is_visible
              ? "rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-300"
              : "rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/60"
          }
        >
          {row.is_visible ? "On site" : "Hidden"}
        </button>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          type="button"
          aria-label={`Delete ${row.name}`}
          onClick={() => remove.mutate(row.id)}
          className="rounded-md p-2 text-white/50 transition hover:bg-rose-500/10 hover:text-rose-300"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instructors"
        description="The teaching team shown on the public instructors page."
        action={
          <button type="button" className={buttonClass} onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /> New instructor
          </button>
        }
      />

      {showForm && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
          className="grid gap-4 rounded-xl border border-white/10 bg-gradient-to-br from-[#0a1228] to-[#05070d] p-4 md:grid-cols-2"
        >
          <label className="text-sm">
            <span className="mb-1 block text-white/70">Name</span>
            <input
              className={inputClass}
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-white/70">Role</span>
            <input
              className={inputClass}
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-white/70">Photo URL</span>
            <input
              className={inputClass}
              value={form.image_url}
              onChange={(event) => setForm({ ...form, image_url: event.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-white/70">Email</span>
            <input
              className={inputClass}
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block text-white/70">Bio</span>
            <textarea
              className={`${inputClass} min-h-28`}
              value={form.bio}
              onChange={(event) => setForm({ ...form, bio: event.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-white/70">Sort order</span>
            <input
              className={inputClass}
              value={form.sort_order}
              onChange={(event) => setForm({ ...form, sort_order: event.target.value })}
            />
          </label>
          <div className="flex items-end gap-2">
            <button type="submit" className={buttonClass} disabled={create.isPending}>
              Save instructor
            </button>
            <button type="button" className={ghostButtonClass} onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <DataTable
        rows={data ?? []}
        columns={columns}
        isLoading={isLoading}
        empty="No instructors yet."
      />
    </div>
  );
}
