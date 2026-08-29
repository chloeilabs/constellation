import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function ToggleLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded px-3 py-1.5 font-medium",
        active ? "bg-header text-on-header" : "text-muted hover:text-header",
      )}
    >
      {children}
    </Link>
  );
}

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
      <ToggleLink href={annualHref} active={period === "annual"}>
        Annual
      </ToggleLink>
      <ToggleLink href={quarterHref} active={period === "quarter"}>
        Quarterly
      </ToggleLink>
      {trailingHref ? (
        <ToggleLink href={trailingHref} active={period === "trailing"}>
          Trailing
        </ToggleLink>
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
      <ToggleLink href={standardizedHref} active={source === "standardized"}>
        Standardized
      </ToggleLink>
      <ToggleLink href={reportedHref} active={source === "reported"}>
        As Reported
      </ToggleLink>
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
        <ToggleLink key={id} href={href} active={span === id}>
          {label}
        </ToggleLink>
      ))}
    </div>
  );
}

export function RangeToggle({
  range,
  sixHref,
  oneHref,
  fiveHref,
  tenHref,
  maxHref,
}: {
  range: "6" | "1" | "5" | "10" | "max";
  sixHref?: string;
  oneHref: string;
  fiveHref: string;
  tenHref: string;
  maxHref: string;
}) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5 text-sm" role="group" aria-label="History range">
      {(
        [
          ...(sixHref ? ([["6", "6M", sixHref]] as const) : []),
          ["1", "1Y", oneHref],
          ["5", "5Y", fiveHref],
          ["10", "10Y", tenHref],
          ["max", "Max", maxHref],
        ] as const
      ).map(([id, label, href]) => (
        <ToggleLink key={id} href={href} active={range === id}>
          {label}
        </ToggleLink>
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
        <ToggleLink key={id} href={href} active={view === id}>
          {label}
        </ToggleLink>
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
        <h1 className="text-2xl font-bold tracking-tight text-header text-balance md:text-3xl">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-sm text-muted text-pretty">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}
