import Link from "next/link";
import { WatchlistButton } from "@/components/watchlist-button";
import { StockSubnav } from "@/components/stock-subnav";
import { ChangeValue } from "@/components/change";
import { formatMoney, formatPrice } from "@/lib/format";
import { industrySlug, sectorHref } from "@/lib/industries";
import { nyExtendedCopy } from "@/lib/utils";
import type { FmpAftermarketQuote, FmpProfile, FmpQuote } from "@/lib/types";

export function StockHeader({
  symbol,
  quote,
  profile,
  afterHours,
}: {
  symbol: string;
  quote: FmpQuote | null;
  profile: FmpProfile | null;
  afterHours: FmpAftermarketQuote | null;
}) {
  const name = profile?.companyName ?? quote?.name ?? symbol;
  const price = quote?.price;
  const afterPrice = afterHours?.lastPrice || afterHours?.bidPrice || afterHours?.askPrice;
  const afterChange = afterPrice && price ? afterPrice - price : null;
  const afterPct = afterChange != null && price ? (afterChange / price) * 100 : null;
  const extendedLabel = nyExtendedCopy().label;
  const isIndex = symbol.startsWith("^");
  const px = (value: number | null | undefined) =>
    isIndex ? formatPrice(value) : formatMoney(value, profile?.currency);

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            {profile?.image ? (
              // Company logos are hosted by FMP and other CDNs.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.image}
                alt=""
                width={48}
                height={48}
                className="mt-1 h-12 w-12 rounded-md border border-border bg-white object-contain"
              />
            ) : null}
            <div>
              <h1 className="text-2xl font-bold text-header md:text-3xl">
                {name} <span className="text-muted">({symbol})</span>
                {profile?.isEtf ? (
                  <Link
                    href={`/etf/${symbol}`}
                    className="ml-2 align-middle rounded bg-chip px-1.5 py-0.5 text-xs font-semibold text-header"
                  >
                    ETF
                  </Link>
                ) : null}
                {profile?.isFund && !profile?.isEtf ? (
                  <Link
                    href={`/funds/${symbol}`}
                    className="ml-2 align-middle rounded bg-chip px-1.5 py-0.5 text-xs font-semibold text-header"
                  >
                    Fund
                  </Link>
                ) : null}
                {isIndex ? (
                  <span className="ml-2 align-middle rounded bg-chip px-1.5 py-0.5 text-xs font-semibold text-header">
                    Index
                  </span>
                ) : null}
              </h1>
              <p className="mt-1 text-sm text-muted">
                {profile?.exchangeFullName ?? quote?.exchange ?? "—"}
                {profile?.currency ? ` · ${profile.currency}` : null}
                {profile?.sector ? (
                  <>
                    {" · "}
                    <Link href={sectorHref(profile.sector)} className="hover:text-link hover:underline">
                      {profile.sector}
                    </Link>
                  </>
                ) : null}
                {profile?.industry ? (
                  <>
                    {" · "}
                    <Link href={`/stocks/industry/${industrySlug(profile.industry)}`} className="hover:text-link hover:underline">
                      {profile.industry}
                    </Link>
                  </>
                ) : null}
              </p>
              <div className="mt-3 flex flex-wrap items-end gap-4">
                <div className="text-4xl font-semibold tabular">
                  {price != null ? px(price) : "—"}
                </div>
                <ChangeValue change={quote?.change} percent={quote?.changePercentage} className="text-lg" />
              </div>
              {afterPrice ? (
                <p className="mt-1 text-sm text-muted">
                  {extendedLabel} {px(afterPrice)}{" "}
                  <ChangeValue change={afterChange} percent={afterPct} />
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex gap-2">
            <WatchlistButton symbol={symbol} />
            {isIndex ? null : (
              <Link
                href={`/compare?symbols=${encodeURIComponent(symbol)}`}
                className="inline-flex items-center rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium hover:bg-muted-bg"
              >
                Compare
              </Link>
            )}
          </div>
        </div>
        <StockSubnav symbol={symbol} />
      </div>
    </div>
  );
}
