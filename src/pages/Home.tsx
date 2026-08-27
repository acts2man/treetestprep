import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { usePageCopy } from "@/hooks/usePageContent";

export default function Home() {
  const [openFaq, setOpenFaq] = useState(0);
  const copy = usePageCopy("home");

  const weeks = copy.list<{ text: string }>("course", "weeks");
  const faqs = copy.list<{ question: string; answer: string }>("faq", "items");
  const heroCta = copy.link("hero", "cta");
  const courseCta = copy.link("course", "cta");
  const examNote = copy.text("course", "exam_note");
  const examLink = copy.link("course", "exam_link");
  const isaLink = copy.link("course", "isa_link");
  const courseImageAlt = copy.text("course", "image_alt");
  const faqImageAlt = copy.text("faq", "image_alt");

  return (
    <main id="top">
      <SiteHeader activePath="/" />

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-shade" />
        <div className="wrap hero-inner">
          <h1 id="hero-title">{copy.text("hero", "title")}</h1>
          <div className="hero-grid">
            <img
              className="credential"
              src={copy.text("hero", "badge")}
              alt={copy.text("hero", "badge_alt")}
            />
            <div className="hero-copy">
              <p>{copy.text("hero", "body")}</p>
              <p>
                <strong>{copy.text("hero", "schedule").split("·")[0]?.trim()}</strong> ·{" "}
                {copy.text("hero", "schedule").split("·").slice(1).join("·").trim()}
              </p>
              <p>
                <strong>Dates:</strong>{" "}
                {copy.text("hero", "dates").replace(/^Dates:\s*/i, "")}
              </p>
            </div>
            <div className="video-column">
              <div className="video-frame">
                <iframe
                  src={copy.text("hero", "video")}
                  title={copy.text("hero", "video_title")}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              </div>
              <Link className="button hero-button" to={heroCta.href as string}>
                {heroCta.label}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="course wrap" id="course">
        <div className="course-copy">
          <h2>{copy.text("course", "heading")}</h2>
          <div className="mobile-inline-image">
            <img
              src={copy.text("course", "image")}
              alt={courseImageAlt}
            />
          </div>
          <ul className="week-list">
            {weeks.map((week) => (
              <li key={week.text}>{week.text}</li>
            ))}
          </ul>
          <div className="week-nine">
            <span>{copy.text("course", "week_nine")}</span>
          </div>
          <p className="exam-note" id="exam">
            {examNote.includes(examLink.label) ? (
              <>
                {examNote.split(examLink.label)[0]}
                <a href={examLink.href}>{examLink.label}</a>
                {examNote.split(examLink.label)[1]?.split(isaLink.label)[0]}
                {examNote.includes(isaLink.label) && <a href={isaLink.href}>{isaLink.label}</a>}
                {examNote.split(isaLink.label)[1]}
              </>
            ) : (
              examNote
            )}
          </p>
          <Link className="button outline-button" to={courseCta.href as string}>
            {courseCta.label}
          </Link>
        </div>
        <img
          className="course-image"
          src={copy.text("course", "image")}
          alt={courseImageAlt}
        />
      </section>

      <section className="faq-section" id="inspiration">
        <div className="wrap faq-grid">
          <img
            className="faq-image"
            src={copy.text("faq", "image")}
            alt={faqImageAlt}
          />
          <div className="faq-content">
            <h2>{copy.text("faq", "heading")}</h2>
            <div className="mobile-inline-image">
              <img
                src={copy.text("faq", "image")}
                alt={faqImageAlt}
              />
            </div>
            <p className="eyebrow">{copy.text("faq", "eyebrow")}</p>
            <div className="accordion">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div className={`faq-item ${isOpen ? "open" : ""}`} key={faq.question}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    >
                      <span>{faq.question}</span>
                      <span className="faq-icon" aria-hidden="true">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    {isOpen && <div className="answer">{faq.answer}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
