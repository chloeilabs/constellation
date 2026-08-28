import Link from "next/link";
import { WatchlistButton } from "@/components/watchlist-button";
import { EtfSubnav } from "@/components/etf-subnav";
import { QuoteHeaderStats } from "@/components/quote-header-stats";
import { ChangeValue } from "@/components/change";
import { formatCompactMoney, formatInteger, formatMoney, formatPercentPlain, formatPrice } from "@/lib/format";
import { nyExtendedCopy, isExtendedSession } from "@/lib/utils";
import type { FmpAftermarketQuote, FmpEtfInfo, FmpQuote } from "@/lib/types";

export function EtfHeader({
  symbol,
  quote,
  info,
  afterHours,
  holdingsCount,
}: {
  symbol: string;
  quote: FmpQuote | null;
  info: FmpEtfInfo | null;
  afterHours: FmpAftermarketQuote | null;
  holdingsCount?: number | null;
}) {
  const name = info?.name ?? quote?.name ?? symbol;
  const price = quote?.price;
  const afterPrice = afterHours?.lastPrice || afterHours?.bidPrice || afterHours?.askPrice;
  const afterChange = afterPrice && price ? afterPrice - price : null;
  const afterPct = afterChange != null && price ? (afterChange / price) * 100 : null;
  const extendedLabel = nyExtendedCopy().label;

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-4 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted">
              <Link href="/etf" className="hover:text-link">
                ETFs
              </Link>
              <span> / {symbol}</span>
            </p>
            <h1 className="mt-1 text-2xl font-bold text-header md:text-3xl">
              {name} <span className="text-muted">({symbol})</span>
            </h1>
            <p className="mt-1 text-sm text-muted">
              {info?.etfCompany ? `${info.etfCompany} · ` : null}
              {info?.assetClass || quote?.exchange || "ETF"}
              {info?.inceptionDate ? ` · Inception ${info.inceptionDate}` : null}
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-4">
              <div className="text-4xl font-semibold tabular">{price != null ? formatMoney(price, "USD") : "—"}</div>
              <ChangeValue change={quote?.change} percent={quote?.changePercentage} className="text-lg" />
            </div>
            {isExtendedSession() && afterPrice ? (
              <p className="mt-1 text-sm text-muted">
                {extendedLabel} {formatPrice(afterPrice)}{" "}
                <ChangeValue change={afterChange} percent={afterPct} />
              </p>
            ) : null}
            <QuoteHeaderStats
              items={[
                { label: "AUM", value: formatCompactMoney(info?.assetsUnderManagement ?? quote?.marketCap, "USD") },
                { label: "NAV", value: info?.nav != null ? formatMoney(info.nav, info.navCurrency || "USD") : "—" },
                {
                  label: "Expense Ratio",
                  value: info?.expenseRatio != null ? formatPercentPlain(info.expenseRatio, { alreadyPercent: true }) : "—",
                },
                { label: "Holdings", value: formatInteger(holdingsCount ?? info?.holdingsCount) },
                { label: "Volume", value: formatInteger(quote?.volume ?? info?.avgVolume) },
              ]}
            />
          </div>
          <div className="flex gap-2">
            <WatchlistButton symbol={symbol} />
            <Link
              href={`/stocks/${symbol}`}
              className="inline-flex items-center rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium hover:bg-muted-bg"
            >
              Full quote
            </Link>
            <Link
              href={`/etf/compare?symbols=${symbol}`}
              className="inline-flex items-center rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium hover:bg-muted-bg"
            >
              Compare
            </Link>
          </div>
        </div>
        <EtfSubnav symbol={symbol} />
      </div>
    </div>
  );
}
