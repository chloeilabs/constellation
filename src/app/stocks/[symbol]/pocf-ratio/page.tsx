import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function PocfRatioPage({
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
      slug="pocf-ratio"
      title={`${ticker} Price to Operating Cash Flow`}
      description="Market capitalization divided by trailing operating cash flow. Fiscal history uses the last close on or before each period end."
      field="priceToOperatingCashFlowRatio"
      ttmField="priceToOperatingCashFlowRatioTTM"
      valueLabel="P/OCF"
      formula="P/OCF = Market Cap ÷ Operating Cash Flow"
      priceBased
    />
  );
}
