import { Link } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { usePageCopy } from "@/hooks/usePageContent";

type WeekRow = {
  week: string;
  title_one: string;
  body_one: string;
  title_two: string;
  body_two: string;
};

export default function CourseOverview() {
  const copy = usePageCopy("course-overview");
  const cardCta = copy.link("card", "cta");
  const weeks = copy.list<WeekRow>("main", "weeks");

  return (
    <main>
      <SiteHeader activePath="/events/location/" />
      <section className="course-overview wrap">
        <div className="course-overview-main">
          <img src={copy.text("main", "image")} alt={copy.text("main", "image_alt")} />
          <h1>{copy.text("main", "title")}</h1>
          <div className="event-meta">
            <span>▣ {copy.text("main", "meta_dates")}</span>
            <span>◷ {copy.text("main", "meta_time")}</span>
            <span>⌖ {copy.text("main", "meta_location")}</span>
          </div>
          <h2>{copy.text("main", "description_heading")}</h2>
          <div className="week-descriptions">
            {weeks.map((week) => (
              <section key={week.week}>
                <h3>{week.week}:</h3>
                <p>
                  <strong>{week.title_one}</strong> – {week.body_one}
                </p>
                {week.title_two && (
                  <p>
                    <strong>{week.title_two}</strong> – {week.body_two}
                  </p>
                )}
              </section>
            ))}
          </div>
        </div>
        <aside className="course-card">
          <h2>{copy.text("card", "heading")}</h2>
          <div>
            <strong>{copy.text("card", "price_label")}</strong>
            <span>{copy.text("card", "price")}</span>
          </div>
          <div>
            <strong>{copy.text("card", "email_label")}</strong>
            <a href={`mailto:${copy.text("card", "email")}`}>{copy.text("card", "email")}</a>
          </div>
          <div>
            <strong>{copy.text("card", "location_label")}</strong>
            <span>{copy.text("card", "location")}</span>
          </div>
          <Link className="button hero-button" to={cardCta.href as string}>
            {cardCta.label}
          </Link>
        </aside>
      </section>
      <SiteFooter />
    </main>
  );
}
