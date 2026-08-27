"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "", label: "Overview" },
  { href: "/financials", label: "Financials" },
  { href: "/statistics", label: "Statistics" },
  { href: "/forecast", label: "Forecast" },
  { href: "/dividend", label: "Dividend" },
  { href: "/company", label: "Company" },
  { href: "/news", label: "News" },
  { href: "/history", label: "History" },
  { href: "/insiders", label: "Insiders" },
  { href: "/filings", label: "Filings" },
  { href: "/transcripts", label: "Transcripts" },
  { href: "/chart", label: "Chart" },
];

export function StockSubnav({ symbol }: { symbol: string }) {
  const pathname = usePathname();
  const base = `/stocks/${symbol}`;

  return (
    <nav className="-mb-px mt-5 flex gap-1 overflow-x-auto border-b border-border">
      {TABS.map((tab) => {
        const href = `${base}${tab.href}`;
        const isOverview = tab.href === "";
        const active = isOverview ? pathname === base : pathname.startsWith(href);
        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium",
              active
                ? "border-brand text-header"
                : "border-transparent text-muted hover:text-header",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
