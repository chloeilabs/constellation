"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "sa-watchlist";

export function readWatchlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeWatchlist(symbols: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols));
  window.dispatchEvent(new Event("sa-watchlist"));
}

export function WatchlistButton({ symbol }: { symbol: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(readWatchlist().includes(symbol.toUpperCase()));
    sync();
    window.addEventListener("sa-watchlist", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("sa-watchlist", sync);
      window.removeEventListener("storage", sync);
    };
  }, [symbol]);

  function toggle() {
    const current = readWatchlist();
    const upper = symbol.toUpperCase();
    writeWatchlist(current.includes(upper) ? current.filter((item) => item !== upper) : [...current, upper]);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium",
        saved
          ? "border-brand bg-green-50 text-brand"
          : "border-border-strong bg-white text-header hover:bg-muted-bg",
      )}
    >
      <Star className={cn("h-4 w-4", saved ? "fill-brand" : "")} />
      {saved ? "Watchlist" : "Add to Watchlist"}
    </button>
  );
}

export function WatchlistLink() {
  return (
    <Link
      href="/watchlist"
      className="hidden items-center gap-1 text-sm font-medium text-header hover:text-brand sm:inline-flex"
    >
      <Star className="h-4 w-4" />
      Watchlist
    </Link>
  );
}

export function useWatchlist() {
  const [symbols, setSymbols] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setSymbols(readWatchlist());
    sync();
    window.addEventListener("sa-watchlist", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("sa-watchlist", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return symbols;
}
