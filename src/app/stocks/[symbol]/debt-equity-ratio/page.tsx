import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function DebtEquityPage({
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
      slug="debt-equity-ratio"
      title={`${ticker} Debt / Equity`}
      description="Total debt as a multiple of shareholders' equity."
      field="debtToEquityRatio"
      ttmField="debtToEquityRatioTTM"
      valueLabel="Debt / Equity"
      formula="Debt / Equity = Total Debt ÷ Shareholders' Equity"
    />
  );
}
