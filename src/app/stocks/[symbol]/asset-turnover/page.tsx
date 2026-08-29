import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function AssetTurnoverPage({
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
      slug="asset-turnover"
      title={`${ticker} Asset Turnover`}
      description="Trailing revenue divided by average total assets from FMP filings."
      field="assetTurnover"
      ttmField="assetTurnoverTTM"
      valueLabel="Asset Turnover"
      formula="Asset Turnover = Revenue ÷ Average Assets"
      priceBased
    />
  );
}
