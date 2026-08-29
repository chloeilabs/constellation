"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const NAV = [
  { href: "/markets", label: "Markets" },
  { href: "/stocks", label: "Stocks" },
  { href: "/list", label: "Lists" },
  { href: "/etf", label: "ETFs" },
  { href: "/funds", label: "Funds" },
  { href: "/screener", label: "Screener" },
  { href: "/news", label: "News" },
  { href: "/calendar/earnings", label: "Calendar" },
  { href: "/tools", label: "Tools" },
] as const;

function navActive(pathname: string, href: string) {
  if (href === "/calendar/earnings") {
    return pathname.startsWith("/calendar") || pathname === "/ipos" || pathname.startsWith("/ipos/");
  }
  if (href === "/markets") return pathname.startsWith("/markets");
  if (href === "/stocks") {
    return (
      pathname === "/stocks" ||
      pathname.startsWith("/stocks/sector") ||
      pathname.startsWith("/stocks/industry") ||
      pathname.startsWith("/stocks/country")
    );
  }
  if (href === "/list") return pathname.startsWith("/list");
  if (href === "/etf") return pathname.startsWith("/etf");
  if (href === "/funds") return pathname.startsWith("/funds");
  if (href === "/screener") return pathname.startsWith("/screener");
  if (href === "/news") return pathname.startsWith("/news");
  if (href === "/tools") {
    return pathname.startsWith("/tools") || pathname === "/compare" || pathname.startsWith("/compare/") || pathname === "/search";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderNav({
  className,
  itemClassName,
}: {
  className?: string;
  itemClassName?: string;
}) {
  const pathname = usePathname();
  return (
    <nav className={className} aria-label="Primary">
      {NAV.map((item) => {
        const active = navActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 font-medium transition-colors",
              itemClassName,
              active ? "text-brand" : "text-header hover:text-brand",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
