import { Container } from "@/components/container";
import { PageHeader, PeriodToggle } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { HistoryBars, SegmentBars } from "@/components/history-bars";
import { ChangePercent } from "@/components/change";
import { compactMoneyFn, formatDate, formatInteger, reportingCurrency, yearOverYear } from "@/lib/format";
import {
  getHistoricalEmployeeCount,
  getIncomeStatements,
  getIncomeTtm,
  getRatiosTtm,
  getRevenueGeographicSegments,
  getRevenueProductSegments,
} from "@/lib/fmp";

function segmentItems(data: Record<string, number> | undefined) {
  if (!data) return [];
  return Object.entries(data)
    .filter(([, value]) => typeof value === "number" && Number.isFinite(value))
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export default async function RevenuePage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam } = await searchParams;
  const ticker = symbol.toUpperCase();
  const period = periodParam === "quarter" ? "quarter" : "annual";
  const [annual, quarterly, ttm, ratios, employees, products, geos] = await Promise.all([
    getIncomeStatements(ticker, "annual", 20),
    getIncomeStatements(ticker, "quarter", 8),
    getIncomeTtm(ticker),
    getRatiosTtm(ticker),
    getHistoricalEmployeeCount(ticker, 5),
    getRevenueProductSegments(ticker, "annual"),
    getRevenueGeographicSegments(ticker, "annual"),
  ]);
  const history = period === "quarter" ? quarterly : annual;
  const latestAnnual = annual[0];
  const priorAnnual = annual[1];
  const growth = yearOverYear(latestAnnual?.revenue, priorAnnual?.revenue);
  const currency = reportingCurrency(ttm?.reportedCurrency, latestAnnual?.reportedCurrency);
  const money = compactMoneyFn(currency);
  const headcount = employees[0]?.employeeCount;
  const revenuePerEmployee =
    ttm?.revenue && headcount ? ttm.revenue / headcount : latestAnnual?.revenue && headcount ? latestAnnual.revenue / headcount : null;
  const productLatest = products[0];
  const geoLatest = geos[0];
  const chartItems = [...history].reverse().map((row) => ({
    label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
    value: row.revenue,
  }));

  return (
    <Container>
      <PageHeader
        title={`${ticker} Revenue`}
        description="Sales history plus product and geographic breakdowns from company filings."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <div className="mb-6">
        <PeriodToggle
          period={period}
          annualHref={`/stocks/${ticker}/revenue`}
          quarterHref={`/stocks/${ticker}/revenue?period=quarter`}
        />
      </div>
      <MetricCards
        items={[
          { label: "Revenue (ttm)", value: money(ttm?.revenue) },
          { label: "Net Income (ttm)", value: money(ttm?.netIncome) },
          {
            label: "FY Growth",
            value: growth == null ? "—" : <ChangePercent value={growth} alreadyPercent={false} className="text-2xl" />,
          },
          {
            label: "P/S Ratio",
            value: typeof ratios?.priceToSalesRatioTTM === "number" ? ratios.priceToSalesRatioTTM.toFixed(2) : "—",
          },
          { label: "Revenue / Employee", value: revenuePerEmployee ? money(revenuePerEmployee) : "—" },
          { label: "Employees", value: formatInteger(headcount) },
        ]}
      />
      {chartItems.length > 1 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-header">Revenue Chart</h2>
          <HistoryBars items={chartItems} formatValue={money} />
        </section>
      ) : null}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">{period === "quarter" ? "Quarterly" : "Annual"} Revenue</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Period</th>
                <th className="num">Revenue</th>
                <th className="num">Change</th>
                <th className="num">Growth</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted">
                    No revenue history available.
                  </td>
                </tr>
              ) : (
                history.map((row, index) => {
                  const prior = history[index + 1];
                  const change = prior ? row.revenue - prior.revenue : null;
                  const yoy = yearOverYear(row.revenue, prior?.revenue);
                  return (
                    <tr key={`${row.date}-${row.period}`}>
                      <td>{formatDate(row.date)}</td>
                      <td className="num">{money(row.revenue)}</td>
                      <td className="num">{money(change)}</td>
                      <td className="num">
                        <ChangePercent value={yoy} alreadyPercent={false} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-header">
            Product Revenue{productLatest ? ` · FY${productLatest.fiscalYear}` : ""}
          </h2>
          {segmentItems(productLatest?.data).length ? (
            <SegmentBars items={segmentItems(productLatest?.data)} />
          ) : (
            <p className="text-sm text-muted">Product segmentation is not available for this company.</p>
          )}
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold text-header">
            Geographic Revenue{geoLatest ? ` · FY${geoLatest.fiscalYear}` : ""}
          </h2>
          {segmentItems(geoLatest?.data).length ? (
            <SegmentBars items={segmentItems(geoLatest?.data)} />
          ) : (
            <p className="text-sm text-muted">Geographic segmentation is not available for this company.</p>
          )}
        </section>
      </div>
    </Container>
  );
}
