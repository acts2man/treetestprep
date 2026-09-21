# Armature Step 2 — Git-First Content, Proven

Second stage of the **Armature** pilot on `treetestprep` (Armature = a WordPress-style
editing dashboard for AI-built React sites). Step 1 was `ARMATURE_RECON.md` on the
`armature/recon` branch, which surveyed the repo and concluded the git-first content model
was viable here. This branch implements it and measures the result.

- **Repo:** `acts2man/treetestprep`
- **Branch:** `armature/git-content`, branched from `main` at `f0e9c54`
- **Date:** 2026-09-21
- **Source of truth for the plan:** `ARMATURE_RECON.md` (branch `armature/recon`)
- **Not done here:** no pull request, no merge to `main`, no force-push, no history rewrite.

---

## Summary

**In plain English:** the website's words now live in one ordinary file in the repository —
`content/pages.json` — instead of being split between hard-coded TypeScript and a database
the browser had to phone home for. Edit that file, rebuild, and the new words are in the
page that the server sends. Nothing about how the site looks or reads has changed.

**What this proves.** Before this branch, if the owner edited a headline through `/admin`,
the edit was saved to the database but the _server-rendered page still contained the old
headline_. Google, Facebook's link previewer, and anything that doesn't run JavaScript saw
the old text permanently; a human visitor saw the old text painted first and then swapped
out. That is the defect the recon called the "content flash", and it made the existing
editor unsafe to hand to a client.

Moving the content into a committed file fixes it at the root. The file is compiled into
the server bundle, so the content is already in hand when the HTML is generated. There is
no fetch to wait for, no flash, and nothing invisible to crawlers. The proof is in §9b: the
hero headline was changed in the JSON, the site rebuilt, and the new text was confirmed
present in the raw HTML with JavaScript never executed — `<h1 id="hero-title">ARMATURE
TEST</h1>`.

**What changed, in one line each:**

| #   | Change                                                  | Effect                                                                                                   |
| --- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1   | Regenerated `bun.lock` against the public npm registry  | `bun install` works outside Lovable's sandbox — the recon's "single biggest portability blocker" is gone |
| 2   | Added `content/pages.json` (8 pages, 126 fields)        | The content of record is now data, not code                                                              |
| 3   | `pageDefaults.ts` became a typed adapter over that JSON | Every existing importer keeps working, unchanged                                                         |
| 4   | `usePageCopy` became a synchronous lookup               | Content is server-rendered; the database read is gone                                                    |
| 5   | `buildHead` reads SEO from the content file             | Seven server-function round trips per navigation removed                                                 |
| 6   | Added `bun run check:content`                           | Restores the safety that was lost moving from TypeScript to JSON                                         |

**What it cost.** Nothing visible. All 7 public pages were captured as raw HTML before and
after; the visible text is **byte-for-byte identical** on every one, and so are all 17
`<title>`/`<meta>`/`<link>` tags per page. The only difference in the entire HTML output,
after normalising asset hashes and timestamps, is 12 bytes per page: `,l:$R[13]={}`, the
now-empty loader payload that the deleted SEO server function used to contribute.

**What is deliberately still missing.** The admin page editor at `/admin/pages/:slug/` is
untouched, and it still writes to the `page_content_overrides` table — which nothing reads
on this branch. **Until the publish function is built, edits made through `/admin` have no
effect on the site.** That is the next step, and it is the main open item below.

---

## Step-by-step detail

### 1. Lockfile portability

The committed `bun.lock` pinned all **624** dependency tarballs to Lovable's private
Artifact Registry mirror (`europe-west1-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache`),
which returns HTTP 403 from anywhere else. `bun install` failed outright off-sandbox, and
passing `--registry` did not help, because the lockfile's resolved tarball URLs win over
the registry setting.

`bun.lock` was deleted and dependencies reinstalled from `https://registry.npmjs.org`.

