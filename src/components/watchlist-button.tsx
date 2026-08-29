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

export function toggleWatchlist(symbol: string) {
  const current = readWatchlist();
  const upper = symbol.toUpperCase();
  writeWatchlist(current.includes(upper) ? current.filter((item) => item !== upper) : [...current, upper]);
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

  return (
    <button
      type="button"
      onClick={() => toggleWatchlist(symbol)}
      aria-pressed={saved}
      className={cn(
        "sa-btn",
        saved ? "border border-brand bg-brand/10 text-brand" : "sa-btn-secondary",
      )}
    >
      <Star className={cn("h-4 w-4", saved ? "fill-brand" : "")} aria-hidden="true" />
      <span className="sm:hidden">{saved ? "Saved" : "Watch"}</span>
      <span className="hidden sm:inline">{saved ? "Watchlist" : "Add to Watchlist"}</span>
    </button>
  );
}

export function WatchlistLink() {
  return (
    <Link
      href="/watchlist"
      className="sa-icon-btn sm:w-auto sm:gap-1.5 sm:px-3 sm:text-sm sm:font-semibold"
      aria-label="Watchlist"
      title="Watchlist"
    >
      <Star className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Watchlist</span>
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
