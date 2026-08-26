import { createFileRoute } from "@tanstack/react-router";
import Contact from "../pages/Contact";

const title = "Contact Tree Test Prep | Arborist Course Questions";
const description =
  "Questions about the ISA Certified Arborist prep course, schedule, or tuition? Email Tree Test Prep and hear back within one business day.";

export const Route = createFileRoute("/contact-us")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "https://treetestprep.lovable.app/contact-us/" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Tree Test Prep" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: "https://treetestprep.lovable.app/contact-us/" }],
  }),
  component: Contact,
});
