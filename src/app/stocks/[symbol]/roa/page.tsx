import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";

export default async function RoaPage({
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
      slug="roa"
      title={`${ticker} Return on Assets`}
      description="Net income as a percentage of total assets."
      field="returnOnAssets"
      ttmField="returnOnAssetsTTM"
      valueLabel="ROA"
      formula="ROA = Net Income ÷ Total Assets"
      format="percent"
      source="metrics"
    />
  );
}
