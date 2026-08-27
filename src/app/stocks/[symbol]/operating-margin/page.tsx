import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function OperatingMarginPage({
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
      slug="operating-margin"
      title={`${ticker} Operating Margin`}
      description="Operating income as a percentage of revenue."
      field="operatingProfitMargin"
      ttmField="operatingProfitMarginTTM"
      valueLabel="Operating Margin"
      formula="Operating Margin = Operating Income ÷ Revenue"
      format="percent"
    />
  );
}
