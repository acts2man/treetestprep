import { createFileRoute } from "@tanstack/react-router";
import ExamInformation from "../pages/ExamInformation";
import { buildHead } from "@/lib/pageHead";
import { getPageSeo } from "@/lib/pageSeo.functions";

export const Route = createFileRoute("/exam-information")({
  loader: () => getPageSeo({ data: { slug: "exam-information" } }),
  head: ({ loaderData }) => buildHead("exam-information", "/exam-information/", loaderData),
  errorComponent: () => <ExamInformation />,
  notFoundComponent: () => <ExamInformation />,
  component: ExamInformation,
});
