import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { ChangePercent } from "@/components/change";
import { compactMoneyFn, reportingCurrency, yearOverYear } from "@/lib/format";
import { getCashFlows, getCashFlowTtm } from "@/lib/fmp";
import { decodeTicker } from "@/lib/listings";
import { ANNUAL_FILING_LIMIT, QUARTER_FILING_LIMIT } from "@/lib/statements";

export default async function CapexPage({
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
  const [annual, quarterly, ttm] = await Promise.all([
    getCashFlows(ticker, "annual", ANNUAL_FILING_LIMIT),
    getCashFlows(ticker, "quarter", QUARTER_FILING_LIMIT),
    getCashFlowTtm(ticker),
  ]);
  const history = period === "quarter" ? quarterly : annual;
  const growth = yearOverYear(annual[0]?.capitalExpenditure, annual[1]?.capitalExpenditure);
  const money = compactMoneyFn(reportingCurrency(ttm?.reportedCurrency, annual[0]?.reportedCurrency));

  return (
    <Container>
      <PageHeader
        title={`${ticker} Capital Expenditures`}
        description="Cash spent on property, plant, and equipment from the cash flow statement."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "Capex (ttm)", value: money(ttm?.capitalExpenditure) },
          {
            label: "FY Growth",
            value: growth == null ? "—" : <ChangePercent value={growth} alreadyPercent={false} className="text-2xl" />,
          },
        ]}
      />
      <MetricHistory
        period={period}
        annualHref={`/stocks/${ticker}/capex`}
        quarterHref={`/stocks/${ticker}/capex?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} Capital Expenditures`}
        valueLabel="Capex"
        formatValue={money}
        empty="No capital expenditure history available."
        rows={history.map((row) => ({
          key: `${row.date}-${row.period}`,
          date: row.date,
          label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
          value: row.capitalExpenditure,
        }))}
      />
    </Container>
  );
}
