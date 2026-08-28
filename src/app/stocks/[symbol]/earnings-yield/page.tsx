import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function EarningsYieldPage({
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
      slug="earnings-yield"
      title={`${ticker} Earnings Yield`}
      description="Trailing earnings as a percentage of price. Fiscal history uses the last close on or before each period end."
      field="earningsYield"
      ttmField="earningsYieldTTM"
      valueLabel="Earnings Yield"
      formula="Earnings Yield = EPS ÷ Price"
      format="percent"
      priceBased
    />
  );
}
