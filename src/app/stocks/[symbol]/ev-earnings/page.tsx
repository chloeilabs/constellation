import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function EvEarningsPage({
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
      slug="ev-earnings"
      title={`${ticker} EV / Earnings`}
      description="Enterprise value relative to net income, using period-end close and net cash from filings (cash includes marketable securities)."
      field="evToEarnings"
      ttmField="enterpriseValueTTM"
      valueLabel="EV / Earnings"
      formula="EV / Earnings = Enterprise Value ÷ Net Income"
      source="metrics"
      priceBased
    />
  );
}
