import { Link } from "@tanstack/react-router";
import { CallToAction, InnerHero, SiteFooter, SiteHeader } from "../components/SiteChrome";

export default function ExamInformation() {
  return (
    <main>
      <SiteHeader activePath="/exam-information/" />
      <InnerHero title="Exam Information" image="/assets/exam-tree.webp" className="exam-hero" />
      <article className="wrap prose-page exam-content">
        <h2>The ISA Certification Process</h2>
        <ol>
          <li>Apply to sit for the exam.</li>
          <li>Once your application is approved, you may register for the exam.</li>
        </ol>
        <p>This process must be completed directly through the ISA. Please note: this course <strong>does not qualify you</strong> to take the exam. It is designed only to help you prepare and increase your chances of passing.</p>

        <h2>Eligibility Course Eligibility</h2>
        <p>To qualify for the ISA Certified Arborist Exam, you must be able to document one of the following:</p>
        <ul>
          <li>Three years of full-time experience in arboriculture</li>
          <li>Two years of full-time experience plus a two-year degree in a related field, including at least two courses directly related to arboriculture</li>
          <li>One year of full-time experience plus a four-year degree in a related field, including at least four courses directly related to arboriculture</li>
          <li>900 hours in an assessment-based certificate program with a minimum of 90 hours directly related to arboriculture, plus two years of full-time practical experience</li>
          <li>1,800 hours in an assessment-based certificate program with a minimum of 180 hours directly related to arboriculture, plus one year of full-time practical experience</li>
        </ul>
        <p><strong>Important:</strong> Exam registration is separate from course registration. The cost of this course does not include the ISA’s exam fee. Students must register and pay for the exam directly through the ISA.</p>

        <h2>How to Apply</h2>
        <p>Submit your application to the ISA here: <a href="https://www.isa-arbor.com/Credentials/Apply-Now/Apply-for-Eligibility">Apply for Eligibility</a>.</p>
        <p>Once your application is approved, you will be able to register for the exam.</p>
        <Link className="button hero-button page-button" to="/class-registration-page/">Register for the course</Link>
      </article>
      <CallToAction />
      <SiteFooter />
    </main>
  );
}
