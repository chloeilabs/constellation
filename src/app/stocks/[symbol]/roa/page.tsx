import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function RoaPage({
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
      slug="roa"
      title={`${ticker} Return on Assets`}
      description="Net income as a percentage of average total assets from FMP filings."
      field="returnOnAssets"
      ttmField="returnOnAssetsTTM"
      valueLabel="ROA"
      formula="ROA = Net Income ÷ Average Total Assets"
      format="percent"
      priceBased
    />
  );
}
