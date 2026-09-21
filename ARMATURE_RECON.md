# Armature Recon — Tree Test Prep

Read-only technical survey of the `treetestprep` repository, carried out as the pilot
assessment for **Armature** (a WordPress-style editing dashboard for AI-built React sites).

- **Repo:** `acts2man/treetestprep`
- **Branch surveyed:** `claude/eager-ritchie-a380zc` at commit `f0e9c54` ("Added back-to-home link")
- **Branch this report lives on:** `armature/recon`
- **Date:** 2026-09-21
- **Stack:** TanStack Start 1.168 + React 19 + Vite 8 + Tailwind 4, Bun package manager,
  deployed to Netlify, synced to Lovable, backed by a Lovable Cloud Supabase project.
- **Files changed by this recon:** this file only. No existing file was modified.

---

## Summary

1. The site builds and runs. A clean install takes about 5 seconds and a production build
   about 5 seconds, so a "publish = rebuild" model is cheap here — the bottleneck will be
   Netlify's queue and cold-start overhead, not the build itself.
2. There are **8 public pages** and **9 pages behind a login**, and the editing dashboard
   that already exists (`/admin/pages/`) is a working prototype of what Armature is meant to be.
3. The content layer is genuinely well-built: 126 editable fields are declared in one schema
   file, every one of them has a baked-in default in the repo, and the pages read 105 of those
   fields through a single hook. The remaining 21 are the SEO fields, which are read through a
   separate server-side path. Nothing is orphaned.
4. Because every field has a repo default, **the site renders correctly with an empty database** —
   which is exactly the property that makes the git-first v1 plan realistic.
5. However, body copy overrides are fetched in the browser *after* the page is already on screen.
   The server-rendered HTML always contains the repo defaults. So if a client edits a headline
   today, Google and the first paint still show the old headline: a real content flash. The
   SEO tags (`<title>`, description, canonical) are the one exception — those *are* resolved
   server-side before the HTML is sent.
6. Moving content into a committed file (e.g. `content/pages.json`) would **fix** the flash
   rather than cause one, because the file is baked into the bundle and therefore into the SSR
   output. This is a small change: about four files, and `usePageCopy` keeps its exact API.
7. There is still hard-coded text the dashboard cannot reach — roughly 20 items, mostly
   navigation labels ("Sign In", "Admin Dashboard"), accessibility labels, and decorative
   glyphs. Instructor bios and photos live in a Supabase table rather than in the content
   schema, so they are invisible to the page editor.
8. Two things will bite Armature if unaddressed: the committed `bun.lock` pins all 624
   dependency tarballs to a **Lovable-private npm registry** that returns HTTP 403 outside
   Lovable's sandbox, and the site's canonical domain is hard-coded to
   `https://treetestprep.lovable.app` in three places while the real domain is `treetestprep.com`.
9. No service-role key appears in client code — the security boundary is correct. The admin
   role check is browser-side only, but the actual data protection is Postgres RLS, which is
   properly written.
10. Housekeeping: 42 of 46 shadcn components are unused, one dead component file, two unused
    database tables, an unimported stylesheet, a font that is named but never loaded, and one
    typo'd outbound link (`wwv.isa-arbor.com`).

---

## 1. Install and build

### What was run, and one deviation

`bun install` inside the working tree **fails**. The committed `bun.lock` pins all
dependency tarballs to a Lovable-private Google Artifact Registry mirror, which is not
reachable from outside Lovable's own sandbox:

```
error: GET https://europe-west1-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache/
      get-stream/-/get-stream-8.0.1.tgz - 403
... (and ~12 more per attempt; the failures rotate)
```

`bun.lock` contains **624** such `europe-west1-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache`
URLs. Passing `--registry=https://registry.npmjs.org` does **not** help, because the
lockfile's resolved tarball URLs win over the registry setting.

To get past this without touching a tracked file, the repo was copied to a scratch directory,
`bun.lock` was deleted **in the copy only**, and dependencies were resolved fresh from
`registry.npmjs.org`. All build and runtime results below come from that scratch copy. The
working tree was never modified.

