import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useBlocker } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { getPageDefinition, type PageField, type PageSection } from "@/lib/pageSchema";
import { PAGE_DEFAULTS, type LinkDefault } from "@/lib/pageDefaults";
import {
  getPublishedContent,
  publishContent,
  type ContentFailure,
  type FieldUpdateInput,
  type ImageUploadInput,
} from "@/lib/content.functions";
import {
  PageHeader,
  buttonClass,
  ghostButtonClass,
  inputClass,
} from "@/components/dashboard/DataTable";

export const Route = createFileRoute("/admin/pages/$slug")({
  component: AdminPageEditor,
});

type FieldState = { text: string; href: string; list: Record<string, string>[] };
type PendingImage = { file: File; previewUrl: string };

const EMPTY: FieldState = { text: "", href: "", list: [] };

const mediaField = (type: PageField["type"]) => type === "image" || type === "video";

const keyOf = (sectionKey: string, fieldKey: string) => `${sectionKey}.${fieldKey}`;

/** Read one field out of a content tree into the editor's per-field state. */
function stateFromValue(field: PageField, value: unknown): FieldState {
  if (field.type === "list") {
    return {
      text: "",
      href: "",
      list: Array.isArray(value) ? (value as Record<string, string>[]) : [],
    };
  }
  if (field.type === "link") {
    const link = (value ?? {}) as Partial<LinkDefault>;
    return { text: link.label ?? "", href: link.href ?? "", list: [] };
  }
  return { text: typeof value === "string" ? value : "", href: "", list: [] };
}

/** Turn the editor's per-field state back into a content value. */
function valueFromState(field: PageField, state: FieldState) {
  if (field.type === "list") return state.list;
  if (field.type === "link") return { label: state.text, href: state.href };
  return state.text;
}

const sameState = (a: FieldState | undefined, b: FieldState | undefined) =>
  JSON.stringify(a ?? EMPTY) === JSON.stringify(b ?? EMPTY);

/** Base64 of a picked file, without the data: prefix, for the publish payload. */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read that file"));
    reader.readAsDataURL(file);
  });
}

