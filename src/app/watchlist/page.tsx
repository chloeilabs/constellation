"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { ChangeValue } from "@/components/change";
import { useWatchlist } from "@/components/watchlist-button";
import { formatCompactUsd, formatPrice } from "@/lib/format";
import type { FmpQuote } from "@/lib/types";

export default function WatchlistPage() {
  const symbols = useWatchlist();
  const key = symbols.join(",");
  const [data, setData] = useState<{ key: string; quotes: FmpQuote[] } | null>(null);

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    fetch(`/api/quotes?symbols=${encodeURIComponent(key)}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((quotes: FmpQuote[]) => {
        setData({ key, quotes: Array.isArray(quotes) ? quotes : [] });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setData({ key, quotes: [] });
      });
    return () => controller.abort();
  }, [key]);

  const quotes = data?.key === key ? data.quotes : null;

  return (
    <Container>
      <PageHeader title="Watchlist" description="Stocks you save are stored in this browser." />
      {symbols.length === 0 ? (
        <p className="text-sm text-muted">
          Your watchlist is empty. Open a stock and click <span className="font-medium">Add to Watchlist</span>.
        </p>
      ) : quotes == null ? (
        <p className="text-sm text-muted">Loading quotes…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th className="num">Price</th>
                <th className="num">Change</th>
                <th className="num">Market Cap</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.symbol}>
                  <td className="symbol">
                    <Link href={`/stocks/${quote.symbol}`} className="text-link hover:underline">
                      {quote.symbol}
                    </Link>
                  </td>
                  <td>{quote.name}</td>
                  <td className="num">{formatPrice(quote.price)}</td>
                  <td className="num">
                    <ChangeValue change={quote.change} percent={quote.changePercentage} />
                  </td>
                  <td className="num">{formatCompactUsd(quote.marketCap)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}
