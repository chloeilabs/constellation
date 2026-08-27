import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";

export default async function PbRatioPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam } = await searchParams;
  const ticker = symbol.toUpperCase();
  return (
    <RatioMetricPage
      symbol={ticker}
      period={periodFrom(periodParam)}
      slug="pb-ratio"
      title={`${ticker} Price-to-Book Ratio`}
      description="Share price divided by book value per share."
      field="priceToBookRatio"
      ttmField="priceToBookRatioTTM"
      valueLabel="PB Ratio"
      formula="PB = Market Cap ÷ Shareholders' Equity"
    />
  );
}
