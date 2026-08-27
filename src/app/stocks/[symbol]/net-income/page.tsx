import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { ChangePercent } from "@/components/change";
import { compactMoneyFn, reportingCurrency, yearOverYear } from "@/lib/format";
import { getIncomeStatements, getIncomeTtm, getRatiosTtm } from "@/lib/fmp";

export default async function NetIncomePage({
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
  const [annual, quarterly, ttm, ratios] = await Promise.all([
    getIncomeStatements(ticker, "annual", 20),
    getIncomeStatements(ticker, "quarter", 12),
    getIncomeTtm(ticker),
    getRatiosTtm(ticker),
  ]);
  const history = period === "quarter" ? quarterly : annual;
  const growth = yearOverYear(annual[0]?.netIncome, annual[1]?.netIncome);
  const margin = ttm?.revenue ? ttm.netIncome / ttm.revenue : null;
  const money = compactMoneyFn(reportingCurrency(ttm?.reportedCurrency, annual[0]?.reportedCurrency));

  return (
    <Container>
      <PageHeader
        title={`${ticker} Net Income`}
        description="Reported profit history from company income statements."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "Net Income (ttm)", value: money(ttm?.netIncome) },
          {
            label: "FY Growth",
            value: growth == null ? "—" : <ChangePercent value={growth} alreadyPercent={false} className="text-2xl" />,
          },
          {
            label: "Profit Margin",
            value: margin == null ? "—" : `${(margin * 100).toFixed(2)}%`,
          },
          {
            label: "P/E (ttm)",
            value: typeof ratios?.priceToEarningsRatioTTM === "number" ? ratios.priceToEarningsRatioTTM.toFixed(2) : "—",
          },
        ]}
      />
      <MetricHistory
        period={period}
        annualHref={`/stocks/${ticker}/net-income`}
        quarterHref={`/stocks/${ticker}/net-income?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} Net Income`}
        valueLabel="Net Income"
        formatValue={money}
        empty="No net income history available."
        rows={history.map((row) => ({
          key: `${row.date}-${row.period}`,
          date: row.date,
          label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
          value: row.netIncome,
        }))}
      />
    </Container>
  );
}
