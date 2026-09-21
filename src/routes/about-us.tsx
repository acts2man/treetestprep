import { createFileRoute } from "@tanstack/react-router";
import Inspiration from "../pages/Inspiration";
import { buildHead } from "@/lib/pageHead";

export const Route = createFileRoute("/about-us")({
  head: () => buildHead("inspiration", "/about-us/"),
  errorComponent: () => <Inspiration />,
  notFoundComponent: () => <Inspiration />,
  component: Inspiration,
});
