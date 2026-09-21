import { createFileRoute } from "@tanstack/react-router";
import ExamInformation from "../pages/ExamInformation";
import { buildHead } from "@/lib/pageHead";

export const Route = createFileRoute("/exam-information")({
  head: () => buildHead("exam-information", "/exam-information/"),
  errorComponent: () => <ExamInformation />,
  notFoundComponent: () => <ExamInformation />,
  component: ExamInformation,
});
