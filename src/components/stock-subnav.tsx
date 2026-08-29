"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { indexConstituentMeta, isIndexTicker } from "@/lib/indexes";
import { pathPrefix, samePath, stockPath } from "@/lib/listings";
import { cn } from "@/lib/utils";

const STOCK_TABS = [
  { href: "", label: "Overview" },
  { href: "/financials", label: "Financials" },
  { href: "/statistics", label: "Statistics" },
  { href: "/metrics", label: "Metrics" },
  { href: "/forecast", label: "Forecast" },
  { href: "/ratings", label: "Ratings" },
  { href: "/earnings", label: "Earnings" },
  { href: "/dividend", label: "Dividend" },
  { href: "/company", label: "Company" },
  { href: "/esg", label: "ESG" },
  { href: "/news", label: "News" },
  { href: "/history", label: "History" },
  { href: "/insiders", label: "Insiders" },
  { href: "/congress", label: "Congress" },
  { href: "/ownership", label: "Ownership" },
  { href: "/filings", label: "Filings" },
  { href: "/transcripts", label: "Transcripts" },
  { href: "/chart", label: "Chart" },
  { href: "/fundamental-chart", label: "Fund. Chart" },
];

export function StockSubnav({ symbol }: { symbol: string }) {
  const pathname = usePathname();
  const base = stockPath(symbol);
  const tabs = isIndexTicker(symbol)
    ? [
        { href: "", label: "Overview" },
        { href: "/chart", label: "Chart" },
        { href: "/history", label: "History" },
        { href: "/news", label: "News" },
        ...(indexConstituentMeta(symbol) ? [{ href: "/constituents", label: "Constituents" }] : []),
      ]
    : STOCK_TABS;

  return (
    <nav className="sa-scroll -mb-px mt-5 flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab) => {
        const href = `${base}${tab.href}`;
        const isOverview = tab.href === "";
        const active = isOverview ? samePath(pathname, base) : pathPrefix(pathname, href);
        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium",
              active ? "border-brand text-header" : "border-transparent text-muted hover:text-header",
            )}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
