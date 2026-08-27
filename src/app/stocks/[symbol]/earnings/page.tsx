import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { ChangePercent } from "@/components/change";
import { compactMoneyFn, formatDate, formatMoney, reportingCurrency, yearOverYear } from "@/lib/format";
import { getCompanyEarnings, getIncomeStatements, getIncomeTtm } from "@/lib/fmp";
import { decodeTicker } from "@/lib/listings";
import { ttmChange } from "@/lib/statements";
import { earningsSurprise, splitCompanyEarnings } from "@/lib/earnings";

export default async function EarningsPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const period = periodParam === "quarter" ? "quarter" : "annual";
  const [annual, quarterly, ttm, reported] = await Promise.all([
    getIncomeStatements(ticker, "annual", 20),
    getIncomeStatements(ticker, "quarter", 12),
    getIncomeTtm(ticker),
    getCompanyEarnings(ticker, 16),
  ]);
  const history = period === "quarter" ? quarterly : annual;
  const eps = ttm?.epsDiluted ?? ttm?.eps;
  const fyGrowth = yearOverYear(annual[0]?.epsDiluted ?? annual[0]?.eps, annual[1]?.epsDiluted ?? annual[1]?.eps);
  const ttmGrowth = ttmChange(quarterly as Array<Record<string, unknown>>, "epsDiluted") ?? ttmChange(quarterly as Array<Record<string, unknown>>, "eps");
  const { lastReported, next } = splitCompanyEarnings(reported);
  const latestReport = lastReported ?? reported[0];
  const surprise = earningsSurprise(latestReport);
  const currency = reportingCurrency(ttm?.reportedCurrency, annual[0]?.reportedCurrency);
  const money = compactMoneyFn(currency);
  const px = (value: number | null | undefined) => formatMoney(value, currency);

  return (
    <Container>
      <PageHeader
        title={`${ticker} EPS & Earnings`}
        description="Diluted earnings per share from filings, plus reported results versus analyst estimates."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "EPS (ttm)", value: eps == null ? "—" : px(eps) },
          {
            label: "TTM Growth",
            value: ttmGrowth == null ? "—" : <ChangePercent value={ttmGrowth} alreadyPercent={false} className="text-2xl" />,
          },
          {
            label: "FY Growth",
            value: fyGrowth == null ? "—" : <ChangePercent value={fyGrowth} alreadyPercent={false} className="text-2xl" />,
          },
          {
            label: "Latest EPS",
            value: latestReport?.epsActual == null ? "—" : px(latestReport.epsActual),
            hint: latestReport ? formatDate(latestReport.date) : undefined,
          },
          {
            label: "Surprise",
            value: surprise == null ? "—" : <ChangePercent value={surprise} alreadyPercent={false} className="text-2xl" />,
          },
          {
            label: "Next Earnings",
            value: next && next.date !== latestReport?.date ? formatDate(next.date) : "—",
            hint: next?.epsEstimated != null ? `Est. ${px(next.epsEstimated)}` : undefined,
          },
        ]}
      />
      <MetricHistory
        period={period}
        annualHref={`/stocks/${ticker}/earnings`}
        quarterHref={`/stocks/${ticker}/earnings?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} EPS`}
        valueLabel="EPS"
        formatValue={(value) => (value == null ? "—" : px(value))}
        empty="No EPS history available."
        rows={history.map((row) => ({
          key: `${row.date}-${row.period}`,
          date: row.date,
          label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
          value: row.epsDiluted ?? row.eps,
        }))}
      />
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Earnings Surprises</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th className="num">EPS Actual</th>
                <th className="num">EPS Estimate</th>
                <th className="num">Surprise</th>
                <th className="num">Revenue</th>
                <th className="num">Rev. Estimate</th>
              </tr>
            </thead>
            <tbody>
              {reported.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted">
                    No reported earnings available.
                  </td>
                </tr>
              ) : (
                reported.map((row) => {
                  const epsSurprise = earningsSurprise(row);
                  return (
                    <tr key={row.date}>
                      <td>{formatDate(row.date)}</td>
                      <td className="num">{row.epsActual == null ? "—" : px(row.epsActual)}</td>
                      <td className="num">{row.epsEstimated == null ? "—" : px(row.epsEstimated)}</td>
                      <td className="num">
                        <ChangePercent value={epsSurprise} alreadyPercent={false} />
                      </td>
                      <td className="num">{money(row.revenueActual)}</td>
                      <td className="num">{money(row.revenueEstimated)}</td>
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
