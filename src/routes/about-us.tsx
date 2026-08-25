import { createFileRoute } from "@tanstack/react-router";
import Inspiration from "../pages/Inspiration";

const title = "The Inspiration: Ken Menzer | Tree Test Prep";
const description =
  "Tree Test Prep was created in honor of Ken Menzer, a Community Forester and City Arborist whose motto was educate and elevate.";

export const Route = createFileRoute("/about-us")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Inspiration,
});
