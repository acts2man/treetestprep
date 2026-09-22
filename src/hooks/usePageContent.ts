import { useSyncExternalStore } from "react";
import { armature, armatureFieldType } from "@/lib/armature";
import type { LinkDefault } from "@/lib/pageDefaults";

export type LinkValue = LinkDefault;

/** Field types whose values are attributes (src, href), never body text, so they are never marked. */
const VALUE_TYPES = new Set(["image", "video", "url"]);

const subscribeToNothing = () => () => {};
const isClient = () => true;
const isServer = () => false;

/**
 * Page copy bound to a single page slug, read straight out of the committed
 * content file (content/pages.json) through the Armature bridge (src/lib/armature.ts).
 * Shared header/footer fields are always available through the "shared" slug.
 *
 * This is a synchronous lookup with no network access, so the values are present
 * during SSR and land in the server-rendered HTML. The reader API — text, link,
 * list, sharedText, sharedLink — and the coercion rules are unchanged; `plain` is
 * the one addition, for values that go into attributes.
 *
 * Visual editing (Armature site contract v1.1): when the site is open inside the
 * Armature editor, `text()`, link labels and the text items of `list()` carry an
 * invisible field marker so the editor can find them on the page, and the component
 * re-renders whenever the editor pushes a draft value. On a normal visit none of
 * that happens: the bridge is inert and these helpers return the committed values
 * unchanged. Markers are only added after hydration, so the server-rendered HTML
 * and the first client render always match.
 *
 * Rules of thumb:
 * - `text()` for anything rendered as text in the body.
 * - `plain()` for anything that ends up in an attribute or in <head>: alt, title,
 *   aria-label, mailto: hrefs. Never put a `text()` value there.
 * - Image, video and url fields are never marked whichever helper reads them; the
 *   editor matches those elements by their src/href value.
 */
export function usePageCopy(pageSlug: string) {
  // Re-renders this component when the editor pushes a draft. Outside edit mode nothing fires.
  const snapshot = useSyncExternalStore(
    armature.subscribe,
    armature.getSnapshot,
    armature.getSnapshot,
  );
  // false on the server and during hydration, true afterwards.
  const hydrated = useSyncExternalStore(subscribeToNothing, isClient, isServer);
  const mark = hydrated && armature.active;

  const raw = (slug: string, section: string, field: string) => snapshot[slug]?.[section]?.[field];

  const readPlain = (slug: string, section: string, field: string) => {
    const value = raw(slug, section, field);
    return typeof value === "string" ? value : "";
  };

  const readText = (slug: string, section: string, field: string) => {
    if (!mark || VALUE_TYPES.has(armatureFieldType(slug, section, field) ?? "")) {
      return readPlain(slug, section, field);
    }
    return armature.text(slug, section, field);
  };

  const readLink = (slug: string, section: string, field: string): LinkValue => {
    const value = mark ? armature.link(slug, section, field) : raw(slug, section, field);
    const base: LinkValue =
      value && typeof value === "object" && !Array.isArray(value)
        ? (value as LinkValue)
        : { label: "", href: "/" };
    return { label: base.label, href: base.href };
  };

  function readList<T extends Record<string, string>>(
    slug: string,
    section: string,
    field: string,
  ): T[] {
    const value = mark ? armature.list(slug, section, field) : raw(slug, section, field);
    return Array.isArray(value) ? (value as T[]) : [];
  }

  return {
    text: (section: string, field: string) => readText(pageSlug, section, field),
    plain: (section: string, field: string) => readPlain(pageSlug, section, field),
    link: (section: string, field: string) => readLink(pageSlug, section, field),
    list: <T extends Record<string, string>>(section: string, field: string) =>
      readList<T>(pageSlug, section, field),
    sharedText: (section: string, field: string) => readText("shared", section, field),
    sharedLink: (section: string, field: string) => readLink("shared", section, field),
  };
}
