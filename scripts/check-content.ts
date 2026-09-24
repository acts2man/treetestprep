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
 * Finally, it validates the page-builder files — every content/layouts/<slug>.json
 * (pages plus the _header/_footer chrome parts) and content/site-kit.json — with the
 * Armature kit's own validator (src/lib/armature-kit/validate.ts). That is the one set
 * of rules the kit, the dashboard and the publish function all run, so this check fails
 * on exactly what Armature would flag. Every value the validator could not read is an
 * error here, even the ones the kit renders around ("ignored"), so they get fixed at
 * the source. See kit/README.md, "Your site's content check must call it".
 *
 * Deliberately NOT wired into the build.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateContentTree } from "../src/lib/contentValidation";
import { SCHEMA_PATH, serializeSiteSchema } from "../src/lib/armatureSchema";
import { checkLayout, checkPost, checkPostIndex, checkSiteKit, describeProblem } from "../src/lib/armature-kit/validate";

const here = dirname(fileURLToPath(import.meta.url));
const CONTENT = join(here, "..", "content", "pages.json");
const SCHEMA = join(here, "..", SCHEMA_PATH);
const LAYOUTS_DIR = join(here, "..", "content", "layouts");
const SITE_KIT = join(here, "..", "content", "site-kit.json");

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

let failed = false;

if (errors.length > 0) {
  for (const error of errors) console.error(`error    ${error}`);
  console.error(
    `\nFAIL: ${errors.length} problem(s) in content/pages.json (${checked} fields checked).`,
  );
  failed = true;
}

// --- content/layouts/*.json and content/site-kit.json must satisfy the kit --------

let layoutProblems = 0;
let layoutFiles: string[] = [];
try {
  layoutFiles = readdirSync(LAYOUTS_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort();
} catch (error) {
  console.error(
    `FAIL: could not read content/layouts — ${error instanceof Error ? error.message : error}`,
  );
  process.exit(1);
}

for (const name of layoutFiles) {
  const path = join(LAYOUTS_DIR, name);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    console.error(
      `error    content/layouts/${name}: not valid JSON — ${error instanceof Error ? error.message : error}`,
    );
    failed = true;
    continue;
  }
  const report = checkLayout(raw);
  if (report.value === null) {
    console.error(`error    content/layouts/${name}: not a layout file (no root, no pageSlug, or wrong version).`);
    failed = true;
  }
  for (const problem of report.problems) {
    // "ignored" problems still render; treat them as errors so they get fixed at the source.
    console.error(`error    ${describeProblem(problem, `content/layouts/${name}`)}`);
    layoutProblems += 1;
    failed = true;
  }
}

let kitRaw: unknown;
try {
  kitRaw = JSON.parse(readFileSync(SITE_KIT, "utf8"));
} catch (error) {
  console.error(
    `FAIL: could not read content/site-kit.json — ${error instanceof Error ? error.message : error}`,
  );
  process.exit(1);
}
const kitReport = checkSiteKit(kitRaw);
for (const problem of kitReport.problems) {
  console.error(`error    ${describeProblem(problem, "content/site-kit.json")}`);
  layoutProblems += 1;
  failed = true;
}

// --- content/posts/*.json (blog) must satisfy the kit -----------------------------

const POSTS_DIR = join(here, "..", "content", "posts");
let postCount = 0;
if (existsSync(POSTS_DIR)) {
  for (const name of readdirSync(POSTS_DIR).filter((file) => file.endsWith(".json")).sort()) {
    const path = join(POSTS_DIR, name);
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(path, "utf8"));
    } catch (error) {
      console.error(`error    content/posts/${name}: not valid JSON — ${error instanceof Error ? error.message : error}`);
      layoutProblems += 1;
      failed = true;
      continue;
    }
    if (name === "index.json") {
      for (const problem of checkPostIndex(raw).problems) {
        console.error(`error    ${describeProblem(problem, "content/posts/index.json")}`);
        layoutProblems += 1;
        failed = true;
      }
      continue;
    }
    const report = checkPost(raw);
    if (report.value === null) {
      console.error(`error    content/posts/${name}: not a post file (needs version 1, kind "post", a slug, a path, settings and a root).`);
      failed = true;
    } else {
      postCount += 1;
    }
    for (const problem of report.problems) {
      console.error(`error    ${describeProblem(problem, `content/posts/${name}`)}`);
      layoutProblems += 1;
      failed = true;
    }
  }
}

if (failed) {
  if (layoutProblems > 0) {
    console.error(`\nFAIL: ${layoutProblems} problem(s) the Armature kit flagged in content/layouts, content/site-kit.json or content/posts.`);
  }
  process.exit(1);
}

console.log(
  `OK: ${SCHEMA_PATH} matches pageSchema.ts; all ${checked} schema fields present and ` +
    `well-shaped in content/pages.json` +
    (warnings.length > 0 ? ` (${warnings.length} warning(s));` : ";") +
    ` ${layoutFiles.length} builder layout(s), content/site-kit.json and ${postCount} post(s) pass the kit validator.`,
);
