import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowDown, ArrowUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getPageDefinition, type PageField } from "@/lib/pageSchema";
import { PAGE_DEFAULTS, type LinkDefault } from "@/lib/pageDefaults";
import {
  PageHeader,
  buttonClass,
  ghostButtonClass,
  inputClass,
} from "@/components/dashboard/DataTable";

export const Route = createFileRoute("/admin/pages/$slug")({
  component: AdminPageEditor,
});

type OverrideRow = {
  id: string;
  page_slug: string;
  section_key: string;
  field_key: string;
  value_text: string | null;
  value_json: unknown;
  image_url: string | null;
  video_url: string | null;
  link_url: string | null;
};

type FieldState = { text: string; href: string; list: Record<string, string>[] };

const mediaField = (type: PageField["type"]) => type === "image" || type === "video";

function AdminPageEditor() {
  const { slug } = Route.useParams();
  const page = getPageDefinition(slug);
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState(page?.sections[0]?.key ?? "");
  const [state, setState] = useState<Record<string, FieldState>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin-page-content", slug],
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_content_overrides")
        .select("*")
        .eq("page_slug", slug);
      if (error) throw error;
      return (data ?? []) as OverrideRow[];
    },
  });

  const rows = useMemo(() => data ?? [], [data]);

  useEffect(() => {
    if (!page) return;
    const next: Record<string, FieldState> = {};
    for (const section of page.sections) {
      for (const field of section.fields) {
        const row = rows.find(
          (item) => item.section_key === section.key && item.field_key === field.key,
        );
        const fallback = PAGE_DEFAULTS[slug]?.[section.key]?.[field.key];
        const key = `${section.key}.${field.key}`;

        if (field.type === "list") {
          next[key] = {
            text: "",
            href: "",
            list: Array.isArray(row?.value_json)
              ? (row!.value_json as Record<string, string>[])
              : Array.isArray(fallback)
                ? (fallback as Record<string, string>[])
                : [],
          };
        } else if (field.type === "link") {
          const base = (fallback as LinkDefault | undefined) ?? { label: "", href: "" };
          next[key] = {
            text: row?.value_text ?? base.label,
            href: row?.link_url ?? base.href,
            list: [],
          };
        } else if (mediaField(field.type)) {
          const current =
            (field.type === "image" ? row?.image_url : row?.video_url) ??
            (typeof fallback === "string" ? fallback : "");
          next[key] = { text: current, href: "", list: [] };
        } else {
          next[key] = {
            text: row?.value_text ?? (typeof fallback === "string" ? fallback : ""),
            href: "",
            list: [],
          };
        }
      }
    }
    setState(next);
  }, [rows, page, slug]);

  const save = useMutation({
    mutationFn: async ({ sectionKey, field }: { sectionKey: string; field: PageField }) => {
      const key = `${sectionKey}.${field.key}`;
      const value = state[key];
      if (!value) return;
      const payload: Record<string, unknown> = {
        page_slug: slug,
        section_key: sectionKey,
        field_key: field.key,
        value_text: null,
        value_json: null,
        image_url: null,
        video_url: null,
        link_url: null,
      };
      if (field.type === "list") payload.value_json = value.list;
      else if (field.type === "image") payload.image_url = value.text;
      else if (field.type === "video") payload.video_url = value.text;
      else if (field.type === "link") {
        payload.value_text = value.text;
        payload.link_url = value.href;
      } else if (field.type === "url") payload.link_url = value.text;
      else payload.value_text = value.text;

      const { error } = await supabase
        .from("page_content_overrides")
        .upsert(payload, { onConflict: "page_slug,section_key,field_key" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved. The public page is updated.");
      void queryClient.invalidateQueries({ queryKey: ["admin-page-content", slug] });
      void queryClient.invalidateQueries({ queryKey: ["page-content"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reset = useMutation({
    mutationFn: async ({ sectionKey, field }: { sectionKey: string; field: PageField }) => {
      const { error } = await supabase
        .from("page_content_overrides")
        .delete()
        .eq("page_slug", slug)
        .eq("section_key", sectionKey)
        .eq("field_key", field.key);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reset to the original content.");
      void queryClient.invalidateQueries({ queryKey: ["admin-page-content", slug] });
      void queryClient.invalidateQueries({ queryKey: ["page-content"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function upload(key: string, file: File) {
    try {
      const path = `pages/${slug}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error } = await supabase.storage.from("site-media").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("site-media").getPublicUrl(path);
      setState((current) => ({
        ...current,
        [key]: { ...current[key]!, text: data.publicUrl },
      }));
      toast.success("Uploaded. Remember to save this field.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  }

  if (!page) {
    return (
      <div className="space-y-4">
        <PageHeader title="Page not found" description="This page is not in the content registry." />
        <Link to="/admin/pages" className={ghostButtonClass}>
          <ArrowLeft className="h-4 w-4" /> Back to pages
        </Link>
      </div>
    );
  }

  const section = page.sections.find((item) => item.key === activeSection) ?? page.sections[0]!;

  const setField = (key: string, patch: Partial<FieldState>) =>
    setState((current) => ({
      ...current,
      [key]: { ...(current[key] ?? { text: "", href: "", list: [] }), ...patch },
    }));

  return (
    <div className="space-y-6">
      <Link to="/admin/pages" className="inline-flex items-center gap-2 text-sm text-white/60">
        <ArrowLeft className="h-4 w-4" /> All pages
      </Link>

      <PageHeader
        title={page.label}
        description={`${page.description} Live at ${page.path}`}
        action={
          <a href={page.path} target="_blank" rel="noreferrer" className={ghostButtonClass}>
            View live page
          </a>
        }
      />

      <div className="flex flex-wrap gap-2">
        {page.sections.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveSection(item.key)}
            className={
              item.key === section.key
                ? "rounded-lg bg-[#1d3770] px-3 py-2 text-sm font-medium text-white"
                : "rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/5"
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-white/50">Loading content...</p>}

      <div className="space-y-4">
        {section.fields.map((field) => {
          const key = `${section.key}.${field.key}`;
          const value = state[key] ?? { text: "", href: "", list: [] };

          return (
            <div
              key={key}
              className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0a1228] to-[#05070d] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">{field.label}</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() => save.mutate({ sectionKey: section.key, field })}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className={ghostButtonClass}
                    onClick={() => reset.mutate({ sectionKey: section.key, field })}
                  >
                    <RotateCcw className="h-4 w-4" /> Reset
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-3">
                {field.type === "textarea" && (
                  <textarea
                    className={`${inputClass} min-h-32`}
                    value={value.text}
                    onChange={(event) => setField(key, { text: event.target.value })}
                  />
                )}

                {(field.type === "text" || field.type === "url") && (
                  <input
                    className={inputClass}
                    value={value.text}
                    onChange={(event) => setField(key, { text: event.target.value })}
                  />
                )}

                {field.type === "link" && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs text-white/60">
                      Button label
                      <input
                        className={`${inputClass} mt-1`}
                        value={value.text}
                        onChange={(event) => setField(key, { text: event.target.value })}
                      />
                    </label>
                    <label className="text-xs text-white/60">
                      Destination
                      <input
                        className={`${inputClass} mt-1`}
                        value={value.href}
                        onChange={(event) => setField(key, { href: event.target.value })}
                      />
                    </label>
                  </div>
                )}

                {mediaField(field.type) && (
                  <div className="space-y-3">
                    <input
                      className={inputClass}
                      placeholder="Paste a URL"
                      value={value.text}
                      onChange={(event) => setField(key, { text: event.target.value })}
                    />
                    {field.type === "image" && (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          className={inputClass}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void upload(key, file);
                          }}
                        />
                        {value.text && (
                          <img
                            src={value.text}
                            alt=""
                            className="max-h-40 rounded-lg border border-white/10 object-cover"
                          />
                        )}
                      </>
                    )}
                    {field.type === "video" && value.text && (
                      <p className="text-xs text-white/40 break-all">{value.text}</p>
                    )}
                  </div>
                )}

                {field.type === "list" && (
                  <div className="space-y-3">
                    {value.list.map((item, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-white/10 bg-[#0a0f1e] p-3"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs text-white/50">Item {index + 1}</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              aria-label="Move up"
                              className="rounded p-1 text-white/50 hover:bg-white/10"
                              onClick={() => {
                                if (index === 0) return;
                                const list = [...value.list];
                                [list[index - 1], list[index]] = [list[index]!, list[index - 1]!];
                                setField(key, { list });
                              }}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              aria-label="Move down"
                              className="rounded p-1 text-white/50 hover:bg-white/10"
                              onClick={() => {
                                if (index === value.list.length - 1) return;
                                const list = [...value.list];
                                [list[index], list[index + 1]] = [list[index + 1]!, list[index]!];
                                setField(key, { list });
                              }}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              aria-label="Remove item"
                              className="rounded p-1 text-white/50 hover:bg-rose-500/10 hover:text-rose-300"
                              onClick={() =>
                                setField(key, {
                                  list: value.list.filter((_, i) => i !== index),
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {(field.itemFields ?? [{ key: "text", label: "Text", type: "text" }]).map(
                            (itemField) => (
                              <label key={itemField.key} className="block text-xs text-white/60">
                                {itemField.label}
                                {itemField.type === "textarea" ? (
                                  <textarea
                                    className={`${inputClass} mt-1 min-h-20`}
                                    value={item[itemField.key] ?? ""}
                                    onChange={(event) => {
                                      const list = [...value.list];
                                      list[index] = {
                                        ...list[index]!,
                                        [itemField.key]: event.target.value,
                                      };
                                      setField(key, { list });
                                    }}
                                  />
                                ) : (
                                  <input
                                    className={`${inputClass} mt-1`}
                                    value={item[itemField.key] ?? ""}
                                    onChange={(event) => {
                                      const list = [...value.list];
                                      list[index] = {
                                        ...list[index]!,
                                        [itemField.key]: event.target.value,
                                      };
                                      setField(key, { list });
                                    }}
                                  />
                                )}
                              </label>
                            ),
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className={ghostButtonClass}
                      onClick={() =>
                        setField(key, {
                          list: [
                            ...value.list,
                            Object.fromEntries(
                              (field.itemFields ?? [{ key: "text", label: "Text", type: "text" }]).map(
                                (itemField) => [itemField.key, ""],
                              ),
                            ) as Record<string, string>,
                          ],
                        })
                      }
                    >
                      <Plus className="h-4 w-4" /> Add item
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
