"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { pathPrefix, samePath } from "@/lib/listings";
import { cn } from "@/lib/utils";

export {
  MARKET_NAV,
  extendedHoursNav,
  CALENDAR_NAV,
  IPO_NAV,
  STOCKS_NAV,
  HEATMAP_INDEX_NAV,
  INDEX_CHANGES_NAV,
  NEWS_NAV,
  ETF_NAV,
  CONGRESS_NAV,
  quoteFundamentalsNav,
  quoteNewsNav,
  etfQuoteNav,
} from "@/lib/nav";

export function SectionNav({
  items,
}: {
  items: { href: string; label: string; match?: "exact" | "prefix" }[];
}) {
  const pathname = usePathname();
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {items.map((item) => {
        const active =
          item.match === "prefix" ? pathPrefix(pathname, item.href) : samePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              active ? "bg-header text-on-header" : "bg-chip text-header hover:bg-border",
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
