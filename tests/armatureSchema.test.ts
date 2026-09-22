/**
 * Tests for the Armature site-contract schema built from pageSchema.ts.
 *
 * Run with: bun run test
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ALL_PAGES, SHARED_SCHEMA } from "@/lib/pageSchema";
import {
  ARMATURE_CONTRACT_VERSION,
  SCHEMA_PATH,
  buildSiteSchema,
  serializeSiteSchema,
} from "@/lib/armatureSchema";

const committed = readFileSync(join(import.meta.dir, "..", SCHEMA_PATH), "utf8");

describe("buildSiteSchema", () => {
  it("declares contract version 1 as a number", () => {
    const schema = buildSiteSchema();
    expect(schema.armatureContract).toBe(1);
    expect(ARMATURE_CONTRACT_VERSION).toBe(1);
  });

  it("includes the shared page and every page in ALL_PAGES, in order", () => {
    const schema = buildSiteSchema();
    expect(schema.pages.map((page) => page.slug)).toEqual(ALL_PAGES.map((page) => page.slug));
    expect(schema.pages.some((page) => page.slug === SHARED_SCHEMA.slug)).toBe(true);
  });

  it("carries every field with the same key, label, type, help and item fields", () => {
    expect(buildSiteSchema().pages).toEqual(ALL_PAGES);
  });

  it("emits keys in the contract's order", () => {
    const schema = buildSiteSchema();
    expect(Object.keys(schema)).toEqual(["armatureContract", "pages"]);
    const page = schema.pages[0]!;
    expect(Object.keys(page)).toEqual(["slug", "label", "path", "description", "sections"]);
    const section = page.sections[0]!;
    expect(Object.keys(section)).toEqual(["key", "label", "fields"]);
    const list = section.fields.find((field) => field.type === "list")!;
    expect(Object.keys(list)).toEqual(["key", "label", "type", "itemFields"]);
    expect(Object.keys(list.itemFields![0]!)).toEqual(["key", "label", "type"]);
    const plain = section.fields.find((field) => field.type !== "list")!;
    expect(Object.keys(plain)).toEqual(["key", "label", "type"]);
  });

  it("only emits help when a field declares it", () => {
    const schema = buildSiteSchema([
      {
        slug: "x",
        label: "X",
        path: "/x/",
        description: "",
        sections: [
          {
            key: "s",
            label: "S",
            fields: [
              { key: "a", label: "A", type: "text" },
              { key: "b", label: "B", type: "text", help: "Hint" },
            ],
          },
        ],
      },
    ]);
    const fields = schema.pages[0]!.sections[0]!.fields;
    expect("help" in fields[0]!).toBe(false);
    expect(fields[1]!.help).toBe("Hint");
  });
});

describe("content/schema.json", () => {
  it("is byte-identical to the serialised schema (2-space indent, trailing newline)", () => {
    expect(committed).toBe(serializeSiteSchema());
    expect(committed.endsWith("}\n")).toBe(true);
  });

  it("parses to the same pages as pageSchema.ts", () => {
    const parsed = JSON.parse(committed) as { armatureContract: unknown; pages: unknown };
    expect(parsed.armatureContract).toBe(1);
    expect(parsed.pages).toEqual(ALL_PAGES);
  });
});
