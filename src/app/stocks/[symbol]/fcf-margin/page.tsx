import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { formatPercentPlain } from "@/lib/format";
import { getCashFlows, getCashFlowTtm, getIncomeStatements, getIncomeTtm } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";
import { periodFrom } from "@/components/ratio-metric-page";
import { ANNUAL_FILING_LIMIT, QUARTER_FILING_LIMIT } from "@/lib/statements";

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function margin(fcf: number | null, revenue: number | null) {
  if (fcf == null || revenue == null || revenue === 0) return null;
  return fcf / revenue;
}

export default async function FcfMarginPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const period = periodFrom(periodParam);
  const path = stockPath(ticker, "/fcf-margin");
  const [annualCash, quarterCash, ttmCash, annualIncome, quarterIncome, ttmIncome] = await Promise.all([
    getCashFlows(ticker, "annual", ANNUAL_FILING_LIMIT),
    getCashFlows(ticker, "quarter", QUARTER_FILING_LIMIT),
    getCashFlowTtm(ticker),
    getIncomeStatements(ticker, "annual", ANNUAL_FILING_LIMIT),
    getIncomeStatements(ticker, "quarter", QUARTER_FILING_LIMIT),
    getIncomeTtm(ticker),
  ]);
  const cash = period === "quarter" ? quarterCash : annualCash;
  const income = period === "quarter" ? quarterIncome : annualIncome;
  const revenueByDate = new Map(income.map((row) => [row.date, num(row.revenue)]));
  const ttmMargin = margin(num(ttmCash?.freeCashFlow), num(ttmIncome?.revenue));

  return (
    <Container>
      <PageHeader
        title={`${ticker} FCF Margin`}
        description="Free cash flow as a percentage of revenue, from live FMP cash-flow and income statements."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards items={[{ label: "FCF Margin (ttm)", value: formatPercentPlain(ttmMargin) }]} />
      <MetricHistory
        period={period}
        annualHref={path}
        quarterHref={`${path}?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} FCF Margin`}
        valueLabel="FCF Margin"
        formatValue={formatPercentPlain}
        empty="No free-cash-flow margin history available."
        rows={cash.map((row) => ({
          key: `${row.date}-${row.period}`,
          date: row.date,
          label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
          value: margin(num(row.freeCashFlow), revenueByDate.get(row.date) ?? null),
        }))}
      />
      <p className="mt-4 text-sm text-muted">FCF Margin = Free Cash Flow ÷ Revenue</p>
    </Container>
  );
}
