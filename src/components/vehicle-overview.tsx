import Link from "next/link";
import { Container } from "@/components/container";
import { ChangePercent } from "@/components/change";
import { HistoryBars } from "@/components/history-bars";
import { HoldingTicker } from "@/components/holding-ticker";
import { QuoteNewsTabs } from "@/components/quote-news-tabs";
import { PriceChart } from "@/components/price-chart";
import { ReturnsTable } from "@/components/returns-table";
import { StatGrid } from "@/components/quote-stats";
import { formatCompactUsd, formatInteger, formatPercentPlain, formatPlausiblePe, formatPrice, formatRatio } from "@/lib/format";
import { loadQuoteChart, loadVehiclePerformance, canDividendAdjust, type VehiclePerformance } from "@/lib/chart";
import {
  getDividends,
  getEtfCountryWeights,
  getEtfHoldings,
  getEtfInfo,
  getEtfSectors,
  getPressReleases,
  getPriceChange,
  getProfile,
  getQuote,
  getSymbolNews,
} from "@/lib/fmp";
import { DISTRIBUTION_TTM_LIMIT, dividendYieldFromPrice, trailingDividendWindow } from "@/lib/dividends";
import { decodeTicker } from "@/lib/listings";
import { nyDateString, parseWeightPercentage, payoutFrequencyLabel } from "@/lib/utils";
import { vehicleNoun, vehiclePath, type VehicleKind } from "@/lib/vehicle";

