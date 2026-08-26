import { createFileRoute } from "@tanstack/react-router";
import CourseOverview from "../pages/CourseOverview";

const title = "8-Week ISA Certified Arborist Prep Course | Tree Test Prep";
const description =
  "Course overview for the 8-week ISA Certified Arborist prep course: weekly chapters, schedule, location, and $395 tuition.";

export const Route = createFileRoute("/events/location")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "https://treetestprep.lovable.app/events/location/" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Tree Test Prep" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: "https://treetestprep.lovable.app/events/location/" }],
  }),
  component: CourseOverview,
});
