import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function PsRatioPage({
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
      slug="ps-ratio"
      title={`${ticker} Price-to-Sales Ratio`}
      description="Share price divided by trailing revenue per share."
      field="priceToSalesRatio"
      ttmField="priceToSalesRatioTTM"
      valueLabel="PS Ratio"
      formula="PS = Market Cap ÷ Revenue (ttm)"
    />
  );
}
