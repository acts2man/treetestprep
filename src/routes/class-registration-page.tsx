import { createFileRoute } from "@tanstack/react-router";
import Registration from "../pages/Registration";
import { buildHead } from "@/lib/pageHead";

export const Route = createFileRoute("/class-registration-page")({
  head: () => buildHead("registration", "/class-registration-page/"),
  errorComponent: () => <Registration />,
  notFoundComponent: () => <Registration />,
  component: Registration,
});
