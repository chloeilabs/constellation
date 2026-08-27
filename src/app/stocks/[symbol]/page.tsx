import { Suspense } from "react";
import Link from "next/link";
import { Container } from "@/components/container";
import { NewsList } from "@/components/news-list";
import { PriceChart } from "@/components/price-chart";
import { QuoteStats } from "@/components/quote-stats";
import { SectionNav } from "@/components/section-nav";
import { formatCompactUsd, formatDate, formatInteger, formatPercentPlain, formatPrice, formatRatio } from "@/lib/format";
import { CHART_RANGES, getChartData, type ChartRange } from "@/lib/chart";
import {
  getCompanyEarnings,
  getDividends,
  getEstimates,
  getEtfAssetExposure,
  getGradesConsensus,
  getIncomeGrowth,
  getIncomeStatements,
  getIncomeTtm,
  getPeers,
  getPriceChange,
  getPriceTarget,
  getProfile,
  getQuote,
  getRatiosTtm,
  getSymbolNews,
  withQuoteChanges,
} from "@/lib/fmp";
import { ReturnsTable } from "@/components/returns-table";
import { isForeignListingSymbol, quoteHref } from "@/lib/listings";
import { quoteFundamentalsNav } from "@/lib/nav";
import { ChangePercent } from "@/components/change";
import { QuoteFaq } from "@/components/quote-faq";
import { forwardPe as forwardPeFromEstimates } from "@/lib/valuation";

