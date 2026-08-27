import { createFileRoute } from "@tanstack/react-router";
import CourseOverview from "../pages/CourseOverview";
import { buildHead } from "@/lib/pageHead";
import { getPageSeo } from "@/lib/pageSeo.functions";

export const Route = createFileRoute("/events/location")({
  loader: () => getPageSeo({ data: { slug: "course-overview" } }),
  head: ({ loaderData }) => buildHead("course-overview", "/events/location/", loaderData),
  errorComponent: () => <CourseOverview />,
  notFoundComponent: () => <CourseOverview />,
  component: CourseOverview,
});
