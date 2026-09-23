/**
 * Tests for the shared content validation — the layer both `bun run check:content`
 * and the publish server function depend on.
 *
 * Run with: bun run test
 */
import { describe, expect, it } from "bun:test";
import {
  LIMITS,
  changedFieldsForPage,
  isAllowedImagePath,
  isAllowedLinkTarget,
  validateContentTree,
  validateFieldUpdate,
} from "@/lib/contentValidation";
import { cloneContent, serializeContent, sortContentKeys } from "@/lib/contentFile";
import liveContent from "../content/pages.json";

const content = () =>
  cloneContent(liveContent) as Record<string, Record<string, Record<string, unknown>>>;

describe("validateContentTree — the check:content rules", () => {
  it("accepts the committed content file with no errors and no warnings", () => {
    const report = validateContentTree(liveContent);
    expect(report.errors).toEqual([]);
    expect(report.warnings).toEqual([]);
    expect(report.checked).toBe(121);
  });

  it("reports a missing field", () => {
    const tree = content();
    delete tree["home"]!["hero"]!["title"];
    const report = validateContentTree(tree);
    expect(report.errors).toContain("home.hero.title: missing from the content file");
  });

  it("reports a link field holding a bare string", () => {
    const tree = content();
    tree["home"]!["hero"]!["cta"] = "/register";
    const report = validateContentTree(tree);
    expect(report.errors.join("\n")).toContain(
      'home.hero.cta: expected { label, href } for type "link", got string',
    );
  });

  it("reports a list item missing a declared key, and warns on an undeclared one", () => {
    const tree = content();
    const nav = tree["shared"]!["header"]!["nav"] as Record<string, string>[];
    delete nav[2]!["href"];
    nav[3]!["extra"] = "x";
    const report = validateContentTree(tree);
    expect(report.errors).toContain('shared.header.nav[2]: missing "href"');
    expect(report.warnings).toContain(
      'shared.header.nav[3]: "extra" is not declared in the schema',
    );
  });

  it("reports a text field holding a number", () => {
    const tree = content();
    tree["contact"]!["seo"]!["title"] = 42;
    const report = validateContentTree(tree);
    expect(report.errors.join("\n")).toContain(
      'contact.seo.title: expected a string for type "text", got number',
    );
  });

  it("rejects a non-object content file", () => {
    expect(validateContentTree("nope").errors.length).toBeGreaterThan(0);
    expect(validateContentTree(null).errors.length).toBeGreaterThan(0);
  });
});

describe("link targets", () => {
  it("allows the safe schemes, site paths and empty", () => {
    for (const value of [
      "",
      "/",
      "/class-registration-page/",
      "https://example.com/x",
      "http://example.com",
      "mailto:someone@example.com",
      "tel:+15551234567",
      "MAILTO:Someone@Example.com",
    ]) {
      expect(isAllowedLinkTarget(value)).toBe(true);
    }
  });

  it("rejects javascript:, data:, protocol-relative and bare words", () => {
    for (const value of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "data:text/html;base64,PHNjcmlwdD4=",
      "//evil.example.com",
      "ftp://example.com",
      "example.com",
    ]) {
      expect(isAllowedLinkTarget(value)).toBe(false);
    }
  });
});

describe("image paths", () => {
  it("allows /assets/ paths and empty", () => {
    expect(isAllowedImagePath("")).toBe(true);
    expect(isAllowedImagePath("/assets/tree.webp")).toBe(true);
    expect(isAllowedImagePath("/assets/uploads/home-1-x.png")).toBe(true);
  });

  it("rejects remote URLs and traversal", () => {
    expect(isAllowedImagePath("https://cdn.example.com/x.png")).toBe(false);
    expect(isAllowedImagePath("/uploads/x.png")).toBe(false);
    expect(isAllowedImagePath("/assets/../../etc/passwd")).toBe(false);
  });
});

