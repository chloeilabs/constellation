import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function PeriodToggle({
  period,
  annualHref,
  quarterHref,
}: {
  period: "annual" | "quarter";
  annualHref: string;
  quarterHref: string;
}) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5 text-sm">
      <Link
        href={annualHref}
        className={cn(
          "rounded px-3 py-1.5 font-medium",
          period === "annual" ? "bg-header text-white" : "text-muted hover:text-header",
        )}
      >
        Annual
      </Link>
      <Link
        href={quarterHref}
        className={cn(
          "rounded px-3 py-1.5 font-medium",
          period === "quarter" ? "bg-header text-white" : "text-muted hover:text-header",
        )}
      >
        Quarterly
      </Link>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-header md:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}
