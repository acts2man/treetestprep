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
    ],
  }),
  component: ExamInformation,
});
