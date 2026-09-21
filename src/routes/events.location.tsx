import { createFileRoute } from "@tanstack/react-router";
import CourseOverview from "../pages/CourseOverview";
import { buildHead } from "@/lib/pageHead";

export const Route = createFileRoute("/events/location")({
  head: () => buildHead("course-overview", "/events/location/"),
  errorComponent: () => <CourseOverview />,
  notFoundComponent: () => <CourseOverview />,
  component: CourseOverview,
});
