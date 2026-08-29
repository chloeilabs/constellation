"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import type { FmpSearchResult } from "@/lib/types";
import { quoteHref, quoteKind } from "@/lib/listings";
import { cn } from "@/lib/utils";

export function SearchBox({
  large = false,
  autoFocus = false,
  id,
  placeholder = "Search ticker, name, CIK, CUSIP, or ISIN",
}: {
  large?: boolean;
  autoFocus?: boolean;
  id?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const listId = useId();
  const inputId = id ?? `search-${listId}`;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<FmpSearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "empty" | "error">("idle");
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmed = query.trim();

  useEffect(() => {
    if (!autoFocus) return;
    if (window.matchMedia("(min-width: 768px)").matches) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (trimmed.length < 1) return;
    const controller = new AbortController();
    const handle = setTimeout(async () => {
      setStatus("loading");
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("search failed");
        const data = (await response.json()) as FmpSearchResult[];
        const rows = Array.isArray(data) ? data : [];
        setResults(rows);
        setOpen(true);
        setActiveIndex(rows.length ? 0 : -1);
        setStatus(rows.length ? "idle" : "empty");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResults([]);
        setOpen(true);
        setActiveIndex(-1);
        setStatus("error");
      }
    }, 180);
    return () => {
      controller.abort();
      clearTimeout(handle);
    };
  }, [trimmed]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function goResult(item: FmpSearchResult) {
    setOpen(false);
    setQuery("");
    router.push(quoteHref(item.symbol, item));
  }

  function goSearch(value: string) {
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  const visibleResults = trimmed.length < 1 ? [] : results;
  const showPanel = open && trimmed.length > 0;
  const optionCount = visibleResults.length + (trimmed ? 1 : 0);

  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!showPanel && (event.key === "ArrowDown" || event.key === "ArrowUp") && visibleResults.length) {
      setOpen(true);
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % Math.max(optionCount, 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index <= 0 ? Math.max(optionCount - 1, 0) : index - 1));
    }
    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      if (activeIndex < visibleResults.length) goResult(visibleResults[activeIndex]);
      else goSearch(trimmed);
    }
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          if (!trimmed) return;
          if (activeIndex >= 0 && activeIndex < visibleResults.length) {
            goResult(visibleResults[activeIndex]);
            return;
          }
          const exact = visibleResults.find((item) => item.symbol.toUpperCase() === trimmed.toUpperCase());
          if (exact) goResult(exact);
          else goSearch(trimmed);
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Search stocks, ETFs, and funds
        </label>
        <Search
          className={cn(
            "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted",
            large ? "h-5 w-5" : "h-4 w-4",
          )}
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={inputId}
          value={query}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-activedescendant={showPanel && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            if (!value.trim()) {
              setResults([]);
              setOpen(false);
              setStatus("idle");
              setActiveIndex(-1);
            }
          }}
          onFocus={() => {
            if (trimmed) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-md border border-border-strong bg-background outline-none ring-brand/30 placeholder:text-muted focus:border-brand focus:ring-2",
            large ? "h-14 pl-11 pr-4 text-lg shadow-sm" : "h-9 pl-9 pr-10 text-sm",
          )}
        />
        {status === "loading" ? (
          <Loader2
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted"
            aria-hidden="true"
          />
        ) : large ? null : (
          <kbd className="sa-kbd pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 xl:inline-flex">
            /
          </kbd>
        )}
      </form>
      {showPanel ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-md border border-border bg-background py-1 shadow-[var(--shadow-lg)]"
        >
          {status === "loading" && visibleResults.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">Searching…</li>
          ) : null}
          {status === "error" ? (
            <li className="px-3 py-2 text-sm text-loss">Search failed. Try again.</li>
          ) : null}
          {status === "empty" ? (
            <li className="px-3 py-2 text-sm text-muted">No matches for “{trimmed}”.</li>
          ) : null}
          {visibleResults.map((item, index) => (
            <li key={`${item.symbol}-${item.exchange}`} role="none">
              <Link
                id={`${listId}-${index}`}
                role="option"
                aria-selected={activeIndex === index}
                href={quoteHref(item.symbol, item)}
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-3 py-2 text-left",
                  activeIndex === index ? "bg-muted-bg" : "hover:bg-muted-bg",
                )}
              >
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="font-semibold">{item.symbol}</span>
                  <span className="truncate text-sm text-muted">{item.name}</span>
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {quoteKind(item.symbol, item)} · {item.exchange}
                </span>
              </Link>
            </li>
          ))}
          {trimmed ? (
            <li role="none">
              <button
                id={`${listId}-${visibleResults.length}`}
                type="button"
                role="option"
                aria-selected={activeIndex === visibleResults.length}
                onMouseEnter={() => setActiveIndex(visibleResults.length)}
                onClick={() => goSearch(trimmed)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm text-link",
                  activeIndex === visibleResults.length ? "bg-muted-bg" : "hover:bg-muted-bg",
                )}
              >
                See all results for “{trimmed}”
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

export function SearchHotkey() {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      event.stopPropagation();
      const hero = document.getElementById("hero-search");
      const desktop = document.getElementById("site-search") ?? hero;
      const mobile = document.getElementById("site-search-mobile") ?? hero;
      const wide = window.matchMedia("(min-width: 768px)").matches;
      const field = wide ? desktop : mobile;
      if (!(field instanceof HTMLElement)) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.setTimeout(() => {
        field.focus({ preventScroll: true });
        field.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
      }, 0);
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);
  return null;
}

export function MobileSearchRow() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return (
    <div className="border-t border-border px-4 py-2 md:hidden">
      <SearchBox id="site-search-mobile" placeholder="Search ticker or company" />
    </div>
  );
}

export function DesktopSearchRow() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return (
    <div className="hidden min-w-0 w-full max-w-md md:block">
      <SearchBox id="site-search" placeholder="Search ticker or company" />
    </div>
  );
}