function AdminPageEditor() {
  const { slug } = Route.useParams();
  const page = getPageDefinition(slug);
  const [activeSection, setActiveSection] = useState(page?.sections[0]?.key ?? "");

  /** Only the fields the editor has touched. Everything else reads through to the baseline. */
  const [overlay, setOverlay] = useState<Record<string, FieldState>>({});
  const [pendingImages, setPendingImages] = useState<Record<string, PendingImage>>({});
  const [conflict, setConflict] = useState<ContentFailure | null>(null);
  const [failure, setFailure] = useState<ContentFailure | null>(null);
  const [lastPublish, setLastPublish] = useState<{ commitUrl: string; commitSha: string } | null>(
    null,
  );

  const published = useQuery({
    queryKey: ["published-content", slug],
    staleTime: 0,
    retry: false,
    queryFn: () => getPublishedContent(),
  });

  const loaded = published.data?.ok === true ? published.data : undefined;
  const loadFailure = published.data && published.data.ok === false ? published.data : undefined;

  /**
   * What the branch currently has. If the published content cannot be loaded (for
   * example publishing is not configured yet) fall back to the content baked into this
   * build so the page is still readable — but publishing stays disabled.
   */
  const sourceContent = useMemo(
    () =>
      (loaded?.content ?? PAGE_DEFAULTS) as Record<string, Record<string, Record<string, unknown>>>,
    [loaded],
  );

  const baseline = useMemo(() => {
    const next: Record<string, FieldState> = {};
    if (!page) return next;
    for (const section of page.sections) {
      for (const field of section.fields) {
        next[keyOf(section.key, field.key)] = stateFromValue(
          field,
          sourceContent[slug]?.[section.key]?.[field.key],
        );
      }
    }
    return next;
  }, [page, slug, sourceContent]);

  const changed = useMemo(() => {
    const keys = new Set<string>();
    for (const [key, state] of Object.entries(overlay)) {
      if (!sameState(state, baseline[key])) keys.add(key);
    }
    for (const key of Object.keys(pendingImages)) keys.add(key);
    return keys;
  }, [overlay, baseline, pendingImages]);

  const isDirty = changed.size > 0;
  const canPublish = Boolean(loaded) && isDirty;

  // Warn before leaving — in-app navigation and browser close/reload alike.
  const blocker = useBlocker({
    shouldBlockFn: () => isDirty,
    enableBeforeUnload: () => isDirty,
    withResolver: true,
    disabled: !isDirty,
  });

  // Release the object URLs the image previews hold.
  const previewUrls = useRef<string[]>([]);
  useEffect(() => {
    return () => {
      for (const url of previewUrls.current) URL.revokeObjectURL(url);
      previewUrls.current = [];
    };
  }, []);

  const valueFor = useCallback(
    (key: string): FieldState => overlay[key] ?? baseline[key] ?? EMPTY,
    [overlay, baseline],
  );

  const setField = (key: string, patch: Partial<FieldState>) =>
    setOverlay((current) => ({
      ...current,
      [key]: { ...(current[key] ?? baseline[key] ?? EMPTY), ...patch },
    }));

  const revertField = (key: string) => {
    setOverlay((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setPendingImages((current) => {
      const pending = current[key];
      if (!pending) return current;
      URL.revokeObjectURL(pending.previewUrl);
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const discardAll = () => {
    for (const pending of Object.values(pendingImages)) URL.revokeObjectURL(pending.previewUrl);
    setOverlay({});
    setPendingImages({});
    setConflict(null);
    setFailure(null);
  };

  function attachImage(key: string, file: File) {
    const previewUrl = URL.createObjectURL(file);
    previewUrls.current.push(previewUrl);
    setPendingImages((current) => {
      const existing = current[key];
      if (existing) URL.revokeObjectURL(existing.previewUrl);
      return { ...current, [key]: { file, previewUrl } };
    });
  }

  const publish = useMutation({
    mutationFn: async () => {
      if (!loaded) throw new Error("The published content has not loaded yet.");
      if (!page) throw new Error("Unknown page.");

      const fieldByKey = new Map<string, { section: PageSection; field: PageField }>();
      for (const section of page.sections) {
        for (const field of section.fields) {
          fieldByKey.set(keyOf(section.key, field.key), { section, field });
        }
      }

      const fields: FieldUpdateInput[] = [];
      for (const key of changed) {
        // A pending upload decides its own field's value on the server.
        if (pendingImages[key]) continue;
        const entry = fieldByKey.get(key);
        if (!entry) continue;
        fields.push({
          section: entry.section.key,
          field: entry.field.key,
          value: valueFromState(entry.field, valueFor(key)),
        });
      }

      const images: ImageUploadInput[] = [];
      for (const [key, pending] of Object.entries(pendingImages)) {
        const entry = fieldByKey.get(key);
        if (!entry) continue;
        images.push({
          section: entry.section.key,
          field: entry.field.key,
          filename: pending.file.name,
          contentType: pending.file.type,
          dataBase64: await fileToBase64(pending.file),
        });
      }

      return publishContent({
        data: { slug, baseCommitSha: loaded.commitSha, fields, images },
      });
    },
    onMutate: () => {
      setConflict(null);
      setFailure(null);
    },
    onSuccess: async (result) => {
      if (result.ok) {
        for (const pending of Object.values(pendingImages)) URL.revokeObjectURL(pending.previewUrl);
        setOverlay({});
        setPendingImages({});
        setLastPublish({ commitUrl: result.commitUrl, commitSha: result.commitSha });
        toast.success("Published. Your changes will be live in about 2 minutes.");
        await published.refetch();
        return;
      }
      if (result.code === "conflict") {
        setConflict(result);
        return;
      }
      setFailure(result);
      toast.error(result.message.split("\n")[0] ?? "Publishing failed.");
    },
    onError: (error: Error) => {
      setFailure({ ok: false, code: "github_error", message: error.message, fields: [] });
      toast.error(error.message);
    },
  });

  if (!page) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Page not found"
          description="This page is not in the content registry."
        />
        <Link to="/admin/pages/" className={ghostButtonClass}>
          <ArrowLeft className="h-4 w-4" /> Back to pages
        </Link>
      </div>
    );
  }

  const section = page.sections.find((item) => item.key === activeSection) ?? page.sections[0]!;
  const changedInSection = (item: PageSection) =>
    item.fields.filter((field) => changed.has(keyOf(item.key, field.key))).length;

  return (
    <div className="space-y-6">
      <Link to="/admin/pages/" className="inline-flex items-center gap-2 text-sm text-white/60">
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

      {/* Publish bar */}
      <div className="sticky top-0 z-10 rounded-xl border border-white/10 bg-gradient-to-br from-[#0a1228] to-[#05070d] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            {published.isLoading ? (
              <span className="text-white/50">Loading the published content...</span>
            ) : isDirty ? (
              <span className="font-medium text-[#d9c58c]">
                {changed.size} unpublished {changed.size === 1 ? "change" : "changes"}
              </span>
            ) : (
              <span className="text-white/50">No unpublished changes</span>
            )}
            {loaded && (
              <span className="ml-2 text-white/30">
                editing {loaded.branch} @ {loaded.commitSha.slice(0, 7)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={ghostButtonClass}
              disabled={!isDirty || publish.isPending}
              onClick={discardAll}
            >
              <RotateCcw className="h-4 w-4" /> Discard all changes
            </button>
            <button
              type="button"
              className={buttonClass}
              disabled={!canPublish || publish.isPending}
              onClick={() => publish.mutate()}
            >
              {publish.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Publishing...
                </>
              ) : (
                "Publish changes"
              )}
            </button>
          </div>
        </div>

        {publish.isPending && (
          <p className="mt-3 text-xs text-white/50">
            Committing your changes to the site repository. This triggers a rebuild — keep this tab
            open until it finishes.
          </p>
        )}

        {isDirty && !publish.isPending && (
          <p className="mt-3 text-xs text-white/40">
            Nothing is live until you press Publish. Your changes are only in this browser.
          </p>
        )}
      </div>

      {/* Publishing not available */}
      {loadFailure && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-amber-200">
            <TriangleAlert className="h-4 w-4" /> Publishing is unavailable
          </p>
          <p className="mt-2 text-white/70">{loadFailure.message}</p>
          <p className="mt-2 text-white/50">
            The fields below show the content from the current build so you can read it, but they
            cannot be published until this is fixed. See ARMATURE_STEP3.md for the setup steps.
          </p>
        </div>
      )}

      {/* Published confirmation */}
      {lastPublish && !isDirty && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-4 text-sm">
          <p className="font-semibold text-emerald-200">
            Published. Your changes will be live in about 2 minutes.
          </p>
          <a
            href={lastPublish.commitUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-2 text-white/70 underline"
          >
            View the commit ({lastPublish.commitSha.slice(0, 7)})
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* Conflict */}
      {conflict && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-rose-200">
            <TriangleAlert className="h-4 w-4" /> Nothing was published
          </p>
          <p className="mt-2 text-white/70">{conflict.message}</p>
          {conflict.fields.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-white/60">
              {conflict.fields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonClass}
              onClick={() => {
                setConflict(null);
                void published.refetch();
              }}
            >
              Reload and keep my changes
            </button>
            <button
              type="button"
              className={ghostButtonClass}
              onClick={() => {
                discardAll();
                void published.refetch();
              }}
            >
              Discard my changes and reload
            </button>
          </div>
        </div>
      )}

      {/* Other publish failure */}
      {failure && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-rose-200">
            <TriangleAlert className="h-4 w-4" /> Nothing was published
          </p>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-white/70">{failure.message}</pre>
        </div>
      )}

      {/* Leave-page confirmation */}
      {blocker.status === "blocked" && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm">
          <p className="font-semibold text-amber-200">You have unpublished changes</p>
          <p className="mt-2 text-white/70">
            Leaving this page will discard {changed.size}{" "}
            {changed.size === 1 ? "change" : "changes"} that have not been published.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={ghostButtonClass} onClick={() => blocker.reset()}>
              Stay on this page
            </button>
            <button type="button" className={buttonClass} onClick={() => blocker.proceed()}>
              Leave and discard
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {page.sections.map((item) => {
          const count = changedInSection(item);
          return (
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
              {count > 0 && (
                <span className="ml-2 rounded bg-[#d9c58c] px-1.5 text-xs font-semibold text-[#05070d]">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {published.isLoading && <p className="text-sm text-white/50">Loading content...</p>}

      <div className="space-y-4">
        {section.fields.map((field) => {
          const key = keyOf(section.key, field.key);
          const value = valueFor(key);
          const pending = pendingImages[key];
          const isChanged = changed.has(key);

          return (
            <div
              key={key}
              className={`rounded-xl border bg-gradient-to-br from-[#0a1228] to-[#05070d] p-4 ${
                isChanged ? "border-[#d9c58c]/50" : "border-white/10"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                  {field.label}
                  {isChanged && (
                    <span className="rounded bg-[#d9c58c] px-1.5 py-0.5 text-xs font-semibold text-[#05070d]">
                      Changed
                    </span>
                  )}
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={ghostButtonClass}
                    disabled={!isChanged || publish.isPending}
                    onClick={() => revertField(key)}
                  >
                    <RotateCcw className="h-4 w-4" /> Revert
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
                      placeholder={field.type === "image" ? "/assets/example.webp" : "Paste a URL"}
                      value={pending ? "" : value.text}
                      disabled={Boolean(pending)}
                      onChange={(event) => setField(key, { text: event.target.value })}
                    />
                    {field.type === "image" && (
                      <>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className={inputClass}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) attachImage(key, file);
                            event.target.value = "";
                          }}
                        />
                        {pending ? (
                          <div className="space-y-2">
                            <p className="text-xs text-[#d9c58c]">
                              New image ready to publish: {pending.file.name}
                            </p>
                            <img
                              src={pending.previewUrl}
                              alt=""
                              className="max-h-40 rounded-lg border border-[#d9c58c]/40 object-cover"
                            />
                          </div>
                        ) : (
                          value.text && (
                            <img
                              src={value.text}
                              alt=""
                              className="max-h-40 rounded-lg border border-white/10 object-cover"
                            />
                          )
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
                              (
                                field.itemFields ?? [{ key: "text", label: "Text", type: "text" }]
                              ).map((itemField) => [itemField.key, ""]),
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
