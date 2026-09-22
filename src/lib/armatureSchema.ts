/**
 * Builds the Armature site-contract schema (content/schema.json) from the field
 * registry in src/lib/pageSchema.ts.
 *
 * Armature's site contract v1 (acts2man/armature, docs/SITE_CONTRACT.md) expects
 *
 *   { "armatureContract": 1, "pages": [ ...PageDefinition ] }
 *
 * where each page, section and field carries the keys below, in this order. The object
 * is rebuilt key by key here — rather than serialising pageSchema.ts directly — so the
 * on-disk key order is fixed by this module and never by the order a helper in
 * pageSchema.ts happens to assign properties.
 *
 * Pure module: no filesystem, no network, no secrets. The export script writes what
 * `serializeSiteSchema` returns; `bun run check:content` fails if the committed file
 * differs from it, so content/schema.json can never drift from pageSchema.ts.
 */
import { ALL_PAGES, type PageDefinition, type PageField, type PageSection } from "@/lib/pageSchema";

/** The contract version this site publishes. Armature refuses any other value. */
export const ARMATURE_CONTRACT_VERSION = 1 as const;

/** Repo-relative path of the schema file the contract requires. */
export const SCHEMA_PATH = "content/schema.json";

export type SiteSchema = {
  armatureContract: typeof ARMATURE_CONTRACT_VERSION;
  pages: PageDefinition[];
};

type ItemField = NonNullable<PageField["itemFields"]>[number];

const buildItemField = (item: ItemField): ItemField => ({
  key: item.key,
  label: item.label,
  type: item.type,
});

const buildField = (field: PageField): PageField => {
  const out: PageField = { key: field.key, label: field.label, type: field.type };
  if (field.itemFields !== undefined) out.itemFields = field.itemFields.map(buildItemField);
  if (field.help !== undefined) out.help = field.help;
  return out;
};

const buildSection = (section: PageSection): PageSection => ({
  key: section.key,
  label: section.label,
  fields: section.fields.map(buildField),
});

const buildPage = (page: PageDefinition): PageDefinition => ({
  slug: page.slug,
  label: page.label,
  path: page.path,
  description: page.description,
  sections: page.sections.map(buildSection),
});

/**
 * The schema object for content/schema.json. Pages are emitted in ALL_PAGES order —
 * the shared header/footer page first, then the public pages in dashboard order.
 */
export function buildSiteSchema(pages: readonly PageDefinition[] = ALL_PAGES): SiteSchema {
  return { armatureContract: ARMATURE_CONTRACT_VERSION, pages: pages.map(buildPage) };
}

/** The canonical on-disk form: contract key order, 2-space indent, trailing newline. */
export function serializeSiteSchema(schema: SiteSchema = buildSiteSchema()): string {
  return `${JSON.stringify(schema, null, 2)}\n`;
}