describe("validateFieldUpdate", () => {
  it("accepts a normal headline change", () => {
    const { errors } = validateFieldUpdate("home", "hero", "title", "A New Headline");
    expect(errors).toEqual([]);
  });

  it("rejects an unknown field, section and page", () => {
    expect(validateFieldUpdate("home", "hero", "nope", "x").errors.join()).toContain(
      "not a field declared in pageSchema.ts",
    );
    expect(validateFieldUpdate("home", "nope", "title", "x").errors.join()).toContain(
      'is not a section of "home"',
    );
    expect(validateFieldUpdate("nope", "hero", "title", "x").errors.join()).toContain(
      "is not a known page",
    );
  });

  it("rejects the wrong type for a field", () => {
    expect(validateFieldUpdate("home", "hero", "title", 42).errors.length).toBeGreaterThan(0);
    expect(validateFieldUpdate("home", "hero", "cta", "/x").errors.length).toBeGreaterThan(0);
    expect(
      validateFieldUpdate("shared", "header", "nav", "not-a-list").errors.length,
    ).toBeGreaterThan(0);
  });

  it("rejects an unsafe link destination", () => {
    const { errors } = validateFieldUpdate("home", "hero", "cta", {
      label: "Click",
      href: "javascript:alert(1)",
    });
    expect(errors.join()).toContain("must start with https://");
  });

  it("rejects an unsafe url field", () => {
    const { errors } = validateFieldUpdate("shared", "header", "isa_url", "javascript:alert(1)");
    expect(errors.join()).toContain("must start with https://");
  });

  it("rejects an image that is not under /assets/", () => {
    const { errors } = validateFieldUpdate(
      "home",
      "hero",
      "badge",
      "https://cdn.example.com/x.png",
    );
    expect(errors.join()).toContain("images must be a path under /assets/");
  });

  it("enforces length limits", () => {
    expect(
      validateFieldUpdate("home", "hero", "title", "x".repeat(LIMITS.text + 1)).errors.join(),
    ).toContain("too long");
    expect(validateFieldUpdate("home", "hero", "title", "x".repeat(LIMITS.text)).errors).toEqual(
      [],
    );
    expect(
      validateFieldUpdate("home", "hero", "body", "x".repeat(LIMITS.textarea + 1)).errors.join(),
    ).toContain("too long");
  });

  it("rejects an undeclared key inside a list item", () => {
    const { errors } = validateFieldUpdate("shared", "header", "nav", [
      { label: "Home", href: "/", sneaky: "x" },
    ]);
    expect(errors.join()).toContain("unknown fields are not accepted");
  });

  it("validates item field types inside a list", () => {
    const { errors } = validateFieldUpdate("shared", "header", "nav", [
      { label: "Home", href: "javascript:alert(1)" },
    ]);
    expect(errors.join()).toContain("must start with https://");
  });

  it("rejects too many list items", () => {
    const many = Array.from({ length: LIMITS.listItems + 1 }, () => ({ label: "a", href: "/" }));
    expect(validateFieldUpdate("shared", "header", "nav", many).errors.join()).toContain(
      "too many items",
    );
  });

  it("accepts every field of the live content unchanged", () => {
    // Guards against limits or rules that would reject the real site's own content.
    const tree = liveContent as Record<string, Record<string, Record<string, unknown>>>;
    const problems: string[] = [];
    for (const [slug, sections] of Object.entries(tree)) {
      for (const [sectionKey, fields] of Object.entries(sections)) {
        for (const [fieldKey, value] of Object.entries(fields)) {
          const { errors } = validateFieldUpdate(slug, sectionKey, fieldKey, value);
          problems.push(...errors);
        }
      }
    }
    expect(problems).toEqual([]);
  });
});

describe("changedFieldsForPage", () => {
  it("finds nothing when the trees match", () => {
    expect([...changedFieldsForPage("home", liveContent, cloneContent(liveContent))]).toEqual([]);
  });

  it("finds the one field that differs", () => {
    const after = content();
    after["home"]!["hero"]!["title"] = "Different";
    expect([...changedFieldsForPage("home", liveContent, after)]).toEqual(["hero.title"]);
  });

  it("ignores changes on other pages", () => {
    const after = content();
    after["contact"]!["seo"]!["title"] = "Different";
    expect([...changedFieldsForPage("home", liveContent, after)]).toEqual([]);
  });
});

describe("serializeContent", () => {
  it("reproduces the committed file byte for byte", async () => {
    const onDisk = await Bun.file(
      new URL("../content/pages.json", import.meta.url).pathname,
    ).text();
    expect(serializeContent(liveContent)).toBe(onDisk);
  });

  it("sorts object keys but never array order", () => {
    const sorted = sortContentKeys({ b: 1, a: 2, list: [{ z: 1, y: 2 }, "second"] });
    expect(Object.keys(sorted as object)).toEqual(["a", "b", "list"]);
    const list = (sorted as { list: unknown[] }).list;
    expect(Object.keys(list[0] as object)).toEqual(["y", "z"]);
    expect(list[1]).toBe("second");
  });
});
