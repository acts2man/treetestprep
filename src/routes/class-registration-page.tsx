import { createFileRoute } from "@tanstack/react-router";
import Registration from "../pages/Registration";

const title = "Register For The ISA Arborist Prep Course | Tree Test Prep";
const description =
  "Reserve your seat in the 8-week ISA Certified Arborist prep course \u2014 in person in Sacramento or live online, with secure checkout.";

export const Route = createFileRoute("/class-registration-page")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "https://treetestprep.lovable.app/class-registration-page/" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Tree Test Prep" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: "https://treetestprep.lovable.app/class-registration-page/" }],
  }),
  component: Registration,
});
