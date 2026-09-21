import { PAGE_DEFAULTS, type LinkDefault } from "@/lib/pageDefaults";

export type LinkValue = LinkDefault;

/**
 * Page copy bound to a single page slug, read straight out of the committed
 * content file (content/pages.json, via pageDefaults.ts). Shared header/footer
 * fields are always available through the "shared" slug.
 *
 * This is a synchronous lookup with no network access, so the values are present
 * during SSR and land in the server-rendered HTML. The reader API — text, link,
 * list, sharedText, sharedLink — and the coercion rules are unchanged from the
 * database-backed version it replaces.
 */
export function usePageCopy(pageSlug: string) {
  const readText = (slug: string, section: string, field: string) => {
    const fallback = PAGE_DEFAULTS[slug]?.[section]?.[field];
    return typeof fallback === "string" ? fallback : "";
  };

  const readLink = (slug: string, section: string, field: string): LinkValue => {
    const fallback = PAGE_DEFAULTS[slug]?.[section]?.[field];
    const base: LinkValue =
      fallback && typeof fallback === "object" && !Array.isArray(fallback)
        ? (fallback as LinkValue)
        : { label: "", href: "/" };
    return { label: base.label, href: base.href };
  };

  function readList<T extends Record<string, string>>(
    slug: string,
    section: string,
    field: string,
  ): T[] {
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
