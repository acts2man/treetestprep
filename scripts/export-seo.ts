/**
 * Generate public/sitemap.xml and public/robots.txt the Armature kit's way.
 *
 * Run with: bun run export:seo
 *
 * Uses the kit's own `sitemapXml()` and `robotsTxt()` (the same functions the Armature
 * publish function runs), the site URL and any robots extras from `content/site-kit.json`
 * under `seo`, and the real public pages from `src/lib/pageSchema.ts` (every page that is
 * not marked noindex in its builder layout). The Armature dashboard regenerates these on
 * every publish; this script keeps them in step for the coded build and CI.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sitemapXml, robotsTxt, type SitemapEntry } from "../src/lib/armature-kit";
import { PAGE_SCHEMA } from "../src/lib/pageSchema";
import type { SiteKit } from "../src/lib/armature-kit";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const siteKit = JSON.parse(readFileSync(join(root, "content", "site-kit.json"), "utf8")) as SiteKit;
const siteUrl = siteKit.seo?.siteUrl ?? "";
const robotsExtras = siteKit.seo?.robotsExtras;

const today = new Date().toISOString().slice(0, 10);

/** Is a page's builder layout marked noindex? Then it stays out of the sitemap. */
function isNoindex(slug: string): boolean {
  try {
    const layout = JSON.parse(readFileSync(join(root, "content", "layouts", `${slug}.json`), "utf8")) as {
      seo?: { noindex?: boolean };
    };
    return layout.seo?.noindex === true;
  } catch {
    return false;
  }
}

const entries: SitemapEntry[] = PAGE_SCHEMA.filter((page) => !isNoindex(page.slug))
  .map((page) => ({ path: page.path, lastmod: today }))
  .sort((a, b) => a.path.localeCompare(b.path));

writeFileSync(join(root, "public", "sitemap.xml"), sitemapXml(siteUrl, entries));
writeFileSync(join(root, "public", "robots.txt"), robotsTxt(siteUrl, robotsExtras));

console.log(
  `OK: wrote public/sitemap.xml (${entries.length} pages) and public/robots.txt` +
    (siteUrl ? ` for ${siteUrl}.` : " (no site URL set; sitemap line skipped)."),
);
