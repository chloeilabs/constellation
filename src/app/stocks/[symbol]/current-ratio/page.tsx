import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";

export default async function CurrentRatioPage({
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
      slug="current-ratio"
      title={`${ticker} Current Ratio`}
      description="Current assets divided by current liabilities."
      field="currentRatio"
      ttmField="currentRatioTTM"
      valueLabel="Current Ratio"
      formula="Current Ratio = Current Assets ÷ Current Liabilities"
    />
  );
}
