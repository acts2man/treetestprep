import { createFileRoute } from "@tanstack/react-router";
import Inspiration from "../pages/Inspiration";
import { buildHead } from "@/lib/pageHead";
import { getPageSeo } from "@/lib/pageSeo.functions";

export const Route = createFileRoute("/about-us")({
  loader: () => getPageSeo({ data: { slug: "inspiration" } }),
  head: ({ loaderData }) => buildHead("inspiration", "/about-us/", loaderData),
  errorComponent: () => <Inspiration />,
  notFoundComponent: () => <Inspiration />,
  component: Inspiration,
});
