import { InnerHero, SiteFooter, SiteHeader } from "../components/SiteChrome";
import { usePageCopy } from "@/hooks/usePageContent";
import { armature } from "@/lib/armature";
import { ArmatureSlot } from "@/lib/armature-kit";

function ContactHero() {
  const copy = usePageCopy("contact");
  return (
    <InnerHero
      title={copy.text("hero", "title")}
      subtitle={copy.text("hero", "subtitle")}
      image={copy.text("hero", "image")}
      imageField="contact.hero.image"
      className="contact-hero"
    />
  );
}

function ContactMessage() {
  const copy = usePageCopy("contact");
  const cta = copy.link("message", "cta");
  return (
    <section className="wrap contact-message">
      <h1>{copy.text("message", "heading")}</h1>
      <a className="button hero-button" href={cta.href}>
        {cta.label}
      </a>
    </section>
  );
}

armature.registerSiteSection("contact-hero", { label: "Contact hero", component: ContactHero });
armature.registerSiteSection("contact-message", { label: "Contact message", component: ContactMessage });

export default function Contact() {
  return (
    <main>
      <SiteHeader activePath="/contact-us/" />
      <ArmatureSlot slug="contact" defaults={["contact-hero", "contact-message"]} />
      <SiteFooter />
    </main>
  );
}
