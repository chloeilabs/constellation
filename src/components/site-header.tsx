import { Logo } from "@/components/logo";
import { HeaderNav } from "@/components/header-nav";
import { SearchBox, SearchHotkey } from "@/components/search-box";
import { ThemeToggle } from "@/components/theme-toggle";
import { WatchlistLink } from "@/components/watchlist-button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <a href="#main-content" className="sa-skip">
        Skip to content
      </a>
      <SearchHotkey />
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:gap-6">
        <Logo />
        <HeaderNav className="hidden items-center gap-5 text-sm md:flex" />
        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
          <div className="w-full max-w-md">
            <SearchBox id="site-search" />
          </div>
          <WatchlistLink />
          <ThemeToggle />
        </div>
      </div>
      <HeaderNav
        className="sa-scroll flex gap-4 border-t border-border px-4 py-2 text-sm md:hidden"
        itemClassName="py-0.5"
      />
    </header>
  );
}
