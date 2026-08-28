import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { formatPercentPlain } from "@/lib/format";
import { getIncomeTtm, getKeyMetrics, getKeyMetricsTtm, getQuote } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";
import { periodFrom } from "@/components/ratio-metric-page";
import { trailingPe } from "@/lib/valuation";

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export default async function EarningsYieldPage({
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
  const path = stockPath(ticker, "/earnings-yield");
  const [annual, quarterly, ttmMetrics, ttmIncome, quote] = await Promise.all([
    getKeyMetrics(ticker, "annual", 20),
    getKeyMetrics(ticker, "quarter", 12),
    getKeyMetricsTtm(ticker),
    getIncomeTtm(ticker),
    getQuote(ticker),
  ]);
  const history = period === "quarter" ? quarterly : annual;
  const pe = trailingPe(quote?.price, ttmIncome?.epsDiluted ?? ttmIncome?.eps);
  const ttmYield = pe != null && pe > 0 ? 1 / pe : num(ttmMetrics?.earningsYieldTTM);

  return (
    <Container>
      <PageHeader
        title={`${ticker} Earnings Yield`}
        description="Trailing earnings as a percentage of market value, the inverse of the PE ratio."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards items={[{ label: "Earnings Yield (ttm)", value: formatPercentPlain(ttmYield) }]} />
      <MetricHistory
        period={period}
        annualHref={path}
        quarterHref={`${path}?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} Earnings Yield`}
        valueLabel="Earnings Yield"
        formatValue={formatPercentPlain}
        empty="No earnings-yield history available."
        rows={history.map((row) => ({
          key: `${row.date}-${row.period}`,
          date: row.date,
          label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
          value: num(row.earningsYield),
        }))}
      />
      <p className="mt-4 text-sm text-muted">Earnings Yield = EPS ÷ Price (also 1 ÷ PE)</p>
    </Container>
  );
}
