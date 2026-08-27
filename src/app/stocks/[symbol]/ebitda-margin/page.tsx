import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function EbitdaMarginPage({
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
      slug="ebitda-margin"
      title={`${ticker} EBITDA Margin`}
      description="EBITDA as a percentage of revenue."
      field="ebitdaMargin"
      ttmField="ebitdaMarginTTM"
      valueLabel="EBITDA Margin"
      formula="EBITDA Margin = EBITDA ÷ Revenue"
      format="percent"
    />
  );
}
