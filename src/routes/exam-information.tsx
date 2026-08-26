import { createFileRoute } from "@tanstack/react-router";
import ExamInformation from "../pages/ExamInformation";

const title = "ISA Certified Arborist Exam Requirements & Eligibility | Tree Test Prep";
const description =
  "ISA Certified Arborist exam eligibility, work-experience requirements, application steps, testing windows, and what to expect on exam day.";

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
