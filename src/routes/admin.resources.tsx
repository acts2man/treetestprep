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

export const Route = createFileRoute("/admin/resources")({
  component: AdminResources,
});

type ResourceRow = {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  category: string;
  visibility: string;
  sort_order: number;
};

const emptyForm = {
  title: "",
  description: "",
  file_url: "",
  category: "study_guide",
  visibility: "students",
  sort_order: "0",
};

function AdminResources() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-resources"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ResourceRow[];
    },
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-resources"] });
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("resources").insert({
        title: form.title,
        description: form.description || null,
        file_url: form.file_url || null,
        category: form.category,
        visibility: form.visibility,
        sort_order: Number(form.sort_order || 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Resource added");
      setForm(emptyForm);
      setShowForm(false);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ResourceRow> }) => {
      const { error } = await supabase.from("resources").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("resources").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Resource deleted");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const path = `resources/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error } = await supabase.storage.from("site-media").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("site-media").getPublicUrl(path);
      setForm((current) => ({ ...current, file_url: data.publicUrl }));
      toast.success("File uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const columns: Column<ResourceRow>[] = [
    { key: "title", header: "Resource", render: (row) => row.title },
    {
      key: "category",
      header: "Category",
      render: (row) => <span className="capitalize">{row.category.replace(/_/g, " ")}</span>,
    },
    {
      key: "file",
      header: "File",
      render: (row) =>
        row.file_url ? (
          <a
            href={row.file_url}
            target="_blank"
            rel="noreferrer"
            className="text-[#d9c58c] underline"
          >
            Open
          </a>
        ) : (
          "—"
        ),
    },
    {
      key: "visibility",
      header: "Visibility",
      render: (row) => (
        <select
          value={row.visibility}
          onChange={(event) =>
            update.mutate({ id: row.id, patch: { visibility: event.target.value } })
          }
          className="rounded-md border border-white/15 bg-[#0a0f1e] px-2 py-1 text-xs text-white"
        >
          <option value="public">Public</option>
          <option value="students">Students only</option>
          <option value="staff">Staff only</option>
        </select>
      ),
    },
    { key: "order", header: "Order", render: (row) => row.sort_order },
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
        title="Resources & downloads"
        description="Study guides, handouts and links shared with students."
        action={
          <button type="button" className={buttonClass} onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /> New resource
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
            <span className="mb-1 block text-white/70">Title</span>
            <input
              className={inputClass}
              required
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-white/70">Category</span>
            <select
              className={inputClass}
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            >
              <option value="study_guide">Study guide</option>
              <option value="exam_prep">Exam prep</option>
              <option value="handout">Handout</option>
              <option value="recording">Class recording</option>
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block text-white/70">Description</span>
            <textarea
              className={`${inputClass} min-h-24`}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-white/70">File or link URL</span>
            <input
              className={inputClass}
              value={form.file_url}
              onChange={(event) => setForm({ ...form, file_url: event.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-white/70">Or upload a file</span>
            <input
              type="file"
              className={inputClass}
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleUpload(file);
              }}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-white/70">Visibility</span>
            <select
              className={inputClass}
              value={form.visibility}
              onChange={(event) => setForm({ ...form, visibility: event.target.value })}
            >
              <option value="public">Public</option>
              <option value="students">Students only</option>
              <option value="staff">Staff only</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-white/70">Sort order</span>
            <input
              className={inputClass}
              value={form.sort_order}
              onChange={(event) => setForm({ ...form, sort_order: event.target.value })}
            />
          </label>
          <div className="flex gap-2 md:col-span-2">
            <button type="submit" className={buttonClass} disabled={create.isPending}>
              Save resource
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
        empty="No resources yet."
      />
    </div>
  );
}
