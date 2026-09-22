/**
 * The Armature visual-editing wiring (site contract v1.1). The bridge itself is tested
 * upstream in acts2man/armature; these tests pin how this site uses it.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { hasStega, PROTOCOL_VERSION, BRIDGE_VERSION } from "../src/lib/armature-bridge";
import { ARMATURE_EDITOR_ORIGINS, armature, armatureFieldType } from "../src/lib/armature";
import { ALL_PAGES } from "../src/lib/pageSchema";
import content from "../content/pages.json";

describe("bridge configuration", () => {
  test("the allowlist is exactly the dashboard origin", () => {
    expect(ARMATURE_EDITOR_ORIGINS).toEqual(["https://armature-sites.netlify.app"]);
    expect(ARMATURE_EDITOR_ORIGINS.some((origin) => origin.includes("*"))).toBe(false);
  });

  test("speaks protocol 1", () => {
    expect(PROTOCOL_VERSION).toBe(1);
    expect(BRIDGE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("is inert outside a browser and returns the committed values unmarked", () => {
    expect(armature.active).toBe(false);
    const title = armature.text("home", "hero", "title");
    expect(title).toBe((content as { home: { hero: { title: string } } }).home.hero.title);
    expect(hasStega(title)).toBe(false);
    expect(hasStega(armature.link("home", "hero", "cta").label)).toBe(false);
    expect(
      armature.list("home", "faq", "items").every((item) => !hasStega(item.question ?? "")),
    ).toBe(true);
    expect(armature.getSnapshot()).toEqual(content);
  });
});

describe("field types", () => {
  test("every field in pageSchema.ts has a known type", () => {
    for (const page of ALL_PAGES) {
      for (const section of page.sections) {
        for (const field of section.fields) {
          expect(armatureFieldType(page.slug, section.key, field.key)).toBe(field.type);
        }
      }
    }
    expect(armatureFieldType("home", "hero", "no_such_field")).toBeUndefined();
  });

  test("every public page has a route path the editor can load", () => {
    const routes = new Set(
      readFileSync("src/routeTree.gen.ts", "utf8")
        .match(/fullPath: '[^']*'/g)
        ?.map((m) => m.slice("fullPath: '".length, -1).replace(/\/+$/, "") || "/") ?? [],
    );
    for (const page of ALL_PAGES) {
      expect(page.path.startsWith("/")).toBe(true);
      expect(routes.has(page.path.replace(/\/+$/, "") || "/")).toBe(true);
    }
  });
});

describe("hand-mapped fields", () => {
  test("every data-armature-field / imageField path names a real field", () => {
    const sources = [
      "src/components/SiteChrome.tsx",
      "src/pages/Home.tsx",
      "src/pages/Contact.tsx",
      "src/pages/ExamInformation.tsx",
      "src/pages/Inspiration.tsx",
      "src/pages/Instructors.tsx",
    ];
    const paths = sources
      .flatMap(
        (file) =>
          readFileSync(file, "utf8").match(/(?:data-armature-field|imageField)="([^"]+)"/g) ?? [],
      )
      .map((m) => m.split('"')[1] ?? "");
    expect(paths.length).toBeGreaterThan(0);
    for (const path of paths) {
      const [slug, section, field] = path.split(".");
      expect(armatureFieldType(slug ?? "", section ?? "", field ?? "")).toBeDefined();
    }
  });
});

describe("framing", () => {
  test("netlify.toml allows the dashboard as a frame ancestor and never sends X-Frame-Options", () => {
    const toml = readFileSync("netlify.toml", "utf8");
    expect(toml).toContain("frame-ancestors 'self' https://armature-sites.netlify.app");
    // A header line, not the comment that mentions the rule.
    expect(toml).not.toMatch(/^\s*X-Frame-Options\s*=/im);
    expect(readFileSync("src/server.ts", "utf8")).not.toMatch(/["'`]x-frame-options["'`]/i);
    expect(existsSync("public/_headers")).toBe(false);
  });
});
