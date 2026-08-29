import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function RocePage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  return (
    <RatioMetricPage
      symbol={ticker}
      period={periodFrom(periodParam)}
      slug="roce"
      title={`${ticker} Return on Capital Employed`}
      description="EBIT divided by period-end capital employed (total assets − current liabilities) from FMP filings."
      field="returnOnCapitalEmployed"
      ttmField="returnOnCapitalEmployedTTM"
      valueLabel="ROCE"
      formula="ROCE = EBIT ÷ (Total Assets − Current Liabilities)"
      format="percent"
      priceBased
    />
  );
}
