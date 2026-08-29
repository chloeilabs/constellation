import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function RoePage({
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
      slug="roe"
      title={`${ticker} Return on Equity`}
      description="Net income as a percentage of average shareholders' equity from FMP filings."
      field="returnOnEquity"
      ttmField="returnOnEquityTTM"
      valueLabel="ROE"
      formula="ROE = Net Income ÷ Average Shareholders' Equity"
      format="percent"
      priceBased
    />
  );
}
