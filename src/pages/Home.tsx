import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CallToAction, SiteFooter, SiteHeader } from "../components/SiteChrome";

const weeks = [
  "Week 1: Tree Biology, Tree Identification",
  "Week 2: Soil Science, Pruning",
  "Week 3: Water Management, Tree Selection",
  "Week 4: Installation and Establishment, Tree Nutrition and Fertilizer",
  "Week 5: Tree Support and Lightning Protection, Urban Forestry",
  "Week 6: Diagnosis of Plant Disorders, Plant Healthcare",
  "Week 7: Tree Assessment and Risk Management, Trees and Construction",
  "Week 8: Tree Worker Safety, Climbing and Working in Trees",
];

const faqs = [
  [
    "How hard is the Certified Arborist exam?",
    "The exam can be difficult, but not impossible. By attending this course, you will be more than prepared to pass the exam.",
  ],
  [
    "How many questions are on the Certified Arborist exam?",
    "The computer-based exam contains 200 multiple-choice questions. Candidates should review the current ISA candidate guide for complete testing details.",
  ],
  [
    "How long is the Certified Arborist exam?",
    "Candidates are given 3.5 hours to complete the Certified Arborist examination.",
  ],
  [
    "What is a passing score for the Certified Arborist exam?",
    "A scaled score of 76 percent is required to pass the Certified Arborist examination.",
  ],
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <main id="top">
      <SiteHeader activePath="/" />

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-shade" />
        <div className="wrap hero-inner">
          <h1 id="hero-title">Become An ISA Certified Arborist</h1>
          <div className="hero-grid">
            <img
              className="credential"
              src="/assets/isa-certified-arborist-credential-badge.webp"
              alt="ISA Certified Arborist credential badge"
            />
            <div className="hero-copy">
              <p>
                Take your tree care career to the next level by becoming an ISA Certified Arborist. Let your customers know that you possess the high degree of knowledge that it takes to become certified by the International Society of Arboriculture.
              </p>
              <p><strong>Tuesdays</strong> · 6:00 – 8:30 PM</p>
              <p><strong>Dates:</strong> Sep 15, 22, 29 · Oct 6, 13, 20, 27 · Nov 3, 2026</p>
            </div>
            <div className="video-column">
              <div className="video-frame">
                <iframe
                  src="https://fast.wistia.net/embed/iframe/mjst5n61w1?seo=true&videoFoam=true"
                  title="Tree Test Prep course video"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              </div>
              <Link className="button hero-button" to="/class-registration-page/">Register for the course</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="course wrap" id="course">
        <div className="course-copy">
          <h2>Arborist Certification Study Guide, Fourth Edition is the program material covered in this course</h2>
          <ul className="week-list">
            {weeks.map((week) => <li key={week}>{week}</li>)}
          </ul>
          <div className="week-nine">
            <span>Week 9: Take the Arborist Certification Exam</span>
          </div>
          <p className="exam-note" id="exam">
            You must apply and register separately with the ISA to take the exam. See our <a href="https://treetestprep.com/exam-information/">Exam Information page</a> for details, or read the <a href="https://www.isa-arbor.com/Credentials/Common-Questions">ISA’s common questions about certification</a>.
          </p>
          <Link className="button outline-button" to="/events/location/">Course Overview</Link>
        </div>
        <img
          className="course-image"
          src="/assets/two-mature-trees-at-sunset-with-the-sun-flaring-through-a-wooden-fence.webp"
          alt="Two mature trees at sunset with the sun flaring through a wooden fence"
        />
      </section>

      <section className="faq-section" id="inspiration">
        <div className="wrap faq-grid">
          <img
            className="faq-image"
            src="/assets/looking-up-at-the-trunk-and-spreading-branches-of-a-large-oak-tree.webp"
            alt="Looking up at the trunk and spreading branches of a large oak tree"
          />
          <div className="faq-content">
            <h2>Frequently Asked Question</h2>
            <p className="eyebrow">General Questions</p>
            <div className="accordion">
              {faqs.map(([question, answer], index) => {
                const isOpen = openFaq === index;
                return (
                  <div className={`faq-item ${isOpen ? "open" : ""}`} key={question}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    >
                      <span>{question}</span>
                      <span className="faq-icon" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen && <div className="answer">{answer}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <CallToAction />
      <SiteFooter />
    </main>
  );
}
