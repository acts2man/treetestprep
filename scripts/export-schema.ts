/**
 * Generates content/schema.json — the Armature site-contract v1 field map — from
 * src/lib/pageSchema.ts.
 *
 * Run with: bun run export:schema
 *
 * The shape and key order come from src/lib/armatureSchema.ts, which is also what
 * `bun run check:content` compares the committed file against. Re-run this script
 * whenever pageSchema.ts changes; the check fails until you do.
 *
 * After writing, the file is read back and compared field by field against
 * pageSchema.ts so every field the /admin editor shows is proven to be in the file
 * with the same key, label, type, help text and list item fields.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_PAGES } from "../src/lib/pageSchema";
import {
  ARMATURE_CONTRACT_VERSION,
  SCHEMA_PATH,
  buildSiteSchema,
  serializeSiteSchema,
} from "../src/lib/armatureSchema";
import { deepEqual } from "../src/lib/contentFile";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "..", SCHEMA_PATH);

const schema = buildSiteSchema();
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, serializeSiteSchema(schema), "utf8");

const written = JSON.parse(readFileSync(OUT, "utf8")) as { pages?: unknown };
if (!deepEqual(written, { armatureContract: ARMATURE_CONTRACT_VERSION, pages: ALL_PAGES })) {
  console.error(`FAIL: ${SCHEMA_PATH} does not deep-equal the pages in pageSchema.ts.`);
  process.exit(1);
}

let sections = 0;
let fields = 0;
for (const page of schema.pages) {
  sections += page.sections.length;
  for (const section of page.sections) fields += section.fields.length;
}
console.log(
  `Wrote ${SCHEMA_PATH} — armatureContract ${ARMATURE_CONTRACT_VERSION}, ` +
    `${schema.pages.length} pages, ${sections} sections, ${fields} fields.\n` +
    "Verified: parsed JSON deep-equals ALL_PAGES from pageSchema.ts.",
);
