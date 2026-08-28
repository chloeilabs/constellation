import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function AltmanZScorePage({
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
      slug="altman-z-score"
      title={`${ticker} Altman Z-Score`}
      description="Original Altman Z-Score from filings and the period-end (or live) market cap. Working capital, retained earnings, EBIT, and sales are scaled by total assets; market cap is scaled by total liabilities."
      field="altmanZScore"
      valueLabel="Altman Z-Score"
      formula="Z = 1.2A + 1.4B + 3.3C + 0.6D + 1.0E"
      priceBased
    />
  );
}
