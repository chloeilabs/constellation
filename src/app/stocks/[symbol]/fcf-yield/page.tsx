import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { formatPercentPlain } from "@/lib/format";
import { getCashFlowTtm, getKeyMetrics, getKeyMetricsTtm, getQuote } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";
import { periodFrom } from "@/components/ratio-metric-page";

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export default async function FcfYieldPage({
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
  const path = stockPath(ticker, "/fcf-yield");
  const [annual, quarterly, ttmMetrics, ttmCash, quote] = await Promise.all([
    getKeyMetrics(ticker, "annual", 20),
    getKeyMetrics(ticker, "quarter", 12),
    getKeyMetricsTtm(ticker),
    getCashFlowTtm(ticker),
    getQuote(ticker),
  ]);
  const history = period === "quarter" ? quarterly : annual;
  const marketCap = num(quote?.marketCap);
  const ttmYield =
    num(ttmCash?.freeCashFlow) != null && marketCap && marketCap > 0
      ? ttmCash!.freeCashFlow / marketCap
      : num(ttmMetrics?.freeCashFlowYieldTTM);

  return (
    <Container>
      <PageHeader
        title={`${ticker} FCF Yield`}
        description="Trailing free cash flow as a percentage of market capitalization."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards items={[{ label: "FCF Yield (ttm)", value: formatPercentPlain(ttmYield) }]} />
      <MetricHistory
        period={period}
        annualHref={path}
        quarterHref={`${path}?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} FCF Yield`}
        valueLabel="FCF Yield"
        formatValue={formatPercentPlain}
        empty="No free-cash-flow yield history available."
        rows={history.map((row) => ({
          key: `${row.date}-${row.period}`,
          date: row.date,
          label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
          value: num(row.freeCashFlowYield),
        }))}
      />
      <p className="mt-4 text-sm text-muted">FCF Yield = Free Cash Flow ÷ Market Cap</p>
    </Container>
  );
}
