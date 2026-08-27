import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function ProfitMarginPage({
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
      slug="profit-margin"
      title={`${ticker} Profit Margin`}
      description="Net income as a percentage of revenue."
      field="netProfitMargin"
      ttmField="netProfitMarginTTM"
      valueLabel="Profit Margin"
      formula="Profit Margin = Net Income ÷ Revenue"
      format="percent"
    />
  );
}
