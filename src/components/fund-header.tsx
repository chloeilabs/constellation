import Link from "next/link";
import { WatchlistButton } from "@/components/watchlist-button";
import { ChangeValue } from "@/components/change";
import { formatPrice, formatUsd } from "@/lib/format";
import type { FmpProfile, FmpQuote } from "@/lib/types";

export function FundHeader({
  symbol,
  quote,
  profile,
}: {
  symbol: string;
  quote: FmpQuote | null;
  profile: FmpProfile | null;
}) {
  const name = profile?.companyName ?? quote?.name ?? symbol;
  const price = quote?.price ?? profile?.price;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 pt-5 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted">
              <Link href="/funds" className="hover:text-link">
                Mutual Funds
              </Link>
              <span> / {symbol}</span>
            </p>
            <h1 className="mt-1 text-2xl font-bold text-header md:text-3xl">
              {name} <span className="text-muted">({symbol})</span>
            </h1>
            <p className="mt-1 text-sm text-muted">
              {profile?.exchangeFullName ?? quote?.exchange ?? "Mutual fund"}
              {profile?.currency ? ` · ${profile.currency}` : null}
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-4">
              <div className="text-4xl font-semibold tabular">{price != null ? formatUsd(price) : "—"}</div>
              <ChangeValue change={quote?.change ?? profile?.change} percent={quote?.changePercentage ?? profile?.changePercentage} className="text-lg" />
            </div>
          </div>
          <div className="flex gap-2">
            <WatchlistButton symbol={symbol} />
            <Link
              href={`/compare?symbols=${symbol}`}
              className="inline-flex items-center rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium hover:bg-muted-bg"
            >
              Compare
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
