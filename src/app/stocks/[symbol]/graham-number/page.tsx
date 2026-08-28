import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function GrahamNumberPage({
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
      slug="graham-number"
      title={`${ticker} Graham Number`}
      description="Benjamin Graham's number from diluted EPS and book value per share: the square root of 22.5 × EPS × book value per share."
      field="grahamNumber"
      valueLabel="Graham Number"
      formula="Graham Number = √(22.5 × EPS × Book Value / Share)"
      priceBased
    />
  );
}
