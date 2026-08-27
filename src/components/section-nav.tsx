"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const MARKET_NAV = [
  { href: "/markets", label: "Overview" },
  { href: "/markets/gainers", label: "Gainers" },
  { href: "/markets/losers", label: "Losers" },
  { href: "/markets/active", label: "Most Active" },
  { href: "/markets/sectors", label: "Sectors" },
];

export const CALENDAR_NAV = [
  { href: "/calendar/earnings", label: "Earnings" },
  { href: "/calendar/ipos", label: "IPOs" },
  { href: "/calendar/dividends", label: "Dividends" },
  { href: "/calendar/splits", label: "Splits" },
  { href: "/calendar/economy", label: "Economy" },
];

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
          item.match === "prefix"
            ? pathname.startsWith(item.href)
            : pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              active ? "bg-header text-white" : "bg-chip text-header hover:bg-border",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
