import { InnerHero, SiteFooter, SiteHeader } from "../components/SiteChrome";
import { usePageCopy } from "@/hooks/usePageContent";

export default function Contact() {
  const copy = usePageCopy("contact");
  const cta = copy.link("message", "cta");

  return (
    <main>
      <SiteHeader activePath="/contact-us/" />
      <InnerHero
        title={copy.text("hero", "title")}
        subtitle={copy.text("hero", "subtitle")}
        image={copy.text("hero", "image")}
        imageField="contact.hero.image"
        className="contact-hero"
      />
      <section className="wrap contact-message">
        <h1>{copy.text("message", "heading")}</h1>
        <a className="button hero-button" href={cta.href}>
          {cta.label}
        </a>
      </section>
      <SiteFooter />
    </main>
  );
}
