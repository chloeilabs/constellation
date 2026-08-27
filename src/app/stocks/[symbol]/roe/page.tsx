import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";

export default async function RoePage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam } = await searchParams;
  const ticker = symbol.toUpperCase();
  return (
    <RatioMetricPage
      symbol={ticker}
      period={periodFrom(periodParam)}
      slug="roe"
      title={`${ticker} Return on Equity`}
      description="Net income as a percentage of shareholders' equity."
      field="returnOnEquity"
      ttmField="returnOnEquityTTM"
      valueLabel="ROE"
      formula="ROE = Net Income ÷ Shareholders' Equity"
      format="percent"
      source="metrics"
    />
  );
}
