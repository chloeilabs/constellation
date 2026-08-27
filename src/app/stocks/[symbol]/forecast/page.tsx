import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { MetricCards } from "@/components/metric-cards";
import { formatCompactUsd, formatDate, formatPrice } from "@/lib/format";
import { getCompanyEarnings, getDcf, getEstimates, getGrades, getGradesConsensus, getLeveredDcf, getPriceTarget, getQuote } from "@/lib/fmp";

export default async function ForecastPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = symbol.toUpperCase();
  const [quote, target, grades, history, estimates, earnings, dcf, levered] = await Promise.all([
    getQuote(ticker),
    getPriceTarget(ticker),
    getGradesConsensus(ticker),
    getGrades(ticker, 16),
    getEstimates(ticker, "annual"),
    getCompanyEarnings(ticker, 8),
    getDcf(ticker),
    getLeveredDcf(ticker),
  ]);

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
          <div className="mt-1 text-2xl font-semibold tabular">${formatPrice(target?.targetConsensus)}</div>
          <p className="mt-2 text-sm text-muted">
            High ${formatPrice(target?.targetHigh)} · Low ${formatPrice(target?.targetLow)} · Median $
            {formatPrice(target?.targetMedian)}
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Upside / Downside</div>
          <div className="mt-1 text-2xl font-semibold tabular">
            {upside == null ? "—" : `${upside > 0 ? "+" : ""}${upside.toFixed(2)}%`}
          </div>
          <p className="mt-2 text-sm text-muted">From last price ${formatPrice(quote?.price)}</p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Discounted Cash Flow</h2>
        <MetricCards
          items={[
            {
              label: "Unlevered DCF",
              value: dcf?.dcf != null ? `$${formatPrice(dcf.dcf)}` : "—",
              hint: dcfGap == null ? undefined : `${dcfGap > 0 ? "+" : ""}${dcfGap.toFixed(1)}% vs price`,
            },
            {
              label: "Levered DCF",
              value: levered?.dcf != null ? `$${formatPrice(levered.dcf)}` : "—",
              hint: leveredGap == null ? undefined : `${leveredGap > 0 ? "+" : ""}${leveredGap.toFixed(1)}% vs price`,
            },
            {
              label: "Last Price",
              value: `$${formatPrice(quote?.price ?? dcf?.stockPrice)}`,
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
                history.map((row, index) => (
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
        <h2 className="mb-3 text-lg font-semibold text-header">Annual Estimates</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Period</th>
                <th className="num">EPS Avg</th>
                <th className="num">Revenue Avg</th>
                <th className="num">Analysts</th>
              </tr>
            </thead>
            <tbody>
              {estimates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted">
                    No estimates available.
                  </td>
                </tr>
              ) : (
                estimates.map((row) => (
                  <tr key={row.date}>
                    <td>{formatDate(row.date)}</td>
                    <td className="num">{formatPrice(row.epsAvg)}</td>
                    <td className="num">{formatCompactUsd(row.revenueAvg)}</td>
                    <td className="num">{row.numAnalystsEps ?? row.numAnalystsRevenue ?? "—"}</td>
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
                  <td className="num">{formatCompactUsd(row.revenueEstimated)}</td>
                  <td className="num">{formatCompactUsd(row.revenueActual)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Container>
  );
}
