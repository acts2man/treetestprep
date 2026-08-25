import { Link } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";

const weeks = [
  ["Week 1", "Chapter 1 – Biology", "This session covers tree biology, anatomy and physiology. The presentation addresses tree structure, anatomy and function. Class discussions cover the process of photosynthesis, respiration, transpiration, the vascular system and defense systems.", "Chapter 2 – Tree Identification", "This chapter will give you the basic skills and knowledge to recognize the differences in flowers, fruit, form, bark buds, twigs and leaves."],
  ["Week 2", "Chapter 3 – Soil Science", "Learn the fundamentals of the physical, chemical and biological properties of soil and understand how they affect soil moisture and plant growth, urban soils and improving soil.", "Chapter 4 – Water Management", "Understand how trees absorb water from the soil and return it to the atmosphere and how different conditions affect the process."],
  ["Week 3", "Chapter 5 – Tree Nutrition and Fertilization", "Learn about the essential elements needed for trees to function and grow in urban landscapes and in a forest setting.", "Chapter 6 – Tree Selection", "This chapter covers the process for determining the appropriate and inappropriate tree species for a location."],
  ["Week 4", "Chapter 7 – Installation and Establishment", "In this lesson you will learn the best practices for transport, planting and care of newly planted trees. Successful establishment of new trees depends on proper planting techniques and the right early care for each stock type.", "Chapter 8 – Pruning", "Learn about the seven different pruning systems and the importance of the landscape needs and the client’s goals in deciding which system is best for each tree."],
  ["Week 5", "Chapter 9 – Tree Support and Lightning Protection", "Cabling, bracing, guying, and propping provide reinforcement for heavy loads and need routine inspection and maintenance. This chapter discusses each method and which is right for the job.", "Chapter 10 – Diagnosis and Plant Disorders", "The differences between signs and symptoms, biotic and abiotic, the importance of species, invasive pests and getting help from a lab are all taught in this chapter."],
  ["Week 6", "Chapter 11 – Plant Healthcare", "Health, structure and appearance are managed with a comprehensive program that includes strategy options of biological, chemical and/or cultural control. Learn which is best for your tree.", "Chapter 12 – Tree Risk Assessment and Management", "This chapter will explain the systematic process of identifying and evaluating tree risk and the tools used in different assessment levels. It will also get you thinking about your next credential, TRAQ."],
  ["Week 7", "Chapter 13 – Trees and Construction", "Learn how trees are damaged by construction and how to protect and preserve them, as well as remediation when the damage has already been done.", "Chapter 14 – Urban Forestry", "Urban foresters differ from arborists in that they work with individuals in related and unrelated fields to manage the planting, removal, health, risk and sustainability of the trees while working within the context of the city’s tree protection ordinance. Maybe another introduction to your next credential, Certified Urban Forester."],
  ["Week 8", "Chapter 15 – Tree Worker Safety", "Every year OSHA ranks Tree Worker in the top five most dangerous jobs. This chapter explains why and gives the basics of safety standards, personal protective equipment, good communication, electrical hazards, chainsaw and chipper safety, and others.", "Chapter 16 – Climbing and Working in Trees", "Learn about a climber’s PPE and fall protection and their limitations, common knots used in climbing and rigging, and aerial rescue."],
] as const;

export default function CourseOverview() {
  return (
    <main>
      <SiteHeader activePath="/events/location/" />
      <section className="course-overview wrap">
        <div className="course-overview-main">
          <img src="/assets/course-classroom.webp" alt="Students attending an arborist preparation course" />
          <h1>8-Week In-Person and Online Course</h1>
          <div className="event-meta">
            <span>▣ Tuesdays, Sep 15 – Nov 3, 2026</span>
            <span>◷ 6:00 – 8:30 PM</span>
            <span>⌖ Sierra 2 Center Curtis Hall 2791 24th St Sacramento, CA 95818</span>
          </div>
          <h2>Course Description</h2>
          <div className="week-descriptions">
            {weeks.map(([week, firstTitle, firstCopy, secondTitle, secondCopy]) => (
              <section key={week}>
                <h3>{week}:</h3>
                <p><strong>{firstTitle}</strong> – {firstCopy}</p>
                <p><strong>{secondTitle}</strong> – {secondCopy}</p>
              </section>
            ))}
          </div>
        </div>
        <aside className="course-card">
          <h2>ISA Certified Arborist Prep Course</h2>
          <div><strong>Course Price</strong><span>$395</span></div>
          <div><strong>Email</strong><a href="mailto:Treetestprep@gmail.com">Treetestprep@gmail.com</a></div>
          <div><strong>Location</strong><span>Sierra 2 Center Curtis Hall 2791 24th St Sacramento, CA 95818</span></div>
          <Link className="button hero-button" to="/class-registration-page/">Register for the course</Link>
        </aside>
      </section>
      <SiteFooter />
    </main>
  );
}
