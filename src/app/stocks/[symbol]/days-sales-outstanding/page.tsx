import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function DaysSalesOutstandingPage({
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
      slug="days-sales-outstanding"
      title={`${ticker} Days Sales Outstanding`}
      description="How many days it takes to collect receivables, from FMP key metrics."
      field="daysOfSalesOutstanding"
      ttmField="daysOfSalesOutstandingTTM"
      valueLabel="Days Sales Outstanding"
      formula="DSO = (Receivables ÷ Revenue) × 365"
      source="metrics"
      format="days"
    />
  );
}
