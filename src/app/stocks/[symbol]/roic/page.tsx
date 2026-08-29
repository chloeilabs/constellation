import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function RoicPage({
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
      slug="roic"
      title={`${ticker} Return on Invested Capital`}
      description="NOPAT divided by average invested capital (equity + debt − cash and short-term investments) from FMP filings."
      field="returnOnInvestedCapital"
      ttmField="returnOnInvestedCapitalTTM"
      valueLabel="ROIC"
      formula="ROIC = NOPAT ÷ Average Invested Capital"
      format="percent"
      priceBased
    />
  );
}
