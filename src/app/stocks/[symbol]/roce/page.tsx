import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function RocePage({
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
      slug="roce"
      title={`${ticker} Return on Capital Employed`}
      description="Operating return on capital employed, from live FMP key metrics."
      field="returnOnCapitalEmployed"
      ttmField="returnOnCapitalEmployedTTM"
      valueLabel="ROCE"
      formula="ROCE = EBIT ÷ Capital Employed"
      format="percent"
      source="metrics"
    />
  );
}
