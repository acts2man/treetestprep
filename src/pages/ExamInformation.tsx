import { Link } from "@tanstack/react-router";
import { InnerHero, SiteFooter, SiteHeader } from "../components/SiteChrome";
import { usePageCopy } from "@/hooks/usePageContent";

export default function ExamInformation() {
  const copy = usePageCopy("exam-information");
  const applyCta = copy.link("process", "cta");
  const registerCta = copy.link("apply", "cta");
  const items = copy.list<{ text: string }>("eligibility", "items");
  const steps = copy.list<{ text: string }>("process", "steps");
  const internalRegister = registerCta.href.startsWith("/");

  return (
    <main>
      <SiteHeader activePath="/exam-information/" />
      <InnerHero
        title={copy.text("hero", "title")}
        image={copy.text("hero", "image")}
        className="exam-hero"
      />
      <article className="wrap prose-page exam-content">
        <h2>{copy.text("process", "heading")}</h2>
        <ol>
          {steps.map((step) => (
            <li key={step.text}>{step.text}</li>
          ))}
        </ol>
        <p>{copy.text("process", "body")}</p>

        <h2>{copy.text("eligibility", "heading")}</h2>
        <p>{copy.text("eligibility", "intro")}</p>
        <ul>
          {items.map((item) => (
            <li key={item.text}>{item.text}</li>
          ))}
        </ul>
        <p>
          <strong>{copy.text("eligibility", "note_label")}</strong>{" "}
          {copy.text("eligibility", "note")}
        </p>

        <h2>{copy.text("apply", "heading")}</h2>
        <p>
          {copy.text("apply", "intro")} <a href={applyCta.href}>{applyCta.label}</a>.
        </p>
        <p>{copy.text("apply", "body")}</p>
        {internalRegister ? (
          <Link className="button hero-button page-button" to={registerCta.href}>
            {registerCta.label}
          </Link>
        ) : (
          <a className="button hero-button page-button" href={registerCta.href}>
            {registerCta.label}
          </a>
        )}
      </article>
      <SiteFooter />
    </main>
  );
}
