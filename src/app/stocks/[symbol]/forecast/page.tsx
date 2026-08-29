import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader, PeriodToggle } from "@/components/page-header";
import { MetricCards } from "@/components/metric-cards";
import { PriceTargetRange } from "@/components/price-target-range";
import { StatementTable } from "@/components/statement-table";
import { TablePager } from "@/components/table-pager";
import { ChangePercent } from "@/components/change";
import {
  compactMoneyFn,
  formatDate,
  formatMoney,
  formatPercentPlain,
  formatPrice,
  reportingCurrency,
} from "@/lib/format";
import {
  getCashFlows,
  getCompanyEarnings,
  getDcf,
  getDividends,
  getEstimates,
  getGrades,
  getGradesConsensus,
  getGradesHistorical,
  getIncomeStatements,
  getLeveredDcf,
  getPriceTarget,
  getPriceTargetNewsArchive,
  getPriceTargetSummary,
  getProfile,
  getQuote,
  getRatingsHistorical,
} from "@/lib/fmp";
import {
  buildForecastColumns,
  consensusAnalystCount,
  consensusMeaning,
  forecastHeadlines,
  forecastRanges,
  latestForecasts,
  recommendationTrend,
} from "@/lib/forecast";
import { FORECAST_ROWS, withStatementHrefs } from "@/lib/statements";
import { RecommendationMix, RecommendationTrendTable } from "@/components/recommendation-trends";
import { gradeActionLabel } from "@/lib/grades";
import { decodeTicker, displayCompanyName, stockPath } from "@/lib/listings";
import { TABLE_PAGE_SIZE, pageNumber, paginate, pagerLinks } from "@/lib/paging";

