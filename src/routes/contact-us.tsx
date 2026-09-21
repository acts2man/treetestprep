import { createFileRoute } from "@tanstack/react-router";
import Contact from "../pages/Contact";
import { buildHead } from "@/lib/pageHead";

export const Route = createFileRoute("/contact-us")({
  head: () => buildHead("contact", "/contact-us/"),
  errorComponent: () => <Contact />,
  notFoundComponent: () => <Contact />,
  component: Contact,
});
