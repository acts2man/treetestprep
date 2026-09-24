import { ArmatureChrome, ArmaturePostList, useBuilderPosts } from "@/lib/armature-kit";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";

/**
 * The blog index (/blog). Lists every published post as native cards; a clean empty state
 * shows while there are no published posts (the first post is still a draft). The page
 * wears the site's header and footer and uses the site's fonts and colours (see the
 * `.blog-index` / `.ae-post-*` rules in src/styles/globals.css) so it looks native.
 */
export default function Blog() {
  const posts = useBuilderPosts();
  return (
    <main id="top">
      <ArmatureChrome part="header" fallback={<SiteHeader activePath="/blog/" />} />
      <section className="blog-index">
        <div className="wrap">
          <h1 className="blog-index-title">The Tree Test Prep Blog</h1>
          <p className="blog-index-lead">
            Study tips, exam updates and arboriculture insights for future ISA Certified Arborists.
          </p>
          {posts.length === 0 ? (
            <div className="blog-empty">
              <p>No posts yet — the first ones are on the way. Check back soon.</p>
            </div>
          ) : (
            <ArmaturePostList />
          )}
        </div>
      </section>
      <ArmatureChrome part="footer" fallback={<SiteFooter />} />
    </main>
  );
}
