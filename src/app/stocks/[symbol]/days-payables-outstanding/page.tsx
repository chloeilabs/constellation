import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function DaysPayablesOutstandingPage({
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
      slug="days-payables-outstanding"
      title={`${ticker} Days Payables Outstanding`}
      description="How many days the company takes to pay suppliers, from FMP filings."
      field="daysOfPayablesOutstanding"
      ttmField="daysOfPayablesOutstandingTTM"
      valueLabel="Days Payables Outstanding"
      formula="DPO = (Average Payables ÷ Cost of Revenue) × 365"
      format="days"
      priceBased
    />
  );
}
