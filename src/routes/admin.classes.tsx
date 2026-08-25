import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DataTable,
  PageHeader,
  StatusBadge,
  buttonClass,
  ghostButtonClass,
  inputClass,
  type Column,
} from "@/components/dashboard/DataTable";

export const Route = createFileRoute("/admin/classes")({
  component: AdminClasses,
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
  capacity: number;
  status: string;
};

const emptyForm = {
  title: "",
  format: "in_person",
  start_date: "",
  end_date: "",
  schedule: "",
  location: "",
  price: "395",
  capacity: "30",
  status: "published",
};

function AdminClasses() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-classes"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("start_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ClassRow[];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-classes"] });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("classes").insert({
        title: form.title,
        format: form.format,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        schedule: form.schedule || null,
        location: form.location || null,
        price_cents: Math.round(Number(form.price || 0) * 100),
        capacity: Number(form.capacity || 0),
        status: form.status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Class created");
      setForm(emptyForm);
      setShowForm(false);
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ClassRow> }) => {
      const { error } = await supabase.from("classes").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void invalidate(),
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Class deleted");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const columns: Column<ClassRow>[] = [
    { key: "title", header: "Class", render: (row) => row.title },
    {
      key: "format",
      header: "Format",
      render: (row) => <span className="capitalize">{row.format.replace("_", " ")}</span>,
    },
    {
      key: "dates",
      header: "Dates",
      render: (row) => `${row.start_date ?? "—"} → ${row.end_date ?? "—"}`,
    },
    { key: "schedule", header: "Schedule", render: (row) => row.schedule || "—" },
    { key: "price", header: "Price", render: (row) => `$${(row.price_cents / 100).toFixed(0)}` },
    { key: "capacity", header: "Seats", render: (row) => row.capacity },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <select
          value={row.status}
          onChange={(event) =>
            update.mutate({ id: row.id, patch: { status: event.target.value } })
          }
          className="rounded-md border border-white/15 bg-[#0a0f1e] px-2 py-1 text-xs text-white"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          type="button"
          aria-label={`Delete ${row.title}`}
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
        title="Classes"
        description="Cohorts of the ISA Certified Arborist prep course."
        action={
          <button type="button" className={buttonClass} onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /> New class
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
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block text-white/70">Title</span>
            <input
              className={inputClass}
              required
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-white/70">Format</span>
            <select
              className={inputClass}
              value={form.format}
              onChange={(event) => setForm({ ...form, format: event.target.value })}
            >
              <option value="in_person">In person</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-white/70">Schedule</span>
            <input
              className={inputClass}
              value={form.schedule}
              onChange={(event) => setForm({ ...form, schedule: event.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-white/70">Start date</span>
            <input
              type="date"
              className={inputClass}
              value={form.start_date}
              onChange={(event) => setForm({ ...form, start_date: event.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-white/70">End date</span>
            <input
              type="date"
              className={inputClass}
              value={form.end_date}
              onChange={(event) => setForm({ ...form, end_date: event.target.value })}
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block text-white/70">Location</span>
            <input
              className={inputClass}
              value={form.location}
              onChange={(event) => setForm({ ...form, location: event.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-white/70">Price (USD)</span>
            <input
              className={inputClass}
              value={form.price}
              onChange={(event) => setForm({ ...form, price: event.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-white/70">Capacity</span>
            <input
              className={inputClass}
              value={form.capacity}
              onChange={(event) => setForm({ ...form, capacity: event.target.value })}
            />
          </label>
          <div className="flex gap-2 md:col-span-2">
            <button type="submit" className={buttonClass} disabled={create.isPending}>
              Save class
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
        empty="No classes yet. Create your first cohort."
      />

      <p className="text-xs text-white/40">
        Statuses: <StatusBadge value="published" /> classes are visible on the public website.
      </p>
    </div>
  );
}
