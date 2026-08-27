import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { MetricCards } from "@/components/metric-cards";
import { PriceTargetRange } from "@/components/price-target-range";
import { compactMoneyFn, formatDate, formatMoney, formatPrice, reportingCurrency } from "@/lib/format";
import {
  getCompanyEarnings,
  getDcf,
  getEstimates,
  getGrades,
  getGradesConsensus,
  getGradesHistorical,
  getLeveredDcf,
  getPriceTarget,
  getPriceTargetNews,
  getPriceTargetSummary,
  getProfile,
  getQuote,
  getRatingsHistorical,
} from "@/lib/fmp";
import type { FmpEstimate, FmpHistoricalGrade } from "@/lib/types";
import { decodeTicker } from "@/lib/listings";
import { cn } from "@/lib/utils";

function GradeMix({ row }: { row: FmpHistoricalGrade }) {
  const parts = [
    { key: "sb", count: row.analystRatingsStrongBuy, className: "bg-gain" },
    { key: "b", count: row.analystRatingsBuy, className: "bg-gain/60" },
    { key: "h", count: row.analystRatingsHold, className: "bg-chip" },
    { key: "s", count: row.analystRatingsSell, className: "bg-loss/60" },
    { key: "ss", count: row.analystRatingsStrongSell, className: "bg-loss" },
  ];
  const total = parts.reduce((sum, part) => sum + (part.count || 0), 0) || 1;
  return (
    <div className="flex h-2.5 overflow-hidden rounded-full bg-chip">
      {parts.map((part) =>
        part.count > 0 ? (
          <div
            key={part.key}
            className={cn("h-full", part.className)}
            style={{ width: `${(part.count / total) * 100}%` }}
            title={`${part.count}`}
          />
        ) : null,
      )}
    </div>
  );
}

