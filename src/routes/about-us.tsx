import { createFileRoute } from "@tanstack/react-router";
import Inspiration from "../pages/Inspiration";

const title = "The Inspiration: Ken Menzer | Tree Test Prep";
const description =
  "Tree Test Prep was created in honor of Ken Menzer, a Community Forester and City Arborist whose motto was educate and elevate.";

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
