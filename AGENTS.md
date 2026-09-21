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
