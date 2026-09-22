import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { usePageCopy } from "@/hooks/usePageContent";
import { armature } from "@/lib/armature";
import { ArmatureSlot } from "@/lib/armature-kit";

function RegistrationTitle() {
  const copy = usePageCopy("registration");
  return (
    <h1 className="registration-title" data-armature-page-title="">
      {copy.text("intro", "title")}
    </h1>
  );
}

function RegistrationOptions() {
  const copy = usePageCopy("registration");
  const inPersonCta = copy.link("in_person", "cta");
  const onlineCta = copy.link("online", "cta");

  return (
    <section className="wrap registration-grid">
      <article className="registration-option">
        <h2>{copy.text("in_person", "heading")}</h2>
        <img src={copy.text("in_person", "image")} alt={copy.plain("in_person", "image_alt")} />
        <a className="registration-link" href={inPersonCta.href}>
          {inPersonCta.label} <span>➜</span>
        </a>
        <p>
          <strong>{copy.text("in_person", "body_one")}</strong>
        </p>
        <p>{copy.text("in_person", "body_two")}</p>
      </article>
      <article className="registration-option">
        <h2>{copy.text("online", "heading")}</h2>
        <img src={copy.text("online", "image")} alt={copy.plain("online", "image_alt")} />
        <a className="registration-link" href={onlineCta.href}>
          {onlineCta.label} <span>➜</span>
        </a>
        <p className="centered">{copy.text("online", "body")}</p>
      </article>
    </section>
  );
}

function RegistrationBook() {
  const copy = usePageCopy("registration");
  const bookCta = copy.link("book", "cta");
  return (
    <section className="wrap book-note">
      <h2>{copy.text("book", "heading")}</h2>
      <a className="button outline-button" href={bookCta.href}>
        {bookCta.label}
      </a>
    </section>
  );
}

armature.registerSiteSection("registration-title", { label: "Registration title", component: RegistrationTitle });
armature.registerSiteSection("registration-options", { label: "Registration options", component: RegistrationOptions });
armature.registerSiteSection("registration-book", { label: "Course book", component: RegistrationBook });

export default function Registration() {
  return (
    <main>
      <SiteHeader activePath="/class-registration-page/" />
      <ArmatureSlot
        slug="registration"
        defaults={["registration-title", "registration-options", "registration-book"]}
      />
      <SiteFooter />
    </main>
  );
}
