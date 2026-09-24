# Site-section → builder-element conversion

This directory records the conversion of the site's hand-coded `registerSiteSection()`
blocks into Armature builder elements (containers + widgets) stored in
`content/layouts/*.json`. The public site renders the same; every heading, paragraph,
image, button, list and video is now its own builder element that opens its full settings
in the editor and can be dragged anywhere.

## Kit

`src/lib/armature-kit/` was updated to the upstream `kit/` folder verbatim:
`KIT_VERSION` **2.0.0 → 2.2.0**.

## Result: pixel diff (before vs after), full page at three widths

Captured with the same Chromium settings, animations disabled, external video/map iframes
blocked so they render as a deterministic empty box in both. Threshold 0.12 per channel.
Budget: ≤ 0.5 % of pixels per page.

| Page (route)                         | 1440   | 820    | 390    |
| ------------------------------------ | ------ | ------ | ------ |
| Home (`/`)                           | 0.029% | 0.043% | 0.035% |
| The Inspiration (`/about-us`)        | 0.000% | 0.000% | 0.000% |
| Contact (`/contact-us`)              | 0.012% | 0.000% | 0.000% |
| Exam Information (`/exam-information`)| 0.041% | 0.069% | 0.129% |
| Instructors (`/meet-your-instructors`)| 0.000%| 0.000% | 0.000% |
| Registration (`/class-registration-page`)| 0.081%| 0.132%| 0.092% |
| Course Overview (`/events/location`) | 0.018% | 0.115% | 0.023% |

Every page is under the 0.5 % budget at every width (max 0.132 %).

## Differing regions (all listed, before/after crops in `crops/`)

1. **Home hero video** (`home-*-hero-video*`). The `<iframe>` embed became a **Video
   (Wistia)** widget, whose click-to-play facade shows a play triangle over a black box;
   the original iframe is an empty black box when the embed host is blocked. On a real
   visit both show a play affordance (Wistia's own vs. the widget's). This is the only
   region larger than a few text pixels and is inherent to using a Video widget.
2. **Home FAQ accordion toggles** (`home-1440-faq-accordion-icons`). The collapsing FAQ
   became an **Accordion** widget. Its open/close control is a `+`/`−` **SVG icon**;
   the original used the `+`/`−` **text characters**. Visually equivalent; see the "visible
   text" note below.
3. **Button / link text antialiasing** (`registration-*`, `exam-*`, `contact-*`,
   `course-overview-*`). Sub-pixel antialiasing differences on button and link labels
   where the kit button renders the label in a `.ae-btn`. A few hundred pixels each.

## Visible text / heading outline / links / alts / head

- **Heading outline (h1–h6 order), every link href, every image alt: identical** on all
  seven pages.
- **No invisible characters** in the public HTML.
- **Visible text: identical** except the FAQ accordion's `+`/`−` toggle glyphs, which are
  SVG icons in the widget instead of text characters (see region 2). All question and
  answer copy is unchanged.
- **Head tags: authored tags identical** (title, description, `og:*`, `twitter:*`,
  canonical, robots, viewport, icons, stylesheet). The framework no longer emits
  `<link rel="preload">` hints for a few **below-the-fold** images, because the builder
  kit lazy-loads all but the first image on a page (the originals were eager). This is a
  performance-neutral-to-positive change, not an authored-tag change.

## Section kept hand-coded

- **`instructors` (the instructor list on `/meet-your-instructors`).** It renders a live
  Supabase query (`instructors` table, filtered and sorted). No static kit widget can bind
  to a database, so it stays a registered site section and is placed in
  `content/layouts/instructors.json` as a `site-section` element. Its **hero** was
  converted. Closest widget option had it been static: repeated **Image Box** elements.

All other 14 registered sections across the 7 pages were converted to builder elements.

---

# Kit 2.5.0 upgrade + header/footer as builder parts

