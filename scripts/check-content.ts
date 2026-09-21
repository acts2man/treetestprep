/**
 * Validates content/pages.json against the field registry in src/lib/pageSchema.ts.
 *
 * Run with: bun run check:content
 *
 * Fails (exit 1) when a field declared in the schema is missing from the content
 * file, or is present with the wrong shape:
 *
 *   text | textarea | image | video | url  ->  string
 *   link                                   ->  { label: string, href: string }
 *   list                                   ->  array of objects whose declared
 *                                              itemFields are all present strings
 *
 * Content present in the JSON but not declared in the schema is reported as a
 * warning, not a failure: it renders fine but the admin editor cannot reach it.
 *
 * This is a thin CLI over validateContentTree() in src/lib/contentValidation.ts —
 * the same function the publish server function runs on the merged result before it
 * commits, so the two can never drift apart.
 *
 * Deliberately NOT wired into the build.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateContentTree } from "../src/lib/contentValidation";

const here = dirname(fileURLToPath(import.meta.url));
const CONTENT = join(here, "..", "content", "pages.json");

let parsed: unknown;
try {
  parsed = JSON.parse(readFileSync(CONTENT, "utf8"));
} catch (error) {
  console.error(
    `FAIL: could not read content/pages.json — ${error instanceof Error ? error.message : error}`,
  );
  process.exit(1);
}

const { errors, warnings, checked } = validateContentTree(parsed);

for (const warning of warnings) console.warn(`warning  ${warning}`);

if (errors.length > 0) {
  for (const error of errors) console.error(`error    ${error}`);
  console.error(
    `\nFAIL: ${errors.length} problem(s) in content/pages.json (${checked} fields checked).`,
  );
  process.exit(1);
}

console.log(
  `OK: all ${checked} schema fields present and well-shaped in content/pages.json` +
    (warnings.length > 0 ? ` (${warnings.length} warning(s)).` : "."),
);
