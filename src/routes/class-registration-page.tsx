import { createFileRoute } from "@tanstack/react-router";
import Registration from "../pages/Registration";

const title = "Class Registration | Tree Test Prep";
const description =
  "Register for the ISA Certified Arborist prep course in person or online through secure Stripe checkout.";

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
