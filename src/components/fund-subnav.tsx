"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { fundQuoteNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function FundSubnav({ symbol }: { symbol: string }) {
  const pathname = usePathname();
  const items = fundQuoteNav(symbol);

  return (
    <nav className="-mb-px mt-5 flex gap-1 overflow-x-auto border-b border-border">
      {items.map((tab) => {
        const active =
          tab.match === "exact" || tab.href === `/funds/${symbol}`
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
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
