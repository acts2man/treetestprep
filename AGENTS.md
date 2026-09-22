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

### Armature visual editing (site contract v1.1)

`src/lib/armature-bridge.ts` is a **verbatim copy** of `bridge/armature-bridge.ts` from
[acts2man/armature](https://github.com/acts2man/armature). **Do not edit, reformat, lint-fix
or remove it.** It is what lets the Armature dashboard open this site in a frame and edit it
in place. To upgrade it, copy the upstream file over it unchanged. (Two tsconfig flags,
`noPropertyAccessFromIndexSignature` and `exactOptionalPropertyTypes`, are off for that
reason; do not turn them back on without re-checking the bridge compiles.)

Around it:

- `src/lib/armature.ts` creates the bridge once, with the allowlist
  `["https://armature-sites.netlify.app"]`. Never widen it and never put `*` in it.
- `usePageCopy` reads everything through the bridge. `text()`, link labels and the text
  items of `list()` carry an invisible marker **only** inside the editor; on a normal visit
  (and in the server-rendered HTML) they are the committed values, unchanged. Use `plain()`
  for anything that goes into an attribute or `<head>` (alt, title, aria-label, mailto:
  hrefs); never put a `text()` value there.
- `data-armature-field="slug.section.field"` maps an element by hand where the marker
  cannot reach (a CSS background image, text assembled from several fields). Keep the ones
  that exist (`InnerHero`'s `imageField`, the exam note on the home page).
- `netlify.toml` and `src/server.ts` send `Content-Security-Policy: frame-ancestors 'self'
  https://armature-sites.netlify.app`. Never add `X-Frame-Options`.
- Every public page keeps a `path` in `src/lib/pageSchema.ts` that matches its route; the
  editor's page switcher relies on it.
