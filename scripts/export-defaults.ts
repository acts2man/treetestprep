/**
 * Serialises PAGE_DEFAULTS into content/pages.json — the git-first content file
 * of record.
 *
 * Run with: bun run export:defaults
 *
 * Object keys are written in alphabetical order at every depth so the output is
 * byte-stable no matter who or what produced the input; array order is left
 * alone, because lists (navigation, FAQ items, course weeks) are ordered content.
 * After writing, the file is read back and deep-compared against PAGE_DEFAULTS so
 * the commit is provably a faithful serialisation and not a lossy one.
 *
 * Note: src/lib/pageDefaults.ts is now a typed adapter over this same JSON file,
 * so re-running this script normalises the file rather than regenerating it from
 * TypeScript. The original hand-written object lives in git history at f0e9c54.
 */
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PAGE_DEFAULTS } from "../src/lib/pageDefaults";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "..", "content", "pages.json");

/** Recursively rewrite objects with alphabetically ordered keys. Arrays keep their order. */
function sortDeep(value: unknown): Json {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const out: { [key: string]: Json } = {};
    for (const key of Object.keys(source).sort()) out[key] = sortDeep(source[key]);
    return out;
  }
  return value as Json;
}

/** Structural equality that ignores key order. */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const left = a as Record<string, unknown>;
    const right = b as Record<string, unknown>;
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    if (leftKeys.length !== rightKeys.length) return false;
    if (!leftKeys.every((key, i) => key === rightKeys[i])) return false;
    return leftKeys.every((key) => deepEqual(left[key], right[key]));
  }
  return false;
}

function countFields(content: Record<string, Record<string, Record<string, unknown>>>): number {
  let total = 0;
  for (const sections of Object.values(content)) {
    for (const fields of Object.values(sections)) total += Object.keys(fields).length;
  }
  return total;
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(sortDeep(PAGE_DEFAULTS), null, 2)}\n`, "utf8");

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
