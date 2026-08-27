"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { FmpSearchResult } from "@/lib/types";
import { quoteHref, quoteKind } from "@/lib/listings";
import { cn } from "@/lib/utils";

export function SearchBox({
  large = false,
  autoFocus = false,
  placeholder = "Search ticker, name, CIK, CUSIP, or ISIN",
}: {
  large?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<FmpSearchResult[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < 1) return;
    const handle = setTimeout(async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      if (!response.ok) return;
      const data = (await response.json()) as FmpSearchResult[];
      setResults(data);
      setOpen(true);
    }, 180);
    return () => clearTimeout(handle);
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

  return (
    <div ref={rootRef} className="relative w-full">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!trimmed) return;
          const exact = visibleResults.find((item) => item.symbol.toUpperCase() === trimmed.toUpperCase());
          if (exact) goResult(exact);
          else goSearch(trimmed);
        }}
      >
        <Search
          className={cn(
            "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted",
            large ? "h-5 w-5" : "h-4 w-4",
          )}
        />
        <input
          value={query}
          autoFocus={autoFocus}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => visibleResults.length && setOpen(true)}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-md border border-border-strong bg-background outline-none ring-brand/30 placeholder:text-muted focus:ring-2",
            large ? "h-14 pl-11 pr-4 text-lg shadow-sm" : "h-9 pl-9 pr-3 text-sm",
          )}
        />
      </form>
      {open && visibleResults.length > 0 ? (
        <ul className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-md border border-border bg-background py-1 shadow-lg">
          {visibleResults.map((item) => (
            <li key={`${item.symbol}-${item.exchange}`}>
              <button
                type="button"
                onClick={() => goResult(item)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted-bg"
              >
                <span>
                  <span className="font-semibold">{item.symbol}</span>
                  <span className="ml-2 text-sm text-muted">{item.name}</span>
                </span>
                <span className="text-xs text-muted">
                  {quoteKind(item.symbol, item)} · {item.exchange}
                </span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => goSearch(trimmed)}
              className="w-full px-3 py-2 text-left text-sm text-link hover:bg-muted-bg"
            >
              See all results for “{trimmed}”
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
