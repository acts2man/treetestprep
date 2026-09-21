import { createFileRoute } from "@tanstack/react-router";
import Instructors from "../pages/Instructors";
import { buildHead } from "@/lib/pageHead";

export const Route = createFileRoute("/meet-your-instructors")({
  head: () => buildHead("instructors", "/meet-your-instructors/"),
  errorComponent: () => <Instructors />,
  notFoundComponent: () => <Instructors />,
  component: Instructors,
});
