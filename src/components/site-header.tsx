import { Logo } from "@/components/logo";
import { HeaderNav } from "@/components/header-nav";
import { DesktopSearchRow, MobileSearchRow, SearchHotkey } from "@/components/search-box";
import { ThemeToggle } from "@/components/theme-toggle";
import { WatchlistLink } from "@/components/watchlist-button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <a href="#main-content" className="sa-skip">
        Skip to content
      </a>
      <SearchHotkey />
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 md:gap-6">
        <Logo />
        <HeaderNav className="hidden items-center gap-5 text-sm md:flex" />
        <div className="ml-auto flex min-w-0 items-center gap-2">
          <DesktopSearchRow />
          <WatchlistLink />
          <ThemeToggle />
        </div>
      </div>
      <MobileSearchRow />
      <div className="relative border-t border-border md:hidden">
        <HeaderNav
          className="sa-scroll sa-scroll-hide flex gap-4 px-4 py-2 pr-8 text-sm"
          itemClassName="py-0.5"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background" aria-hidden="true" />
      </div>
    </header>
  );
}
