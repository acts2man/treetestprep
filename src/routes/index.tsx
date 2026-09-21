import { createFileRoute } from "@tanstack/react-router";
import Home from "../pages/Home";
import { buildHead } from "@/lib/pageHead";

export const Route = createFileRoute("/")({
  head: () => buildHead("home", "/"),
  errorComponent: () => <Home />,
  notFoundComponent: () => <Home />,
  component: Home,
});
