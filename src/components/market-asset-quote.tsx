import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/container";
import { NewsList } from "@/components/news-list";
import { PriceChart } from "@/components/price-chart";
import { StatGrid } from "@/components/quote-stats";
import { ReturnsTable } from "@/components/returns-table";
import { SectionNav } from "@/components/section-nav";
import { WatchlistButton } from "@/components/watchlist-button";
import { ChangePercent, ChangeValue } from "@/components/change";
import { QuoteHeaderStats } from "@/components/quote-header-stats";
import { formatCompact, formatCompactUsd, formatDate, formatInteger, formatMoney, formatPercentPlain, formatPrice } from "@/lib/format";
import { loadQuoteChart } from "@/lib/chart";
import { getCotAnalysis, getCryptoNews, getForexNews, getPriceChange, getQuote, getSymbolNews, hasFmpKey } from "@/lib/fmp";
import { MARKET_NAV } from "@/lib/nav";
import {
  MARKET_ASSET_LABEL,
  marketAssetHref,
  marketAssetKind,
  marketAssetListHref,
  normalizeMarketTicker,
  type MarketAssetKind,
} from "@/lib/listings";
import { commodityContractRoot } from "@/lib/markets";
import { addDays, cn, isoDate, nyDateString } from "@/lib/utils";

function priceLabel(kind: MarketAssetKind, value: number | null | undefined, digits?: number) {
  if (kind === "forex") return formatPrice(value, digits ?? 4);
  return formatMoney(value, "USD", digits);
}

function kindNews(symbol: string, kind: MarketAssetKind) {
  if (kind === "crypto") return getCryptoNews(symbol, 12);
  if (kind === "forex") return getForexNews(symbol, 12);
  return getSymbolNews(symbol, 12);
}

export async function marketAssetMetadata(symbol: string, expected: MarketAssetKind) {
  const ticker = normalizeMarketTicker(symbol);
  const quote = await getQuote(ticker);
  const name = quote?.name ?? ticker;
  const kind = MARKET_ASSET_LABEL[expected];
  return {
    title: `${name} (${ticker}) ${kind} Price`,
    description: `Live ${kind.toLowerCase()} quote, chart, and related market data for ${name} (${ticker}).`,
  };
}

