import { createFileRoute } from "@tanstack/react-router";
import Contact from "../pages/Contact";
import { buildHead } from "@/lib/pageHead";
import { getPageSeo } from "@/lib/pageSeo.functions";

export const Route = createFileRoute("/contact-us")({
  loader: () => getPageSeo({ data: { slug: "contact" } }),
  head: ({ loaderData }) => buildHead("contact", "/contact-us/", loaderData),
  errorComponent: () => <Contact />,
  notFoundComponent: () => <Contact />,
  component: Contact,
});
