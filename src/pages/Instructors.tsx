import { InnerHero, SiteFooter, SiteHeader } from "../components/SiteChrome";

const instructors = [
  {
    name: "Jodi Carlson",
    image: "/assets/instructor-jodi.webp",
    role: "Course Organizer",
    copy: [
      "Jodi is an ISA Certified Arborist, Municipal Specialist and holds the ISA’s Tree Risk Assessment Qualification, Prescription Pruning Qualification, and ASCA’s Tree and Plant Appraisal Qualification. She is currently a City Arborist in a major metropolitan city. She has a Bachelor of Arts in Environmental Studies from Northeastern Illinois University in Chicago.",
      "Jodi founded Tree Test Prep to honor her mentor Ken Menzer.",
    ],
  },
  {
    name: "Walt Warriner",
    image: "/assets/instructor-walt.webp",
    role: "Consulting Arborist & Urban Forester",
    copy: [
      "Walt Warriner is a Consulting Arborist & Urban Forester and has been working in the green industry since 1975. His education includes Agriculture Technology and Business Accounting from the University of Hawaii, and Landscape Architecture from UCLA. He is a Certified Urban & Community Forester, Certified Municipal Arborist, Licensed Pest Control Advisor, Qualified Tree Risk Assessor and Qualified Tree & Plant Appraiser. He works with municipalities, developers, contractors, law firms, insurance agencies and individual homeowners.",
      "Walt has served the industry as a Board Vice President for the International Society of Arboriculture (ISA), past President of the Western Chapter ISA and past President of Street Tree Seminar, Inc. He served as a member of the National Urban and Community Forest Advisory Council from 2011–2017. He is a founding member of the Municipal Forestry Institute where he taught leadership in urban forestry from 2006–2021.",
    ],
  },
  {
    name: "Erica Allen",
    image: "/assets/instructor-erica.webp",
    role: "ISA Certified Arborist",
    copy: [
      "Erica is a City Arborist for a major metropolitan city. She is an ISA TRAQ Certified Arborist, with a Bachelor of Science degree in Earth Sciences from University of California, Santa Cruz. She got her start in utility vegetation management before moving into a role in urban forestry.",
    ],
  },
  {
    name: "Tyler Lehman",
    image: "/assets/instructor-tyler.webp",
    role: "ISA Certified Arborist",
    copy: [
      "Tyler is a City Arborist for a major metropolitan city. He received a B.S. in Environmental and Ecological Sciences from Elon University in North Carolina. After graduating he joined Americorps and worked on a series of different service projects around the US. There he learned a myriad of skills, among them how to use a chainsaw and fell a tree. He then settled in Sacramento, CA, where he decided to begin a career in arboriculture. He worked with Davey Tree and West Coast Arborists as a trimmer.",
    ],
  },
];

export default function Instructors() {
  return (
    <main>
      <SiteHeader activePath="/meet-your-instructors/" />
      <InnerHero
        title="Meet The Instructors"
        subtitle="We are a group of enthusiastic arborists and urban foresters who are raising the bar in the tree care industry."
        image="/assets/instructors-tree.webp"
        className="instructors-hero"
      />
      <section className="wrap instructors-section">
        <h1>Meet the Instructors</h1>
        <p>All of our instructors are ISA Certified Arborists with decades of experience.</p>
        <div className="instructor-list">
          {instructors.map((instructor, index) => (
            <article className={`instructor-card ${index % 2 ? "reverse" : ""}`} key={instructor.name}>
              <img src={instructor.image} alt={instructor.name} />
              <div>
                <h2>{instructor.name}</h2>
                <p className="instructor-role">ISA Certified Arborist</p>
                {instructor.role !== "ISA Certified Arborist" && <h3>{instructor.role}</h3>}
                {instructor.copy.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
