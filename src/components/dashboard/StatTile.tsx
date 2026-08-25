import type { ComponentType } from "react";

export function StatTile({
  label,
  value,
  delta,
  icon: Icon,
  tint = "bg-white/10",
}: {
  label: string;
  value: string | number;
  delta?: string;
  icon: ComponentType<{ className?: string }>;
  tint?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0a1228] to-[#05070d] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-white/50">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
          {delta && <p className="mt-1 text-xs text-emerald-400">{delta}</p>}
        </div>
        <span className={`rounded-lg p-2 ${tint}`}>
          <Icon className="h-4 w-4 text-white" />
        </span>
      </div>
    </div>
  );
}

export default StatTile;
