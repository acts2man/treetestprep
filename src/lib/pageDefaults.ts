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
      logo_alt: "Tree Test Prep",
      email: "Treetestprep@gmail.com",
      nav: [
        { label: "Home", href: "/" },
        { label: "Course Overview", href: "/events/location/" },
        { label: "Exam Information", href: "/exam-information/" },
        { label: "The Inspiration", href: "/about-us/" },
        { label: "Meet The Instructors", href: "/meet-your-instructors/" },
        { label: "Contact Us", href: "/contact-us/" },
        { label: "Register", href: "/class-registration-page/" },
      ],
      mobile_cta: { label: "Register For The Course", href: "/class-registration-page/" },
      isa_url: "https://www.isa-arbor.com/",
    },
    footer: {
      logo: "/assets/tree-test-prep-logo.webp",
      blurb_one:
        "Take your tree care career to the next level by becoming an ISA Certified Arborist.",
      blurb_two:
        "Let your customers know that you possess the high degree of knowledge that it takes to become certified by the International Society of Arboriculture.",
      cta: { label: "Register For The Course", href: "/class-registration-page/" },
      image: "/assets/flowering-tree-in-bloom-beside-a-marsh-with-hills-behind-it.webp",
      image_alt: "Flowering tree in bloom beside a marsh with hills behind it",
      links_heading: "Navigation Links",
      copyright: "© 2026 Tree Test Prep. All Rights Reserved.",
      privacy: { label: "Privacy Policy", href: "https://treetestprep.com/privacy-policy" },
      terms: { label: "Terms of Service", href: "https://treetestprep.com/terms-of-service" },
      credit_prefix: "Site designed by",
      credit: { label: "Reputation Guardians", href: "https://reputationguardians.net/" },
    },
  },
  home: {
    seo: {
      title: "ISA Certified Arborist Exam Prep Course | Tree Test Prep",
      description:
        "Pass the ISA Certified Arborist exam with an 8-week instructor-led prep course in Sacramento, CA or live online \u2014 chapter-by-chapter study guide included.",
      image: "",
    },
    hero: {
      title: "Become An ISA Certified Arborist",
      body: "Take your tree care career to the next level by becoming an ISA Certified Arborist. Let your customers know that you possess the high degree of knowledge that it takes to become certified by the International Society of Arboriculture.",
      schedule: "Tuesdays · 6:00 – 8:30 PM",
      dates: "Dates: Sep 15, 22, 29 · Oct 6, 13, 20, 27 · Nov 3, 2026",
      badge: "/assets/isa-certified-arborist-credential-badge.webp",
      badge_alt: "ISA Certified Arborist credential badge",
      video_title: "Tree Test Prep course video",
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
      exam_link: { label: "Exam Information page", href: "https://treetestprep.com/exam-information/" },
      isa_link: {
        label: "ISA\u2019s common questions about certification",
        href: "https://www.isa-arbor.com/Credentials/Common-Questions",
      },
      cta: { label: "Course Overview", href: "/events/location/" },
      image:
        "/assets/two-mature-trees-at-sunset-with-the-sun-flaring-through-a-wooden-fence.webp",
      image_alt: "Two mature trees at sunset with the sun flaring through a wooden fence",
    },
    faq: {
      heading: "Frequently Asked Question",
      eyebrow: "General Questions",
      image: "/assets/looking-up-at-the-trunk-and-spreading-branches-of-a-large-oak-tree.webp",
      image_alt: "Looking up at the trunk and spreading branches of a large oak tree",
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
    seo: {
      title: "8-Week Arborist Prep Course Overview | Tree Test Prep",
      description:
        "Week-by-week breakdown of the ISA Certified Arborist prep course: dates, times, Sacramento location, price and every chapter covered.",
      image: "",
    },
    main: {
      image: "/assets/course-classroom.webp",
      image_alt: "Students attending an arborist preparation course",
      title: "8-Week In-Person and Online Course",
      meta_dates: "Tuesdays, Sep 15 – Nov 3, 2026",
      meta_time: "6:00 – 8:30 PM",
      meta_location: "Sierra 2 Center Curtis Hall 2791 24th St Sacramento, CA 95818",
      description_heading: "Course Description",
      weeks: [
        {
          week: "Week 1",
          title_one: "Chapter 1 – Biology",
          body_one: "This session covers tree biology, anatomy and physiology. The presentation addresses tree structure, anatomy and function. Class discussions cover the process of photosynthesis, respiration, transpiration, the vascular system and defense systems.",
          title_two: "Chapter 2 – Tree Identification",
          body_two: "This chapter will give you the basic skills and knowledge to recognize the differences in flowers, fruit, form, bark buds, twigs and leaves.",
        },
        {
          week: "Week 2",
          title_one: "Chapter 3 – Soil Science",
          body_one: "Learn the fundamentals of the physical, chemical and biological properties of soil and understand how they affect soil moisture and plant growth, urban soils and improving soil.",
          title_two: "Chapter 4 – Water Management",
          body_two: "Understand how trees absorb water from the soil and return it to the atmosphere and how different conditions affect the process.",
        },
        {
          week: "Week 3",
          title_one: "Chapter 5 – Tree Nutrition and Fertilization",
          body_one: "Learn about the essential elements needed for trees to function and grow in urban landscapes and in a forest setting.",
          title_two: "Chapter 6 – Tree Selection",
          body_two: "This chapter covers the process for determining the appropriate and inappropriate tree species for a location.",
        },
        {
          week: "Week 4",
          title_one: "Chapter 7 – Installation and Establishment",
          body_one: "In this lesson you will learn the best practices for transport, planting and care of newly planted trees. Successful establishment of new trees depends on proper planting techniques and the right early care for each stock type.",
          title_two: "Chapter 8 – Pruning",
          body_two: "Learn about the seven different pruning systems and the importance of the landscape needs and the client’s goals in deciding which system is best for each tree.",
        },
        {
          week: "Week 5",
          title_one: "Chapter 9 – Tree Support and Lightning Protection",
          body_one: "Cabling, bracing, guying, and propping provide reinforcement for heavy loads and need routine inspection and maintenance. This chapter discusses each method and which is right for the job.",
          title_two: "Chapter 10 – Diagnosis and Plant Disorders",
          body_two: "The differences between signs and symptoms, biotic and abiotic, the importance of species, invasive pests and getting help from a lab are all taught in this chapter.",
        },
        {
          week: "Week 6",
          title_one: "Chapter 11 – Plant Healthcare",
          body_one: "Health, structure and appearance are managed with a comprehensive program that includes strategy options of biological, chemical and/or cultural control. Learn which is best for your tree.",
          title_two: "Chapter 12 – Tree Risk Assessment and Management",
          body_two: "This chapter will explain the systematic process of identifying and evaluating tree risk and the tools used in different assessment levels. It will also get you thinking about your next credential, TRAQ.",
        },
        {
          week: "Week 7",
          title_one: "Chapter 13 – Trees and Construction",
          body_one: "Learn how trees are damaged by construction and how to protect and preserve them, as well as remediation when the damage has already been done.",
          title_two: "Chapter 14 – Urban Forestry",
          body_two: "Urban foresters differ from arborists in that they work with individuals in related and unrelated fields to manage the planting, removal, health, risk and sustainability of the trees while working within the context of the city’s tree protection ordinance. Maybe another introduction to your next credential, Certified Urban Forester.",
        },
        {
          week: "Week 8",
          title_one: "Chapter 15 – Tree Worker Safety",
          body_one: "Every year OSHA ranks Tree Worker in the top five most dangerous jobs. This chapter explains why and gives the basics of safety standards, personal protective equipment, good communication, electrical hazards, chainsaw and chipper safety, and others.",
          title_two: "Chapter 16 – Climbing and Working in Trees",
          body_two: "Learn about a climber’s PPE and fall protection and their limitations, common knots used in climbing and rigging, and aerial rescue.",
        },
      ],
    },
    card: {
      heading: "ISA Certified Arborist Prep Course",
      price_label: "Course Price",
      price: "$395",
      email_label: "Email",
      email: "Treetestprep@gmail.com",
      location_label: "Location",
      location: "Sierra 2 Center Curtis Hall 2791 24th St Sacramento, CA 95818",
      cta: { label: "Register for the course", href: "/class-registration-page/" },
    },
  },
  "exam-information": {
    seo: {
      title: "ISA Certified Arborist Exam Information & Eligibility | Tree Test Prep",
      description:
        "How the ISA Certified Arborist exam works, eligibility requirements, and how to apply and register directly with the ISA.",
      image: "",
    },
    hero: {
      title: "Exam Information",
      image: "/assets/exam-tree.webp",
    },
    process: {
      heading: "The ISA Certification Process",
      steps: [
        { text: "Apply to sit for the exam." },
        { text: "Once your application is approved, you may register for the exam." },
      ],
      body: "This process must be completed directly through the ISA. Please note: this course does not qualify you to take the exam. It is designed only to help you prepare and increase your chances of passing.",
      cta: {
        label: "Apply for Eligibility",
        href: "https://www.isa-arbor.com/Credentials/Apply-Now/Apply-for-Eligibility",
      },
    },
    eligibility: {
      heading: "Course Eligibility",
      intro:
        "To qualify for the ISA Certified Arborist Exam, you must be able to document one of the following:",
      note_label: "Important:",
      note: "Exam registration is separate from course registration. The cost of this course does not include the ISA\u2019s exam fee. Students must register and pay for the exam directly through the ISA.",
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
    apply: {
      heading: "How to Apply",
      intro: "Submit your application to the ISA here:",
      body: "Once your application is approved, you will be able to register for the exam.",
      cta: { label: "Register for the course", href: "/class-registration-page/" },
    },
  },
  inspiration: {
    seo: {
      title: "The Inspiration Behind Tree Test Prep | Ken Menzer",
      description:
        "Tree Test Prep was created in honor of Ken Menzer, City Arborist and Community Forester, to help tree care professionals become Certified Arborists.",
      image: "",
    },
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
      image_alt: "Ken Menzer fishing on the ocean",
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
    seo: {
      title: "Meet Your Arborist Instructors | Tree Test Prep",
      description:
        "Learn from ISA Certified Arborists and urban forestry professionals with decades of field, municipal, and teaching experience.",
      image: "",
    },
    hero: {
      title: "Meet The Instructors",
      subtitle:
        "We are a group of enthusiastic arborists and urban foresters who are raising the bar in the tree care industry.",
      image: "/assets/instructors-tree.webp",
    },
    intro: {
      heading: "Meet the Instructors",
      body: "All of our instructors are ISA Certified Arborists with decades of experience.",
      role_label: "ISA Certified Arborist",
    },
  },
  contact: {
    seo: {
      title: "Contact Tree Test Prep | Arborist Exam Prep Questions",
      description:
        "Questions about the ISA Certified Arborist prep course? Email Tree Test Prep and a member of our team will reply within one business day.",
      image: "",
    },
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
    seo: {
      title: "Register For The Arborist Prep Course | In Person & Online",
      description:
        "Register for the ISA Certified Arborist prep course in Sacramento or online. In-person seats are limited to 30 participants.",
      image: "",
    },
    intro: {
      title: "Registration For In Person & Online Classes",
    },
    in_person: {
      heading: "In Person Registration",
      image: "/assets/registration-in-person.webp",
      image_alt: "Students attending an in-person arborist course",
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
      image_alt: "Students participating in an online class",
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
