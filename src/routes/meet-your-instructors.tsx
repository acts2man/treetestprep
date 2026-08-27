import { createFileRoute } from "@tanstack/react-router";
import Instructors from "../pages/Instructors";
import { buildHead } from "@/lib/pageHead";
import { getPageSeo } from "@/lib/pageSeo.functions";

export const Route = createFileRoute("/meet-your-instructors")({
  loader: () => getPageSeo({ data: { slug: "instructors" } }),
  head: ({ loaderData }) => buildHead("instructors", "/meet-your-instructors/", loaderData),
  errorComponent: () => <Instructors />,
  notFoundComponent: () => <Instructors />,
  component: Instructors,
});
