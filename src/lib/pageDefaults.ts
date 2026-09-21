/**
 * Typed adapter over content/pages.json — the committed content of record.
 *
 * The JSON file is imported, so it is baked into both the client and the SSR
 * bundle: the public pages read it, the server renders it into the HTML, and the
 * admin editor previews and resets to it. Editing content/pages.json and
 * rebuilding is all it takes to change the site.
 *
 * Regenerate/normalise the JSON with `bun run export:defaults`, and validate it
 * against pageSchema.ts with `bun run check:content`.
 */
import content from "../../content/pages.json";

export type LinkDefault = { label: string; href: string };
export type DefaultValue = string | LinkDefault | Record<string, string>[];

export const PAGE_DEFAULTS = content as unknown as Record<
  string,
  Record<string, Record<string, DefaultValue>>
>;

export function defaultValue(
  slug: string,
  section: string,
  field: string,
): DefaultValue | undefined {
  return PAGE_DEFAULTS[slug]?.[section]?.[field];
}
