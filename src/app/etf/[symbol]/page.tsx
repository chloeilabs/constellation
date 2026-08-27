import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { ChangeValue } from "@/components/change";
import { NewsList } from "@/components/news-list";
import { WatchlistButton } from "@/components/watchlist-button";
import { formatCompactUsd, formatInteger, formatPercentPlain, formatPrice, formatUsd } from "@/lib/format";
import { getEtfCountryWeights, getEtfHoldings, getEtfInfo, getEtfSectors, getQuote, getSymbolNews, hasFmpKey } from "@/lib/fmp";
import { parseWeightPercentage } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const info = await getEtfInfo(symbol);
  const ticker = symbol.toUpperCase();
  return {
    title: `${info?.name ?? ticker} (${ticker}) ETF`,
    description: info?.description?.slice(0, 160) ?? `${ticker} ETF holdings, sectors, countries, and quote.`,
  };
}

export default async function EtfPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = symbol.toUpperCase();
  const [info, holdings, sectors, countries, quote, news] = await Promise.all([
    getEtfInfo(ticker),
    getEtfHoldings(ticker),
    getEtfSectors(ticker),
    getEtfCountryWeights(ticker),
    getQuote(ticker),
    getSymbolNews(ticker, 8),
  ]);

  if (!info && !quote) {
    if (!hasFmpKey()) {
      return (
        <Container>
          <h1 className="text-2xl font-bold text-header">{ticker}</h1>
          <p className="mt-2 text-sm text-muted">Add an FMP API key to load ETF data.</p>
        </Container>
      );
    }
    notFound();
  }

  const name = info?.name ?? quote?.name ?? ticker;
  const rankedSectors = [...sectors].sort((a, b) => (b.weightPercentage ?? 0) - (a.weightPercentage ?? 0));
  const rankedCountries = [...countries]
    .map((row) => ({ country: row.country, weight: parseWeightPercentage(row.weightPercentage) }))
    .filter((row) => row.country && row.weight > 0)
    .sort((a, b) => b.weight - a.weight);
  const topHoldings = holdings.slice(0, 25);
  const maxSector = Math.max(...rankedSectors.map((row) => row.weightPercentage || 0), 1);
  const maxCountry = Math.max(...rankedCountries.map((row) => row.weight), 1);

  return (
    <Container>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-sm text-muted">
            <Link href="/etf" className="hover:text-link">
              ETFs
            </Link>
            <span> / {ticker}</span>
          </p>
          <h1 className="mt-1 text-2xl font-bold text-header md:text-3xl">
            {name} <span className="text-muted">({ticker})</span>
          </h1>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <div className="text-4xl font-semibold tabular">{quote?.price != null ? formatUsd(quote.price) : "—"}</div>
            <ChangeValue change={quote?.change} percent={quote?.changePercentage} className="text-lg" />
          </div>
        </div>
        <div className="flex gap-2">
          <WatchlistButton symbol={ticker} />
          <Link
            href={`/stocks/${ticker}`}
            className="inline-flex items-center rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium hover:bg-muted-bg"
          >
            Full quote
          </Link>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
        {[
          ["AUM", formatCompactUsd(info?.assetsUnderManagement)],
          ["Expense Ratio", info?.expenseRatio != null ? formatPercentPlain(info.expenseRatio, { alreadyPercent: true }) : "—"],
          ["Holdings", formatInteger(info?.holdingsCount ?? holdings.length)],
          ["Avg Volume", formatInteger(info?.avgVolume)],
          ["NAV", info?.nav != null ? formatPrice(info.nav) : "—"],
          ["Asset Class", info?.assetClass || "—"],
          ["Issuer", info?.etfCompany || "—"],
          ["Inception", info?.inceptionDate || "—"],
        ].map(([label, value]) => (
          <div key={label} className="bg-white px-3 py-3">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="mt-1 text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      {info?.description ? (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-semibold text-header">About {ticker}</h2>
          <p className="max-w-4xl text-sm leading-7 text-header/90">{info.description}</p>
          {info.website ? (
            <p className="mt-3 text-sm">
              <a href={info.website} className="text-link hover:underline" target="_blank" rel="noreferrer">
                {info.website.replace(/^https?:\/\//, "")}
              </a>
            </p>
          ) : null}
        </section>
      ) : null}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <h2 className="mb-3 text-xl font-semibold text-header">Top Holdings</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th className="num">Weight</th>
                  <th className="num">Market Value</th>
                </tr>
              </thead>
              <tbody>
                {topHoldings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-muted">
                      Holdings are unavailable for this ETF.
                    </td>
                  </tr>
                ) : (
                  topHoldings.map((row, index) => (
                    <tr key={`${row.asset}-${index}`}>
                      <td className="text-muted">{index + 1}</td>
                      <td className="symbol">
                        {row.asset ? (
                          <Link href={`/stocks/${row.asset}`} className="text-link hover:underline">
                            {row.asset}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="max-w-[240px] truncate">{row.name}</td>
                      <td className="num">{formatPercentPlain(row.weightPercentage, { alreadyPercent: true })}</td>
                      <td className="num">{formatCompactUsd(row.marketValue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {holdings.length > topHoldings.length ? (
            <p className="mt-2 text-xs text-muted">
              Showing {topHoldings.length} of {holdings.length} holdings.
            </p>
          ) : null}
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-header">Sector Weights</h2>
          {rankedSectors.length === 0 ? (
            <p className="text-sm text-muted">Sector breakdown is unavailable.</p>
          ) : (
            <ul className="space-y-3">
              {rankedSectors.map((row) => (
                <li key={row.sector}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{row.sector}</span>
                    <span className="tabular text-muted">
                      {formatPercentPlain(row.weightPercentage, { alreadyPercent: true })}
                    </span>
                  </div>
                  <div className="h-2 rounded bg-chip">
                    <div
                      className="h-2 rounded bg-brand"
                      style={{ width: `${Math.min(100, (row.weightPercentage / maxSector) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <h2 className="mb-3 mt-10 text-xl font-semibold text-header">Country Weights</h2>
          {rankedCountries.length === 0 ? (
            <p className="text-sm text-muted">Country allocation is unavailable.</p>
          ) : (
            <ul className="space-y-3">
              {rankedCountries.map((row) => (
                <li key={row.country}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{row.country}</span>
                    <span className="tabular text-muted">
                      {formatPercentPlain(row.weight, { alreadyPercent: true })}
                    </span>
                  </div>
                  <div className="h-2 rounded bg-chip">
                    <div
                      className="h-2 rounded bg-brand"
                      style={{ width: `${Math.min(100, (row.weight / maxCountry) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold text-header">News</h2>
        <NewsList items={news} showSymbol={false} />
      </section>
    </Container>
  );
}
