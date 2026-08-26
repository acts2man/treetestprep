import { createFileRoute } from "@tanstack/react-router";
import Home from "../pages/Home";

const title = "ISA Certified Arborist Exam Prep Course | Tree Test Prep";
const description =
  "Pass the ISA Certified Arborist exam with an 8-week instructor-led prep course in Sacramento, CA or live online \u2014 chapter-by-chapter study guide included.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "https://treetestprep.lovable.app/" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Tree Test Prep" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: "https://treetestprep.lovable.app/" }],
  }),
  component: Home,
});
