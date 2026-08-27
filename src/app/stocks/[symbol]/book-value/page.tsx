import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function BookValuePage({
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
      slug="book-value"
      title={`${ticker} Book Value Per Share`}
      description="Shareholders' equity per diluted share."
      field="bookValuePerShare"
      ttmField="bookValuePerShareTTM"
      valueLabel="Book Value / Share"
      formula="Book Value / Share = Shareholders' Equity ÷ Shares"
    />
  );
}