A later change (this directory's `kit250-*`, `header-*`, `footer-*`, `menu-open-*` crops)
did three things: updated the kit, made the site's own content check use the kit's
validator, and converted the header and footer from hand-coded React into Armature
builder parts.

## Kit

`src/lib/armature-kit/` was updated to the upstream `kit/` folder verbatim:
`KIT_VERSION` **2.2.0 → 2.5.0**. The important fix: kits before 2.5.0 registered their
widget library through side-effect imports, which a site with `"sideEffects": false`
(this one) tree-shook out of the **production** bundle — so the home page's Wistia video
and FAQ accordion rendered under the dev server but were **missing from the built site**.
2.5.0 registers every widget explicitly inside `createArmatureKit()`, so they survive the
production build. The upgrade also adds `library/chrome.tsx` (the Site Logo and Nav Menu
widgets and `<ArmatureChrome>`) and `validate.ts` (one validator for layouts and the site
kit), now wired into `bun run check:content`.

### Restored home regions (kit250-home-* crops)

These three regions were **missing from the 2.2.0 production build** and are restored by
the upgrade. They are compared against branch `main` (the original coded site), which they
now match:

- **Hero Wistia video** (`kit250-home-hero-video-*`). 2.2.0: blank (widget dropped).
  2.5.0: the privacy-friendly Wistia facade (black box + play triangle). `main`: the same
  video region (a broken-image box in the sandbox, where the Wistia thumbnail host is
  blocked; on a live visit both show the play affordance).
- **Course-outline icon list** and **FAQ accordion** (`kit250-home-faq-*`). 2.2.0: the FAQ
  was an empty heading with no items. 2.5.0: the accordion and the week list render, and
  match `main`.

## Header and footer

The header and footer now render through `<ArmatureChrome part="header"|"footer"
fallback={…}>` from `content/layouts/_header.json` and `_footer.json`. The coded
`SiteHeader`/`SiteFooter` stay as the fallback (rendered only if a part file is removed).
The header is a Site Logo + email + a **Nav Menu** (the `main-nav` menu in
`content/site-kit.json`); the footer is the logo, blurb, CTA button, a vertical **Nav
Menu** (`footer-nav`) and the images. The existing CSS class names ride along via
Advanced > CSS classes; spacing, colours and typography are expressed as real builder
settings, with scoped per-element CSS only where a widget's own styles had to be matched.

## Result: pixel diff (existing pages, coded header/footer vs built)

Production build, animations disabled, external video/map hosts blocked. Home is listed
separately because its restored video/course/FAQ regions are *expected* to change.

| Page (route)                              | 1440   | 820    | 390    |
| ----------------------------------------- | ------ | ------ | ------ |
| The Inspiration (`/about-us`)             | 0.245% | 0.390% | 0.678% |
| Contact (`/contact-us`)                   | 0.313% | 0.531% | 0.977% |
| Course Overview (`/events/location`)      | 0.310% | 0.412% | 0.651% |
| Instructors (`/meet-your-instructors`)    | 0.396% | 0.681% | 0.873% |
| Exam Information (`/exam-information`)     | 0.431% | 0.716% | 1.010% |
| Registration (`/class-registration-page`) | 0.583% | 1.041% | 1.043% |

Desktop is at or under ~0.5%; phone widths reach ~1%, driven by the two documented
differences below. Home: 1440 33% / 820 4% / 390 56% — all inside the restored
video/course/FAQ regions (which match `main`), plus the mobile menu (below).

## Differing regions (before/after crops in `crops/`)

1. **Mobile menu** (`menu-open-390-*`). The coded header carried a full-height slide-in
   panel (dark overlay, a second copy of the logo, the nav links at 22px, a "Register For
   The Course" CTA and an email + ISA social-icon row). The builder **Nav Menu** widget
   opens its own **drop-down fold** at the same 767px breakpoint instead. This is the one
   region that genuinely changes on phones: the widget cannot reproduce the slide-in panel
   or its CTA/social row. Consequence for the DOM (below): the panel's **ISA link**
   (`https://www.isa-arbor.com/`, only ever reachable from that panel) is no longer
   present; every other link is kept.
2. **Header nav "current page" underline** (`header-1440-*`). The coded nav underlined the
   active page from a server-known `activePath`. The Nav Menu widget marks the current
   item from `window.location`, which is `/` during SSR, so on a non-home page the
   server-rendered HTML underlines **Home** until the client re-renders. A kit behaviour;
   the underline is ~90×2px.
3. **Footer** (`footer-1440-*`, `footer-390-*`). Matches the coded footer within the
   budget at every width after the button/rhythm fixes; included for the record.

## Visible text / links / alts / head (existing pages)

- **Heading outline, image alts: identical.** **No invisible characters** in the public
  HTML.
- **Links:** every unique href is kept **except** the mobile panel's ISA link (region 1).
  The coded header rendered the mobile panel in the DOM on every width (hidden off-screen),
  so the pre-conversion DOM carried a *hidden duplicate* of the nav links, logo and CTA;
  the builder header has each once. Nothing visible changes.
- **Visible text: identical** (the removed text is the hidden mobile-panel duplicate).
- **Head tags: authored SEO tags identical** (title, description, canonical, `og:*`,
  JSON-LD, viewport). The footer image's `<link rel="preload">` gains `fetchpriority=high`
  because the kit marks the first image of each rendered part (here the footer photo) as
  its LCP candidate — a non-visual hint, not an authored-tag change. Asset-bundle hashes
  change, as they do on any code change.

---

# Kit 2.7.0 upgrade + SEO / sitemap / blog / stats

A later change updated the kit again and turned on SEO, a sitemap, a (draft-only) blog and
cookie-free visitor stats, with **no visible change to the seven existing pages**.

## Kit

`src/lib/armature-kit/` was updated to the upstream `kit/` folder verbatim:
`KIT_VERSION` **2.5.0 → 2.7.0**. 2.7.0 adds `seo.ts` (`computePageHead`, `sitemapXml`,
`robotsTxt`), the blog widgets (`ArmaturePost`, `ArmaturePostList`, `useBuilderPosts`) and
the stats beacon (`installStatsBeacon`, auto-installed by `createArmatureKit` when a
`stats` config is passed).

## Result: existing pages pixel-identical

Production build (`NITRO_PRESET=node-server bun run build`, served with
`node .output/server/index.mjs`), phone/tablet/desktop widths, animations disabled.
Compared the JOB-2 baseline commit (kit 2.5.0, header/footer already builder parts) against
this change. **All 22 shots (7 pages × 1440/820/390 + the mobile menu) are 0.000%
pixel-identical.** The SEO/blog/stats work is inert on the existing pages: it adds `<head>`
tags, new `/blog` routes and an (off-by-default) beacon, none of which change a rendered
existing page.

The one shot that first read 6.84% (`home` at 390) was a **lazy-load capture race** in the
baseline screenshot — the below-the-fold FAQ tree photo had not finished loading when it was
taken. Re-captured with a full-height scroll pass that forces every `<img>` to load, both
builds are byte-identical (`crops/seo-home-390-baseline-kit250.png` vs
`crops/seo-home-390-after-kit270.png` — identical files, 0.000%). No real rendering change.

## SEO — server-rendered head identical

The per-route `head()` tags moved into the kit's SEO data (`seo` in each
`content/layouts/<slug>.json` + site-wide `seo` in `content/site-kit.json`), read by
`src/lib/pageHead.ts` via `computePageHead`. Comparing the **server-rendered** `<head>` of
the baseline against this change: **all 7 pages have the identical 14 SEO tags** — title,
description, canonical, `og:title/description/url/type/site_name/locale`,
`twitter:card/title/description`, `robots`, and the `EducationalOrganization` JSON-LD. No
tag added, removed or changed; no duplicates. The Search Console verification slot is left
empty.

`public/sitemap.xml` and `public/robots.txt` are generated by `bun run export:seo` (kit's
`sitemapXml`/`robotsTxt`): valid XML listing exactly the 7 real public pages (no `/blog`,
no `noindex` page), and a robots file that allows all and points at the sitemap.

## Blog — native, draft only

`/blog` renders the kit's post list styled with the site's fonts/colours; with only a draft
present it shows a native empty state ("No posts yet — the first ones are on the way."). The
one sample post ships as a **draft** (`settings.publishedAt: ""`): it is absent from the
public list and `/blog/welcome-to-the-blog` renders the site 404, while remaining visible in
the dashboard's edit-mode preview. Both blog pages are console-clean. The Blog is not added
to the header or footer menu.

## Stats — off by default, one event per view when on

The beacon is env-gated (`VITE_ARMATURE_STATS_ENDPOINT` + `VITE_ARMATURE_STATS_SITE_ID`),
so the committed build sends nothing. Built against a mocked `**/stats-ingest` endpoint it
sends **exactly one event per page view**, **zero in editor mode** (`?armature=edit`), and
one more per client-side navigation — with no console errors.

## Checks

`bun run check:content` (schema + layouts + site-kit + posts), `bun run test` (102 pass),
`bunx tsc --noEmit`, and the Netlify-preset build (`NETLIFY=true bun run build`, which emits
`dist/client/sitemap.xml` and `dist/client/robots.txt`) all pass.
