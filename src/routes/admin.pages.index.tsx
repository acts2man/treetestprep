import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileText } from "lucide-react";
import { ALL_PAGES } from "@/lib/pageSchema";
import { PageHeader } from "@/components/dashboard/DataTable";

export const Route = createFileRoute("/admin/pages/")({
  component: AdminPagesIndex,
});

function AdminPagesIndex() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Website pages"
        description="Edit the copy, photos, videos and buttons on the public website. Changes go live immediately."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {ALL_PAGES.map((page) => (
          <Link
            key={page.slug}
            to="/admin/pages/$slug"
            params={{ slug: page.slug }}
            className="group rounded-xl border border-white/10 bg-gradient-to-br from-[#0a1228] to-[#05070d] p-4 transition hover:border-[#349e49]/60"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#d9c58c]" />
                  <h2 className="text-sm font-semibold text-white">{page.label}</h2>
                </div>
                <p className="mt-2 text-xs text-white/55">{page.description}</p>
                <p className="mt-2 text-xs text-white/35">{page.path}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-white/40 transition group-hover:text-white" />
            </div>
            <p className="mt-3 text-xs text-white/40">
              {page.sections.length} editable section{page.sections.length === 1 ? "" : "s"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
