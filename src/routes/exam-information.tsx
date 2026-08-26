import { createFileRoute } from "@tanstack/react-router";
import ExamInformation from "../pages/ExamInformation";

const title = "Exam Information | Tree Test Prep";
const description =
  "ISA Certified Arborist exam eligibility requirements, the certification process, and how to apply through the ISA.";

export const Route = createFileRoute("/exam-information")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "https://treetestprep.lovable.app/exam-information/" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Tree Test Prep" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: "https://treetestprep.lovable.app/exam-information/" }],
  }),
  component: ExamInformation,
});
