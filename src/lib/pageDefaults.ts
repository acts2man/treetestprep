/**
 * Baked-in defaults for every field declared in pageSchema.ts.
 * The public pages read these as fallbacks, and the admin editor previews and
 * resets to them, so an empty database always renders the approved website.
 */
export type LinkDefault = { label: string; href: string };
export type DefaultValue = string | LinkDefault | Record<string, string>[];

export const PAGE_DEFAULTS: Record<string, Record<string, Record<string, DefaultValue>>> = {
  shared: {
    header: {
      logo: "/assets/tree-test-prep-logo.webp",
      email: "Treetestprep@gmail.com",
    },
    footer: {
      logo: "/assets/tree-test-prep-logo.webp",
      blurb_one:
        "Take your tree care career to the next level by becoming an ISA Certified Arborist.",
      blurb_two:
        "Let your customers know that you possess the high degree of knowledge that it takes to become certified by the International Society of Arboriculture.",
      cta: { label: "Register For The Course", href: "/class-registration-page/" },
      image: "/assets/flowering-tree-in-bloom-beside-a-marsh-with-hills-behind-it.webp",
      links_heading: "Navigation Links",
      copyright: "© 2026 Tree Test Prep. All Rights Reserved.",
    },
  },
  home: {
    hero: {
      title: "Become An ISA Certified Arborist",
      body: "Take your tree care career to the next level by becoming an ISA Certified Arborist. Let your customers know that you possess the high degree of knowledge that it takes to become certified by the International Society of Arboriculture.",
      schedule: "Tuesdays · 6:00 – 8:30 PM",
      dates: "Dates: Sep 15, 22, 29 · Oct 6, 13, 20, 27 · Nov 3, 2026",
      badge: "/assets/isa-certified-arborist-credential-badge.webp",
      video: "https://fast.wistia.net/embed/iframe/mjst5n61w1?seo=true&videoFoam=true",
      cta: { label: "Register for the course", href: "/class-registration-page/" },
    },
    course: {
      heading:
        "Arborist Certification Study Guide, Fourth Edition is the program material covered in this course",
      weeks: [
        { text: "Week 1: Tree Biology, Tree Identification" },
        { text: "Week 2: Soil Science, Pruning" },
        { text: "Week 3: Water Management, Tree Selection" },
        { text: "Week 4: Installation and Establishment, Tree Nutrition and Fertilizer" },
        { text: "Week 5: Tree Support and Lightning Protection, Urban Forestry" },
        { text: "Week 6: Diagnosis of Plant Disorders, Plant Healthcare" },
        { text: "Week 7: Tree Assessment and Risk Management, Trees and Construction" },
        { text: "Week 8: Tree Worker Safety, Climbing and Working in Trees" },
      ],
      week_nine: "Week 9: Take the Arborist Certification Exam",
      exam_note:
        "You must apply and register separately with the ISA to take the exam. See our Exam Information page for details, or read the ISA’s common questions about certification.",
      cta: { label: "Course Overview", href: "/events/location/" },
      image:
        "/assets/two-mature-trees-at-sunset-with-the-sun-flaring-through-a-wooden-fence.webp",
    },
    faq: {
      heading: "Frequently Asked Question",
      eyebrow: "General Questions",
      image: "/assets/looking-up-at-the-trunk-and-spreading-branches-of-a-large-oak-tree.webp",
      items: [
        {
          question: "How hard is the Certified Arborist exam?",
          answer:
            "The exam can be difficult, but not impossible. By attending this course, you will be more than prepared to pass the exam.",
        },
        {
          question: "How many questions are on the Certified Arborist exam?",
          answer:
            "The computer-based exam contains 200 multiple-choice questions. Candidates should review the current ISA candidate guide for complete testing details.",
        },
        {
          question: "How long is the Certified Arborist exam?",
          answer: "Candidates are given 3.5 hours to complete the Certified Arborist examination.",
        },
        {
          question: "What is a passing score for the Certified Arborist exam?",
          answer:
            "A scaled score of 76 percent is required to pass the Certified Arborist examination.",
        },
      ],
    },
  },
  "course-overview": {
    main: {
      image: "/assets/course-classroom.webp",
      title: "8-Week In-Person and Online Course",
      meta_dates: "Tuesdays, Sep 15 – Nov 3, 2026",
      meta_time: "6:00 – 8:30 PM",
      meta_location: "Sierra 2 Center Curtis Hall 2791 24th St Sacramento, CA 95818",
      description_heading: "Course Description",
    },
    card: {
      heading: "ISA Certified Arborist Prep Course",
      price: "$395",
      email: "Treetestprep@gmail.com",
      location: "Sierra 2 Center Curtis Hall 2791 24th St Sacramento, CA 95818",
      cta: { label: "Register for the course", href: "/class-registration-page/" },
    },
  },
  "exam-information": {
    hero: {
      title: "Exam Information",
      image: "/assets/exam-tree.webp",
    },
    process: {
      heading: "The ISA Certification Process",
      body: "This process must be completed directly through the ISA. Please note: this course does not qualify you to take the exam. It is designed only to help you prepare and increase your chances of passing.",
      cta: {
        label: "Apply for Eligibility",
        href: "https://www.isa-arbor.com/Credentials/Apply-Now/Apply-for-Eligibility",
      },
    },
    eligibility: {
      heading: "Eligibility Course Eligibility",
      intro:
        "To qualify for the ISA Certified Arborist Exam, you must be able to document one of the following:",
      items: [
        { text: "Three years of full-time experience in arboriculture" },
        {
          text: "Two years of full-time experience plus a two-year degree in a related field, including at least two courses directly related to arboriculture",
        },
        {
          text: "One year of full-time experience plus a four-year degree in a related field, including at least four courses directly related to arboriculture",
        },
        {
          text: "900 hours in an assessment-based certificate program with a minimum of 90 hours directly related to arboriculture, plus two years of full-time practical experience",
        },
        {
          text: "1,800 hours in an assessment-based certificate program with a minimum of 180 hours directly related to arboriculture, plus one year of full-time practical experience",
        },
      ],
    },
  },
  inspiration: {
    hero: {
      title: "The Inspiration",
      subtitle:
        "In honor of Ken Menzer, Tree Test Prep was created to help tree care professionals by providing ISA certification training that will help them reach the upper echelons of arboriculture.",
      image: "/assets/ken-menzer-hero.webp",
    },
    story: {
      title: "Ken Menzer",
      subtitle: "The Inspiration Behind Our Mission",
      image: "/assets/ken-menzer-fishing.webp",
      paragraphs: [
        {
          text: "Tree Test Prep was created in honor of Ken Menzer to help aspiring and seasoned tree care professionals become Certified Arborists.",
        },
        {
          text: "Ken was a Community Forester for the Sacramento Tree Foundation, where he grew shade trees for the Community Shade program. He also served the City of Folsom for 11 years as their City Arborist. In that role, he assisted residents with tree care, organized numerous volunteer plantings, and hosted the annual Arborists Breakfast, which brought professionals from across the metropolitan area together for a day of continuing education.",
        },
        {
          text: "As the City Arborist in Folsom, Ken continually encouraged tree care professionals to expand their skills and pursue certification. He was always willing to share his expertise, meeting with professionals to support their growth. His motto was simple: Educate and elevate.",
        },
        { text: "For the last five years of his life, Ken bravely battled non-Hodgkin's lymphoma." },
      ],
    },
  },
  instructors: {
    hero: {
      title: "Meet The Instructors",
      subtitle:
        "We are a group of enthusiastic arborists and urban foresters who are raising the bar in the tree care industry.",
      image: "/assets/instructors-tree.webp",
    },
    intro: {
      heading: "Meet the Instructors",
      body: "All of our instructors are ISA Certified Arborists with decades of experience.",
    },
  },
  contact: {
    hero: {
      title: "Get in Touch",
      subtitle: "Treetestprep@gmail.com",
      image: "/assets/contact-tree.webp",
    },
    message: {
      heading:
        "Have A Question? We're Here To Help. Send Us An Email And A Member Of Our Team Will Get Back To You Within One Business Day.",
      cta: { label: "Email Tree Test Prep", href: "mailto:Treetestprep@gmail.com" },
    },
  },
  registration: {
    intro: {
      title: "Registration For In Person & Online Classes",
    },
    in_person: {
      heading: "In Person Registration",
      image: "/assets/registration-in-person.webp",
      cta: {
        label: "In-Person Registration Link",
        href: "https://buy.stripe.com/8wM8wMbsjfuL5YkfYY",
      },
      body_one: "Class size is limited to 30 participants.",
      body_two:
        "Once the 30 in-person spots are filled, registration for the in-person option will close. You will still be able to register for the online option.",
    },
    online: {
      heading: "Online Class Registration",
      image: "/assets/registration-online.webp",
      cta: {
        label: "Online Class Registration Link",
        href: "https://buy.stripe.com/cN2aEU53V6Yf2M85kl",
      },
      body: "Limited to 100 students",
    },
    book: {
      heading:
        "This course uses the Arborist Certification Study Guide, Fourth Edition By Sharon J. Lilly, Corinne G. Bassett, James Komen, and Lindsey Purcell.",
      cta: { label: "Purchase Book Here", href: "https://wwv.isa-arbor.com/store/product/7/" },
    },
  },
};

export function defaultValue(
  slug: string,
  section: string,
  field: string,
): DefaultValue | undefined {
  return PAGE_DEFAULTS[slug]?.[section]?.[field];
}
