import { createFileRoute } from "@tanstack/react-router";
import Blog from "../pages/Blog";
import { SITE } from "@/lib/siteConfig";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog | Tree Test Prep" },
      {
        name: "description",
        content:
          "Study tips, exam updates and arboriculture insights for future ISA Certified Arborists.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE}/blog/` }],
  }),
  component: Blog,
});