| Metric                                        | Before    | After     |
| --------------------------------------------- | --------- | --------- |
| `europe-west1-npm.pkg.dev` URLs in `bun.lock` | 624       | **0**     |
| Hard-coded registry hosts of any kind         | 624       | **0**     |
| Lockfile size                                 | 356,496 B | 278,268 B |

The regenerated text lockfile records versions and integrity hashes without naming a
registry host at all, so it resolves against whatever registry is configured — which is
strictly more portable than what it replaced. `bunfig.toml` was **not** touched: the 24-hour
`minimumReleaseAge` supply-chain guard and its four-package allow-list still apply, and were
in force during this install.

**Verified from a genuinely clean checkout.** A fresh `git clone` of the branch into a
scratch directory, with `node_modules` absent and `BUN_INSTALL_CACHE_DIR` pointed at an
empty directory to force real network fetches:

| Step    | Command                              | Result                                           |
| ------- | ------------------------------------ | ------------------------------------------------ |
| Install | `bun install` (cold cache, no flags) | **OK** — 925 packages, 3.32 s                    |
| Build   | `NETLIFY=true bun run build`         | **OK**, exit 0 — `✓ built in 801ms`, 5.45 s wall |

`dist/client`, `dist/server` and `.netlify/v1/functions/server.mjs` were all produced as the
recon describes. Committed on its own commit, `b96b1f5`.

> Caveat, stated plainly: package versions are now the newest matching the `package.json`
> ranges, not the exact versions the old lockfile pinned. The build and all 7 pages were
> verified against these versions, but this is not a byte-for-byte reproduction of whatever
> Lovable's own sandbox resolves.

### 2. Baseline capture

Before any content code was touched, the site was built in Netlify mode and served with
`bun run preview --host 127.0.0.1` (the recon's finding that preview only works after a
`NETLIFY=true` build, and that the default `::` bind fails in this sandbox, both held).

All 7 public routes were fetched with `curl` — no JavaScript executed — and saved outside
the repo, to the session scratch directory:

| Route                       | File                    | Status | Bytes  |
| --------------------------- | ----------------------- | ------ | ------ |
| `/`                         | `home.html`             | 200    | 13,623 |
| `/events/location/`         | `course-overview.html`  | 200    | 14,521 |
| `/exam-information/`        | `exam-information.html` | 200    | 11,203 |
| `/about-us/`                | `inspiration.html`      | 200    | 10,806 |
| `/meet-your-instructors/`   | `instructors.html`      | 200    | 9,665  |
| `/contact-us/`              | `contact.html`          | 200    | 9,536  |
| `/class-registration-page/` | `registration.html`     | 200    | 10,713 |

`/` at 13,623 bytes and `/meet-your-instructors/` at 9,665 bytes match the recon's measured
figures exactly, which confirms the baseline is the same site the recon surveyed.

### 3. `content/pages.json`

Generated by `scripts/export-defaults.ts` (run with `bun run export:defaults`). The shape is
exactly today's `PAGE_DEFAULTS` serialised:
`{ [slug]: { [section]: { [field]: string | {label,href} | Array<Record<string,string>> } } }`.

- **Stable key order:** object keys are written alphabetically at every depth, so the file is
  byte-stable no matter who or what produced it — which matters once a publish function is
  writing it programmatically. Array order is left alone, because lists (navigation, FAQ
  items, course weeks) are ordered content and sorting them would scramble the site.
- **2-space indent**, trailing newline. Prettier reports the file as already formatted.
- **Verified:** the script writes the file, reads it back, parses it, and deep-compares it
  against `PAGE_DEFAULTS` with an order-insensitive structural equality. It exits non-zero if
  they differ. Result: **8 pages, 126 fields, deep-equal confirmed.** 126 matches the recon's
  independently measured field count.
- **Idempotent:** re-running the exporter after step 4 (when it reads through the adapter)
  produces a byte-identical file, confirmed with `diff`.

### 4. `src/lib/pageDefaults.ts` as a typed adapter

