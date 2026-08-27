import Link from "next/link";
import { Container } from "@/components/container";
import { NewsList } from "@/components/news-list";
import { PriceChart } from "@/components/price-chart";
import { ReturnsTable } from "@/components/returns-table";
import { StatGrid } from "@/components/quote-stats";
import { formatCompactUsd, formatInteger, formatPercentPlain, formatPlausiblePe, formatPrice, formatRatio } from "@/lib/format";
import { CHART_RANGES, getChartData, type ChartRange } from "@/lib/chart";
import {
  getDividends,
  getEtfCountryWeights,
  getEtfHoldings,
  getEtfInfo,
  getEtfSectors,
  getPriceChange,
  getProfile,
  getQuote,
  getRatiosTtm,
  getSymbolNews,
} from "@/lib/fmp";
import { decodeTicker, holdingQuoteHref } from "@/lib/listings";
import { parseWeightPercentage } from "@/lib/utils";
import { vehicleNoun, vehiclePath, type VehicleKind } from "@/lib/vehicle";

export async function VehicleOverview({
  symbol,
  range: rangeParam,
  kind,
}: {
  symbol: string;
  range?: string;
  kind: VehicleKind;
}) {
  const ticker = decodeTicker(symbol);
  const range = CHART_RANGES.includes(rangeParam as ChartRange) ? (rangeParam as ChartRange) : "1Y";
  const noun = vehicleNoun(kind);
  const [info, holdings, sectors, countries, quote, news, dividends, changes, points, ratios, profile] = await Promise.all([
    getEtfInfo(ticker),
    getEtfHoldings(ticker),
    getEtfSectors(ticker),
    getEtfCountryWeights(ticker),
    getQuote(ticker),
    getSymbolNews(ticker, 8),
    getDividends(ticker, 8),
    getPriceChange(ticker),
    getChartData(ticker, range),
    getRatiosTtm(ticker),
    getProfile(ticker),
  ]);

  const rankedSectors = [...sectors].sort((a, b) => (b.weightPercentage ?? 0) - (a.weightPercentage ?? 0));
  const rankedCountries = [...countries]
    .map((row) => ({ country: row.country, weight: parseWeightPercentage(row.weightPercentage) }))
    .filter((row) => row.country && row.weight > 0)
    .sort((a, b) => b.weight - a.weight);
  const topHoldings = holdings.slice(0, 10);
  const maxSector = Math.max(...rankedSectors.map((row) => row.weightPercentage || 0), 1);
  const maxCountry = Math.max(...rankedCountries.map((row) => row.weight), 1);
  const latestDividend = dividends[0];
  const ttmDividend = dividends.slice(0, 4).reduce((sum, row) => sum + (row.dividend || 0), 0);
  const shares =
    quote?.sharesOutstanding ??
    (quote?.marketCap && quote.price ? quote.marketCap / quote.price : null);
  const pe = typeof ratios?.priceToEarningsRatioTTM === "number" ? ratios.priceToEarningsRatioTTM : quote?.pe;
  const about = info?.description || profile?.description;
  const dividendHref = vehiclePath(kind, ticker, "/dividend");
  const holdingsHref = vehiclePath(kind, ticker, "/holdings");
  const chartHref = vehiclePath(kind, ticker, "/chart");
  const newsHref = vehiclePath(kind, ticker, "/news");

  return (
    <Container>
      <div className="mb-8">
        <PriceChart
          points={points}
          range={range}
          symbol={ticker}
          chartHref={chartHref}
          ma50={quote?.priceAvg50}
          ma200={quote?.priceAvg200}
        />
        <ReturnsTable changes={changes} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <StatGrid
          items={[
            { label: "Assets", value: formatCompactUsd(info?.assetsUnderManagement ?? quote?.marketCap ?? profile?.marketCap) },
            {
              label: "Expense Ratio",
              value: info?.expenseRatio != null ? formatPercentPlain(info.expenseRatio, { alreadyPercent: true }) : "—",
            },
            { label: "PE Ratio", value: formatPlausiblePe(pe) },
            { label: "Shares Out", value: formatCompactUsd(shares).replace("$", "") },
            { label: "Dividend (ttm)", href: dividendHref, value: ttmDividend ? `$${formatPrice(ttmDividend)}` : "—" },
            {
              label: "Dividend Yield",
              href: dividendHref,
              value:
                latestDividend?.yield != null
                  ? formatPercentPlain(latestDividend.yield, { alreadyPercent: true })
                  : formatPercentPlain(typeof ratios?.dividendYieldTTM === "number" ? ratios.dividendYieldTTM : null),
            },
            { label: "Ex-Dividend Date", value: latestDividend?.date || "—" },
            { label: "Payout Frequency", value: latestDividend?.frequency || "—" },
            {
              label: "Payout Ratio",
              value: formatPercentPlain(
                typeof ratios?.dividendPayoutRatioTTM === "number" ? ratios.dividendPayoutRatioTTM : null,
              ),
            },
          ]}
        />
        <StatGrid
          items={[
            { label: "Volume", value: formatInteger(quote?.volume) },
            { label: "Average Volume", value: formatInteger(info?.avgVolume ?? quote?.avgVolume ?? profile?.averageVolume) },
            { label: "Open", value: formatPrice(quote?.open) },
            { label: "Previous Close", value: formatPrice(quote?.previousClose) },
            {
              label: "Day's Range",
              value: quote ? `${formatPrice(quote.dayLow)} - ${formatPrice(quote.dayHigh)}` : "—",
            },
            { label: "52-Week Low", value: formatPrice(quote?.yearLow) },
            { label: "52-Week High", value: formatPrice(quote?.yearHigh) },
            { label: "Beta", value: formatRatio(profile?.beta) },
            { label: "Holdings", href: holdingsHref, value: formatInteger(info?.holdingsCount || holdings.length) },
            { label: "NAV", value: info?.nav != null ? formatPrice(info.nav) : formatPrice(quote?.price ?? profile?.price) },
            { label: "Inception Date", value: info?.inceptionDate || profile?.ipoDate || "—" },
            { label: "Issuer", value: info?.etfCompany || "—" },
          ]}
        />
      </div>

      {about ? (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-semibold text-header">About {ticker}</h2>
          <p className="max-w-4xl text-sm leading-7 text-header/90">{about}</p>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted">Asset Class</dt>
              <dd>{info?.assetClass || profile?.sector || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Category</dt>
              <dd>{profile?.industry || info?.assetClass || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Website</dt>
              <dd>
                {info?.website || profile?.website ? (
                  <a
                    href={info?.website || profile?.website}
                    className="text-link hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {(info?.website || profile?.website || "").replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-xl font-semibold text-header">Top 10 Holdings</h2>
            <Link href={holdingsHref} className="text-sm text-link hover:underline">
              All {formatInteger(holdings.length || info?.holdingsCount)} holdings
            </Link>
          </div>
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
                      Holdings are unavailable for this {noun}.
                    </td>
                  </tr>
                ) : (
                  topHoldings.map((row, index) => {
                    const href = holdingQuoteHref(row.asset, row.name);
                    return (
                      <tr key={`${row.asset}-${index}`}>
                        <td className="text-muted">{index + 1}</td>
                        <td className="symbol">
                          {href ? (
                            <Link href={href} className="text-link hover:underline">
                              {row.asset}
                            </Link>
                          ) : (
                            row.asset || "—"
                          )}
                        </td>
                        <td className="max-w-[240px] truncate">{row.name}</td>
                        <td className="num">{formatPercentPlain(row.weightPercentage, { alreadyPercent: true })}</td>
                        <td className="num">{formatCompactUsd(row.marketValue)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
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

      {dividends.length > 0 ? (
        <section className="mt-10">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-xl font-semibold text-header">Dividend History</h2>
            <Link href={dividendHref} className="text-sm text-link hover:underline">
              Full history
            </Link>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Ex-Dividend</th>
                  <th>Pay Date</th>
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {dividends.slice(0, 6).map((row) => (
                  <tr key={`${row.date}-${row.paymentDate}`}>
                    <td>{row.date}</td>
                    <td>{row.paymentDate}</td>
                    <td className="num">${formatPrice(row.dividend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-xl font-semibold text-header">News</h2>
          <Link href={newsHref} className="text-sm text-link hover:underline">
            All news
          </Link>
        </div>
        <NewsList items={news} showSymbol={false} />
      </section>
    </Container>
  );
}
