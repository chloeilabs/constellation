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
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-2 md:h-14 md:grid-cols-[auto_auto_minmax(0,1fr)_auto] md:py-0">
        <Logo />
        <HeaderNav className="hidden items-center gap-5 text-sm md:flex" />
        <div className="col-span-3 row-start-2 min-w-0 md:col-span-1 md:col-start-3 md:row-start-1 md:max-w-md md:justify-self-end md:w-full">
          <SearchBox id="site-search" placeholder="Search ticker or company" />
        </div>
        <div className="col-start-3 row-start-1 flex items-center gap-2 md:col-start-4">
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
