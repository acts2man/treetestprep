export type FieldType = "text" | "textarea" | "image" | "video" | "url" | "link" | "list";

export type PageField = {
  key: string;
  label: string;
  type: FieldType;
  /** For list fields: the shape of each item. */
  itemFields?: { key: string; label: string; type: "text" | "textarea" | "image" | "url" }[];
  /** Optional one-line hint shown under the control in the editor. */
  help?: string;
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
const urlField = (key: string, label: string): PageField => ({ key, label, type: "url" });

const seoSection = (): PageSection => ({
  key: "seo",
  label: "SEO & sharing",
  fields: [
    textField("title", "Browser / search title"),
    areaField("description", "Meta description"),
    urlField("image", "Social share image URL (https)"),
  ],
});

export const SHARED_SCHEMA: PageDefinition = {
  slug: "shared",
  label: "Header & Footer",
  path: "/",
  description: "Logo, navigation, contact email and footer content used on every page.",
  sections: [
    {
      key: "header",
      label: "Header",
      fields: [
        imageField("logo", "Logo"),
        textField("logo_alt", "Logo alt text"),
        textField("email", "Contact email"),
        {
          key: "nav",
          label: "Navigation links",
          type: "list",
          itemFields: [
            { key: "label", label: "Label", type: "text" },
            { key: "href", label: "Destination", type: "url" },
          ],
        },
        linkField("mobile_cta", "Mobile menu button"),
        urlField("isa_url", "Mobile menu ISA icon link"),
      ],
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
        textField("image_alt", "Footer photo alt text"),
        textField("links_heading", "Navigation heading"),
        textField("copyright", "Copyright line"),
        linkField("privacy", "Privacy policy link"),
        linkField("terms", "Terms of service link"),
        textField("credit_prefix", "Credit line prefix"),
        linkField("credit", "Credit link"),
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
          textField("badge_alt", "Credential badge alt text"),
          { key: "video", label: "Wistia video embed URL", type: "video" },
          textField("video_title", "Video title (accessibility)"),
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
          linkField("exam_link", "Exam note link 1"),
          linkField("isa_link", "Exam note link 2"),
          linkField("cta", "Section button"),
          imageField("image", "Section photo"),
          textField("image_alt", "Section photo alt text"),
        ],
      },
      {
        key: "faq",
        label: "FAQ",
        fields: [
          textField("heading", "Heading"),
          textField("eyebrow", "Eyebrow label"),
          imageField("image", "FAQ photo"),
          textField("image_alt", "FAQ photo alt text"),
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
      seoSection(),
    ],
  },
  {
    slug: "course-overview",
    label: "Course Overview",
    path: "/events/location/",
    description: "Location, dates and what the course covers.",
    sections: [
      {
        key: "main",
        label: "Course header",
        fields: [
          imageField("image", "Classroom photo"),
          textField("image_alt", "Classroom photo alt text"),
          textField("title", "Headline"),
          textField("meta_dates", "Dates line"),
          textField("meta_time", "Time line"),
          textField("meta_location", "Location line"),
          textField("description_heading", "Description heading"),
          {
            key: "weeks",
            label: "Weekly chapter descriptions",
            type: "list",
            itemFields: [
              { key: "week", label: "Week label", type: "text" },
              { key: "title_one", label: "First chapter title", type: "text" },
              { key: "body_one", label: "First chapter description", type: "textarea" },
              { key: "title_two", label: "Second chapter title", type: "text" },
              { key: "body_two", label: "Second chapter description", type: "textarea" },
            ],
          },
        ],
      },
      {
        key: "card",
        label: "Course card",
        fields: [
          textField("heading", "Card heading"),
          textField("price_label", "Price label"),
          textField("price", "Course price"),
          textField("email_label", "Email label"),
          textField("email", "Email"),
          textField("location_label", "Location label"),
          textField("location", "Location"),
          linkField("cta", "Card button"),
        ],
      },
      seoSection(),
    ],
  },
  {
    slug: "exam-information",
    label: "Exam Information",
    path: "/exam-information/",
    description: "ISA certification process and eligibility copy.",
    sections: [seoSection()],
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
          textField("image_alt", "Photo alt text"),
          {
            key: "paragraphs",
            label: "Paragraphs",
            type: "list",
            itemFields: [{ key: "text", label: "Paragraph", type: "textarea" }],
          },
        ],
      },
      seoSection(),
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
        fields: [
          textField("heading", "Heading"),
          areaField("body", "Body copy"),
          textField("role_label", "Subtitle shown under each instructor name"),
        ],
      },
      seoSection(),
    ],
  },
  {
    slug: "contact",
    label: "Contact Us",
    path: "/contact-us/",
    description: "Contact hero and email call to action.",
    sections: [seoSection()],
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
          textField("image_alt", "Photo alt text"),
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
          textField("image_alt", "Photo alt text"),
          linkField("cta", "Registration link"),
          textField("body", "Note"),
        ],
      },
      {
        key: "book",
        label: "Course book",
        fields: [areaField("heading", "Heading"), linkField("cta", "Purchase link")],
      },
      seoSection(),
    ],
  },
];

export const ALL_PAGES: PageDefinition[] = [SHARED_SCHEMA, ...PAGE_SCHEMA];

export const getPageDefinition = (slug: string) =>
  ALL_PAGES.find((page) => page.slug === slug);
