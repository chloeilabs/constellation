"use client";

import Link from "next/link";
import { Container, EmptyState } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { ChangeValue } from "@/components/change";
import { toggleWatchlist, useWatchlist } from "@/components/watchlist-button";
import { formatCompactUsd, formatPrice } from "@/lib/format";
import { quoteHref } from "@/lib/listings";
import type { FmpQuote } from "@/lib/types";
import { useEffect, useState } from "react";

export default function WatchlistPage() {
  const symbols = useWatchlist();
  const key = symbols.join(",");
  const [data, setData] = useState<{ key: string; quotes: FmpQuote[]; error: boolean } | null>(null);

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    fetch(`/api/quotes?symbols=${encodeURIComponent(key)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("quotes failed");
        return response.json();
      })
      .then((quotes: FmpQuote[]) => {
        setData({ key, quotes: Array.isArray(quotes) ? quotes : [], error: false });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setData({ key, quotes: [], error: true });
      });
    return () => controller.abort();
  }, [key]);

  const quotes = data?.key === key ? data.quotes : null;
  const quotesBySymbol = new Map((quotes ?? []).map((quote) => [quote.symbol.toUpperCase(), quote]));

  return (
    <Container>
      <PageHeader title="Watchlist" description="Stocks you save are stored in this browser." />
      {symbols.length === 0 ? (
        <EmptyState
          title="Your watchlist is empty"
          message="Open a quote and click Add to Watchlist. Saved symbols stay in this browser only."
          action={
            <Link href="/screener" className="sa-btn sa-btn-primary">
              Browse the screener
            </Link>
          }
        />
      ) : quotes == null ? (
        <div className="overflow-hidden rounded-lg border border-border" aria-busy="true">
          <span className="sr-only">Loading quotes</span>
          {Array.from({ length: Math.min(symbols.length, 6) }, (_, index) => (
            <div key={index} className="h-12 animate-pulse border-b border-border bg-muted-bg last:border-0" />
          ))}
        </div>
      ) : (
        <>
          {data?.error ? (
            <p className="mb-3 text-sm text-loss">Quotes could not be loaded. Your saved symbols are still listed.</p>
          ) : null}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th className="num">Price</th>
                  <th className="num">Change</th>
                  <th className="num">Market Cap</th>
                  <th className="num">Remove</th>
                </tr>
              </thead>
              <tbody>
                {symbols.map((symbol) => {
                  const quote = quotesBySymbol.get(symbol.toUpperCase());
                  return (
                    <tr key={symbol}>
                      <td className="symbol">
                        <Link
                          href={quoteHref(symbol, { name: quote?.name, exchange: quote?.exchange })}
                          className="text-link hover:underline"
                        >
                          {symbol}
                        </Link>
                      </td>
                      <td className="max-w-[260px] truncate">{quote?.name ?? "—"}</td>
                      <td className="num">{quote ? formatPrice(quote.price) : "—"}</td>
                      <td className="num">
                        {quote ? <ChangeValue change={quote.change} percent={quote.changePercentage} /> : "—"}
                      </td>
                      <td className="num">{quote ? formatCompactUsd(quote.marketCap) : "—"}</td>
                      <td className="num">
                        <button
                          type="button"
                          className="sa-btn sa-btn-secondary h-8 px-2.5 text-xs"
                          onClick={() => toggleWatchlist(symbol)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Container>
  );
}