export async function MarketAssetQuote({
  symbol,
  expected,
  range: rangeParam,
}: {
  symbol: string;
  expected: MarketAssetKind;
  range?: string;
}) {
  const ticker = normalizeMarketTicker(symbol);
  const today = nyDateString();
  const cotFrom = isoDate(addDays(new Date(`${today}T00:00:00Z`), -90));
  const cotSymbol = expected === "commodity" ? commodityContractRoot(ticker) : "";
  const [quote, chart, priceChange, news, cotRows] = await Promise.all([
    getQuote(ticker),
    loadQuoteChart(ticker, rangeParam),
    getPriceChange(ticker),
    kindNews(ticker, expected),
    cotSymbol ? getCotAnalysis(cotFrom, today, cotSymbol) : Promise.resolve([]),
  ]);
  const { range, points, ma50Series, ma200Series, ema12Series, ema26Series, rsiSeries } = chart;

  if (!quote) {
    if (!hasFmpKey()) {
      return (
        <Container>
          <p className="text-sm text-muted">Live {MARKET_ASSET_LABEL[expected].toLowerCase()} quotes require an FMP API key.</p>
        </Container>
      );
    }
    notFound();
  }

  const classified = marketAssetKind(ticker, { exchange: quote.exchange, name: quote.name });
  if (classified !== expected) {
    const canonical = classified ? marketAssetHref(ticker, { exchange: quote.exchange, name: quote.name }) : null;
    if (canonical) redirect(canonical);
    notFound();
  }
  const kind = classified;
  const name = quote.name || ticker;
  const listHref = marketAssetListHref(kind);
  const kindLabel = MARKET_ASSET_LABEL[kind];
  const priceDigits = kind === "forex" ? 4 : 2;
  const href = `${listHref}/${ticker}`;
  const cotHistory = [...cotRows].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const latestCot = cotHistory[0] ?? null;

  return (
    <>
      <div className="bg-background">
        <div className="mx-auto max-w-7xl px-4 pt-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted">
                <Link href="/markets" className="hover:text-link">
                  Markets
                </Link>
                {" / "}
                <Link href={listHref} className="hover:text-link">
                  {kindLabel}
                </Link>
                <span> / {ticker}</span>
              </p>
              <h1 className="mt-1 text-2xl font-bold text-header md:text-3xl">
                {name} <span className="text-muted">({ticker})</span>
                <span className="ml-2 align-middle rounded bg-chip px-1.5 py-0.5 text-xs font-semibold text-header">
                  {kindLabel}
                </span>
              </h1>
              <p className="mt-1 text-sm text-muted">{quote.exchange || kindLabel}</p>
              <div className="mt-3 flex flex-wrap items-end gap-4">
                <div className="text-4xl font-semibold tabular">{priceLabel(kind, quote.price, priceDigits)}</div>
                <ChangeValue
                  change={quote.change}
                  percent={quote.changePercentage}
                  alreadyPercent
                  className="text-lg"
                />
              </div>
              <QuoteHeaderStats
                items={[
                  {
                    label: "Day Range",
                    value:
                      quote.dayLow != null && quote.dayHigh != null
                        ? `${priceLabel(kind, quote.dayLow, priceDigits)} – ${priceLabel(kind, quote.dayHigh, priceDigits)}`
                        : "—",
                  },
                  {
                    label: "52-Week",
                    value:
                      quote.yearLow != null && quote.yearHigh != null
                        ? `${priceLabel(kind, quote.yearLow, priceDigits)} – ${priceLabel(kind, quote.yearHigh, priceDigits)}`
                        : "—",
                  },
                  { label: "Volume", value: formatInteger(quote.volume) },
                  { label: "Avg. Volume", value: formatInteger(quote.avgVolume) },
                  {
                    label: kind === "crypto" ? "Market Cap" : "Open",
                    value:
                      kind === "crypto"
                        ? formatCompactUsd(quote.marketCap)
                        : priceLabel(kind, quote.open, priceDigits),
                  },
                ]}
              />
            </div>
            <WatchlistButton symbol={ticker} />
          </div>
        </div>
      </div>
      <Container>
        <SectionNav items={MARKET_NAV} />
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,24rem)]">
          <div>
            <PriceChart
              points={points}
              range={range}
              symbol={ticker}
              chartHref={href}
              ma50={quote.priceAvg50}
              ma200={quote.priceAvg200}
              ma50Series={ma50Series}
              ma200Series={ma200Series}
              ema12Series={ema12Series}
              ema26Series={ema26Series}
              rsiSeries={rsiSeries}
            />
            <ReturnsTable changes={priceChange} />
          </div>
          <StatGrid
            items={[
              { label: kind === "forex" ? "Rate" : "Price", value: priceLabel(kind, quote.price, priceDigits) },
              { label: "Change", value: <ChangeValue change={quote.change} percent={quote.changePercentage} /> },
              { label: "Open", value: priceLabel(kind, quote.open, priceDigits) },
              { label: "Previous Close", value: priceLabel(kind, quote.previousClose, priceDigits) },
              {
                label: "Day Range",
                value:
                  quote.dayLow != null && quote.dayHigh != null
                    ? `${priceLabel(kind, quote.dayLow, priceDigits)} – ${priceLabel(kind, quote.dayHigh, priceDigits)}`
                    : "—",
              },
              {
                label: "52 Week Range",
                value:
                  quote.yearLow != null && quote.yearHigh != null
                    ? `${priceLabel(kind, quote.yearLow, priceDigits)} – ${priceLabel(kind, quote.yearHigh, priceDigits)}`
                    : "—",
              },
              ...(kind === "crypto" && quote.marketCap
                ? [{ label: "Market Cap", value: formatCompactUsd(quote.marketCap) }]
                : []),
              { label: "Volume", value: quote.volume ? formatCompact(quote.volume) : "—" },
              {
                label: "Avg. Volume",
                value: quote.avgVolume ? formatCompact(quote.avgVolume) : "—",
              },
              { label: "MA 50", value: priceLabel(kind, quote.priceAvg50, priceDigits) },
              { label: "MA 200", value: priceLabel(kind, quote.priceAvg200, priceDigits) },
              { label: "Exchange", value: quote.exchange || "—" },
            ]}
          />
        </div>

        {kind === "commodity" && latestCot ? (
          <section className="mt-10">
            <div className="mb-3 flex items-end justify-between gap-4">
              <h2 className="text-xl font-semibold text-header">Commitment of Traders</h2>
              <Link href="/markets/commodities" className="text-sm text-link hover:underline">
                All commodities
              </Link>
            </div>
            <p className="mb-3 text-sm text-muted">
              CFTC positioning from FMP for {latestCot.name || ticker}
              {latestCot.date ? ` · week of ${formatDate(latestCot.date)}` : ""}. Net position is non-commercial
              longs minus shorts.
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Situation</th>
                    <th>Sentiment</th>
                    <th className="num">Net Position</th>
                    <th className="num">Net Chg</th>
                    <th className="num">Long %</th>
                    <th className="num">Short %</th>
                  </tr>
                </thead>
                <tbody>
                  {cotHistory.map((row) => {
                    const bullish = /bullish/i.test(row.marketSituation || "");
                    const bearish = /bearish/i.test(row.marketSituation || "");
                    return (
                      <tr key={row.date}>
                        <td>{formatDate(row.date)}</td>
                        <td className={cn("font-medium", bullish && "text-gain", bearish && "text-loss")}>
                          {row.marketSituation || "—"}
                        </td>
                        <td className="text-muted">{row.marketSentiment || "—"}</td>
                        <td className="num">{formatInteger(row.netPostion)}</td>
                        <td className="num">
                          <ChangePercent value={row.changeInNetPosition} alreadyPercent />
                        </td>
                        <td className="num">
                          {formatPercentPlain(row.currentLongMarketSituation, { alreadyPercent: true })}
                        </td>
                        <td className="num">
                          {formatPercentPlain(row.currentShortMarketSituation, { alreadyPercent: true })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <section className="mt-10">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-xl font-semibold text-header">News</h2>
            <Link href={kind === "crypto" ? "/news/crypto" : kind === "forex" ? "/news/forex" : listHref} className="text-sm text-link hover:underline">
              All {kindLabel.toLowerCase()} news
            </Link>
          </div>
          {news.length === 0 ? (
            <p className="text-sm text-muted">FMP has no headlines tagged to {ticker}.</p>
          ) : (
            <NewsList items={news} />
          )}
        </section>
      </Container>
    </>
  );
}
