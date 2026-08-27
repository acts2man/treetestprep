import { createFileRoute } from "@tanstack/react-router";
import Registration from "../pages/Registration";
import { buildHead } from "@/lib/pageHead";
import { getPageSeo } from "@/lib/pageSeo.functions";

export const Route = createFileRoute("/class-registration-page")({
  loader: () => getPageSeo({ data: { slug: "registration" } }),
  head: ({ loaderData }) => buildHead("registration", "/class-registration-page/", loaderData),
  errorComponent: () => <Registration />,
  notFoundComponent: () => <Registration />,
  component: Registration,
});
