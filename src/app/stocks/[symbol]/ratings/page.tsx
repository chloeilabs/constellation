import Link from "next/link";
import { Container } from "@/components/container";
import { MetricCards } from "@/components/metric-cards";
import { PageHeader } from "@/components/page-header";
import { PriceTargetRange } from "@/components/price-target-range";
import { RecommendationMix, RecommendationTrendTable } from "@/components/recommendation-trends";
import { ChangePercent } from "@/components/change";
import { formatDate, formatMoney, formatPercentPlain, reportingCurrency } from "@/lib/format";
import {
  getGrades,
  getGradesConsensus,
  getGradesHistorical,
  getPriceTarget,
  getPriceTargetNews,
  getPriceTargetSummary,
  getProfile,
  getQuote,
} from "@/lib/fmp";
import { consensusAnalystCount, consensusMeaning, recommendationTrend } from "@/lib/forecast";
import { enrichGradesWithTargets, gradeActionLabel } from "@/lib/grades";
import { decodeTicker, displayCompanyName, stockPath } from "@/lib/listings";

export default async function RatingsPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const [quote, profile, target, grades, history, targetNews, gradeTrend, targetSummary] = await Promise.all([
    getQuote(ticker),
    getProfile(ticker),
    getPriceTarget(ticker),
    getGradesConsensus(ticker),
    getGrades(ticker, 40),
    getPriceTargetNews(ticker, 40),
    getGradesHistorical(ticker, 12),
    getPriceTargetSummary(ticker),
  ]);
  const currency = reportingCurrency(profile?.currency);
  const px = (value: number | null | undefined) => formatMoney(value, currency);
  const shortName = displayCompanyName(profile?.companyName) || ticker;
  const analysts = consensusAnalystCount(grades);
  const meaning = consensusMeaning(grades?.consensus);
  const trend = recommendationTrend(gradeTrend, 6);
  const upside =
    target?.targetConsensus != null && quote?.price
      ? ((target.targetConsensus - quote.price) / quote.price) * 100
      : null;
  const lowPct =
    target && quote?.price ? ((target.targetLow - quote.price) / quote.price) * 100 : null;
  const highPct =
    target && quote?.price ? ((target.targetHigh - quote.price) / quote.price) * 100 : null;
  const intro =
    analysts && target && quote?.price
      ? `According to ${analysts} analysts in FMP consensus data, ${shortName} stock has a consensus rating of "${grades?.consensus ?? "—"}" and an average price target of ${px(target.targetConsensus)}. The average 1-year stock price forecast is ${formatPercentPlain(Math.abs(upside ?? 0), { alreadyPercent: true })} ${upside != null && upside >= 0 ? "higher" : "lower"} than the current stock price, while the lowest is ${px(target.targetLow)}${lowPct == null ? "" : ` (${formatPercentPlain(lowPct, { alreadyPercent: true })})`} and the highest is ${px(target.targetHigh)}${highPct == null ? "" : ` (${formatPercentPlain(highPct, { alreadyPercent: true })})`}.`
      : "Sell-side rating actions and price targets from live FMP grades. Not Stock Analysis Pro star rankings.";
  const rows = enrichGradesWithTargets(history, targetNews);
  const last = quote?.price;

  return (
    <Container>
      <PageHeader
        title={`${shortName} Analyst Ratings`}
        description={intro}
        actions={
          <Link
            href={stockPath(ticker, "/forecast")}
            className="inline-flex items-center rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium hover:bg-muted-bg"
          >
            Estimates & Forecast
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
            {upside == null ? "—" : <ChangePercent value={upside} alreadyPercent />}
          </div>
          <p className="mt-2 text-sm text-muted">From last price {px(last)}</p>
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
        <h2 className="mb-3 text-lg font-semibold text-header">Ratings History</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Analyst</th>
                <th>Firm</th>
                <th>Rating</th>
                <th>Action</th>
                <th className="num">Price Target</th>
                <th className="num">Upside</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-muted">
                    No analyst rating actions available.
                  </td>
                </tr>
              ) : (
                rows.map(({ grade, news }, index) => {
                  const targetPrice = news?.adjPriceTarget ?? news?.priceTarget ?? null;
                  const vsPrice = targetPrice != null && last ? (targetPrice - last) / last : null;
                  return (
                    <tr key={`${grade.date}-${grade.gradingCompany}-${index}`}>
                      <td>{news?.analystName || "—"}</td>
                      <td>{grade.gradingCompany || news?.analystCompany || "—"}</td>
                      <td className="font-medium">{grade.newGrade || "—"}</td>
                      <td>{gradeActionLabel(grade.action)}</td>
                      <td className="num">{targetPrice != null ? px(targetPrice) : "—"}</td>
                      <td className="num">
                        {vsPrice == null ? "—" : <ChangePercent value={vsPrice} alreadyPercent={false} />}
                      </td>
                      <td>{formatDate(grade.date)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </Container>
  );
}
