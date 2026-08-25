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
    ],
  }),
  component: Registration,
});
