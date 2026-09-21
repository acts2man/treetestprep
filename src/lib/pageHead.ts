import { PAGE_DEFAULTS } from "@/lib/pageDefaults";
import { SITE } from "@/lib/siteConfig";

const seoField = (slug: string, field: string) => {
  const value = PAGE_DEFAULTS[slug]?.["seo"]?.[field];
  return typeof value === "string" ? value : "";
};

/** Build route head metadata from the SEO fields in the committed content file. */
export function buildHead(slug: string, path: string) {
  const title = seoField(slug, "title");
  const description = seoField(slug, "description");
  const image = seoField(slug, "image");
  const url = `${SITE}${path}`;

  const meta: Record<string, string>[] = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Tree Test Prep" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];

  if (image && image.startsWith("https://")) {
    meta.push({ property: "og:image", content: image });
    meta.push({ name: "twitter:image", content: image });
  }

  return { meta, links: [{ rel: "canonical", href: url }] };
}
