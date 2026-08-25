export type FieldType = "text" | "textarea" | "image" | "video" | "url" | "link" | "list";

export type PageField = {
  key: string;
  label: string;
  type: FieldType;
  /** For list fields: the shape of each item. */
  itemFields?: { key: string; label: string; type: "text" | "textarea" | "image" | "url" }[];
};

export type PageSection = {
  key: string;
  label: string;
  fields: PageField[];
};

export type PageDefinition = {
  slug: string;
  label: string;
  path: string;
  description: string;
  sections: PageSection[];
};

const textField = (key: string, label: string): PageField => ({ key, label, type: "text" });
const areaField = (key: string, label: string): PageField => ({ key, label, type: "textarea" });
const imageField = (key: string, label: string): PageField => ({ key, label, type: "image" });
const linkField = (key: string, label: string): PageField => ({ key, label, type: "link" });

export const SHARED_SCHEMA: PageDefinition = {
  slug: "shared",
  label: "Header & Footer",
  path: "/",
  description: "Logo, contact email and footer content used on every page.",
  sections: [
    {
      key: "header",
      label: "Header",
      fields: [imageField("logo", "Logo"), textField("email", "Contact email")],
    },
    {
      key: "footer",
      label: "Footer",
      fields: [
        imageField("logo", "Footer logo"),
        areaField("blurb_one", "First paragraph"),
        areaField("blurb_two", "Second paragraph"),
        linkField("cta", "Footer button"),
        imageField("image", "Footer photo"),
        textField("links_heading", "Navigation heading"),
        textField("copyright", "Copyright line"),
      ],
    },
  ],
};

export const PAGE_SCHEMA: PageDefinition[] = [
  {
    slug: "home",
    label: "Home",
    path: "/",
    description: "Hero, course outline and FAQ on the front page.",
    sections: [
      {
        key: "hero",
        label: "Hero",
        fields: [
          textField("title", "Headline"),
          areaField("body", "Intro paragraph"),
          textField("schedule", "Schedule line"),
          textField("dates", "Dates line"),
          imageField("badge", "Credential badge"),
          { key: "video", label: "Wistia video embed URL", type: "video" },
          linkField("cta", "Hero button"),
        ],
      },
      {
        key: "course",
        label: "Course outline",
        fields: [
          areaField("heading", "Section heading"),
          {
            key: "weeks",
            label: "Weekly topics",
            type: "list",
            itemFields: [{ key: "text", label: "Week", type: "text" }],
          },
          textField("week_nine", "Final week line"),
          areaField("exam_note", "Exam note"),
          linkField("cta", "Section button"),
          imageField("image", "Section photo"),
        ],
      },
      {
        key: "faq",
        label: "FAQ",
        fields: [
          textField("heading", "Heading"),
          textField("eyebrow", "Eyebrow label"),
          imageField("image", "FAQ photo"),
          {
            key: "items",
            label: "Questions",
            type: "list",
            itemFields: [
              { key: "question", label: "Question", type: "text" },
              { key: "answer", label: "Answer", type: "textarea" },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "course-overview",
    label: "Course Overview",
    path: "/events/location/",
    description: "Location, dates and what the course covers.",
    sections: [
      {
        key: "hero",
        label: "Course header",
        fields: [
          imageField("image", "Classroom photo"),
          textField("title", "Headline"),
          textField("meta_dates", "Dates line"),
          textField("meta_time", "Time line"),
          textField("meta_location", "Location line"),
          textField("description_heading", "Description heading"),
        ],
      },
      {
        key: "card",
        label: "Course card",
        fields: [
          textField("heading", "Card heading"),
          textField("price", "Course price"),
          textField("email", "Email"),
          textField("location", "Location"),
          linkField("cta", "Card button"),
        ],
      },

    ],
  },
  {
    slug: "exam-information",
    label: "Exam Information",
    path: "/exam-information/",
    description: "ISA certification process and eligibility copy.",
    sections: [
      {
        key: "hero",
        label: "Hero",
        fields: [textField("title", "Headline"), imageField("image", "Hero photo")],
      },
      {
        key: "process",
        label: "Certification process",
        fields: [
          textField("heading", "Heading"),
          areaField("body", "Body copy"),
          linkField("cta", "ISA link"),
        ],
      },
      {
        key: "eligibility",
        label: "Eligibility",
        fields: [
          textField("heading", "Heading"),
          areaField("intro", "Intro copy"),
          {
            key: "items",
            label: "Eligibility routes",
            type: "list",
            itemFields: [{ key: "text", label: "Requirement", type: "textarea" }],
          },
        ],
      },
    ],
  },
  {
    slug: "inspiration",
    label: "The Inspiration",
    path: "/about-us/",
    description: "The Ken Menzer story.",
    sections: [
      {
        key: "hero",
        label: "Hero",
        fields: [
          textField("title", "Headline"),
          areaField("subtitle", "Sub headline"),
          imageField("image", "Hero photo"),
        ],
      },
      {
        key: "story",
        label: "Story",
        fields: [
          textField("title", "Name"),
          textField("subtitle", "Sub heading"),
          imageField("image", "Photo"),
          {
            key: "paragraphs",
            label: "Paragraphs",
            type: "list",
            itemFields: [{ key: "text", label: "Paragraph", type: "textarea" }],
          },
        ],
      },
    ],
  },
  {
    slug: "instructors",
    label: "Meet The Instructors",
    path: "/meet-your-instructors/",
    description: "Instructor intro copy. Individual bios live under Instructors.",
    sections: [
      {
        key: "hero",
        label: "Hero",
        fields: [
          textField("title", "Headline"),
          areaField("subtitle", "Sub headline"),
          imageField("image", "Hero photo"),
        ],
      },
      {
        key: "intro",
        label: "Intro",
        fields: [textField("heading", "Heading"), areaField("body", "Body copy")],
      },
    ],
  },
  {
    slug: "contact",
    label: "Contact Us",
    path: "/contact-us/",
    description: "Contact hero and email call to action.",
    sections: [
      {
        key: "hero",
        label: "Hero",
        fields: [
          textField("title", "Headline"),
          textField("subtitle", "Email shown in hero"),
          imageField("image", "Hero photo"),
        ],
      },
      {
        key: "message",
        label: "Message",
        fields: [areaField("heading", "Heading"), linkField("cta", "Email button")],
      },
    ],
  },
  {
    slug: "registration",
    label: "Registration",
    path: "/class-registration-page/",
    description: "In-person and online registration options.",
    sections: [
      {
        key: "intro",
        label: "Page title",
        fields: [textField("title", "Headline")],
      },
      {
        key: "in_person",
        label: "In person option",
        fields: [
          textField("heading", "Heading"),
          imageField("image", "Photo"),
          linkField("cta", "Registration link"),
          areaField("body_one", "First paragraph"),
          areaField("body_two", "Second paragraph"),
        ],
      },
      {
        key: "online",
        label: "Online option",
        fields: [
          textField("heading", "Heading"),
          imageField("image", "Photo"),
          linkField("cta", "Registration link"),
          textField("body", "Note"),
        ],
      },
      {
        key: "book",
        label: "Course book",
        fields: [areaField("heading", "Heading"), linkField("cta", "Purchase link")],
      },
    ],
  },
];

export const ALL_PAGES: PageDefinition[] = [SHARED_SCHEMA, ...PAGE_SCHEMA];

export const getPageDefinition = (slug: string) =>
  ALL_PAGES.find((page) => page.slug === slug);
