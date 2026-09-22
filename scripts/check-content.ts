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
 * It also checks that content/schema.json — the Armature site-contract copy of the
 * field registry — is byte-identical to what `bun run export:schema` would write from
 * pageSchema.ts today. If the two have drifted (a field was added or relabelled in
 * TypeScript without re-running the export), this fails and says so.
 *
 * Deliberately NOT wired into the build.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateContentTree } from "../src/lib/contentValidation";
import { SCHEMA_PATH, serializeSiteSchema } from "../src/lib/armatureSchema";

const here = dirname(fileURLToPath(import.meta.url));
const CONTENT = join(here, "..", "content", "pages.json");
const SCHEMA = join(here, "..", SCHEMA_PATH);

// --- content/schema.json must match pageSchema.ts -------------------------------

let committedSchema: string;
try {
  committedSchema = readFileSync(SCHEMA, "utf8");
} catch (error) {
  console.error(
    `FAIL: could not read ${SCHEMA_PATH} — ${error instanceof Error ? error.message : error}\n` +
      "Run `bun run export:schema` to generate it.",
  );
  process.exit(1);
}

if (committedSchema !== serializeSiteSchema()) {
  console.error(
    `FAIL: ${SCHEMA_PATH} is out of sync with src/lib/pageSchema.ts.\n` +
      "Run `bun run export:schema` and commit the result.",
  );
  process.exit(1);
}

// --- content/pages.json must satisfy pageSchema.ts -------------------------------

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
  `OK: ${SCHEMA_PATH} matches pageSchema.ts; all ${checked} schema fields present and ` +
    `well-shaped in content/pages.json` +
    (warnings.length > 0 ? ` (${warnings.length} warning(s)).` : "."),
);
