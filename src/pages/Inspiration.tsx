import { InnerHero, SiteFooter, SiteHeader } from "../components/SiteChrome";
import { usePageCopy } from "@/hooks/usePageContent";

export default function Inspiration() {
  const copy = usePageCopy("inspiration");
  const paragraphs = copy.list<{ text: string }>("story", "paragraphs");
  const image = copy.text("story", "image");
  const imageAlt = copy.plain("story", "image_alt");

  return (
    <main>
      <SiteHeader activePath="/about-us/" />
      <InnerHero
        title={copy.text("hero", "title")}
        subtitle={copy.text("hero", "subtitle")}
        image={copy.text("hero", "image")}
        imageField="inspiration.hero.image"
        className="inspiration-hero"
      />
      <section className="wrap story-grid">
        <img src={image} alt={imageAlt} />
        <article className="prose-page">
          <h1>{copy.text("story", "title")}</h1>
          <h2>{copy.text("story", "subtitle")}</h2>
          <div className="mobile-inline-image">
            <img src={image} alt={imageAlt} />
          </div>
          {paragraphs.map((paragraph) => (
            <p key={paragraph.text}>{paragraph.text}</p>
          ))}
        </article>
      </section>
      <SiteFooter />
    </main>
  );
}
