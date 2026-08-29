"use client";

import { useId, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const selectId = useId();
  const dense = items.length > 7;
  const jumbo = items.length > 12;
  const activeItem =
    items.find((item) =>
      item.match === "prefix" ? pathPrefix(pathname, item.href) : samePath(pathname, item.href),
    ) ?? null;

  useLayoutEffect(() => {
    const root = scrollerRef.current;
    const active = root?.querySelector<HTMLElement>("[aria-current='page']");
    if (!root || !active) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const left = active.offsetLeft - root.clientWidth / 2 + active.offsetWidth / 2;
    root.scrollTo({ left: Math.max(0, left), behavior: reduce ? "auto" : "smooth" });
  }, [pathname, items]);

  return (
    <nav aria-label={label} className="mb-5">
      {jumbo ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label htmlFor={selectId} className="text-sm text-muted">
            Jump to
          </label>
          <select
            id={selectId}
            className="sa-input w-56 max-w-full"
            value={activeItem?.href ?? items[0]?.href}
            onChange={(event) => router.push(event.target.value)}
          >
            {items.map((item) => (
              <option key={item.href} value={item.href}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="relative">
        <div
          ref={scrollerRef}
          className={cn(dense ? "sa-scroll sa-scroll-hide flex gap-2 pb-1" : "flex flex-wrap gap-2")}
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
      </div>
    </nav>
  );
}
