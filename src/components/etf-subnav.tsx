"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { etfQuoteNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function EtfSubnav({ symbol }: { symbol: string }) {
  const pathname = usePathname();
  const items = etfQuoteNav(symbol);

  return (
    <nav className="sa-scroll sa-scroll-hide sa-tabs -mx-4 -mb-px mt-5 flex gap-1 overflow-x-auto border-b border-border px-4">
      {items.map((tab) => {
        const active =
          tab.match === "exact" || tab.href === `/etf/${symbol}`
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
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
