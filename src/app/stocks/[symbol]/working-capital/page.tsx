import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function WorkingCapitalPage({
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
      slug="working-capital"
      title={`${ticker} Working Capital`}
      description="Current assets minus current liabilities from FMP key metrics."
      field="workingCapital"
      ttmField="workingCapitalTTM"
      valueLabel="Working Capital"
      formula="Working Capital = Current Assets − Current Liabilities"
      source="metrics"
      format="money"
    />
  );
}
