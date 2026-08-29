"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { pathPrefix, samePath } from "@/lib/listings";
import { cn } from "@/lib/utils";

export {
  MARKET_NAV,
  extendedHoursNav,
  CALENDAR_NAV,
  IPO_NAV,
  STOCKS_NAV,
  HEATMAP_INDEX_NAV,
  INDEX_CHANGES_NAV,
  NEWS_NAV,
  ETF_NAV,
  CONGRESS_NAV,
  quoteFundamentalsNav,
  quoteNewsNav,
  etfQuoteNav,
} from "@/lib/nav";

type NavItem = { href: string; label: string; match?: "exact" | "prefix" };

function JumpTo({ items, activeHref }: { items: NavItem[]; activeHref: string }) {
  const router = useRouter();
  const listId = useId();
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const active = items.find((item) => item.href === activeHref);
  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const optionId = (index: number) => `${listId}-opt-${index}`;

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function openPanel() {
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  }

  function closePanel() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closePanel();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % Math.max(filtered.length, 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? Math.max(filtered.length - 1, 0) : index - 1));
    }
    if (event.key === "Enter" && filtered[activeIndex]) {
      event.preventDefault();
      go(filtered[activeIndex].href);
    }
  }

  return (
    <div ref={rootRef} className="relative min-w-0 w-full sm:w-auto">
      <button
        ref={triggerRef}
        type="button"
        className="sa-input flex w-full items-center justify-between gap-2 text-left sm:w-64"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : openPanel())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            openPanel();
          }
        }}
      >
        <span className="truncate">{active?.label ?? "Jump to a page"}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open ? (
        <div className="absolute z-50 mt-1 w-full min-w-72 max-w-[calc(100vw-2rem)] rounded-md border border-border bg-background shadow-[var(--shadow-lg)] sm:w-72">
          <label htmlFor={inputId} className="sr-only">
            Filter pages
          </label>
          <input
            id={inputId}
            value={query}
            autoFocus
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Filter…"
            className="sa-input rounded-none rounded-t-md border-0 border-b border-border"
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={filtered[activeIndex] ? optionId(activeIndex) : undefined}
          />
          <ul id={listId} role="listbox" className="max-h-72 overflow-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted">No matches for “{query.trim()}”.</li>
            ) : (
              filtered.map((item, index) => (
                <li key={item.href} role="none">
                  <button
                    id={optionId(index)}
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => go(item.href)}
                    className={cn(
                      "flex w-full px-3 py-1.5 text-left text-sm",
                      index === activeIndex ? "bg-muted-bg text-header" : "text-header",
                    )}
                  >
                    {item.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function SectionNav({
  items,
  label = "Related pages",
}: {
  items: NavItem[];
  label?: string;
}) {
  const pathname = usePathname();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dense = items.length > 7;
  const jumbo = items.length > 12;
  const activeItem =
    items.find((item) =>
      item.match === "prefix" ? pathPrefix(pathname, item.href) : samePath(pathname, item.href),
    ) ?? null;

  useLayoutEffect(() => {
    const root = scrollerRef.current;
    const active = root?.querySelector<HTMLElement>("[aria-current='page']");
    if (!root || !active) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const left = active.offsetLeft - root.clientWidth / 2 + active.offsetWidth / 2;
    root.scrollTo({ left: Math.max(0, left), behavior: reduce ? "auto" : "smooth" });
  }, [pathname, items]);

  return (
    <nav aria-label={label} className="mb-5">
      {jumbo ? (
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="text-sm text-muted">Jump to</span>
          <JumpTo items={items} activeHref={activeItem?.href ?? items[0]?.href ?? ""} />
        </div>
      ) : null}
      <div className={cn("relative", jumbo && "hidden md:block")}>
        <div
          ref={scrollerRef}
          className={cn(dense ? "sa-scroll sa-scroll-hide flex gap-2 pb-1" : "flex flex-wrap gap-2")}
        >
          {items.map((item) => {
            const active =
              item.match === "prefix" ? pathPrefix(pathname, item.href) : samePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("sa-chip shrink-0", !dense && "whitespace-nowrap")}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        {dense ? (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background"
            aria-hidden="true"
          />
        ) : null}
      </div>
    </nav>
  );
}
