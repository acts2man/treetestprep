/**
 * Serialises PAGE_DEFAULTS into content/pages.json — the git-first content file
 * of record.
 *
 * Run with: bun run export:defaults
 *
 * The serialisation itself lives in src/lib/contentFile.ts, which the publish server
 * function also uses, so a file written by the admin Publish button and a file written
 * here are byte-identical in formatting: object keys alphabetical at every depth (so
 * the output is stable whoever produced it), array order preserved (navigation, FAQ
 * items and course weeks are ordered content), 2-space indent, trailing newline.
 *
 * After writing, the file is read back and deep-compared against PAGE_DEFAULTS so the
 * commit is a provably faithful serialisation and not a lossy one.
 *
 * Note: src/lib/pageDefaults.ts is now a typed adapter over this same JSON file, so
 * re-running this script normalises the file rather than regenerating it from
 * TypeScript. The original hand-written object lives in git history at f0e9c54.
 */
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PAGE_DEFAULTS } from "../src/lib/pageDefaults";
import { deepEqual, serializeContent } from "../src/lib/contentFile";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "..", "content", "pages.json");

function countFields(content: Record<string, Record<string, Record<string, unknown>>>): number {
  let total = 0;
  for (const sections of Object.values(content)) {
    for (const fields of Object.values(sections)) total += Object.keys(fields).length;
  }
  return total;
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, serializeContent(PAGE_DEFAULTS), "utf8");

const roundTripped: unknown = JSON.parse(readFileSync(OUT, "utf8"));
if (!deepEqual(roundTripped, PAGE_DEFAULTS)) {
  console.error("FAIL: content/pages.json does not deep-equal PAGE_DEFAULTS.");
  process.exit(1);
}

const pages = Object.keys(PAGE_DEFAULTS).length;
console.log(
  `Wrote content/pages.json — ${pages} pages, ${countFields(PAGE_DEFAULTS)} fields.\n` +
    "Verified: parsed JSON deep-equals PAGE_DEFAULTS.",
);
