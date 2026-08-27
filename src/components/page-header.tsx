import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function PeriodToggle({
  period,
  annualHref,
  quarterHref,
  trailingHref,
}: {
  period: "annual" | "quarter" | "trailing";
  annualHref: string;
  quarterHref: string;
  trailingHref?: string;
}) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5 text-sm" role="group" aria-label="Statement period">
      <Link
        href={annualHref}
        className={cn(
          "rounded px-3 py-1.5 font-medium",
          period === "annual" ? "bg-header text-on-header" : "text-muted hover:text-header",
        )}
      >
        Annual
      </Link>
      <Link
        href={quarterHref}
        className={cn(
          "rounded px-3 py-1.5 font-medium",
          period === "quarter" ? "bg-header text-on-header" : "text-muted hover:text-header",
        )}
      >
        Quarterly
      </Link>
      {trailingHref ? (
        <Link
          href={trailingHref}
          className={cn(
            "rounded px-3 py-1.5 font-medium",
            period === "trailing" ? "bg-header text-on-header" : "text-muted hover:text-header",
          )}
        >
          Trailing
        </Link>
      ) : null}
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
          source === "standardized" ? "bg-header text-on-header" : "text-muted hover:text-header",
        )}
      >
        Standardized
      </Link>
      <Link
        href={reportedHref}
        className={cn(
          "rounded px-3 py-1.5 font-medium",
          source === "reported" ? "bg-header text-on-header" : "text-muted hover:text-header",
        )}
      >
        As Reported
      </Link>
    </div>
  );
}

export function YearToggle({
  span,
  fiveHref,
  tenHref,
  maxHref,
}: {
  span: "5" | "10" | "max";
  fiveHref: string;
  tenHref: string;
  maxHref: string;
}) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5 text-sm" role="group" aria-label="Statement range">
      {(
        [
          ["5", "5Y", fiveHref],
          ["10", "10Y", tenHref],
          ["max", "Max", maxHref],
        ] as const
      ).map(([id, label, href]) => (
        <Link
          key={id}
          href={href}
          className={cn(
            "rounded px-3 py-1.5 font-medium",
            span === id ? "bg-header text-on-header" : "text-muted hover:text-header",
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

export function RangeToggle({
  range,
  oneHref,
  fiveHref,
  tenHref,
  maxHref,
}: {
  range: "1" | "5" | "10" | "max";
  oneHref: string;
  fiveHref: string;
  tenHref: string;
  maxHref: string;
}) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5 text-sm" role="group" aria-label="History range">
      {(
        [
          ["1", "1Y", oneHref],
          ["5", "5Y", fiveHref],
          ["10", "10Y", tenHref],
          ["max", "Max", maxHref],
        ] as const
      ).map(([id, label, href]) => (
        <Link
          key={id}
          href={href}
          className={cn(
            "rounded px-3 py-1.5 font-medium",
            range === id ? "bg-header text-on-header" : "text-muted hover:text-header",
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

export function ViewToggle({
  view,
  dollarsHref,
  commonHref,
}: {
  view: "dollars" | "common-size";
  dollarsHref: string;
  commonHref: string;
}) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5 text-sm" role="group" aria-label="Statement units">
      {(
        [
          ["dollars", "Dollars", dollarsHref],
          ["common-size", "Common Size", commonHref],
        ] as const
      ).map(([id, label, href]) => (
        <Link
          key={id}
          href={href}
          className={cn(
            "rounded px-3 py-1.5 font-medium",
            view === id ? "bg-header text-on-header" : "text-muted hover:text-header",
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

export function StatementToolbar({
  period,
  source,
  span,
  view = "dollars",
  annualHref,
  quarterHref,
  trailingHref,
  standardizedHref,
  reportedHref,
  fiveHref,
  tenHref,
  maxHref,
  dollarsHref,
  commonHref,
}: {
  period: "annual" | "quarter" | "trailing";
  source: "standardized" | "reported";
  span: "5" | "10" | "max";
  view?: "dollars" | "common-size";
  annualHref: string;
  quarterHref: string;
  trailingHref?: string;
  standardizedHref: string;
  reportedHref: string;
  fiveHref: string;
  tenHref: string;
  maxHref: string;
  dollarsHref?: string;
  commonHref?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <PeriodToggle period={period} annualHref={annualHref} quarterHref={quarterHref} trailingHref={trailingHref} />
      <SourceToggle source={source} standardizedHref={standardizedHref} reportedHref={reportedHref} />
      <YearToggle span={span} fiveHref={fiveHref} tenHref={tenHref} maxHref={maxHref} />
      {source === "standardized" && dollarsHref && commonHref ? (
        <ViewToggle view={view} dollarsHref={dollarsHref} commonHref={commonHref} />
      ) : null}
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
