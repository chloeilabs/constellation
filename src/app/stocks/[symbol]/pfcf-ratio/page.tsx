import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function PfcfRatioPage({
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
      slug="pfcf-ratio"
      title={`${ticker} Price to Free Cash Flow`}
      description="Market capitalization divided by trailing free cash flow."
      field="priceToFreeCashFlowRatio"
      ttmField="priceToFreeCashFlowRatioTTM"
      valueLabel="P/FCF"
      formula="P/FCF = Market Cap ÷ Free Cash Flow"
    />
  );
}