Reduced from 368 lines to 28. It imports `content/pages.json` and re-exports it as
`PAGE_DEFAULTS` with the identical type, and keeps the `LinkDefault` / `DefaultValue` types
and the `defaultValue(slug, section, field)` helper. No importer changed.

`resolveJsonModule: true` was added to `tsconfig.json`. Vite imports JSON natively and does
not need it, but `tsc --noEmit` does — and `tsc --noEmit` passed cleanly on `main`, so it
still passes cleanly here. This is the only `tsconfig.json` change.

### 5. `usePageCopy` — synchronous, same API

`src/hooks/usePageContent.ts` went from 97 lines to 47. The `useQuery`, the Supabase import,
the row `Map`, the `rowFor` lookup and `isLoading` are all gone.

The public API is unchanged — `text`, `link`, `list`, `sharedText`, `sharedLink` — and so
are the coercion rules:

| Reader | Rule, before and after                                                            |
| ------ | --------------------------------------------------------------------------------- |
| `text` | `typeof fallback === "string" ? fallback : ""`                                    |
| `link` | `{label, href}` if the value is a non-array object, else `{label: "", href: "/"}` |
| `list` | `Array.isArray(fallback) ? fallback : []`                                         |

With no override rows in play, the old code fell through to exactly these expressions, so
the values are identical by construction — and §9a confirms it empirically.

Not one line changed in the seven page components or `SiteChrome.tsx`, as required.

`usePageContent` and the `OverrideRow` type were removed: `usePageCopy` was their only
consumer. `admin.pages.$slug.tsx` declares its own local `OverrideRow` and is unaffected.
`LinkValue` is kept and still exported.

**Measured effect on the shipped bundle:**

|                                                    | Baseline         | After                   |
| -------------------------------------------------- | ---------------- | ----------------------- |
| Main client chunk                                  | 578.50 kB        | 573.52 kB               |
| Total client JS                                    | 896.04 kB        | 890.27 kB               |
| Client chunks referencing `page_content_overrides` | all public pages | **2 — both admin-only** |

The public pages no longer contain the table name at all; the only remaining references are
in the admin dashboard chunks, which is correct.

### 6. SEO from the content file

- `buildHead(slug, path)` now reads `title`, `description` and `image` straight from the
  content file. The third `overrides` parameter is gone.
- The `getPageSeo` loader was removed from all 7 public routes, which now read
  `head: () => buildHead("home", "/")` and so on. `errorComponent` and `notFoundComponent`
  are untouched, so the resilience property the recon liked is preserved — and is now
  stronger, since there is no fetch left to fail.
- `SITE` moved out of `pageHead.ts` into a new `src/lib/siteConfig.ts`, **at its current
  value** (`https://treetestprep.lovable.app`). The domain decision comes later; see open
  issues.
- `src/lib/pageSeo.functions.ts` was **deleted**. Once the loaders were gone nothing imported
  it. This also removed the build's `createServerFn().inputValidator() is deprecated`
  warning, which no longer appears. **This deletion was not explicitly requested** — the
  instruction was to remove the loaders — so if a no-op stub is preferred over a deletion,
  say so and it is a one-file revert.

Removing the loaders also drops seven server-function round trips per navigation.

### 7. `bun run check:content`

`scripts/check-content.ts` validates `content/pages.json` against the field registry in
`pageSchema.ts`. This replaces the compile-time safety lost by moving content out of
TypeScript: a typo in `pageDefaults.ts` could fail the build, a typo in JSON cannot.

It **fails (exit 1)** when a schema-declared field is missing, or has the wrong shape:

| Declared type                               | Required shape                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| `text`, `textarea`, `image`, `video`, `url` | a string                                                                  |
| `link`                                      | an object with `label` and `href`, both strings                           |
| `list`                                      | an array of objects, each carrying every declared `itemField` as a string |

