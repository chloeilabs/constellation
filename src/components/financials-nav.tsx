"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { pathPrefix, samePath, stockPath } from "@/lib/listings";

const LINKS = [
  { href: "/financials", label: "Overview", match: "exact" as const },
  { href: "/financials/income-statement", label: "Income" },
  { href: "/financials/balance-sheet", label: "Balance Sheet" },
  { href: "/financials/cash-flow-statement", label: "Cash Flow" },
  { href: "/financials/ratios", label: "Ratios" },
  { href: "/financials/metrics", label: "Metrics" },
  { href: "/financials/growth", label: "Growth" },
  { href: "/financials/reports", label: "Reports" },
];

export function FinancialsNav({ symbol }: { symbol: string }) {
  const pathname = usePathname();
  return (
    <nav className="mb-4 flex flex-wrap gap-2" aria-label="Financial statements">
      {LINKS.map((link) => {
        const href = stockPath(symbol, link.href);
        const active = link.match === "exact" ? samePath(pathname, href) : pathPrefix(pathname, href);
        return (
          <Link key={href} href={href} className="sa-chip" aria-current={active ? "page" : undefined}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
