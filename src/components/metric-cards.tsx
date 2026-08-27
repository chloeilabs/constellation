import type { ReactNode } from "react";

export function MetricCards({
  items,
}: {
  items: { label: string; value: ReactNode; hint?: string }[];
}) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${items.length >= 6 ? "xl:grid-cols-6" : "xl:grid-cols-4"}`}>
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">{item.label}</div>
          <div className="mt-1 text-2xl font-semibold tabular">{item.value}</div>
          {item.hint ? <p className="mt-1 text-xs text-muted">{item.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}