export default async function StockOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { symbol } = await params;
  const { range: rangeParam } = await searchParams;
  const ticker = symbol.toUpperCase();
  const range = CHART_RANGES.includes(rangeParam as ChartRange) ? (rangeParam as ChartRange) : "1Y";

  const [quote, profile, ttm, ratios, target, grades, dividends, news, peers, points, annual, growthRows, earnings, estimates, etfHolders, priceChange] =
    await Promise.all([
      getQuote(ticker),
      getProfile(ticker),
      getIncomeTtm(ticker),
      getRatiosTtm(ticker),
      getPriceTarget(ticker),
      getGradesConsensus(ticker),
      getDividends(ticker, 1),
      getSymbolNews(ticker, 12),
      getPeers(ticker),
      getChartData(ticker, range),
      getIncomeStatements(ticker, "annual", 2),
      getIncomeGrowth(ticker, "annual", 1),
      getCompanyEarnings(ticker, 1),
      getEstimates(ticker, "annual"),
      getEtfAssetExposure(ticker),
      getPriceChange(ticker),
    ]);
  const latestYear = annual[0];
  const priorYear = annual[1];
  const growth = growthRows[0] ?? null;
  const usEtfs = etfHolders.filter((row) => {
    if (!row.symbol || isForeignListingSymbol(row.symbol)) return false;
    if (!(row.sharesNumber > 0) || !(row.marketValue > 0)) return false;
    if (!(row.weightPercentage > 0) || row.weightPercentage > 250) return false;
    return true;
  });
  const heldByEtfs = [...usEtfs]
    .sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0))
    .slice(0, 12);
  const peerRows = await withQuoteChanges(
    peers.slice(0, 8).map((peer) => ({
      symbol: peer.symbol,
      price: peer.price,
      companyName: peer.companyName,
      mktCap: peer.mktCap,
    })),
  );

  return (
    <Container>
      {profile?.isEtf ? (
        <p className="mb-4 rounded-md border border-border bg-muted-bg px-3 py-2 text-sm">
          {ticker} is an ETF.{" "}
          <Link href={`/etf/${ticker}`} className="text-link hover:underline">
            View holdings, sectors, and country weights
          </Link>
          .
        </p>
      ) : null}
      {profile?.isFund && !profile?.isEtf ? (
        <p className="mb-4 rounded-md border border-border bg-muted-bg px-3 py-2 text-sm">
          {ticker} is a mutual fund.{" "}
          <Link href={`/funds/${ticker}`} className="text-link hover:underline">
            View the fund quote
          </Link>
          .
        </p>
      ) : null}

      <SectionNav items={quoteFundamentalsNav(ticker)} />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,24rem)]">
        <div>
          <Suspense fallback={<div className="h-[320px] animate-pulse rounded-lg bg-muted-bg" />}>
            <PriceChart points={points} range={range} symbol={ticker} />
          </Suspense>
          <ReturnsTable changes={priceChange} />
        </div>
        <QuoteStats
          symbol={ticker}
          quote={quote}
          profile={profile}
          ttm={ttm}
          ratios={ratios}
          target={target}
          grades={grades}
          dividend={dividends[0] ?? null}
          growth={growth}
          earningsDate={earnings[0]?.date}
          forwardPe={forwardPeFromEstimates(quote?.price, estimates)}
        />
      </div>

      {profile?.description ? (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-semibold text-header">About {ticker}</h2>
          <p className="max-w-4xl text-sm leading-7 text-header/90">{profile.description}</p>
          <p className="mt-2 text-sm">
            <Link href={`/stocks/${ticker}/company`} className="text-link hover:underline">
              Full company profile
            </Link>
          </p>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted">IPO Date</dt>
              <dd>{formatDate(profile.ipoDate)}</dd>
            </div>
            <div>
              <dt className="text-muted">Stock Exchange</dt>
              <dd>{profile.exchangeFullName}</dd>
            </div>
            <div>
              <dt className="text-muted">Sector / Industry</dt>
              <dd>
                {profile.sector}
                {profile.industry ? ` · ${profile.industry}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-muted">CEO</dt>
              <dd>{profile.ceo || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Employees</dt>
              <dd>
                <Link href={`/stocks/${ticker}/employees`} className="text-link hover:underline">
                  {profile.fullTimeEmployees || "Headcount"}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-muted">Website</dt>
              <dd>
                {profile.website ? (
                  <a href={profile.website} className="text-link hover:underline" target="_blank" rel="noreferrer">
                    {profile.website.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {latestYear ? (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-semibold text-header">Financial Performance</h2>
          <p className="max-w-4xl text-sm leading-7 text-header/90">
            In fiscal year {latestYear.fiscalYear}, {profile?.companyName ?? ticker} reported revenue of{" "}
            {formatCompactUsd(latestYear.revenue)}
            {typeof growth?.growthRevenue === "number" && priorYear
              ? `, ${growth.growthRevenue >= 0 ? "an increase" : "a decrease"} of ${formatPercentPlain(Math.abs(growth.growthRevenue))} compared to the previous year's ${formatCompactUsd(priorYear.revenue)}`
              : ""}
            . Earnings were {formatCompactUsd(latestYear.netIncome)}
            {typeof growth?.growthNetIncome === "number" && priorYear
              ? `, ${growth.growthNetIncome >= 0 ? "an increase" : "a decrease"} of ${formatPercentPlain(Math.abs(growth.growthNetIncome))}`
              : ""}
            .
          </p>
          <p className="mt-2 text-sm">
            <Link href={`/stocks/${ticker}/financials`} className="text-link hover:underline">
              Financial statements
            </Link>
            {" · "}
            <Link href={`/stocks/${ticker}/revenue`} className="text-link hover:underline">
              Revenue history
            </Link>
          </p>
        </section>
      ) : null}

      {grades || target ? (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-semibold text-header">Analyst Summary</h2>
          <p className="max-w-3xl text-sm leading-7">
            {grades ? (
              <>
                Analyst consensus is <span className="font-semibold">{grades.consensus}</span> (
                {grades.strongBuy + grades.buy} buys, {grades.hold} holds, {grades.sell + grades.strongSell} sells).
              </>
            ) : null}{" "}
            {target ? (
              <>
                The average 12-month price target is ${formatPrice(target.targetConsensus)}
                {quote?.price
                  ? `, ${(((target.targetConsensus - quote.price) / quote.price) * 100).toFixed(2)}% from the latest price.`
                  : "."}
              </>
            ) : null}
          </p>
        </section>
      ) : null}

      {peerRows.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-semibold text-header">Peers</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company</th>
                  <th className="num">Price</th>
                  <th className="num">Change</th>
                  <th className="num">PE</th>
                  <th className="num">Market Cap</th>
                </tr>
              </thead>
              <tbody>
                {peerRows.map((peer) => (
                  <tr key={peer.symbol}>
                    <td className="symbol">
                      <Link href={quoteHref(peer.symbol, { name: peer.companyName })} className="text-link hover:underline">
                        {peer.symbol}
                      </Link>
                    </td>
                    <td>{peer.companyName}</td>
                    <td className="num">{formatPrice(peer.price)}</td>
                    <td className="num">
                      <ChangePercent value={peer.changePercentage} alreadyPercent />
                    </td>
                    <td className="num">{formatRatio(peer.pe)}</td>
                    <td className="num">{formatCompactUsd(peer.mktCap)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <QuoteFaq
        symbol={ticker}
        quote={quote}
        profile={profile}
        ttm={ttm}
        ratios={ratios}
        target={target}
        grades={grades}
      />

      {heldByEtfs.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-semibold text-header">Held by ETFs</h2>
          <p className="mb-3 text-sm text-muted">
            ETFs that report {ticker} as a holding, ranked by the market value of that position.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>ETF</th>
                  <th className="num">Weight</th>
                  <th className="num">Shares</th>
                  <th className="num">Market Value</th>
                </tr>
              </thead>
              <tbody>
                {heldByEtfs.map((row) => (
                  <tr key={row.symbol}>
                    <td className="symbol">
                      <Link href={`/etf/${row.symbol}`} className="text-link hover:underline">
                        {row.symbol}
                      </Link>
                    </td>
                    <td className="num">{formatPercentPlain(row.weightPercentage, { alreadyPercent: true })}</td>
                    <td className="num">{formatInteger(row.sharesNumber)}</td>
                    <td className="num">{formatCompactUsd(row.marketValue)}</td>
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
          <Link href={`/stocks/${ticker}/news`} className="text-sm text-link hover:underline">
            All news
          </Link>
        </div>
        <NewsList items={news} showSymbol={false} />
      </section>
    </Container>
  );
}