Content present in the JSON but **not** declared in the schema is reported as a _warning_,
not a failure — it renders fine, but the admin editor cannot reach it, so it is worth
surfacing without breaking anything.

Current result: `OK: all 126 schema fields present and well-shaped in content/pages.json` —
0 errors, 0 warnings, confirming the perfect 1:1 the recon reported.

Because a checker that never fires is worthless, it was tested against four deliberately
broken copies of the file. Each exited 1 with a located message, and the file was restored
byte-identically afterwards:

| Injected fault                                                   | Reported                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------ |
| deleted `home.hero.title`                                        | `home.hero.title: missing from content/pages.json`     |
| `home.hero.cta` set to a bare string                             | `expected { label, href } for type "link", got string` |
| `shared.header.nav[2].href` deleted, stray key added to `nav[3]` | `nav[2]: missing "href"` + warning on the stray key    |
| `contact.hero.title` set to `42`                                 | `expected a string for type "text", got number`        |

Added as `bun run check:content`. **Deliberately not wired into the build**, as instructed —
`"build": "vite build"` is unchanged.

`bun run export:defaults` was added alongside it for regenerating/normalising the JSON.

### 8. Admin editor — unchanged, and currently inert

`src/routes/admin.pages.$slug.tsx` was **not modified**, as instructed.

It still upserts each edited field into the Supabase `page_content_overrides` table, and
still deletes the row on Reset. **On this branch nothing reads that table.** So an edit made
through `/admin/pages/:slug/` will save successfully, report success, and have no effect on
the website whatsoever.

This is expected at this stage, but it is a trap if anyone uses the dashboard before the
next step lands. The publish function — `is_staff` auth check, validate the payload against
`pageSchema.ts`, then commit `content/pages.json` through the GitHub Contents API with `sha`
conflict handling — is the next piece of work, together with changing the editor from
per-field Save to a single "Publish changes" action so one editing session is one commit and
one build.

The owner has confirmed nobody has ever edited content through `/admin`, so there are no
real rows in `page_content_overrides` to migrate. That confirmation is what makes this
branch safe: the defaults in `PAGE_DEFAULTS` _were_ the live content, and they are now
`content/pages.json` verbatim.

### 9. Verification

#### 9a. Rebuild and compare against the baseline

Rebuilt in Netlify mode, preview served, all 7 routes fetched with `curl` again and compared
to the step-2 baseline.

**Visible text: identical on all 7 routes.** Extracted by stripping `<head>`, `<script>` and
`<style>` blocks and all tags, then unescaping entities — `diff` reports no differences:

| Route                       | Visible text lines | Result    |
| --------------------------- | ------------------ | --------- |
| `/`                         | 72                 | identical |
| `/events/location/`         | 117                | identical |
| `/exam-information/`        | 57                 | identical |
| `/about-us/`                | 45                 | identical |
| `/meet-your-instructors/`   | 41                 | identical |
| `/contact-us/`              | 41                 | identical |
| `/class-registration-page/` | 49                 | identical |

**Head metadata: identical on all 7 routes** — 17 `<title>`/`<meta>`/`<link>` tags each,
including `title`, `description`, all `og:*`, all `twitter:*`, `canonical` and `robots`.
This is the important one: it means removing the SEO server function changed no output.

**Whole-file diff.** After normalising asset hashes (`/assets/name-HASH.js`) and the router's
embedded timestamps, exactly 2 lines differ per page, and **both are the router hydration
payload** — 0 differing lines anywhere else. Every page shrank by exactly 12 bytes, which is
the length of the removed `,l:$R[13]={}` — the empty `loaderData` object that `getPageSeo`
used to return. That single substitution accounts for the entire byte difference across all
seven pages.

So: identical except for asset hashes, plus one 12-byte removal that is a direct and
intended consequence of deleting the SEO loader. **No visible difference of any kind.**

#### 9b. Proof that an edit reaches the server-rendered page

