import { createFileRoute } from "@tanstack/react-router";
import Home from "../pages/Home";

const title = "Become An ISA Certified Arborist | Tree Test Prep";
const description =
  "Prepare for the ISA Certified Arborist exam with Tree Test Prep's 8-week in-person and online course in Sacramento, CA.";

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
