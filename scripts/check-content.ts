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
 * This replaces the compile-time safety that was lost when the content moved out
 * of TypeScript and into JSON. It is deliberately NOT wired into the build yet.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_PAGES, type PageField } from "../src/lib/pageSchema";

const here = dirname(fileURLToPath(import.meta.url));
const CONTENT = join(here, "..", "content", "pages.json");

const errors: string[] = [];
const warnings: string[] = [];

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const describe = (value: unknown): string => {
  if (value === null) return "null";
  if (Array.isArray(value)) return `array(${value.length})`;
  return typeof value;
};

/** Check one field's value against its declared type. Pushes onto `errors`. */
function checkField(where: string, field: PageField, value: unknown): void {
  switch (field.type) {
    case "text":
    case "textarea":
    case "image":
    case "video":
    case "url": {
      if (typeof value !== "string") {
        errors.push(`${where}: expected a string for type "${field.type}", got ${describe(value)}`);
      }
      return;
    }
    case "link": {
      if (!isPlainObject(value)) {
        errors.push(`${where}: expected { label, href } for type "link", got ${describe(value)}`);
        return;
      }
      for (const key of ["label", "href"]) {
        if (!(key in value)) errors.push(`${where}: link is missing "${key}"`);
        else if (typeof value[key] !== "string") {
          errors.push(`${where}: link "${key}" must be a string, got ${describe(value[key])}`);
        }
      }
      return;
    }
    case "list": {
      if (!Array.isArray(value)) {
        errors.push(`${where}: expected an array for type "list", got ${describe(value)}`);
        return;
      }
      const itemFields = field.itemFields ?? [];
      value.forEach((item, index) => {
        const at = `${where}[${index}]`;
        if (!isPlainObject(item)) {
          errors.push(`${at}: list items must be objects, got ${describe(item)}`);
          return;
        }
        for (const itemField of itemFields) {
          if (!(itemField.key in item)) {
            errors.push(`${at}: missing "${itemField.key}"`);
          } else if (typeof item[itemField.key] !== "string") {
            errors.push(
              `${at}."${itemField.key}": must be a string, got ${describe(item[itemField.key])}`,
            );
          }
        }
        const declared = new Set(itemFields.map((f) => f.key));
        for (const key of Object.keys(item)) {
          if (!declared.has(key)) warnings.push(`${at}: "${key}" is not declared in the schema`);
        }
      });
      return;
    }
  }
}

const raw: unknown = JSON.parse(readFileSync(CONTENT, "utf8"));
if (!isPlainObject(raw)) {
  console.error("FAIL: content/pages.json must be a JSON object.");
  process.exit(1);
}

let checked = 0;
const seen = new Set<string>();

for (const page of ALL_PAGES) {
  const pageContent = raw[page.slug];
  if (!isPlainObject(pageContent)) {
    errors.push(`${page.slug}: missing from content/pages.json (or not an object)`);
    continue;
  }
  for (const section of page.sections) {
    const sectionContent = pageContent[section.key];
    if (!isPlainObject(sectionContent)) {
      errors.push(`${page.slug}.${section.key}: missing section (or not an object)`);
      continue;
    }
    for (const field of section.fields) {
      const where = `${page.slug}.${section.key}.${field.key}`;
      seen.add(where);
      checked += 1;
      if (!(field.key in sectionContent)) {
        errors.push(`${where}: missing from content/pages.json`);
        continue;
      }
      checkField(where, field, sectionContent[field.key]);
    }
  }
}

// Reverse direction: content the schema does not declare (warning only).
for (const [slug, sections] of Object.entries(raw)) {
  if (!isPlainObject(sections)) continue;
  for (const [sectionKey, fields] of Object.entries(sections)) {
    if (!isPlainObject(fields)) continue;
    for (const fieldKey of Object.keys(fields)) {
      const where = `${slug}.${sectionKey}.${fieldKey}`;
      if (!seen.has(where)) {
        warnings.push(`${where}: present in content/pages.json but not declared in pageSchema.ts`);
      }
    }
  }
}

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
