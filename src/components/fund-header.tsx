import Link from "next/link";
import { WatchlistButton } from "@/components/watchlist-button";
import { FundSubnav } from "@/components/fund-subnav";
import { QuoteHeaderStats } from "@/components/quote-header-stats";
import { ChangeValue } from "@/components/change";
import { formatCompactMoney, formatInteger, formatMoney, formatPercentPlain } from "@/lib/format";
import type { FmpEtfInfo, FmpProfile, FmpQuote } from "@/lib/types";

export function FundHeader({
  symbol,
  quote,
  profile,
  info,
  holdingsCount,
}: {
  symbol: string;
  quote: FmpQuote | null;
  profile: FmpProfile | null;
  info: FmpEtfInfo | null;
  holdingsCount?: number | null;
}) {
  const name = info?.name ?? profile?.companyName ?? quote?.name ?? symbol;
  const price = quote?.price ?? profile?.price;

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-4 pt-5">
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
              <span className="ml-2 align-middle rounded bg-chip px-1.5 py-0.5 text-xs font-semibold text-header">
                Fund
              </span>
            </h1>
            <p className="mt-1 text-sm text-muted">
              {info?.etfCompany ? `${info.etfCompany} · ` : null}
              {info?.assetClass || profile?.exchangeFullName || quote?.exchange || "Mutual fund"}
              {profile?.currency ? ` · ${profile.currency}` : null}
              {info?.expenseRatio != null ? ` · ${formatPercentPlain(info.expenseRatio, { alreadyPercent: true })} expense` : null}
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-4">
              <div className="text-4xl font-semibold tabular">{price != null ? formatMoney(price, profile?.currency) : "—"}</div>
              <ChangeValue change={quote?.change ?? profile?.change} percent={quote?.changePercentage ?? profile?.changePercentage} className="text-lg" />
            </div>
            <QuoteHeaderStats
              items={[
                { label: "AUM", value: formatCompactMoney(info?.assetsUnderManagement ?? quote?.marketCap ?? profile?.marketCap, profile?.currency) },
                {
                  label: "Expense Ratio",
                  value: info?.expenseRatio != null ? formatPercentPlain(info.expenseRatio, { alreadyPercent: true }) : "—",
                },
                { label: "Holdings", value: formatInteger(holdingsCount ?? info?.holdingsCount) },
                { label: "Volume", value: formatInteger(quote?.volume ?? profile?.volume) },
                {
                  label: "52-Week",
                  value: quote ? `${formatMoney(quote.yearLow, profile?.currency)} – ${formatMoney(quote.yearHigh, profile?.currency)}` : "—",
                },
              ]}
            />
          </div>
          <div className="flex gap-2">
            <WatchlistButton symbol={symbol} />
            <Link
              href={`/etf/compare?symbols=${symbol}`}
              className="inline-flex items-center rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium hover:bg-muted-bg"
            >
              Compare
            </Link>
          </div>
        </div>
        <FundSubnav symbol={symbol} />
      </div>
    </div>
  );
}
