/**
 * Site-level configuration that is not page content.
 *
 * SITE is the origin used to build canonical URLs and og:url. It is kept at its
 * current value deliberately: the production domain is treetestprep.com, but
 * changing it also means updating public/sitemap.xml, public/robots.txt and the
 * JSON-LD in src/routes/__root.tsx, so that decision is handled separately.
 */
export const SITE = "https://treetestprep.lovable.app";
