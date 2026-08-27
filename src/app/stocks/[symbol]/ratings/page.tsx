import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { PriceTargetRange } from "@/components/price-target-range";
import { formatDate, formatMoney, reportingCurrency } from "@/lib/format";
import { getGrades, getGradesConsensus, getPriceTarget, getPriceTargetNews, getProfile, getQuote } from "@/lib/fmp";
import { enrichGradesWithTargets, gradeActionLabel } from "@/lib/grades";
import { decodeTicker, stockPath } from "@/lib/listings";

export default async function RatingsPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const [quote, profile, target, grades, history, targetNews] = await Promise.all([
    getQuote(ticker),
    getProfile(ticker),
    getPriceTarget(ticker),
    getGradesConsensus(ticker),
    getGrades(ticker, 40),
    getPriceTargetNews(ticker, 40),
  ]);
  const currency = reportingCurrency(profile?.currency);
  const px = (value: number | null | undefined) => formatMoney(value, currency);
  const upside =
    target?.targetConsensus != null && quote?.price
      ? ((target.targetConsensus - quote.price) / quote.price) * 100
      : null;
  const rows = enrichGradesWithTargets(history, targetNews);
  const last = quote?.price;

  return (
    <Container>
      <PageHeader
        title={`${ticker} Analyst Ratings`}
        description="Sell-side rating actions and price targets from live FMP grades. Not Stock Analysis Pro star rankings."
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
                  const vsPrice =
                    targetPrice != null && last
                      ? (targetPrice - last) / last
                      : null;
                  return (
                    <tr key={`${grade.date}-${grade.gradingCompany}-${index}`}>
                      <td>{news?.analystName || "—"}</td>
                      <td>{grade.gradingCompany || news?.analystCompany || "—"}</td>
                      <td className="font-medium">{grade.newGrade || "—"}</td>
                      <td>{gradeActionLabel(grade.action)}</td>
                      <td className="num">{targetPrice != null ? px(targetPrice) : "—"}</td>
                      <td className="num">
                        {vsPrice == null ? "—" : `${vsPrice > 0 ? "+" : ""}${(vsPrice * 100).toFixed(2)}%`}
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