function EstimateRangeTable({
  title,
  rows,
  field,
  format,
}: {
  title: string;
  rows: ReturnType<typeof forecastRanges>;
  field: "revenue" | "eps" | "revenueGrowth" | "epsGrowth";
  format: (value: number | null) => string;
}) {
  const pick = (row: (typeof rows)[number], band: "Low" | "Avg" | "High") => {
    if (field === "revenue") {
      return band === "High" ? row.revenueHigh : band === "Low" ? row.revenueLow : row.revenueAvg;
    }
    if (field === "eps") {
      return band === "High" ? row.epsHigh : band === "Low" ? row.epsLow : row.epsAvg;
    }
    if (field === "revenueGrowth") {
      return band === "High" ? row.revenueGrowthHigh : band === "Low" ? row.revenueGrowthLow : row.revenueGrowthAvg;
    }
    return band === "High" ? row.epsGrowthHigh : band === "Low" ? row.epsGrowthLow : row.epsGrowthAvg;
  };
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="sa-table">
        <thead>
          <tr>
            <th>{title}</th>
            {rows.map((row) => (
              <th key={row.key} className="num">
                {row.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(["High", "Avg", "Low"] as const).map((band) => (
            <tr key={band}>
              <td>{band}</td>
              {rows.map((row) => (
                <td key={row.key} className="num">
                  {format(pick(row, band))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function headlineHint(
  from: number | null,
  growth: number | null,
  formatFrom: (value: number | null) => string,
) {
  const parts: string[] = [];
  if (from != null) parts.push(`from ${formatFrom(from)}`);
  if (growth != null) parts.push(formatPercentPlain(growth));
  return parts.length ? parts.join(" · ") : undefined;
}

export default async function ForecastPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string; page?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam, page: pageParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const period = periodParam === "quarter" ? "quarter" : "annual";
  const [
    quote,
    profile,
    target,
    grades,
    history,
    estimates,
    quarterlyEstimates,
    earnings,
    dcf,
    levered,
    gradeTrend,
    ratingTrend,
    targetSummary,
    targetNews,
    annualIncome,
    quarterlyIncome,
    annualCash,
    quarterlyCash,
    dividends,
  ] = await Promise.all([
    getQuote(ticker),
    getProfile(ticker),
    getPriceTarget(ticker),
    getGradesConsensus(ticker),
    getGrades(ticker, 16),
    getEstimates(ticker, "annual", 16),
    getEstimates(ticker, "quarter", 24),
    getCompanyEarnings(ticker, 8),
    getDcf(ticker),
    getLeveredDcf(ticker),
    getGradesHistorical(ticker, 12),
    getRatingsHistorical(ticker, 12),
    getPriceTargetSummary(ticker),
    getPriceTargetNewsArchive(ticker),
    getIncomeStatements(ticker, "annual", 8),
    getIncomeStatements(ticker, "quarter", 12),
    getCashFlows(ticker, "annual", 8),
    getCashFlows(ticker, "quarter", 12),
    getDividends(ticker, 40),
  ]);
  const currency = reportingCurrency(profile?.currency);
  const money = compactMoneyFn(currency);
  const px = (value: number | null | undefined) => formatMoney(value, currency);
  const annualColumns = buildForecastColumns({
    period: "annual",
    actuals: annualIncome,
    estimates,
    cashFlows: annualCash,
    dividends,
    price: quote?.price,
  });
  const columns =
    period === "quarter"
      ? buildForecastColumns({
          period: "quarter",
          actuals: quarterlyIncome,
          estimates: quarterlyEstimates,
          cashFlows: quarterlyCash,
          dividends,
          price: quote?.price,
        })
      : annualColumns;
  const headlines = forecastHeadlines(annualColumns);
  const ranges = forecastRanges(estimates, annualIncome, annualColumns, 3);
  const actions = latestForecasts(history, targetNews);
  const newsFeed = paginate(targetNews, pageNumber(pageParam), TABLE_PAGE_SIZE);
  const trend = recommendationTrend(gradeTrend, 6);
  const forecastExtra = { period: period === "quarter" ? "quarter" : undefined };

  const upside =
    target && quote?.price ? ((target.targetConsensus - quote.price) / quote.price) * 100 : null;
  const dcfGap = dcf?.dcf && quote?.price ? ((dcf.dcf - quote.price) / quote.price) * 100 : null;
  const leveredGap =
    levered?.dcf && quote?.price ? ((levered.dcf - quote.price) / quote.price) * 100 : null;
  const forecastPath = stockPath(ticker, "/forecast");
  const shortName = displayCompanyName(profile?.companyName) || ticker;
  const analysts = consensusAnalystCount(grades);
  const lowPct =
    target && quote?.price ? ((target.targetLow - quote.price) / quote.price) * 100 : null;
  const highPct =
    target && quote?.price ? ((target.targetHigh - quote.price) / quote.price) * 100 : null;
  const meaning = consensusMeaning(grades?.consensus);
  const forecastIntro = analysts && target && quote?.price
    ? `According to ${analysts} analysts in FMP consensus data, ${shortName} stock has a consensus rating of "${grades?.consensus ?? "—"}" and an average price target of ${px(target.targetConsensus)}. The average 1-year stock price forecast is ${formatPercentPlain(Math.abs(upside ?? 0), { alreadyPercent: true })} ${upside != null && upside >= 0 ? "higher" : "lower"} than the current stock price, while the lowest is ${px(target.targetLow)}${lowPct == null ? "" : ` (${formatPercentPlain(lowPct, { alreadyPercent: true })})`} and the highest is ${px(target.targetHigh)}${highPct == null ? "" : ` (${formatPercentPlain(highPct, { alreadyPercent: true })})`}.`
    : "Analyst ratings, price targets, and earnings estimates from live FMP data.";

  return (
    <Container>
      <PageHeader
        title={`${shortName} Stock Forecast`}
        description={forecastIntro}
        actions={
          <Link
            href={stockPath(ticker, "/ratings")}
            className="sa-btn sa-btn-secondary"
          >
            Analyst Ratings
          </Link>
        }
      />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Consensus</div>
          <div className="mt-1 text-2xl font-semibold">{grades?.consensus ?? "—"}</div>
          {grades ? (
            <p className="mt-2 text-sm text-muted">
              {grades.strongBuy} strong buy · {grades.buy} buy · {grades.hold} hold · {grades.sell} sell ·{" "}
              {grades.strongSell} strong sell
              {meaning ? `. The average analyst rating is "${grades.consensus}". This means that ${meaning}.` : null}
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
        <h2 className="mb-3 text-lg font-semibold text-header">Recommendation Trends</h2>
        <RecommendationMix rows={trend} />
        <RecommendationTrendTable rows={trend} />
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-header">Latest Forecasts</h2>
          <Link href={stockPath(ticker, "/ratings")} className="text-sm text-link hover:underline">
            Full ratings history
          </Link>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Analyst</th>
                <th>Firm</th>
                <th>Action</th>
                <th>From</th>
                <th>To</th>
                <th className="num">Price Target</th>
                <th className="num">Upside</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {actions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-muted">
                    No analyst actions available.
                  </td>
                </tr>
              ) : (
                actions.map((row, index) => {
                  const base = row.priceWhenPosted ?? quote?.price;
                  const vs =
                    row.priceTarget != null && base
                      ? (row.priceTarget - base) / base
                      : null;
                  return (
                  <tr key={`${row.date}-${row.gradingCompany}-${index}`}>
                    <td>{row.analystName || "—"}</td>
                    <td>{row.gradingCompany}</td>
                    <td>{gradeActionLabel(row.action)}</td>
                    <td>{row.previousGrade || "—"}</td>
                    <td>{row.newGrade}</td>
                    <td className="num">{px(row.priceTarget)}</td>
                    <td className="num">
                      {vs == null ? "—" : <ChangePercent value={vs} alreadyPercent={false} />}
                    </td>
                    <td>{formatDate(row.date)}</td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-header">Financial Forecast</h2>
          <PeriodToggle
            period={period}
            annualHref={forecastPath}
            quarterHref={`${forecastPath}?period=quarter`}
          />
        </div>
        {headlines.thisYear || headlines.nextYear ? (
          <div className="mb-6">
            <MetricCards
              items={[
                {
                  label: `Revenue ${headlines.thisYear?.label ?? "This Year"}`,
                  value: money(headlines.thisYear?.revenue),
                  hint: headlineHint(
                    headlines.thisYear?.revenueFrom ?? null,
                    headlines.thisYear?.revenueGrowth ?? null,
                    money,
                  ),
                  href: stockPath(ticker, "/revenue"),
                },
                {
                  label: `Revenue ${headlines.nextYear?.label ?? "Next Year"}`,
                  value: money(headlines.nextYear?.revenue),
                  hint: headlineHint(
                    headlines.nextYear?.revenueFrom ?? null,
                    headlines.nextYear?.revenueGrowth ?? null,
                    money,
                  ),
                  href: stockPath(ticker, "/revenue"),
                },
                {
                  label: `EPS ${headlines.thisYear?.label ?? "This Year"}`,
                  value: formatPrice(headlines.thisYear?.eps),
                  hint: headlineHint(
                    headlines.thisYear?.epsFrom ?? null,
                    headlines.thisYear?.epsGrowth ?? null,
                    formatPrice,
                  ),
                  href: stockPath(ticker, "/earnings"),
                },
                {
                  label: `EPS ${headlines.nextYear?.label ?? "Next Year"}`,
                  value: formatPrice(headlines.nextYear?.eps),
                  hint: headlineHint(
                    headlines.nextYear?.epsFrom ?? null,
                    headlines.nextYear?.epsGrowth ?? null,
                    formatPrice,
                  ),
                  href: stockPath(ticker, "/earnings"),
                },
              ]}
            />
          </div>
        ) : null}
        <StatementTable
          rows={withStatementHrefs(
            period === "quarter" ? FORECAST_ROWS.filter((row) => row.key !== "forwardPe") : FORECAST_ROWS,
            ticker,
          )}
          columns={columns}
          currency={currency}
          inlineYoy={false}
          cornerLabel={period === "quarter" ? "Quarter" : "Fiscal Year"}
          downloadName={`${ticker}-forecast-${period}`}
          caption="Completed periods use reported financials. Columns marked Est. are FMP analyst consensus, not as-reported results. Gross profit, dividends, and free cash flow are shown for reported periods only."
        />
      </section>

      {ranges.length > 0 ? (
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <EstimateRangeTable title="Revenue" rows={ranges} field="revenue" format={money} />
          <EstimateRangeTable
            title="Revenue Growth"
            rows={ranges}
            field="revenueGrowth"
            format={(value) => formatPercentPlain(value)}
          />
          <EstimateRangeTable title="EPS" rows={ranges} field="eps" format={formatPrice} />
          <EstimateRangeTable
            title="EPS Growth"
            rows={ranges}
            field="epsGrowth"
            format={(value) => formatPercentPlain(value)}
          />
        </section>
      ) : null}

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
              {newsFeed.rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted">
                    No price-target articles available.
                  </td>
                </tr>
              ) : (
                newsFeed.rows.map((row, index) => (
                  <tr key={`${row.publishedDate}-${row.analystCompany}-${newsFeed.from + index}`}>
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
        <TablePager
          from={newsFeed.from}
          to={newsFeed.to}
          total={newsFeed.total}
          page={newsFeed.page}
          pageCount={newsFeed.pageCount}
          {...pagerLinks(forecastPath, newsFeed.page, newsFeed.pageCount, forecastExtra)}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Discounted Cash Flow</h2>
        <p className="mb-3 text-sm">
          <Link href={stockPath(ticker, "/fair-value")} className="text-link hover:underline">
            Full fair value
          </Link>
        </p>
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
