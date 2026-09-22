/**
 * The Armature visual-editing bridge (site contract v1.1), created once for the whole app.
 *
 * `armature-bridge.ts` next to this file is a verbatim copy of `bridge/armature-bridge.ts`
 * from acts2man/armature. Do not edit it; to upgrade, copy the upstream file over it.
 *
 * On a normal visit (and during SSR, where there is no `document`) the bridge is inert:
 * it adds no listeners, no markers and no messages, and every helper simply reads
 * content/pages.json. It wakes up only when all three hold: the page is inside an
 * iframe, the URL carries `?armature=edit`, and the embedding window's origin is in
 * ARMATURE_EDITOR_ORIGINS. That allowlist names the dashboard's exact origin and must
 * never contain `*`.
 */
import { createArmatureBridge, type ContentTree, type SiteSchemaLike } from "./armature-bridge";
import schema from "../../content/schema.json";
import content from "../../content/pages.json";

/** The only origin allowed to embed this site for editing. */
export const ARMATURE_EDITOR_ORIGINS = ["https://armature-sites.netlify.app"];

const EDIT_FLAG = "armature=edit";

let routerNavigate: ((path: string) => void) | null = null;

/**
 * The app root registers the router here so the editor's page switcher moves between
 * pages client-side. Until it does, a full load that keeps the edit flag is used, which
 * is the bridge's own default.
 */
export function registerArmatureNavigate(navigate: (path: string) => void): void {
  routerNavigate = navigate;
}

export const armature = createArmatureBridge({
  allowedOrigins: ARMATURE_EDITOR_ORIGINS,
  schema: schema as SiteSchemaLike,
  content: content as ContentTree,
  navigate: (path) => {
    if (routerNavigate) {
      routerNavigate(path);
      return;
    }
    window.location.assign(`${path}${path.includes("?") ? "&" : "?"}${EDIT_FLAG}`);
  },
});

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