export async function VehicleOverview({
  symbol,
  range: rangeParam,
  adj: adjParam,
  kind,
}: {
  symbol: string;
  range?: string;
  adj?: string;
  kind: VehicleKind;
}) {
  const ticker = decodeTicker(symbol);
  const noun = vehicleNoun(kind);
  const infoPromise = getEtfInfo(ticker);
  const profilePromise = getProfile(ticker);
  const [info, holdings, sectors, countries, quote, news, press, dividends, changes, chart, profile, performance] =
    await Promise.all([
      infoPromise,
      getEtfHoldings(ticker),
      getEtfSectors(ticker),
      getEtfCountryWeights(ticker),
      getQuote(ticker),
      getSymbolNews(ticker, 8),
      getPressReleases(ticker, 8),
      getDividends(ticker, DISTRIBUTION_TTM_LIMIT),
      getPriceChange(ticker),
      loadQuoteChart(ticker, rangeParam, {
        adj: adjParam,
        fallbackRange: kind === "fund" ? "1Y" : undefined,
      }),
      profilePromise,
      Promise.all([infoPromise, profilePromise]).then(([etfInfo, company]) =>
        loadVehiclePerformance(ticker, etfInfo?.inceptionDate || company?.ipoDate),
      ),
    ]);
  const { range, points, ma50Series, ma200Series, ema12Series, ema26Series, rsiSeries, adjusted } = chart;

  const rankedSectors = [...sectors].sort((a, b) => (b.weightPercentage ?? 0) - (a.weightPercentage ?? 0));
  const rankedCountries = [...countries]
    .map((row) => ({ country: row.country, weight: parseWeightPercentage(row.weightPercentage) }))
    .filter((row) => row.country && row.weight > 0)
    .sort((a, b) => b.weight - a.weight);
  const rankedHoldings = [...holdings].sort((a, b) => (b.weightPercentage ?? 0) - (a.weightPercentage ?? 0));
  const topHoldings = rankedHoldings.slice(0, 10);
  const maxSector = Math.max(...rankedSectors.map((row) => row.weightPercentage || 0), 1);
  const maxCountry = Math.max(...rankedCountries.map((row) => row.weight), 1);
  const latestDividend = dividends[0];
  const ttmDividend = trailingDividendWindow(dividends, nyDateString());
  const ttmYield = dividendYieldFromPrice(ttmDividend, quote?.price);
  const shares =
    quote?.sharesOutstanding ??
    (quote?.marketCap && quote.price ? quote.marketCap / quote.price : null);
  const pe = quote?.pe;
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
          ma50Series={ma50Series}
          ma200Series={ma200Series}
          ema12Series={ema12Series}
          ema26Series={ema26Series}
          rsiSeries={rsiSeries}
          adjusted={adjusted}
          showAdjustedToggle={canDividendAdjust(range)}
          query={canDividendAdjust(range) && !adjusted ? { adj: "0" } : undefined}
        />
        <ReturnsTable changes={changes} performance={performance} />
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
                ttmYield != null
                  ? formatPercentPlain(ttmYield)
                  : latestDividend?.yield != null
                    ? formatPercentPlain(latestDividend.yield, { alreadyPercent: true })
                    : "—",
            },
            { label: "Ex-Dividend Date", value: latestDividend?.date || "—" },
            { label: "Payout Frequency", value: payoutFrequencyLabel(latestDividend?.frequency) || "—" },
            {
              label: "Payout Ratio",
              value:
                ttmDividend && quote?.eps && quote.eps > 0 && ttmDividend / quote.eps < 50
                  ? formatPercentPlain(ttmDividend / quote.eps)
                  : "—",
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
            { label: "Holdings", href: holdingsHref, value: formatInteger(holdings.length || info?.holdingsCount) },
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
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-muted">Asset Class</dt>
              <dd>{info?.assetClass || profile?.sector || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Category</dt>
              <dd>{profile?.industry || info?.assetClass || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Stock Exchange</dt>
              <dd>{quote?.exchange || profile?.exchange || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Ticker Symbol</dt>
              <dd>{ticker}</dd>
            </div>
            <div>
              <dt className="text-muted">ETF Provider</dt>
              <dd>{info?.etfCompany || "—"}</dd>
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
                  topHoldings.map((row, index) => (
                    <tr key={`${row.asset}-${row.name}-${index}`}>
                      <td className="text-muted">{index + 1}</td>
                      <td className="symbol">
                        <HoldingTicker asset={row.asset} name={row.name} />
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
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-header">Sector Weights</h2>
          {rankedSectors.length === 0 ? (
            <p className="text-sm text-muted">Sector breakdown is unavailable.</p>
          ) : (
            <ul className="flex flex-col gap-3">
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
            <ul className="flex flex-col gap-3">
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
                {dividends.slice(0, 6).map((row, index) => (
                  <tr key={`${row.date}-${row.paymentDate}-${row.dividend}-${index}`}>
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

      {performance ? <VehiclePerformanceSection ticker={ticker} noun={noun} performance={performance} /> : null}

      <QuoteNewsTabs
        symbol={ticker}
        news={news}
        press={press}
        moreHref={{ all: newsHref, press: vehiclePath(kind, ticker, "/news/press-releases") }}
      />
    </Container>
  );
}

const PERFORMANCE_PERIODS: { key: keyof VehiclePerformance; label: string }[] = [
  { key: "oneMonth", label: "1 Month" },
  { key: "ytd", label: "YTD" },
  { key: "oneYear", label: "1 Year" },
  { key: "fiveYear", label: "5 Years" },
  { key: "tenYear", label: "10 Years" },
  { key: "inceptionCagr", label: "Inception" },
];

function VehiclePerformanceSection({
  ticker,
  noun,
  performance,
}: {
  ticker: string;
  noun: string;
  performance: VehiclePerformance;
}) {
  const bars = PERFORMANCE_PERIODS.flatMap((period) => {
    const value = performance[period.key];
    return typeof value === "number" ? [{ label: period.label, value: value * 100 }] : [];
  });

  return (
    <section className="mt-10">
      <h2 className="mb-2 text-xl font-semibold text-header">Performance</h2>
      <p className="max-w-4xl text-sm leading-7 text-header/90">
        {performance.oneYear != null
          ? `${ticker} had a total return of ${formatPercentPlain(performance.oneYear)} in the past year, including dividends.`
          : null}
        {performance.oneYear != null && (performance.inceptionCagr != null || performance.inceptionTotal != null)
          ? " "
          : null}
        {performance.inceptionCagr != null
          ? `Since the ${noun}'s inception, the average annual return has been ${formatPercentPlain(performance.inceptionCagr)}.`
          : performance.inceptionTotal != null && performance.oneYear == null
            ? `Since inception, ${ticker} has returned ${formatPercentPlain(performance.inceptionTotal)}, including dividends.`
            : null}
      </p>
      {bars.length > 0 ? (
        <div className="mt-4">
          <HistoryBars items={bars} formatValue={(value) => formatPercentPlain(value, { alreadyPercent: true })} />
        </div>
      ) : null}
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {PERFORMANCE_PERIODS.map((period) => (
          <div key={period.key} className="rounded-lg border border-border px-3 py-2">
            <dt className="text-xs text-muted">{period.label}</dt>
            <dd className="mt-1 text-sm">
              <ChangePercent value={performance[period.key]} alreadyPercent={false} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