> Consequence for the report: package versions are the newest matching the `package.json`
> ranges rather than the exact versions the lockfile pins (e.g. `react@19.3.0` instead of
> `^19.2.0`'s pinned resolution). The build succeeded cleanly either way, but this is not a
> byte-for-byte reproduction of the Lovable/Netlify build.

### Results

| Step | Command | Result | Time |
| --- | --- | --- | --- |
| Install (as committed) | `bun install` | **FAILED** — HTTP 403 from Lovable-private registry | 19.8 s to failure |
| Install (fresh resolution) | `bun install` after removing `bun.lock` in scratch copy | **OK** — 593 packages | 5.12 s |
| Build (local default) | `bun run build` | **OK**, exit 0 | 5.04 s wall (`✓ built in 772 ms`) |
| Build (Netlify mode) | `NETLIFY=true bun run build` | **OK**, exit 0 | 4.58 s wall (`✓ built in 852 ms`) |

Build warnings (non-fatal, both worth fixing):

- `vite-tsconfig-paths` is redundant — Vite 8 resolves tsconfig paths natively.
- `src/lib/pageSeo.functions.ts:6` — `createServerFn().inputValidator()` is deprecated; use
  `.validator()`.

### The output folder depends on an environment variable

This is a trap. `vite.config.ts` branches on `process.env.NETLIFY === "true"`:

- **`NETLIFY` unset** (a plain local `bun run build`) → nitro builds to **`.output/`**.
  There is no `dist/` at all.
- **`NETLIFY=true`** (what Netlify itself sets) → nitro is disabled, the Netlify plugin runs,
  and output lands in **`dist/`** — which is what `netlify.toml` publishes.

So `netlify.toml`'s `publish = "dist/client"` is only ever correct in the Netlify build.
A developer running `bun run build` locally and looking for `dist/client` will not find it.
`bun run preview` also only works after the `NETLIFY=true` build, because
`@tanstack/start-plugin-core`'s preview server imports `dist/server/server.js` (see §4).

| Mode | Folder | Files | Size | Notes |
| --- | --- | --- | --- | --- |
| `NETLIFY=true` | `dist/client` | 83 | 4.3 MB | 58 JS chunks, 2 CSS, 20 `.webp` (all of `public/assets`), `favicon.png`, `robots.txt`, `sitemap.xml` |
| `NETLIFY=true` | `dist/server` | 58 | 436 KB | SSR bundle, entry `dist/server/server.js` (4.6 KB) |
| `NETLIFY=true` | `.netlify/v1/functions` | 1 | 433 B | `server.mjs` — the Netlify Function wrapper |
| default (nitro) | `.output/public` | 84 | 4.3 MB | same client payload + generated `_headers` |
| default (nitro) | `.output/server` | 91 | 2.6 MB | nitro/Cloudflare-worker-shaped server bundle, entry `index.mjs` |

Largest client assets — note that the images dwarf the JavaScript:

| Asset | Size |
| --- | --- |
| `instructors-tree.webp` | 743.7 KB |
| `contact-tree.webp` | 578.8 KB |
| `index-*.js` (main client chunk) | 564.9 KB |
| `exam-tree.webp` | 440.9 KB |
| `background-2.webp` | 277.4 KB |

Only one caching header is generated (`.output/public/_headers`):

```
/assets/*
  cache-control: public, max-age=31536000, immutable
```

HTML responses carry **no** `cache-control`, so every page view invokes the SSR function.

---

## 2. Routes

File-based routing from `src/routes/`. `src/router.tsx` sets `trailingSlash: "always"`, so
every URL below ends in `/`. `routeTree.gen.ts` is generated — do not hand-edit.

| File | URL | Renders | Access |
| --- | --- | --- | --- |
| `__root.tsx` | — (app shell) | `RootShell` / `RootComponent` + `<Outlet/>` | wraps everything; provides `QueryClientProvider`, `AuthProvider`, `Toaster` |
| `index.tsx` | `/` | `src/pages/Home.tsx` | **Public** |
| `events.location.tsx` | `/events/location/` | `src/pages/CourseOverview.tsx` | **Public** |
| `exam-information.tsx` | `/exam-information/` | `src/pages/ExamInformation.tsx` | **Public** |
| `about-us.tsx` | `/about-us/` | `src/pages/Inspiration.tsx` | **Public** |
| `meet-your-instructors.tsx` | `/meet-your-instructors/` | `src/pages/Instructors.tsx` | **Public** |
| `contact-us.tsx` | `/contact-us/` | `src/pages/Contact.tsx` | **Public** |
| `class-registration-page.tsx` | `/class-registration-page/` | `src/pages/Registration.tsx` | **Public** |
| `auth.tsx` | `/auth/` | `AuthPage` (inline) | **Public** login screen. `ssr: false`, `robots: noindex, nofollow` |
| `dashboard.tsx` | `/dashboard/` | `DashboardRedirect` (inline) | **Login required** — client-side redirect to `/admin/` or `/auth/`. `ssr: false`, `noindex` |
| `admin.tsx` | `/admin` (layout) | `RoleGate` → `DashboardLayout` → `<Outlet/>` | **RoleGate (admin)**. `noindex, nofollow` |
| `admin.index.tsx` | `/admin/` | `AdminDashboard` (inline) | behind `admin.tsx` RoleGate |
| `admin.classes.tsx` | `/admin/classes/` | `AdminClasses` (inline) | behind RoleGate |
| `admin.instructors.tsx` | `/admin/instructors/` | `AdminInstructors` (inline) | behind RoleGate |
| `admin.resources.tsx` | `/admin/resources/` | `AdminResources` (inline) | behind RoleGate |
| `admin.pages.index.tsx` | `/admin/pages/` | `AdminPagesIndex` (inline) | behind RoleGate — **the page editor index** |
| `admin.pages.$slug.tsx` | `/admin/pages/:slug/` | `AdminPageEditor` (inline) | behind RoleGate — **the field editor** |
| `admin.settings.tsx` | `/admin/settings/` | `AdminSettings` (inline) | behind RoleGate |

Observations:

- The seven public content pages are the only routes that render from `src/pages/`. Every
  admin screen is defined inline in its route file.
- All seven public routes use the identical pattern: a `loader` calling
  `getPageSeo({ data: { slug } })` and a `head` calling `buildHead(slug, path, loaderData)`.
  Each also sets `errorComponent` and `notFoundComponent` to the page itself, so a loader
  failure degrades to the default-content page rather than an error screen. That is a nice
  resilience property Armature should preserve.
- **`RoleGate` is a browser-side gate only** (`src/components/dashboard/RoleGate.tsx:14-31`).
  `admin.tsx` does not set `ssr: false`, so the server renders the "Loading..." shell for
  `/admin/*` and the real gate runs after hydration. Nothing sensitive is server-rendered, and
  the actual protection is Postgres RLS — but the gate is not an authorization boundary and
  should not be treated as one.
- There is **no sitemap route** — `public/sitemap.xml` is a static file listing seven URLs.
- `/admin/pages/:slug/` accepts any slug; unknown slugs render a friendly "Page not found"
  panel (`admin.pages.$slug.tsx:174-183`).

---

## 3. Content layer audit

### 3a. How the three files work together

Three files and one hook form a small, clean CMS:

**`src/lib/pageSchema.ts` (389 lines) — the field registry / editor UI description.**
Declares `PageDefinition[]`: each page has a `slug`, a human `label`, its live `path`, a
`description`, and `sections`, each holding `fields`. A field is `{ key, label, type }` where
type is one of `text | textarea | image | video | url | link | list`; `list` fields additionally
declare `itemFields` (the shape of each repeatable row). `SHARED_SCHEMA` (slug `"shared"`) holds
header/footer. `PAGE_SCHEMA` holds the seven content pages. `ALL_PAGES = [SHARED_SCHEMA, ...PAGE_SCHEMA]`.
Every page definition ends with `seoSection()` — a reusable `{ title, description, image }` block.
Exports `getPageDefinition(slug)`.
**This file drives the admin editor UI and nothing else** — it does not supply values.

**`src/lib/pageDefaults.ts` (368 lines) — the actual content, committed to git.**
One nested object, `PAGE_DEFAULTS[slug][section][field]`, whose values are
`string | { label, href } | Record<string,string>[]`. Its own doc comment states the intent:
*"The public pages read these as fallbacks, and the admin editor previews and resets to them,
so an empty database always renders the approved website."* Exports `defaultValue(slug, section, field)`.
**This is already the "content file" the git-first plan wants — it is just written as TypeScript
rather than JSON.**

**`src/hooks/usePageContent.ts` (97 lines) — the merge layer.**

- `usePageContent(slugs)` issues **one** React Query fetch:
  `supabase.from("page_content_overrides").select("*").in("page_slug", slugs)` with
  `staleTime: 0`. It indexes rows into a `Map` keyed `slug.section.field` and returns a
  `rowFor(slug, section, field)` lookup.
- `usePageCopy(pageSlug)` calls `usePageContent([pageSlug, "shared"])` — so every page fetches
  its own fields **and** the shared header/footer in a single round trip — and exposes five readers:

| Reader | Resolution order |
| --- | --- |
| `text(section, field)` | `row.value_text ?? row.image_url ?? row.video_url ?? row.link_url` (first non-blank) → else the string default → else `""` |
| `link(section, field)` | label from `row.value_text` else default label; href from `row.link_url` else default href (merged per-part) |
| `list(section, field)` | `row.value_json` if it is a non-empty array → else the default array → else `[]` |
| `sharedText(section, field)` | same as `text`, forced to the `"shared"` slug |
| `sharedLink(section, field)` | same as `link`, forced to the `"shared"` slug |

The writer side (`src/routes/admin.pages.$slug.tsx`) walks the same schema, seeds each input
from `row ?? PAGE_DEFAULTS`, and on **Save** upserts one row per field with
`onConflict: "page_slug,section_key,field_key"` (`:127-129`). **Reset** deletes the row (`:142-147`),
so the field falls back to the committed default. Images can be uploaded to the `site-media`
bucket, which writes a public URL into the field (`:158-172`).

The cycle is coherent: **schema describes → defaults supply → hook merges → editor overrides
row-by-row → reset removes the row**. The only structural weakness is that the override
fetch is client-side (see §4).

Field counts, verified by importing both modules and diffing the keys:

- `pageSchema.ts` declares **126** fields across 8 page definitions.
- `pageDefaults.ts` supplies **126** values.
- **Schema fields with no default: 0. Defaults with no schema entry: 0.** Perfect 1:1.

### 3b. Fields read per page, and what is still hard-coded

`usePageCopy` reads, measured by scanning every `copy.text/link/list/sharedText/sharedLink`
call site:

| File | Slug | Call sites | Distinct fields | Own | Shared |
| --- | --- | --- | --- | --- | --- |
| `src/pages/Home.tsx` | `home` | 26 | **23** | 23 | 0 |
| `src/pages/CourseOverview.tsx` | `course-overview` | 17 | **16** | 16 | 0 |
| `src/pages/ExamInformation.tsx` | `exam-information` | 15 | **15** | 15 | 0 |
| `src/pages/Registration.tsx` | `registration` | 14 | **14** | 14 | 0 |
| `src/pages/Inspiration.tsx` | `inspiration` | 8 | **8** | 8 | 0 |
| `src/pages/Instructors.tsx` | `instructors` | 6 | **6** | 6 | 0 |
| `src/pages/Contact.tsx` | `contact` | 5 | **5** | 5 | 0 |
| `src/components/SiteChrome.tsx` | `shared` | 20 | **18** | 0 | 18 |
| **Total** | | **111** | **105 distinct** | 87 | 18 |

(Call sites exceed distinct fields where a field is read twice — e.g. `home.course.image` is
rendered both as a mobile inline image and a desktop image.)

`SiteChrome.tsx` reads **all 18** shared fields (6 header + 12 footer). Coverage of the
editable surface is high — the pages genuinely do read their content.

#### Hard-coded user-visible text, images and links

**`src/components/SiteChrome.tsx`**

| Line | Hard-coded item | Kind |
| --- | --- | --- |
| 49 | `to="/auth/"` | link destination |
| 50 | `Sign In` | visible text |
| 55 | `to="/admin/"` | link destination |
| 56 | `Admin Dashboard` | visible text |
| 75 | `to="/"` on the brand logo | link destination (alt text *is* editable) |
| 79 | `✉` glyph beside the header email | visible glyph |
| 95 | `Open menu` | screen-reader text |
| 97 | `aria-label="Main navigation"` | accessibility label |
| 112 | `aria-label="Site menu"` | accessibility label |
| 117-125 | inline close-icon `<svg>` path | inline image |
| 126 | `Close menu` | screen-reader text |
| 129 | `aria-label="Mobile navigation"` | accessibility label |
| 155 | `aria-label={\`Email ${email}\`}` — the word "Email" | accessibility label |
| 156 | `✉` glyph in the mobile social row | visible glyph |
| 160 | `aria-label="International Society of Arboriculture"` | accessibility label (the URL *is* editable via `header.isa_url`) |
| 164-172 | inline tree-icon `<svg>` path | inline image |
| 203 | `aria-label="Footer navigation"` | accessibility label |
| 219 | the `\|` separator between Privacy Policy and Terms | visible text |

**`src/pages/Home.tsx`**

| Line | Hard-coded item | Kind |
| --- | --- | --- |
| 41 | `<strong>Dates:</strong>` — the literal label, then line 42 strips `/^Dates:\s*/i` off the editable value | visible text + fragile transform |
| 37-38 | splits `hero.schedule` on `·` and re-emits the first part bold | structural assumption about the editable value |
| 131 | `−` / `+` FAQ toggle glyphs | visible glyphs |
| 80-90 | splices `course.exam_link` / `course.isa_link` into `course.exam_note` by **substring match on the link label** — if an editor changes the label text and not the sentence, the link silently disappears | fragile transform |

**`src/pages/CourseOverview.tsx`**

| Line | Hard-coded item | Kind |
| --- | --- | --- |
| 26 | `▣` before the dates | visible glyph |
| 27 | `◷` before the time | visible glyph |
| 28 | `⌖` before the location | visible glyph |
| 34 | the `:` appended after `{week.week}` | visible text |
| 36, 40 | the `–` between chapter title and body | visible text |

**`src/pages/ExamInformation.tsx`**

| Line | Hard-coded item | Kind |
| --- | --- | --- |
| 44 | the trailing `.` after the ISA link | visible text |

**`src/pages/Registration.tsx`**

| Line | Hard-coded item | Kind |
| --- | --- | --- |
| 22 | `➜` arrow after the in-person link | visible glyph |
| 33 | `➜` arrow after the online link | visible glyph |

**`src/pages/Contact.tsx`, `src/pages/Inspiration.tsx`** — nothing hard-coded. Fully driven
by `usePageCopy`.

**`src/pages/Instructors.tsx`** — no hard-coded strings, but the entire instructor roster
(names, roles, bios, photos) comes from the Supabase `instructors` table (`:22-29`), **not**
from `usePageCopy` and **not** in `pageSchema.ts`. It is edited at `/admin/instructors/`,
a separate screen. For Armature this is a second content system living beside the first.

**Outside the requested files but relevant to the same problem:**

| Location | Hard-coded item |
| --- | --- |
| `src/lib/pageHead.ts:4` | `const SITE = "https://treetestprep.lovable.app"` — drives **every** canonical URL and `og:url` |
| `src/routes/__root.tsx:83` | fallback `<title>` |
| `src/routes/__root.tsx:86-87` | fallback meta description |
| `src/routes/__root.tsx:90` | `og:site_name` = `Tree Test Prep` |
| `src/routes/__root.tsx:106-117` | the whole `EducationalOrganization` JSON-LD block, including `url`, `logo` (both `treetestprep.lovable.app`) and `email: treetestprep@gmail.com` |
| `src/routes/__root.tsx:22-33` | 404 page copy ("404", "Page not found", "Go home") |
| `src/routes/__root.tsx:50-71` | error page copy ("This page didn't load", "Try again", "Go home") |
| `src/lib/error-page.ts` | the SSR hard-failure HTML page, with its own inline styles |
| `public/sitemap.xml` | seven `treetestprep.lovable.app` URLs |
| `public/robots.txt` | `Sitemap: https://treetestprep.lovable.app/sitemap.xml` |

The `.lovable.app` domain appearing in canonical tags, `og:url`, JSON-LD, the sitemap and
robots.txt while the real site is `treetestprep.com` is the single highest-impact SEO defect
found. Armature needs a site-level "domain" setting.

### 3c. Schema fields nothing reads, and reads with no schema entry

**Reads with no schema entry or default: none.** Every `copy.*` call resolves to a declared
field with a default.

**Schema fields never read through `usePageCopy`: 21** — and they are all the SEO triplets:

| Fields | Count |
| --- | --- |
| `{home, course-overview, exam-information, inspiration, instructors, contact, registration}.seo.title` | 7 |
| `…seo.description` | 7 |
| `…seo.image` | 7 |

These are **not** dead. They are consumed on a different path: the route `loader` calls
`getPageSeo` (which queries only `section_key = "seo"`), and `buildHead` merges the result over
`PAGE_DEFAULTS[slug].seo` (`src/lib/pageHead.ts:12-15`). So the SEO section is read
server-side, and 105 + 21 = 126 accounts for every declared field.

Two caveats inside that path:

- `seo.image` renders **only if** the value starts with `https://` (`pageHead.ts:31`). All seven
  defaults are `""`, so today **no page emits `og:image` or `twitter:image`** — despite
  `twitter:card: summary_large_image` being declared. Social shares have no preview image.
- `SHARED_SCHEMA` has **no** `seo` section, so there is no editable site-wide title template
  or default share image.

---

## 4. Server rendering check

### How the production build was exercised

`bun run preview` against the default (nitro) build **fails**:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '<root>/dist/server/server.js'
  imported from node_modules/@tanstack/start-plugin-core/dist/esm/vite/preview-server-plugin/plugin.js
```

The preview server expects the Netlify-mode layout. After `NETLIFY=true bun run build`
(which produces `dist/server/server.js`), `bun run preview --host 127.0.0.1` serves correctly.
`--host 127.0.0.1` was required — the default bind to `::` fails with `EAFNOSUPPORT` in this
sandbox. Both pages then returned HTTP 200 with JavaScript entirely absent from the request:

| URL | Status | Bytes |
| --- | --- | --- |
| `/` | 200 | 13,623 |
| `/meet-your-instructors/` | 200 | 9,665 |

> **Limitation, stated plainly:** this sandbox's egress policy blocks `*.supabase.co`
> (`connect_rejected`, 9/9 connections). So the SSR run could not reach the override table, and
> the live table's contents could not be read. Where this report describes what happens *when
> overrides exist*, that is read off the code paths, not observed. The Supabase project is a
> Lovable Cloud project (its ref is recorded in `supabase/config.toml`) and is not present in
> the user's own Supabase organization, so the MCP tools could not reach it either.

### What is in the raw HTML

`/` — every string checked is present, and every one of them is the **`pageDefaults.ts` value**:

| String searched | In raw HTML? | Source |
| --- | --- | --- |
| `Become An ISA Certified Arborist` | ✅ | `pageDefaults` `home.hero.title` |
| `Take your tree care career` | ✅ | `home.hero.body` |
| `Tuesdays` | ✅ | `home.hero.schedule` |
| `Week 1: Tree Biology` | ✅ | `home.course.weeks[0]` |
| `How hard is the Certified Arborist exam` | ✅ | `home.faq.items[0].question` |
| `Treetestprep@gmail.com` | ✅ | `shared.header.email` |
| `fast.wistia.net` | ✅ | `home.hero.video` |
| `Frequently Asked Question` | ✅ | `home.faq.heading` |
| `Navigation Links` | ✅ | `shared.footer.links_heading` |
| `Reputation Guardians` | ✅ | `shared.footer.credit` |
| `tree-test-prep-logo.webp` | ✅ | `shared.header.logo` |

`/meet-your-instructors/`:

| String searched | In raw HTML? | Source |
| --- | --- | --- |
| `Meet The Instructors` | ✅ | `instructors.hero.title` |
| `raising the bar in the tree care industry` | ✅ | `instructors.hero.subtitle` |
| `All of our instructors are ISA Certified` | ✅ | `instructors.intro.body` |
| `instructors-tree.webp` | ✅ | `instructors.hero.image` |
| `Jodi Carlson` | ❌ | Supabase `instructors` table |
| `Walt Warriner` | ❌ | Supabase `instructors` table |
| `instructor-jodi.webp` | ❌ | Supabase `instructors` table |

The container `<div class="instructor-list">` is server-rendered **empty**.

### Where the body copy comes from — and the content flash

**Body copy in the server-rendered HTML comes from `pageDefaults.ts`, never from Supabase
overrides.** The mechanism, and the supporting evidence:

1. `usePageCopy` → `usePageContent` → `useQuery` with a `queryFn` that calls Supabase from the
   **browser** client (`src/integrations/supabase/client.ts`). There is no route `loader`
   prefetch for page content and no `dehydrate`/`HydrationBoundary` anywhere.
2. `src/router.tsx:6` constructs a **fresh `QueryClient` per request**, so the server always
   starts with an empty cache.
3. The raw HTML contains **no** dehydrated React Query payload: searching for `page-content`
   (the query key) or `page_content_overrides` in the HTML returns **0 matches**. The only
   serialized state is the router's own `__TSR` payload.
4. Therefore on the server `query.data` is `undefined`, `rowFor` returns `undefined`, and every
   reader falls through to `PAGE_DEFAULTS`.
5. After hydration the query runs (`staleTime: 0`, so it always refetches), and any override
   replaces the default text **in place**.

**Plain answer: yes — visitors and search engines see stale default text before overrides
load.** Concretely:

- A crawler that does not execute JavaScript (or a social-card scraper, or a `curl`) sees the
  **committed defaults**, not the client's edits. Overridden copy is effectively invisible to
  those consumers.
- A human visitor sees the default text painted first, then a swap once the Supabase round trip
  completes — a visible flash of old content on every page load, scaling with the client's
  network latency. Because `staleTime: 0`, the refetch happens on every mount, so the flash is
  not a one-time cold-cache effect.
- On `/meet-your-instructors/` the failure is worse than a flash: the instructor cards are
  simply **missing** from the server HTML, so a non-JS crawler sees an empty roster.
- The one saving grace is `errorComponent`/`notFoundComponent` on each route pointing at the page
  itself, so a Supabase outage degrades to the default site rather than an error page.

### `getPageSeo` and server-side SEO

`src/lib/pageSeo.functions.ts` defines `getPageSeo` as a TanStack **server function**
(`createServerFn({ method: "GET" })`), so its body executes on the server only. It:

1. Reads `process.env.SUPABASE_URL` and `process.env.SUPABASE_PUBLISHABLE_KEY ?? SUPABASE_ANON_KEY`.
   **If either is absent it returns `{}` immediately** (`:12`) — no error, no log.
2. Dynamically imports `@supabase/supabase-js` and builds a short-lived anon client with
   `persistSession: false`.
3. Selects `field_key, value_text, image_url` from `page_content_overrides` where
   `page_slug = slug` **and `section_key = "seo"`** — i.e. it fetches only the three SEO fields,
   not the page body.
4. Returns a flat `Record<string,string>` of non-blank values. Any failure is swallowed by a bare
   `catch { return {} }` (`:31-33`).

Usage is uniform across all seven public routes, e.g. `src/routes/index.tsx:7-8`:

```ts
loader: () => getPageSeo({ data: { slug: "home" } }),
head: ({ loaderData }) => buildHead("home", "/", loaderData),
```

`buildHead` (`src/lib/pageHead.ts`) then merges override-over-default and emits `title`,
`description`, `og:title/description/url/type/site_name`, `twitter:card/title/description`,
conditionally `og:image`/`twitter:image`, and a `canonical` link.

**Do SEO fields render server-side? Yes.** Because they come from a route `loader`, they are
resolved before the HTML is streamed. Verified in the raw HTML of `/`:

```html
<title>ISA Certified Arborist Exam Prep Course | Tree Test Prep</title>
<meta name="description" content="Pass the ISA Certified Arborist exam with an 8-week
  instructor-led prep course in Sacramento, CA or live online — chapter-by-chapter study
  guide included."/>
<meta property="og:title" content="ISA Certified Arborist Exam Prep Course | Tree Test Prep"/>
<meta property="og:url" content="https://treetestprep.lovable.app/"/>
<meta property="og:site_name" content="Tree Test Prep"/>
<meta name="twitter:card" content="summary_large_image"/>
<link rel="canonical" href="https://treetestprep.lovable.app/"/>
<meta name="robots" content="index, follow"/>
```

and on `/meet-your-instructors/`:

```html
<title>Meet Your Arborist Instructors | Tree Test Prep</title>
<link rel="canonical" href="https://treetestprep.lovable.app/meet-your-instructors/"/>
```

The `EducationalOrganization` JSON-LD from `__root.tsx` is also present server-side.

**So the site has a split personality: SEO metadata is server-rendered and override-aware,
while body copy is server-rendered but override-*blind*.** Three caveats:

- No `og:image` is emitted anywhere (all `seo.image` defaults are `""`, and the guard requires
  `https://`).
- `getPageSeo` needs the **non-prefixed** `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` in the
  server environment. The repo's `.env` defines both prefixed and non-prefixed names, but on
  Netlify the non-prefixed pair must be set explicitly; if they are missing, **SEO overrides are
  silently ignored** and nobody is told.
- Canonical URLs point at `treetestprep.lovable.app`, not the production domain.

---

## 5. Supabase usage

### Tables

| Table | Read by | Written by | Public (anon) read? |
| --- | --- | --- | --- |
| `page_content_overrides` | `src/hooks/usePageContent.ts:29` (all public pages, client-side); `src/lib/pageSeo.functions.ts:20` (SSR, `seo` section only); `src/routes/admin.pages.$slug.tsx:48`; counted on `admin.index.tsx:35` | `admin.pages.$slug.tsx:128` (upsert), `:143` (delete on Reset) | **Yes** — `GRANT SELECT … TO anon` + `USING (true)` |
| `instructors` | `src/pages/Instructors.tsx:23` (public, `is_visible = true`, ordered by `sort_order`); `admin.instructors.tsx:43`; counted on `admin.index.tsx:33` | `admin.instructors.tsx:58`, `:79`, `:88` | **Yes** — `GRANT SELECT … TO anon`, visible rows only |
| `classes` | `admin.classes.tsx:56`; `admin.index.tsx:46` (recent activity) and `:31-32` (counts) | `admin.classes.tsx:68`, `:92`, `:101` | **Yes** — `GRANT SELECT … TO anon`, `status = 'published'` only. Note: **no public page reads it** |
| `resources` | `admin.resources.tsx:49`; counted on `admin.index.tsx:34` | `admin.resources.tsx:63`, `:84`, `:93` | **Partly** — `visibility = 'public'` rows only. No public page reads it either |
| `profiles` | `src/hooks/use-auth.tsx:48`; `admin.settings.tsx:54`; `AvatarUploader.tsx:24` | `admin.settings.tsx:69`; `AvatarUploader.tsx` (avatar URL) | **No** — authenticated, own row or staff |
| `user_roles` | `src/hooks/use-auth.tsx:46`; `admin.settings.tsx:42` | `admin.settings.tsx:76`, `:90` | **No** — authenticated, own rows or staff |
| `registrations` | **nothing** | **nothing** | No — authenticated only |
| `inquiries` | **nothing** | **nothing** | Insert-only for anon (`GRANT INSERT … TO anon`) |

`registrations` and `inquiries` exist in the migrations **and** in the generated
`src/integrations/supabase/types.ts`, but no code touches either. Registration is handled by
two external Stripe payment links in `pageDefaults.ts`, and Contact is a `mailto:` link — so both
tables are currently dead. (`registrations` is named in three UI description strings, e.g.
`admin.tsx:10`, but no screen exists for it.)

No `.rpc()` calls anywhere. `resolve_login_email` was added by migration
`20260826215225` and **dropped** by `20260826215416`; it was replaced by a hard-coded
client-side alias map (see §9).

### Storage buckets

One bucket: **`site-media`**.

| Used by | Operation | Path prefix |
| --- | --- | --- |
| `src/routes/admin.pages.$slug.tsx:161` / `:163` | `upload` then `getPublicUrl` | `pages/{slug}/{timestamp}-{sanitized filename}` |
| `src/routes/admin.resources.tsx:107` / `:109` | `upload` then `getPublicUrl` | resource files |
| `src/components/dashboard/AvatarUploader.tsx:45-49` | `upload` then `getPublicUrl` | avatars |

**Public-read: yes** — `CREATE POLICY "Public can view site media" ON storage.objects FOR SELECT
USING (bucket_id = 'site-media')`. Writes are staff-only.

### RLS policy summary (from `supabase/migrations/`)

Seven migration files. All application tables have `ENABLE ROW LEVEL SECURITY`.

**Role model.** `CREATE TYPE public.app_role AS ENUM ('super_admin','admin','instructor','student')`.
Two `SECURITY DEFINER STABLE` helpers with `SET search_path = public`:

- `has_role(_user_id, _role)` — exact role test.
- `is_staff(_user_id)` — true for `admin` or `super_admin`. This is the workhorse of nearly
  every write policy.

Putting roles in a separate table and testing them through a `SECURITY DEFINER` function is the
correct pattern — it avoids the classic recursive-RLS trap of storing the role on `profiles`.

| Table | SELECT | INSERT / UPDATE / DELETE |
| --- | --- | --- |
| `user_roles` | own rows (`user_id = auth.uid()`) **or** `is_staff()` | `is_staff()` (`FOR ALL`) |
| `profiles` | own row **or** `is_staff()` | update: own row or staff; insert: `id = auth.uid()`; delete: staff only |
| `classes` | `status = 'published'` **or** staff **or** instructor — **no `TO` clause, so anon included** | staff only |
| `registrations` | own rows **or** staff **or** instructor | insert: own rows or staff; otherwise staff |
| `instructors` | `is_visible` **or** staff — anon included | staff only |
| `resources` | `visibility = 'public'` (anon) **or**, for authenticated, `visibility IN ('public','students')` or staff | staff only |
| `inquiries` | own rows or staff | **`FOR INSERT WITH CHECK (true)`** — anyone, including anon, may submit |
| `page_content_overrides` | **`USING (true)`** — fully world-readable | staff only (`FOR ALL`) |
| `storage.objects` (`site-media`) | anyone | staff only |

Supporting hardening, all present and correct:

- `handle_new_user()` trigger on `auth.users` seeds a `profiles` row and grants the `student`
  role, with `ON CONFLICT DO NOTHING`.
- `update_updated_at_column()` triggers on every mutable table.
- Two migrations (`…230809`, `…230822`) `REVOKE ALL` on `handle_new_user()` and
  `update_updated_at_column()` from `anon`, `authenticated` and `PUBLIC` — these trigger functions
  are not callable over the API.
- Migration `…211152` adds `profiles.username`, a normalizing trigger (lowercase/trim, empty→NULL),
  and a partial unique index. It also **hard-codes a UPDATE setting `username = 'jodicarl25'`** for
  the row whose auth email is `treetestprep@gmail.com`.
- Seed data: one 2026 cohort in `classes`, four instructors with `/assets/instructor-*.webp`
  photos, two resources.

Two things to flag for Armature:

- `page_content_overrides` is `USING (true)` and granted to `anon` — **by design**, since the
  public pages read it from the browser with the publishable key. Under a git-first model that
  public grant becomes unnecessary and should be removed.
- The `classes` and `instructors` SELECT policies omit a `TO` clause, so they apply to `anon`
  as well as `authenticated`. That is intentional here, but it means unpublished/hidden rows are
  the *only* thing protecting draft content.

---

## 6. Styling

Three stylesheets, loaded per-route rather than globally:

| File | Lines | Loaded by | Role |
| --- | --- | --- | --- |
| `src/styles/globals.css` | 338 | `src/routes/__root.tsx:13` (`?url`, as a `<link>` in `head`) | **The entire public site.** Hand-written CSS, no Tailwind |
| `src/styles/dashboard.css` | 71 | `admin.tsx:4`, `dashboard.tsx:4`, `auth.tsx:9` | Tailwind entry for the admin/auth screens |
| `src/styles.css` | 144 | **nothing** | shadcn/Tailwind design tokens — **not imported by any `.ts`/`.tsx`** |

### `src/styles/globals.css` custom properties

The public site's entire design system is **eight** variables:

| Property | Value | Kind |
| --- | --- | --- |
| `--navy` | `#1d3770` | colour — primary brand |
| `--navy-deep` | `#162b5c` | colour — darker navy (footer, hovers) |
| `--green` | `#349e49` | colour — accent / CTA |
| `--gold` | `#d9c58c` | colour — highlight |
| `--ink` | `#1f2328` | colour — body text |
| `--muted` | `#79849b` | colour — secondary text |
| `--wrap` | `1210px` | **width** — the container, used as `.wrap { width: min(var(--wrap), calc(100% - 40px)) }` |

There is **no font variable and no font-size or spacing scale.**

### `src/styles.css` custom properties (present but inert)

Because nothing imports it, these tokens are dead as written — though `dashboard.css` imports
Tailwind separately and the admin screens use `bg-background`/`text-foreground` style utilities.

- `--radius: 0.625rem` plus a derived scale in `@theme inline`: `--radius-sm/md/lg/xl/2xl/3xl/4xl`.
- 27 semantic colours defined twice (`:root` light, `.dark` dark), **all in `oklch()`**:
  `--background`, `--foreground`, `--card(-foreground)`, `--popover(-foreground)`,
  `--primary(-foreground)`, `--secondary(-foreground)`, `--muted(-foreground)`,
  `--accent(-foreground)`, `--destructive(-foreground)`, `--border`, `--input`, `--ring`,
  `--chart-1…5`, `--sidebar`, `--sidebar-foreground`, `--sidebar-primary(-foreground)`,
  `--sidebar-accent(-foreground)`, `--sidebar-border`, `--sidebar-ring`.
- Each is re-exported as a Tailwind utility via `@theme inline { --color-<name>: var(--<name>) }`.
- No font or width variables here either.
- A file comment asserts *"All colors MUST use oklch format"* — a rule the public stylesheet and
  every dashboard component break.

`src/styles/dashboard.css` is `@import "tailwindcss"` + `@import "tw-animate-css"` plus a
`.dashboard-shell` scope.

### Where fonts are loaded from

**Nowhere.** This is a real bug.

- `src/styles/globals.css:17` — `font-family: "Poppins", "Segoe UI", Arial, sans-serif;`
- `src/styles/dashboard.css:58` — the same stack.

There is **no** `@font-face`, no `@import url(...)`, no `fonts.googleapis.com` or
`fonts.gstatic.com` link, and no font file anywhere in the repo or `public/`. `__root.tsx`'s
`links` array contains only `globals.css` and two favicons. So unless a visitor happens to have
Poppins installed locally, **the site silently renders in Segoe UI or Arial** — not the intended
typeface. Typography is the most visible thing a client will comment on; Armature should own
webfont loading explicitly.

### Colours and font sizes hard-coded instead of using variables

**In `globals.css`** — 68 literal colour values that bypass the variables, and **53
`font-size` declarations, none of which uses a variable:**

Most-repeated literals: `#fff` ×20, `#e4e5e8` ×2, `#d9dce2` ×2, `#d0342c` ×2, `#cbbd88` ×2
(a near-duplicate of `--gold: #d9c58c`), `#3d434e` ×2, `#111` ×2, `#000` ×2, plus ~14 distinct
`rgba()` values including `rgba(29, 55, 112, .04)` and `rgba(22, 43, 92, .12)` — both
alpha variants of `--navy`/`--navy-deep` written out by hand.

Font sizes are raw pixels throughout: `16px` ×6, `20px` ×5, `17px` ×5, `31px` ×4, `18px` ×4,
`14px` ×4, `29px` ×3, `22px` ×3, `15px` ×3, `24px` ×2, `23px` ×2, `13px` ×2, and singles at
`38px`, `35px`, `32px`, `30px`, `28px`, plus three `clamp(28px|30px|34px, …)` heroes.

**In components** — the brand palette is re-typed as Tailwind arbitrary values rather than
referenced. 58 hex literals across 16 files:

| File | Hex literals | Examples |
| --- | --- | --- |
| `src/routes/auth.tsx` | 10 | `bg-[#0a0f1e]`, `focus:border-[#349e49]`, `bg-[#349e49]`, `hover:bg-[#2c8…]`, `text-[#d9c58c]` |
| `src/components/dashboard/DashboardLayout.tsx` | 8 | `bg-[#1d3770]`, `bg-[#05070d]`, `bg-[#0a0f1e]`, `bg-[#349e49]` |
| `src/components/dashboard/DataTable.tsx` | 6 | `from-[#0a1228] to-[#05070d]`, `bg-[#349e49]` |
| `src/routes/admin.settings.tsx` | 4 | `from-[#0a1228] to-[#05070d]` |
| `src/routes/admin.pages.index.tsx` | 4 | `text-[#d9c58c]`, `hover:border-[#349e49]/60` |
| `src/routes/admin.pages.$slug.tsx` | 4 | `bg-[#1d3770]`, `bg-[#0a0f1e]` |
| `src/routes/admin.index.tsx` | 4 | `from-[#0a1228] to-[#05070d]` |
| `src/routes/admin.resources.tsx` | 3 | `text-[#d9c58c]` |
| `src/routes/admin.classes.tsx` | 3 | `bg-[#0a0f1e]` |
| `src/lib/error-page.ts` | 3 | `#fafafa`, `#111`, `#4b5563`, `#d1d5db` (inline `<style>`) |
| `src/routes/admin.instructors.tsx` | 2 | `from-[#0a1228] to-[#05070d]` |
| `src/components/dashboard/StatTile.tsx` | 2 | `from-[#0a1228] to-[#05070d]` |
| `src/components/dashboard/PlaceholderPage.tsx` | 2 | `from-[#0a1228] to-[#05070d]` |
| `src/routes/dashboard.tsx` | 1 | `bg-[#0a0f1e]` |
| `src/components/dashboard/RoleGate.tsx` | 1 | `bg-[#0a0f1e]` |
| `src/components/dashboard/AvatarUploader.tsx` | 1 | `bg-[#1d3770]` |

`#1d3770`, `#349e49` and `#d9c58c` are exactly `--navy`, `--green` and `--gold` — the same
three brand colours maintained in two unconnected places. A client who asks to "change the
brand green" today needs edits in `globals.css` **and** in a dozen `.tsx` files. Two further
dashboard-only colours (`#0a0f1e`, `#05070d`, `#0a1228`) are not variables at all.

---

## 7. Media

### `public/assets` — 20 files, 3.1 MB total

| File | Size | Referenced from |
| --- | --- | --- |
| `instructors-tree.webp` | 761,548 B (743.7 KB) | `pageDefaults.ts:296` (`instructors.hero.image`); `auth.tsx:15` (login background) |
| `contact-tree.webp` | 592,662 B (578.8 KB) | `pageDefaults.ts:314` (`contact.hero.image`) |
| `exam-tree.webp` | 451,526 B (441.0 KB) | `pageDefaults.ts:210` (`exam-information.hero.image`) |
| `background-2.webp` | 284,060 B (277.4 KB) | `src/styles/globals.css` only |
| `looking-up-at-the-trunk-and-spreading-branches-of-a-large-oak-tree.webp` | 179,626 B (175.4 KB) | `pageDefaults.ts:91` (`home.faq.image`) |
| `flowering-tree-in-bloom-beside-a-marsh-with-hills-behind-it.webp` | 138,750 B (135.5 KB) | `pageDefaults.ts:34` (`shared.footer.image`) |
| `instructor-walt.webp` | 127,642 B (124.7 KB) | migration seed only (`instructors` table) |
| `two-mature-trees-at-sunset-with-the-sun-flaring-through-a-wooden-fence.webp` | 98,910 B (96.6 KB) | `pageDefaults.ts:85` (`home.course.image`) |
| `background-1.webp` | 96,498 B (94.2 KB) | `src/styles/globals.css` only |
| `instructor-tyler.webp` | 57,436 B (56.1 KB) | migration seed only |
| `instructor-jodi.webp` | 55,416 B (54.1 KB) | migration seed only |
| `ken-menzer-hero.webp` | 52,490 B (51.3 KB) | `pageDefaults.ts:264` (`inspiration.hero.image`) |
| `instructor-erica.webp` | 51,396 B (50.2 KB) | migration seed only |
| `course-classroom.webp` | 45,758 B (44.7 KB) | `pageDefaults.ts:124` (`course-overview.main.image`) |
| `ken-menzer-fishing.webp` | 44,220 B (43.2 KB) | `pageDefaults.ts:269` (`inspiration.story.image`) |
| `registration-online.webp` | 38,092 B (37.2 KB) | `pageDefaults.ts:346` (`registration.online.image`) |
| `registration-in-person.webp` | 29,704 B (29.0 KB) | `pageDefaults.ts:334` (`registration.in_person.image`) |
| `isa-certified-arborist-credential-badge.webp` | 28,398 B (27.7 KB) | `pageDefaults.ts:56` (`home.hero.badge`) |
| `reputation-guardians-logo.webp` | 22,600 B (22.1 KB) | **UNREFERENCED** — dead asset |
| `tree-test-prep-logo.webp` | 19,716 B (19.3 KB) | `pageDefaults.ts:12`, `:28`; `DashboardLayout.tsx`; `auth.tsx` |

Also in `public/`: `favicon.png`, `robots.txt`, `sitemap.xml`.

Notes:

- **All 20 files are copied verbatim into the build** (`dist/client/assets` contains 20 `.webp`),
  including the unreferenced one.
- The four `instructor-*.webp` photos are referenced **only** by the migration seed, which writes
  them into `instructors.image_url`. They are database-driven, not schema-driven, so the page
  editor cannot change them.
- The three largest images total **1.8 MB**, over half the asset budget, and each is a hero
  background. Compressing these would do more for page speed than any JS work.

### Image URLs in `pageDefaults.ts` pointing outside `/assets`

**None.** All 16 image fields use local `/assets/*.webp` paths. There are no Supabase Storage
URLs anywhere in `src/` (grep for `supabase.co/storage` → no matches).

For completeness, all 11 external URLs in `pageDefaults.ts`:

| Line | URL | Field | Note |
| --- | --- | --- | --- |
| 25 | `https://www.isa-arbor.com/` | `shared.header.isa_url` | |
| 38 | `https://treetestprep.com/privacy-policy` | `shared.footer.privacy` | absolute to the WordPress domain |
| 39 | `https://treetestprep.com/terms-of-service` | `shared.footer.terms` | absolute to the WordPress domain |
| 41 | `https://reputationguardians.net/` | `shared.footer.credit` | |
| 59 | `https://fast.wistia.net/embed/iframe/mjst5n61w1?seo=true&videoFoam=true` | `home.hero.video` | **the only non-`/assets` media reference** (video, not image) |
| 78 | `https://treetestprep.com/exam-information/` | `home.course.exam_link` | ⚠ points **off-site** to the old WordPress page instead of the internal `/exam-information/` |
| 81 | `https://www.isa-arbor.com/Credentials/Common-Questions` | `home.course.isa_link` | |
| 221 | `https://www.isa-arbor.com/Credentials/Apply-Now/Apply-for-Eligibility` | `exam-information.process.cta` | |
| 338 | `https://buy.stripe.com/8wM8wMbsjfuL5YkfYY` | `registration.in_person.cta` | live Stripe payment link |
| 350 | `https://buy.stripe.com/cN2aEU53V6Yf2M85kl` | `registration.online.cta` | live Stripe payment link |
| 357 | `https://wwv.isa-arbor.com/store/product/7/` | `registration.book.cta` | ⚠ **typo — `wwv` should be `www`. This "Purchase Book Here" link is broken.** |

Caveat: uploads through the existing editor write Supabase Storage public URLs into
`page_content_overrides.image_url` at runtime. Those URLs exist in the database, not in this
file — which is precisely the migration problem §8 has to solve.

---

## 8. Git-first feasibility

**Verdict: straightforward, and it fixes the content flash rather than introducing one.**
`pageDefaults.ts` is already a committed content file; the work is to make it the *only* source
and to give the dashboard a way to write it.

### Why it is easy here

- 126 fields, 100 % of them already defaulted in the repo.
- Every reader funnels through **one hook** (`usePageCopy`), so the read path changes in one file.
- Because a bundled import is available during SSR, the merged content lands in the
  server-rendered HTML — killing the flash and making overridden copy visible to crawlers.
- Route `loader`s already tolerate content-fetch failure; removing the fetch removes a failure mode.

### Files that would change

| File | Change |
| --- | --- |
| **`content/pages.json`** (new) | The content of record. Shape: `{ [slug]: { [section]: { [field]: string \| {label,href} \| Array<Record<string,string>> } } }` — i.e. exactly today's `PAGE_DEFAULTS` serialized. Generate it once from `pageDefaults.ts` so the initial commit is provably identical. |
| `src/lib/pageDefaults.ts` | Becomes a thin typed adapter: `import content from "../../content/pages.json"` and `export const PAGE_DEFAULTS = content as Record<string, Record<string, Record<string, DefaultValue>>>`. Keep the `DefaultValue`/`LinkDefault` types and the `defaultValue()` helper so no importer breaks. (`resolveJsonModule` is not needed — Vite imports JSON natively.) |
| `src/hooks/usePageContent.ts` | The substantive change — see below. |
| `src/lib/pageSeo.functions.ts` | Delete it, or keep it as a no-op returning `{}`. Once SEO lives in the JSON, `buildHead(slug, path)` reads it directly and no server round trip is needed. Removing the `loader` from all seven routes also drops seven server-function calls per navigation. |
| `src/routes/*.tsx` (7 public routes) | Drop `loader` and simplify `head: () => buildHead(slug, path)`. |
| `src/lib/pageHead.ts` | Make `overrides` optional/removed; take `SITE` from config instead of the hard-coded `.lovable.app` constant. |
| `src/routes/admin.pages.$slug.tsx` | Editor stops upserting to Supabase and instead POSTs the edited page object to a new "publish" server function. Its Save/Reset semantics change from per-field to per-page (or it batches a draft). |
| **new server function**, e.g. `src/lib/publishContent.functions.ts` | Auth-check (`is_staff`), validate the payload against `pageSchema.ts`, then commit `content/pages.json` via the GitHub Contents API (`PUT /repos/{owner}/{repo}/contents/content/pages.json` with the current `sha`). Needs a repo-scoped token in a server-only env var — never `VITE_`-prefixed. |
| `src/integrations/supabase/types.ts`, new migration | Optionally drop `page_content_overrides`, or at minimum `REVOKE SELECT … FROM anon` and remove the `USING (true)` policy so content is no longer world-readable from the browser. |
| `public/assets/` + editor upload path | Image uploads must land in the repo (committed alongside the JSON) rather than in the `site-media` bucket — otherwise media and copy publish through two different systems. |

### What `usePageCopy` becomes

It keeps its **exact public API** — `text`, `link`, `list`, `sharedText`, `sharedLink` — so not
one line changes in the seven pages or `SiteChrome.tsx`. What disappears is the async machinery:
no `useQuery`, no Supabase import, no `rows`/`map`/`rowFor`, no `isLoading`. Each reader becomes a
direct lookup into the imported JSON with the same type coercion it does today (`typeof
fallback === "string" ? fallback : ""`; the `{label, href}` merge for links; `Array.isArray` for
lists). It stops being a hook in any meaningful sense and could be a plain function — but keeping
the hook signature means zero call-site churn, which is worth more than the purity.

`usePageContent` itself (the row-fetching export) is used only by `usePageCopy`, so it can be
deleted outright.

### Risks

1. **Lovable sync conflicts — the main one.** `AGENTS.md` warns that commits to the connected
   branch sync back into the Lovable editor, and that history must never be rewritten. A client
   pressing Publish creates a commit on `main`; if Lovable is mid-generation on the same branch
   the two writers race. Mitigations: publish to a dedicated `content` branch that Netlify builds
   and that is merged (never rebased) into `main`; or keep `content/pages.json` a file Lovable is
   instructed never to touch (via `.lovable` config / project knowledge); or serialize publishes
   behind a lock. Note also that publishing through the GitHub API means the working tree Lovable
   holds can be stale — the publish function must always read the current `sha` and retry on 409.
2. **Rebuild time on Netlify.** The build itself is trivial (~5 s local; `✓ built in 852 ms`), but
   the wall-clock cost of a publish is queue wait + `bun install` + build + deploy — realistically
   **1–3 minutes**, and Netlify serializes builds per site. A client making ten small edits
   triggers ten builds and waits minutes to see the first. Fixes: debounce publishes (a "Publish
   changes" button rather than per-field Save — a change the current per-field editor forces
   anyway), show honest build status in the dashboard, and cache `node_modules`. Watch the
   lockfile problem in §1: if the private-registry pins ever stop resolving on Netlify, every
   publish fails at install.
3. **SSR caching.** The generated `_headers` caches `/assets/*` immutably but sets **no**
   `cache-control` on HTML, so pages are SSR'd per request and new content appears as soon as the
   deploy flips. Good default. But if anyone later adds HTML caching or Netlify's CDN/ODB caching
   for speed, a publish must also purge it — otherwise "I published and nothing changed" becomes
   the top support ticket. The hashed-filename JS chunks are fine, but a returning visitor
   holding an old `index-*.js` keeps the old baked-in content until they load new HTML.
4. **Loss of instant preview.** Today a Save is visible on the next page load. Git-first
   introduces a minutes-long gap. The dashboard needs an in-editor preview that reads the local
   draft so the client sees their change immediately.
5. **Migrating existing overrides.** Any rows already in `page_content_overrides` are the client's
   real current content and must be merged into `content/pages.json` *before* the table is
   retired, or live edits silently revert to defaults. This must be a one-time export, and it
   could not be verified here because the database was unreachable (§4).
6. **Storage-hosted images.** Existing `image_url` values pointing at `site-media` must be
   downloaded into `public/assets/` and rewritten, or those images vanish when the table is dropped.
7. **Content and code in one commit stream.** A client publish becomes a repo commit, so a bad
   edit shows up in `git log` next to engineering work. That is also the upside — publishes are
   revertable and diffable, which is the whole point of the model. But branch protection, CI
   checks and required reviews on `main` would all block an automated publish, so the publish
   target needs a policy exemption or its own branch.
8. **JSON loses TypeScript's guarantees.** Today a typo in `pageDefaults.ts` can fail the build.
   A JSON file cannot. Compensate by validating the payload against `pageSchema.ts` in the publish
   function and adding a build-time check that every schema field has a value.
9. **Concurrent editors.** Two admins publishing at once will conflict at the API level. Last-write-
   wins on a whole-file PUT silently discards the other's edit — the publish function should compare
   `sha` and surface a real conflict.

*No code changes were made. This section is a plan only.*

---

## 9. Anything surprising

### Lovable-specific build config Armature must respect

1. **The lockfile is poisoned for anyone outside Lovable.** `bun.lock` pins **624** tarballs to
   `europe-west1-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache`, which returns **HTTP 403** from
   anywhere else. `bun install` fails outright, and `--registry` does not override it. Any CI,
   local dev machine, or Armature build worker must either delete/regenerate the lockfile (losing
   exact pinning) or be granted access to that registry. **This is the single biggest portability
   blocker in the repo.**
2. **`bunfig.toml` sets `minimumReleaseAge = 86400`** — a 24-hour supply-chain guard that skips
   package versions published less than a day ago, with an explicit allow-list of four
   `@lovable.dev/*` packages. The file comments say to confirm with the user before adding
   entries. Good practice; Armature should keep it.
3. **`vite.config.ts` is a Lovable preset**, `@lovable.dev/vite-tanstack-config`, and its header
   comment lists what is already bundled (TanStack devtools, `tanstackStart`, `viteReact`,
   `tailwindcss`, `tsConfigPaths`, nitro defaulting to a **Cloudflare** target, `VITE_*` env
   injection, the `@` alias, React/TanStack dedupe, error-logger plugins, sandbox port/host
   detection) with a warning that re-adding any of them **breaks the app with duplicate plugins**.
4. **The `NETLIFY=true` output-folder switch** (§1) — `dist/` only on Netlify, `.output/` locally.
   `bun run preview` works only after the Netlify-mode build.
5. **`.lovable/project.json`** pins `template: tanstack_start_ts_current` at a specific revision —
   Lovable may regenerate scaffolding against it.
6. **Five files are marked auto-generated / do-not-edit**: `src/integrations/supabase/client.ts`,
   `client.server.ts`, `auth-middleware.ts`, `cron-auth.ts`, `src/integrations/lovable/index.ts`
   (plus `src/routeTree.gen.ts` and `src/integrations/supabase/types.ts`). Armature must not
   hand-edit these — they will be overwritten.
7. **Error telemetry is wired to the Lovable editor.** `src/lib/lovable-error-reporting.ts` calls
   `window.__lovableEvents?.captureException` and `window.__lovableReportRuntimeError`, which exist
   only inside the editor preview. `src/server.ts` additionally unwraps h3's swallowed
   `{"unhandled":true,"message":"HTTPError"}` 500s into a real HTML error page — a genuinely
   thoughtful piece of work worth preserving.
8. **`src/start.ts` re-adds CSRF protection explicitly**, with a comment noting that *creating*
   `start.ts` opts out of Start's automatic `createCsrfMiddleware`. Anyone editing this file must
   keep `csrfMiddleware` in `requestMiddleware` or server functions lose CSRF protection.

### Security

**No service-role key in client code — the boundary is correct.**
`client.server.ts` reads `SUPABASE_SERVICE_ROLE_KEY` from `process.env`, is lazily instantiated
behind a `Proxy`, and carries an explicit comment: *"Top-level import is safe only in other
`.server.ts` modules — route files and `*.functions.ts` ship to the client bundle."* Nothing
imports `supabaseAdmin` today, so the service-role path is currently unused. The browser client
uses only the publishable key. `.env` contains no service-role key.

Findings, in order of severity:

1. **A real email address is hard-coded in shipped client code.**
   `src/routes/auth.tsx:17-19`:
   ```ts
   const loginAliases: Record<string, string> = { jodicarl25: "treetestprep@gmail.com" };
   ```
   This maps a username to the owner's login email in the **client bundle**, readable by anyone.
   It is the fallback for the `resolve_login_email` RPC that migration `…215225` added and
   migration `…215416` dropped. It leaks a valid admin login identifier and hard-codes a
   per-client secret into shared code — exactly the kind of thing Armature must never replicate
   across tenants. Fix: restore a `SECURITY DEFINER` lookup, or drop username login.
2. **`page_content_overrides` is world-readable** (`GRANT SELECT … TO anon`, `USING (true)`) —
   necessary today because the browser reads it, unnecessary and removable under git-first.
3. **`RoleGate` is cosmetic.** It is a `useEffect` redirect, and `admin.tsx` does not set
   `ssr: false`, so `/admin/*` server-renders a loading shell for anyone. Real protection is RLS,
   which is sound — but nobody should mistake the gate for authorization.
4. **Silent failure modes.** `getPageSeo` returns `{}` if env vars are missing or the query throws
   (`pageSeo.functions.ts:12`, `:31-33`), so a misconfigured Netlify environment silently serves
   default SEO forever with nothing in the logs.
5. **Unbounded public reads.** `usePageContent` selects `*` from `page_content_overrides` for two
   slugs with no `limit`, on every page mount, with `staleTime: 0`.
6. `cron-auth.ts` (`authenticateCronRequest`) is well written — `timingSafeEqual` over SHA-256
   digests, with current/previous secret rotation — but **nothing calls it**, and
   `LOVABLE_CRON_SECRET` is not in `.env`. Dead but harmless.
7. `auth-middleware.ts` exports `requireSupabaseAuth`; **nothing uses it**. `src/start.ts` wires
   `attachSupabaseAuth` instead. Also dead.
8. The `redirect` search param on `/auth/` is correctly validated — `safePath` (`auth.tsx:38-39`)
   requires a leading `/` and rejects `//`, blocking open-redirect. Good.

### Dead code and cruft

| Item | Detail |
| --- | --- |
| **42 of 46 shadcn/ui components unused** | Only `avatar`, `button`, `dropdown-menu`, `sheet` are imported. Unused: `accordion`, `alert`, `alert-dialog`, `aspect-ratio`, `badge`, `breadcrumb`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `context-menu`, `dialog`, `drawer`, `form`, `hover-card`, `input`, `input-otp`, `label`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sidebar`, `skeleton`, `slider`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toggle`, `toggle-group`, `tooltip`. They tree-shake out of the bundle, but they drag in ~30 unused `@radix-ui/*` dependencies plus `recharts`, `embla-carousel-react`, `cmdk`, `vaul`, `react-day-picker`, `input-otp`, `react-resizable-panels` — install time, lockfile size and audit surface for nothing. The site's own FAQ accordion is hand-rolled in `Home.tsx`, not the shadcn `accordion`. |
| `src/components/dashboard/PlaceholderPage.tsx` | Imported nowhere — dead file |
| `src/styles.css` | 144 lines of design tokens, imported by nothing |
| `public/assets/reputation-guardians-logo.webp` | 22.1 KB, referenced nowhere, still shipped |
| `registrations` + `inquiries` tables | Created and seeded in migrations, typed in `types.ts`, touched by no code |
| `src/integrations/supabase/cron-auth.ts` | Complete, correct, uncalled |
| `src/integrations/supabase/auth-middleware.ts` | `requireSupabaseAuth` exported, never used |
| `supabase/migrations/…215225` + `…215416` | A function added and dropped in consecutive migrations, ~3 minutes apart |
| `src/routes/README.md` | Helpful routing-convention doc — worth keeping |
| `src/pages/` vs `src/routes/README.md` | The README explicitly says *"Do not create `src/pages/`"*, yet `src/pages/` exists and holds all seven page components. Harmless (they are plain components imported by routes, not routes themselves) but directly contradicts the in-repo guidance |

### Correctness bugs worth fixing regardless of Armature

1. **`https://wwv.isa-arbor.com/store/product/7/`** (`pageDefaults.ts:357`) — `wwv` should be
   `www`. The "Purchase Book Here" button is broken.
2. **Poppins is never loaded** (§6) — the site does not render in its intended typeface.
3. **`SITE = "https://treetestprep.lovable.app"`** (`pageHead.ts:4`) drives every canonical URL
   and `og:url`; `sitemap.xml`, `robots.txt` and the JSON-LD agree with it. If the production
   domain is `treetestprep.com`, canonical tags are pointing search engines at the staging domain.
4. **No `og:image` anywhere** — all seven `seo.image` defaults are `""` and `pageHead.ts:31`
   requires `https://`, so `summary_large_image` cards render without an image.
5. **`home.course.exam_link`** (`pageDefaults.ts:78`) links off-site to
   `https://treetestprep.com/exam-information/` instead of the internal route — a needless
   external hop from the homepage.
6. **Fragile string splicing in `Home.tsx`.** Lines 80-90 insert links into `exam_note` by
   substring-matching the link labels; lines 37-42 split `hero.schedule` on `·` and strip
   `Dates:` off `hero.dates`. All three break silently if a client edits the copy naturally —
   the link disappears or the formatting collapses. These fields need a richer type (or the
   page needs to stop parsing prose).
7. **Instructor content is outside the content schema.** Bios and photos live in the
   `instructors` table and are not server-rendered (§4), so `/meet-your-instructors/` ships an
   empty roster to non-JS crawlers. Armature should fold this into the page schema as a `list`
   field, or SSR it.
8. **`admin.index.tsx:11-16`** uses `supabase.from(table as never)` with `any` callbacks to build
   generic counts, discarding type safety on five queries.
9. `React.FormEvent` is used in `auth.tsx:23` without importing `React` — fine under
   `jsx: react-jsx` type-only usage, but inconsistent with the rest of the file.

---

## Recommended next steps

1. **Fix the lockfile portability blocker first.** Decide whether Armature builds regenerate
   `bun.lock` against `registry.npmjs.org` or get access to Lovable's private registry. Nothing
   else in the pipeline can be trusted until `bun install` works outside Lovable's sandbox.
2. **Prove the git-first read path on a branch.** Generate `content/pages.json` from
   `PAGE_DEFAULTS`, reduce `pageDefaults.ts` to a typed import of it, strip the Supabase fetch out
   of `usePageCopy`, and verify with `curl` that overridden copy now appears in the raw HTML. This
   is the whole v1 thesis and it is a few hours of work.
3. **Export the existing `page_content_overrides` rows and any `site-media` images before
   touching the table.** That data is the client's live content and it could not be inventoried
   from this sandbox.
4. **Build the publish server function** — `is_staff` check, schema validation, GitHub Contents
   API commit with `sha` conflict handling — and change the editor from per-field Save to a single
   "Publish changes" action so one editing session is one commit and one build.
5. **Settle the Lovable-sync policy.** Publish to a dedicated content branch merged (never
   rebased) into `main`, and tell Lovable via project knowledge not to touch `content/pages.json`.
   Test a deliberate concurrent edit before shipping to a client.
6. **Make the site's domain a setting.** Replace the hard-coded `treetestprep.lovable.app` in
   `pageHead.ts`, `__root.tsx`'s JSON-LD, `sitemap.xml` and `robots.txt` with one configured
   value, and generate the sitemap from `pageSchema.ts` instead of maintaining it by hand.
7. **Close the hard-coded-content gaps** the dashboard cannot reach: the ~20 items in §3b, plus
   the 404/error copy, and fold instructor bios into the page schema so one editor covers
   everything.
8. **Unify the design tokens.** One source for `--navy`/`--green`/`--gold`, consumed by both
   `globals.css` and the dashboard components, so "change the brand colour" is one edit — and
   **load Poppins**, which is the most visible defect on the live site today.
9. **Fix the cheap wins now:** the `wwv.isa-arbor.com` typo, the missing `og:image` defaults, and
   the homepage's off-site exam-information link.
10. **Prune.** Remove the 42 unused shadcn components and their dependencies, `PlaceholderPage.tsx`,
    `src/styles.css`, the orphaned logo asset, and either use or drop `registrations`, `inquiries`,
    `cron-auth.ts` and `auth-middleware.ts`. Then compress the three hero images (1.8 MB of the
    3.1 MB asset budget).
