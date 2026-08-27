import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { formatRatio } from "@/lib/format";
import { getEnterpriseValues, getIncomeStatements, getIncomeTtm, getKeyMetricsTtm } from "@/lib/fmp";
import { decodeTicker } from "@/lib/listings";
import { periodFrom } from "@/components/statement-metric-page";

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function ratio(numerator: number | null, denominator: number | null) {
  if (numerator == null || denominator == null || denominator === 0) return null;
  return numerator / denominator;
}

export default async function EvEbitPage({
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
  const [evRows, income, ttm, metrics] = await Promise.all([
    getEnterpriseValues(ticker, period, 20),
    getIncomeStatements(ticker, period, 20),
    getIncomeTtm(ticker),
    getKeyMetricsTtm(ticker),
  ]);
  const ebitByDate = new Map(income.map((row) => [row.date, num(row.ebit ?? row.operatingIncome)]));
  const ttmValue = ratio(num(metrics?.enterpriseValueTTM) ?? num(evRows[0]?.enterpriseValue), num(ttm?.ebit ?? ttm?.operatingIncome));

  return (
    <Container>
      <PageHeader
        title={`${ticker} EV / EBIT`}
        description="Enterprise value divided by EBIT from live FMP enterprise values and income statements."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards items={[{ label: "EV / EBIT (ttm)", value: formatRatio(ttmValue) }]} />
      <MetricHistory
        period={period}
        annualHref={`/stocks/${ticker}/ev-ebit`}
        quarterHref={`/stocks/${ticker}/ev-ebit?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} EV / EBIT`}
        valueLabel="EV / EBIT"
        formatValue={formatRatio}
        empty="No EV / EBIT history available."
        rows={evRows.map((row) => ({
          key: row.date,
          date: row.date,
          label: row.date.slice(0, period === "quarter" ? 7 : 4),
          value: ratio(num(row.enterpriseValue), ebitByDate.get(row.date) ?? null),
        }))}
      />
      <p className="mt-4 text-sm text-muted">EV / EBIT = Enterprise Value ÷ EBIT</p>
    </Container>
  );
}
