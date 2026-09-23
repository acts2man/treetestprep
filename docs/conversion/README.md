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
