import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export type LinkValue = { label: string; href: string };

const keyOf = (section: string, field: string) => `${section}.${field}`;

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
  for (const row of rows) map.set(keyOf(row.section_key, row.field_key), row);

  const get = (section: string, field: string, fallback: string) => {
    const row = map.get(keyOf(section, field));
    const value = row?.value_text ?? row?.image_url ?? row?.video_url ?? row?.link_url;
    return value && value.trim().length > 0 ? value : fallback;
  };

  const getLink = (section: string, field: string, fallback: LinkValue): LinkValue => {
    const row = map.get(keyOf(section, field));
    return {
      label: row?.value_text?.trim() ? row.value_text : fallback.label,
      href: row?.link_url?.trim() ? row.link_url : fallback.href,
    };
  };

  function getList<T>(section: string, field: string, fallback: T[]): T[] {
    const row = map.get(keyOf(section, field));
    const value = row?.value_json;
    if (Array.isArray(value) && value.length > 0) return value as T[];
    return fallback;
  }

  return { get, getLink, getList, rows, isLoading: query.isLoading };
}
