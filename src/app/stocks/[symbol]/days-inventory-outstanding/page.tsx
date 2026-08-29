import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function DaysInventoryOutstandingPage({
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
      slug="days-inventory-outstanding"
      title={`${ticker} Days Inventory Outstanding`}
      description="How many days inventory sits before sale, from FMP filings."
      field="daysOfInventoryOutstanding"
      ttmField="daysOfInventoryOutstandingTTM"
      valueLabel="Days Inventory Outstanding"
      formula="DIO = (Average Inventory ÷ Cost of Revenue) × 365"
      format="days"
      priceBased
    />
  );
}
