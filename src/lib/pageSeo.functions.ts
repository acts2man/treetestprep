import { createServerFn } from "@tanstack/react-start";

export type SeoOverrides = Record<string, string>;

/** Public read of the editable SEO fields for one page slug. */
export const getPageSeo = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }): Promise<SeoOverrides> => {
    const url = process.env["SUPABASE_URL"];
    const key =
      process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
    if (!url || !key) return {};

    try {
      const { createClient } = await import("@supabase/supabase-js");
      const client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: rows, error } = await client
        .from("page_content_overrides")
        .select("field_key, value_text, image_url")
        .eq("page_slug", data.slug)
        .eq("section_key", "seo");
      if (error || !rows) return {};
      const out: SeoOverrides = {};
      for (const row of rows as { field_key: string; value_text: string | null; image_url: string | null }[]) {
        const value = row.value_text ?? row.image_url;
        if (value && value.trim().length > 0) out[row.field_key] = value.trim();
      }
      return out;
    } catch {
      return {};
    }
  });