1. `home.hero.title` changed in `content/pages.json` from `"Become An ISA Certified
Arborist"` to `"ARMATURE TEST"`.
2. `NETLIFY=true bun run build`, preview served, `/` fetched with `curl` — no JavaScript.
3. Raw HTML contained **`<h1 id="hero-title">ARMATURE TEST</h1>`**. Occurrences of
   `ARMATURE TEST`: 1. Occurrences of the old title: **0** — it was gone, not merely
   overlaid.
4. Only `/` changed size (13,611 → 13,592 bytes); the other six routes were byte-identical,
   as expected for a change to one home-page field.
5. Reverted and rebuilt. `content/pages.json` restored byte-identically (`diff -q` clean),
   all 7 routes back to their exact post-change byte counts, visible text identical to the
   original step-2 baseline again, and `ARMATURE` appears in **0** files in `dist/`, `src/`,
   `content/` and `scripts/`.

This is the whole thesis of the git-first model demonstrated end to end: a content edit is a
file edit, and it lands in the HTML the server sends, visible to crawlers and present on
first paint.

#### 9c. Checks

| Command                 | Result                                             |
| ----------------------- | -------------------------------------------------- |
| `bun run check:content` | **PASS** — 126/126 fields, 0 warnings              |
| `bunx tsc --noEmit`     | **PASS** — clean, same as `main`                   |
| `bun run lint`          | **FAILS — but it also fails on `main`.** See below |

`bun run lint` is red on this repo before any of this work: `main` reports **524 problems
(517 errors, 7 warnings)**, almost all pre-existing Prettier formatting violations in the
admin screens. This branch reports **503 problems (496 errors, 7 warnings)** — 21 fewer,
because the files this branch rewrote or deleted took their violations with them.

Linting only the files this branch adds or changes reports **0 problems**. All new and
modified files were run through Prettier. No pre-existing lint error was fixed, because
`prettier --write .` across the repo would have buried this diff in hundreds of unrelated
reformatting changes; that cleanup belongs in its own commit.

---

## Open issues

Ordered roughly by how much they matter.

1. **The admin editor is inert until the publish function exists.** `/admin/pages/:slug/`
   writes to `page_content_overrides`; nothing reads it. Edits will appear to save and will
   do nothing. This is the single most important follow-up: build the publish server function
   (`is_staff` check → validate against `pageSchema.ts` → commit `content/pages.json` via the
   GitHub Contents API with `sha` conflict handling) and switch the editor from per-field
   Save to one "Publish changes" action.
2. **Lovable sync policy is still unsettled.** `AGENTS.md` warns that commits to the
   connected branch sync back into the Lovable editor. Once a client's Publish button creates
   a commit, a publish can race a Lovable generation on the same branch. Decide this before
   any client touches the dashboard: publish to a dedicated content branch merged (never
   rebased) into `main`, or tell Lovable via project knowledge never to touch
   `content/pages.json`. Test a deliberate concurrent edit before shipping.
3. **`.env` is committed to the repository.** `git ls-files .env` returns it. It holds six
   Supabase keys — per the recon, publishable/anon only, no service-role key, so this is not
   an immediate breach. It should still be untracked and moved to Netlify environment
   variables, and the keys rotated as a precaution. Not fixed here because removing a tracked
   file from a Lovable-synced branch has consequences worth deciding deliberately.
4. **`src/lib/pageSeo.functions.ts` was deleted, which was not explicitly requested.** The
   instruction was to remove the loaders from the 7 routes; that left the module unimported,
   and deleting it also cleared the deprecated-`inputValidator` build warning. If a no-op
   stub returning `{}` is preferred, it is a one-file revert.
5. **The canonical domain is still `treetestprep.lovable.app`.** `SITE` now lives in
   `src/lib/siteConfig.ts` at its existing value, so it is one edit away from being correct —
   but `public/sitemap.xml`, `public/robots.txt` and the JSON-LD in `src/routes/__root.tsx`
   hard-code the same domain and must change together. The recon rates this the
   highest-impact SEO defect on the live site.
