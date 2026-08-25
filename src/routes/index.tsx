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
    ],
  }),
  component: Home,
});
