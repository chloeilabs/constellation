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
    <div className="inline-flex rounded-md border border-border p-0.5 text-sm" role="group" aria-label="Statement period">
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

export function SourceToggle({
  source,
  standardizedHref,
  reportedHref,
}: {
  source: "standardized" | "reported";
  standardizedHref: string;
  reportedHref: string;
}) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5 text-sm" role="group" aria-label="Statement source">
      <Link
        href={standardizedHref}
        className={cn(
          "rounded px-3 py-1.5 font-medium",
          source === "standardized" ? "bg-header text-white" : "text-muted hover:text-header",
        )}
      >
        Standardized
      </Link>
      <Link
        href={reportedHref}
        className={cn(
          "rounded px-3 py-1.5 font-medium",
          source === "reported" ? "bg-header text-white" : "text-muted hover:text-header",
        )}
      >
        As Reported
      </Link>
    </div>
  );
}

export function StatementToolbar({
  period,
  source,
  annualHref,
  quarterHref,
  standardizedHref,
  reportedHref,
}: {
  period: "annual" | "quarter";
  source: "standardized" | "reported";
  annualHref: string;
  quarterHref: string;
  standardizedHref: string;
  reportedHref: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <PeriodToggle period={period} annualHref={annualHref} quarterHref={quarterHref} />
      <SourceToggle source={source} standardizedHref={standardizedHref} reportedHref={reportedHref} />
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
