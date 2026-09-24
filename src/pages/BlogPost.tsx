import { ArmatureChrome, ArmaturePost, useKitSnapshot } from "@/lib/armature-kit";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { NotFound } from "../components/NotFound";

/**
 * A single blog post (/blog/<slug>). Renders the post's builder layout through the kit
 * (which uses the site's fonts and colours), inside the site's header and footer. A draft
 * or scheduled post is not public, so it shows the site's 404 here — it is still visible in
 * the Armature dashboard's edit-mode preview.
 */
export default function BlogPost({ slug }: { slug: string }) {
  const { posts } = useKitSnapshot();
  const post = posts[slug];
  const published = !!(post && post.settings.publishedAt && Date.parse(post.settings.publishedAt) <= Date.now());
  return (
    <main id="top">
      <ArmatureChrome part="header" fallback={<SiteHeader activePath="/blog/" />} />
      {published ? (
        <article className="blog-post">
          <ArmaturePost slug={slug} />
        </article>
      ) : (
        <NotFound />
      )}
      <ArmatureChrome part="footer" fallback={<SiteFooter />} />
    </main>
  );
}
