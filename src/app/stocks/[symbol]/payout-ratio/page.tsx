import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function PayoutRatioPage({
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
      slug="payout-ratio"
      title={`${ticker} Payout Ratio`}
      description="Dividends as a share of earnings, from live FMP ratio statements."
      field="dividendPayoutRatio"
      ttmField="dividendPayoutRatioTTM"
      valueLabel="Payout Ratio"
      formula="Payout Ratio = Dividends ÷ Net Income"
      format="percent"
    />
  );
}
