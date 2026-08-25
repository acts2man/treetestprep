import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PAGE_DEFAULTS, type LinkDefault } from "@/lib/pageDefaults";

export type OverrideRow = {
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

export type LinkValue = LinkDefault;

const keyOf = (slug: string, section: string, field: string) => `${slug}.${section}.${field}`;

export function usePageContent(pageSlug: string | string[]) {
  const slugs = Array.isArray(pageSlug) ? pageSlug : [pageSlug];

  const query = useQuery({
    queryKey: ["page-content", slugs.join(",")],
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_content_overrides")
        .select("*")
        .in("page_slug", slugs);
      if (error) throw error;
      return (data ?? []) as OverrideRow[];
    },
  });

  const rows = query.data ?? [];
  const map = new Map<string, OverrideRow>();
  for (const row of rows) map.set(keyOf(row.page_slug, row.section_key, row.field_key), row);

  const rowFor = (slug: string, section: string, field: string) =>
    map.get(keyOf(slug, section, field));

  return { rows, map, rowFor, isLoading: query.isLoading, slugs };
}

/**
 * Page copy bound to a single page slug, with the baked-in defaults from
 * pageDefaults.ts as fallbacks. Shared header/footer fields are always available
 * through the "shared" slug.
 */
export function usePageCopy(pageSlug: string) {
  const { rowFor } = usePageContent([pageSlug, "shared"]);

  const readText = (slug: string, section: string, field: string) => {
    const row = rowFor(slug, section, field);
    const value = row?.value_text ?? row?.image_url ?? row?.video_url ?? row?.link_url;
    if (value && value.trim().length > 0) return value;
    const fallback = PAGE_DEFAULTS[slug]?.[section]?.[field];
    return typeof fallback === "string" ? fallback : "";
  };

  const readLink = (slug: string, section: string, field: string): LinkValue => {
    const row = rowFor(slug, section, field);
    const fallback = PAGE_DEFAULTS[slug]?.[section]?.[field];
    const base: LinkValue =
      fallback && typeof fallback === "object" && !Array.isArray(fallback)
        ? (fallback as LinkValue)
        : { label: "", href: "/" };
    return {
      label: row?.value_text?.trim() ? row.value_text : base.label,
      href: row?.link_url?.trim() ? row.link_url : base.href,
    };
  };

  function readList<T extends Record<string, string>>(
    slug: string,
    section: string,
    field: string,
  ): T[] {
    const row = rowFor(slug, section, field);
    if (Array.isArray(row?.value_json) && (row!.value_json as unknown[]).length > 0) {
      return row!.value_json as T[];
    }
    const fallback = PAGE_DEFAULTS[slug]?.[section]?.[field];
    return Array.isArray(fallback) ? (fallback as T[]) : [];
  }

  return {
    text: (section: string, field: string) => readText(pageSlug, section, field),
    link: (section: string, field: string) => readLink(pageSlug, section, field),
    list: <T extends Record<string, string>>(section: string, field: string) =>
      readList<T>(pageSlug, section, field),
    sharedText: (section: string, field: string) => readText("shared", section, field),
    sharedLink: (section: string, field: string) => readLink("shared", section, field),
  };
}
