import { createFileRoute } from "@tanstack/react-router";
import Instructors from "../pages/Instructors";

const title = "Meet Your Arborist Instructors | Tree Test Prep";
const description =
  "Learn from ISA Certified Arborists and urban forestry professionals with decades of field, municipal, and teaching experience.";

export const Route = createFileRoute("/meet-your-instructors")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "https://treetestprep.lovable.app/meet-your-instructors/" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Tree Test Prep" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: "https://treetestprep.lovable.app/meet-your-instructors/" }],
  }),
  component: Instructors,
});
