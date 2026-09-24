/**
 * The Armature site kit (site contract v2: page builder), created once for the whole app.
 *
 * The `armature-kit/` folder next to this file is a verbatim copy of `kit/` from
 * acts2man/armature. Do not edit it; to upgrade, copy the upstream folder over it.
 *
 * On a normal visit (and during SSR, where there is no `document`) the kit is inert:
 * it adds no listeners, no markers and no messages, and every helper simply reads
 * content/pages.json. It wakes up only when all three hold: the page is inside an
 * iframe, the URL carries `?armature=edit`, and the embedding window's origin is in
 * ARMATURE_EDITOR_ORIGINS. That allowlist names the dashboard's exact origin and must
 * never contain `*`.
 *
 * The kit keeps the whole v1.1 content API (`text`, `plain`, `link`, `image`, `list`,
 * `subscribe`, `getSnapshot`, `active`), so `usePageCopy` in src/hooks/usePageContent.ts
 * keeps working unchanged.
 */
import { createArmatureKit } from "./armature-kit";
import type { ContentTree, LayoutDoc, PostDoc, SiteKit } from "./armature-kit";
import type { SiteSchemaLike } from "./armature-kit/bridge";
import schema from "../../content/schema.json";
import content from "../../content/pages.json";
import siteKit from "../../content/site-kit.json";
import postIndex from "../../content/posts/index.json";

// Every committed layout (coded pages here, plus any page the builder publishes later),
// baked in at build time by Vite so it lands in the server-rendered HTML with no extra
// request. `import.meta.glob` is a Vite macro; under `bun test` (no Vite transform) it is
// undefined, so the guard falls back to no layouts — the tests read the files from disk.
let layoutModules: Record<string, unknown> | LayoutDoc[] = [];
try {
  layoutModules = import.meta.glob("../../content/layouts/*.json", { eager: true });
} catch {
  layoutModules = [];
}

// Blog posts, baked in the same way. The glob also matches content/posts/index.json, which
// is not a post file — the kit skips anything that is not a `kind: "post"` document.
let postModules: Record<string, unknown> | PostDoc[] = [];
try {
  postModules = import.meta.glob("../../content/posts/*.json", { eager: true });
} catch {
  postModules = [];
}

/** The only origin allowed to embed this site for editing. */
export const ARMATURE_EDITOR_ORIGINS = ["https://armature-sites.netlify.app"];

/**
 * Cookie-free visitor stats (kit 2.7). The beacon sends one payload per page view to
 * Armature's `stats-ingest` endpoint; it skips bots, the editor preview, prerendering,
 * Do Not Track and Global Privacy Control, sets no cookies and stores no IP. The endpoint
 * and the site's id come from the Armature dashboard (Site Stats screen) and are set as
 * `VITE_ARMATURE_STATS_ENDPOINT` and `VITE_ARMATURE_STATS_SITE_ID` (Netlify env / .env), so
 * the URL and id are not committed. With either missing the beacon stays off.
 */
const statsEndpoint =
  (typeof import.meta !== "undefined" ? import.meta.env?.["VITE_ARMATURE_STATS_ENDPOINT"] : undefined) ||
  (typeof process !== "undefined" ? process.env?.["VITE_ARMATURE_STATS_ENDPOINT"] : undefined);
const statsSiteId =
  (typeof import.meta !== "undefined" ? import.meta.env?.["VITE_ARMATURE_STATS_SITE_ID"] : undefined) ||
  (typeof process !== "undefined" ? process.env?.["VITE_ARMATURE_STATS_SITE_ID"] : undefined);
const stats = statsEndpoint && statsSiteId ? { endpoint: statsEndpoint, siteId: statsSiteId } : undefined;

const EDIT_FLAG = "armature=edit";

let routerNavigate: ((path: string) => void) | null = null;

/**
 * The app root registers the router here so the editor's page switcher moves between
 * pages client-side. Until it does, a full load that keeps the edit flag is used, which
 * is the kit's own default.
 */
export function registerArmatureNavigate(navigate: (path: string) => void): void {
  routerNavigate = navigate;
}

export const armature = createArmatureKit({
  allowedOrigins: ARMATURE_EDITOR_ORIGINS,
  schema: schema as SiteSchemaLike,
  content: content as ContentTree,
  siteKit: siteKit as SiteKit,
  // Coded pages render their site sections through <ArmatureSlot>; a layout here decides
  // the order and anything the builder puts between them.
  layouts: layoutModules,
  // Blog posts (content/posts/*.json) and the generated index (content/posts/index.json).
  posts: postModules,
  postIndex,
  // Cookie-free visitor stats; off until the endpoint and site id are configured (see above).
  ...(stats ? { stats } : {}),
  navigate: (path) => {
    if (routerNavigate) {
      routerNavigate(path);
      return;
    }
    window.location.assign(`${path}${path.includes("?") ? "&" : "?"}${EDIT_FLAG}`);
  },
});

// Re-exported from the kit so nothing else in the site imports the kit folder directly.
export { stegaClean, hasStega, PROTOCOL_VERSION } from "./armature-kit/bridge";
export { KIT_VERSION } from "./armature-kit";

export type ArmatureFieldType =
  SiteSchemaLike["pages"][number]["sections"][number]["fields"][number]["type"];

const FIELD_TYPES = new Map<string, ArmatureFieldType>();
for (const page of (schema as SiteSchemaLike).pages) {
  for (const section of page.sections) {
    for (const field of section.fields) {
      FIELD_TYPES.set(`${page.slug}.${section.key}.${field.key}`, field.type);
    }
  }
}

/** The schema type of a field, so the content hook knows which values may carry a marker. */
export function armatureFieldType(
  slug: string,
  section: string,
  field: string,
): ArmatureFieldType | undefined {
  return FIELD_TYPES.get(`${slug}.${section}.${field}`);
}
