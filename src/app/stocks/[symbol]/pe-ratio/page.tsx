import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { formatPrice, formatRatio } from "@/lib/format";
import { getEstimates, getIncomeTtm, getQuote, getRatios, getRatiosTtm } from "@/lib/fmp";
import { forwardPe as forwardPeFromEstimates } from "@/lib/valuation";

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export default async function PeRatioPage({
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
  const [annual, quarterly, ttmRatios, ttmIncome, quote, estimates] = await Promise.all([
    getRatios(ticker, "annual", 20),
    getRatios(ticker, "quarter", 12),
    getRatiosTtm(ticker),
    getIncomeTtm(ticker),
    getQuote(ticker),
    getEstimates(ticker, "annual"),
  ]);
  const history = period === "quarter" ? quarterly : annual;
  const pe = num(ttmRatios?.priceToEarningsRatioTTM);
  const eps = ttmIncome?.epsDiluted ?? ttmIncome?.eps;
  const impliedPe = quote?.price && eps ? quote.price / eps : null;

  return (
    <Container>
      <PageHeader
        title={`${ticker} PE Ratio`}
        description="Price-to-earnings history from annual and quarterly ratio statements."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "PE Ratio (ttm)", value: formatRatio(pe ?? impliedPe) },
          { label: "Forward PE", value: formatRatio(forwardPeFromEstimates(quote?.price, estimates)) },
          { label: "Stock Price", value: `$${formatPrice(quote?.price)}` },
          { label: "EPS (ttm)", value: eps == null ? "—" : `$${formatPrice(eps)}` },
          { label: "P/S (ttm)", value: formatRatio(num(ttmRatios?.priceToSalesRatioTTM)) },
          { label: "P/B (ttm)", value: formatRatio(num(ttmRatios?.priceToBookRatioTTM)) },
          { label: "P/FCF (ttm)", value: formatRatio(num(ttmRatios?.priceToFreeCashFlowRatioTTM)) },
        ]}
      />
      <MetricHistory
        period={period}
        annualHref={`/stocks/${ticker}/pe-ratio`}
        quarterHref={`/stocks/${ticker}/pe-ratio?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} PE Ratio`}
        valueLabel="PE Ratio"
        formatValue={formatRatio}
        empty="No PE ratio history available."
        rows={history.map((row) => ({
          key: `${row.date}-${row.period}`,
          date: row.date,
          label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
          value: num(row.priceToEarningsRatio),
        }))}
      />
      <p className="mt-4 text-sm text-muted">
        PE is share price divided by trailing earnings per share.{" "}
        <span className="text-header">Formula: PE = Price ÷ EPS</span>
      </p>
    </Container>
  );
}
