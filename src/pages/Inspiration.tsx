import { InnerHero, SiteFooter, SiteHeader } from "../components/SiteChrome";
import { usePageCopy } from "@/hooks/usePageContent";
import { armature } from "@/lib/armature";
import { ArmatureSlot } from "@/lib/armature-kit";

function InspirationHero() {
  const copy = usePageCopy("inspiration");
  return (
    <InnerHero
      title={copy.text("hero", "title")}
      subtitle={copy.text("hero", "subtitle")}
      image={copy.text("hero", "image")}
      imageField="inspiration.hero.image"
      className="inspiration-hero"
    />
  );
}

function InspirationStory() {
  const copy = usePageCopy("inspiration");
  const paragraphs = copy.list<{ text: string }>("story", "paragraphs");
  const image = copy.text("story", "image");
  const imageAlt = copy.plain("story", "image_alt");

  return (
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
  );
}

armature.registerSiteSection("inspiration-hero", { label: "Inspiration hero", component: InspirationHero });
armature.registerSiteSection("inspiration-story", { label: "The Ken Menzer story", component: InspirationStory });

export default function Inspiration() {
  return (
    <main>
      <SiteHeader activePath="/about-us/" />
      <ArmatureSlot slug="inspiration" defaults={["inspiration-hero", "inspiration-story"]} />
      <SiteFooter />
    </main>
  );
}
