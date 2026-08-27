"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "", label: "Overview" },
  { href: "/financials", label: "Financials" },
  { href: "/statistics", label: "Statistics" },
  { href: "/forecast", label: "Forecast" },
  { href: "/dividend", label: "Dividends" },
  { href: "/news", label: "News" },
  { href: "/chart", label: "Chart" },
];

export function StockSubnav({ symbol }: { symbol: string }) {
  const pathname = usePathname();
  const base = `/stocks/${symbol}`;

  return (
    <nav className="mt-5 flex gap-1 overflow-x-auto">
      {TABS.map((tab) => {
        const href = `${base}${tab.href}`;
        const isOverview = tab.href === "";
        const active = isOverview ? pathname === base : pathname.startsWith(href);
        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "rounded-t-md px-3 py-2 text-sm font-medium",
              active ? "bg-muted-bg text-header" : "text-muted hover:text-header",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
