<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Content editing

`content/pages.json` and `public/assets/uploads/` are **written by the admin Publish
button** at `/admin/pages/:slug/`, which commits them straight to this repository
through the GitHub API. Treat them as live data, not as source you own:

- **Do not reformat, regenerate, reorder or "tidy" `content/pages.json`.** It is
  written in a canonical form (object keys alphabetical at every depth, arrays left in
  their own order, 2-space indent, trailing newline) by `serializeContent()` in
  `src/lib/contentFile.ts`. Anything that rewrites it differently will collide with the
  next publish and can silently revert a client's edits. If you must regenerate it, use
  `bun run export:defaults`, which uses the same serializer.
- **Do not delete or rename anything in `public/assets/uploads/`.** Those files are
  referenced by `content/pages.json` and were uploaded by the site owner.
- **Never hand-edit the content file to "fix" copy** when the change belongs to the
  owner. Publishing through the dashboard keeps the audit trail in `git log`.
- **Validate before committing** any change you do make to it: `bun run check:content`.

Code changes must keep `usePageCopy`'s API intact — `text`, `link`, `list`,
`sharedText` and `sharedLink`, in `src/hooks/usePageContent.ts`. Every public page and
`SiteChrome.tsx` reads content through it, and the admin editor writes against the same
field registry in `src/lib/pageSchema.ts`. If a field is added to the schema it needs a
value in `content/pages.json`, or `check:content` fails.

Run `bun run test` after touching anything under `src/lib/content*`, `src/lib/github.server.ts`
or `src/lib/publish.server.ts`.

### Armature site kit (site contract v2: page builder)

**The public pages are builder-native.** Every page's hero, prose, images, buttons, lists,
video and FAQ live as builder elements (containers + widgets) in `content/layouts/<slug>.json`,
not as hand-coded React. **Add new page content as builder elements in `content/layouts`
(through the Armature editor / dashboard), never as a new `registerSiteSection()` coded
section.** The public site renders the layouts through `<ArmatureSlot>`; the coded page
components are now just `SiteHeader` + `<ArmatureSlot slug=… defaults={[]} />` + `SiteFooter`.
The header and footer stay hand-coded. The one remaining registered site section is the
instructor list on `/meet-your-instructors` (`instructors`), because it renders a live
Supabase query that no static widget can bind to; it is placed in its layout as a
`site-section` element. `content/schema.json` / `content/pages.json` now hold only each
page's SEO fields plus the shared header/footer and the instructor-intro copy.

`src/lib/armature-kit/` is a **verbatim copy** of the `kit/` folder from
[acts2man/armature](https://github.com/acts2man/armature) (`KIT_VERSION` 2.2.0), copied
whole, including its `README.md`; upstream ships no unit test inside `kit/`. **AI builders
must not edit, reformat, lint-fix, remove or restructure it.** It is what lets the Armature
dashboard open this site in a frame and build it in place (drag widgets, reorder sections,
publish layouts). To upgrade it, copy the upstream folder over it unchanged. (Two tsconfig
flags, `noPropertyAccessFromIndexSignature` and `exactOptionalPropertyTypes`, are off for
that reason; do not turn them back on without re-checking the kit compiles.)

`content/layouts/` and `content/site-kit.json` are **written by the Armature page builder**
(committed through the dashboard, like `content/pages.json`). **AI builders must not edit,
remove, restructure or hand-format them.** `content/layouts/<slug>.json` is one layout per
page (element order and anything the builder places between the site sections);
`content/site-kit.json` holds the global colours, fonts, typography, button presets and
container defaults new builder elements inherit. Treat both as live data, not source.

Around it:

- `src/lib/armature.ts` creates the kit once with `createArmatureKit({...})`, with the
  allowlist `["https://armature-sites.netlify.app"]`. Never widen it and never put `*` in
  it. It re-exports the v1.1 content API and `stegaClean`/`hasStega`.
- `usePageCopy` reads everything through the kit (unchanged API: `text`, `plain`, `link`,
  `list`, `sharedText`, `sharedLink`). `text()`, link labels and the text items of `list()`
  carry an invisible marker **only** inside the editor; on a normal visit (and in the
  server-rendered HTML) they are the committed values, unchanged. Use `plain()` for anything
  that goes into an attribute or `<head>` (alt, title, aria-label, mailto: hrefs); never put
  a `text()` value there.
- **Every hand-coded section must be registered with `armature.registerSiteSection(key,
  { label, component, repeatable? })`** (unique key across the site) and rendered through
  `<ArmatureSlot slug=... defaults={[...]} />`, so the builder can place, move, hide or wrap
  it. Mark a section `repeatable` only if it can safely render twice (no fixed element ids,
  no page-singleton content). Mark the header and footer with `data-armature-chrome` and a
  page's visible title with `data-armature-page-title`.
- `<ArmatureRoute fallback={<NotFound />} />` in `src/routes/$.tsx` serves builder-only
  pages by path before the 404; keep it after every hand-coded route.
- `data-armature-field="slug.section.field"` maps an element by hand where the marker
  cannot reach (a CSS background image, text assembled from several fields). Keep the ones
  that exist (`InnerHero`'s `imageField`, the exam note on the home page).
- `netlify.toml` and `src/server.ts` send `Content-Security-Policy: frame-ancestors 'self'
  https://armature-sites.netlify.app`. Never add `X-Frame-Options`.
- Every public page keeps a `path` in `src/lib/pageSchema.ts` that matches its route; the
  editor's page switcher relies on it.
