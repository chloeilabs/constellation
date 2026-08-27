import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function CashConversionCyclePage({
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
      slug="cash-conversion-cycle"
      title={`${ticker} Cash Conversion Cycle`}
      description="Days inventory outstanding plus days sales outstanding minus days payables outstanding, from FMP key metrics."
      field="cashConversionCycle"
      ttmField="cashConversionCycleTTM"
      valueLabel="Cash Conversion Cycle"
      formula="CCC = DIO + DSO − DPO"
      source="metrics"
      format="days"
    />
  );
}
