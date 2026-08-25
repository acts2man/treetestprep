import { createFileRoute } from "@tanstack/react-router";
import Instructors from "../pages/Instructors";

const title = "Meet Your Instructors | Tree Test Prep";
const description =
  "Meet the ISA Certified Arborists and urban forestry professionals who teach the Tree Test Prep course.";

export const Route = createFileRoute("/meet-your-instructors")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Instructors,
});
