import { createFileRoute } from "@tanstack/react-router";
import Inspiration from "../pages/Inspiration";

const title = "About Tree Test Prep | The Inspiration: Ken Menzer";
const description =
  "Tree Test Prep was founded in honor of Ken Menzer, Community Forester and City Arborist, whose motto \u2014 educate and elevate \u2014 guides every class.";

export const Route = createFileRoute("/about-us")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "https://treetestprep.lovable.app/about-us/" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Tree Test Prep" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: "https://treetestprep.lovable.app/about-us/" }],
  }),
  component: Inspiration,
});