function EstimateTable({ rows, money }: { rows: FmpEstimate[]; money: (value: number | null | undefined) => string }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="sa-table">
        <thead>
          <tr>
            <th>Period</th>
            <th className="num">EPS</th>
            <th className="num">Revenue</th>
            <th className="num">EBITDA</th>
            <th className="num">Analysts</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-muted">
                No estimates available.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.date}>
                <td>{formatDate(row.date)}</td>
                <td className="num">
                  <div>{formatPrice(row.epsAvg)}</div>
                  {row.epsLow != null && row.epsHigh != null ? (
                    <div className="text-[11px] text-muted">
                      {formatPrice(row.epsLow)} – {formatPrice(row.epsHigh)}
                    </div>
                  ) : null}
                </td>
                <td className="num">
                  <div>{money(row.revenueAvg)}</div>
                  {row.revenueLow != null && row.revenueHigh != null ? (
                    <div className="text-[11px] text-muted">
                      {money(row.revenueLow)} – {money(row.revenueHigh)}
                    </div>
                  ) : null}
                </td>
                <td className="num">
                  <div>{money(row.ebitdaAvg)}</div>
                  {row.ebitdaLow != null && row.ebitdaHigh != null ? (
                    <div className="text-[11px] text-muted">
                      {money(row.ebitdaLow)} – {money(row.ebitdaHigh)}
                    </div>
                  ) : null}
                </td>
                <td className="num">{row.numAnalystsEps ?? row.numAnalystsRevenue ?? "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default async function ForecastPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const [quote, profile, target, grades, history, estimates, quarterlyEstimates, earnings, dcf, levered, gradeTrend, ratingTrend, targetSummary, targetNews] =
    await Promise.all([
      getQuote(ticker),
      getProfile(ticker),
      getPriceTarget(ticker),
      getGradesConsensus(ticker),
      getGrades(ticker, 16),
      getEstimates(ticker, "annual"),
      getEstimates(ticker, "quarter"),
      getCompanyEarnings(ticker, 8),
      getDcf(ticker),
      getLeveredDcf(ticker),
      getGradesHistorical(ticker, 16),
      getRatingsHistorical(ticker, 12),
      getPriceTargetSummary(ticker),
      getPriceTargetNews(ticker, 16),
    ]);
  const currency = reportingCurrency(profile?.currency);
  const money = compactMoneyFn(currency);
  const px = (value: number | null | undefined) => formatMoney(value, currency);

  const upside =
    target && quote?.price ? ((target.targetConsensus - quote.price) / quote.price) * 100 : null;
  const dcfGap =
    dcf?.dcf && quote?.price ? ((dcf.dcf - quote.price) / quote.price) * 100 : null;
  const leveredGap =
    levered?.dcf && quote?.price ? ((levered.dcf - quote.price) / quote.price) * 100 : null;

  return (
    <Container>
      <PageHeader title={`${ticker} Forecasts`} description="Analyst ratings, price targets, and earnings estimates." />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Consensus</div>
          <div className="mt-1 text-2xl font-semibold">{grades?.consensus ?? "—"}</div>
          {grades ? (
            <p className="mt-2 text-sm text-muted">
              {grades.strongBuy} strong buy · {grades.buy} buy · {grades.hold} hold · {grades.sell} sell · {grades.strongSell} strong sell
            </p>
          ) : null}
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Price Target</div>
          <div className="mt-1 text-2xl font-semibold tabular">{px(target?.targetConsensus)}</div>
          <p className="mt-2 text-sm text-muted">
            High {px(target?.targetHigh)} · Low {px(target?.targetLow)} · Median {px(target?.targetMedian)}
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Upside / Downside</div>
          <div className="mt-1 text-2xl font-semibold tabular">
            {upside == null ? "—" : `${upside > 0 ? "+" : ""}${upside.toFixed(2)}%`}
          </div>
          <p className="mt-2 text-sm text-muted">From last price {px(quote?.price)}</p>
        </div>
      </div>

      {target ? (
        <div className="mt-6">
          <PriceTargetRange
            price={quote?.price}
            low={target.targetLow}
            median={target.targetMedian}
            consensus={target.targetConsensus}
            high={target.targetHigh}
            format={px}
          />
        </div>
      ) : null}

      {targetSummary ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-header">Price Target Trend</h2>
          <MetricCards
            items={[
              {
                label: "Last Month",
                value: px(targetSummary.lastMonthAvgPriceTarget),
                hint: `${targetSummary.lastMonthCount} analysts`,
              },
              {
                label: "Last Quarter",
                value: px(targetSummary.lastQuarterAvgPriceTarget),
                hint: `${targetSummary.lastQuarterCount} analysts`,
              },
              {
                label: "Last Year",
                value: px(targetSummary.lastYearAvgPriceTarget),
                hint: `${targetSummary.lastYearCount} analysts`,
              },
              {
                label: "All Time",
                value: px(targetSummary.allTimeAvgPriceTarget),
                hint: `${targetSummary.allTimeCount} analysts`,
              },
            ]}
          />
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Annual Estimates</h2>
        <EstimateTable rows={[...estimates].sort((a, b) => a.date.localeCompare(b.date))} money={money} />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Quarterly Estimates</h2>
        <EstimateTable
          rows={[...quarterlyEstimates].sort((a, b) => a.date.localeCompare(b.date))}
          money={money}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Price Target News</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Firm</th>
                <th>Analyst</th>
                <th className="num">Target</th>
                <th className="num">Price Then</th>
                <th>Headline</th>
              </tr>
            </thead>
            <tbody>
              {targetNews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted">
                    No price-target articles available.
                  </td>
                </tr>
              ) : (
                targetNews.map((row, index) => (
                  <tr key={`${row.publishedDate}-${row.analystCompany}-${index}`}>
                    <td>{formatDate(row.publishedDate)}</td>
                    <td>{row.analystCompany || row.newsPublisher || "—"}</td>
                    <td>{row.analystName || "—"}</td>
                    <td className="num">{px(row.adjPriceTarget ?? row.priceTarget)}</td>
                    <td className="num">{px(row.priceWhenPosted)}</td>
                    <td>
                      {row.newsURL ? (
                        <a href={row.newsURL} className="text-link hover:underline" target="_blank" rel="noreferrer">
                          {row.newsTitle}
                        </a>
                      ) : (
                        row.newsTitle
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Discounted Cash Flow</h2>
        <MetricCards
          items={[
            {
              label: "Unlevered DCF",
              value: dcf?.dcf != null ? px(dcf.dcf) : "—",
              hint: dcfGap == null ? undefined : `${dcfGap > 0 ? "+" : ""}${dcfGap.toFixed(1)}% vs price`,
            },
            {
              label: "Levered DCF",
              value: levered?.dcf != null ? px(levered.dcf) : "—",
              hint: leveredGap == null ? undefined : `${leveredGap > 0 ? "+" : ""}${leveredGap.toFixed(1)}% vs price`,
            },
            {
              label: "Last Price",
              value: px(quote?.price ?? dcf?.stockPrice),
              hint: dcf?.date ? `Model date ${formatDate(dcf.date)}` : undefined,
            },
          ]}
        />
        <p className="mt-3 text-sm text-muted">
          FMP discounted-cash-flow estimates of intrinsic value. A DCF below the market price means the model sees the
          stock as expensive relative to projected cash flows.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Analyst Actions</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Firm</th>
                <th>Action</th>
                <th>From</th>
                <th>To</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted">
                    No analyst actions available.
                  </td>
                </tr>
              ) : (
                history.slice(0, 16).map((row, index) => (
                  <tr key={`${row.date}-${row.gradingCompany}-${index}`}>
                    <td>{formatDate(row.date)}</td>
                    <td>{row.gradingCompany}</td>
                    <td className="capitalize">{row.action}</td>
                    <td>{row.previousGrade || "—"}</td>
                    <td>{row.newGrade}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Analyst Rating History</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Mix</th>
                <th className="num">Strong Buy</th>
                <th className="num">Buy</th>
                <th className="num">Hold</th>
                <th className="num">Sell</th>
                <th className="num">Strong Sell</th>
              </tr>
            </thead>
            <tbody>
              {gradeTrend.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-muted">
                    No historical analyst rating mix available.
                  </td>
                </tr>
              ) : (
                gradeTrend.map((row) => (
                  <tr key={row.date}>
                    <td>{formatDate(row.date)}</td>
                    <td className="min-w-[140px]">
                      <GradeMix row={row} />
                    </td>
                    <td className="num">{row.analystRatingsStrongBuy}</td>
                    <td className="num">{row.analystRatingsBuy}</td>
                    <td className="num">{row.analystRatingsHold}</td>
                    <td className="num">{row.analystRatingsSell}</td>
                    <td className="num">{row.analystRatingsStrongSell}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">FMP Rating History</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Rating</th>
                <th className="num">Overall</th>
                <th className="num">DCF</th>
                <th className="num">ROE</th>
                <th className="num">ROA</th>
                <th className="num">D/E</th>
                <th className="num">P/E</th>
                <th className="num">P/B</th>
              </tr>
            </thead>
            <tbody>
              {ratingTrend.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-muted">
                    No historical financial ratings available.
                  </td>
                </tr>
              ) : (
                ratingTrend.map((row) => (
                  <tr key={row.date}>
                    <td>{formatDate(row.date)}</td>
                    <td className="font-semibold">{row.rating}</td>
                    <td className="num">{row.overallScore}</td>
                    <td className="num">{row.discountedCashFlowScore}</td>
                    <td className="num">{row.returnOnEquityScore}</td>
                    <td className="num">{row.returnOnAssetsScore}</td>
                    <td className="num">{row.debtToEquityScore}</td>
                    <td className="num">{row.priceToEarningsScore}</td>
                    <td className="num">{row.priceToBookScore}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Earnings History</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th className="num">EPS Est.</th>
                <th className="num">EPS Actual</th>
                <th className="num">Revenue Est.</th>
                <th className="num">Revenue Actual</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map((row) => (
                <tr key={row.date}>
                  <td>{formatDate(row.date)}</td>
                  <td className="num">{formatPrice(row.epsEstimated)}</td>
                  <td className="num">{formatPrice(row.epsActual)}</td>
                  <td className="num">{money(row.revenueEstimated)}</td>
                  <td className="num">{money(row.revenueActual)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Container>
  );
}
