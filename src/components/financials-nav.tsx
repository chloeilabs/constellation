"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/financials", label: "Income" },
  { href: "/financials/balance-sheet", label: "Balance Sheet" },
  { href: "/financials/cash-flow-statement", label: "Cash Flow" },
  { href: "/financials/ratios", label: "Ratios" },
  { href: "/financials/growth", label: "Growth" },
];

export function FinancialsNav({ symbol }: { symbol: string }) {
  const pathname = usePathname();
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {LINKS.map((link) => {
        const href = `/stocks/${symbol}${link.href}`;
        const active =
          link.href === "/financials"
            ? pathname === href
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              active ? "bg-header text-white" : "bg-chip text-header hover:bg-border",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
