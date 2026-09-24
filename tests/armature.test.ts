/**
 * The Armature site-kit wiring (site contract v2: page builder). The kit itself is tested
 * upstream in acts2man/armature; these tests pin how this site uses it.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import {
  ARMATURE_EDITOR_ORIGINS,
  armature,
  armatureFieldType,
  hasStega,
  KIT_VERSION,
  PROTOCOL_VERSION,
} from "../src/lib/armature";
import { isChromeSlug } from "../src/lib/armature-kit";
import { ALL_PAGES } from "../src/lib/pageSchema";
import content from "../content/pages.json";

describe("kit configuration", () => {
  test("the allowlist is exactly the dashboard origin", () => {
    expect(ARMATURE_EDITOR_ORIGINS).toEqual(["https://armature-sites.netlify.app"]);
    expect(ARMATURE_EDITOR_ORIGINS.some((origin) => origin.includes("*"))).toBe(false);
  });

  test("speaks protocol 2 (page builder)", () => {
    expect(PROTOCOL_VERSION).toBe(2);
    expect(KIT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("is inert outside a browser and returns the committed values unmarked", () => {
    expect(armature.active).toBe(false);
    const title = armature.text("home", "seo", "title");
    expect(title).toBe((content as { home: { seo: { title: string } } }).home.seo.title);
    expect(hasStega(title)).toBe(false);
    expect(hasStega(armature.link("shared", "footer", "cta").label)).toBe(false);
    expect(
      armature.list("shared", "header", "nav").every((item) => !hasStega(item.label ?? "")),
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
    expect(armatureFieldType("home", "seo", "no_such_field")).toBeUndefined();
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

describe("page-builder layouts (site contract v2)", () => {
  const codedSlugs = new Set(ALL_PAGES.map((page) => page.slug));

  test("every coded page (except the shared header/footer) has a builder-native layout", () => {
    type El = { type: string; id: string; props: Record<string, unknown>; children?: El[] };
    const walk = (elements: El[]) => {
      for (const element of elements) {
        expect(typeof element.type).toBe("string");
        expect(element.type.length).toBeGreaterThan(0);
        expect(element.id).toMatch(/^[a-z0-9]{8}$/);
        // A section that stays hand-coded still carries a string section key.
        if (element.type === "site-section") expect(typeof element.props.key).toBe("string");
        if (element.children) walk(element.children);
      }
    };
    for (const page of ALL_PAGES) {
      if (page.slug === "shared") continue;
      const file = `content/layouts/${page.slug}.json`;
      expect(existsSync(file)).toBe(true);
      const layout = JSON.parse(readFileSync(file, "utf8")) as {
        version: number;
        pageSlug: string;
        path: string;
        root: El[];
      };
      expect(layout.version).toBe(1);
      expect(layout.pageSlug).toBe(page.slug);
      expect(layout.path.replace(/\/+$/, "") || "/").toBe(page.path.replace(/\/+$/, "") || "/");
      expect(layout.root.length).toBeGreaterThan(0);
      walk(layout.root);
    }
  });

  test("layout files only exist for coded pages or the header/footer parts (no orphan builder pages committed)", () => {
    for (const file of readdirSync("content/layouts").filter((f) => f.endsWith(".json"))) {
      const slug = file.replace(/\.json$/, "");
      // A layout is legitimate when it belongs to a coded page, or when it is one of the
      // builder chrome parts (content/layouts/_header.json, _footer.json).
      expect(codedSlugs.has(slug) || isChromeSlug(slug)).toBe(true);
    }
  });

  test("content/site-kit.json is present and declares version 1", () => {
    const kit = JSON.parse(readFileSync("content/site-kit.json", "utf8")) as { version: number };
    expect(kit.version).toBe(1);
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
