/**
 * Route head metadata, built by the Armature kit's SEO helper from the site's own SEO data.
 *
 * The per-page SEO fields (search title, description, …) live in each page's builder
 * layout (`content/layouts/<slug>.json` under `seo`) and the site-wide defaults (site name,
 * URL, title pattern) live in `content/site-kit.json` under `seo`. Both are what the
 * Armature dashboard's SEO panel reads and writes, so SEO is now edited there. `buildHead`
 * hands the layout and the site kit to the kit's pure `computePageHead()` and shapes its
 * result into TanStack Start's `head()` return.
 *
 * The site keeps a few global tags in `src/routes/__root.tsx` (charset, viewport, robots,
 * og:locale, twitter:card, the site-wide JSON-LD, the stylesheet and icons). `og:type`,
 * `og:site_name` and `twitter:card` are the same on every page, so the root owns them; the
 * per-page `twitter:card` the kit derives is dropped here so the root's value stands.
 */
import { computePageHead } from "@/lib/armature-kit";
import type { HeadTag, LayoutDoc, SiteKit } from "@/lib/armature-kit";
import siteKit from "../../content/site-kit.json";
import { SITE } from "@/lib/siteConfig";

// Every committed layout, baked in at build time by Vite (same macro as src/lib/armature.ts).
// Under `bun test` (no Vite transform) import.meta.glob is undefined, so fall back to none.
let layoutModules: Record<string, unknown> = {};
try {
  layoutModules = import.meta.glob("../../content/layouts/*.json", { eager: true });
} catch {
  layoutModules = {};
}

const layoutsBySlug: Record<string, LayoutDoc> = {};
for (const mod of Object.values(layoutModules)) {
  const layout = ((mod as { default?: unknown }).default ?? mod) as LayoutDoc | undefined;
  if (layout && typeof layout === "object" && typeof (layout as LayoutDoc).pageSlug === "string") {
    layoutsBySlug[(layout as LayoutDoc).pageSlug] = layout as LayoutDoc;
  }
}

type TanStackHead = {
  meta?: Record<string, string>[];
  links?: Record<string, string>[];
  scripts?: { type: string; children: string }[];
};

/** Build route head metadata from the page's builder layout and the site kit's SEO block. */
export function buildHead(slug: string, path: string): TanStackHead {
  const layout = layoutsBySlug[slug];
  if (!layout) return {};
  const tags: HeadTag[] = computePageHead(layout, siteKit as unknown as SiteKit, {
    pageUrl: `${SITE}${path}`,
  });

  const meta: Record<string, string>[] = [];
  const links: Record<string, string>[] = [];
  const scripts: { type: string; children: string }[] = [];
  for (const tag of tags) {
    if (tag.tag === "title") {
      meta.push({ title: tag.content });
    } else if (tag.tag === "meta") {
      // The site sets one global twitter:card in __root.tsx; drop the per-page one the kit
      // derives so that value stands (the site's cards are summary_large_image).
      if (tag.attrs["name"] === "twitter:card") continue;
      meta.push({ ...tag.attrs });
    } else if (tag.tag === "link") {
      links.push({ ...tag.attrs });
    } else {
      scripts.push({ type: "application/ld+json", children: tag.content });
    }
  }
  return { meta, links, scripts };
}
