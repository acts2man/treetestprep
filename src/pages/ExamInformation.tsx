import { Link } from "@tanstack/react-router";
import { InnerHero, SiteFooter, SiteHeader } from "../components/SiteChrome";
import { usePageCopy } from "@/hooks/usePageContent";

export default function ExamInformation() {
  const copy = usePageCopy("exam-information");
  const applyCta = copy.link("process", "cta");
  const items = copy.list<{ text: string }>("eligibility", "items");

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
          <li>Apply to sit for the exam.</li>
          <li>Once your application is approved, you may register for the exam.</li>
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
          <strong>Important:</strong> Exam registration is separate from course registration. The
          cost of this course does not include the ISA’s exam fee. Students must register and pay for
          the exam directly through the ISA.
        </p>

        <h2>How to Apply</h2>
        <p>
          Submit your application to the ISA here: <a href={applyCta.href}>{applyCta.label}</a>.
        </p>
        <p>Once your application is approved, you will be able to register for the exam.</p>
        <Link className="button hero-button page-button" to="/class-registration-page/">
          Register for the course
        </Link>
      </article>
      <SiteFooter />
    </main>
  );
}
