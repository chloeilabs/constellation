import Link from "next/link";
import { Logo } from "@/components/logo";
import { SearchBox } from "@/components/search-box";
import { WatchlistLink } from "@/components/watchlist-button";

const NAV = [
  { href: "/markets", label: "Markets" },
  { href: "/stocks", label: "Stocks" },
  { href: "/etf", label: "ETFs" },
  { href: "/screener", label: "Screener" },
  { href: "/news", label: "News" },
  { href: "/calendar/earnings", label: "Calendar" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
        <Logo />
        <nav className="hidden items-center gap-5 text-sm font-medium text-header md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-brand">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-3">
          <div className="w-full max-w-md">
            <SearchBox />
          </div>
          <WatchlistLink />
        </div>
      </div>
      <nav className="flex gap-4 overflow-x-auto border-t border-border px-4 py-2 text-sm md:hidden">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="shrink-0 font-medium text-header">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
