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
    sections: [seoSection()],
  },
  {
    slug: "course-overview",
    label: "Course Overview",
    path: "/events/location/",
    description: "Location, dates and what the course covers.",
    sections: [seoSection()],
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
    sections: [seoSection()],
  },
  {
    slug: "instructors",
    label: "Meet The Instructors",
    path: "/meet-your-instructors/",
    description: "Instructor intro copy. Individual bios live under Instructors.",
    sections: [
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
    sections: [seoSection()],
  },
];

export const ALL_PAGES: PageDefinition[] = [SHARED_SCHEMA, ...PAGE_SCHEMA];

export const getPageDefinition = (slug: string) =>
  ALL_PAGES.find((page) => page.slug === slug);
