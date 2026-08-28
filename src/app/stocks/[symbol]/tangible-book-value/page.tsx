import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function TangibleBookPage({
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
      slug="tangible-book-value"
      title={`${ticker} Tangible Book Value Per Share`}
      description="Equity minus intangibles, per diluted share."
      field="tangibleBookValuePerShare"
      ttmField="tangibleBookValuePerShareTTM"
      valueLabel="Tangible Book / Share"
      formula="Tangible Book / Share = (Equity − Intangibles) ÷ Shares"
      priceBased
    />
  );
}
