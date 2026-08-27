import { Suspense } from "react";
import Link from "next/link";
import { Container } from "@/components/container";
import { PriceChart } from "@/components/price-chart";
import { QuoteNewsTabs } from "@/components/quote-news-tabs";
import { QuoteStats } from "@/components/quote-stats";
import { SectionNav } from "@/components/section-nav";
import { compactMoneyFn, currencyForSymbol, formatCompactUsd, formatDate, formatInteger, formatMoney, formatPercentPlain, formatPrice, formatRatio, reportingCurrency, yearOverYear } from "@/lib/format";
import { loadQuoteChart } from "@/lib/chart";
import {
  getCompanyEarnings,
  getDcf,
  getDividends,
  getEstimates,
  getEtfAssetExposure,
  listedUsEtfHolders,
  getGradesConsensus,
  getIncomeStatements,
  getIncomeTtm,
  getPeers,
  getPressReleases,
  getPriceChange,
  getPriceTarget,
  getProfile,
  getQuote,
  getRatiosTtm,
  getSecFilings,
  getSymbolNews,
  getTranscriptDates,
  getYearAgoMarketCap,
  withQuoteChanges,
} from "@/lib/fmp";
import { ReturnsTable } from "@/components/returns-table";
import { decodeTicker, quoteHref } from "@/lib/listings";
import { quoteFundamentalsNav } from "@/lib/nav";
import { ChangePercent } from "@/components/change";
import { QuoteFaq } from "@/components/quote-faq";
import { forwardPe as forwardPeFromEstimates } from "@/lib/valuation";
import { isIndexTicker } from "@/lib/indexes";
import { IndexQuote } from "@/components/index-quote";
import { earningsSurprise, splitCompanyEarnings } from "@/lib/earnings";
import { overviewSecFilings } from "@/lib/filings";
import { addDays, isoDate, nyDateString, relativeChange } from "@/lib/utils";
import { ttmChange } from "@/lib/statements";

export default async function StockOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { symbol } = await params;
  const { range: rangeParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  if (isIndexTicker(ticker)) {
    return <IndexQuote ticker={ticker} range={rangeParam} />;
  }

  const filingTo = nyDateString();
  const filingFrom = isoDate(addDays(new Date(`${filingTo}T00:00:00Z`), -540));
  const [quote, profile, ttm, ratios, target, grades, dividends, news, peers, chart, annual, quarterly, earnings, estimates, etfHolders, priceChange, dcf, yearAgoCap, press, transcriptDates, filings] =
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
      loadQuoteChart(ticker, rangeParam),
      getIncomeStatements(ticker, "annual", 2),
      getIncomeStatements(ticker, "quarter", 8),
      getCompanyEarnings(ticker, 12),
      getEstimates(ticker, "annual"),
      getEtfAssetExposure(ticker),
      getPriceChange(ticker),
      getDcf(ticker),
      getYearAgoMarketCap(ticker),
      getPressReleases(ticker, 12),
      getTranscriptDates(ticker),
      getSecFilings(ticker, filingFrom, filingTo, 40),
    ]);
  const { range, points, ma50Series, ma200Series } = chart;
  const latestYear = annual[0];
  const priorYear = annual[1];
  const fyRevenueGrowth = yearOverYear(latestYear?.revenue, priorYear?.revenue);
  const fyIncomeGrowth = yearOverYear(latestYear?.netIncome, priorYear?.netIncome);
  const currency = reportingCurrency(profile?.currency, latestYear?.reportedCurrency, ttm?.reportedCurrency);
  const money = compactMoneyFn(currency);
  const marketCap = quote?.marketCap ?? profile?.marketCap ?? null;
  const marketCapYoy = relativeChange(marketCap, yearAgoCap?.marketCap);
  const sharesYoy = relativeChange(latestYear?.weightedAverageShsOutDil, priorYear?.weightedAverageShsOutDil);
  const quarterlyRows = quarterly as Array<Record<string, unknown>>;
  const ttmYoy = {
    revenue: ttmChange(quarterlyRows, "revenue"),
    grossProfit: ttmChange(quarterlyRows, "grossProfit"),
    operatingIncome: ttmChange(quarterlyRows, "operatingIncome"),
    netIncome: ttmChange(quarterlyRows, "netIncome"),
    eps: ttmChange(quarterlyRows, "epsDiluted") ?? ttmChange(quarterlyRows, "eps"),
  };
  const { lastReported, next } = splitCompanyEarnings(earnings);
  const earningsDate = lastReported?.date ?? next?.date ?? null;
  const nextEarningsDate = next && next.date !== earningsDate ? next.date : null;
  const usEtfs = await listedUsEtfHolders(etfHolders);
  const heldByEtfs = [...usEtfs]
    .sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0))
    .slice(0, 12);
  const peerRows = await withQuoteChanges(
    peers
      .filter((peer) => (peer.mktCap ?? 0) >= 1_000_000_000)
      .slice(0, 8)
      .map((peer) => ({
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
            <PriceChart
              points={points}
              range={range}
              symbol={ticker}
              ma50={quote?.priceAvg50}
              ma200={quote?.priceAvg200}
              ma50Series={ma50Series}
              ma200Series={ma200Series}
            />
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
          earningsDate={earningsDate}
          nextEarningsDate={nextEarningsDate}
          earningsSurprise={earningsSurprise(lastReported)}
          forwardPe={forwardPeFromEstimates(quote?.price, estimates)}
          dcf={dcf?.dcf}
          marketCapYoy={marketCapYoy}
          sharesYoy={sharesYoy}
          ttmYoy={ttmYoy}
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
            {money(latestYear.revenue)}
            {typeof fyRevenueGrowth === "number" && priorYear
              ? `, ${fyRevenueGrowth >= 0 ? "an increase" : "a decrease"} of ${formatPercentPlain(Math.abs(fyRevenueGrowth))} compared to the previous year's ${money(priorYear.revenue)}`
              : ""}
            . Earnings were {money(latestYear.netIncome)}
            {typeof fyIncomeGrowth === "number" && priorYear
              ? `, ${fyIncomeGrowth >= 0 ? "an increase" : "a decrease"} of ${formatPercentPlain(Math.abs(fyIncomeGrowth))}`
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
                The average 12-month price target is {formatMoney(target.targetConsensus, currency)}
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
                    <td className="num">{formatCompactUsd(peer.mktCap, currencyForSymbol(peer.symbol))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {ticker.startsWith("^") ? null : (
        <QuoteFaq
          symbol={ticker}
          quote={quote}
          profile={profile}
          ttm={ttm}
          ratios={ratios}
          target={target}
          grades={grades}
        />
      )}

      {heldByEtfs.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-semibold text-header">Held by ETFs</h2>
          <p className="mb-3 text-sm text-muted">
            ETFs that report {ticker} as a holding, ranked by the market value of that position.{" "}
            <Link href={`/etf/lookup?symbol=${encodeURIComponent(ticker)}`} className="text-link hover:underline">
              Reverse ETF lookup
            </Link>
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

      <QuoteNewsTabs
        symbol={ticker}
        news={news}
        press={press}
        transcripts={transcriptDates.slice(0, 8)}
        filings={overviewSecFilings(filings)}
      />
    </Container>
  );
}
