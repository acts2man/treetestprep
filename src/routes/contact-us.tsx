import { createFileRoute } from "@tanstack/react-router";
import Contact from "../pages/Contact";

const title = "Contact Us | Tree Test Prep";
const description =
  "Have a question about the ISA Certified Arborist prep course? Email Tree Test Prep and hear back within one business day.";

export const Route = createFileRoute("/contact-us")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Contact,
});
