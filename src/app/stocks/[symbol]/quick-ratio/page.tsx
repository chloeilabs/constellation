import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function QuickRatioPage({
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
      slug="quick-ratio"
      title={`${ticker} Quick Ratio`}
      description="Cash, short-term investments, and receivables versus current liabilities from FMP filings."
      field="quickRatio"
      ttmField="quickRatioTTM"
      valueLabel="Quick Ratio"
      formula="Quick Ratio = (Cash + Short-Term Investments + Receivables) ÷ Current Liabilities"
      priceBased
    />
  );
}
