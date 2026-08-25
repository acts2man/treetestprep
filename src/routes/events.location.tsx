import { createFileRoute } from "@tanstack/react-router";
import CourseOverview from "../pages/CourseOverview";

const title = "8-Week ISA Certified Arborist Prep Course | Tree Test Prep";
const description =
  "Course overview for the 8-week ISA Certified Arborist prep course: weekly chapters, schedule, location, and $395 tuition.";

export const Route = createFileRoute("/events/location")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: CourseOverview,
});