6. **`check:content` is not enforced anywhere.** It is not wired into the build, as
   instructed. Until it is — or until the publish function validates before committing — a
   malformed `content/pages.json` reaches production and renders empty strings rather than
   failing loudly.
7. **`page_content_overrides` can now lose its public grant.** It is `GRANT SELECT … TO anon`
   with `USING (true)`, which was necessary only because the browser read it. Nothing public
   reads it on this branch, so the anon grant should be revoked in a migration once the
   publish function lands.
8. **Instructor bios and photos are still outside this system.** `/meet-your-instructors/`
   still reads the Supabase `instructors` table client-side, so the roster is still missing
   from the server-rendered HTML — a non-JS crawler sees an empty list. This branch did not
   change that, and it is now the _only_ remaining client-fetched public content. Folding it
   into `pageSchema.ts` as a `list` field would close the gap.
9. **Image uploads still go to Supabase Storage.** The editor writes `site-media` public URLs
   into the database. Under git-first, uploads need to land in `public/assets/` and be
   committed alongside the JSON, or media and copy will publish through two different systems.
10. **Package versions drifted with the lockfile regeneration.** Dependencies are now the
    newest matching the `package.json` ranges rather than Lovable's pinned resolutions. All 7
    pages were verified against these versions, but the first Netlify deploy from this branch
    is the real test.
11. **Repo-wide lint remains red** (503 problems, pre-existing). Worth a dedicated
    `prettier --write .` commit, kept separate so it never obscures a content or logic diff.
12. **Rebuild latency is now the publish latency.** The build itself is ~0.8 s, but a real
    publish is Netlify queue + install + build + deploy, realistically 1–3 minutes. The
    dashboard will need an in-editor preview reading the local draft, plus honest build
    status, or "I published and nothing happened" becomes the top support ticket.

---

## Commits on `armature/git-content`

| Commit    | Subject                                                               |
| --------- | --------------------------------------------------------------------- |
| `b96b1f5` | Regenerate bun.lock against the public npm registry                   |
| `303326b` | Move page content into content/pages.json                             |
| `42cd445` | Read page copy synchronously from the committed content               |
| `7ed23d2` | Build SEO metadata from the content file instead of a server function |
| `3776885` | Add bun run check:content to validate content against the schema      |

Plus the commit adding this report.

### Files changed

| File                                 | Change                                                         |
| ------------------------------------ | -------------------------------------------------------------- |
| `bun.lock`                           | regenerated against `registry.npmjs.org`                       |
| `content/pages.json`                 | **new** — the content of record, 8 pages / 126 fields          |
| `scripts/export-defaults.ts`         | **new** — serialises and verifies the content file             |
| `scripts/check-content.ts`           | **new** — validates the content file against `pageSchema.ts`   |
| `src/lib/siteConfig.ts`              | **new** — holds `SITE`                                         |
| `src/lib/pageDefaults.ts`            | 368 lines → 28; now a typed adapter over the JSON              |
| `src/hooks/usePageContent.ts`        | 97 lines → 47; synchronous, no Supabase                        |
| `src/lib/pageHead.ts`                | reads SEO from the content file; `SITE` imported               |
| `src/lib/pageSeo.functions.ts`       | **deleted**                                                    |
| `src/routes/*.tsx` (7 public routes) | `loader` removed, `head` simplified                            |
| `package.json`                       | added `check:content` and `export:defaults`; `build` unchanged |
| `tsconfig.json`                      | added `resolveJsonModule`                                      |
| `.gitignore`                         | added `.netlify` (Netlify-mode build output)                   |

Untouched, as required: all seven page components in `src/pages/`,
`src/components/SiteChrome.tsx`, `src/routes/admin.pages.$slug.tsx`, `vite.config.ts`,
`bunfig.toml`, `src/start.ts` (with `csrfMiddleware` still in `requestMiddleware`), and every
auto-generated file listed in the recon.
