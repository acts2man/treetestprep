import type { ReactNode } from "react";

export function PlaceholderPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        {description && <p className="mt-1 text-sm text-white/60">{description}</p>}
      </header>
      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0a1228] to-[#05070d] p-10 text-center text-sm text-white/50">
        {children ?? "Nothing here yet. This section is ready for content."}
      </div>
    </div>
  );
}

export default PlaceholderPage;
