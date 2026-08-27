import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { usePageCopy } from "@/hooks/usePageContent";

export default function Registration() {
  const copy = usePageCopy("registration");
  const inPersonCta = copy.link("in_person", "cta");
  const onlineCta = copy.link("online", "cta");
  const bookCta = copy.link("book", "cta");

  return (
    <main>
      <SiteHeader activePath="/class-registration-page/" />
      <h1 className="registration-title">{copy.text("intro", "title")}</h1>
      <section className="wrap registration-grid">
        <article className="registration-option">
          <h2>{copy.text("in_person", "heading")}</h2>
          <img
            src={copy.text("in_person", "image")}
            alt={copy.text("in_person", "image_alt")}
          />
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
          <img src={copy.text("online", "image")} alt={copy.text("online", "image_alt")} />
          <a className="registration-link" href={onlineCta.href}>
            {onlineCta.label} <span>➜</span>
          </a>
          <p className="centered">{copy.text("online", "body")}</p>
        </article>
      </section>
      <section className="wrap book-note">
        <h2>{copy.text("book", "heading")}</h2>
        <a className="button outline-button" href={bookCta.href}>
          {bookCta.label}
        </a>
      </section>
      <SiteFooter />
    </main>
  );
}
