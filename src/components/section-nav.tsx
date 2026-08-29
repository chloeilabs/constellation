"use client";

import { useLayoutEffect, useRef } from "react";
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
  label = "Related pages",
}: {
  items: { href: string; label: string; match?: "exact" | "prefix" }[];
  label?: string;
}) {
  const pathname = usePathname();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dense = items.length > 7;

  useLayoutEffect(() => {
    const root = scrollerRef.current;
    const active = root?.querySelector<HTMLElement>("[aria-current='page']");
    if (!root || !active) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const left = active.offsetLeft - root.clientWidth / 2 + active.offsetWidth / 2;
    root.scrollTo({ left: Math.max(0, left), behavior: reduce ? "auto" : "smooth" });
  }, [pathname, items]);

  return (
    <nav aria-label={label} className="relative mb-5">
      <div
        ref={scrollerRef}
        className={cn(dense ? "sa-scroll flex gap-2 pb-1" : "flex flex-wrap gap-2")}
      >
        {items.map((item) => {
          const active =
            item.match === "prefix" ? pathPrefix(pathname, item.href) : samePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("sa-chip shrink-0", !dense && "whitespace-nowrap")}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      {dense ? (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background"
          aria-hidden="true"
        />
      ) : null}
    </nav>
  );
}
