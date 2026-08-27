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

export default async function EvEarningsPage({
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
  const incomeByDate = new Map(income.map((row) => [row.date, num(row.netIncome)]));
  const ttmValue = ratio(num(metrics?.enterpriseValueTTM) ?? num(evRows[0]?.enterpriseValue), num(ttm?.netIncome));

  return (
    <Container>
      <PageHeader
        title={`${ticker} EV / Earnings`}
        description="Enterprise value divided by net income from live FMP enterprise values and income statements."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards items={[{ label: "EV / Earnings (ttm)", value: formatRatio(ttmValue) }]} />
      <MetricHistory
        period={period}
        annualHref={`/stocks/${ticker}/ev-earnings`}
        quarterHref={`/stocks/${ticker}/ev-earnings?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} EV / Earnings`}
        valueLabel="EV / Earnings"
        formatValue={formatRatio}
        empty="No EV / Earnings history available."
        rows={evRows.map((row) => ({
          key: row.date,
          date: row.date,
          label: row.date.slice(0, period === "quarter" ? 7 : 4),
          value: ratio(num(row.enterpriseValue), incomeByDate.get(row.date) ?? null),
        }))}
      />
      <p className="mt-4 text-sm text-muted">EV / Earnings = Enterprise Value ÷ Net Income</p>
    </Container>
  );
}
