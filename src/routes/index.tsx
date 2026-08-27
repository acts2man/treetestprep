import { createFileRoute } from "@tanstack/react-router";
import Home from "../pages/Home";
import { buildHead } from "@/lib/pageHead";
import { getPageSeo } from "@/lib/pageSeo.functions";

export const Route = createFileRoute("/")({
  loader: () => getPageSeo({ data: { slug: "home" } }),
  head: ({ loaderData }) => buildHead("home", "/", loaderData),
  errorComponent: () => <Home />,
  notFoundComponent: () => <Home />,
  component: Home,
});
